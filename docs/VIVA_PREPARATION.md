# WanderAI — Viva Voce & Oral Defense Preparation Guide

This guide is designed to help you confidently explain WanderAI to your university examiners, project guides, and external evaluators. It breaks down technical concepts into clear, beginner-friendly explanations and includes **25 likely viva questions with model answers**.

---

## 1. High-Level Project Summary (The "Elevator Pitch")

> **"WanderAI is an intelligent, personalized travel itinerary curator built using React and FastAPI. Instead of spending hours reading generic travel blogs, a user inputs their travel style, budget, group size, duration, and interests. Our FastAPI backend constructs a structured prompt for Google Gemini AI, which returns an authentic, chronologically organized, day-by-day itinerary (morning, afternoon, and evening activities with insider tips and cost estimates). Trips are saved to a Supabase PostgreSQL cloud database, with an automatic local JSON fallback ensuring the app never crashes even if offline or if AI rate limits are reached."**

---

## 2. Core Concepts Explained Simply

### What does React do?
**React** is a JavaScript library for building user interfaces. Instead of reloading the whole browser page when you click a button (like traditional websites did), React uses **components** (reusable Lego-like blocks of code) and a **Virtual DOM** to re-render only the specific parts of the screen that changed. In WanderAI, React handles the interactive trip form, destination cards, packing checklist checkboxes, and toast notifications.

### What does FastAPI do?
**FastAPI** is a modern, high-speed Python web framework used to build RESTful APIs. It acts as our secure **backend server**. Its jobs are:
1. Receiving HTTP requests from the React frontend.
2. Validating input data using **Pydantic** schemas so bad data is rejected immediately.
3. Keeping our API keys and database credentials secure (never revealing them to the browser).
4. Communicating with Google Gemini and Supabase asynchronously.

### How does a frontend request reach the backend?
1. The user fills out the form in React and clicks "Generate Itinerary".
2. React's `TripForm` calls `generateItinerary(payload)` in `frontend/src/services/api.js`.
3. `api.js` uses the browser's native `fetch()` API to send an `HTTP POST` request containing a JSON body to the FastAPI backend URL (e.g., `http://127.0.0.1:8000/api/itineraries/generate` or Render).
4. FastAPI's `CORSMiddleware` checks if the frontend's domain is allowed to communicate with it.
5. FastAPI matches the route `@api_router.post("/itineraries/generate")` and parses the JSON into a Pydantic `ItineraryGenerateRequest` object.
6. The route handler calls `generate_itinerary_with_gemini()`, which contacts Google Gemini.
7. Once Gemini responds with JSON, FastAPI validates it into an `Itinerary` model and returns HTTP 200 with the JSON response back to React.
8. React receives the JSON, updates its state (`setCurrentItinerary`), and renders the `ItineraryView` timeline!

### How does Gemini generate an itinerary?
We do not use Gemini like an open-ended chatbot. Instead, we use **Structured Prompt Engineering**:
1. In `backend/app/services/gemini_service.py`, `build_itinerary_prompt()` takes the user's specific inputs (e.g., Kyoto, 3 days, Moderate budget, Food & Culture).
2. It constructs a detailed prompt instructing Gemini to act as an elite travel concierge, partition each day into Morning/Afternoon/Evening, group sights by neighborhood, and output **strict, pure JSON conforming to our exact schema**.
3. We invoke Gemini's REST API with `responseMimeType: "application/json"`.
4. If the primary model (`gemini-3.8-flash`) encounters a temporary high-demand spike (HTTP 503), the service automatically retries with `gemini-3.5-flash` before falling back to local deterministic templates.

### How does Supabase store data?
**Supabase** provides an open-source managed **PostgreSQL** database in the cloud.
- We have an `itineraries` table storing columns such as `id` (UUID), `title`, `destination`, `duration_days`, `budget_level`, `notes`, and a `data` column of type `JSONB` (binary JSON).
- The `JSONB` column stores the complete day-by-day nested schedule, packing items, and tips.
- Our backend interacts with Supabase using its REST API (PostgREST), sending HTTP GET, POST, PATCH, and DELETE requests authenticated via Bearer tokens.

