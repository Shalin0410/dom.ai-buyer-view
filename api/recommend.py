"""
Vercel Serverless Function: Lightweight Property Recommendation API
LIGHTWEIGHT VERSION: LLM (70%) + Rules (30%) - No ML libraries
For Full ML version, see recommend_full_ml.py
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from openai import OpenAI

# Supabase connection
try:
    from supabase import create_client, Client
except ImportError:
    Client = None

# Initialize clients
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = None
if Client and supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)


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
    """Parse free-form buyer preferences using OpenAI LLM"""
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
    buyer_id: str = None,
    exclude_interacted: bool = True
) -> List[Dict[str, Any]]:
    """
    Fetch properties from Supabase database with filters

    OPTIMIZATION: If buyer_id is provided and exclude_interacted=True,
    properties already in buyer_properties (where is_active=true) are
    excluded at the DATABASE level (not in Python), making queries much faster.
    """
    if not supabase:
        return []

    # OPTIMIZATION: Fetch already-interacted property IDs to exclude them
    # Exclude ALL properties in buyer_properties (active AND inactive)
    # Only properties that were DELETED (hard delete) can be re-recommended
    excluded_property_ids = []
    if buyer_id and exclude_interacted:
        try:
            interaction_response = supabase.table("buyer_properties").select("property_id").eq(
                "buyer_id", buyer_id
            ).execute()  # Removed .eq("is_active", True) - exclude ALL properties

            excluded_property_ids = [row["property_id"] for row in interaction_response.data]
            print(f"[DB Filter] Excluding {len(excluded_property_ids)} already-interacted properties for buyer {buyer_id}")
        except Exception as e:
            print(f"[DB Filter] Warning: Could not fetch interactions: {e}")

    query = supabase.table("properties").select(
        "id, address, city, state, zip_code, coordinates, "
        "listing_price, bedrooms, bathrooms, square_feet, lot_size, "
        "property_type, year_built, description, schools, "
        "zillow_property_id, data_source"
    )

    # OPTIMIZATION: Exclude already-interacted properties at SQL level
    if excluded_property_ids:
        query = query.not_.in_("id", excluded_property_ids)

    if min_price > 0:
        query = query.gte("listing_price", min_price)
    if max_price < 999999999:
        query = query.lte("listing_price", max_price)
    if min_beds > 0:
        query = query.gte("bedrooms", min_beds)
    if min_baths > 0:
        query = query.gte("bathrooms", min_baths)
    if property_types:
        query = query.in_("property_type", property_types)
    if preferred_areas:
        query = query.in_("city", preferred_areas)

    query = query.limit(limit)
    response = query.execute()

    properties = []
    for prop in response.data:
        normalized = {
            "id": prop["id"],  # Database UUID (for adding to buyer_properties)
            "zpid": prop.get("zillow_property_id") or prop["id"],  # Display ID
            "address": prop.get("address") or "",
            "city": prop.get("city") or "",
            "state": prop.get("state") or "",
            "zipcode": prop.get("zip_code") or "",
            "price": prop.get("listing_price") or 0,
            "bedrooms": prop.get("bedrooms") or 0,
            "bathrooms": prop.get("bathrooms") or 0,
            "livingArea": prop.get("square_feet") or 0,
            "lotSize": prop.get("lot_size") or 0,
            "propertyType": prop.get("property_type") or "",
            "yearBuilt": prop.get("year_built"),
            "description": prop.get("description") or "",
            "latitude": prop.get("coordinates", {}).get("lat") if isinstance(prop.get("coordinates"), dict) else None,
            "longitude": prop.get("coordinates", {}).get("lng") if isinstance(prop.get("coordinates"), dict) else None,
            "schools": prop.get("schools") or [],
            "_raw": prop
        }
        properties.append(normalized)

    return properties


def enrich_with_schools_data(listing: Dict[str, Any]) -> Dict[str, Any]:
    """Use schools data already stored in the database"""
    schools = listing.get("schools", [])
    ratings = [s.get("rating", 0) for s in schools if s.get("rating")]
    listing["avg_school_rating"] = sum(ratings) / len(ratings) if ratings else 0
    distances = [s.get("distance", 999) for s in schools if s.get("distance")]
    listing["closest_school_miles"] = min(distances) if distances else None
    return listing


def rule_score(listing: Dict[str, Any], prefs: Preferences) -> Tuple[float, List[str]]:
    """Rule-based scoring based on budget fit, property features, and schools"""
    score = 0.0
    reasons = []
    price = listing.get("price", 0)

    # Budget fit (0-40 points)
    if price == 0:
        budget_score = 0
    elif price < prefs.budget_min:
        budget_score = 20
        reasons.append("Below minimum budget")
    elif price > prefs.budget_max:
        budget_score = 0
        reasons.append("Over budget")
    else:
        budget_range = prefs.budget_max - prefs.budget_min
        if budget_range > 0:
            distance_from_min = price - prefs.budget_min
            ratio = distance_from_min / budget_range
            if ratio < 0.4:
                budget_score = 30 + (ratio / 0.4) * 10
            elif ratio < 0.6:
                budget_score = 40
            else:
                budget_score = 40 - ((ratio - 0.6) / 0.4) * 10
        else:
            budget_score = 40
        reasons.append(f"Good budget fit (${price:,})")

    score += budget_score

    # Bedrooms/bathrooms (0-20 points)
    beds = listing.get("bedrooms", 0)
    baths = listing.get("bathrooms", 0)
    if beds >= prefs.min_beds:
        score += 10
        if beds > prefs.min_beds:
            reasons.append(f"{beds} bedrooms (more than required)")
    if baths >= prefs.min_baths:
        score += 10
        if baths > prefs.min_baths:
            reasons.append(f"{baths} bathrooms (more than required)")

    # Square footage (0-10 points)
    sqft = listing.get("livingArea", 0)
    if sqft >= prefs.min_sqft:
        score += 10
        if sqft > prefs.min_sqft * 1.2:
            reasons.append(f"{sqft:,} sqft (spacious)")

    # Lot size (0-10 points)
    lot_size = listing.get("lotSize", 0)
    if lot_size >= prefs.min_lot_size:
        score += 10
        if lot_size > prefs.min_lot_size * 1.5:
            reasons.append(f"{lot_size:,} sqft lot (large)")

    # Schools (0-10 points)
    avg_rating = listing.get("avg_school_rating", 0)
    if avg_rating >= 8:
        score += 10
        reasons.append(f"Excellent schools (avg {avg_rating:.1f}/10)")
    elif avg_rating >= 6:
        score += 5

    # Must-have features (0-10 points)
    # Use 'or ""' to handle None values from database
    description_lower = (listing.get("description") or "").lower()
    property_type_lower = (listing.get("propertyType") or "").lower()
    must_have_matches = 0
    for must in prefs.must_haves:
        must_lower = (must or "").lower()
        if must_lower and (must_lower in description_lower or must_lower in property_type_lower):
            must_have_matches += 1
    if prefs.must_haves:
        must_have_ratio = must_have_matches / len(prefs.must_haves)
        score += must_have_ratio * 10
        if must_have_matches > 0:
            reasons.append(f"Has {must_have_matches}/{len(prefs.must_haves)} must-haves")

    return score, reasons


def llm_score_batch(prefs: Preferences, listings: List[Dict[str, Any]]) -> Dict[str, float]:
    """Score all listings in a single LLM call for efficiency"""
    if not listings:
        return {}

    summaries = []
    for i, listing in enumerate(listings):
        summary = f"""
