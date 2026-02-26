'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { accessApi, documentsApi } from '@/lib/api';
import { Shield, Clock, FileText, Users, AlertTriangle } from 'lucide-react';

export default function DoctorDashboard() {
    const [myRequests, setMyRequests] = useState<unknown[]>([]);
    const [myEmergencies, setMyEmergencies] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            accessApi.myRequests(),
            accessApi.myEmergencies(),
        ]).then(([r, e]) => {
            setMyRequests(r.data.results || r.data);
            setMyEmergencies(e.data.results || e.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const approved = (myRequests as { status: string; is_active: boolean }[]).filter(r => r.status === 'APPROVED' && r.is_active);
    const pending = (myRequests as { status: string }[]).filter(r => r.status === 'PENDING');

    const getStatusBadge = (status: string, isActive: boolean) => {
        if (status === 'APPROVED' && isActive) return <span className="badge badge-green">Active</span>;
        if (status === 'APPROVED') return <span className="badge badge-gray">Expired</span>;
        if (status === 'PENDING') return <span className="badge badge-yellow">Pending</span>;
        if (status === 'REJECTED') return <span className="badge badge-red">Rejected</span>;
        return <span className="badge badge-gray">{status}</span>;
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Doctor Dashboard" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Doctor Dashboard</h1>
                        <p className="page-subtitle">Manage your patient access and records</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Active Accesses</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>{loading ? '—' : approved.length}</p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Shield size={22} color="#10b981" />
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Pending Requests</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--warning)' }}>{loading ? '—' : pending.length}</p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={22} color="#f59e0b" />
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Emergency Uses</p>
                                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>{loading ? '—' : (myEmergencies as unknown[]).length}</p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertTriangle size={22} color="#ef4444" />
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Patients</p>
                                    <p style={{ fontSize: 32, fontWeight: 700 }}>
                                        {loading ? '—' : new Set((myRequests as { patient: string }[]).map(r => r.patient)).size}
                                    </p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={22} color="#3b82f6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active accesses */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>My Access Requests</h3>
                            <a href="/doctor/request" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                                + New Request
                            </a>
                        </div>
                        {loading ? (
                            <div className="loading-spinner" style={{ margin: '20px auto' }} />
                        ) : (myRequests as unknown[]).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                <Shield size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                                <p>No access requests yet</p>
                                <a href="/doctor/request" style={{ color: 'var(--brand)', fontSize: 14 }}>Request patient access →</a>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Patient</th><th>Scope</th><th>Reason</th><th>Status</th><th>Expires</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {(myRequests as { id: string; patient_name: string; patient_id_code: string; scope: string[]; reason: string; status: string; is_active: boolean; expires_at: string }[]).map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{req.patient_name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{req.patient_id_code}</div>
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {req.scope.includes('ALL') ? 'All Docs' : req.scope.join(', ')}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {req.reason}
                                            </td>
                                            <td>{getStatusBadge(req.status, req.is_active)}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {req.expires_at ? new Date(req.expires_at).toLocaleDateString('en-IN') : '—'}
                                            </td>
                                            <td>
                                                {req.status === 'APPROVED' && req.is_active && (
                                                    <a href={`/doctor/patients?id=${req.patient_id_code}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                                                        <FileText size={12} /> View Records
                                                    </a>
                                                )}
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
