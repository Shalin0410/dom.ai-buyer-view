"""
Vercel Serverless Function: Hybrid Property Recommendation API
Adapted from smart_home_hybrid_vc_demo.py to work with Supabase data
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import numpy as np
import pandas as pd
from openai import OpenAI

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
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Fetch properties from Supabase database with filters
    """
    if not supabase:
        return []

    # Build query
    query = supabase.table("properties").select(
        "id, address, city, state, zip_code, coordinates, "
        "listing_price, bedrooms, bathrooms, square_feet, lot_size, "
        "property_type, year_built, description, schools, "
        "zillow_property_id, data_source"
    )

    # Apply filters
    if min_price > 0:
        query = query.gte("listing_price", min_price)
    if max_price < 999999999:
        query = query.lte("listing_price", max_price)
    if min_beds > 0:
        query = query.gte("bedrooms", min_beds)
    if min_baths > 0:
        query = query.gte("bathrooms", min_baths)

    # Property type filter
    if property_types:
        query = query.in_("property_type", property_types)

    # Area filter
    if preferred_areas:
        query = query.in_("city", preferred_areas)

    query = query.limit(limit)

    response = query.execute()

    # Convert to list of dicts
    properties = []
    for prop in response.data:
        # Normalize structure to match original ML code expectations
        normalized = {
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
    Rule-based scoring based on budget fit, property features, and schools
    """
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
        # Score higher for properties in the middle of budget range
        budget_range = prefs.budget_max - prefs.budget_min
        if budget_range > 0:
            distance_from_min = price - prefs.budget_min
            ratio = distance_from_min / budget_range
            # Peak score at 40-60% of budget range
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
    description_lower = listing.get("description", "").lower()
    property_type_lower = listing.get("propertyType", "").lower()

    must_have_matches = 0
    for must in prefs.must_haves:
        if must.lower() in description_lower or must.lower() in property_type_lower:
            must_have_matches += 1

    if prefs.must_haves:
        must_have_ratio = must_have_matches / len(prefs.must_haves)
        score += must_have_ratio * 10
        if must_have_matches > 0:
            reasons.append(f"Has {must_have_matches}/{len(prefs.must_haves)} must-haves")

    return score, reasons


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
        limit=limit
    )

    if not listings:
        return pd.DataFrame()

    # Enrich with schools data
    for listing in listings:
        enrich_with_schools_data(listing)

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
        features = {
            "price": listing.get("price", 0),
            "bedrooms": listing.get("bedrooms", 0),
            "bathrooms": listing.get("bathrooms", 0),
            "sqft": listing.get("livingArea", 0),
            "lot_size": listing.get("lotSize", 0),
            "year_built": listing.get("yearBuilt", 0) or 0,
            "avg_school_rating": listing.get("avg_school_rating", 0),
            "price_per_sqft": listing.get("price", 0) / listing.get("livingArea", 1) if listing.get("livingArea", 0) > 0 else 0
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

    # Calculate hybrid score
    hybrid_scores = (
        w_llm * np.array(llm_scores) +
        w_ml * ml_scores +
        w_rule * rule_scores_norm
    )

    # Create results DataFrame
    results = []
    for i, listing in enumerate(listings):
        result = {
            "zpid": listing.get("zpid", ""),
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
            "ml_score": ml_scores[i],
            "rule_score": rule_scores_norm[i],
            "match_reasons": rule_reasons[i]
        }
        results.append(result)

    df = pd.DataFrame(results)
    df = df.sort_values("hybrid_score", ascending=False).reset_index(drop=True)

    return df


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
                        budget_min=profile.get("price_min", 0),
                        budget_max=profile.get("price_max", 999999999),
                        must_haves=profile.get("must_have_features", []),
                        nice_to_haves=profile.get("nice_to_have_features", []),
                        preferred_areas=profile.get("preferred_areas", []),
                        property_types=profile.get("property_type_preferences", [])
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
