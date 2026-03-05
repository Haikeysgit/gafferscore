'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingNav from '@/app/components/LandingNav';
import Footer from '@/app/components/Footer';

export default function ContactPage() {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, email }),
            });

            if (res.ok) {
                setStatus('success');
                setMessage('');
                setEmail('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Submit error', error);
            setStatus('error');
        }
    };

    return (
        <>
            <LandingNav />
            <main className="flex-grow">
                <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center relative z-10">
                    <div className="w-full max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-12"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
                                Get in Touch
                            </h1>
                            <p className="text-white/50 max-w-md mx-auto text-[15px] font-light leading-relaxed">
                                We value your feedback. Reach out to us publicly or send a direct message.
                            </p>
                        </motion.div>

                        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-stretch">

                            {/* Public Engagement (X Button) - Stacks on top for mobile */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="flex-1 order-1 md:order-1 flex flex-col items-center justify-center glass-card rounded-3xl p-8 md:p-12 border border-white/5 bg-navy-light/30 backdrop-blur-md relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-mint/5 to-transparent pointer-events-none"></div>

                                <h2 className="text-lg font-semibold text-white mb-4 relative z-10 text-center">
                                    Public Engagement
                                </h2>
                                <p className="text-white/50 text-center mb-8 text-[15px] font-light relative z-10 max-w-xs leading-relaxed">
                                    Follow us, mention us, or slide into our DMs on the official GafferScore X page.
                                </p>

                                <a
                                    href="https://x.com/gafferscore"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative z-10 inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium text-white/90 border border-white/15 bg-white/5 transition-all duration-200 hover:bg-white/10 hover:border-white/30 active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    Follow @GafferScore
                                </a>
                            </motion.div>

                            {/* Feedback Form - Stacks on bottom for mobile */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex-1 order-2 md:order-2 glass-card rounded-3xl p-8 md:p-12 border border-white/5 bg-navy-light/50 backdrop-blur-md shadow-2xl"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Send Feedback
                                </h2>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium tracking-wide text-white/70 mb-2 uppercase">
                                            Message <span className="text-mint">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            required
                                            rows={5}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-mint focus:border-mint transition-colors resize-none font-light"
                                            placeholder="Tell us what you think, report a bug, or suggest a feature..."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium tracking-wide text-white/70 mb-2 uppercase">
                                            Email <span className="text-white/30 lowercase normal-case ml-1">(Optional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-navy/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-mint focus:border-mint transition-colors font-light"
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={status === 'loading' || !message.trim()}
                                            className="w-full py-4 rounded-xl font-semibold tracking-wide text-navy bg-mint hover:bg-[#2ae00e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-interactive flex items-center justify-center uppercase text-sm"
                                        >
                                            {status === 'loading' ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full"
                                                />
                                            ) : (
                                                'Send Message'
                                            )}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {status === 'success' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-mint bg-mint/10 border border-mint/20 rounded-lg p-3 text-center text-sm font-medium"
                                            >
                                                Your feedback has been sent successfully. Thank you!
                                            </motion.div>
                                        )}
                                        {status === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-center text-sm font-medium"
                                            >
                                                Something went wrong. Please try again later.
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            </motion.div>

                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
