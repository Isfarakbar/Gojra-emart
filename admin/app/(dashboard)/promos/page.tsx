"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Edit, Loader2, Plus, Save, Trash2, X } from 'lucide-react';

interface PromoCode {
    _id: string;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    usageLimit: number;
    usedCount: number;
    expiresAt?: string;
    isActive: boolean;
}

const emptyForm = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
};

export default function PromoCodesPage() {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            const { data } = await api.get('/promos');
            setPromos(data);
        } catch (error) {
            console.error(error);
            alert('Failed to load promo codes');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const submitPromo = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderAmount: Number(form.minOrderAmount) || 0,
                maxDiscountAmount: Number(form.maxDiscountAmount) || 0,
                usageLimit: Number(form.usageLimit) || 0,
                expiresAt: form.expiresAt || undefined,
            };

            if (editingId) {
                await api.put(`/promos/${editingId}`, payload);
            } else {
                await api.post('/promos', payload);
            }

            resetForm();
            await fetchPromos();
        } catch (error) {
            console.error(error);
            alert('Failed to save promo code');
        } finally {
            setSaving(false);
        }
    };

    const editPromo = (promo: PromoCode) => {
        setEditingId(promo._id);
        setForm({
            code: promo.code,
            description: promo.description ?? '',
            discountType: promo.discountType,
            discountValue: String(promo.discountValue),
            minOrderAmount: String(promo.minOrderAmount || ''),
            maxDiscountAmount: String(promo.maxDiscountAmount || ''),
            usageLimit: String(promo.usageLimit || ''),
            expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
            isActive: promo.isActive,
        });
    };

    const deletePromo = async (id: string) => {
        if (!confirm('Delete this promo code?')) return;
        await api.delete(`/promos/${id}`);
        setPromos(items => items.filter(item => item._id !== id));
    };

    const togglePromo = async (promo: PromoCode) => {
        const { data } = await api.put(`/promos/${promo._id}`, { isActive: !promo.isActive });
        setPromos(items => items.map(item => item._id === promo._id ? data : item));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Promo Codes</h2>
                <p className="text-sm text-gray-500 mt-1">Create discounts customers can apply during checkout.</p>
            </div>

            <form onSubmit={submitPromo} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput label="Code" value={form.code} onChange={value => setForm({ ...form, code: value.toUpperCase() })} required />
                <SelectInput label="Discount type" value={form.discountType} onChange={value => setForm({ ...form, discountType: value })} options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'fixed', label: 'Fixed amount' },
                ]} />
                <TextInput label="Discount value" type="number" value={form.discountValue} onChange={value => setForm({ ...form, discountValue: value })} required />
                <TextInput label="Minimum order" type="number" value={form.minOrderAmount} onChange={value => setForm({ ...form, minOrderAmount: value })} />
                <TextInput label="Max discount" type="number" value={form.maxDiscountAmount} onChange={value => setForm({ ...form, maxDiscountAmount: value })} />
                <TextInput label="Usage limit" type="number" value={form.usageLimit} onChange={value => setForm({ ...form, usageLimit: value })} />
                <TextInput label="Expiry date" type="date" value={form.expiresAt} onChange={value => setForm({ ...form, expiresAt: value })} />
                <label className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
                    <span>Active</span>
                    <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-blue-600" />
                </label>
                <TextInput label="Description" value={form.description} onChange={value => setForm({ ...form, description: value })} />
                <div className="md:col-span-3 flex gap-2">
                    <button disabled={saving} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                        {editingId ? 'Update Promo' : 'Create Promo'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600">
                            <X size={16} /> Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="p-4">Code</th>
                                <th className="p-4">Discount</th>
                                <th className="p-4">Rules</th>
                                <th className="p-4">Usage</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {promos.map(promo => (
                                <tr key={promo._id}>
                                    <td className="p-4 font-bold text-gray-900">{promo.code}</td>
                                    <td className="p-4">{promo.discountType === 'percentage' ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}</td>
                                    <td className="p-4 text-gray-500">
                                        Min Rs. {promo.minOrderAmount || 0}
                                        {promo.maxDiscountAmount > 0 ? ` • Cap Rs. ${promo.maxDiscountAmount}` : ''}
                                    </td>
                                    <td className="p-4">{promo.usedCount}{promo.usageLimit > 0 ? ` / ${promo.usageLimit}` : ''}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => togglePromo(promo)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {promo.isActive ? 'Active' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => editPromo(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                        <button onClick={() => deletePromo(promo._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && promos.length === 0 && <div className="p-8 text-center text-gray-500">No promo codes yet.</div>}
            </div>
        </div>
    );
}

function TextInput({ label, value, onChange, type = 'text', required = false }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</span>
            <input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800" />
        </label>
    );
}

function SelectInput({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</span>
            <select value={value} onChange={event => onChange(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white">
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    );
}