Property {i+1}:
- Address: {listing.get('address', 'N/A')}, {listing.get('city', 'N/A')}
- Price: ${listing.get('price', 0):,}
- Beds/Baths: {listing.get('bedrooms', 0)}/{listing.get('bathrooms', 0)}
- Size: {listing.get('livingArea', 0):,} sqft, Lot: {listing.get('lotSize', 0):,} sqft
- Type: {listing.get('propertyType', 'N/A')}
- Year: {listing.get('yearBuilt', 'N/A')}
- Schools: Avg rating {listing.get('avg_school_rating', 0):.1f}/10
- Description: {listing.get('description', 'N/A')[:200]}
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
    scores = {}
    for i, listing in enumerate(listings):
        zpid = listing.get("zpid", "")
        score = scores_by_index.get(str(i), 50)
        scores[zpid] = float(score)

    return scores


def recommend_hybrid(
    user_prefs_text: str = None,
    prefs: Preferences = None,
    preferred_areas: List[str] = None,
    limit: int = 50,
    w_llm: float = 0.7,  # Increased from 0.5
    w_rule: float = 0.3,   # Increased from 0.2
    buyer_id: str = None,
    loved_property_ids: List[str] = None,
    viewing_scheduled_property_ids: List[str] = None,
    saved_property_ids: List[str] = None,
    passed_property_ids: List[str] = None
) -> List[Dict[str, Any]]:
    """
    LIGHTWEIGHT VERSION: LLM (70%) + Rules (30%)
    For Full ML version with Ridge regression, see recommend_full_ml.py

    OPTIMIZATION: If buyer_id is provided, already-interacted properties are
    excluded at the DATABASE level (SQL WHERE NOT IN), not in Python.
    This makes queries much faster and reduces data transfer.

    We still send loved_property_ids for similarity boosting (price, location, etc.)
    """
    if user_prefs_text and not prefs:
        prefs = parse_prefs_llm(user_prefs_text)

    if not prefs:
        raise ValueError("Must provide either user_prefs_text or prefs object")

    if not preferred_areas and prefs.preferred_areas:
        preferred_areas = prefs.preferred_areas

    print(f"[recommend_hybrid] Requested limit: {limit}, Buyer ID: {buyer_id}")

    # OPTIMIZATION: Pass buyer_id to database query for SQL-level filtering
    # Properties already in buyer_properties (is_active=true) are excluded at DB level
    listings = fetch_properties_from_supabase(
        preferred_areas=preferred_areas,
        min_price=prefs.budget_min,
        max_price=prefs.budget_max,
        min_beds=prefs.min_beds,
        min_baths=prefs.min_baths,
        property_types=prefs.property_types,
        limit=limit,
        buyer_id=buyer_id,
        exclude_interacted=True  # Enable SQL-level duplicate filtering
    )

    if not listings:
        print("[recommend_hybrid] No properties returned from database after filtering")
        return []

    print(f"[recommend_hybrid] Fetched {len(listings)} properties from database (already filtered)")

    # Fetch loved properties for similarity boosting
    loved_properties = []
    if loved_property_ids and supabase:
        try:
            loved_response = supabase.table("properties").select("*").in_("id", loved_property_ids).execute()
            loved_properties = loved_response.data if loved_response.data else []
            if loved_properties:
                print(f"Boosting recommendations based on {len(loved_properties)} loved properties")
        except Exception as e:
            print(f"Error fetching loved properties: {e}")

    for listing in listings:
        enrich_with_schools_data(listing)

    # Calculate rule scores
    rule_scores = []
    rule_reasons = []
    for listing in listings:
        score, reasons = rule_score(listing, prefs)
        rule_scores.append(score)
        rule_reasons.append("; ".join(reasons[:3]))

    # Calculate LLM scores (batch)
    llm_scores_dict = llm_score_batch(prefs, listings)
    llm_scores = [llm_scores_dict.get(listing.get("zpid", ""), 50) for listing in listings]

    # Normalize rule scores to 0-100
    max_rule = max(rule_scores) if rule_scores else 1
    rule_scores_norm = [(s / max_rule) * 100 for s in rule_scores]

    # Calculate hybrid score (LLM 70% + Rules 30%)
    hybrid_scores = [
        w_llm * llm_scores[i] + w_rule * rule_scores_norm[i]
        for i in range(len(listings))
    ]

    # Apply feedback from interaction history
    if loved_properties:
        # Calculate average characteristics from loved properties
        avg_price = sum(p.get("price", 0) for p in loved_properties) / len(loved_properties)
        loved_cities = set(p.get("city", "").lower() for p in loved_properties if p.get("city"))
        loved_types = set(p.get("propertyType", "").lower() for p in loved_properties if p.get("propertyType"))
        avg_beds = sum(p.get("bedrooms", 0) for p in loved_properties) / len(loved_properties)
        avg_baths = sum(p.get("bathrooms", 0) for p in loved_properties) / len(loved_properties)

        # Boost properties similar to loved ones
        for i, listing in enumerate(listings):
            similarity_boost = 0

            # Price similarity (within 20% gets +10 points)
            listing_price = listing.get("price", 0)
            if avg_price > 0 and 0.8 * avg_price <= listing_price <= 1.2 * avg_price:
                similarity_boost += 10

            # Same city as loved properties (+15 points)
            listing_city = (listing.get("city") or "").lower()
            if listing_city in loved_cities:
                similarity_boost += 15

            # Same property type (+10 points)
            listing_type = (listing.get("propertyType") or "").lower()
            if listing_type in loved_types:
                similarity_boost += 10

            # Bedroom similarity (+5 points)
            listing_beds = listing.get("bedrooms", 0)
            if abs(listing_beds - avg_beds) <= 1:
                similarity_boost += 5

            # Bathroom similarity (+5 points)
            listing_baths = listing.get("bathrooms", 0)
            if abs(listing_baths - avg_baths) <= 0.5:
                similarity_boost += 5

            # Apply boost (max +45 points possible)
            if similarity_boost > 0:
                hybrid_scores[i] = min(100, hybrid_scores[i] + similarity_boost)

    # Create results
    results = []
    for i, listing in enumerate(listings):
        result = {
            "id": listing.get("id", ""),  # Database UUID
            "zpid": listing.get("zpid", ""),  # Display ID
            "address": listing.get("address", ""),
            "city": listing.get("city", ""),
            "state": listing.get("state", ""),
            "price": listing.get("price", 0),
            "bedrooms": listing.get("bedrooms", 0),
            "bathrooms": listing.get("bathrooms", 0),
            "sqft": listing.get("livingArea", 0),
            "lot_size": listing.get("lotSize", 0),
            "property_type": listing.get("propertyType", ""),
            "year_built": listing.get("yearBuilt", ""),
            "avg_school_rating": listing.get("avg_school_rating", 0),
            "hybrid_score": hybrid_scores[i],
            "llm_score": llm_scores[i],
            "ml_score": 0,  # Not used in lightweight version
            "rule_score": rule_scores_norm[i],
            "match_reasons": rule_reasons[i]
        }
        results.append(result)

    # Sort by hybrid score and return only the requested limit
    results.sort(key=lambda x: x["hybrid_score"], reverse=True)

    # IMPORTANT: Return exactly the requested number of properties
    limited_results = results[:limit]
    print(f"Returning {len(limited_results)} properties (requested limit: {limit})")

    return limited_results


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""

    def do_POST(self):
        """Handle POST requests for property recommendations"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            user_prefs_text = data.get("preferences_text")
            buyer_profile_id = data.get("buyer_profile_id")
            preferred_areas = data.get("preferred_areas")
            limit = data.get("limit", 50)

            # Extract interaction history for personalized recommendations
            loved_property_ids = data.get("loved_property_ids", [])
            viewing_scheduled_property_ids = data.get("viewing_scheduled_property_ids", [])
            saved_property_ids = data.get("saved_property_ids", [])
            passed_property_ids = data.get("passed_property_ids", [])

            # Log interaction history for debugging
            total_interactions = len(loved_property_ids) + len(viewing_scheduled_property_ids) + len(saved_property_ids) + len(passed_property_ids)
            if total_interactions > 0:
                print(f"Using interaction history: {len(loved_property_ids)} loved, {len(viewing_scheduled_property_ids)} scheduled, {len(saved_property_ids)} saved, {len(passed_property_ids)} passed")

            prefs = None
            if buyer_profile_id and supabase:
                profile_response = supabase.table("buyer_profiles").select("*").eq("person_id", buyer_profile_id).execute()
                if profile_response.data:
                    profile = profile_response.data[0]
                    prefs = Preferences(
                        budget_min=profile.get("price_min", 0),
                        budget_max=profile.get("price_max", 999999999),
                        must_haves=profile.get("must_have_features", []),
                        nice_to_haves=profile.get("nice_to_have_features", []),
                        preferred_areas=profile.get("preferred_areas", []),
                        property_types=profile.get("property_type_preferences", [])
                    )
                    if not user_prefs_text and profile.get("raw_background"):
                        user_prefs_text = profile.get("raw_background")

            recommendations = recommend_hybrid(
                user_prefs_text=user_prefs_text,
                prefs=prefs,
                preferred_areas=preferred_areas,
                limit=limit,
                buyer_id=buyer_profile_id,  # Enable SQL-level duplicate filtering
                loved_property_ids=loved_property_ids,
                viewing_scheduled_property_ids=viewing_scheduled_property_ids,
                saved_property_ids=saved_property_ids,
                passed_property_ids=passed_property_ids
            )

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "count": len(recommendations),
                "recommendations": recommendations,
                "version": "lightweight"  # Indicate which version is running
            }).encode('utf-8'))

        except Exception as e:
            import traceback
            error_details = {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc(),
                "env_check": {
                    "has_openai_key": bool(os.environ.get("OPENAI_API_KEY")),
                    "has_supabase_url": bool(os.environ.get("SUPABASE_URL")),
                    "has_supabase_key": bool(os.environ.get("SUPABASE_SERVICE_ROLE_KEY")),
                    "supabase_client_initialized": supabase is not None
                }
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_details).encode('utf-8'))

    def do_GET(self):
        """Handle GET requests for health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "message": "Property Recommendation API is running",
            "version": "lightweight (LLM 70% + Rules 30%)"
        }).encode('utf-8'))
