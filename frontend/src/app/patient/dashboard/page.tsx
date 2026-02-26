'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { documentsApi, accessApi, auditApi } from '@/lib/api';
import {
    FileText, Shield, Clock, AlertTriangle, CheckCircle,
    XCircle, TrendingUp, Activity, Droplets, User,
} from 'lucide-react';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [docs, setDocs] = useState<unknown[]>([]);
    const [requests, setRequests] = useState<unknown[]>([]);
    const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
    const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            documentsApi.list(),
            accessApi.incoming(),
            auditApi.list(),
            documentsApi.emergencySummary(),
        ]).then(([d, r, a, s]) => {
            setDocs(d.data.results || d.data);
            setRequests(r.data.results || r.data);
            setAuditLogs(a.data.results || a.data);
            setSummary(s.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const pendingReqs = (requests as { status: string }[]).filter(r => r.status === 'PENDING');
    const approvedReqs = (requests as { status: string }[]).filter(r => r.status === 'APPROVED');
    const recentLogs = (auditLogs as unknown[]).slice(0, 5);

    const bloodGroupColors: Record<string, string> = {
        'A+': '#ef4444', 'A-': '#dc2626', 'B+': '#3b82f6', 'B-': '#2563eb',
        'AB+': '#8b5cf6', 'AB-': '#7c3aed', 'O+': '#10b981', 'O-': '#059669',
        'UNKNOWN': '#64748b',
    };

    const getActionBadge = (action: string) => {
        if (action.includes('EMERGENCY')) return <span className="badge badge-red">Emergency</span>;
        if (action.includes('VIEW')) return <span className="badge badge-blue">Viewed</span>;
        if (action.includes('UPLOAD')) return <span className="badge badge-green">Uploaded</span>;
        if (action.includes('ACCESS')) return <span className="badge badge-yellow">Access</span>;
        return <span className="badge badge-gray">{action}</span>;
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Patient Dashboard" />
                <div style={{ padding: '32px' }}>
                    {/* Welcome */}
                    <div className="page-header">
                        <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
                        <p className="page-subtitle">Patient ID: <strong>{user?.patient_id}</strong> · Your health records are secure</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Documents</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {loading ? '—' : (docs as unknown[]).length}
                                    </p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={22} color="#2563eb" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Pending Requests</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: pendingReqs.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                                        {loading ? '—' : pendingReqs.length}
                                    </p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={22} color="#f59e0b" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Active Access Grants</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>
                                        {loading ? '—' : approvedReqs.length}
                                    </p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={22} color="#10b981" />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Access Events</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {loading ? '—' : (auditLogs as unknown[]).length}
                                    </p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={22} color="#64748b" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* Emergency Summary Card */}
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <AlertTriangle size={18} color="#dc2626" />
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Emergency Summary Card</h3>
                            </div>
                            {summary ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: '50%', border: '3px solid',
                                            borderColor: bloodGroupColors[(summary as { blood_group: string }).blood_group] || '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--bg-primary)',
                                        }}>
                                            <Droplets size={20} color={bloodGroupColors[(summary as { blood_group: string }).blood_group] || '#64748b'} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 20 }}>{(summary as { blood_group: string }).blood_group}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Blood Group</div>
                                        </div>
                                    </div>
                                    {(summary as { allergies: string }).allergies && (
                                        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca' }}>
                                            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, marginBottom: 2 }}>⚠️ ALLERGIES</div>
                                            <div style={{ fontSize: 13, color: '#7f1d1d' }}>{(summary as { allergies: string }).allergies}</div>
                                        </div>
                                    )}
                                    {(summary as { chronic_conditions: string }).chronic_conditions && (
                                        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fde68a' }}>
                                            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 2 }}>🫀 CONDITIONS</div>
                                            <div style={{ fontSize: 13, color: '#78350f' }}>{(summary as { chronic_conditions: string }).chronic_conditions}</div>
                                        </div>
                                    )}
                                    {(summary as { emergency_contact: { name: string; phone: string; relation: string } }).emergency_contact?.name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <User size={16} color="var(--text-secondary)" />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>
                                                    {(summary as { emergency_contact: { name: string; phone: string; relation: string } }).emergency_contact.name}
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                                                        ({(summary as { emergency_contact: { relation: string } }).emergency_contact.relation})
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    {(summary as { emergency_contact: { phone: string } }).emergency_contact.phone}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                    No medical profile set. <a href="/patient/profile" style={{ color: 'var(--brand)' }}>Set up now →</a>
                                </div>
                            )}
                        </div>

                        {/* Pending access requests */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Pending Requests</h3>
                                <a href="/patient/access" style={{ fontSize: 13, color: 'var(--brand)' }}>View all →</a>
                            </div>
                            {pendingReqs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    <CheckCircle size={32} style={{ margin: '0 auto 8px', display: 'block', color: '#10b981' }} />
                                    <p style={{ fontSize: 14 }}>No pending requests</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(pendingReqs as unknown as { id: string; doctor_name: string; reason: string; scope: string[] }[]).slice(0, 3).map((req) => (
                                        <div key={req.id} style={{
                                            padding: '14px', borderRadius: 10,
                                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                        }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{req.doctor_name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{req.reason.slice(0, 80)}...</div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <a href="/patient/access" className="btn btn-success" style={{ padding: '6px 14px', fontSize: 12 }}>
                                                    <CheckCircle size={12} /> Approve
                                                </a>
                                                <a href="/patient/access" className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 12 }}>
                                                    <XCircle size={12} /> Reject
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Audit Log */}
                    <div className="card" style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Activity</h3>
                            <a href="/patient/audit" style={{ fontSize: 13, color: 'var(--brand)' }}>Full log →</a>
                        </div>
                        {recentLogs.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                                No activity yet
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>By</th>
                                        <th>Document</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recentLogs as { id: string; action: string; actor_name: string; document_title: string; is_emergency: boolean; created_at: string }[]).map(log => (
                                        <tr key={log.id}>
                                            <td>{getActionBadge(log.action)}</td>
                                            <td style={{ fontSize: 14 }}>{log.actor_name}</td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.document_title || '—'}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
