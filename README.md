# 🛡️ ShieldAI — Kenya-focused Digital Violence Protection

ShieldAI is a lightweight content-moderation project focused on reducing digital violence toward women and girls in Kenya. The repository contains a small FastAPI backend (rule-based analysis engine), a static frontend demo, and a browser-extension prototype. It is designed for local development (no built-in Docker flow) and prioritizes cultural context and local languages like Kiswahili and Sheng.

## Quick highlights

- Kenya-first content moderation with cultural-context rules
- Rule-based, lightweight AI engine (fast; no heavy model downloads for local testing)
- API for single and batch text analysis, cultural context endpoints, and local resources
- Static frontend demo + browser extension prototype included under `frontend/`
- Local-first development (no Docker required; see Local Development below)

---

## Table of contents

1. What this project contains
2. Quick start (local)
3. Running the backend & frontend
4. API reference (key endpoints)
5. Browser extension & demo

   The frontend includes a browser-extension prototype. A packaged extension ZIP is available at `frontend/extension/shieldai-extension.zip` and the static demo's Extension page now provides a direct download link to `/extension/shieldai-extension.zip` when deployed.
6. Repository layout
7. Contributing & License

---

## Overview

ShieldAI aims to reduce digital violence by detecting toxic messages, applying cultural sensitivity, and providing constructive alternatives and support links to survivors.

1. Clone the repository
   ```bash
   git clone https://github.com/charllote122/ShieldAI.git
   cd ShieldAI/shieldai
   ```

2. Configure environment
   ```bash
   # Backend: copy .env.example to .env and edit if present
   cd backend
   cp .env.example .env  # (only if .env.example exists)
   ```

3. Start the project (local development)
   This repo is oriented for local development. Follow the steps below to run the backend API and static frontend demo.

4. Access the services (local)

- Frontend (static demo): http://localhost:8080
- Backend API docs (Swagger): http://localhost:8000/docs

Note: the backend code's default script runs on port 8001, but the frontend expects the API on port 8000. When running locally, start the backend with --port 8000 to keep the demo functioning as-is.

5. Stop services / local processes

   - Stop the backend and frontend processes you started with Ctrl+C in their terminals.
   - If you started local DB or Redis instances separately, stop those using the method you used to start them.

> NOTE: The current codebase is set up for local development. If you'd like a Docker compose setup for convenience I can add it.

---

## Local development (without Docker)

1. Install Python dependencies
   ```bash
   cd shieldai/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Start any required services (Postgres / Redis)
   ```bash
   # These services are optional for local testing depending on which features you use.
   # Install locally or run them in containers you manage separately:
   # PostgreSQL: https://www.postgresql.org/download/
   # Redis: https://redis.io/docs/install/
   ```

3. Run the backend
   ```bash
   # Start the API server. The frontend expects the API at port 8000.
   cd shieldai/backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Run the frontend demo (static)
   ```bash
   cd shieldai/frontend
   # Simple Python static server
   python -m http.server 8080

   # Or use a static server / Vite if you prefer
   # npx http-server . -p 8080
   ```

---

## Deployment

This project is deployed in production using Render (backend) and Vercel (frontend) by default. Use the Render `render.yaml` in `shieldai/backend` to deploy the backend; the file includes build and start commands and wiring for database and Redis services.

Backend (Render)
- The Render start command uses the environment variable $PORT and runs the app with uvicorn:

   uvicorn app.main:app --host 0.0.0.0 --port $PORT

- The `render.yaml` also attaches PostgreSQL and Redis instances and sets environment variables like `ENVIRONMENT` and `CORS_ORIGINS`. When deploying on Render, make sure the `DATABASE_URL` and `REDIS_URL` are configured.

Frontend (Vercel)
- The frontend is configured for static deployment in `shieldai/frontend/vercel.json`.
- Vercel env example (in `vercel.json`) sets `NEXT_PUBLIC_API_URL` to the Render backend URL (example: `https://shieldai-31j7.onrender.com`). Update this to your production URL when you deploy.

