"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Edit, ImagePlus, LayoutPanelTop, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import Image from 'next/image';

interface HomeSettings {
    headerTitle: string;
    headerSubtitle: string;
    searchPlaceholder: string;
    categoryTitle: string;
    exploreTitle: string;
    showBanners: boolean;
    showCategories: boolean;
    showDynamicSections: boolean;
    showExploreProducts: boolean;
}

interface Banner {
    _id: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkType: 'product' | 'category' | 'none';
    linkId?: string;
    isActive: boolean;
    order: number;
}

interface HomeSection {
    _id: string;
    title: string;
    type: 'horizontal' | 'grid';
    filterType: 'featured' | 'latest' | 'category';
    categoryId?: string;
    isActive: boolean;
    order: number;
}

interface Category {
    _id: string;
    name: string;
}

const emptySettings: HomeSettings = {
    headerTitle: '',
    headerSubtitle: '',
    searchPlaceholder: '',
    categoryTitle: '',
    exploreTitle: '',
    showBanners: true,
    showCategories: true,
    showDynamicSections: true,
    showExploreProducts: true,
};

export default function HomeLayoutPage() {
    const [settings, setSettings] = useState<HomeSettings>(emptySettings);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [sections, setSections] = useState<HomeSection[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [bannerForm, setBannerForm] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        linkType: 'none',
        linkId: '',
        order: 0,
        isActive: true,
    });
    const [sectionForm, setSectionForm] = useState({
        title: '',
        type: 'horizontal',
        filterType: 'latest',
        categoryId: '',
        order: 0,
        isActive: true,
    });

    useEffect(() => {
        fetchLayout();
    }, []);

    const fetchLayout = async () => {
        try {
            const [settingsRes, bannersRes, sectionsRes, categoriesRes] = await Promise.all([
                api.get('/layout/settings'),
                api.get('/layout/banners'),
                api.get('/layout/sections'),
                api.get('/categories'),
            ]);
            setSettings(settingsRes.data);
            setBanners(bannersRes.data);
            setSections(sectionsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error(error);
            alert('Failed to load home layout');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const { data } = await api.put('/layout/settings', settings);
            setSettings(data);
        } catch (error) {
            console.error(error);
            alert('Failed to save home settings');
        } finally {
            setSaving(false);
        }
    };

    const resetBannerForm = () => {
        setEditingBannerId(null);
        setBannerForm({ title: '', subtitle: '', imageUrl: '', linkType: 'none', linkId: '', order: 0, isActive: true });
    };

    const resetSectionForm = () => {
        setEditingSectionId(null);
        setSectionForm({ title: '', type: 'horizontal', filterType: 'latest', categoryId: '', order: 0, isActive: true });
    };

    const submitBanner = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const payload = {
                ...bannerForm,
                linkId: bannerForm.linkType === 'none' ? '' : bannerForm.linkId,
                order: Number(bannerForm.order) || 0,
            };
            if (editingBannerId) {
                await api.put(`/layout/banners/${editingBannerId}`, payload);
            } else {
                await api.post('/layout/banners', payload);
            }
            resetBannerForm();
            await fetchLayout();
        } catch (error) {
            console.error(error);
            alert('Failed to save banner');
        }
    };

    const submitSection = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const payload = {
                ...sectionForm,
                order: Number(sectionForm.order) || 0,
                categoryId: sectionForm.filterType === 'category' ? sectionForm.categoryId : undefined,
            };
            if (editingSectionId) {
                await api.put(`/layout/sections/${editingSectionId}`, payload);
            } else {
                await api.post('/layout/sections', payload);
            }
            resetSectionForm();
            await fetchLayout();
        } catch (error) {
            console.error(error);
            alert('Failed to save section');
        }
    };

    const deleteBanner = async (id: string) => {
        if (!confirm('Delete this banner?')) return;
        await api.delete(`/layout/banners/${id}`);
        setBanners(items => items.filter(item => item._id !== id));
    };

    const deleteSection = async (id: string) => {
        if (!confirm('Delete this section?')) return;
        await api.delete(`/layout/sections/${id}`);
        setSections(items => items.filter(item => item._id !== id));
    };

    const toggleBanner = async (banner: Banner) => {
        const { data } = await api.put(`/layout/banners/${banner._id}`, {
            isActive: !banner.isActive,
        });
        setBanners(items => items.map(item => item._id === banner._id ? data : item));
    };

    const toggleSection = async (section: HomeSection) => {
        const { data } = await api.put(`/layout/sections/${section._id}`, {
            isActive: !section.isActive,
        });
        setSections(items => items.map(item => item._id === section._id ? data : item));
    };

    const editBanner = (banner: Banner) => {
        setEditingBannerId(banner._id);
        setBannerForm({
            title: banner.title,
            subtitle: banner.subtitle ?? '',
            imageUrl: banner.imageUrl,
            linkType: banner.linkType,
            linkId: banner.linkId ?? '',
            order: banner.order,
            isActive: banner.isActive,
        });
    };

    const editSection = (section: HomeSection) => {
        setEditingSectionId(section._id);
        setSectionForm({
            title: section.title,
            type: section.type,
            filterType: section.filterType,
            categoryId: section.categoryId ?? '',
            order: section.order,
            isActive: section.isActive,
        });
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Home Layout</h2>
                    <p className="text-sm text-gray-500 mt-1">Control the customer app home page from here.</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Settings
                </button>
            </div>

            <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                    <LayoutPanelTop size={20} className="text-blue-600" />
                    <h3 className="font-bold text-gray-900">Mobile Home Text</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Header title" value={settings.headerTitle} onChange={value => setSettings({ ...settings, headerTitle: value })} />
                    <TextInput label="Search placeholder" value={settings.searchPlaceholder} onChange={value => setSettings({ ...settings, searchPlaceholder: value })} />
                    <TextInput label="Category title" value={settings.categoryTitle} onChange={value => setSettings({ ...settings, categoryTitle: value })} />
                    <TextInput label="Explore title" value={settings.exploreTitle} onChange={value => setSettings({ ...settings, exploreTitle: value })} />
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Header subtitle</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 min-h-20"
                            value={settings.headerSubtitle}
                            onChange={event => setSettings({ ...settings, headerSubtitle: event.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                    <Toggle label="Show banners" checked={settings.showBanners} onChange={value => setSettings({ ...settings, showBanners: value })} />
                    <Toggle label="Show categories" checked={settings.showCategories} onChange={value => setSettings({ ...settings, showCategories: value })} />
                    <Toggle label="Show sections" checked={settings.showDynamicSections} onChange={value => setSettings({ ...settings, showDynamicSections: value })} />
                    <Toggle label="Show explore grid" checked={settings.showExploreProducts} onChange={value => setSettings({ ...settings, showExploreProducts: value })} />
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ImagePlus size={20} className="text-orange-500" />
                        <h3 className="font-bold text-gray-900">Banners</h3>
                    </div>
                    <form onSubmit={submitBanner} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                        <TextInput label="Title" value={bannerForm.title} onChange={value => setBannerForm({ ...bannerForm, title: value })} required />
                        <TextInput label="Subtitle" value={bannerForm.subtitle} onChange={value => setBannerForm({ ...bannerForm, subtitle: value })} />
                        <div className="md:col-span-2">
                            <TextInput label="Image URL" value={bannerForm.imageUrl} onChange={value => setBannerForm({ ...bannerForm, imageUrl: value })} required />
                        </div>
                        <SelectInput label="Tap action" value={bannerForm.linkType} onChange={value => setBannerForm({ ...bannerForm, linkType: value, linkId: '' })} options={[
                            { value: 'none', label: 'No action' },
                            { value: 'category', label: 'Open category' },
                            { value: 'product', label: 'Open product by ID' },
                        ]} />
                        {bannerForm.linkType === 'category' && (
                            <SelectInput label="Target category" value={bannerForm.linkId} onChange={value => setBannerForm({ ...bannerForm, linkId: value })} options={[
                                { value: '', label: 'Choose category' },
                                ...categories.map(category => ({ value: category._id, label: category.name })),
                            ]} />
                        )}
                        {bannerForm.linkType === 'product' && (
                            <TextInput
                                label="Target product ID"
                                value={bannerForm.linkId}
                                onChange={value => setBannerForm({ ...bannerForm, linkId: value })}
                            />
                        )}
                        <TextInput label="Order" type="number" value={String(bannerForm.order)} onChange={value => setBannerForm({ ...bannerForm, order: Number(value) })} />
                        <Toggle label="Active" checked={bannerForm.isActive} onChange={value => setBannerForm({ ...bannerForm, isActive: value })} />
                        <div className="md:col-span-2 flex gap-2">
                            <button className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold">
                                {editingBannerId ? <Save size={16} /> : <Plus size={16} />}
                                {editingBannerId ? 'Update Banner' : 'Add Banner'}
                            </button>
                            {editingBannerId && (
                                <button
                                    type="button"
                                    onClick={resetBannerForm}
                                    className="inline-flex items-center justify-center gap-2 border border-gray-200 px-3 rounded-lg text-sm font-semibold text-gray-600"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            )}
                        </div>
                    </form>
                    <ItemList items={banners.map(item => ({
                        id: item._id,
                        title: item.title,
                        subtitle: `${item.isActive ? 'Active' : 'Hidden'} • Order ${item.order}`,
                        imageUrl: item.imageUrl,
                        isActive: item.isActive,
                        raw: item,
                    }))} onDelete={deleteBanner} onToggle={(item) => toggleBanner(item.raw as Banner)} onEdit={(item) => editBanner(item.raw as Banner)} />
                </div>

                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutPanelTop size={20} className="text-green-600" />
                        <h3 className="font-bold text-gray-900">Product Sections</h3>
                    </div>
                    <form onSubmit={submitSection} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                        <TextInput label="Title" value={sectionForm.title} onChange={value => setSectionForm({ ...sectionForm, title: value })} required />
                        <SelectInput label="Layout" value={sectionForm.type} onChange={value => setSectionForm({ ...sectionForm, type: value })} options={[
                            { value: 'horizontal', label: 'Horizontal carousel' },
                            { value: 'grid', label: 'Grid' },
                        ]} />
                        <SelectInput label="Product filter" value={sectionForm.filterType} onChange={value => setSectionForm({ ...sectionForm, filterType: value })} options={[
                            { value: 'latest', label: 'Latest products' },
                            { value: 'featured', label: 'Featured products' },
                            { value: 'category', label: 'Specific category' },
                        ]} />
                        <TextInput label="Order" type="number" value={String(sectionForm.order)} onChange={value => setSectionForm({ ...sectionForm, order: Number(value) })} />
                        {sectionForm.filterType === 'category' && (
                            <SelectInput label="Category" value={sectionForm.categoryId} onChange={value => setSectionForm({ ...sectionForm, categoryId: value })} options={[
                                { value: '', label: 'Choose category' },
                                ...categories.map(category => ({ value: category._id, label: category.name })),
                            ]} />
                        )}
                        <Toggle label="Active" checked={sectionForm.isActive} onChange={value => setSectionForm({ ...sectionForm, isActive: value })} />
                        <div className="md:col-span-2 flex gap-2">
                            <button className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold">
                                {editingSectionId ? <Save size={16} /> : <Plus size={16} />}
                                {editingSectionId ? 'Update Section' : 'Add Section'}
                            </button>
                            {editingSectionId && (
                                <button
                                    type="button"
                                    onClick={resetSectionForm}
                                    className="inline-flex items-center justify-center gap-2 border border-gray-200 px-3 rounded-lg text-sm font-semibold text-gray-600"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            )}
                        </div>
                    </form>
                    <ItemList items={sections.map(item => ({
                        id: item._id,
                        title: item.title,
                        subtitle: `${item.type} • ${item.filterType} • ${item.isActive ? 'Active' : 'Hidden'} • Order ${item.order}`,
                        isActive: item.isActive,
                        raw: item,
                    }))} onDelete={deleteSection} onToggle={(item) => toggleSection(item.raw as HomeSection)} onEdit={(item) => editSection(item.raw as HomeSection)} />
                </div>
            </section>
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
            <input
                required={required}
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
            />
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
            <select
                value={value}
                onChange={event => onChange(event.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
            >
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    );
}

function Toggle({ label, checked, onChange }: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700">
            <span>{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={event => onChange(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
            />
        </label>
    );
}

function ItemList({ items, onDelete, onToggle, onEdit }: {
    items: { id: string; title: string; subtitle: string; imageUrl?: string; isActive?: boolean; raw?: unknown }[];
    onDelete: (id: string) => void;
    onToggle?: (item: { id: string; title: string; subtitle: string; imageUrl?: string; isActive?: boolean; raw?: unknown }) => void;
    onEdit?: (item: { id: string; title: string; subtitle: string; imageUrl?: string; isActive?: boolean; raw?: unknown }) => void;
}) {
    if (items.length === 0) {
        return <div className="text-sm text-gray-500 border border-dashed rounded-lg p-6 text-center">No items yet.</div>;
    }

    return (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3">
                    {item.imageUrl && (
                        <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                            <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                    </div>
                    {onToggle && (
                        <button
                            onClick={() => onToggle(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${item.isActive
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {item.isActive ? 'Hide' : 'Show'}
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                            <Edit size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
