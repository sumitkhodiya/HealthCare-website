import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
                    localStorage.setItem('access_token', data.access);
                    original.headers.Authorization = `Bearer ${data.access}`;
                    return api(original);
                } catch {
                    localStorage.clear();
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ---- Auth ----
export const authApi = {
    loginDoctor: (email: string, password: string) =>
        api.post('/auth/login/', { email, password }),
    requestOTP: (phone: string) =>
        api.post('/auth/otp/request/', { phone }),
    verifyOTP: (phone: string, otp: string) =>
        api.post('/auth/otp/verify/', { phone, otp }),

    // Registration OTP (separate from login OTP)
    requestPhoneOTPForReg: (phone: string) =>
        api.post('/auth/otp/request/', { phone }),
    verifyPhoneOTPForReg: (phone: string, otp: string) =>
        api.post('/auth/otp/verify-phone/', { phone, otp }),
    requestEmailOTP: (email: string) =>
        api.post('/auth/otp/email/request/', { email }),
    verifyEmailOTP: (email: string, otp: string) =>
        api.post('/auth/otp/email/verify/', { email, otp }),

    registerPatient: (data: unknown) =>
        api.post('/auth/register/patient/', data),
    registerDoctor: (data: unknown) =>
        api.post('/auth/register/doctor/', data),
    getMe: () => api.get('/auth/me/'),
    updateMe: (data: unknown) => api.patch('/auth/me/', data),
    searchPatients: (q: string) =>
        api.get('/auth/patients/search/', { params: { q } }),
    // Admin
    adminUsers: (role?: string) =>
        api.get('/auth/admin/users/', { params: role ? { role } : {} }),
    adminToggleUser: (id: string, action: string) =>
        api.post(`/auth/admin/users/${id}/toggle/`, { action }),
    adminStats: () => api.get('/auth/admin/stats/'),
};

// ---- Documents ----
export const documentsApi = {
    upload: (formData: FormData) =>
        api.post('/documents/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    list: (params?: Record<string, string>) =>
        api.get('/documents/', { params }),
    get: (id: string) => api.get(`/documents/${id}/`),
    delete: (id: string) => api.delete(`/documents/${id}/`),
    timeline: () => api.get('/documents/timeline/'),
    emergencySummary: (patientId?: string) =>
        api.get(patientId
            ? `/documents/emergency-summary/${patientId}/`
            : '/documents/emergency-summary/'
        ),
};

// ---- Access Control ----
export const accessApi = {
    requestAccess: (data: unknown) => api.post('/access/request/', data),
    myRequests: () => api.get('/access/my-requests/'),
    incoming: (status?: string) =>
        api.get('/access/incoming/', { params: status ? { status } : {} }),
    respond: (id: string, data: unknown) =>
        api.post(`/access/${id}/respond/`, data),
    emergency: (data: unknown) => api.post('/access/emergency/', data),
    myEmergencies: () => api.get('/access/emergency/my/'),
    allEmergencies: () => api.get('/access/emergency/all/'),
    reviewEmergency: (id: string, data: unknown) =>
        api.post(`/access/emergency/${id}/review/`, data),
};

// ---- Audit ----
export const auditApi = {
    list: () => api.get('/audit/'),
};

// ---- Notifications ----
export const notificationsApi = {
    list: () => api.get('/notifications/'),
    unreadCount: () => api.get('/notifications/unread/'),
    markRead: (ids?: string[]) =>
        api.post('/notifications/mark-read/', ids ? { ids } : {}),
};

export default api;
