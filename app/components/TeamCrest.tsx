"use client";

import { useState, type CSSProperties } from "react";

interface TeamCrestProps {
    short: string;
    logo?: string | null;
    sizeClassName: string;
    imageClassName: string;
    fallbackTextClassName: string;
    wrapperClassName?: string;
    wrapperStyle?: CSSProperties;
}

export default function TeamCrest({
    short,
    logo,
    sizeClassName,
    imageClassName,
    fallbackTextClassName,
    wrapperClassName = "",
    wrapperStyle,
}: TeamCrestProps) {
    const [failed, setFailed] = useState(false);
    const logoSrc = typeof logo === "string" && logo.trim().length > 0 ? logo.trim() : null;
    const showFallback = !logoSrc || failed;

    return (
        <div
            className={`flex items-center justify-center rounded-full border border-white/15 bg-white/5 ${sizeClassName} ${fallbackTextClassName} ${wrapperClassName}`}
            style={wrapperStyle}
        >
            {showFallback ? (
                short
            ) : (
                <img
                    src={logoSrc}
                    alt={short}
                    className={imageClassName}
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            )}
        </div>
    );
}
