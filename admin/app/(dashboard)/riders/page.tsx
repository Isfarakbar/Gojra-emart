"use client";

import { useCallback, useEffect, useState } from 'react';
import { Bike, Edit, Loader2, Phone, Plus, Power, X } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';

type Rider = {
    _id: string;
    name: string;
    phone: string;
    cnic?: string;
    vehicleType: string;
    vehicleNumber?: string;
    status: 'Available' | 'Busy' | 'Offline';
    isActive: boolean;
    activeOrders?: number;
};

const emptyForm = {
    name: '',
    phone: '',
    cnic: '',
    vehicleType: 'Motorcycle',
    vehicleNumber: '',
    status: 'Available',
};

export default function RidersPage() {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Rider | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState('');

    const loadRiders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/riders');
            setRiders(data);
        } catch (error: unknown) {
            setMessage(getErrorMessage(error, 'Could not load riders.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRiders();
    }, [loadRiders]);

    const openForm = (rider?: Rider) => {
        setEditing(rider || null);
        setForm(rider ? {
            name: rider.name,
            phone: rider.phone,
            cnic: rider.cnic || '',
            vehicleType: rider.vehicleType,
            vehicleNumber: rider.vehicleNumber || '',
            status: rider.status,
        } : emptyForm);
        setMessage('');
        setShowForm(true);
    };

    const saveRider = async () => {
        setSaving(true);
        setMessage('');
        try {
            if (editing) await api.put(`/riders/${editing._id}`, form);
            else await api.post('/riders', form);
            setShowForm(false);
            await loadRiders();
        } catch (error: unknown) {
            setMessage(getErrorMessage(error, 'Could not save rider.'));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (rider: Rider) => {
        try {
            await api.put(`/riders/${rider._id}`, {
                isActive: !rider.isActive,
                status: rider.isActive ? 'Offline' : 'Available',
            });
            await loadRiders();
        } catch (error: unknown) {
            setMessage(getErrorMessage(error, 'Could not update rider.'));
        }
    };

    const statusStyle: Record<string, string> = {
        Available: 'bg-green-100 text-green-700',
        Busy: 'bg-amber-100 text-amber-700',
        Offline: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Delivery Riders</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage the delivery team and current availability.</p>
                </div>
                <button onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus size={17} />Add Rider</button>
            </div>

            {message && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : riders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-16 text-center"><Bike className="mx-auto mb-3 text-gray-300" size={40} /><p className="font-semibold text-gray-700">No riders added yet</p></div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {riders.map(rider => (
                        <div key={rider._id} className={`rounded-lg border bg-white p-5 ${rider.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700"><Bike size={21} /></div>
                                    <div><h3 className="font-bold text-gray-900">{rider.name}</h3><p className="flex items-center gap-1 text-sm text-gray-500"><Phone size={13} />{rider.phone}</p></div>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[rider.status]}`}>{rider.status}</span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-gray-50 p-3 text-sm">
                                <div><p className="text-xs text-gray-500">Vehicle</p><p className="font-semibold text-gray-800">{rider.vehicleType}</p></div>
                                <div><p className="text-xs text-gray-500">Registration</p><p className="font-semibold text-gray-800">{rider.vehicleNumber || 'Not set'}</p></div>
                                <div><p className="text-xs text-gray-500">Active orders</p><p className="font-semibold text-gray-800">{rider.activeOrders || 0}</p></div>
                                <div><p className="text-xs text-gray-500">Account</p><p className="font-semibold text-gray-800">{rider.isActive ? 'Active' : 'Disabled'}</p></div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => openForm(rider)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold text-gray-700"><Edit size={14} />Edit</button>
                                <button onClick={() => toggleActive(rider)} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${rider.isActive ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><Power size={14} />{rider.isActive ? 'Disable' : 'Enable'}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4"><div><h3 className="font-bold text-gray-900">{editing ? 'Edit Rider' : 'Add Rider'}</h3><p className="text-sm text-gray-500">Delivery team details</p></div><button onClick={() => setShowForm(false)} className="text-gray-400"><X size={20} /></button></div>
                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            <Field label="Full name" value={form.name} onChange={value => setForm({ ...form, name: value })} />
                            <Field label="Phone" value={form.phone} onChange={value => setForm({ ...form, phone: value })} />
                            <Field label="CNIC" value={form.cnic} onChange={value => setForm({ ...form, cnic: value })} />
                            <Field label="Vehicle number" value={form.vehicleNumber} onChange={value => setForm({ ...form, vehicleNumber: value })} />
                            <label className="text-sm font-semibold text-gray-700">Vehicle type<select value={form.vehicleType} onChange={event => setForm({ ...form, vehicleType: event.target.value })} className="mt-1 w-full rounded-md border p-2 font-normal"><option>Motorcycle</option><option>Bicycle</option><option>Car</option><option>Other</option></select></label>
                            <label className="text-sm font-semibold text-gray-700">Availability<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-md border p-2 font-normal"><option>Available</option><option>Busy</option><option>Offline</option></select></label>
                        </div>
                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-5 py-4"><button onClick={() => setShowForm(false)} className="rounded-md border bg-white px-4 py-2 text-sm">Cancel</button><button disabled={saving || !form.name.trim() || !form.phone.trim()} onClick={saveRider} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />}Save Rider</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return <label className="text-sm font-semibold text-gray-700">{label}<input value={value} onChange={event => onChange(event.target.value)} className="mt-1 w-full rounded-md border p-2 font-normal outline-none focus:border-blue-500" /></label>;
}
