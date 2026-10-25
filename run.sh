#!/usr/bin/env bash
# Jalankan app lokal: ./run.sh [port]
PORT="${1:-8123}"
cd "$(dirname "$0")"
echo "ASCIIt -> http://localhost:$PORT"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
