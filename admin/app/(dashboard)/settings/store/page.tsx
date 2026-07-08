"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Save, Store, Truck, Headphones } from 'lucide-react';

interface StoreSettings {
    storeName: string;
    isStoreOpen: boolean;
    closedMessage: string;
    minimumOrderAmount: number;
    deliveryFee: number;
    freeDeliveryAbove: number;
    estimatedDeliveryMinutes: number;
    supportPhone: string;
    supportEmail: string;
    supportWhatsapp: string;
}

const defaultSettings: StoreSettings = {
    storeName: 'Gojra E-Mart',
    isStoreOpen: true,
    closedMessage: 'Store is currently closed. Please try again later.',
    minimumOrderAmount: 0,
    deliveryFee: 0,
    freeDeliveryAbove: 0,
    estimatedDeliveryMinutes: 45,
    supportPhone: '',
    supportEmail: '',
    supportWhatsapp: '',
};

export default function StoreSettingsPage() {
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings/store');
                setSettings({ ...defaultSettings, ...data });
            } catch (error) {
                console.error(error);
                setMessage('Failed to load store settings.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const updateField = <K extends keyof StoreSettings>(field: K, value: StoreSettings[K]) => {
        setSettings(current => ({ ...current, [field]: value }));
    };

    const saveSettings = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                ...settings,
                minimumOrderAmount: Number(settings.minimumOrderAmount) || 0,
                deliveryFee: Number(settings.deliveryFee) || 0,
                freeDeliveryAbove: Number(settings.freeDeliveryAbove) || 0,
                estimatedDeliveryMinutes: Number(settings.estimatedDeliveryMinutes) || 45,
            };
            const { data } = await api.put('/settings/store', payload);
            setSettings({ ...defaultSettings, ...data });
            setMessage('Store settings saved.');
        } catch (error) {
            console.error(error);
            setMessage('Failed to save store settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    return (
        <form onSubmit={saveSettings} className="max-w-5xl space-y-8 pb-20">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">Control ordering rules, delivery charges, and customer support details.</p>
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                    Save Settings
                </button>
            </div>

            {message && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                    {message}
                </div>
            )}

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                    <Store className="text-blue-600" size={20} />
                    <h3 className="font-bold text-gray-800">Store Availability</h3>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Store Name</span>
                        <input
                            value={settings.storeName}
                            onChange={event => updateField('storeName', event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </label>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Accepting Orders</p>
                            <p className="text-xs text-gray-500">Turn off when the store is closed or overloaded.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateField('isStoreOpen', !settings.isStoreOpen)}
                            className={`h-7 w-12 rounded-full p-1 transition ${settings.isStoreOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <span className={`block h-5 w-5 rounded-full bg-white transition ${settings.isStoreOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <label className="space-y-1.5 md:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Closed Message</span>
                        <textarea
                            rows={3}
                            value={settings.closedMessage}
                            onChange={event => updateField('closedMessage', event.target.value)}
                            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </label>
                </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                    <Truck className="text-orange-600" size={20} />
                    <h3 className="font-bold text-gray-800">Order & Delivery Rules</h3>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                    <NumberField label="Minimum Order (Rs)" value={settings.minimumOrderAmount} onChange={value => updateField('minimumOrderAmount', value)} />
                    <NumberField label="Delivery Fee (Rs)" value={settings.deliveryFee} onChange={value => updateField('deliveryFee', value)} />
                    <NumberField label="Free Delivery Above (Rs)" value={settings.freeDeliveryAbove} onChange={value => updateField('freeDeliveryAbove', value)} />
                    <NumberField label="ETA Minutes" value={settings.estimatedDeliveryMinutes} onChange={value => updateField('estimatedDeliveryMinutes', value)} />
                </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                    <Headphones className="text-green-600" size={20} />
                    <h3 className="font-bold text-gray-800">Customer Support</h3>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <TextField label="Support Phone" value={settings.supportPhone} onChange={value => updateField('supportPhone', value)} />
                    <TextField label="Support Email" value={settings.supportEmail} onChange={value => updateField('supportEmail', value)} />
                    <TextField label="WhatsApp Number" value={settings.supportWhatsapp} onChange={value => updateField('supportWhatsapp', value)} />
                </div>
            </section>
        </form>
    );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</span>
            <input
                type="number"
                min="0"
                value={value}
                onChange={event => onChange(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
        </label>
    );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</span>
            <input
                value={value}
                onChange={event => onChange(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
        </label>
    );
}
