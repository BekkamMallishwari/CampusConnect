import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ROOT_ENV)

AI_PORT = int(os.getenv("AI_PORT", 8000))
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5001/api")
HOST = os.getenv("HOST", "0.0.0.0")
