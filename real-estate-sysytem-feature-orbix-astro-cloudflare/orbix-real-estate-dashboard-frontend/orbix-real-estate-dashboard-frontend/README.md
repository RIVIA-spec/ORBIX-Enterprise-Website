# Orbix Partner — Real Estate Dashboard

Frontend-only React/Vite demo generated from the provided Qwen source.

## Run locally

1. Install Node.js 18+.
2. Open this folder in VS Code.
3. Run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Notes

- Frontend only: no Firebase, Firestore, Auth, API, or environment variables.
- Data is local mock data in `src/App.jsx`.
- Some property images are remote Qwen image URLs and require internet access to display.
- The source includes sandbox-safe localStorage handling and renders directly without backend routing dependencies.
