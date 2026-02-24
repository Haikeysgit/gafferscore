"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* ── Glassmorphism Top Navigation ── */}
            <nav className="glass-nav relative z-40 flex items-center justify-between bg-black/30 px-6 py-4 md:bg-transparent md:px-12">
                <span className="text-lg font-bold tracking-wide text-white">
                    GafferScore
                </span>

                {/* Desktop Links (Hidden on Mobile) */}
                <div className="hidden items-center gap-6 md:flex">
                    <a
                        href="#"
                        className="nav-link block px-3 py-2 text-white/70 transition-colors hover:text-mint"
                    >
                        Rules
                    </a>
                    <a
                        href="#"
                        className="nav-link block px-3 py-2 text-white/70 transition-colors hover:text-mint"
                    >
                        Team
                    </a>
                    <a
                        href="#"
                        className="nav-link block px-3 py-2 text-white/70 transition-colors hover:text-mint"
                    >
                        Contact Us
                    </a>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className="flex min-h-[44px] min-w-[44px] items-center justify-end text-white md:hidden"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </nav>

            {/* ── Mobile Drawer Overlay ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm md:hidden"
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Drawer Container */}
                        <motion.div
                            className="ml-auto flex h-full w-4/5 max-w-sm flex-col border-l border-white/10 bg-navy shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                                <span className="text-lg font-bold tracking-wide text-white">
                                    GafferScore
                                </span>
                                <button
                                    className="flex min-h-[44px] min-w-[44px] items-center justify-end text-white/70 transition-colors hover:text-white"
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close Menu"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Drawer Links with Staggered Entrance */}
                            <motion.div
                                className="flex flex-col gap-6 p-8"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
                                    },
                                }}
                            >
                                <motion.a
                                    href="#"
                                    className="flex items-center text-2xl font-bold text-white transition-colors hover:text-mint active:scale-95"
                                    onClick={() => setIsOpen(false)}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { type: "spring" } },
                                    }}
                                >
                                    Rules
                                </motion.a>
                                <motion.a
                                    href="#"
                                    className="flex items-center text-2xl font-bold text-white transition-colors hover:text-mint active:scale-95"
                                    onClick={() => setIsOpen(false)}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { type: "spring" } },
                                    }}
                                >
                                    Team
                                </motion.a>
                                <motion.a
                                    href="#"
                                    className="flex items-center text-2xl font-bold text-white transition-colors hover:text-mint active:scale-95"
                                    onClick={() => setIsOpen(false)}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { type: "spring" } },
                                    }}
                                >
                                    Contact Us
                                </motion.a>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
