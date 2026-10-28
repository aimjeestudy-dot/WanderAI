# WanderAI — Personalized Travel Itinerary Planner 🌍✨

A modern, full-stack, AI-powered travel itinerary planner built with **React 18 + Vite**, **Python FastAPI**, **Google Gemini AI**, and **Supabase (PostgreSQL)**.

Built for the **SkillWallet Capstone Project**.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [Architecture Overview](#-architecture-overview)
5. [Prerequisites](#-prerequisites)
6. [Local Setup Instructions](#-local-setup-instructions)
   - [1. Backend Setup](#1-backend-setup)
   - [2. Frontend Setup](#2-frontend-setup)
7. [Environment Variables](#-environment-variables)
8. [Supabase Setup Instructions](#-supabase-setup-instructions)
9. [Running the Application](#-running-the-application)
10. [Running Tests](#-running-tests)
11. [Project Structure](#-project-structure)
12. [Security & Deployment Notes](#-security--deployment-notes)

---

## 🧭 Project Overview

**WanderAI** solves the overwhelm of trip planning by automatically generating personalized, realistic day-by-day itineraries tailored to each traveler's unique pace, interests, budget, and travel party.

The application utilizes **Google Gemini** for structured JSON generation, features a **responsive, accessible frontend** with a custom dark nebula aesthetic, stores trips in **Supabase PostgreSQL** protected with **Row Level Security (RLS)**, and includes an **offline local fallback** engine so the application functions seamlessly even during network outages or quota spikes.

---

## 🌟 Features

- **Personalized Itinerary Generator**: Customizes plans by destination, duration (1–14 days), budget tier (Budget, Moderate, Luxury), travel style (Solo, Couple, Family, Friends), traveler count, and specific interests.
- **Structured Day-by-Day Schedules**: Generates curated morning, afternoon, and evening activities with realistic transit, cost estimates, and local insider tips.
- **Smart Destination Discovery**: Interactive recommendations engine matching travelers to ideal destinations based on vibe, season, and budget.
- **Cloud Persistence with Supabase**: Save, search, manage, and delete itineraries backed by PostgreSQL.
- **Personal Notes & Editing**: Add custom flight details, hotel confirmations, and personal notes directly to saved itineraries with automatic upserting.
- **Resilient AI Fallback**: Clamped request timeouts (8s backend / 12s client) with automated fallback to rich template generation when Gemini is unavailable.
- **Interactive Checklists & Tips**: Dynamic packing checklist with checkboxes, local culinary recommendations, and safety advisories.
- **Export & Share**: Instant one-click copy formatted Markdown to share via email, messaging, or notes apps.
- **Zero-Secret Frontend**: All API keys and database calls are proxied securely through FastAPI; credentials are never exposed to the client.

---

## 🛠 Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | Component-driven Single Page Application (SPA) |
| **Styling** | Vanilla CSS Design System | Curated dark nebula theme, glassmorphism, responsive CSS grid/flex |
| **Icons** | Lucide React | Lightweight, consistent iconography |
| **Backend** | Python 3.10+, FastAPI, Uvicorn | High-performance asynchronous REST API |
| **Data Validation** | Pydantic v2 | Strict schema validation for incoming requests and responses |
| **AI Engine** | Google Gemini API (`gemini-3.8-flash`) | Structured prompting returning validated JSON |
| **Database** | Supabase (PostgreSQL) | Managed cloud database with Row Level Security (RLS) |
| **Local Fallback** | JSON File Persistence | Automatic local storage fallback (`backend/data/saved_itineraries.json`) |
| **Testing** | Pytest, TestClient, Pytest-Asyncio | Automated backend validation and integration test suite |

---

## 🏗 Architecture Overview

```
[ User Browser ]
       │
       ▼
[ React + Vite SPA (Port 5173) ]
       │
       │ Vite Proxy: /api/* ──► 127.0.0.1:8000
       ▼
[ FastAPI Backend (Port 8000) ]
   ├── Config & Environment Settings (backend/.env)
   ├── Services:
   │   ├── Gemini Service ──────► [ Google Gemini REST API ]
   │   │   (Structured Prompting & 8s timeout with fallback)
   │   │
   │   └── Supabase Service ────► [ Supabase Cloud Database ]
   │                               (or local backend/data/saved_itineraries.json)
```

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (packaged with Node.js)
- **Python**: v3.10, v3.11, v3.12, v3.13, or v3.14 ([Download Python](https://www.python.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

## 🚀 Local Setup Instructions

Clone the repository to your local machine:
```bash
git clone https://github.com/your-username/wanderai-travel-planner.git
cd wanderai-travel-planner
```

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   - **Windows**:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```

3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   *(Edit `backend/.env` with your actual API credentials as described in the [Environment Variables](#-environment-variables) section).*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the required npm packages:
   ```bash
   npm install
   ```

---

## 🔑 Environment Variables

All configuration is managed inside **`backend/.env`**.

> **Important**: Never commit `backend/.env` to source control. It is ignored by `.gitignore`. Use placeholder values only when sharing configuration examples.

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# ============================================================
# Google Gemini AI Configuration
# Obtain a free API key at: https://aistudio.google.com/
# ============================================================
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
GEMINI_TIMEOUT_SECONDS=8

# ============================================================
# Supabase Database Configuration
# Obtain from Supabase Dashboard -> Project Settings -> API
# ============================================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Leave empty for standard capstone use (respects Row Level Security)
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 🗄 Supabase Setup Instructions

WanderAI uses Supabase PostgreSQL for saving and querying travel itineraries.

### Step 1: Create a Project
1. Go to [Supabase.com](https://supabase.com/) and create a free account.
2. Click **New Project**, choose an organization, name your project (e.g., `wanderai`), set a database password, and select a nearby region.

### Step 2: Run the Database Schema
1. In the Supabase Dashboard, click on **SQL Editor** from the left navigation bar.
2. Click **New Query**.
3. Open the file [`backend/supabase_schema.sql`](backend/supabase_schema.sql) in your code editor.
4. Copy the entire contents, paste them into the Supabase SQL Editor, and click **Run**.
5. The script creates:
   - The `public.itineraries` table with constraints and indexes.
   - Row Level Security (RLS) policies for public read and safe guest/user CRUD.
   - Table permissions (`GRANT SELECT, INSERT, UPDATE, DELETE`) for `anon` and `authenticated` roles.

### Step 3: Copy API Credentials
1. Go to **Project Settings** (gear icon) → **API** (or **Data API**).
2. Copy your **Project URL** and paste it as `SUPABASE_URL` in `backend/.env`.
3. Copy your **anon / public key** (or `sb_publishable_...` key) and paste it as `SUPABASE_ANON_KEY` in `backend/.env`.

---

## 💻 Running the Application

### 1. Start the FastAPI Backend
In your backend terminal (with `.venv` active):
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health/Status Check: `http://127.0.0.1:8000/api/status`

### 2. Start the Vite Frontend
In your frontend terminal:
```bash
cd frontend
npm run dev
```
- Application Web UI: `http://localhost:5173`

Visit **`http://localhost:5173`** in your browser. The status monitor badge in the top navigation will reflect live connectivity to Gemini AI and Supabase Cloud.

---

## 🧪 Running Tests

### 1. Backend Automated Tests (Pytest)
The backend includes a comprehensive test suite covering input validation, health endpoints, AI generation, and full CRUD database persistence:

```bash
cd backend
.venv/bin/pytest -v
```

Expected output:
```
tests/test_api.py::test_root_endpoint PASSED                      [ 14%]
tests/test_api.py::test_system_status PASSED                      [ 28%]
tests/test_api.py::test_generate_itinerary_validation_error PASSED[ 42%]
tests/test_api.py::test_generate_itinerary_success PASSED         [ 57%]
tests/test_api.py::test_gemini_timeout_uses_demo_itinerary PASSED [ 71%]
tests/test_api.py::test_recommendations_endpoint PASSED           [ 85%]
tests/test_api.py::test_itinerary_crud_flow PASSED                [100%]

========================= 7 passed in ~7s =========================
```

### 2. Frontend Production Build Verification
To ensure all frontend JSX components, styles, and assets compile cleanly for production:

```bash
cd frontend
npm run build
```

Expected output:
```
✓ built in ~500ms
dist/index.html
dist/assets/index-*.css
dist/assets/index-*.js
```

---

## 📂 Project Structure

```
wanderai-travel-planner/
├── .gitignore                      # Top-level ignore rules for secrets, caches & dependencies
├── README.md                       # Main documentation & setup guide
├── render.yaml                     # Render.com blueprint for backend deployment
│
├── backend/
│   ├── .env.example                # Template with placeholder environment variables
│   ├── .env                        # Local credentials (ignored by Git)
│   ├── requirements.txt            # Pinned Python package dependencies
│   ├── supabase_schema.sql         # Idempotent PostgreSQL DDL, RLS policies & grants
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py               # Settings loader with dynamic environment reloading
│   │   ├── main.py                 # FastAPI application, CORS middleware & route handlers
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py          # Pydantic schemas (validation & data transfer objects)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── gemini_service.py   # Gemini prompt builder, API client & demo fallback
│   │       └── supabase_service.py # PostgREST database client with JSON file persistence fallback
│   ├── data/
│   │   ├── .gitkeep                # Retains directory structure in Git
│   │   └── saved_itineraries.json  # Local fallback storage (ignored by Git)
│   └── tests/
│       ├── __init__.py
│       └── test_api.py             # Pytest integration & endpoint validation tests
│
└── frontend/
    ├── index.html                  # HTML entry point with Google Fonts preconnections
    ├── package.json                # React 18, Vite & dependencies
    ├── vite.config.js              # Vite server configuration & /api reverse proxy
    ├── vercel.json                 # SPA rewrite configuration for Vercel deployment
    └── src/
        ├── main.jsx                # React root mount
        ├── App.jsx                 # Main application state & notification controller
        ├── index.css               # Vanilla CSS design system (tokens, glassmorphism, animations)
        ├── services/
        │   └── api.js              # Frontend API client with request timeout wrapper
        └── components/
            ├── Navbar.jsx          # Header navigation, brand & live status indicator
            ├── TripForm.jsx        # Travel preference inputs with quick-select chips
            ├── ItineraryView.jsx   # Interactive day tabs, activities, notes & packing checklist
            ├── RecommendationsView.jsx # Discovery cards with match percentages & 1-click plan
            ├── SavedItinerariesView.jsx# Saved trip cards, search filter & note updates
            └── StatusPanel.jsx     # Diagnostics & configuration instructions
```

---

## 🔒 Security & Deployment Notes

- **Secrets Management**: No API keys or connection strings are stored in code or repository commits.
- **Row Level Security (RLS)**: The `itineraries` table enforces RLS. Evaluators can test without accounts, while authenticated records remain restricted to their owners (`user_id = auth.uid()`).
- **CORS Configuration**: FastAPI CORS middleware is configured to accept requests from local Vite environments (`localhost:5173`, `127.0.0.1:5173`) and allows custom domains for cloud deployments.
- **Frontend Hosting**: Ready for deployment on [Vercel](https://vercel.com/) with root directory set to `frontend`.
- **Backend Hosting**: Ready for deployment on [Render](https://render.com/) using the included [`render.yaml`](render.yaml) blueprint.
