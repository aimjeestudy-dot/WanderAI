/**
 * WanderAI API Client
 * Securely communicates with the Python FastAPI backend proxy.
 */

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://wanderai-backend-ssup.onrender.com'
).replace(/\/+$/, '');

const API_BASE = API_ORIGIN.endsWith('/api')
  ? API_ORIGIN
  : `${API_ORIGIN}/api`;

const GENERATION_TIMEOUT_MS = 90_000;

async function fetchWithTimeout(url, options, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getSystemStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch system status (HTTP ${res.status})`);
  }
  return res.json();
}

export async function generateItinerary(payload) {
  const res = await fetchWithTimeout(`${API_BASE}/itineraries/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, GENERATION_TIMEOUT_MS, 'Generation took too long. Please try again; the app will use its demo itinerary when Gemini is available only intermittently.');

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || `Generation failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function getRecommendations(payload) {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Recommendations failed (HTTP ${res.status})`);
  }

  return res.json();
}

export async function saveItinerary(itinerary, userNotes = '') {
  const res = await fetch(`${API_BASE}/itineraries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itinerary,
      user_notes: userNotes,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to save itinerary (HTTP ${res.status})`);
  }

  return res.json();
}

export async function listItineraries() {
  const res = await fetch(`${API_BASE}/itineraries`);
  if (!res.ok) {
    throw new Error(`Failed to load saved itineraries (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.itineraries || [];
}

export async function getItinerary(id) {
  const res = await fetch(`${API_BASE}/itineraries/${id}`);
  if (!res.ok) {
    throw new Error(`Itinerary not found (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteItinerary(id) {
  const res = await fetch(`${API_BASE}/itineraries/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete itinerary (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateItineraryNotes(id, notes) {
  const res = await fetch(`${API_BASE}/itineraries/${id}/notes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update notes (HTTP ${res.status})`);
  }
  return res.json();
}
