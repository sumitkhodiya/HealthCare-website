from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.DocumentUploadView.as_view(), name='document_upload'),
    path('', views.PatientDocumentListView.as_view(), name='document_list'),
    path('<uuid:pk>/', views.DocumentDetailView.as_view(), name='document_detail'),
    path('timeline/', views.HealthTimelineView.as_view(), name='health_timeline'),
    path('emergency-summary/', views.EmergencySummaryView.as_view(), name='emergency_summary_self'),
    path('emergency-summary/<str:patient_id>/', views.EmergencySummaryView.as_view(), name='emergency_summary'),
]
