"use client";

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Boxes, History, Loader2, PackageCheck, Search, Warehouse, X } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';
import ProductImage from '@/components/ProductImage';

type Variant = { unit: string; stock: number };
type Product = {
    _id: string;
    name: string;
    imageUrl: string;
    price: number;
    stock: number;
    lowStockThreshold?: number;
    variants?: Variant[];
    category?: { name?: string };
};
type Movement = {
    _id: string;
    product?: { name?: string; imageUrl?: string };
    variant?: string;
    type: string;
    quantityChange: number;
    previousStock: number;
    newStock: number;
    reason: string;
    performedBy?: { name?: string };
    createdAt: string;
};
type Summary = {
    productCount: number;
    unitsInStock: number;
    stockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
};

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [summary, setSummary] = useState<Summary>({ productCount: 0, unitsInStock: 0, stockValue: 0, lowStockCount: 0, outOfStockCount: 0 });
    const [tab, setTab] = useState<'stock' | 'history'>('stock');
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Product | null>(null);
    const [variant, setVariant] = useState('');
    const [type, setType] = useState('Restock');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [threshold, setThreshold] = useState('5');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [inventoryResponse, movementResponse] = await Promise.all([
                api.get('/inventory', { params: { search: search || undefined } }),
                api.get('/inventory/movements'),
            ]);
            setProducts(inventoryResponse.data.products || []);
            setSummary(inventoryResponse.data.summary);
            setMovements(movementResponse.data.movements || []);
        } catch (error: unknown) {
            setMessage(getErrorMessage(error, 'Could not load inventory.'));
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openAdjustment = (product: Product) => {
        setSelected(product);
        setVariant('');
        setType('Restock');
        setQuantity('');
        setReason('');
        setThreshold(String(product.lowStockThreshold ?? 5));
        setMessage('');
    };

    const submitAdjustment = async () => {
        if (!selected) return;
        setSaving(true);
        setMessage('');
        try {
            const signedQuantity = ['Damage'].includes(type)
                ? -Math.abs(Number(quantity))
                : Number(quantity);
            await api.post(`/inventory/${selected._id}/adjust`, {
                variant,
                type,
                quantity: signedQuantity,
                reason,
                lowStockThreshold: Number(threshold),
            });
            setSelected(null);
            await loadData();
        } catch (error: unknown) {
            setMessage(getErrorMessage(error, 'Could not update stock.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="mt-1 text-sm text-gray-500">Monitor stock, record adjustments, and review every movement.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Stat label="Products" value={summary.productCount} icon={<Warehouse size={19} />} tone="blue" />
                <Stat label="Base Units" value={summary.unitsInStock} icon={<Boxes size={19} />} tone="green" />
                <Stat label="Stock Value" value={`Rs. ${Math.round(summary.stockValue).toLocaleString()}`} icon={<PackageCheck size={19} />} tone="purple" />
                <Stat label="Low / Out" value={`${summary.lowStockCount} / ${summary.outOfStockCount}`} icon={<AlertTriangle size={19} />} tone="amber" />
            </div>

            <div className="flex items-center justify-between border-b border-gray-200">
                <div className="flex">
                    <button onClick={() => setTab('stock')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><Boxes size={16} />Current Stock</button>
                    <button onClick={() => setTab('history')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><History size={16} />Movement History</button>
                </div>
                {tab === 'stock' && (
                    <div className="flex pb-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={searchInput} onChange={event => setSearchInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && setSearch(searchInput.trim())} placeholder="Search products" className="rounded-l-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none" />
                        </div>
                        <button onClick={() => setSearch(searchInput.trim())} className="rounded-r-md bg-gray-900 px-4 text-sm font-semibold text-white">Search</button>
                    </div>
                )}
            </div>

            {message && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : tab === 'stock' ? (
                <div className="w-full max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                            <tr><th className="p-4">Product</th><th className="p-4">Base Stock</th><th className="p-4">Variants</th><th className="p-4">Threshold</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map(product => {
                                const low = product.stock <= (product.lowStockThreshold ?? 5);
                                return (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="p-4"><div className="flex items-center gap-3"><ProductImage src={product.imageUrl} alt={product.name} sizes="40px" className="h-10 w-10 shrink-0 rounded-md" /><div><p className="font-semibold text-gray-900">{product.name}</p><p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p></div></div></td>
                                        <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${low ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{product.stock} units</span></td>
                                        <td className="p-4 text-xs text-gray-600">{product.variants?.length ? product.variants.map(item => `${item.unit}: ${item.stock}`).join(' · ') : 'No variants'}</td>
                                        <td className="p-4 text-gray-600">{product.lowStockThreshold ?? 5}</td>
                                        <td className="p-4 text-right"><button onClick={() => openAdjustment(product)} className="rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Adjust Stock</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {products.length === 0 && <div className="p-12 text-center text-gray-500">No products found.</div>}
                </div>
            ) : (
                <div className="w-full max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4">Date</th><th className="p-4">Product</th><th className="p-4">Type</th><th className="p-4">Change</th><th className="p-4">Stock</th><th className="p-4">Reason</th><th className="p-4">By</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {movements.map(item => (
                                <tr key={item._id}>
                                    <td className="p-4 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
                                    <td className="p-4 font-semibold text-gray-800">{item.product?.name || 'Deleted product'}{item.variant && <span className="ml-1 text-xs font-normal text-gray-500">({item.variant})</span>}</td>
                                    <td className="p-4"><span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{item.type}</span></td>
                                    <td className={`p-4 font-bold ${item.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange}</td>
                                    <td className="p-4 text-gray-600">{item.previousStock} → {item.newStock}</td>
                                    <td className="max-w-xs p-4 text-gray-600">{item.reason}</td>
                                    <td className="p-4 text-gray-500">{item.performedBy?.name || 'System'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {movements.length === 0 && <div className="p-12 text-center text-gray-500">No inventory movements yet.</div>}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4"><div><h3 className="font-bold text-gray-900">Adjust Stock</h3><p className="text-sm text-gray-500">{selected.name}</p></div><button onClick={() => setSelected(null)} className="text-gray-400"><X size={20} /></button></div>
                        <div className="space-y-4 p-5">
                            {selected.variants && selected.variants.length > 0 && <label className="block text-sm font-semibold text-gray-700">Inventory item<select value={variant} onChange={event => setVariant(event.target.value)} className="mt-1 w-full rounded-md border p-2 font-normal"><option value="">Base product</option>{selected.variants.map(item => <option key={item.unit} value={item.unit}>{item.unit} ({item.stock} units)</option>)}</select></label>}
                            <label className="block text-sm font-semibold text-gray-700">Adjustment type<select value={type} onChange={event => setType(event.target.value)} className="mt-1 w-full rounded-md border p-2 font-normal"><option>Restock</option><option>Return</option><option>Correction</option><option>Damage</option></select></label>
                            <label className="block text-sm font-semibold text-gray-700">Quantity<input type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-1 w-full rounded-md border p-2 font-normal" placeholder={type === 'Damage' ? 'Units to remove' : 'Units to add'} /></label>
                            <label className="block text-sm font-semibold text-gray-700">Low-stock threshold<input type="number" min="0" step="1" value={threshold} onChange={event => setThreshold(event.target.value)} className="mt-1 w-full rounded-md border p-2 font-normal" /></label>
                            <label className="block text-sm font-semibold text-gray-700">Reason<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={300} rows={3} className="mt-1 w-full resize-none rounded-md border p-2 font-normal" placeholder="Supplier delivery, damaged items, stock count correction..." /></label>
                        </div>
                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-5 py-4"><button onClick={() => setSelected(null)} className="rounded-md border bg-white px-4 py-2 text-sm">Cancel</button><button disabled={saving || !quantity || !reason.trim()} onClick={submitAdjustment} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />}Save Adjustment</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, icon, tone }: { label: string; value: string | number; icon: React.ReactNode; tone: string }) {
    const colors: Record<string, string> = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', purple: 'bg-purple-50 text-purple-700', amber: 'bg-amber-50 text-amber-700' };
    return <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"><div className={`rounded-md p-2.5 ${colors[tone]}`}>{icon}</div><div><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>;
}
