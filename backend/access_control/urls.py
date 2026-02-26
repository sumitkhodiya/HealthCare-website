from django.urls import path
from . import views

urlpatterns = [
    # Doctor
    path('request/', views.AccessRequestCreateView.as_view(), name='access_request_create'),
    path('my-requests/', views.DoctorAccessListView.as_view(), name='doctor_access_list'),
    # Patient
    path('incoming/', views.PatientAccessRequestListView.as_view(), name='patient_access_list'),
    path('<uuid:pk>/respond/', views.AccessRequestResponseView.as_view(), name='access_respond'),
    # Emergency
    path('emergency/', views.EmergencyAccessView.as_view(), name='emergency_access'),
    path('emergency/my/', views.DoctorEmergencyListView.as_view(), name='doctor_emergency_list'),
    path('emergency/all/', views.EmergencyAccessListView.as_view(), name='admin_emergency_list'),
    path('emergency/<uuid:pk>/review/', views.EmergencyAccessReviewView.as_view(), name='emergency_review'),
]
