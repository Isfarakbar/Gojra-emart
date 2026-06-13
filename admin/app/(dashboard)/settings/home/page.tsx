"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, UploadCloud, Trash2, Plus, Layout, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Banner {
    _id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
}

interface HomeSection {
    _id: string;
    title: string;
    type: string;
    filterType: string;
    categoryName?: string;
}

interface Category {
    _id: string;
    name: string;
}

export default function HomeLayoutPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [loading, setLoading] = useState(true);

    const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', order: 0 });
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [submittingBanner, setSubmittingBanner] = useState(false);

    const [sectionForm, setSectionForm] = useState({ title: '', type: 'horizontal', filterType: 'latest', categoryId: '', order: 0 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [submittingSection, setSubmittingSection] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/layout/home');
            setBanners(data.banners);
            setSections(data.sections);
        } catch (e) {
            console.error("Failed to load layout", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await api.get('/categories');
        setCategories(data);
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bannerImage) return alert("Image is required");
        setSubmittingBanner(true);
        try {
            // Upload Image
            const uploadData = new FormData();
            uploadData.append('image', bannerImage);
            const uploadRes = await api.post('/upload', uploadData);
            const imageUrl = uploadRes.data.url;

            await api.post('/layout/banners', { ...bannerForm, imageUrl });
            fetchData();
            setBannerForm({ title: '', subtitle: '', order: 0 });
            setBannerImage(null);
        } catch {
            alert('Failed to add banner');
        } finally {
            setSubmittingBanner(false);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm('Delete this banner?')) return;
        try {
            await api.delete(`/layout/banners/${id}`);
            fetchData();
        } catch { alert('Failed to delete'); }
    };

    const handleAddSection = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingSection(true);
        try {
            await api.post('/layout/sections', sectionForm);
            fetchData();
            setSectionForm({ title: '', type: 'horizontal', filterType: 'latest', categoryId: '', order: 0 });
        } catch {
            alert('Failed to add section');
        } finally {
            setSubmittingSection(false);
        }
    };

    const handleDeleteSection = async (id: string) => {
        if (!confirm('Delete this section?')) return;
        try {
            await api.delete(`/layout/sections/${id}`);
            fetchData();
        } catch { alert('Failed to delete'); }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Home Page Layout</h2>
                <p className="text-gray-500 text-sm">Customize the banners and sections of your mobile app home screen.</p>
            </div>

            {/* Banners Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <ImageIcon size={20} className="text-blue-600" /> Hero Banners
                    </h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="space-y-4 order-2 md:order-1">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Banners</h4>
                        {banners.length === 0 ? <p className="text-sm text-gray-400 italic">No banners active.</p> : banners.map((banner: Banner) => (
                            <div key={banner._id} className="flex gap-4 p-3 border rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition group">
                                <div className="w-20 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{banner.title}</p>
                                    <p className="text-xs text-gray-500 truncate">{banner.subtitle || 'No subtitle'}</p>
                                </div>
                                <button onClick={() => handleDeleteBanner(banner._id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAddBanner} className="space-y-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100 order-1 md:order-2">
                        <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Add New Banner</h4>
                        <div>
                            <input
                                required placeholder="Title (e.g. Flash Sale)"
                                className="w-full px-3 py-2 rounded-lg text-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                placeholder="Subtitle (e.g. Up to 50% Off)"
                                className="w-full px-3 py-2 rounded-lg text-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer bg-white px-3 py-2 rounded-lg border border-dashed border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2">
                                <UploadCloud size={16} /> {bannerImage ? 'Image Selected' : 'Upload Image'}
                                <input type="file" required accept="image/*" className="hidden" onChange={e => setBannerImage(e.target.files?.[0] || null)} />
                            </label>
                            <button disabled={submittingBanner} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                {submittingBanner ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={18} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Sections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Layout size={20} className="text-purple-600" /> Content Sections
                    </h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="space-y-4 order-2 md:order-1">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Sections</h4>
                        {sections.length === 0 ? <p className="text-sm text-gray-400 italic">No sections added.</p> : sections.map((section: HomeSection) => (
                            <div key={section._id} className="flex gap-4 p-3 border rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition items-center">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                    {section.type === 'grid' ? 'GRID' : 'LIST'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{section.title}</p>
                                    <p className="text-xs text-gray-500 truncate capitalize">{section.filterType} {section.categoryName ? `(${section.categoryName})` : ''}</p>
                                </div>
                                <button onClick={() => handleDeleteSection(section._id)} className="text-gray-400 hover:text-red-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAddSection} className="space-y-4 p-5 bg-purple-50/50 rounded-xl border border-purple-100 order-1 md:order-2">
                        <h4 className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Add New Section</h4>
                        <div>
                            <input
                                required placeholder="Section Title (e.g. New Arrivals)"
                                className="w-full px-3 py-2 rounded-lg text-sm border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                className="w-full px-3 py-2 rounded-lg text-sm border border-purple-200 focus:outline-none bg-white"
                                value={sectionForm.type} onChange={e => setSectionForm({ ...sectionForm, type: e.target.value })}
                            >
                                <option value="horizontal">Horizontal List</option>
                                <option value="grid">Grid View</option>
                            </select>
                            <select
                                className="w-full px-3 py-2 rounded-lg text-sm border border-purple-200 focus:outline-none bg-white"
                                value={sectionForm.filterType} onChange={e => setSectionForm({ ...sectionForm, filterType: e.target.value })}
                            >
                                <option value="latest">Latest Products</option>
                                <option value="featured">Featured Products</option>
                                <option value="category">Specific Category</option>
                            </select>
                        </div>

                        {sectionForm.filterType === 'category' && (
                            <select
                                required
                                className="w-full px-3 py-2 rounded-lg text-sm border border-purple-200 focus:outline-none bg-white"
                                value={sectionForm.categoryId} onChange={e => setSectionForm({ ...sectionForm, categoryId: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {categories.map((c: Category) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        )}

                        <button disabled={submittingSection} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex justify-center">
                            {submittingSection ? <Loader2 className="animate-spin w-4 h-4" /> : 'Add Section'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
