"""
Vercel Serverless Function: Hybrid Property Recommendation API
Adapted from smart_home_hybrid_vc_demo.py to work with Supabase data
"""

from http.server import BaseHTTPRequestHandler
import json
import math
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import numpy as np
import pandas as pd
from openai import OpenAI
import requests

# Supabase connection
try:
    from supabase import create_client, Client
except ImportError:
    # For local development without supabase-py
    Client = None

# Initialize clients
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if Client and supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)


# ------------------- Utility Functions -------------------
def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles using Haversine formula"""
    R = 3958.7613  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))


def kw_in(text: str, *words) -> bool:
    """Check if any of the keywords exist in text (case-insensitive)"""
    t = (text or "").lower()
    return any(w in t for w in words)


# ------------------- Google Places API Integration -------------------
PLACES_TYPES = {
    "school": {"includedTypes": ["school"], "radius_miles": 2.0},
    "supermarket": {"includedTypes": ["supermarket", "grocery_store"], "radius_miles": 2.0},
    "park": {"includedTypes": ["park"], "radius_miles": 1.2},
    "transit": {"includedTypes": ["transit_station", "subway_station", "train_station"], "radius_miles": 1.0},
}


# ------------------- PIM Service Integration -------------------
PIM_SERVICE_URL = os.environ.get("PIM_SERVICE_URL", "https://pim-service-646197723218.us-central1.run.app")
PIM_TIMEOUT = 10
PIM_ENABLED = os.environ.get("PIM_ENABLED", "true").lower() == "true"
PIM_SUPPORTED_CITIES = {"San Francisco", "san francisco", "SF"}

# Geocoding fallback configuration
SF_GEOCODER_URL = "https://sfplanninggis.org/arcgiswa/rest/services/Geocoder_V2/GeocodeServer/findAddressCandidates"
GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GEOCODING_TIMEOUT = 5
GEOCODING_CACHE = {}  # Simple in-memory cache


def places_nearby(lat: float, lon: float, included_types: List[str],
                  radius_miles: float, max_results: int = 8) -> List[Dict[str, Any]]:
    """
    Search for nearby places using Google Places API (New)
    Returns list of places within radius, sorted by distance
    """
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        print("[Places API] Warning: GOOGLE_PLACES_API_KEY not configured, skipping POI enrichment")
        return []

    url = "https://places.googleapis.com/v1/places:searchNearby"
    body = {
        "includedTypes": included_types,
        "maxResultCount": max_results,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lon},
                "radius": float(radius_miles) * 1609.34,  # Convert miles to meters
            }
        },
    }
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(url, headers=headers, json=body, timeout=10)
        if resp.status_code != 200:
            print(f"[Places API] Error {resp.status_code}: {resp.text[:200]}")
            return []
        return (resp.json() or {}).get("places", []) or []
    except Exception as e:
        print(f"[Places API] Exception: {e}")
        return []


def enrich_with_places(listing: Dict[str, Any], poi_keys: List[str] = None) -> Dict[str, Any]:
    """
    Enrich listing with nearby POI distances using Google Places API
    Returns dict with poi_min_miles and poi_counts
    """
    if poi_keys is None:
        poi_keys = ["school", "supermarket", "park", "transit"]

    lat, lon = listing.get("latitude"), listing.get("longitude")
    if lat is None or lon is None:
        return {"poi_min_miles": {}, "poi_counts": {}}

    poi_min, poi_counts = {}, {}

    for k in poi_keys:
        if k not in PLACES_TYPES:
            continue

        spec = PLACES_TYPES[k]
        places = places_nearby(lat, lon, spec["includedTypes"], spec.get("radius_miles", 2.0), max_results=8)

        dists = []
        for p in places:
            loc = p.get("location", {}) or {}
            plat = loc.get("latitude")
            plon = loc.get("longitude")

            if plat is not None and plon is not None:
                try:
                    dist = haversine_miles(lat, lon, float(plat), float(plon))
                    dists.append(dist)
                except Exception:
                    pass

        poi_min[k] = min(dists) if dists else None
        poi_counts[k] = len(places)

    return {"poi_min_miles": poi_min, "poi_counts": poi_counts}


# ------------------- Coordinate Extraction with Fallbacks -------------------
def get_property_coordinates(listing: Dict[str, Any]) -> Optional[Tuple[float, float]]:
    """
    Extract coordinates with multiple fallback strategies.

    Tries in order:
    1. latitude/longitude fields (from normalized listing)
    2. coordinates.lat/lng (from raw data)
    3. SF Planning GIS geocoder (SF only)
    4. Google Geocoding API (if key available)
    """
    # Strategy 1: Direct latitude/longitude fields
    lat = listing.get("latitude")
    lon = listing.get("longitude")
    if lat is not None and lon is not None:
        return (float(lat), float(lon))

    # Strategy 2: coordinates object (from raw data)
    raw = listing.get("_raw", {})
    coords = raw.get("coordinates", {})
    if coords and coords.get("lat") and coords.get("lng"):
        return (float(coords["lat"]), float(coords["lng"]))

    # Strategy 3: Geocode using SF Planning (SF only)
    city = listing.get("city", "")
    address = listing.get("address", "")

    if city and "san francisco" in city.lower() and address:
        coords = geocode_sf_planning(address)
        if coords:
            return coords

    # Strategy 4: Google Geocoding (if available)
    google_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if google_key and address and city:
        coords = geocode_google(address, city)
        if coords:
            return coords

    print(f"[Coords] No coordinates found for {listing.get('id')}")
    return None


def geocode_sf_planning(address: str) -> Optional[Tuple[float, float]]:
    """Geocode using SF Planning GIS geocoder"""
    cache_key = f"sf_{address}"
    if cache_key in GEOCODING_CACHE:
        return GEOCODING_CACHE[cache_key]

    try:
        response = requests.get(
            SF_GEOCODER_URL,
            params={"f": "json", "SingleLine": address, "maxLocations": 1},
            timeout=GEOCODING_TIMEOUT
        )

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])

            if candidates:
                location = candidates[0].get("location", {})
                lon = location.get("x")
                lat = location.get("y")

                if lat and lon:
                    coords = (float(lat), float(lon))

                    # Verify within SF bounds
                    if 37.7 <= coords[0] <= 37.83 and -122.52 <= coords[1] <= -122.35:
                        GEOCODING_CACHE[cache_key] = coords
                        print(f"[SF Geocoder] Found: {address} -> {coords}")
                        return coords

    except Exception as e:
        print(f"[SF Geocoder] Error: {e}")

    return None


def geocode_google(address: str, city: str) -> Optional[Tuple[float, float]]:
    """Geocode using Google Geocoding API"""
    google_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not google_key:
        return None

    cache_key = f"google_{address}_{city}"
    if cache_key in GEOCODING_CACHE:
        return GEOCODING_CACHE[cache_key]

    try:
        response = requests.get(
            GOOGLE_GEOCODING_URL,
            params={"address": f"{address}, {city}, CA", "key": google_key},
            timeout=GEOCODING_TIMEOUT
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "OK" and data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                coords = (float(location["lat"]), float(location["lng"]))
                GEOCODING_CACHE[cache_key] = coords
                print(f"[Google Geocoder] Found: {address} -> {coords}")
                return coords

    except Exception as e:
        print(f"[Google Geocoder] Error: {e}")

    return None


# ------------------- PIM Scoring Client -------------------
def get_pim_score(listing_id: str, city: str, lat: float, lon: float) -> Optional[Dict]:
    """
    Call PIM microservice to get property score.

    Returns:
        Dict with PIM data if successful, None if:
        - PIM disabled
        - City not supported
        - Property outside coverage area
        - Service timeout/error
    """
    if not PIM_ENABLED:
        return None

    if city not in PIM_SUPPORTED_CITIES:
        return None

    if lat is None or lon is None:
        return None

    try:
        response = requests.post(
            f"{PIM_SERVICE_URL}/score",
            json={
                "property": {
                    "listing_id": listing_id,
                    "latitude": lat,
                    "longitude": lon,
                    "city": city
                }
            },
            timeout=PIM_TIMEOUT
        )

        if response.status_code == 200:
            pim_data = response.json()
            print(f"[PIM] ✓ Scored {listing_id}: {pim_data['score_total']:.2f}/10")
            return pim_data

        elif response.status_code == 400:
            # Property outside SF or city not supported
            print(f"[PIM] ⊘ Property {listing_id} outside coverage area")
            return None

        else:
            print(f"[PIM] ✗ Service error {response.status_code} for {listing_id}")
            return None

    except requests.Timeout:
        print(f"[PIM] ⏱ Timeout for {listing_id}")
        return None

    except Exception as e:
        print(f"[PIM] ✗ Error for {listing_id}: {e}")
        return None


@dataclass
class Preferences:
    """Structured buyer preferences"""
    budget_min: int = 0
    budget_max: int = 999999999
    min_beds: int = 0
    min_baths: float = 0.0
    min_sqft: int = 0
    min_lot_size: float = 0.0  # in sqft
    must_haves: List[str] = None
    nice_to_haves: List[str] = None
    preferred_areas: List[str] = None
    property_types: List[str] = None
    school_priority: str = "medium"  # "low", "medium", "high"
    commute_address: str = None  # Optional commute destination

    def __post_init__(self):
        if self.must_haves is None:
            self.must_haves = []
        if self.nice_to_haves is None:
            self.nice_to_haves = []
        if self.preferred_areas is None:
            self.preferred_areas = []
        if self.property_types is None:
            self.property_types = []


def parse_prefs_llm(user_text: str) -> Preferences:
    """
    Parse free-form buyer preferences using OpenAI LLM
    """
    prompt = f"""
