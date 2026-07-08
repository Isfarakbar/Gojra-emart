import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
    throw new Error('NEXT_PUBLIC_API_URL is required. Set it in admin/.env.local for development and in production environment variables.');
}

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
