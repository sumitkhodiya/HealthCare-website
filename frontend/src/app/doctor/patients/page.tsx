'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { documentsApi } from '@/lib/api';
import { FileText, Download, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Document {
    id: string;
    title: string;
    document_type: string;
    event_type: string;
    document_date: string;
    hospital_name: string;
    tags: string;
    is_critical: boolean;
    file_url: string;
}

function PatientRecordsContent() {
    const searchParams = useSearchParams();
    const patientId = searchParams.get('id') || '';
    const isEmergency = searchParams.get('emergency') === 'true';
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

    useEffect(() => {
        if (!patientId) { setLoading(false); return; }
        Promise.all([
            documentsApi.list({ patient_id: patientId }),
            documentsApi.emergencySummary(patientId),
        ]).then(([d, s]) => {
            setDocs(d.data.results || d.data);
            setSummary(s.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [patientId]);

    const docTypeColor: Record<string, string> = {
        PRESCRIPTION: '#3b82f6', REPORT: '#10b981', SCAN: '#8b5cf6',
        DISCHARGE: '#f59e0b', VACCINATION: '#ec4899', OTHER: '#64748b',
    };

    return (
        <div style={{ padding: '32px' }}>
            {!patientId ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                    <p>No patient selected. Go to Request Access to find a patient.</p>
                </div>
            ) : (
                <>
                    {isEmergency && (
                        <div className="emergency-banner" style={{ marginBottom: 24 }}>
                            <AlertTriangle size={20} />
                            <div>
                                <strong>Emergency Access Active</strong> — You are viewing critical documents only. Access expires in 1 hour.
                            </div>
                        </div>
                    )}

                    {summary && (
                        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #dc2626' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#dc2626' }}>
                                ⚡ Emergency Summary — {(summary as { full_name: string }).full_name} ({(summary as { patient_id: string }).patient_id})
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>BLOOD GROUP</div><div style={{ fontWeight: 700, fontSize: 18 }}>{(summary as { blood_group: string }).blood_group}</div></div>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ALLERGIES</div><div style={{ fontSize: 13 }}>{(summary as { allergies: string }).allergies || 'None stated'}</div></div>
                                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CONDITIONS</div><div style={{ fontSize: 13 }}>{(summary as { chronic_conditions: string }).chronic_conditions || 'None stated'}</div></div>
                            </div>
                        </div>
                    )}

                    <div className="page-header">
                        <h1 className="page-title">Patient Records</h1>
                        <p className="page-subtitle">{docs.length} documents {isEmergency ? '(critical only)' : 'within your access scope'}</p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
                    ) : docs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No documents accessible</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {docs.map(doc => (
                                <div key={doc.id} className="doc-card">
                                    {doc.is_critical && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>⚡</span>}
                                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: (docTypeColor[doc.document_type] || '#64748b') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={18} color={docTypeColor[doc.document_type] || '#64748b'} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(doc.document_date).toLocaleDateString('en-IN')}</div>
                                        </div>
                                    </div>
                                    {doc.hospital_name && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>🏥 {doc.hospital_name}</div>}
                                    {doc.file_url && (
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                                            <Download size={12} /> View Document
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function DoctorPatientsPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Patient Records" />
                <Suspense fallback={<div style={{ padding: 32 }}><div className="loading-spinner" /></div>}>
                    <PatientRecordsContent />
                </Suspense>
            </div>
        </div>
    );
}
