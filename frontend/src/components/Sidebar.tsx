'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard, FileText, Clock, Shield, ClipboardList,
    User, LogOut, AlertTriangle, Users, Activity, Bell,
    Stethoscope, HeartPulse,
} from 'lucide-react';

const patientLinks = [
    { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patient/documents', label: 'My Documents', icon: FileText },
    { href: '/patient/timeline', label: 'Health Timeline', icon: Clock },
    { href: '/patient/access', label: 'Access Control', icon: Shield },
    { href: '/patient/audit', label: 'Audit Log', icon: ClipboardList },
    { href: '/patient/profile', label: 'My Profile', icon: User },
];

const doctorLinks = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/request', label: 'Request Access', icon: Shield },
    { href: '/doctor/patients', label: 'My Patients', icon: Users },
    { href: '/doctor/emergency', label: 'Emergency Access', icon: AlertTriangle },
    { href: '/doctor/audit', label: 'Activity Log', icon: ClipboardList },
    { href: '/doctor/profile', label: 'My Profile', icon: User },
];

const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/emergency', label: 'Emergency Reviews', icon: AlertTriangle },
    { href: '/admin/audit', label: 'Full Audit Log', icon: Activity },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const links = user?.role === 'PATIENT'
        ? patientLinks
        : user?.role === 'DOCTOR'
            ? doctorLinks
            : adminLinks;

    const roleColor = user?.role === 'PATIENT'
        ? '#10b981'
        : user?.role === 'DOCTOR'
            ? '#3b82f6'
            : '#8b5cf6';

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <HeartPulse size={22} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>MediVault</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secure Records</div>
                </div>
            </div>

            {/* User badge */}
            {user && (
                <div style={{
                    margin: '12px', borderRadius: 10, padding: '12px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {user.role === 'DOCTOR' ? 'Dr. ' : ''}{user.full_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                            background: roleColor,
                        }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {user.role}
                            {user.patient_id ? ` · ${user.patient_id}` : ''}
                        </span>
                    </div>
                </div>
            )}

            {/* Nav links */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Navigation</div>
                {links.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                        {label === 'Emergency Access' && (
                            <span style={{
                                marginLeft: 'auto', fontSize: 10, background: '#fee2e2',
                                color: '#dc2626', padding: '2px 6px', borderRadius: 100, fontWeight: 600,
                            }}>HOT</span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
                <button
                    onClick={logout}
                    className="sidebar-link"
                    style={{ width: '100%', background: 'none', cursor: 'pointer' }}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
