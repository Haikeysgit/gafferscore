import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-navy py-12 md:py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 md:flex-row md:justify-between">
                {/* Left: Logo & Copyright */}
                <div className="flex flex-col items-center gap-2 text-sm md:flex-row md:gap-3">
                    <span className="font-bold text-white/60">GafferScore</span>
                    <span className="hidden text-white/10 md:inline">&bull;</span>
                    <span className="text-white/25">&copy; 2026 GafferScore</span>
                </div>

                {/* Center: Social Icons */}
                <div className="flex items-center gap-4">
                    {/* X (Twitter) */}
                    <a href="#" aria-label="X" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/5 hover:text-white/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                    {/* TikTok */}
                    <a href="#" aria-label="TikTok" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/5 hover:text-white/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
                        </svg>
                    </a>
                    {/* Instagram */}
                    <a href="#" aria-label="Instagram" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/5 hover:text-white/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                    </a>
                </div>

                {/* Right: Utility Links */}
                <div className="flex items-center text-xs text-white/20">
                    <Link href="#" className="flex min-h-[44px] items-center px-4 transition-colors hover:text-white/50">
                        Privacy Policy
                    </Link>
                    <Link href="#" className="flex min-h-[44px] items-center px-4 transition-colors hover:text-white/50">
                        Terms
                    </Link>
                </div>
            </div>
        </footer>
    );
}
