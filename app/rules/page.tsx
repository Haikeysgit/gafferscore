'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingNav from '@/app/components/LandingNav';
import Footer from '@/app/components/Footer';

const rules = [
    {
        title: 'Prediction Deadlines',
        content: 'All predictions lock strictly before the first kickoff of the matchweek. Ensure you submit your selections early; once the first match begins, the entire week is locked and no further changes can be made.',
    },
    {
        title: 'Earning Points',
        content: 'A perfect prediction yields 50 total points per match. This is broken down into 20 base points for correctly predicting the match winner (or draw), plus an additional 30 points if you nail the exact final scoreline.',
    },
    {
        title: 'Leaderboard Rankings',
        content: 'The leaderboard updates a little while after real-life matches finish to process verified results. The Weekly leaderboard provides immediate bragging rights for the current matchweek, while the Global leaderboard tracks your ultimate overall ranking throughout the season.',
    },
];

export default function RulesPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <>
            <LandingNav />
            <main className="flex-grow">
                <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center">
                    <div className="w-full max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-12 text-center"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
                                How It Works
                            </h1>
                            <p className="text-white/50 max-w-md mx-auto text-[15px] font-light leading-relaxed">
                                Master the GafferScore rules to climb the ranks and claim ultimate bragging rights.
                            </p>
                        </motion.div>

                        <div className="space-y-4">
                            {rules.map((rule, index) => {
                                const isOpen = openIndex === index;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-navy-light/40 backdrop-blur-md"
                                    >
                                        <button
                                            onClick={() => toggleAccordion(index)}
                                            className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                                            aria-expanded={isOpen}
                                        >
                                            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide">
                                                {rule.title}
                                            </h2>
                                            <div className="ml-4 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                                                <motion.svg
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="w-5 h-5 text-mint"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </motion.svg>
                                            </div>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                                                >
                                                    <div className="px-6 pb-6 pt-2 text-white/60 text-[15px] md:text-base leading-relaxed font-light">
                                                        {rule.content}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
