import Link from "next/link";

interface SimpleBackHeaderProps {
    backHref: string;
    backLabel: string;
    title: string;
    eyebrow?: string;
    detail?: string;
}

export default function SimpleBackHeader({
    backHref,
    backLabel,
    title,
    eyebrow,
    detail,
}: SimpleBackHeaderProps) {
    return (
        <header className="glass-nav sticky top-0 z-50">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-6">
                <Link
                    href={backHref}
                    className="flex min-h-[44px] items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-white"
                    style={{ color: "rgba(255, 255, 255, 0.82)" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    {backLabel}
                </Link>

                <div className="text-right">
                    {eyebrow && (
                        <p
                            className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                            style={{ color: "rgba(255, 255, 255, 0.46)" }}
                        >
                            {eyebrow}
                        </p>
                    )}
                    <p className="text-sm font-semibold text-white">{title}</p>
                    {detail && (
                        <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.56)" }}>
                            {detail}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