### What are Environment Variables?
Environment variables (`.env`) are key-value pairs stored outside the codebase on the server's operating system.
- **Why we use them:** They keep sensitive secrets (like `GEMINI_API_KEY` and `SUPABASE_ANON_KEY`) out of Git source code.
- If you commit API keys to GitHub, bots scan public repos and abuse your quota or bill your card within minutes. With `.env`, secrets remain private, while code is safe to share.

### Why is CORS needed?
**CORS (Cross-Origin Resource Sharing)** is a browser security mechanism. By default, browsers prevent scripts running on one origin (e.g., `https://wander-ai-eight.vercel.app`) from reading HTTP responses from a different origin (e.g., `https://wanderai-backend-ssup.onrender.com`).
To allow our React frontend to communicate with our FastAPI backend, FastAPI adds specific HTTP headers (`Access-Control-Allow-Origin: *` or the frontend domain) via `CORSMiddleware`.

### What are REST APIs and JSON?
- **REST (Representational State Transfer)** is an architectural pattern for web services using standard HTTP verbs:
  - `GET`: Retrieve data (e.g., `GET /api/itineraries`)
  - `POST`: Create data (e.g., `POST /api/itineraries/generate`)
  - `PATCH`: Update part of a record (e.g., `PATCH /api/itineraries/{id}/notes`)
  - `DELETE`: Remove a record (e.g., `DELETE /api/itineraries/{id}`)
- **JSON (JavaScript Object Notation)** is a lightweight, human-readable text format for transmitting structured data between programs.

### How are Vercel and Render used?
- **Vercel** hosts the **frontend**: It pulls the React code from GitHub, runs `npm run build` using Vite to create static HTML/JS/CSS bundles, and distributes them globally across high-speed Edge CDNs.
- **Render** hosts the **backend**: It pulls the Python code, sets up a virtual environment, installs `requirements.txt`, and runs Uvicorn (`uvicorn app.main:app`) as a continuous cloud web service.

---

## 3. Key Files and Their Responsibilities

