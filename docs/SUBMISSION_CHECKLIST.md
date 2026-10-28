# WanderAI — College Capstone Submission Checklist

Use this checklist to verify that all components, repositories, documentation, and deployment configurations are ready for evaluation and submission.

---

## 1. Project Information & Links

| Asset | Link / Identifier | Verification Status |
|---|---|---|
| **Project Title** | WanderAI — Personalized Travel Itinerary Planner | Verified |
| **GitHub Repository** | [https://github.com/aimjeestudy-dot/WanderAI](https://github.com/aimjeestudy-dot/WanderAI) | Public / Accessible |
| **Live Frontend (Vercel)** | [https://wander-ai-eight.vercel.app](https://wander-ai-eight.vercel.app) | HTTP 200 / Deployed |
| **Backend API (Render)** | [https://wanderai-backend-ssup.onrender.com](https://wanderai-backend-ssup.onrender.com) | See Deployment Status below |
| **Local Backend Target** | `http://127.0.0.1:8000` | Verified 100% operational |

---

## 2. Deployment Status & Hosting Inspection

- [x] **Frontend Deployment (Vercel):**
  - Hosted at [https://wander-ai-eight.vercel.app](https://wander-ai-eight.vercel.app).
  - Production bundle generated cleanly via Vite in 336 ms.
  - SPA routing handled via `frontend/vercel.json` rewrite (`/(.*) -> /index.html`).
  - API base URL resolves environment variables (`VITE_API_BASE_URL` or `VITE_API_URL`).

- [!] **Backend Deployment (Render):**
  - Hostname tested: `https://wanderai-backend-ssup.onrender.com`.
  - Current response: HTTP 404 with header `x-render-routing: no-server`.
  - **Diagnostic finding:** In Render's architecture, `x-render-routing: no-server` signifies that the Render gateway currently has no active web service registered under the exact subdomain `wanderai-backend-ssup.onrender.com` (either because the service was named differently, e.g. `wanderai-backend`, suspended/paused in the Render dashboard, or awaiting redeployment).
  - **Required Action:** If demonstrating live via Render, log into [dashboard.render.com](https://dashboard.render.com), check the Web Service name/URL, verify environment variables are populated, and trigger a manual redeploy. If demonstrating locally for viva, run `uvicorn app.main:app` and `npm run dev`.

---

## 3. Automated Test Results

- [x] **Pytest Automated Backend Test Suite:**
  - Ran command: `./backend/.venv/bin/pytest backend/tests -v`
  - Total tests executed: **8**
  - Passed: **8**
  - Failed: **0**
  - Test breakdown:
    1. `test_root_endpoint`: PASSED (HTTP 200, online status)
    2. `test_system_status`: PASSED (HTTP 200, system health report)
    3. `test_system_status_without_prefix`: PASSED (HTTP 200, dual-prefix support)
    4. `test_generate_itinerary_validation_error`: PASSED (HTTP 422 schema enforcement)
    5. `test_generate_itinerary_success`: PASSED (HTTP 200 structured itinerary generation)
    6. `test_gemini_timeout_uses_demo_itinerary`: PASSED (graceful local generator failover)
    7. `test_recommendations_endpoint`: PASSED (HTTP 200 destination recommendation array)
    8. `test_itinerary_crud_flow`: PASSED (full create, read, update notes, delete cycle)

- [x] **Frontend Production Build & Linter:**
  - Ran command: `npm run build` in `frontend/`
  - Output: 0 compilation errors, bundle built in 336 ms.
  - Ran command: `npm run lint` via `oxlint`: 0 syntax or runtime errors.

---

## 4. Integration Verification

### Google Gemini Generative AI
- [x] API key read securely from backend environment (`GEMINI_API_KEY`).
- [x] API key is valid and authenticated against Google Generative Language API (HTTP 200 on `v1beta/models`).
- [x] Supported model identified: `gemini-3.5-flash` successfully generated real AI text during testing.
- [x] Primary model `gemini-3.8-flash` configured with automatic failover to `gemini-3.5-flash` when encountering HTTP 503 high-demand spikes.
- [x] Request timeout updated from 8s to 30s to accommodate realistic LLM generation times.
- [x] Local demo generator active and explicitly labelled (`is_demo_mode = True`) if upstream calls fail.

### Supabase Cloud Database (PostgreSQL)
- [x] Credentials configured in backend environment (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [x] Real cloud table `itineraries` verified via REST API:
  - Saved live test record: `458a147b-af82-4bbd-bab6-1085b46d9109` (HTTP 201).
  - Listed itineraries: retrieved records successfully (HTTP 200).
  - Deleted live test record: verified removal (HTTP 204).
- [x] Row Level Security (RLS) policies defined in `backend/supabase_schema.sql`.
- [x] Local JSON storage fallback (`backend/data/saved_itineraries.json`) tested and functional.

---

## 5. Required Environment Variables

Ensure these variable **names** (do NOT commit values to Git!) are configured in `backend/.env` for local execution and in the Render dashboard for production:

```env
# Google Gemini Generative AI
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TIMEOUT_SECONDS=30

# Supabase Cloud Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

And in Vercel environment variables (optional, defaults to Render fallback):
```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

---

## 6. Screenshots Still Needed for College Submission Packet

To assemble your physical or PDF submission binder, capture these screenshots:

1. **Homepage & Hero Banner:** Showing the WanderAI logo, dark nebula glassmorphic theme, and navigation tabs.
2. **Trip Planning Form:** Showing filled parameters (destination, duration, budget, travel style, interests).
3. **Generated Itinerary Timeline:** Showing Morning, Afternoon, and Evening activities with cost estimates and insider tips.
4. **Interactive Packing Checklist:** Showing items with checked and unchecked states.
5. **Explore Recommendations Tab:** Showing curated destination cards with match percentages.
6. **Saved Trips Tab:** Showing saved itineraries with custom notes and the "Delete" option.
7. **System Status Panel:** Showing live green indicators for Gemini AI and Supabase database.
8. **Swagger API Docs (`/docs`):** Showing interactive FastAPI route documentation.
9. **Terminal Pytest Output:** Showing 8 passed tests in green.
10. **Supabase Table Editor:** Showing the `itineraries` table rows in the Supabase web dashboard.

---

## 7. Submission Documentation Index

- [x] [README.md](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/README.md) — Complete setup guide, features, API routes table, and architecture.
- [x] [docs/PROJECT_REPORT.md](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/docs/PROJECT_REPORT.md) — Formal academic report with abstract, architecture, schema, tests, and limitations.
- [x] [docs/VIVA_PREPARATION.md](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/docs/VIVA_PREPARATION.md) — Comprehensive viva preparation guide with 25 questions and answers.
- [x] [docs/SUBMISSION_CHECKLIST.md](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/docs/SUBMISSION_CHECKLIST.md) — This submission checklist.

---

## 8. Remaining Manual Steps for Submission

1. **Verify Render Service Name:** Log into [dashboard.render.com](https://dashboard.render.com) and verify your backend service's exact URL (e.g. `wanderai-backend.onrender.com` vs `wanderai-backend-ssup.onrender.com`). If different, update the environment variable `VITE_API_BASE_URL` in your Vercel project settings.
2. **Review Git Commits:** Ensure the latest code is committed and pushed to GitHub main branch.
3. **Take Screenshots:** Use the checklist above to take 5-10 screenshots of the running app for your final document or slide deck.
4. **Print / Export PDF:** Convert `docs/PROJECT_REPORT.md` to PDF if your college requires hard-copy submission.
