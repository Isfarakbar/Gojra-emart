"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSession = async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (data.role === 'admin') {
                    setUser(data);
                }
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });

            if (data.role !== 'admin') {
                await api.post('/auth/logout');
                throw new Error('Access denied. Admins only.');
            }

            setUser({
                _id: data._id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
            });
            router.push('/');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            console.error('Login failed:', error);
            throw err.response?.data?.message || err.message || 'Login failed';
        }
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
