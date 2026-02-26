'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { accessApi } from '@/lib/api';
import { AlertTriangle, Clock, Shield, CheckCircle } from 'lucide-react';

const REASONS = [
    { value: 'LIFE_THREATENING', label: '⚡ Life-Threatening Condition', desc: 'Patient is in immediate danger' },
    { value: 'UNCONSCIOUS', label: '😶 Patient Unconscious', desc: 'Patient unable to provide consent' },
    { value: 'MASS_CASUALTY', label: '🚨 Mass Casualty / Disaster', desc: 'Emergency mass casualty event' },
    { value: 'CRITICAL_PROCEDURE', label: '🩺 Critical Procedure Required', desc: 'Urgent surgical/medical procedure' },
    { value: 'OTHER', label: '📋 Other Emergency', desc: 'Other emergency situation' },
];

export default function EmergencyAccessPage() {
    const [patientId, setPatientId] = useState('');
    const [reasonCode, setReasonCode] = useState('LIFE_THREATENING');
    const [reasonDetail, setReasonDetail] = useState('');
    const [admitId, setAdmitId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [granted, setGranted] = useState<{ doctor_name: string; patient_name: string; expires_at: string } | null>(null);
    const [error, setError] = useState('');

    const handleGrant = async () => {
        setError('');
        if (!patientId || !reasonDetail || !admitId) {
            setError('All fields are required');
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await accessApi.emergency({
                patient_id: patientId,
                reason_code: reasonCode,
                reason_detail: reasonDetail,
                patient_admit_id: admitId,
            });
            setGranted(data);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { detail?: string; patient_id?: string[] } } };
            setError(err.response?.data?.patient_id?.[0] || err.response?.data?.detail || 'Failed to grant emergency access');
        } finally { setSubmitting(false); }
    };

    if (granted) {
        const timeLeft = Math.round((new Date(granted.expires_at).getTime() - Date.now()) / 60000);
        return (
            <div className="app-layout">
                <Sidebar />
                <div className="main-content">
                    <Topbar title="Emergency Access" />
                    <div style={{ padding: '32px', maxWidth: 600 }}>
                        <div style={{
                            borderRadius: 20, padding: 40, textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(127,29,29,0.1))',
                            border: '2px solid #dc2626',
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
                            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Emergency Access Granted</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                                You now have <strong>1-hour emergency access</strong> to critical documents for <strong>{granted.patient_name}</strong>.
                            </p>
                            <div style={{
                                background: 'var(--bg-card)', borderRadius: 12, padding: '16px 24px',
                                border: '1px solid var(--border)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <Clock size={20} color="#f59e0b" />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Access expires in</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{timeLeft} minutes</div>
                                </div>
                            </div>
                            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 13, color: '#92400e', textAlign: 'left', marginBottom: 24 }}>
                                ⚠️ This access is <strong>limited to critical documents only</strong> and is <strong>logged and monitored</strong>.
                                Patient and admin have been notified. Misuse may result in penalties.
                            </div>
                            <a href={`/doctor/patients?id=${patientId}&emergency=true`} className="btn btn-danger" style={{ marginRight: 12 }}>
                                <Shield size={16} /> View Patient Records
                            </a>
                            <button className="btn btn-secondary" onClick={() => setGranted(null)}>
                                New Emergency
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Emergency Access" />
                <div style={{ padding: '32px', maxWidth: 640 }}>
                    {/* Warning Banner */}
                    <div className="emergency-banner" style={{ marginBottom: 32 }}>
                        <AlertTriangle size={24} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>Emergency Break-Glass Access</div>
                            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
                                For life-threatening situations only. Access is logged, time-limited (1 hour), and monitored by admin.
                                Misuse will result in disciplinary action.
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Emergency Access Form</h3>

                        <div className="form-group">
                            <label className="form-label">Patient ID *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. MV12345678"
                                value={patientId}
                                onChange={e => setPatientId(e.target.value)}
                                id="emergency-patient-id"
                                style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: 2 }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">OPD Token / Admit ID / ER Number *</label>
                            <input
                                className="form-input"
                                placeholder="e.g. ER/2026/0342 or OPD/123"
                                value={admitId}
                                onChange={e => setAdmitId(e.target.value)}
                                id="admit-id"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Emergency Reason *</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {REASONS.map(r => (
                                    <label
                                        key={r.value}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                                            borderRadius: 10, cursor: 'pointer',
                                            border: `2px solid ${reasonCode === r.value ? '#dc2626' : 'var(--border)'}`,
                                            background: reasonCode === r.value ? 'rgba(220,38,38,0.05)' : 'var(--bg-primary)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <input type="radio" name="reason" value={r.value} checked={reasonCode === r.value} onChange={() => setReasonCode(r.value)} style={{ marginTop: 2 }} />
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Additional Details *</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Describe the emergency situation in detail..."
                                value={reasonDetail}
                                onChange={e => setReasonDetail(e.target.value)}
                                style={{ resize: 'none' }}
                                id="emergency-detail"
                            />
                        </div>

                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGrant}
                            disabled={submitting}
                            style={{
                                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                                background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
                                color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
                                transition: 'transform 0.2s ease',
                            }}
                            id="emergency-submit-btn"
                        >
                            {submitting ? <div className="loading-spinner" style={{ width: 18, height: 18 }} /> : <AlertTriangle size={18} />}
                            🚨 Grant Emergency Access
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
