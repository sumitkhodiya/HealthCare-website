'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    patient_id?: string;
    is_active: boolean;
    is_approved: boolean;
    patient_profile?: {
        blood_group: string;
        allergies: string;
        chronic_conditions: string;
        current_medications: string;
        special_notes: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
        emergency_contact_relation: string;
        city: string;
        state: string;
        date_of_birth: string;
        gender: string;
    };
    doctor_profile?: {
        specialization: string;
        hospital_name: string;
        license_number: string;
        is_verified: boolean;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (tokens: { access: string; refresh: string }, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const { data } = await authApi.getMe();
            setUser(data);
        } catch {
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            refreshUser().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [refreshUser]);

    const login = (tokens: { access: string; refresh: string }, userData: User) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
