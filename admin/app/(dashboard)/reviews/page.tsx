"use client";

import { useCallback, useEffect, useState } from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';
import Image from 'next/image';

type Review = {
    _id: string;
    rating: number;
    comment: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    user?: { name?: string; email?: string; phone?: string };
    product?: { name?: string; imageUrl?: string };
};

const filters = ['All', 'Pending', 'Approved', 'Rejected'] as const;

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filter, setFilter] = useState<(typeof filters)[number]>('Pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = filter === 'All' ? {} : { status: filter };
            const { data } = await api.get('/reviews/admin', { params });
            setReviews(data.reviews || []);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Could not load reviews.'));
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const moderate = async (id: string, status: 'Approved' | 'Rejected') => {
        setBusyId(id);
        setError('');
        try {
            await api.put(`/reviews/admin/${id}`, { status });
            await loadReviews();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Could not update review.'));
        } finally {
            setBusyId('');
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this review permanently?')) return;
        setBusyId(id);
        try {
            await api.delete(`/reviews/admin/${id}`);
            await loadReviews();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Could not delete review.'));
        } finally {
            setBusyId('');
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Product Reviews</h1>
                    <p className="text-sm text-slate-500 mt-1">Approve verified customer feedback before it appears in the app.</p>
                </div>
                <div className="flex rounded-md border border-slate-200 overflow-hidden">
                    {filters.map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`px-4 py-2 text-sm font-medium ${filter === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No {filter.toLowerCase()} reviews.</div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {reviews.map((review) => (
                            <div key={review._id} className="p-5 flex gap-4">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                    {review.product?.imageUrl ? (
                                        <Image src={review.product.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                                    ) : (
                                        <Star className="absolute inset-0 m-auto text-slate-300" size={24} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{review.product?.name || 'Deleted product'}</p>
                                            <p className="text-sm text-slate-500">
                                                {review.user?.name || 'Customer'} · {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            review.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            review.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <div className="flex mt-2" aria-label={`${review.rating} out of 5 stars`}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={16} className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                        ))}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{review.comment}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {review.status !== 'Approved' && (
                                        <button title="Approve" disabled={busyId === review._id} onClick={() => moderate(review._id, 'Approved')} className="p-2 text-green-700 hover:bg-green-50 rounded-md disabled:opacity-50">
                                            <Check size={19} />
                                        </button>
                                    )}
                                    {review.status !== 'Rejected' && (
                                        <button title="Reject" disabled={busyId === review._id} onClick={() => moderate(review._id, 'Rejected')} className="p-2 text-amber-700 hover:bg-amber-50 rounded-md disabled:opacity-50">
                                            <X size={19} />
                                        </button>
                                    )}
                                    <button title="Delete" disabled={busyId === review._id} onClick={() => remove(review._id)} className="p-2 text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
