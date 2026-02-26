from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('unread/', views.UnreadCountView.as_view(), name='unread_count'),
    path('mark-read/', views.MarkReadView.as_view(), name='mark_read'),
]
