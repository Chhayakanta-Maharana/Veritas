"""
Doomsday Sentinel — Forensics API URL Routing
"""

from django.urls import path
from apps.forensics.views import (
    HealthCheckView,
    ModelInfoView,
    AnalyzeImageView,
    AnalyzeVideoView,
    AnalyzeFraudView,
    AnalysisListView,
    AnalysisDetailView,
    DashboardStatsView,
    DownloadReportView,
    AdminLoginView,
    AdminSystemStatsView,
    AdminSetThresholdView,
    UserLoginView,
    AdminUsersListView,
    AdminCreateUserView,
    AdminToggleUserStatusView,
    AdminDeleteUserView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('model/info/', ModelInfoView.as_view(), name='model-info'),
    path('analyze/image/', AnalyzeImageView.as_view(), name='analyze-image'),
    path('analyze/video/', AnalyzeVideoView.as_view(), name='analyze-video'),
    path('analyze/fraud/', AnalyzeFraudView.as_view(), name='analyze-fraud'),
    path('analyses/', AnalysisListView.as_view(), name='analysis-list'),
    path('analyses/<uuid:id>/', AnalysisDetailView.as_view(), name='analysis-detail'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/<uuid:id>/', DownloadReportView.as_view(), name='download-report'),
    
    # Administrative & Auth Endpoints
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/user-login/', UserLoginView.as_view(), name='user-login'),
    path('admin/system-stats/', AdminSystemStatsView.as_view(), name='admin-system-stats'),
    path('admin/set-threshold/', AdminSetThresholdView.as_view(), name='admin-set-threshold'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/create/', AdminCreateUserView.as_view(), name='admin-users-create'),
    path('admin/users/<int:user_id>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin-users-toggle-status'),
    path('admin/users/<int:user_id>/delete/', AdminDeleteUserView.as_view(), name='admin-users-delete'),
]

