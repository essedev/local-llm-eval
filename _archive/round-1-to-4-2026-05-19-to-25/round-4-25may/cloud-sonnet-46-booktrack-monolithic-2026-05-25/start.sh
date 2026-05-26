#!/usr/bin/env bash
# Avvia backend e frontend in parallelo

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ---- Backend ----
echo "▶ Avvio backend FastAPI su http://localhost:8000"
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "  Creo virtual env..."
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
.venv/bin/uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# ---- Frontend ----
echo "▶ Avvio frontend Vite su http://localhost:5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅  BookTrack in esecuzione"
echo "   Backend  → http://localhost:8000"
echo "   Frontend → http://localhost:5173"
echo "   API docs → http://localhost:8000/docs"
echo ""
echo "   Premi Ctrl+C per fermare tutto"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