You are a real estate assistant. Extract structured preferences from this buyer's description.

Buyer's requirements:
{user_text}

Return a JSON with these fields:
- budget_min (integer, default 0)
- budget_max (integer, default 999999999)
- min_beds (integer, default 0)
- min_baths (float, default 0)
- min_sqft (integer, default 0)
- min_lot_size (float in sqft, default 0)
- must_haves (list of strings, amenities/features that are required)
- nice_to_haves (list of strings, preferred but not required)
- preferred_areas (list of city names or neighborhoods)
- property_types (list of strings like "Single Family", "Condo", "Townhouse")

Only output valid JSON, nothing else.
"""

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )

    result_text = response.choices[0].message.content.strip()
    # Remove markdown code blocks if present
    if result_text.startswith("```"):
        lines = result_text.split("\n")
        result_text = "\n".join(lines[1:-1])

    parsed = json.loads(result_text)
    return Preferences(**parsed)


def fetch_properties_from_supabase(
    preferred_areas: List[str] = None,
    min_price: int = 0,
    max_price: int = 999999999,
    min_beds: int = 0,
    min_baths: float = 0,
    property_types: List[str] = None,
    limit: int = 100,
    buyer_id: str = None
) -> List[Dict[str, Any]]:
    """
    Fetch properties from Supabase database with filters
    """
    if not supabase:
        return []

    # Fetch properties the buyer has already interacted with (if buyer_id provided)
    excluded_property_ids = []
    if buyer_id:
        try:
            print(f"[DB Filter] Fetching already-seen properties for buyer: {buyer_id}")
            seen_response = supabase.table("buyer_properties").select("property_id").eq("buyer_id", buyer_id).execute()

            if seen_response.data:
                excluded_property_ids = [item["property_id"] for item in seen_response.data]
                print(f"[DB Filter] Excluding {len(excluded_property_ids)} already-seen properties")
        except Exception as e:
            print(f"[DB Filter] Warning: Could not fetch seen properties: {e}")

    # Build query - include PIM cache columns
    query = supabase.table("properties").select(
        "id, address, city, state, zip_code, coordinates, "
        "listing_price, bedrooms, bathrooms, square_feet, lot_size, "
        "property_type, year_built, description, schools, "
        "zillow_property_id, data_source, "
        "pim_score, pim_env_risk, pim_regulatory_friction, pim_expandability, pim_reno_recency, pim_nuisance, pim_scored_at"
    )

    # Exclude properties the buyer has already seen
    if excluded_property_ids:
        query = query.not_.in_("id", excluded_property_ids)

    # Apply filters
    if min_price and min_price > 0:
        query = query.gte("listing_price", min_price)
    if max_price is not None and max_price < 999999999:
        query = query.lte("listing_price", max_price)
    if min_beds and min_beds > 0:
        query = query.gte("bedrooms", min_beds)
    if min_baths and min_baths > 0:
        query = query.gte("bathrooms", min_baths)

    # Property type filter - only apply if explicitly specified
    # Don't filter out properties just because LLM inferred "Single Family" from "house"
    # Let the scoring system handle property type preferences instead
    # if property_types:
    #     query = query.in_("property_type", property_types)

    # FIX: Try filtering by preferred_areas as cities first
    # If no results, fall back to broader search (preferred_areas might be neighborhoods)
    used_area_filter = False
    if preferred_areas:
        query = query.in_("city", preferred_areas)
        used_area_filter = True

    query = query.limit(limit)

    response = query.execute()

    # FALLBACK: If preferred_areas filter returned 0 results, retry without it
    # This handles cases where preferred_areas are neighborhoods, not cities
    if used_area_filter and len(response.data) == 0:
        print(f"[DB Filter] No properties found matching preferred_areas={preferred_areas} as cities")
        print(f"[DB Filter] Retrying without area filter (preferred_areas may be neighborhoods)")

        # Rebuild query without the city filter - include PIM cache columns
        query = supabase.table("properties").select(
            "id, address, city, state, zip_code, coordinates, "
            "listing_price, bedrooms, bathrooms, square_feet, lot_size, "
            "property_type, year_built, description, schools, "
            "zillow_property_id, data_source, "
            "pim_score, pim_env_risk, pim_regulatory_friction, pim_expandability, pim_reno_recency, pim_nuisance, pim_scored_at"
        )

        # Exclude properties the buyer has already seen (in fallback query too)
        if excluded_property_ids:
            query = query.not_.in_("id", excluded_property_ids)

        if min_price and min_price > 0:
            query = query.gte("listing_price", min_price)
        if max_price is not None and max_price < 999999999:
            query = query.lte("listing_price", max_price)
        if min_beds and min_beds > 0:
            query = query.gte("bedrooms", min_beds)
        if min_baths and min_baths > 0:
            query = query.gte("bathrooms", min_baths)
        # Skip property_types filter - let scoring handle preferences
        # Skip preferred_areas filter

        query = query.limit(limit)
        response = query.execute()
        print(f"[DB Filter] Fallback query returned {len(response.data)} properties")

    # Convert to list of dicts
    properties = []
    for prop in response.data:
        # Normalize structure to match original ML code expectations
        normalized = {
            "id": prop.get("id", ""),  # Database UUID (REQUIRED by frontend)
            "zpid": prop.get("zillow_property_id") or prop["id"],
            "address": prop.get("address", ""),
            "city": prop.get("city", ""),
            "state": prop.get("state", ""),
            "zipcode": prop.get("zip_code", ""),
            "price": prop.get("listing_price", 0),
            "bedrooms": prop.get("bedrooms", 0),
            "bathrooms": prop.get("bathrooms", 0),
            "livingArea": prop.get("square_feet", 0),
            "lotSize": prop.get("lot_size", 0),
            "propertyType": prop.get("property_type", ""),
            "yearBuilt": prop.get("year_built", None),
            "description": prop.get("description", ""),
            "latitude": prop.get("coordinates", {}).get("lat") if isinstance(prop.get("coordinates"), dict) else None,
            "longitude": prop.get("coordinates", {}).get("lng") if isinstance(prop.get("coordinates"), dict) else None,
            "schools": prop.get("schools", []),
            "_raw": prop
        }
        properties.append(normalized)

    return properties


def enrich_with_schools_data(listing: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use schools data already stored in the database
    """
    schools = listing.get("schools", [])

    # Calculate average school rating if available
    ratings = [s.get("rating", 0) for s in schools if s.get("rating")]
    listing["avg_school_rating"] = sum(ratings) / len(ratings) if ratings else 0

    # Find closest school distance
    distances = [s.get("distance", 999) for s in schools if s.get("distance")]
    listing["closest_school_miles"] = min(distances) if distances else None

    return listing


