from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notification_ids = request.data.get('ids', [])
        if notification_ids:
            Notification.objects.filter(
                recipient=request.user, id__in=notification_ids
            ).update(is_read=True)
        else:
            # Mark all as read
            Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'ok'})
