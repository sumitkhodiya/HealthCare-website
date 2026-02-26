'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import {
    HeartPulse, ArrowRight, User, Stethoscope,
    Eye, EyeOff,
} from 'lucide-react';

type Tab = 'patient' | 'doctor';

const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 500,
    background: 'rgba(30,41,59,0.92)', backdropFilter: 'blur(20px)',
    borderRadius: 24, padding: '36px 40px',
    border: '1px solid rgba(148,163,184,0.12)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
};
const inputStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.55)',
    border: '1px solid rgba(148,163,184,0.2)', color: 'white',
};
const labelStyle: React.CSSProperties = { color: '#94a3b8' };

export default function RegisterPage() {
    const [tab, setTab] = useState<Tab>('patient');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        full_name: '', email: '', phone: '', password: '',
        city: '', state: '',
        specialization: '', hospital_name: '', license_number: '',
    });

    const setF = (key: keyof typeof form) => (val: string) =>
        setForm(f => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        setError('');
        if (!form.full_name.trim()) { setError('Full name is required'); return; }
        if (!/^\d{10}$/.test(form.phone)) { setError('Enter a valid 10-digit mobile number'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email address'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (tab === 'doctor' && !form.license_number.trim()) { setError('License number is required for doctors'); return; }
        if (tab === 'doctor' && !form.specialization.trim()) { setError('Specialization is required for doctors'); return; }

        setLoading(true);
        try {
            let data;
            if (tab === 'patient') {
                const res = await authApi.registerPatient({
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    patient_profile: { city: form.city, state: form.state },
                });
                data = res.data;
            } else {
                const res = await authApi.registerDoctor({
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    doctor_profile: {
                        specialization: form.specialization,
                        hospital_name: form.hospital_name,
                        license_number: form.license_number,
                    },
                });
                data = res.data;
            }

            login({ access: data.access, refresh: data.refresh }, data.user);
            router.push(tab === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
        } catch (e: unknown) {
            type ErrorShape = { error?: string };
            const err = e as { response?: { data?: ErrorShape | Record<string, unknown> } };
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

            if (errData && 'error' in errData) {
                setError((errData as ErrorShape).error || 'Registration failed');
            } else if (errData) {
                setError(flattenErrors(errData) || 'Registration failed');
            } else {
                setError('Something went wrong. Try again.');
            }
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '32px 20px',
        }}>
            <div style={cardStyle}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, margin: '0 auto 10px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <HeartPulse size={22} color="white" />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 2 }}>Create your MediVault account</h2>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Already have an account? <a href="/login" style={{ color: '#3b82f6' }}>Sign in</a></p>
                </div>

                {/* Role tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', padding: 4, borderRadius: 12, marginBottom: 22 }}>
                    {(['patient', 'doctor'] as Tab[]).map(t => (
                        <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                            flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 600, fontSize: 13,
                            cursor: 'pointer', border: 'none',
                            background: tab === t ? 'var(--brand)' : 'transparent',
                            color: tab === t ? 'white' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                            {t === 'patient' ? <User size={13} /> : <Stethoscope size={13} />}
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Common fields */}
                    {[
                        { label: 'Full Name', key: 'full_name', type: 'text', placeholder: tab === 'doctor' ? 'Dr. Priya Mehta' : 'Rahul Sharma' },
                        { label: 'Mobile Number', key: 'phone', type: 'tel', placeholder: '10-digit mobile' },
                        { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@email.com' },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key} className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={labelStyle}>{label}</label>
                            <input
                                type={type}
                                className="form-input"
                                placeholder={placeholder}
                                value={form[key as keyof typeof form]}
                                onChange={e => setF(key as keyof typeof form)(e.target.value)}
                                maxLength={key === 'phone' ? 10 : undefined}
                                style={inputStyle}
                            />
                        </div>
                    ))}

                    {/* Password */}
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={labelStyle}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={e => setF('password')(e.target.value)}
                                style={{ ...inputStyle, paddingRight: 40 }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                            }}>
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Patient extras */}
                    {tab === 'patient' && (
                        <>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={labelStyle}>City (optional)</label>
                                <input type="text" className="form-input" placeholder="Mumbai" value={form.city} onChange={e => setF('city')(e.target.value)} style={inputStyle} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={labelStyle}>State (optional)</label>
                                <input type="text" className="form-input" placeholder="Maharashtra" value={form.state} onChange={e => setF('state')(e.target.value)} style={inputStyle} />
                            </div>
                        </>
                    )}

                    {/* Doctor extras */}
                    {tab === 'doctor' && (
                        <>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={labelStyle}>Specialization</label>
                                <input type="text" className="form-input" placeholder="Cardiology" value={form.specialization} onChange={e => setF('specialization')(e.target.value)} style={inputStyle} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={labelStyle}>License No.</label>
                                <input type="text" className="form-input" placeholder="MCI/12345" value={form.license_number} onChange={e => setF('license_number')(e.target.value)} style={inputStyle} />
                            </div>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="form-label" style={labelStyle}>Hospital / Clinic</label>
                                <input type="text" className="form-input" placeholder="AIIMS Delhi" value={form.hospital_name} onChange={e => setF('hospital_name')(e.target.value)} style={inputStyle} />
                            </div>
                        </>
                    )}
                </div>

                {/* Submit */}
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px 0', marginTop: 20 }}
                    onClick={handleRegister}
                    disabled={loading}
                    id="register-btn"
                >
                    {loading
                        ? <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                        : <><ArrowRight size={15} /> Create Account</>}
                </button>

                {/* Error */}
                {error && (
                    <div style={{
                        marginTop: 16, padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171', fontSize: 13,
                    }}>
                        ⚠ {error}
                    </div>
                )}
            </div>
        </div>
    );
}
