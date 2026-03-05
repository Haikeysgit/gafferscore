'use client';

import { motion } from 'framer-motion';
import LandingNav from '@/app/components/LandingNav';
import Footer from '@/app/components/Footer';

export default function TeamPage() {
    return (
        <>
            <LandingNav />
            <main className="flex-grow">
                <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-md glass-card rounded-[2rem] p-10 relative flex flex-col items-center justify-center text-center overflow-hidden border border-white/10 shadow-2xl bg-navy-light/40 backdrop-blur-md"
                    >
                        {/* Subtle backgound glow */}
                        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-mint/10 to-transparent pointer-events-none" />

                        {/* Avatar Placeholder with Glow */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="relative mb-8"
                        >
                            <div className="absolute inset-0 bg-mint/30 rounded-full blur-xl animate-pulse" />
                            <div className="relative w-32 h-32 rounded-full border border-white/20 bg-gradient-to-tr from-navy-light to-mint/20 flex items-center justify-center shadow-inner overflow-hidden">
                                <svg className="w-16 h-16 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996C-.014 14.868 6.005 9.06 12 9.06s12.014 5.808 12 11.933M12 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4" />
                                </svg>
                            </div>
                        </motion.div>

                        {/* Name */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                                Haikeys
                            </h1>
                        </motion.div>

                        {/* Titles */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="space-y-1 mb-10"
                        >
                            <p className="text-mint font-semibold tracking-wider uppercase text-sm md:text-base">
                                Founder of GafferScore
                            </p>
                            <p className="text-white/50 font-light tracking-wide text-xs md:text-sm">
                                Full Stack Developer & AI Engineer
                            </p>
                        </motion.div>

                        {/* Social Links */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="flex justify-center items-center gap-8 w-full relative z-10"
                        >
                            <a href="https://x.com/Haikeystweett" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-all transform hover:scale-110" aria-label="X Profile">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/in/imisioluwa-obaseki-537298318/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-all transform hover:scale-110" aria-label="LinkedIn Profile">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a href="https://github.com/haikeysgit" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-all transform hover:scale-110" aria-label="GitHub Profile">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
