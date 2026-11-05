"""
WSGI config for Doomsday Sentinel backend.
"""

import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path so config.settings and apps resolve anywhere
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