def rule_score(listing: Dict[str, Any], prefs: Preferences) -> Tuple[float, List[str]]:
    """
    Enhanced rule-based scoring with:
    - Distance-based amenity scoring (Google Places)
    - Must-have penalties for missing features
    - School priority levels
    - Budget penalties for over-budget properties
    """
    score = 0.0
    reasons = []
    price = listing.get("price") or 0

    # Budget fit with progressive penalty for over-budget (0-30 points)
    if price == 0:
        budget_score = 0
    elif price <= prefs.budget_max:
        score += 30
        reasons.append("within budget")
        # Bonus for being above minimum budget
        if prefs.budget_min and price >= prefs.budget_min:
            score += 5
    else:
        # Progressive penalty for over-budget
        over = (price - prefs.budget_max) / max(1.0, prefs.budget_max)
        penalty = min(25, 100 * over * 0.5)
        score -= penalty
        reasons.append("over budget")

    # Bedrooms/bathrooms (0-18 points)
    beds = listing.get("bedrooms", 0) or 0
    baths = listing.get("bathrooms", 0) or 0.0
    sqft = listing.get("square_feet", 0) or listing.get("livingArea", 0) or 0

    if prefs.min_beds and beds >= prefs.min_beds:
        score += 10
        reasons.append("meets bedroom need")
    if prefs.min_baths and baths >= prefs.min_baths:
        score += 8
        reasons.append("meets bathroom need")

    # Square footage (0-8 points)
    if prefs.min_sqft and sqft and sqft >= prefs.min_sqft:
        score += 8
        reasons.append("meets size need")

    # POI Distance-Based Amenity Scoring (uses Google Places API data)
    poi = listing.get("poi_min_miles") or {}

    def boost(distance, cap, cutoff):
        """Calculate proximity boost: closer = higher score"""
        if distance is None:
            return 0.0
        return max(0.0, cap * (1 - min(distance / cutoff, 1.0)))

    # School proximity with priority levels
    school_weights = {"low": 2, "medium": 6, "high": 10}
    school_w = school_weights.get(prefs.school_priority or "medium", 6)
    school_boost = boost(poi.get("school"), school_w, 2.0)  # Within 2 miles
    if school_boost > 0:
        score += school_boost
        dist = poi.get("school")
        if dist and dist < 0.5:
            reasons.append(f"school nearby ({dist:.1f}mi)")

    # Supermarket proximity
    market_boost = boost(poi.get("supermarket"), 6, 2.0)
    if market_boost > 0:
        score += market_boost

    # Park proximity
    park_boost = boost(poi.get("park"), 5, 1.2)
    if park_boost > 0:
        score += park_boost

    # Transit proximity
    transit_boost = boost(poi.get("transit"), 6, 1.0)
    if transit_boost > 0:
        score += transit_boost

    # Must-haves with PENALTIES for missing features
    text = (listing.get("description") or "").lower() + " " + (listing.get("address") or "").lower()

    if prefs.must_haves:
        # EV Charger
        if any(w in prefs.must_haves for w in ["ev", "ev charger", "charger", "charging"]):
            if kw_in(text, "ev", "charger", "charging", "electric vehicle"):
                score += 4
                reasons.append("EV-ready mentioned")
            else:
                score -= 3
                reasons.append("EV not mentioned")

        # Yard/Garden
        if any(w in prefs.must_haves for w in ["yard", "garden", "backyard", "outdoor space"]):
            if kw_in(text, "yard", "garden", "backyard", "outdoor", "patio"):
                score += 3
                reasons.append("yard mentioned")
            else:
                score -= 3
                reasons.append("yard not mentioned")

        # Garage
        if any(w in prefs.must_haves for w in ["garage", "two car", "2-car", "parking"]):
            if kw_in(text, "garage", "two car", "2-car", "parking"):
                score += 3
                reasons.append("garage mentioned")
            else:
                score -= 2
                reasons.append("garage not mentioned")

    # Clamp score to 0-100 range, centered at 50
    final_score = max(0.0, min(100.0, 50 + score))

    return final_score, reasons[:4]  # Return top 4 reasons


