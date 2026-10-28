from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class TravelPreferenceBase(BaseModel):
    budget_level: str = Field(
        default="Moderate",
        description="Budget tier: Budget, Moderate, or Luxury"
    )
    travel_style: str = Field(
        default="Couple",
        description="Style: Solo, Couple, Family, Friends, Business"
    )
    number_of_travelers: int = Field(
        default=2,
        ge=1,
        le=50,
        description="Number of people traveling"
    )
    interests: List[str] = Field(
        default_factory=lambda: ["Culture & History", "Food & Dining"],
        description="Selected interests and hobbies"
    )
    pace: Optional[str] = Field(
        default="Balanced",
        description="Pace: Relaxed, Balanced, or Fast-paced"
    )
    dietary_restrictions: Optional[str] = Field(
        default="",
        description="Dietary notes (e.g. Vegetarian, Halal, Gluten-free)"
    )

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError("Please select at least one interest.")
        return v

class ItineraryGenerateRequest(TravelPreferenceBase):
    destination: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Destination city or region (e.g. Tokyo, Japan or Amalfi Coast, Italy)"
    )
    duration_days: int = Field(
        default=4,
        ge=1,
        le=30,
        description="Duration of the trip in days (1 to 30)"
    )
    approximate_budget: Optional[str] = Field(
        default="",
        description="Optional specific budget (e.g. $1500 USD or €2000)"
    )
    additional_notes: Optional[str] = Field(
        default="",
        max_length=500,
        description="Any specific sights or special requests"
    )

    @field_validator("destination")
    @classmethod
    def clean_destination(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 2:
            raise ValueError("Destination must be at least 2 characters.")
        return stripped

class RecommendationRequest(BaseModel):
    budget_level: str = Field(default="Moderate")
    travel_style: str = Field(default="Couple")
    duration_days: int = Field(default=5, ge=1, le=30)
    interests: List[str] = Field(default_factory=lambda: ["Culture & History", "Nature & Adventure"])
    preferred_region_or_vibe: Optional[str] = Field(
        default="",
        description="e.g. Europe, Tropical beach, Historic towns, East Asia"
    )

class DestinationRecommendation(BaseModel):
    destination: str
    country: str
    tagline: str
    match_score: int = Field(ge=50, le=100)
    why_it_fits: str
    best_time_to_visit: str
    highlight_activities: List[str]
    estimated_daily_cost: str

class RecommendationResponse(BaseModel):
    recommendations: List[DestinationRecommendation]
    is_demo_mode: bool
    source_message: str

class Activity(BaseModel):
    time_of_day: str  # Morning, Afternoon, Evening
    title: str
    description: str
    location: str
    estimated_cost: str
    insider_tip: Optional[str] = None

class DayPlan(BaseModel):
    day_number: int
    theme: str
    activities: List[Activity]
    local_food_recommendations: List[str] = Field(default_factory=list)

class Itinerary(BaseModel):
    id: Optional[str] = None
    title: str
    destination: str
    summary: str
    duration_days: int
    budget_level: str
    travel_style: str
    number_of_travelers: int
    estimated_total_cost: str
    days: List[DayPlan]
    packing_checklist: List[str] = Field(default_factory=list)
    safety_and_transport_tips: List[str] = Field(default_factory=list)
    prompt_used: Optional[str] = None
    is_demo_mode: bool = False
    created_at: Optional[str] = None
    user_id: Optional[str] = None
    notes: Optional[str] = ""

class SaveItineraryRequest(BaseModel):
    itinerary: Itinerary
    user_notes: Optional[str] = ""

class SystemStatus(BaseModel):
    status: str
    gemini_configured: bool
    gemini_model: str
    supabase_configured: bool
    storage_type: str  # "supabase" or "local_storage"
    message: str
