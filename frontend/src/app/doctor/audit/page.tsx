'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { auditApi } from '@/lib/api';
import { Search } from 'lucide-react';

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

export default function DoctorAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        auditApi.list().then(({ data }) => setLogs(data.results || data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = logs.filter(l => !search || l.action?.includes(search.toUpperCase()) || l.patient_name?.toLowerCase().includes(search.toLowerCase()) || l.document_title?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Activity Log" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">My Activity Log</h1>
                        <p className="page-subtitle">{logs.length} total actions</p>
                    </div>
                    <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                        <input className="form-input" placeholder="Search patient or document..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Action</th><th>Patient</th><th>Document</th><th>Time</th><th>🚨</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
                                ) : filtered.map(log => (
                                    <tr key={log.id} style={{ background: log.is_emergency ? 'rgba(220,38,38,0.04)' : '' }}>
                                        <td><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-primary)', fontWeight: 500 }}>{log.action.replace(/_/g, ' ')}</span></td>
                                        <td style={{ fontSize: 13 }}>{log.patient_name || '—'}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.document_title || '—'}</td>
                                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td>{log.is_emergency && <span className="badge badge-red" style={{ fontSize: 10 }}>🚨</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
