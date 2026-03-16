#!/usr/bin/env python
"""Entry-point script to launch the FastAPI server with uvicorn."""
import subprocess
import sys
import os

if __name__ == "__main__":
    # Ensure we run from the backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run(
        [
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8001",
            "--reload",
        ],
        check=True,
    )
