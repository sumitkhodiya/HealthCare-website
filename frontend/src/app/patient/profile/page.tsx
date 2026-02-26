'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import {
    Save, User, Phone, MapPin, Heart, AlertTriangle,
    CheckCircle, ChevronDown, Stethoscope, Info,
} from 'lucide-react';

// All 28 Indian States + 8 Union Territories
const INDIAN_STATES_AND_UTS = [
    // States
    { label: '── States ──', disabled: true },
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Chhattisgarh', value: 'Chhattisgarh' },
    { label: 'Goa', value: 'Goa' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
    { label: 'Jharkhand', value: 'Jharkhand' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Kerala', value: 'Kerala' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Manipur', value: 'Manipur' },
    { label: 'Meghalaya', value: 'Meghalaya' },
    { label: 'Mizoram', value: 'Mizoram' },
    { label: 'Nagaland', value: 'Nagaland' },
    { label: 'Odisha', value: 'Odisha' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Sikkim', value: 'Sikkim' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Tripura', value: 'Tripura' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'Uttarakhand', value: 'Uttarakhand' },
    { label: 'West Bengal', value: 'West Bengal' },
    // Union Territories
    { label: '── Union Territories ──', disabled: true },
    { label: 'Andaman & Nicobar Islands', value: 'Andaman & Nicobar Islands' },
    { label: 'Chandigarh', value: 'Chandigarh' },
    { label: 'Dadra & Nagar Haveli and Daman & Diu', value: 'Dadra & Nagar Haveli and Daman & Diu' },
    { label: 'Delhi (NCT)', value: 'Delhi (NCT)' },
    { label: 'Jammu & Kashmir', value: 'Jammu & Kashmir' },
    { label: 'Ladakh', value: 'Ladakh' },
    { label: 'Lakshadweep', value: 'Lakshadweep' },
    { label: 'Puducherry', value: 'Puducherry' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];
const GENDERS = ['', 'Male', 'Female', 'Other', 'Prefer not to say'];
const RELATIONS = ['', 'Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other'];

const bloodGroupColors: Record<string, { bg: string; text: string; border: string }> = {
    'A+': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
    'A-': { bg: '#fee2e2', text: '#7f1d1d', border: '#f87171' },
    'B+': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
    'B-': { bg: '#dbeafe', text: '#1e3a8a', border: '#60a5fa' },
    'AB+': { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
    'AB-': { bg: '#ede9fe', text: '#4c1d95', border: '#a78bfa' },
    'O+': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    'O-': { bg: '#d1fae5', text: '#064e3b', border: '#34d399' },
    'UNKNOWN': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

interface ProfileState {
    date_of_birth: string;
    gender: string;
    city: string;
    state: string;
    blood_group: string;
    allergies: string;
    chronic_conditions: string;
    current_medications: string;
    special_notes: string;
    emergency_contact_name: string;
    emergency_contact_relation: string;
    emergency_contact_phone: string;
}

export default function PatientProfilePage() {
    const { user, refreshUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');

    const [profile, setProfile] = useState<ProfileState>({
        date_of_birth: '',
        gender: '',
        city: '',
        state: '',
        blood_group: 'UNKNOWN',
        allergies: '',
        chronic_conditions: '',
        current_medications: '',
        special_notes: '',
        emergency_contact_name: '',
        emergency_contact_relation: '',
        emergency_contact_phone: '',
    });

    // ── Auto-fill from login data ──────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        setFullName(user.full_name ?? '');
        // Strip auto-generated phone-based email placeholder
        const userPhone = user.phone ?? '';
        setPhone(userPhone);

        if (user.patient_profile) {
            const p = user.patient_profile;
            setProfile({
                date_of_birth: p.date_of_birth ?? '',
                gender: p.gender ?? '',
                city: p.city ?? '',
                state: p.state ?? '',
                blood_group: p.blood_group || 'UNKNOWN',
                allergies: p.allergies ?? '',
                chronic_conditions: p.chronic_conditions ?? '',
                current_medications: (p as unknown as Record<string, string>).current_medications ?? '',
                special_notes: (p as unknown as Record<string, string>).special_notes ?? '',
                emergency_contact_name: p.emergency_contact_name ?? '',
                emergency_contact_relation: p.emergency_contact_relation ?? '',
                emergency_contact_phone: p.emergency_contact_phone ?? '',
            });
        }
    }, [user]);

    // ── Phone validation ───────────────────────────────────────────────────────
    const handlePhoneChange = (val: string) => {
        const digits = val.replace(/\D/g, ''); // strip non-digits
        if (val !== digits) {
            setPhoneError('Only digits allowed');
        } else if (digits.length > 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            return; // don't allow more than 10
        } else if (digits.length > 0 && digits.length < 10) {
            setPhoneError('Phone number must be exactly 10 digits');
        } else {
            setPhoneError('');
        }
        setPhone(digits.slice(0, 10));
    };

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (phoneError) return;
        if (phone && phone.length !== 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            return;
        }
        setSaving(true);
        setSaveStatus('idle');
        setSaveError('');
        try {
            await authApi.updateMe({
                full_name: fullName,
                phone: phone || null,
                patient_profile: profile,
            });
            await refreshUser();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 4000);
        } catch (e: unknown) {
            const err = e as { response?: { data?: Record<string, string[]> } };
            const errData = err.response?.data;
            const msg = errData ? Object.values(errData).flat()[0] : 'Failed to save. Please try again.';
            setSaveError(msg);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const setP = (key: keyof ProfileState) => (val: string) =>
        setProfile(p => ({ ...p, [key]: val }));

    const selectedBloodGroup = bloodGroupColors[profile.blood_group] || bloodGroupColors['UNKNOWN'];

    // Profile completeness
    const completionFields = [
        fullName, phone, profile.date_of_birth, profile.gender, profile.city, profile.state,
        profile.blood_group !== 'UNKNOWN' ? profile.blood_group : '',
        profile.emergency_contact_name, profile.emergency_contact_phone,
    ];
    const completedCount = completionFields.filter(Boolean).length;
    const completionPct = Math.round((completedCount / completionFields.length) * 100);

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title="My Profile" />
                <div style={{ padding: '32px', maxWidth: 860, margin: '0 auto' }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div>
                            <h1 className="page-title">My Profile</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Patient ID:</span>
                                <span style={{
                                    fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                                    background: 'var(--brand-light)', color: 'var(--brand)',
                                    padding: '2px 10px', borderRadius: 100,
                                }}>{user?.patient_id}</span>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving || !!phoneError}
                            id="save-profile-btn"
                            style={{ minWidth: 140 }}
                        >
                            {saving
                                ? <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Saving…</>
                                : saveStatus === 'success'
                                    ? <><CheckCircle size={16} /> Saved!</>
                                    : <><Save size={16} /> Save Changes</>
                            }
                        </button>
                    </div>

                    {/* Profile completeness bar */}
                    <div style={{ marginBottom: 28, padding: '16px 20px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Profile Completeness</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: completionPct === 100 ? 'var(--success)' : 'var(--brand)' }}>{completionPct}%</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 100, transition: 'width 0.5s ease',
                                width: `${completionPct}%`,
                                background: completionPct === 100
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                            }} />
                        </div>
                        {completionPct < 100 && (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                                Complete your profile for better emergency care experiences
                            </p>
                        )}
                    </div>

                    {/* Save notifications */}
                    {saveStatus === 'success' && (
                        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                            <CheckCircle size={16} /> Profile saved successfully!
                        </div>
                    )}
                    {saveStatus === 'error' && (
                        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                            <AlertTriangle size={16} /> {saveError}
                        </div>
                    )}

                    {/* ── Section: Basic Info ── */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} color="#2563eb" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Basic Information</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Your personal details</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {/* Full name */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                />
                            </div>

                            {/* Phone */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Mobile Number</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                        fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', userSelect: 'none',
                                    }}>+91</span>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={phone}
                                        onChange={e => handlePhoneChange(e.target.value)}
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                        style={{
                                            paddingLeft: 44,
                                            borderColor: phoneError ? '#ef4444' : undefined,
                                            boxShadow: phoneError ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
                                        }}
                                        id="phone-input"
                                    />
                                    {phone.length === 10 && !phoneError && (
                                        <CheckCircle size={16} color="#10b981" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
                                    )}
                                </div>
                                {phoneError && (
                                    <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Info size={11} /> {phoneError}
                                    </p>
                                )}
                                {phone.length > 0 && !phoneError && (
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{phone.length}/10 digits</p>
                                )}
                            </div>

                            {/* Email - read-only */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Email Address <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(cannot be changed)</span></label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                                />
                            </div>

                            {/* DOB */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={profile.date_of_birth}
                                    onChange={e => setP('date_of_birth')(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Gender */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Gender</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="form-input"
                                        value={profile.gender}
                                        onChange={e => setP('gender')(e.target.value)}
                                        style={{ appearance: 'none', paddingRight: 36 }}
                                    >
                                        {GENDERS.map(g => <option key={g} value={g}>{g || 'Select gender'}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Location ── */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={18} color="#d97706" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Location</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>City and State / Union Territory</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">City / District</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profile.city}
                                    onChange={e => setP('city')(e.target.value)}
                                    placeholder="e.g. Mumbai, Bengaluru, Pune…"
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">State / Union Territory</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="form-input"
                                        value={profile.state}
                                        onChange={e => setP('state')(e.target.value)}
                                        style={{ appearance: 'none', paddingRight: 36 }}
                                    >
                                        <option value="">Select state / UT</option>
                                        {INDIAN_STATES_AND_UTS.map((s, i) =>
                                            (s as { disabled?: boolean; label: string; value?: string }).disabled
                                                ? <option key={i} disabled style={{ fontWeight: 700, color: '#94a3b8' }}>{s.label}</option>
                                                : <option key={s.value} value={s.value}>{s.label}</option>
                                        )}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Medical Profile ── */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Heart size={18} color="#dc2626" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Medical Profile</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Shown on your emergency summary card</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f59e0b' }}>
                                <AlertTriangle size={12} /> Critical for emergencies
                            </div>
                        </div>

                        {/* Blood Group - visual picker */}
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label className="form-label">Blood Group</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                {BLOOD_GROUPS.map(bg => {
                                    const colors = bloodGroupColors[bg];
                                    const isSelected = profile.blood_group === bg;
                                    return (
                                        <button
                                            key={bg}
                                            type="button"
                                            onClick={() => setP('blood_group')(bg)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: 10,
                                                fontSize: 13,
                                                fontWeight: isSelected ? 700 : 500,
                                                border: `2px solid ${isSelected ? colors.border : 'var(--border)'}`,
                                                background: isSelected ? colors.bg : 'var(--bg-card)',
                                                color: isSelected ? colors.text : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                                boxShadow: isSelected ? `0 2px 8px ${colors.border}60` : 'none',
                                            }}
                                        >
                                            {bg === 'UNKNOWN' ? 'Unknown' : bg}
                                        </button>
                                    );
                                })}
                            </div>
                            {profile.blood_group !== 'UNKNOWN' && (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle size={11} color="#10b981" /> Blood group set to <strong>{profile.blood_group}</strong>
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            {[
                                { label: 'Known Allergies', key: 'allergies' as keyof ProfileState, placeholder: 'e.g. Penicillin, Peanuts, Aspirin', hint: 'List all known drug & food allergies' },
                                { label: 'Chronic Conditions', key: 'chronic_conditions' as keyof ProfileState, placeholder: 'e.g. Diabetes Type 2, Hypertension', hint: 'Ongoing medical conditions' },
                                { label: 'Current Medications', key: 'current_medications' as keyof ProfileState, placeholder: 'e.g. Metformin 500mg once daily', hint: 'List active prescriptions' },
                                { label: 'Special Notes', key: 'special_notes' as keyof ProfileState, placeholder: 'e.g. Has pacemaker, Kidney transplant', hint: 'Any critical info for doctors' },
                            ].map(({ label, key, placeholder, hint }) => (
                                <div key={key} className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">{label}</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={profile[key]}
                                        onChange={e => setP(key)(e.target.value)}
                                        placeholder={placeholder}
                                        style={{ resize: 'none' }}
                                    />
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Section: Emergency Contact ── */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={18} color="#d97706" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Emergency Contact</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Person to be contacted in case of emergency</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Contact Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profile.emergency_contact_name}
                                    onChange={e => setP('emergency_contact_name')(e.target.value)}
                                    placeholder="Full name of contact person"
                                />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Relationship</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="form-input"
                                        value={profile.emergency_contact_relation}
                                        onChange={e => setP('emergency_contact_relation')(e.target.value)}
                                        style={{ appearance: 'none', paddingRight: 36 }}
                                    >
                                        {RELATIONS.map(r => <option key={r} value={r}>{r || 'Select relationship'}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Contact Phone</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>+91</span>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={profile.emergency_contact_phone}
                                        onChange={e => {
                                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setP('emergency_contact_phone')(digits);
                                        }}
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                        style={{ paddingLeft: 44 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sticky save bar at bottom */}
                    <div style={{
                        position: 'sticky', bottom: 24,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 14, padding: '14px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {saveStatus === 'success'
                                ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Changes saved successfully</span>
                                : saveStatus === 'error'
                                    ? <span style={{ color: '#ef4444' }}>⚠ {saveError}</span>
                                    : <span>{completionPct < 100 ? `${completionPct}% complete — fill in all fields for best care` : '✅ Profile complete'}</span>
                            }
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving || !!phoneError}
                            style={{ minWidth: 130 }}
                            id="save-profile-btn-sticky"
                        >
                            {saving
                                ? <><div className="loading-spinner" style={{ width: 15, height: 15 }} /> Saving…</>
                                : <><Save size={15} /> Save Changes</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
