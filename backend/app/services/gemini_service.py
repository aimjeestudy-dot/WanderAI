import json
import logging
import re
from datetime import datetime, timezone
from typing import Dict, Any, List
import httpx

from app.config import settings
from app.models.schemas import (
    ItineraryGenerateRequest,
    Itinerary,
    DayPlan,
    Activity,
    RecommendationRequest,
    DestinationRecommendation,
    RecommendationResponse,
)

logger = logging.getLogger(__name__)


def build_itinerary_prompt(req: ItineraryGenerateRequest) -> str:
    """
    Builds a structured prompt incorporating all user travel preferences,
    constraints, and requiring clean JSON conforming to our schema.
    """
    interests_str = ", ".join(req.interests)
    dietary_str = req.dietary_restrictions if req.dietary_restrictions else "None specified"
    budget_detail = f"{req.budget_level}"
    if req.approximate_budget:
        budget_detail += f" (Approx target: {req.approximate_budget})"

    notes_str = req.additional_notes if req.additional_notes else "None"

    prompt = f"""You are an elite, world-class travel planner and local concierge.
Generate a comprehensive, realistic, and inspiring day-by-day travel itinerary based strictly on the user's travel preferences:

USER PREFERENCES:
- Destination: {req.destination}
- Duration: {req.duration_days} days
- Budget Tier: {budget_detail}
- Travel Style: {req.travel_style}
- Number of Travelers: {req.number_of_travelers}
- Specific Interests: {interests_str}
- Pace of Travel: {req.pace or 'Balanced'}
- Dietary Needs: {dietary_str}
- Special Requests / Notes: {notes_str}

CRITICAL INSTRUCTIONS:
1. Provide an authentic, practical day-by-day schedule for all {req.duration_days} days.
2. For each day, include 3 distinct activities: Morning, Afternoon, and Evening.
3. Keep travel distances realistic within each day (group sights by neighborhood).
4. Tailor food and activities to their budget tier ({req.budget_level}) and interests ({interests_str}).
5. Include local insider tips (best photo spots, avoiding crowds, booking tips).
6. Provide an estimated total trip cost estimate suited for {req.number_of_travelers} travelers.
7. Return your response as a valid, pure JSON object with NO markdown formatting around it (or wrapped in ```json ... ```), following this exact JSON structure:

{{
  "title": "{req.duration_days}-Day {req.travel_style} Exploration of {req.destination}",
  "destination": "{req.destination}",
  "summary": "Compelling 2-3 sentence overview of this curated trip.",
  "duration_days": {req.duration_days},
  "budget_level": "{req.budget_level}",
  "travel_style": "{req.travel_style}",
  "number_of_travelers": {req.number_of_travelers},
  "estimated_total_cost": "Estimated cost breakdown (e.g. $1,200 - $1,600 total)",
  "days": [
    {{
      "day_number": 1,
      "theme": "Arrival, Historic Landmarks & Sunset Dining",
      "activities": [
        {{
          "time_of_day": "Morning",
          "title": "Iconic Landmark Tour",
          "description": "Engaging description of the morning experience.",
          "location": "Neighborhood or specific site",
          "estimated_cost": "Free or $15/person",
          "insider_tip": "Arrive 15 minutes before opening to beat tour buses."
        }},
        {{
          "time_of_day": "Afternoon",
          "title": "Local Artisan Market & Walk",
          "description": "Detailed afternoon activity.",
          "location": "Central District",
          "estimated_cost": "$25/person",
          "insider_tip": "Try the signature street snack here."
        }},
        {{
          "time_of_day": "Evening",
          "title": "Panoramic Sunset & Regional Cuisine",
          "description": "Atmospheric evening experience.",
          "location": "Riverfront or Scenic Overlook",
          "estimated_cost": "$40/person",
          "insider_tip": "Reservations recommended 3 days ahead."
        }}
      ],
      "local_food_recommendations": [
        "Regional specialty dish name and where to get it",
        "Must-try local dessert or street food"
      ]
    }}
  ],
  "packing_checklist": [
    "Comfortable walking footwear",
    "Adapter plug & power bank",
    "Weather-appropriate jacket"
  ],
  "safety_and_transport_tips": [
    "Best way to get around (Metro pass, rideshare, bikes)",
    "Local etiquette or safety note"
  ]
}}
"""
    return prompt


