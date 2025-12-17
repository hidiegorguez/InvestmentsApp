Investments monorepo (frontend + backend)

This repository contains two main apps:

- `app/backend` — FastAPI backend serving CSV-based wallets and settings (Azure Blob Storage).
- `app/frontend` — Vite + React + TypeScript frontend (scaffolded).

Rename note
:
If you want the repository folder named `InvestmentsUI`, rename the local folder and (optionally) the GitHub repository. Example:

```powershell
# rename local folder
Rename-Item investments-backend InvestmentsUI
# if you rename the remote repo on GitHub, update remote URL
git remote set-url origin git@github.com:<you>/InvestmentsUI.git
```

Frontend
:
See `app/frontend/README.md` for steps to run the frontend locally.

Backend
:
See `app/backend/README.md` for backend run instructions and API docs.

Deployments
:
- Frontend: Vercel (set project root to `app/frontend`).
- Backend: Fly.io or any container host; `app/backend/Dockerfile` is provided.