Runtime configuration (single source of truth)
- The frontend now prefers a single runtime config object available in the browser: `window.APP_CONFIG` (alias `window.CONFIG`).
- For quick overrides you can edit `shieldai/frontend/env.js` (development or demo) or set `NEXT_PUBLIC_API_URL` in Vercel build environment variables. The `assets/config.js` and `index.html` read `window.APP_CONFIG` / `window.CONFIG` at runtime so the app uses one authoritative API URL.

Where to change the API URL in production
- Vercel → set `NEXT_PUBLIC_API_URL` in the project’s Environment Variables or update `shieldai/frontend/vercel.json` before deploying.
- If you prefer runtime file injection (useful for static object hosting) update `shieldai/frontend/env.js` (adds `window.APP_CONFIG`) and redeploy.

This avoids duplicated, hard-coded API URLs spread through templates and scripts.

### Frontend deployment checklist (Vercel)

1. Confirm your backend is running on Render and note the public URL (example: https://shieldai-31j7.onrender.com).
2. In your Vercel project settings or `shieldai/frontend/vercel.json` set `NEXT_PUBLIC_API_URL` to the Render URL.
3. Commit any changes and deploy the frontend on Vercel. The static build will use the configured URL for API requests.
4. Verify your deployed site makes calls to the Render backend and that CORS is set properly on Render (see `render.yaml` -> `CORS_ORIGINS`).

Quick verification commands (local):
- Check frontend points to Render (index.html / assets/config.js / .env)

```bash
# inside frontend/
grep -n "shieldai-31j7.onrender.com" -n -R . || true
```

If you want me to automatically update `vercel.json` or `index.html` to use an environment-lookup pattern (instead of a hard-coded URL), I can do that next.

Notes about ports and local dev
- When running locally with uvicorn, the backend file `app/main.py` defaults to port 8001 for quick dev runs. The frontend demo assumes the API is available at port 8000. For the demo to work locally without changing frontend config, start the backend on port 8000:

```bash
# start backend on 8000 so frontend demo works locally
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```


---

   ## API reference — key endpoints

   The backend exposes a simple set of endpoints tailored to Kenya-focused content moderation. Example endpoints:

   - GET / -> Basic service info and status
   - GET /health -> Health check (reports AI engine, region)
   - GET /stats -> Mock analytics and usage statistics (dashboard)
   - GET /resources/{country} -> Local support resources (pre-populated for Kenya)
   - GET /languages/supported -> Languages (Swahili, English by default)
   - GET /cultural-context/kenya -> Cultural context hints for Kenya moderation
   - POST /analyze -> Analyze a single text payload (JSON)
   - POST /analyze/batch -> Batch analyze multiple texts

   Sample request — single analyze:

   ```bash
   curl -X POST http://localhost:8000/analyze \
      -H 'Content-Type: application/json' \
      -d '{"text":"You are an idiot woman", "platform":"twitter" }'
   ```

   Sample response snippet:

   {
      "toxicity_score": 0.85,
      "is_toxic": true,
      "categories": ["personal_attack"],
      "warning_level": "high",
      "cultural_context": {"region": "kenya"}
   }

   ## Repository layout

   Top-level layout (short):

   ```
   shieldai/                  # repo subfolder
      backend/                 # FastAPI backend, Docker compose, services
         app/                   # Python application code
      frontend/                # static demo site & extension
   ```

   ## Contributing

   We welcome contributors. If you'd like to help:

   1. Open an issue describing the feature or bug.
   2. Fork the repository and create a branch for your change.
   3. Run tests and add new tests where appropriate.
   4. Submit a PR with a clear description and testing instructions.

   If you'd like help getting started, leave a comment on an issue or ping the maintainers.

   ---

   ## Contact, security & license

   - Maintainer / Owner: @charllote122 (GitHub)
   - Security: Please open a private issue for security-sensitive reports.

   ### License
   This project is available under the MIT License. See `LICENSE` for the full text.

   ---


   ## Quick Troubleshooting & Notes

   - If you see port conflicts, check and free ports 8000/8080/5432/6379.
   - When running locally you'll see logs in the terminals where you started the backend (uvicorn) and frontend (http.server). Use those terminals to follow errors and stack traces.

   Thank you for contributing — a `CONTRIBUTING.md` and `LICENSE` file have been added to help collaborators get started.
   ```