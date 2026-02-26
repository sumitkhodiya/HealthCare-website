'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { documentsApi } from '@/lib/api';
import { FileText, Calendar, Hospital, Tag } from 'lucide-react';

interface TimelineDoc {
    id: string;
    title: string;
    document_type: string;
    event_type: string;
    document_date: string;
    month_year: string;
    hospital_name: string;
    doctor_name: string;
    tags: string;
    is_critical: boolean;
    file_url: string;
}

const eventColors: Record<string, { bg: string; color: string; emoji: string }> = {
    HOSPITAL_VISIT: { bg: '#dbeafe', color: '#1d4ed8', emoji: '🏥' },
    DIAGNOSIS: { bg: '#ede9fe', color: '#6d28d9', emoji: '🔬' },
    PROCEDURE: { bg: '#fee2e2', color: '#b91c1c', emoji: '🩺' },
    CHECKUP: { bg: '#d1fae5', color: '#065f46', emoji: '✅' },
    EMERGENCY: { bg: '#fee2e2', color: '#b91c1c', emoji: '🚨' },
    OTHER: { bg: '#f1f5f9', color: '#475569', emoji: '📄' },
};

export default function HealthTimelinePage() {
    const [docs, setDocs] = useState<TimelineDoc[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        documentsApi.timeline().then(({ data }) => {
            setDocs(data.results || data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    // Group by month_year
    const grouped: Record<string, TimelineDoc[]> = {};
    docs.forEach(doc => {
        const key = doc.month_year || 'Unknown';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(doc);
    });

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="Health Timeline" />
                <div style={{ padding: '32px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Health Timeline</h1>
                        <p className="page-subtitle">{docs.length} medical events tracked</p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
                    ) : docs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                            <Calendar size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                            <p style={{ fontSize: 16, fontWeight: 500 }}>No health events yet</p>
                            <p style={{ fontSize: 14 }}>Upload documents to see your timeline</p>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 720 }}>
                            {Object.entries(grouped).map(([month, items]) => (
                                <div key={month} style={{ marginBottom: 40 }}>
                                    <div style={{
                                        display: 'inline-block', padding: '6px 16px', borderRadius: 100,
                                        background: 'var(--brand)', color: 'white',
                                        fontSize: 13, fontWeight: 700, marginBottom: 24,
                                    }}>
                                        📅 {month}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {items.map((doc, idx) => {
                                            const ev = eventColors[doc.event_type] || eventColors.OTHER;
                                            return (
                                                <div key={doc.id} className="timeline-item">
                                                    <div className="timeline-dot" style={{ background: ev.bg, borderColor: ev.color, color: ev.color }}>
                                                        <span style={{ fontSize: 16 }}>{ev.emoji}</span>
                                                    </div>
                                                    <div className="card" style={{ flex: 1, padding: '16px 20px', marginBottom: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{doc.title}</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                        <Calendar size={11} />
                                                                        {new Date(doc.document_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                    </span>
                                                                    {doc.hospital_name && (
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                            <Hospital size={11} /> {doc.hospital_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {doc.tags && (
                                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                                        {doc.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                                                            <span key={tag} style={{ fontSize: 10, background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                {doc.is_critical && (
                                                                    <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>⚡</span>
                                                                )}
                                                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: ev.bg, color: ev.color, fontWeight: 500 }}>
                                                                    {doc.document_type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {doc.file_url && (
                                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--brand)', marginTop: 10, textDecoration: 'none' }}>
                                                                <FileText size={12} /> View Document →
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
