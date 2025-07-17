#!/bin/bash
set -e  # Exit immediately on error

# Create venv only if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Run Gunicorn with Uvicorn workers
exec gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4