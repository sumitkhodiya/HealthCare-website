from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # JWT login (Doctor/Admin)
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Patient OTP login
    path('otp/request/', views.OTPRequestView.as_view(), name='otp_request'),
    path('otp/verify/', views.OTPVerifyView.as_view(), name='otp_verify'),
    path('otp/verify-phone/', views.PhoneOTPVerifyForRegistrationView.as_view(), name='otp_verify_phone'),

    # Email OTP (for registration verification)
    path('otp/email/request/', views.EmailOTPRequestView.as_view(), name='email_otp_request'),
    path('otp/email/verify/', views.EmailOTPVerifyView.as_view(), name='email_otp_verify'),

    # Registration
    path('register/patient/', views.PatientRegisterView.as_view(), name='register_patient'),
    path('register/doctor/', views.DoctorRegisterView.as_view(), name='register_doctor'),

    # Profile
    path('me/', views.MeView.as_view(), name='me'),

    # Patient search (doctors)
    path('patients/search/', views.PatientSearchView.as_view(), name='patient_search'),

    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<uuid:pk>/toggle/', views.AdminUserToggleView.as_view(), name='admin_user_toggle'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin_stats'),
]
