# LOCOMOTIVE PRO X v1 Clean

A clean, working Sprint 1 foundation.

## Frontend (Netlify)
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

## Backend (Render)
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## API
- GET `/`
- POST `/morning-scan`

This is a functional foundation. It does not yet include live Finnhub data, database learning, or Telegram alerts. Those come after Sprint 1 deploys successfully.
