"""
URL configuration for medivault project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse


def api_root(request):
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>MediVault API</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 40px 20px; }
            .container { max-width: 700px; margin: auto; }
            .header { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
            .logo { width: 52px; height: 52px; background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    border-radius: 14px; display: flex; align-items: center; justify-content: center;
                    font-size: 24px; }
            h1 { font-size: 28px; font-weight: 800; }
            p.sub { color: #64748b; font-size: 14px; margin-top: 4px; }
            .badge { display: inline-block; background: rgba(16,185,129,0.15); color: #10b981;
                     border: 1px solid rgba(16,185,129,0.3); border-radius: 20px;
                     padding: 3px 12px; font-size: 12px; font-weight: 600; margin-bottom: 32px; }
            .section { margin-bottom: 32px; }
            .section h2 { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;
                          letter-spacing: 1px; margin-bottom: 12px; }
            .endpoint { background: rgba(30,41,59,0.8); border: 1px solid rgba(148,163,184,0.1);
                        border-radius: 10px; padding: 14px 18px; margin-bottom: 8px;
                        display: flex; align-items: center; gap: 14px; text-decoration: none;
                        transition: border-color 0.2s; }
            .endpoint:hover { border-color: rgba(59,130,246,0.5); }
            .method { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
                      min-width: 46px; text-align: center; }
            .get  { background: rgba(16,185,129,0.15); color: #10b981; }
            .post { background: rgba(59,130,246,0.15); color: #3b82f6; }
            .all  { background: rgba(148,163,184,0.15); color: #94a3b8; }
            .url  { font-family: monospace; font-size: 14px; color: #93c5fd; flex: 1; }
            .desc { font-size: 13px; color: #64748b; }
            .admin-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 24px;
                          background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
                          border-radius: 10px; padding: 12px 20px; text-decoration: none; color: #a78bfa;
                          font-size: 14px; font-weight: 600; transition: all 0.2s; }
            .admin-link:hover { background: rgba(124,58,237,0.25); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏥</div>
                <div>
                    <h1>MediVault API</h1>
                    <p class="sub">Secure Medical Records Platform — REST API</p>
                </div>
            </div>
            <div class="badge">● Server Running — Django 6.0</div>

            <div class="section">
                <h2>Authentication</h2>
                <a class="endpoint" href="/api/auth/login/"><span class="method post">POST</span><span class="url">/api/auth/login/</span><span class="desc">Login (get JWT tokens)</span></a>
                <a class="endpoint" href="/api/auth/register/patient/"><span class="method post">POST</span><span class="url">/api/auth/register/patient/</span><span class="desc">Register as patient</span></a>
                <a class="endpoint" href="/api/auth/register/doctor/"><span class="method post">POST</span><span class="url">/api/auth/register/doctor/</span><span class="desc">Register as doctor</span></a>
                <a class="endpoint" href="/api/auth/token/refresh/"><span class="method post">POST</span><span class="url">/api/auth/token/refresh/</span><span class="desc">Refresh JWT token</span></a>
                <a class="endpoint" href="/api/auth/me/"><span class="method get">GET</span><span class="url">/api/auth/me/</span><span class="desc">Get current user profile</span></a>
            </div>

            <div class="section">
                <h2>Documents</h2>
                <a class="endpoint" href="/api/documents/"><span class="method all">ALL</span><span class="url">/api/documents/</span><span class="desc">List / upload medical documents</span></a>
            </div>

            <div class="section">
                <h2>Access Control</h2>
                <a class="endpoint" href="/api/access/requests/"><span class="method all">ALL</span><span class="url">/api/access/requests/</span><span class="desc">Access requests (doctor → patient)</span></a>
                <a class="endpoint" href="/api/access/emergency/"><span class="method post">POST</span><span class="url">/api/access/emergency/</span><span class="desc">Emergency break-glass access</span></a>
            </div>

            <div class="section">
                <h2>Notifications</h2>
                <a class="endpoint" href="/api/notifications/"><span class="method get">GET</span><span class="url">/api/notifications/</span><span class="desc">All notifications for current user</span></a>
                <a class="endpoint" href="/api/notifications/unread/"><span class="method get">GET</span><span class="url">/api/notifications/unread/</span><span class="desc">Unread notification count</span></a>
            </div>

            <div class="section">
                <h2>Audit</h2>
                <a class="endpoint" href="/api/audit/"><span class="method get">GET</span><span class="url">/api/audit/</span><span class="desc">Audit log entries</span></a>
            </div>

            <a class="admin-link" href="/admin/">⚙️ Django Admin Panel</a>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)


urlpatterns = [
    path('', api_root),
    path('api/', api_root),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/access/', include('access_control.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/notifications/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