def build_recommendation_prompt(req: RecommendationRequest) -> str:
    interests_str = ", ".join(req.interests)
    vibe = req.preferred_region_or_vibe if req.preferred_region_or_vibe else "worldwide popular destinations"
    prompt = f"""You are an expert travel consultant.
Recommend exactly 4 ideal travel destinations tailored to these traveler preferences:
- Budget Tier: {req.budget_level}
- Travel Style: {req.travel_style}
- Duration: {req.duration_days} days
- Interests: {interests_str}
- Preferred Region or Vibe: {vibe}

Return pure JSON matching this exact structure:
{{
  "recommendations": [
    {{
      "destination": "Kyoto",
      "country": "Japan",
      "tagline": "Timeless Temples, Bamboo Groves & Gastronomic Delights",
      "match_score": 96,
      "why_it_fits": "Perfect for your interest in culture and food within a moderate budget.",
      "best_time_to_visit": "October to November or March to May",
      "highlight_activities": ["Fushimi Inari morning hike", "Gion evening food walk", "Arashiyama bamboo grove"],
      "estimated_daily_cost": "$110 - $160 per person/day"
    }}
  ]
}}
"""
    return prompt


async def generate_itinerary_with_gemini(req: ItineraryGenerateRequest) -> Itinerary:
    prompt = build_itinerary_prompt(req)

    # If Gemini API key is configured, call real Gemini API
    if settings.GEMINI_API_KEY:
        try:
            logger.info("Calling Gemini API with model: %s", settings.GEMINI_MODEL)
            raw_text = await _call_gemini_api(prompt, model=settings.GEMINI_MODEL)
            data = _clean_and_parse_json(raw_text)

            # Construct validated Itinerary object
            itinerary = Itinerary(
                title=data.get("title", f"{req.duration_days}-Day Trip to {req.destination}"),
                destination=data.get("destination", req.destination),
                summary=data.get("summary", f"Custom travel plan for {req.destination}."),
                duration_days=req.duration_days,
                budget_level=req.budget_level,
                travel_style=req.travel_style,
                number_of_travelers=req.number_of_travelers,
                estimated_total_cost=data.get("estimated_total_cost", "Estimated based on preferences"),
                days=[DayPlan(**day) for day in data.get("days", [])],
                packing_checklist=data.get("packing_checklist", []),
                safety_and_transport_tips=data.get("safety_and_transport_tips", []),
                prompt_used=prompt,
                is_demo_mode=False,
                created_at=datetime.utcnow().isoformat()
            )
            return itinerary
        except Exception as e:
            logger.error("Error calling Gemini API: %s. Falling back to local demo generator.", str(e))
            # A live provider failure should never leave the trip planner waiting or unusable.
            fallback = _generate_demo_itinerary(req, prompt)
            fallback.summary += " Live Gemini was temporarily unavailable, so this ready-to-use itinerary was generated locally."
            return fallback

    # If no API key is provided, use high-quality local generator clearly marked as demo
    logger.info("No GEMINI_API_KEY configured. Using local demo generator.")
    return _generate_demo_itinerary(req, prompt)


async def generate_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    prompt = build_recommendation_prompt(req)

    if settings.GEMINI_API_KEY:
        try:
            raw_text = await _call_gemini_api(prompt, model=settings.GEMINI_MODEL)
            data = _clean_and_parse_json(raw_text)
            recs = [DestinationRecommendation(**item) for item in data.get("recommendations", [])]
            return RecommendationResponse(
                recommendations=recs,
                is_demo_mode=False,
                source_message="Real-time AI recommendations generated by Google Gemini."
            )
        except Exception as e:
            logger.error("Error generating recommendations with Gemini: %s", str(e))

    # Demo fallback recommendations matching interests
    return _generate_demo_recommendations(req)


async def _call_gemini_api(prompt: str, model: str = "gemini-3.8-flash") -> str:
    """
    Calls Google Gemini REST API using httpx with generationConfig for JSON response.
    """
    # Clean up model name if user set just flash
    model_name = model if "/" in model else f"models/{model}"
    url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    }

    # Gemini can occasionally queue requests under load.  A short deadline lets
    # the caller show a complete local itinerary instead of a long spinner.
    timeout_seconds = settings.GEMINI_TIMEOUT_SECONDS
    timeout = httpx.Timeout(timeout_seconds, connect=min(3.0, timeout_seconds))
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload)

        if response.status_code != 200:
            error_detail = response.text
            try:
                err_json = response.json()
                error_detail = err_json.get("error", {}).get("message", error_detail)
            except Exception:
                pass
            raise RuntimeError(f"Gemini API returned HTTP {response.status_code}: {error_detail}")

        res_data = response.json()
        candidates = res_data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned empty candidates.")

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise RuntimeError("Gemini returned no content parts.")

        return parts[0].get("text", "")