def llm_score_batch(prefs: Preferences, listings: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Score all listings in a single LLM call for efficiency
    """
    if not listings:
        return {}

    # Create summary for each listing
    summaries = []
    for i, listing in enumerate(listings):
        summary = f"""
Property {i+1}:
- Address: {listing.get('address', 'N/A')}, {listing.get('city', 'N/A')}
- Price: ${listing.get('price', 0):,}
- Beds/Baths: {listing.get('bedrooms', 0)}/{listing.get('bathrooms', 0)}
- Size: {listing.get('livingArea') or 0:,} sqft, Lot: {listing.get('lotSize') or 0:,} sqft
- Type: {listing.get('propertyType', 'N/A')}
- Year: {listing.get('yearBuilt', 'N/A')}
- Schools: Avg rating {listing.get('avg_school_rating', 0):.1f}/10
- Description: {(listing.get('description') or 'N/A')[:200]}
"""
        summaries.append(summary)

    prefs_text = f"""
Budget: ${prefs.budget_min:,} - ${prefs.budget_max:,}
Min beds: {prefs.min_beds}, Min baths: {prefs.min_baths}
Min sqft: {prefs.min_sqft:,}, Min lot: {prefs.min_lot_size:,} sqft
Must have: {', '.join(prefs.must_haves) if prefs.must_haves else 'None'}
Nice to have: {', '.join(prefs.nice_to_haves) if prefs.nice_to_haves else 'None'}
Preferred areas: {', '.join(prefs.preferred_areas) if prefs.preferred_areas else 'Any'}
"""

    prompt = f"""
You are a real estate expert. Score each property (0-100) based on how well it matches the buyer's preferences.
Consider: budget fit, location, size, amenities, schools, and overall value.

Buyer Preferences:
{prefs_text}

Properties:
{chr(10).join(summaries)}

Return ONLY a JSON object mapping property index to score:
{{"0": 85, "1": 72, ...}}
"""

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )

    result_text = response.choices[0].message.content.strip()
    if result_text.startswith("```"):
        lines = result_text.split("\n")
        result_text = "\n".join(lines[1:-1])

    scores_by_index = json.loads(result_text)

    # Map back to zpid
    scores = {}
    for i, listing in enumerate(listings):
        zpid = listing.get("zpid", "")
        score = scores_by_index.get(str(i), 50)
        scores[zpid] = float(score)

    return scores


def fit_ml_and_predict(X: pd.DataFrame, y_llm: np.ndarray) -> np.ndarray:
    """
    Train Ridge regression to mimic LLM scores
    """
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler

    # Handle missing values
    X_filled = X.fillna(0)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_filled)

    # Train Ridge regression
    model = Ridge(alpha=1.0)
    model.fit(X_scaled, y_llm)

    # Predict
    y_pred = model.predict(X_scaled)

    # Clip to 0-100 range
    y_pred = np.clip(y_pred, 0, 100)

    return y_pred


def recommend_hybrid(
    user_prefs_text: str = None,
    prefs: Preferences = None,
    preferred_areas: List[str] = None,
    limit: int = 50,
    buyer_id: str = None,
    w_llm: float = 0.5,
    w_ml: float = 0.3,
    w_rule: float = 0.2
) -> pd.DataFrame:
    """
    Main recommendation function using hybrid scoring
    """
    # Parse preferences if text provided
    if user_prefs_text and not prefs:
        prefs = parse_prefs_llm(user_prefs_text)

    if not prefs:
        raise ValueError("Must provide either user_prefs_text or prefs object")

    # Use preferred_areas from prefs if not provided
    if not preferred_areas and prefs.preferred_areas:
        preferred_areas = prefs.preferred_areas

    # Fetch properties from Supabase
    listings = fetch_properties_from_supabase(
        preferred_areas=preferred_areas,
        min_price=prefs.budget_min,
        max_price=prefs.budget_max,
        min_beds=prefs.min_beds,
        min_baths=prefs.min_baths,
        property_types=prefs.property_types,
        limit=limit,
        buyer_id=buyer_id
    )

    if not listings:
        return pd.DataFrame()

    # Enrich with schools data
    for listing in listings:
        enrich_with_schools_data(listing)

    # Enrich with Google Places POI data
    if os.environ.get("GOOGLE_PLACES_API_KEY"):
        print(f"[recommend_hybrid] Enriching {len(listings)} properties with POI data...")
        for listing in listings:
            poi_data = enrich_with_places(listing, poi_keys=["school", "supermarket", "park", "transit"])
            listing.update(poi_data)
        print(f"[recommend_hybrid] POI enrichment complete")
    else:
        print("[recommend_hybrid] Skipping POI enrichment (GOOGLE_PLACES_API_KEY not configured)")
        # Set empty POI data so rule_score doesn't fail
        for listing in listings:
            listing["poi_min_miles"] = {}
            listing["poi_counts"] = {}

    # Calculate rule scores
    rule_scores = []
    rule_reasons = []
    for listing in listings:
        score, reasons = rule_score(listing, prefs)
        rule_scores.append(score)
        rule_reasons.append("; ".join(reasons[:3]))  # Top 3 reasons

    # Calculate LLM scores (batch)
    llm_scores_dict = llm_score_batch(prefs, listings)
    llm_scores = [llm_scores_dict.get(listing.get("zpid", ""), 50) for listing in listings]

    # Prepare features for ML model
    features_list = []
    for listing in listings:
        # Handle None values explicitly (when key exists but value is NULL)
        price = listing.get("price") or 0
        living_area = listing.get("livingArea") or 0

        features = {
            "price": price,
            "bedrooms": listing.get("bedrooms") or 0,
            "bathrooms": listing.get("bathrooms") or 0,
            "sqft": living_area,
            "lot_size": listing.get("lotSize") or 0,
            "year_built": listing.get("yearBuilt") or 0,
            "avg_school_rating": listing.get("avg_school_rating") or 0,
            "price_per_sqft": price / living_area if living_area > 0 else 0
        }
        features_list.append(features)

    X = pd.DataFrame(features_list)
    y_llm = np.array(llm_scores)

    # Train ML model and predict
    ml_scores = fit_ml_and_predict(X, y_llm)

    # Normalize all scores to 0-100
    rule_scores_norm = np.array(rule_scores)
    max_rule = rule_scores_norm.max() if rule_scores_norm.max() > 0 else 1
    rule_scores_norm = (rule_scores_norm / max_rule) * 100

    # Get PIM scores for eligible properties (SF properties with coordinates)
    # Strategy: Use cached scores from database first, fall back to PIM service
    print(f"[PIM] Checking {len(listings)} properties for PIM scoring...")
    pim_scores = []
    pim_subscores_list = []

    for listing in listings:
        city = listing.get("city", "")
        raw_listing = listing.get("_raw", {})

        # Check for cached PIM scores from database
        cached_pim_score = raw_listing.get("pim_score")

        if cached_pim_score is not None:
            # Use cached scores from database (already in 0-10 scale, convert to 0-100)
            pim_scores.append(float(cached_pim_score) * 10)
            pim_subscores_list.append({
                "env_risk": raw_listing.get("pim_env_risk"),
                "regulatory_friction": raw_listing.get("pim_regulatory_friction"),
                "expandability": raw_listing.get("pim_expandability"),
                "reno_recency": raw_listing.get("pim_reno_recency"),
                "nuisance": raw_listing.get("pim_nuisance"),
            })
            print(f"[PIM] ✓ Using cached score for {listing.get('id')}: {cached_pim_score:.2f}/10")
            continue

        # No cached score - try PIM service (may fail with 403 but that's okay)
        coords = get_property_coordinates(listing)
        pim_data = None

        if coords:
            lat, lon = coords
            pim_data = get_pim_score(listing.get("id"), city, lat, lon)
        else:
            print(f"[PIM] ⊘ Skipping {listing.get('id')}: No coordinates or cached score")

        # Store PIM data
        if pim_data is not None:
            # Convert PIM score from 0-10 to 0-100 scale
            pim_scores.append(pim_data["score_total"] * 10)
            pim_subscores_list.append(pim_data.get("subscores", {}))
        else:
            pim_scores.append(None)
            pim_subscores_list.append({})

    # Calculate hybrid score with adaptive weights
    hybrid_scores = []
    for i in range(len(listings)):
        if pim_scores[i] is not None:
            # SF property with PIM: 40% LLM + 25% ML + 15% Rules + 20% PIM
            hybrid_score = (
                0.40 * llm_scores[i] +
                0.25 * ml_scores[i] +
                0.15 * rule_scores_norm[i] +
                0.20 * pim_scores[i]
            )
        else:
            # Non-SF or PIM unavailable: 50% LLM + 30% ML + 20% Rules
            hybrid_score = (
                0.50 * llm_scores[i] +
                0.30 * ml_scores[i] +
                0.20 * rule_scores_norm[i]
            )
        hybrid_scores.append(hybrid_score)

    hybrid_scores = np.array(hybrid_scores)

    # Create results DataFrame
    results = []
    for i, listing in enumerate(listings):
        result = {
            "id": listing.get("id", ""),  # Database UUID (required by frontend)
            "zpid": listing.get("zillow_property_id", listing.get("zpid", "")),  # Display ID
            "address": listing.get("address", ""),
            "city": listing.get("city", ""),
            "state": listing.get("state", ""),
            "price": listing.get("listing_price", listing.get("price", 0)),
            "bedrooms": listing.get("bedrooms", 0),
            "bathrooms": listing.get("bathrooms", 0),
            "sqft": listing.get("square_feet", listing.get("livingArea", 0)),
            "lot_size": listing.get("lot_size", listing.get("lotSize", 0)),
            "property_type": listing.get("property_type", listing.get("propertyType", "")),
            "year_built": listing.get("year_built", listing.get("yearBuilt", "")),
            "avg_school_rating": listing.get("avg_school_rating", 0),
            "hybrid_score": hybrid_scores[i],
            "llm_score": llm_scores[i],
            "ml_score": ml_scores[i],
            "rule_score": rule_scores_norm[i],
            "match_reasons": rule_reasons[i],
            # PIM scores
            "pim_score": pim_scores[i] if pim_scores[i] is not None else None,
            "pim_env_risk": pim_subscores_list[i].get("env_risk") if pim_subscores_list[i] else None,
            "pim_regulatory_friction": pim_subscores_list[i].get("regulatory_friction") if pim_subscores_list[i] else None,
            "pim_expandability": pim_subscores_list[i].get("expandability") if pim_subscores_list[i] else None,
            "pim_reno_recency": pim_subscores_list[i].get("reno_recency") if pim_subscores_list[i] else None,
            "pim_nuisance": pim_subscores_list[i].get("nuisance") if pim_subscores_list[i] else None,
        }
        results.append(result)

    df = pd.DataFrame(results)
    df = df.sort_values("hybrid_score", ascending=False).reset_index(drop=True)

    return df


def save_recommendations_to_db(buyer_id: str, recommendations_df: pd.DataFrame):
    """
    Save recommendations with PIM scores to buyer_properties table.

    This function stores all scoring data including PIM scores and subscores
    for tracking and analytics purposes.
    """
    if not supabase:
        print("[DB] Warning: Supabase client not available, skipping DB save")
        return

    for _, row in recommendations_df.iterrows():
        property_data = {
            "buyer_id": buyer_id,
            "property_id": row["id"],
            "hybrid_score": float(row["hybrid_score"]),
            "llm_score": float(row["llm_score"]),
            "ml_score": float(row["ml_score"]),
            "rule_score": float(row["rule_score"]),
            "is_active": True,
            "created_at": "now()",
        }

        # Add PIM scores if available
        if pd.notna(row.get("pim_score")):
            property_data.update({
                "pim_score": float(row["pim_score"]),
                "pim_env_risk": float(row["pim_env_risk"]) if pd.notna(row.get("pim_env_risk")) else None,
                "pim_regulatory_friction": float(row["pim_regulatory_friction"]) if pd.notna(row.get("pim_regulatory_friction")) else None,
                "pim_expandability": float(row["pim_expandability"]) if pd.notna(row.get("pim_expandability")) else None,
                "pim_reno_recency": float(row["pim_reno_recency"]) if pd.notna(row.get("pim_reno_recency")) else None,
                "pim_nuisance": float(row["pim_nuisance"]) if pd.notna(row.get("pim_nuisance")) else None,
                "pim_scored_at": "now()",
                "pim_city": row.get("city"),
            })

        try:
            supabase.table("buyer_properties").upsert(
                property_data,
                on_conflict="buyer_id,property_id"
            ).execute()
        except Exception as e:
            print(f"[DB] Error saving property {row['id']}: {e}")


class handler(BaseHTTPRequestHandler):
    """
    Vercel serverless function handler
    """

    def do_POST(self):
        """Handle POST requests for property recommendations"""
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            # Extract parameters
            user_prefs_text = data.get("preferences_text")
            buyer_profile_id = data.get("buyer_profile_id")
            preferred_areas = data.get("preferred_areas")
            limit = data.get("limit", 50)

            # If buyer_profile_id provided, fetch from database
            prefs = None
            if buyer_profile_id and supabase:
                profile_response = supabase.table("buyer_profiles").select("*").eq("person_id", buyer_profile_id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    prefs = Preferences(
                        budget_min=profile.get("price_min") or 0,
                        budget_max=profile.get("price_max") or 999999999,
                        must_haves=profile.get("must_have_features") or [],
                        nice_to_haves=profile.get("nice_to_have_features") or [],
                        preferred_areas=profile.get("preferred_areas") or [],
                        property_types=profile.get("property_type_preferences") or []
                    )
                    # Use raw_background for LLM parsing if available
                    if not user_prefs_text and profile.get("raw_background"):
                        user_prefs_text = profile.get("raw_background")

            # Get recommendations
            df = recommend_hybrid(
                user_prefs_text=user_prefs_text,
                prefs=prefs,
                preferred_areas=preferred_areas,
                limit=limit
            )

            # Convert to JSON
            recommendations = df.to_dict(orient="records")

            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "count": len(recommendations),
                "recommendations": recommendations
            }).encode('utf-8'))

        except Exception as e:
            # Error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "error": str(e)
            }).encode('utf-8'))

    def do_GET(self):
        """Handle GET requests for health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "message": "Property Recommendation API is running"
        }).encode('utf-8'))


