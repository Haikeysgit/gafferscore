"use client";

import { useEffect, useRef, useState } from "react";

interface MetricTooltipProps {
    content: string;
    align?: "center" | "right";
}

export default function MetricTooltip({
    content,
    align = "right",
}: MetricTooltipProps) {
    const [open, setOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateViewportMode = () => {
            setIsMobileViewport(window.innerWidth < 640);
        };

        updateViewportMode();
        window.addEventListener("resize", updateViewportMode);

        return () => window.removeEventListener("resize", updateViewportMode);
    }, []);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!tooltipRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    const tooltipWidth = isMobileViewport ? "190px" : "280px";

    if (isMobileViewport) {
        return null;
    }

    return (
        <div
            ref={tooltipRef}
            className="relative flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Explain metric"
                aria-expanded={open}
                className="flex shrink-0 items-center justify-center transition-colors"
                style={{
                    width: "15px",
                    height: "15px",
                    minWidth: "15px",
                    minHeight: "15px",
                    padding: 0,
                    borderRadius: "50%",
                    background: open ? "rgba(30,41,59,0.98)" : "rgba(30,41,59,0.92)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    boxShadow: open ? "0 8px 18px rgba(0,0,0,0.28)" : "none",
                    color: open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)",
                    outline: "none",
                }}
            >
                <span
                    className="font-mono italic leading-none"
                    style={{ fontSize: "7px", transform: "translateY(-0.25px)" }}
                >
                    i
                </span>
            </button>

            {open && (
                <div
                    className={`absolute bottom-full z-[80] mb-3 rounded-2xl text-left shadow-2xl ${
                        align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
                    }`}
                    style={{
                        background: "rgba(8,15,29,0.96)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 18px 36px rgba(0,0,0,0.4)",
                        width: tooltipWidth,
                        maxWidth: isMobileViewport ? tooltipWidth : "90vw",
                        padding: "8px 12px",
                        fontSize: "10px",
                        lineHeight: "1.55",
                        color: "rgba(255,255,255,0.95)",
                        whiteSpace: "normal",
                        wordBreak: "normal",
                        overflowWrap: "break-word",
                    }}
                >
                    {content}
                    <div
                        className={`absolute h-3 w-3 ${
                            align === "right" ? "right-[3px]" : "left-1/2 -translate-x-1/2"
                        }`}
                        style={{
                            background: "rgba(8,15,29,0.96)",
                            borderRight: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            top: "100%",
                            transform:
                                align === "right"
                                    ? "translateY(-50%) rotate(45deg)"
                                    : "translate(-50%, -50%) rotate(45deg)",
                        }}
                    />
                </div>
            )}
        </div>
    );
}
