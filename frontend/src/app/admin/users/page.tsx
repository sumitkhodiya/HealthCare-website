'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { authApi } from '@/lib/api';
import { Users, Shield, CheckCircle, XCircle, Search } from 'lucide-react';

interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    patient_id: string;
    is_active: boolean;
    is_approved: boolean;
    date_joined: string;
    doctor_profile?: { specialization: string; hospital_name: string; license_number: string; is_verified: boolean };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const { data } = await authApi.adminUsers(roleFilter);
            setUsers(data.results || data);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const handleToggle = async (userId: string, action: 'block' | 'unblock' | 'approve') => {
        setActioning(userId);
        try {
            await authApi.adminToggleUser(userId, action);
            await fetchUsers();
        } catch { /* ignore */ } finally { setActioning(null); }
    };

    const filtered = users.filter(u =>
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.patient_id?.includes(search)
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="User Management" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">User Management</h1>
                        <p className="page-subtitle">{users.length} total users on the platform</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
                            <input className="form-input" placeholder="Search name, email, or patient ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, minWidth: 280 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
                            {['', 'PATIENT', 'DOCTOR', 'ADMIN'].map(r => (
                                <button key={r} onClick={() => setRoleFilter(r)} style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                                    background: roleFilter === r ? 'var(--brand)' : 'transparent',
                                    color: roleFilter === r ? 'white' : 'var(--text-secondary)',
                                }}>
                                    {r || 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
                                ) : filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.role === 'DOCTOR' ? 'Dr. ' : ''}{u.full_name}</div>
                                            {u.patient_id && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.patient_id}</div>}
                                            {u.doctor_profile?.specialization && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.doctor_profile.specialization}</div>}
                                        </td>
                                        <td>
                                            <span className={`badge ${u.role === 'PATIENT' ? 'badge-green' : u.role === 'DOCTOR' ? 'badge-blue' : 'badge-orange'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13 }}>{u.email}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phone || '—'}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`} style={{ width: 'fit-content' }}>
                                                    {u.is_active ? 'Active' : 'Blocked'}
                                                </span>
                                                {u.role === 'DOCTOR' && !u.is_approved && (
                                                    <span className="badge badge-yellow" style={{ width: 'fit-content', fontSize: 10 }}>Pending Approval</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(u.date_joined).toLocaleDateString('en-IN')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {u.is_active ? (
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '5px 10px', fontSize: 11 }}
                                                        onClick={() => handleToggle(u.id, 'block')}
                                                        disabled={actioning === u.id}
                                                    >
                                                        <XCircle size={11} /> Block
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-success"
                                                        style={{ padding: '5px 10px', fontSize: 11 }}
                                                        onClick={() => handleToggle(u.id, 'unblock')}
                                                        disabled={actioning === u.id}
                                                    >
                                                        <CheckCircle size={11} /> Unblock
                                                    </button>
                                                )}
                                                {u.role === 'DOCTOR' && !u.is_approved && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '5px 10px', fontSize: 11 }}
                                                        onClick={() => handleToggle(u.id, 'approve')}
                                                        disabled={actioning === u.id}
                                                    >
                                                        <CheckCircle size={11} /> Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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
