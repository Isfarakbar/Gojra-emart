"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Plus, Trash2, Edit, Loader2, UploadCloud, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import ProductImage from '@/components/ProductImage';

interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    oldPrice?: number;
    isFeatured?: boolean;
    isActive?: boolean;
    stock: number;
    category: { _id: string; name: string } | string;
    imageUrl: string;
    variants?: { unit: string; price: number; stock: number; oldPrice?: number }[];
    lowStockVariants?: { unit: string; price: number; stock: number; oldPrice?: number }[];
}

interface Category {
    _id: string;
    name: string;
}

interface ProductPayload {
    name: string;
    price: number;
    oldPrice?: number;
    stock: number;
    description: string;
    category: string;
    isFeatured: boolean;
    isActive: boolean;
    variants: { unit: string; price: number; stock: number; oldPrice?: number }[];
    image?: string;
}

type VariantField = 'unit' | 'price' | 'stock' | 'oldPrice';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        oldPrice: '',
        stock: '',
        description: '',
        category: '',
        isFeatured: false,
        isActive: true,
        variants: [] as { unit: string; price: string; stock: string; oldPrice: string }[],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = useCallback(async (targetPage = page) => {
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products/admin', { params: { page: targetPage } }),
                api.get('/categories/admin')
            ]);
            setProducts(prodRes.data.products ?? prodRes.data);
            setTotalPages(prodRes.data.pages ?? 1);
            setCategories(catRes.data);
            const lowStockRes = await api.get('/products/low-stock', { params: { threshold: 5 } });
            setLowStockProducts(lowStockRes.data.products ?? []);
        } catch (error) {
            console.error(error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData(page);
    }, [fetchData, page]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p._id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete product');
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product._id);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            oldPrice: product.oldPrice ? product.oldPrice.toString() : '',
            stock: product.stock.toString(),
            description: product.description ?? '',
            category: typeof product.category === 'object' ? product.category._id : product.category,
            isFeatured: product.isFeatured || false,
            isActive: product.isActive !== false,
            variants: product.variants?.map(v => ({
                unit: v.unit,
                price: v.price.toString(),
                stock: v.stock.toString(),
                oldPrice: v.oldPrice ? v.oldPrice.toString() : ''
            })) || [],
        });
        setImagePreview(product.imageUrl);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile && !editingId) {
            alert("Please upload an image");
            return;
        }

        setSubmitting(true);
        try {
            let imageUrl = '';

            // Upload Only if new file selected
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await api.post('/upload', uploadData);
                imageUrl = uploadRes.data.url;
            }

            const payload: ProductPayload = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
                oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
                variants: formData.variants.map(v => ({
                    unit: v.unit,
                    price: Number(v.price),
                    stock: Number(v.stock),
                    oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined
                })),
            };
            if (imageUrl) payload.image = imageUrl;

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
                setPage(1);
            }

            // Refresh & Close
            await fetchData(editingId ? page : 1);
            setIsModalOpen(false);
            resetForm();
        } catch (error: unknown) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', oldPrice: '', stock: '', description: '', category: '', isFeatured: false, isActive: true, variants: [] });
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
    };

    const addVariant = () => {
        setFormData({ ...formData, variants: [...formData.variants, { unit: '', price: '', stock: '', oldPrice: '' }] });
    };

    const removeVariant = (index: number) => {
        const newVariants = [...formData.variants];
        newVariants.splice(index, 1);
        setFormData({ ...formData, variants: newVariants });
    };

    const updateVariant = (index: number, field: VariantField, value: string) => {
        const newVariants = [...formData.variants];
        newVariants[index][field] = value;
        setFormData({ ...formData, variants: newVariants });
    };

    const toggleProductVisibility = async (product: Product) => {
        try {
            const { data } = await api.put(`/products/${product._id}`, {
                isActive: product.isActive === false,
            });
            setProducts(items => items.map(item => item._id === product._id ? data : item));
        } catch (error) {
            console.error(error);
            alert('Failed to update product visibility');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {lowStockProducts.length > 0 && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-amber-800">
                        <AlertTriangle size={18} />
                        <h3 className="font-bold">Low Stock Alert</h3>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {lowStockProducts.slice(0, 6).map((product) => {
                            const variantText = product.lowStockVariants && product.lowStockVariants.length > 0
                                ? product.lowStockVariants.map(v => `${v.unit}: ${v.stock}`).join(', ')
                                : `Stock: ${product.stock}`;
                            return (
                                <div key={product._id} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                                    <p className="font-semibold text-gray-800">{product.name}</p>
                                    <p className="text-xs text-amber-700">{variantText}</p>
                                </div>
                            );
                        })}
                    </div>
                    {lowStockProducts.length > 6 && (
                        <p className="mt-3 text-xs font-medium text-amber-700">
                            {lowStockProducts.length - 6} more product(s) need attention.
                        </p>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Image</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Price</th>
                                <th className="p-4 font-medium">Stock</th>
                                <th className="p-4 font-medium">Visibility</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {products.map((product) => {
                                const catName = typeof product.category === 'object' ? product.category?.name : 'Unknown';

                                return (
                                    <tr key={product._id} className="hover:bg-gray-50/50">
                                        <td className="p-4">
                                            <ProductImage
                                                src={product.imageUrl}
                                                alt={product.name}
                                                sizes="40px"
                                                className="h-10 w-10 rounded-md border"
                                            />
                                        </td>
                                        <td className="p-4 font-medium">{product.name}</td>
                                        <td className="p-4 text-gray-500">{catName}</td>
                                        <td className="p-4 font-medium">Rs. {product.price}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive === false ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                                {product.isActive === false ? 'Hidden' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => toggleProductVisibility(product)}
                                                className={`p-2 rounded-lg transition mr-1 ${product.isActive === false ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}
                                                title={product.isActive === false ? 'Show product' : 'Hide product'}
                                            >
                                                {product.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition mr-1"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No products found. Add one above!</div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                            <span className="text-gray-500">Page {page} of {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                                    disabled={page >= totalPages}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal - Basic Implementation */}
            {/* Redesigned Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                                <p className="text-xs text-gray-500 mt-1">Fill in the details below to {editingId ? 'update' : 'create'} a product.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image Section */}
                            <div className="flex gap-6 items-start">
                                <div className="w-32 h-32 flex-shrink-0 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden relative group">
                                    {(imagePreview || imageFile) ? (
                                        <Image
                                            src={imageFile ? URL.createObjectURL(imageFile) : imagePreview!}
                                            alt="Preview"
                                            fill
                                            sizes="128px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <UploadCloud size={24} />
                                            <span className="text-[10px] mt-1">No Image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <label className="cursor-pointer text-white text-xs font-medium flex flex-col items-center">
                                            <Edit size={16} className="mb-1" />
                                            Change
                                            <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-700 mb-2">Product Image</h4>
                                    <p className="text-xs text-gray-500 mb-3">Upload a high-quality image. Supported formats: JPG, PNG, WEBP.</p>
                                    {!editingId && !imageFile && <p className="text-xs text-red-500 font-medium">* Image is required for new products</p>}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Product Name</label>
                                    <input
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none"
                                        placeholder="e.g. Chocolate Bar"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none bg-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</label>
                                <textarea
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none resize-none"
                                    rows={3}
                                    placeholder="Enter product description..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Pricing & Visibility - The "Advanced" Part */}
                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    Pricing & Inventory
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-600">Sale Price (Rs)</label>
                                        <input
                                            required type="number"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-400">Regular Price <span className="font-normal">(Optional)</span></label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500"
                                            placeholder="Strike-through"
                                            value={formData.oldPrice}
                                            onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-600">Stock Quantity</label>
                                        <input
                                            required type="number"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-blue-100 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="featured"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            checked={formData.isFeatured}
                                            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        />
                                        <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Mark as Featured Product</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="active"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Visible in customer app</label>
                                    </div>
                                </div>
                            </div>

                            {/* Variants Section */}
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                        Product Variants (Optional)
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 transition"
                                    >
                                        <Plus size={14} /> Add Variant
                                    </button>
                                </div>

                                {formData.variants.length > 0 ? (
                                    <div className="space-y-3">
                                        {formData.variants.map((variant, idx) => (
                                            <div key={idx} className="flex gap-3 items-start p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Unit/Size</label>
                                                    <input
                                                        placeholder="e.g. 500g"
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                                        value={variant.unit}
                                                        onChange={e => updateVariant(idx, 'unit', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-24 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Price</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Rs"
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                                        value={variant.price}
                                                        onChange={e => updateVariant(idx, 'price', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-20 space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Stock</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                                                        value={variant.stock}
                                                        onChange={e => updateVariant(idx, 'stock', e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(idx)}
                                                    className="mt-6 text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                                        No variants added. Default price/stock above will be used.
                                    </div>
                                )}
                            </div>


                        </form>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="animate-spin w-4 h-4" />}
                                {editingId ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
