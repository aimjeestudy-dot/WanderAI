import logging
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.schemas import (
    ItineraryGenerateRequest,
    Itinerary,
    RecommendationRequest,
    RecommendationResponse,
    SaveItineraryRequest,
    SystemStatus,
)
from app.services.gemini_service import (
    generate_itinerary_with_gemini,
    generate_recommendations,
)
from app.services.supabase_service import supabase_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("travel_planner")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Personalized Travel Itinerary Planner powered by FastAPI, Google Gemini, and Supabase."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


# APIRouter mounted at both /api and root to guarantee zero 404s from prefix mismatches
api_router = APIRouter()


@api_router.get("/status", response_model=SystemStatus, tags=["System"])
@api_router.get("/health", response_model=SystemStatus, tags=["System"])
async def get_system_status():
    """
    Returns live connectivity status for Gemini and Supabase integrations.
    """
    gemini_ready = bool(settings.GEMINI_API_KEY)
    supabase_ready = supabase_service.is_configured
    storage_type = "supabase" if supabase_ready else "local_storage"

    messages = []
    if gemini_ready:
        messages.append("Google Gemini AI connected.")
    else:
        messages.append("Gemini running in Demo Mode (set GEMINI_API_KEY in backend/.env for live AI).")

    if supabase_ready:
        messages.append("Supabase cloud database connected.")
    else:
        messages.append("Using persistent local JSON storage (set SUPABASE_URL and SUPABASE_ANON_KEY for cloud sync).")

    return SystemStatus(
        status="healthy",
        gemini_configured=gemini_ready,
        gemini_model=settings.GEMINI_MODEL,
        supabase_configured=supabase_ready,
        storage_type=storage_type,
        message=" | ".join(messages)
    )


@api_router.post("/recommendations", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_destination_recommendations(req: RecommendationRequest):
    """
    Recommends tailored destinations based on travel style, budget, duration, and interests.
    """
    try:
        return await generate_recommendations(req)
    except Exception as e:
        logger.error("Recommendation error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@api_router.post("/itineraries/generate", response_model=Itinerary, tags=["Itineraries"])
async def generate_itinerary(req: ItineraryGenerateRequest):
    """
    Builds a structured prompt from user preferences and generates a day-by-day travel itinerary.
    """
    try:
        itinerary = await generate_itinerary_with_gemini(req)
        return itinerary
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error("Itinerary generation failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating itinerary: {str(e)}"
        )


@api_router.post("/itineraries", tags=["Itineraries"])
async def save_itinerary(req: SaveItineraryRequest):
    """
    Saves an itinerary to Supabase (or local storage if Supabase credentials are not set).
    """
    try:
        result = await supabase_service.save_itinerary(req)
        return result
    except Exception as e:
        logger.error("Save itinerary failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save itinerary: {str(e)}"
        )


@api_router.get("/itineraries", tags=["Itineraries"])
async def list_itineraries():
    """
    Lists all saved itineraries.
    """
    try:
        items = await supabase_service.list_itineraries()
        return {"count": len(items), "itineraries": items}
    except Exception as e:
        logger.error("List itineraries failed: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list itineraries: {str(e)}"
        )


@api_router.get("/itineraries/{itinerary_id}", tags=["Itineraries"])
async def get_itinerary(itinerary_id: str):
    """
    Retrieves a single itinerary by ID.
    """
    item = await supabase_service.get_itinerary(itinerary_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found."
        )
    return item


@api_router.delete("/itineraries/{itinerary_id}", tags=["Itineraries"])
async def delete_itinerary(itinerary_id: str):
    """
    Deletes an itinerary by ID.
    """
    success = await supabase_service.delete_itinerary(itinerary_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary with ID {itinerary_id} not found or could not be deleted."
        )
    return {"status": "success", "message": f"Itinerary {itinerary_id} deleted."}


@api_router.patch("/itineraries/{itinerary_id}/notes", tags=["Itineraries"])
async def update_itinerary_notes(itinerary_id: str, payload: Dict[str, str]):
    """
    Updates custom notes on an itinerary.
    """
    notes = payload.get("notes", "")
    updated = await supabase_service.update_notes(itinerary_id, notes)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Itinerary {itinerary_id} not found."
        )
    return {"status": "success", "record": updated}


# Expose routes with both `/api` prefix and root prefix
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="")
