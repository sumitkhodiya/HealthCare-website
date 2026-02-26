'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { accessApi } from '@/lib/api';
import { AlertTriangle, CheckCircle, Flag, Clock } from 'lucide-react';

interface EmergencyAccess {
    id: string;
    doctor_name: string;
    patient_name: string;
    reason_code: string;
    reason_detail: string;
    patient_admit_id: string;
    granted_at: string;
    expires_at: string;
    is_active: boolean;
    is_reviewed_by_admin: boolean;
    is_flagged_misuse: boolean;
    admin_note: string;
}

export default function AdminEmergencyPage() {
    const [accesses, setAccesses] = useState<EmergencyAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState<string | null>(null);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const fetchAccesses = async () => {
        try {
            const { data } = await accessApi.allEmergencies();
            setAccesses(data.results || data);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchAccesses(); }, []);

    const handleReview = async (id: string, flagMisuse: boolean) => {
        setReviewing(id);
        try {
            await accessApi.reviewEmergency(id, {
                flag_misuse: flagMisuse,
                admin_note: note,
            });
            setNoteId(null); setNote('');
            await fetchAccesses();
        } catch { /* ignore */ } finally { setReviewing(null); }
    };

    const unreviewedCount = accesses.filter(a => !a.is_reviewed_by_admin).length;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Emergency Reviews" />
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div>
                            <h1 className="page-title">Emergency Access Review</h1>
                            <p className="page-subtitle">{unreviewedCount} pending review{unreviewedCount !== 1 ? 's' : ''}</p>
                        </div>
                        {unreviewedCount > 0 && (
                            <div style={{ padding: '10px 16px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={16} color="#dc2626" />
                                <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{unreviewedCount} require review</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
                    ) : accesses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#10b981' }} />
                            <p style={{ fontSize: 16 }}>No emergency accesses recorded</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {accesses.map(a => (
                                <div key={a.id} className="card" style={{
                                    borderLeft: `4px solid ${a.is_flagged_misuse ? '#dc2626' : a.is_reviewed_by_admin ? '#10b981' : '#f59e0b'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                                                {a.doctor_name} → {a.patient_name}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {a.is_flagged_misuse ? (
                                                    <span className="badge badge-red"><Flag size={10} /> Flagged as Misuse</span>
                                                ) : a.is_reviewed_by_admin ? (
                                                    <span className="badge badge-green"><CheckCircle size={10} /> Reviewed & Cleared</span>
                                                ) : (
                                                    <span className="badge badge-yellow"><Clock size={10} /> Pending Review</span>
                                                )}
                                                {a.is_active && <span className="badge badge-orange">🔴 Active Now</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(a.granted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>REASON</div><div style={{ fontSize: 13 }}>{a.reason_code.replace(/_/g, ' ')}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>ADMIT ID</div><div style={{ fontSize: 13, fontFamily: 'monospace' }}>{a.patient_admit_id}</div></div>
                                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>EXPIRES</div><div style={{ fontSize: 13 }}>{new Date(a.expires_at).toLocaleString('en-IN', { timeStyle: 'short' })}</div></div>
                                    </div>

                                    <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                        {a.reason_detail}
                                    </div>

                                    {a.admin_note && (
                                        <div style={{ padding: '10px 14px', background: '#dbeafe', borderRadius: 8, fontSize: 13, color: '#1e40af', marginBottom: 16 }}>
                                            <strong>Admin Note:</strong> {a.admin_note}
                                        </div>
                                    )}

                                    {!a.is_reviewed_by_admin && (
                                        <>
                                            {noteId === a.id ? (
                                                <div style={{ marginBottom: 12 }}>
                                                    <textarea
                                                        className="form-input"
                                                        rows={2}
                                                        value={note}
                                                        onChange={e => setNote(e.target.value)}
                                                        placeholder="Admin review note (optional)..."
                                                        style={{ resize: 'none', marginBottom: 8 }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn btn-success" onClick={() => handleReview(a.id, false)} disabled={reviewing === a.id}>
                                                            <CheckCircle size={14} /> Mark as Reviewed
                                                        </button>
                                                        <button className="btn btn-danger" onClick={() => handleReview(a.id, true)} disabled={reviewing === a.id}>
                                                            <Flag size={14} /> Flag as Misuse
                                                        </button>
                                                        <button className="btn btn-secondary" onClick={() => setNoteId(null)} style={{ fontSize: 13 }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button className="btn btn-secondary" onClick={() => { setNoteId(a.id); setNote(''); }}>
                                                    Review This Access
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