| File Path | Role & Key Responsibilities |
|---|---|
| [`frontend/src/App.jsx`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/frontend/src/App.jsx) | Master state manager: active tab navigation, toasts, backend status synchronization. |
| [`frontend/src/services/api.js`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/frontend/src/services/api.js) | Central API client: environment-aware origin detection, timeout handling, error normalization. |
| [`frontend/src/components/Navbar.jsx`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/frontend/src/components/Navbar.jsx) | Navigation bar & real-time connection status pill (`Gemini AI`, `Supabase`, `Backend Offline`). |
| [`frontend/src/components/TripForm.jsx`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/frontend/src/components/TripForm.jsx) | Trip parameter input form with client-side validation and quick chips. |
| [`frontend/src/components/ItineraryView.jsx`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/frontend/src/components/ItineraryView.jsx) | Timeline schedule rendering, interactive packing checklist, Markdown exporter, save handler. |
| [`backend/app/main.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/app/main.py) | FastAPI app, CORS middleware, dual prefix APIRouter (`/api` and `""`), root health endpoint. |
| [`backend/app/config.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/app/config.py) | Pydantic / dotenv configuration reader with dynamic property getters and timeout limits. |
| [`backend/app/models/schemas.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/app/models/schemas.py) | Pydantic v2 schemas: validation rules for requests, day plans, activities, and system status. |
| [`backend/app/services/gemini_service.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/app/services/gemini_service.py) | Structured prompt builder, Gemini REST caller, model retry failover, and demo fallback engine. |
| [`backend/app/services/supabase_service.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/app/services/supabase_service.py) | Supabase PostgREST client with automatic fallback to `backend/data/saved_itineraries.json`. |
| [`backend/supabase_schema.sql`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/supabase_schema.sql) | DDL script defining the `itineraries` table, UUID generator, indexes, and Row Level Security policies. |
| [`backend/tests/test_api.py`](file:///Users/tanbhi/.gemini/antigravity-ide/scratch/travel-planner/backend/tests/test_api.py) | Automated test suite verifying validation, dual-prefix routing, CRUD, and error handling. |

---

## 4. Top 25 Viva Questions & Model Answers

### General & Architecture
**Q1: What is the main problem your project solves?**  
*Answer:* WanderAI automates the time-consuming process of travel research by taking a user's specific travel parameters and synthesizing a cohesive, realistic day-by-day itinerary with morning, afternoon, and evening sights, budget-aligned dining, and packing checklists.

**Q2: Why did you choose a decoupled architecture (separate React and FastAPI) instead of a monolithic framework like Django or Flask with templates?**  
*Answer:* Decoupling gives us a modern single-page application experience with zero full-page reloads, allows the frontend and backend to scale and deploy independently (Vercel Edge vs Render Python container), and enforces clean separation of concerns through a well-defined REST API.

**Q3: How does your frontend talk to your backend in development vs production?**  
*Answer:* In development, the Vite dev server uses a proxy (`/api` -> `http://127.0.0.1:8000`) so the browser makes relative requests without cross-origin issues. In production on Vercel, `api.js` points to the hosted Render backend URL (`VITE_API_BASE_URL`).

**Q4: How did you fix the route mismatch where the frontend called endpoints without `/api`?**  
*Answer:* In `backend/app/main.py`, we created an `APIRouter` and mounted it twice on the FastAPI application: `app.include_router(api_router, prefix="/api")` and `app.include_router(api_router, prefix="")`. This ensures that both `/api/status` and `/status` resolve to HTTP 200, making the backend completely resilient to client URL differences.

---

### Frontend & React
**Q5: What is Vite and why did you use it instead of Create React App (CRA)?**  
*Answer:* Vite is a next-generation frontend build tool powered by native ES modules in development and Rollup in production. It starts in milliseconds compared to CRA's slow Webpack bundling, and completes production builds in under 400 milliseconds.

**Q6: What is the difference between state (`useState`) and props in React?**  
*Answer:* **State** is internal data managed within a component that can change over time (e.g., `currentItinerary`, `isLoading`), causing the component to re-render. **Props** are read-only properties passed down from parent to child components (e.g., passing `itinerary` from `App` to `ItineraryView`).

**Q7: How do you prevent the UI from freezing while waiting for AI generation?**  
*Answer:* All HTTP requests in `api.js` are asynchronous (`async/await` using `fetchWithTimeout`). While waiting, React sets `isLoading = true`, displaying an animated spinner and loading message while keeping the main browser UI thread fully responsive.

**Q8: What happens in the UI if the backend goes down or is sleeping on Render?**  
*Answer:* In `App.jsx`, when the initial status check fails, `backendError` is captured. The Navbar status pill updates to show a red dot with `Backend Offline`, and the Status tab displays an informative alert notice with the backend URL and advice regarding Render cold starts.

---

### Backend & Python
**Q9: Why did you choose FastAPI over Flask?**  
*Answer:* FastAPI provides native Python asynchronous support (`async/await`) which allows high concurrent throughput when waiting for I/O operations like Gemini AI and Supabase. It also provides automatic data validation via Pydantic and automatically generates interactive OpenAPI/Swagger documentation at `/docs`.

**Q10: What is Pydantic and how is it used in your project?**  
*Answer:* Pydantic is a data validation library that uses Python type annotations. In `schemas.py`, we define models like `ItineraryGenerateRequest`. If a client sends negative days or an empty destination, Pydantic immediately rejects it with HTTP 422 Unprocessable Entity, preventing invalid data from reaching our business logic.

**Q11: What is Uvicorn?**  
*Answer:* Uvicorn is an ASGI (Asynchronous Server Gateway Interface) web server implementation for Python. It executes our FastAPI application code and handles incoming HTTP and WebSocket network connections asynchronously.

**Q12: How are environment variables loaded in the backend?**  
*Answer:* In `config.py`, we use `python-dotenv`'s `load_dotenv()` pointing to `backend/.env`. A `Settings` class exposes properties that retrieve variables dynamically via `os.getenv()`.

---

### AI & Google Gemini
**Q13: Which Gemini model does your application use, and how is it called?**  
*Answer:* The application defaults to `gemini-3.8-flash` with automatic fallback to `gemini-3.5-flash`. It calls the Google Generative Language REST API (`/v1beta/models/...:generateContent`) via Python `httpx.AsyncClient`.

**Q14: How do you guarantee that Gemini outputs valid JSON instead of conversational text?**  
*Answer:* Two techniques: First, prompt engineering with an exact JSON template and instruction to omit markdown wrappers. Second, passing `"generationConfig": {"responseMimeType": "application/json"}` in the API payload, which forces Gemini's decoder to constrain outputs to valid JSON syntax.

**Q15: What happens if Gemini API returns HTTP 503 ("high demand") or times out?**  
*Answer:* In `gemini_service.py`, our code catches HTTP 503/404 errors and automatically retries with a fallback model (`gemini-3.5-flash`). If upstream connectivity fails entirely, it gracefully calls `_generate_demo_itinerary()`, providing a complete personalized plan with `is_demo_mode = True` so the user never sees a broken screen.

**Q16: Why did you increase `GEMINI_TIMEOUT_SECONDS` from 8s to 30s?**  
*Answer:* Generating 1,000+ tokens of detailed multi-day travel itineraries in structured JSON typically requires 12 to 20 seconds of inference time. An 8-second timeout caused premature aborts even when Gemini was operating normally. 30 seconds provides realistic leeway while still protecting the server against indefinite hanging.

---

### Database & Supabase
**Q17: What database engine does Supabase use?**  
*Answer:* PostgreSQL, an enterprise-grade open-source relational database management system.

**Q18: What is Row Level Security (RLS)?**  
*Answer:* RLS is a PostgreSQL security feature where database policies determine which rows a specific user or role can SELECT, INSERT, UPDATE, or DELETE, rather than granting blanket table-level permissions.

**Q19: How are complex nested itineraries stored in a relational PostgreSQL table?**  
*Answer:* We use a `JSONB` (Binary JSON) column called `data`. This allows storing structured, variable-length nested objects (like day plans, activities, and packing checklists) inside a single row while maintaining indexing and fast querying capabilities.

**Q20: What happens if Supabase credentials are missing or the database is down?**  
*Answer:* In `supabase_service.py`, operations detect if Supabase is unconfigured or returns an HTTP error. The service automatically falls back to `backend/data/saved_itineraries.json`, reading and writing local files so users can still save, view, and delete their trips seamlessly.

---

### Testing, Security & Deployment
**Q21: How do you prevent sensitive credentials from leaking to GitHub?**  
*Answer:* All `.env` files are explicitly listed in `.gitignore`. The frontend contains zero hardcoded API keys or Supabase service keys. Environment variables are injected into Render and Vercel hosting dashboards directly.

**Q22: How did you test your application?**  
*Answer:* We implemented an automated Pytest suite in `backend/tests/test_api.py` with 8 test cases covering root status, dual-prefix routing, validation constraints, Gemini timeout fallbacks, recommendation generation, and complete CRUD persistence. All 8 tests passed. We also verified frontend builds (`npm run build`) with zero linter errors.

**Q23: What is a Render cold start?**  
*Answer:* On Render's free tier, inactive web services spin down after 15 minutes of inactivity to save compute resources. When a new request arrives, Render boots the container, which takes 50 to 90 seconds. We configured client timeouts of 90 seconds to avoid prematurely cancelling cold start requests.

**Q24: What is the purpose of `render.yaml`?**  
*Answer:* `render.yaml` is an Infrastructure-as-Code (Blueprint) file that defines the build command (`pip install -r requirements.txt`), start command (`uvicorn app.main:app`), root directory (`backend`), Python version (`3.11.9`), and environment variable definitions for Render.

**Q25: What are the main limitations of the current implementation?**  
*Answer:* First, Render free-tier cold starts introduce initial latency. Second, activities do not yet incorporate live transit APIs (like Google Maps Directions or Uber) or live airline booking prices. Third, user itineraries are not yet segmented by individual user login accounts.
