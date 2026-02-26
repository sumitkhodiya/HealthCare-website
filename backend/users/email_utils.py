"""
Shared email utility for MediVault event notifications.
Sends HTML emails for key access control events.
"""
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_event_email(recipient_email: str, subject: str, plain_message: str, html_message: str) -> bool:
    """Send an HTML event email. Returns True on success."""
    if not settings.EMAIL_HOST_USER or settings.EMAIL_HOST_USER == 'your_gmail@gmail.com':
        logger.warning('Email not configured — event email not sent to %s', recipient_email)
        return False
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.exception('Failed to send event email to %s: %s', recipient_email, exc)
        return False


def _wrap_html(title: str, body_html: str) -> str:
    """Wrap body content in a consistent MediVault email template."""
    return f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;
                border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:20px;">🏥 MediVault</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Secure Medical Records Platform</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1e293b;margin-top:0;font-size:18px;">{title}</h2>
        {body_html}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          This is an automated notification from MediVault. Do not reply to this email.
        </p>
      </div>
    </div>
    """


# ── Event-specific email senders ──────────────────────────────────────────────

def email_access_requested(doctor_name: str, reason: str, patient_email: str, patient_name: str):
    subject = f'[MediVault] Dr. {doctor_name} has requested access to your records'
    plain = (
        f'Hello {patient_name},\n\n'
        f'Dr. {doctor_name} has requested access to your medical records.\n'
        f'Reason: {reason}\n\n'
        f'Please log in to MediVault to approve or reject this request.\n\n'
        f'— MediVault Team'
    )
    html = _wrap_html(
        f'Access Request from Dr. {doctor_name}',
        f'<p style="color:#475569;">Hello <strong>{patient_name}</strong>,</p>'
        f'<p style="color:#475569;"><strong>Dr. {doctor_name}</strong> has requested access to your medical records.</p>'
        f'<div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">'
        f'  <strong style="color:#64748b;font-size:13px;">REASON</strong>'
        f'  <p style="color:#1e293b;margin:4px 0 0;">{reason}</p>'
        f'</div>'
        f'<p style="color:#475569;">Please log in to MediVault to <strong>approve or reject</strong> this request.</p>'
        f'<a href="http://localhost:3000/patient/access" '
        f'   style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;'
        f'          border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">'
        f'  Review Request →</a>'
    )
    send_event_email(patient_email, subject, plain, html)


def email_access_approved(patient_name: str, duration_hours: int, doctor_email: str, doctor_name: str):
    subject = f'[MediVault] {patient_name} approved your access request'
    plain = (
        f'Hello Dr. {doctor_name},\n\n'
        f'Patient {patient_name} has approved your access to their medical records.\n'
        f'Access is valid for {duration_hours} hours.\n\n'
        f'— MediVault Team'
    )
    html = _wrap_html(
        'Access Request Approved ✅',
        f'<p style="color:#475569;">Hello <strong>Dr. {doctor_name}</strong>,</p>'
        f'<p style="color:#475569;">Patient <strong>{patient_name}</strong> has '
        f'<span style="color:#10b981;font-weight:700;">approved</span> your access to their medical records.</p>'
        f'<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">'
        f'  <strong style="color:#15803d;">Access valid for {duration_hours} hours</strong>'
        f'</div>'
        f'<a href="http://localhost:3000/doctor/dashboard" '
        f'   style="display:inline-block;background:#10b981;color:white;padding:12px 24px;'
        f'          border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">'
        f'  Go to Dashboard →</a>'
    )
    send_event_email(doctor_email, subject, plain, html)


def email_access_rejected(patient_name: str, doctor_email: str, doctor_name: str):
    subject = f'[MediVault] {patient_name} rejected your access request'
    plain = (
        f'Hello Dr. {doctor_name},\n\n'
        f'Patient {patient_name} has rejected your access request.\n\n'
        f'— MediVault Team'
    )
    html = _wrap_html(
        'Access Request Rejected',
        f'<p style="color:#475569;">Hello <strong>Dr. {doctor_name}</strong>,</p>'
        f'<p style="color:#475569;">Patient <strong>{patient_name}</strong> has '
        f'<span style="color:#ef4444;font-weight:700;">rejected</span> your access request.</p>'
        f'<p style="color:#475569;">You may submit a new request with additional context if needed.</p>'
    )
    send_event_email(doctor_email, subject, plain, html)


def email_access_revoked(patient_name: str, doctor_email: str, doctor_name: str):
    subject = f'[MediVault] {patient_name} revoked your access'
    plain = (
        f'Hello Dr. {doctor_name},\n\n'
        f'Patient {patient_name} has revoked your access to their medical records.\n\n'
        f'— MediVault Team'
    )
    html = _wrap_html(
        'Access Revoked',
        f'<p style="color:#475569;">Hello <strong>Dr. {doctor_name}</strong>,</p>'
        f'<p style="color:#475569;">Patient <strong>{patient_name}</strong> has '
        f'<span style="color:#f59e0b;font-weight:700;">revoked</span> your access to their records.</p>'
    )
    send_event_email(doctor_email, subject, plain, html)


def email_emergency_access(doctor_name: str, reason_detail: str, patient_email: str, patient_name: str):
    subject = f'[MediVault] ⚠️ EMERGENCY ACCESS to your records by Dr. {doctor_name}'
    plain = (
        f'Hello {patient_name},\n\n'
        f'ALERT: Dr. {doctor_name} used emergency break-glass access to your medical records.\n'
        f'Reason: {reason_detail}\n\n'
        f'Access is valid for 1 hour. This event has been logged and flagged for admin review.\n\n'
        f'— MediVault Team'
    )
    html = _wrap_html(
        '⚠️ Emergency Access Used',
        f'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;">'
        f'  <strong style="color:#dc2626;">SECURITY ALERT</strong>'
        f'</div>'
        f'<p style="color:#475569;">Hello <strong>{patient_name}</strong>,</p>'
        f'<p style="color:#475569;"><strong>Dr. {doctor_name}</strong> used emergency break-glass '
        f'access to your medical records.</p>'
        f'<div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">'
        f'  <strong style="color:#64748b;font-size:13px;">REASON</strong>'
        f'  <p style="color:#1e293b;margin:4px 0 0;">{reason_detail}</p>'
        f'</div>'
        f'<p style="color:#64748b;font-size:13px;">Access is limited to 1 hour and has been '
        f'logged for admin review. If you believe this was unauthorized, contact support.</p>'
    )
    send_event_email(patient_email, subject, plain, html)


def email_emergency_access_admin(doctor_name: str, patient_name: str, patient_id: str,
                                  reason_detail: str, admin_email: str):
    subject = f'[MediVault Admin] ⚠️ Emergency Access by Dr. {doctor_name}'
    plain = (
        f'Emergency access triggered.\n'
        f'Doctor: Dr. {doctor_name}\n'
        f'Patient: {patient_name} ({patient_id})\n'
        f'Reason: {reason_detail}\n\n'
        f'Please review in the admin dashboard.\n\n'
        f'— MediVault System'
    )
    html = _wrap_html(
        '⚠️ Emergency Access — Admin Review Required',
        f'<p style="color:#475569;">Emergency break-glass access was triggered:</p>'
        f'<table style="width:100%;border-collapse:collapse;font-size:14px;">'
        f'  <tr><td style="color:#64748b;padding:6px 0;">Doctor</td>'
        f'      <td style="color:#1e293b;font-weight:600;">Dr. {doctor_name}</td></tr>'
        f'  <tr><td style="color:#64748b;padding:6px 0;">Patient</td>'
        f'      <td style="color:#1e293b;font-weight:600;">{patient_name} ({patient_id})</td></tr>'
        f'  <tr><td style="color:#64748b;padding:6px 0;">Reason</td>'
        f'      <td style="color:#1e293b;">{reason_detail}</td></tr>'
        f'</table>'
        f'<a href="http://localhost:3000/admin/dashboard" '
        f'   style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;'
        f'          border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">'
        f'  Review in Admin Dashboard →</a>'
    )
    send_event_email(admin_email, subject, plain, html)