def _clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Cleans markdown formatting and parses JSON string.
    """
    cleaned = raw_text.strip()
    # Strip markdown code blocks if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as err:
        logger.error("JSON decode error on raw text: %s", raw_text)
        raise ValueError(f"Failed to parse Gemini response as JSON: {err}")


def _generate_demo_itinerary(req: ItineraryGenerateRequest, prompt: str) -> Itinerary:
    """
    Generates a realistic, highly personalized demo itinerary when GEMINI_API_KEY is not provided.
    Clearly marks is_demo_mode = True.
    """
    dest = req.destination
    days: List[DayPlan] = []

    # Archetype activity themes
    themes = [
        ("Arrival, Historic City Center & Sunset Views", [
            ("Morning", f"Welcome to {dest}: Historic Old Quarter Walk", f"Stroll through the historic center of {dest}, observing heritage architecture and bustling public plazas.", f"{dest} Old Town", "Free", "Wear comfortable shoes as the streets are cobblestone."),
            ("Afternoon", f"Iconic Landmark & Artisan Market", f"Explore the premier museum or historic landmark in {dest}, followed by an artisan craft market.", f"{dest} Central Plaza", "$15 - $25/person", "Visit after 2 PM to avoid peak group tours."),
            ("Evening", f"Welcome Dinner & Scenic Overlook", f"Enjoy authentic regional dining followed by an illuminated view over {dest}.", f"Panoramic Viewpoint / Old Riverfront", "$30 - $60/person", "Book an outdoor table 30 minutes before sunset.")
        ]),
        ("Culture, Hidden Alleys & Culinary Secrets", [
            ("Morning", f"Neighborhood Coffee Culture & Secret Gardens", f"Experience local morning life with roasted coffee and pastries, then discover a peaceful tucked-away garden.", f"Bohemian District, {dest}", "$10/person", "Locals take espresso standing at the bar for half price."),
            ("Afternoon", f"Culinary Tasting Walk & Street Flavors", f"Sample 4-5 regional signature snacks, cheeses, and street delicacies guided by local favorites.", f"Central Market Hall", "$20 - $35/person", "Keep cash handy; some traditional stalls do not take cards."),
            ("Evening", f"Evening Cultural Performance or Night Walk", f"Immerse yourself in live acoustic music, theater, or a guided lantern walk.", f"Arts District", "$25/person", "Arrive 20 minutes before start time.")
        ]),
        ("Nature, Scenic Discovery & Panoramic Trails", [
            ("Morning", f"Scenic Natural Escape & Viewpoint Hike", f"Head just outside the urban core to breathe fresh air and capture panoramic views of {dest}.", f"{dest} Hills / Waterfront Reserve", "Free / $5 park fee", "Start early for morning mist and golden hour photography."),
            ("Afternoon", f"Lakeside or Seaside Lunch & Leisure", f"Relax at a waterfront bistro enjoying fresh local produce and chilled regional refreshments.", f"Scenic Waterfront Promenade", "$25/person", "Order the daily catch or seasonal chef special."),
            ("Evening", f"Sunset Cruise or Harbor Walk", f"Take in the sunset from the water or from a terrace bar overlooking the marina.", f"Harbor Boardwalk", "$30/person", "Bring a light windbreaker as temperature drops by the water.")
        ]),
        ("Art, Architecture & Unique Local Experiences", [
            ("Morning", f"World-Class Contemporary Art & Design", f"Tour stunning design galleries and modern installations reflecting the creative pulse of {dest}.", f"Design District", "$18/person", "Many museums offer student/senior discounts with ID."),
            ("Afternoon", f"Independent Boutiques & Specialty Souvenirs", f"Shop for handcrafted leather, ceramics, local spices, and books in boutique lanes.", f"Artisan Quarter", "Varies", "Look for the certified local craft badge to avoid mass imports."),
            ("Evening", f"Rooftop Dining with Skyline Ambiance", f"Celebrate the trip with creative cocktails/mocktails and chef-inspired regional plates.", f"Skyline Lounge, {dest}", "$45 - $80/person", "Dress code is smart casual.")
        ]),
        ("Relaxation, Spa, and Farewell Celebration", [
            ("Morning", f"Leisurely Brunch & Botanical Walk", f"Sleep in and treat yourself to an artisanal brunch followed by lush botanical gardens.", f"Green Belt Park", "$20/person", "Rent a local city bike to glide through the park paths."),
            ("Afternoon", f"Thermal Bath / Traditional Spa or Tea Ceremony", f"Unwind and rejuvenate with local wellness traditions unique to this region.", f"Heritage Bathhouse / Tea Pavilion", "$35 - $70/person", "Bring your own sandals or flip-flops."),
            ("Evening", f"Grand Farewell Feast & Night Sky Stargazing", f"A memorable multi-course dinner reflecting back on your highlights in {dest}.", f"Historic Courtyard Restaurant", "$50 - $90/person", "Ask the chef for the house dessert pairing.")
        ])
    ]

    for d in range(1, req.duration_days + 1):
        theme_idx = (d - 1) % len(themes)
        theme_title, act_data = themes[theme_idx]

        day_acts = [
            Activity(
                time_of_day=tod,
                title=f"Day {d} {title}",
                description=desc,
                location=loc,
                estimated_cost=cost,
                insider_tip=tip
            )
            for tod, title, desc, loc, cost, tip in act_data
        ]

        days.append(DayPlan(
            day_number=d,
            theme=f"Day {d}: {theme_title}",
            activities=day_acts,
            local_food_recommendations=[
                f"Signature local specialty of {dest}",
                f"Handcrafted seasonal treat at central market"
            ]
        ))

    cost_estimates = {
        "Budget": f"${req.duration_days * 50 * req.number_of_travelers} - ${req.duration_days * 85 * req.number_of_travelers} USD total",
        "Moderate": f"${req.duration_days * 120 * req.number_of_travelers} - ${req.duration_days * 200 * req.number_of_travelers} USD total",
        "Luxury": f"${req.duration_days * 350 * req.number_of_travelers} - ${req.duration_days * 600 * req.number_of_travelers} USD total"
    }

    return Itinerary(
        title=f"{req.duration_days}-Day {req.travel_style} Trip to {req.destination}",
        destination=req.destination,
        summary=f"Tailored {req.duration_days}-day itinerary for {req.number_of_travelers} {req.travel_style.lower()} traveler(s) emphasizing {', '.join(req.interests[:3])} at a {req.budget_level.lower()} budget.",
        duration_days=req.duration_days,
        budget_level=req.budget_level,
        travel_style=req.travel_style,
        number_of_travelers=req.number_of_travelers,
        estimated_total_cost=cost_estimates.get(req.budget_level, "$800 - $1,400 USD total"),
        days=days,
        packing_checklist=[
            "Comfortable, broken-in walking shoes",
            "Universal travel adapter & high-capacity power bank",
            "Lightweight rain/wind jacket",
            "Compact daypack for daily excursions",
            "Reusable insulated water bottle"
        ],
        safety_and_transport_tips=[
            f"Download offline maps of {dest} before arriving.",
            "Utilize contactless public transit card for significant savings.",
            "Keep emergency contacts and hotel address saved in phone notes."
        ],
        prompt_used=prompt,
        is_demo_mode=True,
        created_at=datetime.now(timezone.utc).isoformat()
    )


def _generate_demo_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    destinations = [
        DestinationRecommendation(
            destination="Kyoto",
            country="Japan",
            tagline="Timeless Temples, Bamboo Groves & Gastronomic Delights",
            match_score=97,
            why_it_fits="Outstanding match for cultural heritage, scenic walking paths, and world-class food.",
            best_time_to_visit="October to November or March to May",
            highlight_activities=["Fushimi Inari morning climb", "Arashiyama Bamboo Forest", "Gion traditional tea ceremony"],
            estimated_daily_cost="$110 - $180 per person"
        ),
        DestinationRecommendation(
            destination="Lisbon & Sintra",
            country="Portugal",
            tagline="Sun-Drenched Hills, Vintage Trams & Romantic Castles",
            match_score=94,
            why_it_fits="Exceptional value for European travel with lively cafe culture and vibrant coastal views.",
            best_time_to_visit="May to June or September to October",
            highlight_activities=["Tram 28 scenic ride", "Pastéis de Belém tasting", "Pena Palace fairytale tour"],
            estimated_daily_cost="$85 - $140 per person"
        ),
        DestinationRecommendation(
            destination="Oaxaca",
            country="Mexico",
            tagline="Culinary Heartland, Indigenous Crafts & Ancient Zapotec Pyramids",
            match_score=92,
            why_it_fits="Unrivaled food traditions, vibrant craft markets, and rich indigenous art.",
            best_time_to_visit="October to March",
            highlight_activities=["Monte Albán archeological zone", "Central market culinary walk", "Artisan mezcal tasting"],
            estimated_daily_cost="$50 - $95 per person"
        ),
        DestinationRecommendation(
            destination="Reykjavik & Golden Circle",
            country="Iceland",
            tagline="Dramatic Waterfalls, Geothermal Lagoons & Aurora Skies",
            match_score=89,
            why_it_fits="Breathtaking natural wonders, geothermal spas, and pristine outdoor adventures.",
            best_time_to_visit="September to April (for Aurora) or June to August (midnight sun)",
            highlight_activities=["Blue Lagoon thermal bath", "Gullfoss waterfall", "South coast black sand beach walk"],
            estimated_daily_cost="$170 - $280 per person"
        )
    ]
    return RecommendationResponse(
        recommendations=destinations,
        is_demo_mode=True,
        source_message="Smart recommendations curated based on your selected interests and budget tier. (Connect GEMINI_API_KEY for dynamic real-time AI generation)."
    )
