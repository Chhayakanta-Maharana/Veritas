#!/usr/bin/env bash
set -o errexit

# If running from backend/ subfolder, go up to project root
if [ -f "manage.py" ]; then
    cd ..
fi

echo "==> Working directory: $(pwd)"
echo "==> Upgrading pip..."
python -m pip install --upgrade pip

echo "==> Installing CPU-optimized PyTorch (~150MB)..."
python -m pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo "==> Installing production requirements..."
python -m pip install --no-cache-dir -r requirements-render.txt

echo "==> Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "==> Running database migrations..."
if ! python backend/manage.py migrate --no-input; then
    echo "==> Warning: Migration on external DATABASE_URL failed. Falling back to local SQLite..."
    export DATABASE_URL=""
    python backend/manage.py migrate --no-input
fi

echo "==> Initializing default demo accounts (admin & investigator)..."
if ! python backend/manage.py shell -c "
from django.contrib.auth.models import User
admin_u, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@sentinel.ai', 'is_staff': True, 'is_superuser': True})
admin_u.set_password('Sentinel@2026Admin!')
admin_u.is_staff = True
admin_u.is_superuser = True
admin_u.save()

sarah_u, _ = User.objects.get_or_create(username='analyst_sarah', defaults={'email': 'sarah@sentinel.ai', 'first_name': 'Sarah', 'last_name': 'Vance', 'is_active': True})
sarah_u.set_password('Analyst@2026!')
sarah_u.is_active = True
sarah_u.save()
print('Production users provisioned successfully.')
"; then
    echo "==> Retrying account initialization on fallback SQLite..."
    export DATABASE_URL=""
    python backend/manage.py shell -c "
from django.contrib.auth.models import User
admin_u, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@sentinel.ai', 'is_staff': True, 'is_superuser': True})
admin_u.set_password('Sentinel@2026Admin!')
admin_u.is_staff = True
admin_u.is_superuser = True
admin_u.save()

sarah_u, _ = User.objects.get_or_create(username='analyst_sarah', defaults={'email': 'sarah@sentinel.ai', 'first_name': 'Sarah', 'last_name': 'Vance', 'is_active': True})
sarah_u.set_password('Analyst@2026!')
sarah_u.is_active = True
sarah_u.save()
print('Fallback accounts created.')
"
fi

echo "==> Veritas Sentinel Build Completed!"
