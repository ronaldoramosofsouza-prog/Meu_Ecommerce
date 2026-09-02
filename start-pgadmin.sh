#!/usr/bin/env bash
# Inicia o pgAdmin (interface gráfica do PostgreSQL) em http://localhost:5050
set -e
cd "$(dirname "$0")"
exec ./pgadmin-venv/bin/pgadmin4 "$@"