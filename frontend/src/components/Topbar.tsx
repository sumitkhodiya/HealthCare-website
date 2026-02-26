'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Bell, Sun, Moon, Check, AlertTriangle, Shield, FileText, Info } from 'lucide-react';
import { notificationsApi } from '@/lib/api';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    is_read: boolean;
    actor_name: string;
    created_at: string;
}

export default function Topbar({ title }: { title?: string }) {
    const { theme, setTheme } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const { data } = await notificationsApi.list();
                setNotifications(data.results || data);
                const { data: cnt } = await notificationsApi.unreadCount();
                setUnread(cnt.unread_count);
            } catch { /* not logged in or error */ }
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = async () => {
        setOpen(!open);
        if (!open && unread > 0) {
            try {
                await notificationsApi.markRead();
                setUnread(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch { /* ignore */ }
        }
    };

    const getNotifIcon = (type: string) => {
        if (type === 'EMERGENCY_ACCESS') return <AlertTriangle size={14} color="#dc2626" />;
        if (type.includes('ACCESS')) return <Shield size={14} color="#2563eb" />;
        if (type.includes('DOCUMENT')) return <FileText size={14} color="#10b981" />;
        return <Info size={14} color="#64748b" />;
    };

    return (
        <div className="topbar">
            <div>
                {title && (
                    <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Dark mode toggle */}
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', transition: 'all 0.2s ease',
                        }}
                        title="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                )}

                {/* Notification bell */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={handleOpen}
                        id="notification-bell"
                        style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', position: 'relative',
                        }}
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unread > 0 && (
                            <span style={{
                                position: 'absolute', top: -4, right: -4,
                                background: '#ef4444', color: 'white',
                                fontSize: 10, fontWeight: 700,
                                width: 18, height: 18, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--bg-secondary)',
                            }}>
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="notif-dropdown animate-slide-in">
                            <div style={{
                                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <span style={{ fontWeight: 600, fontSize: 15 }}>Notifications</span>
                                <span className="badge badge-blue">{notifications.length}</span>
                            </div>
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No notifications yet
                                    </div>
                                ) : (
                                    notifications.slice(0, 15).map(n => (
                                        <div
                                            key={n.id}
                                            style={{
                                                padding: '14px 20px',
                                                borderBottom: '1px solid var(--border)',
                                                background: n.is_read ? 'transparent' : 'var(--brand-light)',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <div style={{ marginTop: 2 }}>{getNotifIcon(n.notification_type)}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                                        {n.title}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                        {n.message}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                        {new Date(n.created_at).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                {n.is_read && <Check size={14} color="var(--text-muted)" />}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
