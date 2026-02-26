'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { accessApi } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Shield, AlertTriangle, RefreshCw, Timer } from 'lucide-react';

interface AccessRequest {
    id: string;
    doctor_name: string;
    patient_name: string;
    status: string;
    scope: string[];
    reason: string;
    requested_at: string;
    expires_at: string;
    is_active: boolean;
}

export default function PatientAccessPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

    const fetchRequests = async () => {
        try {
            const { data } = await accessApi.incoming();
            setRequests(data.results || data);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleRespond = async (id: string, action: 'approve' | 'reject' | 'revoke', duration = 24) => {
        setResponding(id);
        try {
            await accessApi.respond(id, { action, duration_hours: duration });
            await fetchRequests();
        } catch { /* ignore */ } finally { setResponding(null); }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            PENDING: 'badge-yellow', APPROVED: 'badge-green',
            REJECTED: 'badge-red', REVOKED: 'badge-gray', EXPIRED: 'badge-gray',
        };
        return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
    };

    const getScopeLabel = (scope: string[]) => {
        if (scope.includes('ALL')) return 'All Documents';
        return scope.map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(', ');
    };

    const filtered = requests.filter(r => {
        if (activeTab === 'pending') return r.status === 'PENDING';
        if (activeTab === 'approved') return r.status === 'APPROVED';
        return true;
    });

    const pending = requests.filter(r => r.status === 'PENDING');
    const approved = requests.filter(r => r.status === 'APPROVED' && r.is_active);

    const getTimeLeft = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Access Control" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Access Control</h1>
                        <p className="page-subtitle">Manage who can see your medical records</p>
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                        <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Clock size={18} color="#f59e0b" />
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#92400e' }}>{pending.length}</div>
                                <div style={{ fontSize: 12, color: '#a16207' }}>Pending Approval</div>
                            </div>
                        </div>
                        <div style={{ padding: '14px 20px', borderRadius: 12, background: '#d1fae5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Shield size={18} color="#10b981" />
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>{approved.length}</div>
                                <div style={{ fontSize: 12, color: '#047857' }}>Active Grants</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 12, width: 'fit-content', border: '1px solid var(--border)', marginBottom: 24 }}>
                        {(['pending', 'approved', 'all'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                style={{
                                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                    background: activeTab === t ? 'var(--brand)' : 'transparent',
                                    color: activeTab === t ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                {t === 'pending' && pending.length > 0 && (
                                    <span style={{ marginLeft: 6, background: '#ef4444', color: 'white', fontSize: 10, padding: '1px 5px', borderRadius: 100 }}>{pending.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div className="loading-spinner" style={{ margin: '0 auto' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <Shield size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                            <p style={{ fontSize: 16, fontWeight: 500 }}>No {activeTab} requests</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {filtered.map(req => (
                                <div key={req.id} className="card" style={{
                                    borderLeft: `4px solid ${req.status === 'PENDING' ? '#f59e0b' : req.status === 'APPROVED' ? '#10b981' : '#64748b'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16 }}>{req.doctor_name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                Requested {new Date(req.requested_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                        {getStatusBadge(req.status)}
                                    </div>

                                    <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Scope of Access</div>
                                            <div style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 500 }}>{getScopeLabel(req.scope)}</div>
                                        </div>
                                        {req.expires_at && req.status === 'APPROVED' && (
                                            <div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Time Left</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--warning)', fontWeight: 500 }}>
                                                    <Timer size={14} /> {getTimeLeft(req.expires_at)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>REASON</div>
                                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{req.reason}</div>
                                    </div>

                                    {req.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleRespond(req.id, 'approve', 48)}
                                                disabled={responding === req.id}
                                                id={`approve-${req.id}`}
                                            >
                                                {responding === req.id ? <RefreshCw size={14} /> : <CheckCircle size={14} />}
                                                Approve (48h)
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleRespond(req.id, 'approve', 168)}
                                                disabled={responding === req.id}
                                            >
                                                Approve (7 days)
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleRespond(req.id, 'reject')}
                                                disabled={responding === req.id}
                                                id={`reject-${req.id}`}
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    )}
                                    {req.status === 'APPROVED' && req.is_active && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleRespond(req.id, 'revoke')}
                                            disabled={responding === req.id}
                                        >
                                            <XCircle size={14} /> Revoke Access
                                        </button>
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
