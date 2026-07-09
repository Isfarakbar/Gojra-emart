"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

export default function ProductImage({
    src,
    alt,
    sizes,
    className,
}: {
    src?: string;
    alt: string;
    sizes: string;
    className: string;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
            {!src || failed ? (
                <ImageOff className="absolute inset-0 m-auto text-gray-400" size={18} />
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    className="object-cover"
                    onError={() => setFailed(true)}
                />
            )}
        </div>
    );
}
