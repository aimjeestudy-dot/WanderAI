/**
 * WanderAI API Client
 * Securely communicates with the Python FastAPI backend proxy.
 */

// In local development, use Vite proxy ('/api') to avoid CORS and port mismatches.
// In production, use VITE_API_BASE_URL (or VITE_API_URL), falling back to the deployed Render backend.
const defaultOrigin = import.meta.env.DEV
  ? ''
  : 'https://wanderai-backend-ssup.onrender.com';

const rawOrigin = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  defaultOrigin
).replace(/\/+$/, '');

export const API_BASE = !rawOrigin
  ? '/api'
  : (rawOrigin.endsWith('/api') ? rawOrigin : `${rawOrigin}/api`);

export const GENERATION_TIMEOUT_MS = 90_000;

async function fetchWithTimeout(url, options, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot reach backend at ${url}. Please verify server is running and accessible.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getSystemStatus() {
  const res = await fetchWithTimeout(
    `${API_BASE}/status`,
    {},
    15_000,
    'Status check timed out. Backend may be waking up.'
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch system status (HTTP ${res.status})`);
  }
  return res.json();
}

export async function generateItinerary(payload) {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    GENERATION_TIMEOUT_MS,
    'Itinerary generation took longer than 90 seconds. If Render was waking from a cold start, please retry now.'
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || `Generation failed (HTTP ${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export async function getRecommendations(payload) {
  const res = await fetchWithTimeout(
    `${API_BASE}/recommendations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    30_000,
    'Recommendations request timed out.'
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Recommendations failed (HTTP ${res.status})`);
  }

  return res.json();
}

export async function saveItinerary(itinerary, userNotes = '') {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itinerary,
        user_notes: userNotes,
      }),
    },
    20_000,
    'Save request timed out.'
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to save itinerary (HTTP ${res.status})`);
  }

  return res.json();
}

export async function listItineraries() {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries`,
    {},
    20_000,
    'Loading saved itineraries timed out.'
  );
  if (!res.ok) {
    throw new Error(`Failed to load saved itineraries (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.itineraries || [];
}

export async function getItinerary(id) {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries/${id}`,
    {},
    15_000,
    'Fetching itinerary timed out.'
  );
  if (!res.ok) {
    throw new Error(`Itinerary not found (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteItinerary(id) {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries/${id}`,
    {
      method: 'DELETE',
    },
    15_000,
    'Delete request timed out.'
  );
  if (!res.ok) {
    throw new Error(`Failed to delete itinerary (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateItineraryNotes(id, notes) {
  const res = await fetchWithTimeout(
    `${API_BASE}/itineraries/${id}/notes`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    },
    15_000,
    'Update notes request timed out.'
  );
  if (!res.ok) {
    throw new Error(`Failed to update notes (HTTP ${res.status})`);
  }
  return res.json();
}
