"""
Doomsday Sentinel — Root URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def root_health_view(request):
    return JsonResponse({
        "status": "online",
        "service": "Veritas Sentinel Forensics API",
        "health": "/api/health/",
        "docs": "/api/docs/"
    })

urlpatterns = [
    path('', root_health_view, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.forensics.urls')),
    
    # OpenAPI Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

from django.views.static import serve
from django.urls import re_path

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