# ==============================================================================
# Google Cloud Function Entry Point
# ==============================================================================

def recommend(request):
    """
    Google Cloud Function entry point for property recommendations.

    This function handles requests from the React frontend deployed on Vercel.
    It expects a JSON body with recommendation parameters and returns
    property recommendations scored by the hybrid ML model.

    Expected request body:
    {
        "preferences_text": "Looking for a 3 bedroom house...",  // optional
        "buyer_profile_id": "uuid",                              // optional
        "preferred_areas": ["Mountain View", "Palo Alto"],       // optional
        "limit": 30,                                             // optional, default 50
        "loved_property_ids": ["uuid1", "uuid2"]                 // optional, for similarity
    }

    Returns:
    {
        "success": true,
        "count": 10,
        "recommendations": [...]
    }
    """
    # Handle CORS preflight OPTIONS request
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for actual request
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        # Parse JSON request body
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({
                "success": False,
                "error": "Request body must be JSON"
            }), 400, headers)

        print(f"[GCP Function] Received request: {request_json}")

        # Extract parameters
        user_prefs_text = request_json.get('preferences_text')
        buyer_id = request_json.get('buyer_id')
        buyer_profile_id = request_json.get('buyer_profile_id')
        preferred_areas = request_json.get('preferred_areas')
        limit = request_json.get('limit', 50)
        loved_property_ids = request_json.get('loved_property_ids')

        # Initialize preferences object
        prefs = None

        # If buyer_id or buyer_profile_id provided, fetch profile from Supabase
        if buyer_id or buyer_profile_id:
            try:
                from supabase import create_client
                supabase_url = os.environ.get("SUPABASE_URL")
                supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

                if supabase_url and supabase_key:
                    supabase = create_client(supabase_url, supabase_key)

                    # First, try to get buyer_profile_id if we only have buyer_id
                    if buyer_id and not buyer_profile_id:
                        print(f"[GCP Function] Looking up buyer profile for buyer_id: {buyer_id}")
                        buyer_response = supabase.table("buyers").select("buyer_profile_id").eq("id", buyer_id).maybe_single().execute()
                        if buyer_response.data and buyer_response.data.get("buyer_profile_id"):
                            buyer_profile_id = buyer_response.data["buyer_profile_id"]
                            print(f"[GCP Function] Found buyer_profile_id: {buyer_profile_id}")

                    # Now fetch the profile if we have a profile ID
                    if buyer_profile_id:
                        print(f"[GCP Function] Fetching buyer profile: {buyer_profile_id}")
                        response = supabase.table("buyer_profiles").select("*").eq("id", buyer_profile_id).maybe_single().execute()

                        if response.data:
                            profile = response.data
                            prefs = Preferences(
                                budget_min=profile.get("price_min") or 0,
                                budget_max=profile.get("price_max") or 999999999,
                                must_haves=profile.get("must_have_features") or [],
                                nice_to_haves=profile.get("nice_to_have_features") or [],
                                preferred_areas=profile.get("preferred_areas") or [],
                                property_types=profile.get("property_type_preferences") or []
                            )
                            # Use raw_background for LLM parsing if available and no prefs_text provided
                            if not user_prefs_text and profile.get("raw_background"):
                                user_prefs_text = profile.get("raw_background")
                            print(f"[GCP Function] Loaded buyer profile successfully")
                        else:
                            print(f"[GCP Function] No buyer profile found for ID: {buyer_profile_id}")
                    else:
                        print(f"[GCP Function] No buyer_profile_id found for buyer_id: {buyer_id}")
            except Exception as profile_error:
                print(f"[GCP Function] Warning: Could not load buyer profile: {profile_error}")
                # Continue without profile - will use preferences_text or fail gracefully

        # If we still don't have preferences or text, create default preferences
        if not prefs and not user_prefs_text:
            print("[GCP Function] No preferences found - creating default preferences")
            prefs = Preferences(
                budget_min=0,
                budget_max=999999999,
                must_haves=[],
                nice_to_haves=[],
                preferred_areas=preferred_areas or [],
                property_types=[]
            )
            # Set a generic preferences text for LLM scoring
            user_prefs_text = "Looking for a property that matches my budget and preferred areas."

        # Get recommendations using the hybrid model
        print(f"[GCP Function] Calling recommend_hybrid with limit={limit}")
        df = recommend_hybrid(
            user_prefs_text=user_prefs_text,
            prefs=prefs,
            preferred_areas=preferred_areas,
            limit=limit,
            loved_property_ids=loved_property_ids
        )

        # Save recommendations to database if buyer_id provided
        if buyer_id:
            print(f"[GCP Function] Saving {len(df)} recommendations to database for buyer: {buyer_id}")
            save_recommendations_to_db(buyer_id, df)

        # Convert DataFrame to list of dicts
        recommendations = df.to_dict(orient="records")

        print(f"[GCP Function] Returning {len(recommendations)} recommendations")

        # Return success response
        response_data = {
            "success": True,
            "count": len(recommendations),
            "recommendations": recommendations
        }

        return (json.dumps(response_data), 200, headers)

    except ValueError as ve:
        # Validation errors (missing parameters, etc.)
        error_response = {
            "success": False,
            "error": str(ve),
            "type": "ValueError"
        }
        print(f"[GCP Function] ValueError: {ve}")
        return (json.dumps(error_response), 400, headers)

    except Exception as e:
        # Unexpected errors
        import traceback
        error_response = {
            "success": False,
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        print(f"[GCP Function] Error: {e}")
        print(traceback.format_exc())
        return (json.dumps(error_response), 500, headers)
