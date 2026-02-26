'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { accessApi, authApi } from '@/lib/api';
import { Search, Shield, CheckCircle, FileText } from 'lucide-react';

const SCOPES = [
    { value: 'ALL', label: 'All Documents' },
    { value: 'PRESCRIPTION', label: 'Prescriptions' },
    { value: 'REPORT', label: 'Lab Reports' },
    { value: 'SCAN', label: 'Scans / Imaging' },
    { value: 'DISCHARGE', label: 'Discharge Summaries' },
    { value: 'VACCINATION', label: 'Vaccination Records' },
];

interface Patient { id: string; full_name: string; patient_id: string; }

export default function DoctorRequestPage() {
    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [scope, setScope] = useState<string[]>(['PRESCRIPTION']);
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState(48);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setSearching(true);
        try {
            const { data } = await authApi.searchPatients(query);
            setPatients(data);
        } catch { /* ignore */ } finally { setSearching(false); }
    };

    const toggleScope = (val: string) => {
        if (val === 'ALL') { setScope(['ALL']); return; }
        setScope(s => {
            const without = s.filter(x => x !== 'ALL');
            return without.includes(val) ? without.filter(x => x !== val) : [...without, val];
        });
    };

    const handleSubmit = async () => {
        if (!selected || scope.length === 0 || !reason) return;
        setSubmitting(true);
        try {
            await accessApi.requestAccess({
                patient_id: selected.patient_id,
                scope,
                reason,
                duration_hours: duration,
            });
            setSuccess(true);
            setSelected(null); setQuery(''); setPatients([]); setReason(''); setScope(['PRESCRIPTION']);
        } catch { /* ignore */ } finally { setSubmitting(false); }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Request Access" />
                <div style={{ padding: '32px', maxWidth: 700 }}>
                    <div className="page-header">
                        <h1 className="page-title">Request Patient Access</h1>
                        <p className="page-subtitle">Search by Patient ID and request access to their records</p>
                    </div>

                    {success && (
                        <div style={{ padding: '16px 20px', borderRadius: 12, background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CheckCircle size={18} />
                            <div>
                                <strong>Request sent!</strong> The patient will receive a notification to approve or reject your access.
                            </div>
                        </div>
                    )}

                    {/* Step 1: Search patient */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>1. Find Patient</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                className="form-input"
                                placeholder="Enter Patient ID (e.g. MV12345678)"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                                id="patient-search-input"
                            />
                            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                                {searching ? <div className="loading-spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
                                Search
                            </button>
                        </div>
                        {patients.length > 0 && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {patients.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => { setSelected(p); setPatients([]); setQuery(p.patient_id); }}
                                        style={{
                                            padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                                            background: 'var(--bg-primary)', border: `1px solid ${selected?.id === p.id ? 'var(--brand)' : 'var(--border)'}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{p.full_name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.patient_id}</div>
                                        </div>
                                        <CheckCircle size={16} color="var(--success)" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {selected && (
                            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--brand-light)', border: '1px solid var(--brand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--brand)' }}>{selected.full_name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--brand)', opacity: 0.8 }}>{selected.patient_id}</div>
                                </div>
                                <CheckCircle size={18} color="var(--brand)" />
                            </div>
                        )}
                    </div>

                    {/* Step 2: Select scope */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>2. Select Document Scope</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {SCOPES.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => toggleScope(s.value)}
                                    style={{
                                        padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                                        border: `2px solid ${scope.includes(s.value) ? 'var(--brand)' : 'var(--border)'}`,
                                        background: scope.includes(s.value) ? 'var(--brand)' : 'var(--bg-card)',
                                        color: scope.includes(s.value) ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Reason & duration */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>3. Provide Reason</h3>
                        <div className="form-group">
                            <label className="form-label">Reason for access *</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="e.g. Patient visiting for follow-up cardiac consultation. Need previous ECG and lab reports."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                style={{ resize: 'none' }}
                                id="reason-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Access Duration</label>
                            <select className="form-input" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                                <option value={24}>24 Hours</option>
                                <option value={48}>48 Hours</option>
                                <option value={72}>3 Days</option>
                                <option value={168}>7 Days</option>
                                <option value={720}>30 Days</option>
                            </select>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!selected || scope.length === 0 || !reason || submitting}
                            style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }}
                            id="submit-request-btn"
                        >
                            {submitting ? <div className="loading-spinner" style={{ width: 16, height: 16 }} /> : <Shield size={16} />}
                            Send Access Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
