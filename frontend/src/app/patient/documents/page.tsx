'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { documentsApi } from '@/lib/api';
import { Upload, FileText, Trash2, Download, Tag, Calendar, Hospital, X, Plus, Loader } from 'lucide-react';

const DOC_TYPES = [
    { value: 'PRESCRIPTION', label: 'Prescription', color: '#3b82f6' },
    { value: 'REPORT', label: 'Lab Report', color: '#10b981' },
    { value: 'SCAN', label: 'Scan / Imaging', color: '#8b5cf6' },
    { value: 'DISCHARGE', label: 'Discharge Summary', color: '#f59e0b' },
    { value: 'VACCINATION', label: 'Vaccination Record', color: '#ec4899' },
    { value: 'OTHER', label: 'Other', color: '#64748b' },
];

const EVENT_TYPES = [
    'HOSPITAL_VISIT', 'DIAGNOSIS', 'PROCEDURE', 'CHECKUP', 'EMERGENCY', 'OTHER',
];

interface Document {
    id: string;
    title: string;
    document_type: string;
    event_type: string;
    document_date: string;
    hospital_name: string;
    doctor_name: string;
    tags: string;
    is_critical: boolean;
    file_url: string;
    uploaded_by_name: string;
}

export default function PatientDocumentsPage() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title: '', document_type: 'PRESCRIPTION', event_type: 'HOSPITAL_VISIT',
        document_date: new Date().toISOString().split('T')[0],
        hospital_name: '', doctor_name: '', tags: '', is_critical: false,
    });
    const [file, setFile] = useState<File | null>(null);

    const fetchDocs = async () => {
        try {
            const params: Record<string, string> = {};
            if (typeFilter) params.document_type = typeFilter;
            const { data } = await documentsApi.list(params);
            setDocs(data.results || data);
        } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(); }, [typeFilter]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            fd.append('file', file);
            await documentsApi.upload(fd);
            setShowModal(false);
            setFile(null);
            setForm({ title: '', document_type: 'PRESCRIPTION', event_type: 'HOSPITAL_VISIT', document_date: new Date().toISOString().split('T')[0], hospital_name: '', doctor_name: '', tags: '', is_critical: false });
            await fetchDocs();
        } catch { /* handle */ } finally { setUploading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this document?')) return;
        await documentsApi.delete(id);
        setDocs(d => d.filter(x => x.id !== id));
    };

    const getTypeInfo = (t: string) => DOC_TYPES.find(d => d.value === t) || DOC_TYPES[5];

    const filtered = docs.filter(d =>
        !filter || d.title.toLowerCase().includes(filter.toLowerCase()) ||
        d.hospital_name?.toLowerCase().includes(filter.toLowerCase()) ||
        d.tags?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="My Documents" />
                <div style={{ padding: '32px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div className="page-header" style={{ margin: 0 }}>
                            <h1 className="page-title">Medical Documents</h1>
                            <p className="page-subtitle">{docs.length} documents stored securely</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="upload-btn">
                            <Upload size={16} /> Upload Document
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <input
                            className="form-input"
                            placeholder="Search by title, hospital, or tag..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ maxWidth: 300 }}
                        />
                        <select
                            className="form-input"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            style={{ maxWidth: 200 }}
                        >
                            <option value="">All Types</option>
                            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* Type pills */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                        {DOC_TYPES.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setTypeFilter(typeFilter === t.value ? '' : t.value)}
                                style={{
                                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                                    background: typeFilter === t.value ? t.color : 'var(--bg-card)',
                                    color: typeFilter === t.value ? 'white' : 'var(--text-secondary)',
                                    border: `1px solid ${typeFilter === t.value ? t.color : 'var(--border)'}`,
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                }}
                            >
                                {t.label} ({docs.filter(d => d.document_type === t.value).length})
                            </button>
                        ))}
                    </div>

                    {/* Document grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-muted)' }}>Loading documents...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No documents yet</p>
                            <p style={{ fontSize: 14 }}>Upload your first medical document</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {filtered.map(doc => {
                                const typeInfo = getTypeInfo(doc.document_type);
                                return (
                                    <div key={doc.id} className="doc-card">
                                        {doc.is_critical && (
                                            <span style={{
                                                position: 'absolute', top: 12, right: 12,
                                                fontSize: 10, background: '#fee2e2', color: '#dc2626',
                                                padding: '2px 8px', borderRadius: 100, fontWeight: 600,
                                            }}>⚡ CRITICAL</span>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                                background: typeInfo.color + '20',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <FileText size={20} color={typeInfo.color} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {doc.title}
                                                </div>
                                                <span style={{ fontSize: 11, background: typeInfo.color + '20', color: typeInfo.color, padding: '2px 8px', borderRadius: 100, fontWeight: 500 }}>
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                            {doc.hospital_name && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    <Hospital size={12} /> {doc.hospital_name}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                <Calendar size={12} /> {new Date(doc.document_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            {doc.tags && (
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {doc.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                                                        <span key={tag} style={{ fontSize: 10, background: 'var(--bg-primary)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border)' }}>
                                                            <Tag size={8} style={{ display: 'inline', marginRight: 2 }} />{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {doc.file_url && (
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px 0', fontSize: 12 }}>
                                                    <Download size={13} /> View
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(doc.id)} className="btn btn-danger" style={{ padding: '8px 14px', fontSize: 12 }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Upload Document</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Document Title *</label>
                                <input className="form-input" placeholder="e.g. Blood Test Report - AIIMS" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Document Type *</label>
                                <select className="form-input" value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}>
                                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Event Type</label>
                                <select className="form-input" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Document Date *</label>
                                <input type="date" className="form-input" value={form.document_date} onChange={e => setForm(f => ({ ...f, document_date: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Hospital / Clinic</label>
                                <input className="form-input" placeholder="Hospital name" value={form.hospital_name} onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))} />
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Tags (comma separated)</label>
                                <input className="form-input" placeholder="e.g. cardiology, blood, CBC" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.is_critical} onChange={e => setForm(f => ({ ...f, is_critical: e.target.checked }))} />
                                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>⚡ Mark as critical (accessible in emergencies)</span>
                                </label>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">File *</label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    style={{
                                        border: '2px dashed var(--border)', borderRadius: 12, padding: '24px',
                                        textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                                        background: file ? 'var(--brand-light)' : 'var(--bg-primary)',
                                        borderColor: file ? 'var(--brand)' : 'var(--border)',
                                    }}
                                >
                                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                                    {file ? (
                                        <div style={{ color: 'var(--brand)', fontWeight: 500 }}>✓ {file.name}</div>
                                    ) : (
                                        <div>
                                            <Upload size={24} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                                            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Click to select file</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, JPG, PNG, DOC up to 50MB</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={!form.title || !file || uploading}
                                style={{ flex: 1, justifyContent: 'center' }}
                                id="upload-submit-btn"
                            >
                                {uploading ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Uploading...</> : <><Plus size={14} /> Upload</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
