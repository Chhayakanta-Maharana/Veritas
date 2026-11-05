import sys
import os
from pathlib import Path

# Ensure paths
current = Path(__file__).resolve().parent
backend_dir = current.parent.parent
root_dir = backend_dir.parent

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from config.wsgi import application

