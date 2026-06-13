"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface Category {
    _id: string;
    name: string;
    image?: string;
}

interface CategoryPayload {
    name: string;
    image?: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            console.error(error);
            alert('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category? Products in this category might be affected.')) return;
        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c._id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete category');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingId(category._id);
        setName(category.name);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('image', imageFile);
                const uploadRes = await api.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrl = uploadRes.data.url;
            }

            const payload: CategoryPayload = { name };
            if (imageUrl) payload.image = imageUrl;

            if (editingId) {
                await api.put(`/categories/${editingId}`, payload);
            } else {
                await api.post('/categories', payload);
            }

            await fetchCategories();
            setIsModalOpen(false);
            resetForm();
        } catch (error: unknown) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setImageFile(null);
        setEditingId(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Add Category
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Icon</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {categories.map((category) => (
                                <tr key={category._id} className="hover:bg-gray-50/50">
                                    <td className="p-4">
                                        {category.image ? (
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden border">
                                                <Image src={category.image} alt={category.name} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold border">
                                                {category.name[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-base">{category.name}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition mr-1"
                                        >
                                            {/* We can re-use the Edit icon if we import it, or just use text if icon is missing */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category._id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {categories.length === 0 && <div className="p-8 text-center text-gray-500">No categories found.</div>}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Category' : 'Add Category'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g., Fruits"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Icon/Image {editingId && '(Leave empty to keep existing)'}</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    />
                                    {imageFile ? (
                                        <p className="text-sm font-medium text-green-600">{imageFile.name}</p>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">Upload Image</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center"
                                >
                                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : (editingId ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
