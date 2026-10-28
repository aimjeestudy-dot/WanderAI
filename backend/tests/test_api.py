import pytest
import httpx
from types import SimpleNamespace
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import ItineraryGenerateRequest
from app.services import gemini_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def use_local_generator_in_api_tests(monkeypatch):
    """Keep API tests deterministic and independent of an external Gemini quota."""
    monkeypatch.setattr(
        gemini_service,
        "settings",
        SimpleNamespace(GEMINI_API_KEY="", GEMINI_MODEL="test-model", GEMINI_TIMEOUT_SECONDS=1.0),
    )

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Personalized Travel" in data["app"]

def test_system_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_configured" in data
    assert "storage_type" in data

def test_system_status_without_prefix():
    """Verify that requests without /api prefix also resolve to avoid 404s."""
    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_generate_itinerary_validation_error():
    # Empty destination
    bad_payload = {
        "destination": "",
        "duration_days": 4,
        "budget_level": "Moderate",
        "travel_style": "Solo",
        "number_of_travelers": 1,
        "interests": ["Culture & History"]
    }
    response = client.post("/api/itineraries/generate", json=bad_payload)
    assert response.status_code == 422

    # Negative duration
    bad_duration = {
        "destination": "Paris",
        "duration_days": 0,
        "budget_level": "Moderate",
        "travel_style": "Solo",
        "number_of_travelers": 1,
        "interests": ["Food & Dining"]
    }
    response = client.post("/api/itineraries/generate", json=bad_duration)
    assert response.status_code == 422

def test_generate_itinerary_success():
    payload = {
        "destination": "Tokyo, Japan",
        "duration_days": 3,
        "budget_level": "Moderate",
        "travel_style": "Couple",
        "number_of_travelers": 2,
        "interests": ["Culture & History", "Food & Dining"],
        "pace": "Balanced"
    }
    response = client.post("/api/itineraries/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["destination"] == "Tokyo, Japan"
    assert data["duration_days"] == 3
    assert len(data["days"]) == 3
    for day in data["days"]:
        assert len(day["activities"]) >= 1
        assert "time_of_day" in day["activities"][0]
        assert "title" in day["activities"][0]
    assert len(data["packing_checklist"]) > 0


@pytest.mark.asyncio
async def test_gemini_timeout_uses_demo_itinerary(monkeypatch):
    """A slow Gemini request must return a usable itinerary instead of failing."""
    request = ItineraryGenerateRequest(
        destination="Lisbon, Portugal",
        duration_days=2,
        budget_level="Moderate",
        travel_style="Couple",
        number_of_travelers=2,
        interests=["Food & Dining"],
    )

    monkeypatch.setattr(
        gemini_service,
        "settings",
        SimpleNamespace(GEMINI_API_KEY="test-key", GEMINI_MODEL="test-model", GEMINI_TIMEOUT_SECONDS=1.0),
    )

    async def raise_timeout(*_args, **_kwargs):
        raise httpx.ReadTimeout("Gemini did not respond in time")

    monkeypatch.setattr(gemini_service, "_call_gemini_api", raise_timeout)
    itinerary = await gemini_service.generate_itinerary_with_gemini(request)

    assert itinerary.is_demo_mode is True
    assert itinerary.destination == "Lisbon, Portugal"
    assert len(itinerary.days) == 2
    assert "temporarily unavailable" in itinerary.summary

def test_recommendations_endpoint():
    payload = {
        "budget_level": "Moderate",
        "travel_style": "Solo",
        "duration_days": 5,
        "interests": ["Nature & Adventure", "Culture & History"]
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    first = data["recommendations"][0]
    assert "destination" in first
    assert "match_score" in first

def test_itinerary_crud_flow():
    # 1. Generate an itinerary
    gen_payload = {
        "destination": "Rome, Italy",
        "duration_days": 2,
        "budget_level": "Moderate",
        "travel_style": "Couple",
        "number_of_travelers": 2,
        "interests": ["Art & Museums", "Food & Dining"]
    }
    gen_resp = client.post("/api/itineraries/generate", json=gen_payload)
    assert gen_resp.status_code == 200
    itinerary_data = gen_resp.json()

    # 2. Save it
    save_payload = {
        "itinerary": itinerary_data,
        "user_notes": "Remember to pack comfortable sneakers for Colosseum!"
    }
    save_resp = client.post("/api/itineraries", json=save_payload)
    assert save_resp.status_code == 200
    save_result = save_resp.json()
    itin_id = save_result["itinerary_id"]
    assert itin_id is not None

    # 3. Retrieve by ID
    get_resp = client.get(f"/api/itineraries/{itin_id}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["destination"] == "Rome, Italy"
    assert "Colosseum" in fetched["notes"]

    # 4. List itineraries
    list_resp = client.get("/api/itineraries")
    assert list_resp.status_code == 200
    all_items = list_resp.json()["itineraries"]
    assert any(item["id"] == itin_id for item in all_items)

    # 5. Update notes
    patch_resp = client.patch(f"/api/itineraries/{itin_id}/notes", json={"notes": "Updated note: booked train tickets"})
    assert patch_resp.status_code == 200

    # 6. Delete itinerary
    del_resp = client.delete(f"/api/itineraries/{itin_id}")
    assert del_resp.status_code == 200

    # 7. Confirm deleted
    get_del_resp = client.get(f"/api/itineraries/{itin_id}")
    assert get_del_resp.status_code == 404


def test_cors_preflight_production_origin():
    """Verify that CORS preflight from the production Vercel domain succeeds."""
    response = client.options(
        "/api/itineraries/generate",
        headers={
            "Origin": "https://wander-ai-eight.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://wander-ai-eight.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_cors_preflight_vercel_preview_origin():
    """Verify that CORS preflight from Vercel preview deployments succeeds via regex."""
    response = client.options(
        "/api/itineraries/generate",
        headers={
            "Origin": "https://wander-ai-preview-abc.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://wander-ai-preview-abc.vercel.app"

