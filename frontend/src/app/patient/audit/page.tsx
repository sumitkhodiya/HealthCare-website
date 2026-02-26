'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { auditApi } from '@/lib/api';
import { AlertTriangle, Eye, Upload, Shield, LogIn } from 'lucide-react';

interface AuditLog {
    id: string;
    actor_name: string;
    patient_name: string;
    action: string;
    document_title: string;
    is_emergency: boolean;
    ip_address: string;
    created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
    DOCUMENT_VIEW: <Eye size={14} color="#3b82f6" />,
    DOCUMENT_DOWNLOAD: <Eye size={14} color="#8b5cf6" />,
    DOCUMENT_UPLOAD: <Upload size={14} color="#10b981" />,
    EMERGENCY_ACCESS: <AlertTriangle size={14} color="#dc2626" />,
    ACCESS_APPROVE: <Shield size={14} color="#10b981" />,
    ACCESS_REQUEST: <Shield size={14} color="#f59e0b" />,
    LOGIN: <LogIn size={14} color="#64748b" />,
};

export default function PatientAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        auditApi.list().then(({ data }) => {
            setLogs(data.results || data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = logs.filter(l =>
        !filter ||
        l.actor_name?.toLowerCase().includes(filter.toLowerCase()) ||
        l.action?.toLowerCase().includes(filter.toLowerCase()) ||
        l.document_title?.toLowerCase().includes(filter.toLowerCase())
    );

    const emergencyLogs = logs.filter(l => l.is_emergency);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Audit Log" />
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div className="page-header" style={{ margin: 0 }}>
                            <h1 className="page-title">Access Audit Log</h1>
                            <p className="page-subtitle">Every action on your records is logged</p>
                        </div>
                        {emergencyLogs.length > 0 && (
                            <div style={{
                                padding: '10px 16px', borderRadius: 10,
                                background: '#fee2e2', border: '1px solid #fca5a5',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <AlertTriangle size={16} color="#dc2626" />
                                <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                                    {emergencyLogs.length} emergency access{emergencyLogs.length > 1 ? 'es' : ''} detected
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <input
                            className="form-input"
                            placeholder="Search by doctor, action, or document..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ maxWidth: 400 }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>By</th>
                                        <th>Document</th>
                                        <th>IP Address</th>
                                        <th>Time</th>
                                        <th>Flag</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                                No audit logs found
                                            </td>
                                        </tr>
                                    ) : filtered.map(log => (
                                        <tr key={log.id} style={{ background: log.is_emergency ? 'rgba(220,38,38,0.03)' : 'transparent' }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {actionIcons[log.action] || <Eye size={14} color="#64748b" />}
                                                    <span style={{ fontSize: 12, fontWeight: 500 }}>{log.action.replace(/_/g, ' ')}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 14, fontWeight: 500 }}>{log.actor_name}</td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.document_title || '—'}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                {log.ip_address || '—'}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td>
                                                {log.is_emergency && (
                                                    <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertTriangle size={10} /> EMERGENCY
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
