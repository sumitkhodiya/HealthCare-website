'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { authApi, accessApi } from '@/lib/api';
import { Users, Shield, AlertTriangle, Activity, CheckCircle, XCircle, Flag } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<Record<string, number>>({});
    const [emergencies, setEmergencies] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            authApi.adminStats(),
            accessApi.allEmergencies(),
        ]).then(([s, e]) => {
            setStats(s.data);
            setEmergencies((e.data.results || e.data).slice(0, 5));
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Admin Dashboard" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">Platform-wide overview and control</p>
                    </div>

                    <div className="stats-grid">
                        {[
                            { label: 'Total Patients', key: 'total_patients', icon: Users, color: '#3b82f6', bg: '#dbeafe' },
                            { label: 'Total Doctors', key: 'total_doctors', icon: Shield, color: '#8b5cf6', bg: '#ede9fe' },
                            { label: 'Total Documents', key: 'total_documents', icon: Activity, color: '#10b981', bg: '#d1fae5' },
                            { label: 'Emergency Today', key: 'emergency_accesses_today', icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
                            { label: 'Pending Requests', key: 'pending_access_requests', icon: Shield, color: '#f59e0b', bg: '#fef3c7' },
                            { label: 'Doctor Approvals', key: 'pending_doctor_approvals', icon: Users, color: '#64748b', bg: '#f1f5f9' },
                        ].map(({ label, key, icon: Icon, color, bg }) => (
                            <div key={key} className="stat-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
                                        <p style={{ fontSize: 32, fontWeight: 700, color }}>{loading ? '—' : stats[key] ?? 0}</p>
                                    </div>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={22} color={color} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent emergencies */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Emergency Accesses</h3>
                            <a href="/admin/emergency" style={{ fontSize: 13, color: 'var(--brand)' }}>Review all →</a>
                        </div>
                        {emergencies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                <CheckCircle size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#10b981' }} />
                                No emergency accesses today
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Doctor</th><th>Patient</th><th>Reason</th><th>Time</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {(emergencies as { id: string; doctor_name: string; patient_name: string; reason_code: string; granted_at: string; is_reviewed_by_admin: boolean; is_flagged_misuse: boolean }[]).map(e => (
                                        <tr key={e.id} style={{ background: 'rgba(220,38,38,0.02)' }}>
                                            <td style={{ fontWeight: 600 }}>{e.doctor_name}</td>
                                            <td>{e.patient_name}</td>
                                            <td style={{ fontSize: 12 }}>{e.reason_code.replace(/_/g, ' ')}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {new Date(e.granted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td>
                                                {e.is_flagged_misuse ? <span className="badge badge-red"><Flag size={10} /> Flagged</span>
                                                    : e.is_reviewed_by_admin ? <span className="badge badge-green"><CheckCircle size={10} /> Reviewed</span>
                                                        : <span className="badge badge-yellow">Pending Review</span>}
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
