'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { HeartPulse, Mail, Lock, Eye, EyeOff, ArrowRight, Stethoscope, User, Shield } from 'lucide-react';

type Tab = 'patient' | 'doctor' | 'admin';

export default function LoginPage() {
    const [tab, setTab] = useState<Tab>('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        if (!email || !password) { setError('Email and password are required'); return; }
        setLoading(true);
        try {
            const { data } = await authApi.loginDoctor(email, password);
            login({ access: data.access, refresh: data.refresh }, data.user);
            const role = data.user.role;
            if (role === 'ADMIN') router.push('/admin/dashboard');
            else if (role === 'DOCTOR') router.push('/doctor/dashboard');
            else router.push('/patient/dashboard');
        } catch (e: unknown) {
            type ErrorShape = { error?: string; detail?: string };
            const err = e as { response?: { status?: number; data?: ErrorShape | Record<string, unknown> } };
            const errData = err.response?.data;

            const flattenErrors = (obj: unknown): string | null => {
                if (typeof obj === 'string') return obj;
                if (Array.isArray(obj)) {
                    for (const item of obj) { const msg = flattenErrors(item); if (msg) return msg; }
                } else if (obj && typeof obj === 'object') {
                    for (const val of Object.values(obj)) { const msg = flattenErrors(val); if (msg) return msg; }
                }
                return null;
            };

            if (err.response?.status === 401) {
                setError('Invalid email or password');
            } else if (errData && typeof errData === 'object') {
                if ('error' in errData && (errData as ErrorShape).error) setError((errData as ErrorShape).error!);
                else if ('detail' in errData && (errData as ErrorShape).detail) setError((errData as ErrorShape).detail!);
                else setError(flattenErrors(errData) || 'Login failed');
            } else {
                setError('Something went wrong. Check your API URL / CORS and try again.');
            }
        } finally { setLoading(false); }
    };

    const tabBtnStyle = (active: boolean) => ({
        flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 600,
        fontSize: 13, cursor: 'pointer', border: 'none',
        background: active ? 'var(--brand)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    } as React.CSSProperties);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}>
            {/* Left panel */}
            <div style={{
                flex: 1, flexDirection: 'column',
                justifyContent: 'center', padding: '60px 80px',
                display: 'none',
            }} className="login-left-panel">
                <div style={{ maxWidth: 480 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <HeartPulse size={28} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>MediVault</div>
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>India's Secure Medical Records Platform</div>
                        </div>
                    </div>
                    <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 20 }}>
                        Your Health Records,<br />Everywhere You Are
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7 }}>
                        Securely store and share your medical documents. Control who accesses your records.
                        Available across India, whenever you need it.
                    </p>
                    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { icon: '🔒', text: 'End-to-end consent-based access control' },
                            { icon: '⚡', text: 'Emergency break-glass with 1-hour limited access' },
                            { icon: '📋', text: 'Auto-organized health timeline' },
                            { icon: '🔔', text: 'Real-time notifications for every access event' },
                        ].map(({ icon, text }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 20 }}>{icon}</span>
                                <span style={{ color: '#cbd5e1', fontSize: 14 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 480, padding: '40px 40px', flex: 1,
            }}>
                <div style={{
                    width: '100%', maxWidth: 440,
                    background: 'rgba(30, 41, 59, 0.9)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 24, padding: 40,
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: 18,
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <HeartPulse size={28} color="white" />
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>Sign in to MediVault</h2>
                        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Secure medical records platform</p>
                    </div>

                    {/* Role tabs */}
                    <div style={{
                        display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)',
                        padding: 4, borderRadius: 12, marginBottom: 28,
                    }}>
                        <button onClick={() => { setTab('patient'); setError(''); }} style={tabBtnStyle(tab === 'patient')}>
                            <User size={14} /> Patient
                        </button>
                        <button onClick={() => { setTab('doctor'); setError(''); }} style={tabBtnStyle(tab === 'doctor')}>
                            <Stethoscope size={14} /> Doctor
                        </button>
                        <button onClick={() => { setTab('admin'); setError(''); }} style={tabBtnStyle(tab === 'admin')}>
                            <Shield size={14} /> Admin
                        </button>
                    </div>

                    {/* Email + Password form — same for all roles */}
                    <div>
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#94a3b8' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#64748b' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder={
                                        tab === 'patient' ? 'patient@email.com'
                                            : tab === 'doctor' ? 'doctor@hospital.com'
                                                : 'admin@medivault.app'
                                    }
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{ paddingLeft: 42, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.2)', color: 'white' }}
                                    id="email-input"
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#94a3b8' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#64748b' }} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ paddingLeft: 42, paddingRight: 42, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.2)', color: 'white' }}
                                    id="password-input"
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '13px 0' }}
                            onClick={handleLogin}
                            disabled={loading || !email || !password}
                            id="login-btn"
                        >
                            {loading ? <div className="loading-spinner" style={{ width: 18, height: 18 }} /> : <>Sign In <ArrowRight size={16} /></>}
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            marginTop: 16, padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', fontSize: 13,
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <span style={{ color: '#64748b', fontSize: 13 }}>Don't have an account? </span>
                        <a href="/register" style={{ color: '#3b82f6', fontSize: 13, fontWeight: 500 }}>Create account</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
