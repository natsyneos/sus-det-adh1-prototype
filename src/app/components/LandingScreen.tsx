import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import bgImage from '../../assets/bg-v1.jpg';
import { Footer } from './Footer';

interface LandingScreenProps {
  onTopicSelect: (topic: string) => void;
}

interface LeaderboardEntry {
  initials: string;
  score: number;
}

const STORAGE_KEY = 'adh1-leaderboard';

const SEED_ENTRIES: LeaderboardEntry[] = [
  { initials: 'ACE', score: 400 },
  { initials: 'PRO', score: 350 },
  { initials: 'JDS', score: 300 },
  { initials: 'MHC', score: 275 },
  { initials: 'KLP', score: 250 },
  { initials: 'BRT', score: 200 },
  { initials: 'WXY', score: 175 },
  { initials: 'FGH', score: 150 },
  { initials: 'ZQP', score: 125 },
  { initials: 'NVL', score: 100 },
];

function loadLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return [...SEED_ENTRIES];
}

function TapIcon({ className }: { className?: string }) {
  return (
    <svg width="116" height="117" viewBox="0 0 116 117" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M57.6851 84.575C57.6851 84.575 39.9312 76.9667 36.2575 80.0669C32.5838 83.1671 33.4385 88.5139 42.7353 94.1452C52.0321 99.7766 59.1546 108.718 65.2875 111.593C74.3444 115.847 86.4752 114.02 94.6024 109.347C103.359 104.3 120.259 85.1291 109.537 63.4574C98.8309 41.7858 93.4328 40.8422 88.6794 43.4632C85.8904 45.0058 85.5755 49.0945 85.5755 49.0945C85.5755 49.0945 80.1474 42.969 75.9938 43.7478C69.9359 44.871 69.2311 47.6867 70.0708 50.2178C70.9106 52.7489 65.2125 41.5012 58.2549 46.6982C54.2513 49.6936 55.9757 54.7109 55.9757 54.7109C55.9757 54.7109 44.2198 35.4955 37.9369 32.7547C34.0233 31.0473 29.06 34.7616 29.8997 38.9851C30.7394 43.2086 57.6701 84.545 57.6701 84.545L57.6851 84.575Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.85 61.0012C12.8656 59.189 1.37951 44.7812 3.17889 28.8307C4.97827 12.8803 19.4183 1.37798 35.3878 3.17521C51.3723 4.97245 62.8583 19.3803 61.0589 35.3457" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M29.8697 51.9402C18.8785 50.6971 10.9762 40.7973 12.2208 29.8192C13.4654 18.8411 23.3769 10.9482 34.3681 12.1913C45.3594 13.4344 53.2616 23.3342 52.0171 34.3123" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M55.9907 54.7258L61.059 62.3042" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M70.0858 50.2327L74.1194 56.7177" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M85.5905 49.1094L87.4799 52.614" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function LandingScreen({ onTopicSelect }: LandingScreenProps) {
  const [isActive, setIsActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setLeaderboard(loadLeaderboard().slice(0, 10));
  }, []);

  const handleStart = () => {
    setIsActive(true);
    setTimeout(() => {
      onTopicSelect('What Is ADH1?');
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-[#1a1a1c] overflow-hidden flex flex-col items-center px-8"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" draggable={false} className="w-full h-full object-cover" />
      </div>

      {/* Upper group: heading + subtitle + button */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center gap-8 mt-[210px]">

        {/* Main heading — "ADH1" wraps onto line 1 to balance with "Knowledge" on line 2 */}
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-7xl font-light tracking-wide text-center leading-tight"
        >
          <span className="text-white">Test your </span><span className="text-[#FFC358] font-bold">ADH1</span>
          <br />
          <span className="text-[#FFC358] font-bold">Knowledge</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-2xl font-light tracking-wide text-gray-300 text-center leading-relaxed"
        >
          Answer six questions to test your understanding of<br />ADH1 and see how you rank among your peers.
        </motion.p>

        {/* Start Quiz button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, scale: isActive ? 1.02 : 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={handleStart}
          className="group relative bg-[#FFC358] rounded-lg px-8 py-6
                     text-[#1a1a1c] text-2xl font-bold tracking-wide
                     hover:bg-[#ffce75] transition-all duration-300 overflow-hidden
                     flex items-center gap-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <TapIcon className="w-11 h-11 relative z-10 shrink-0" />
          <span className="relative z-10">Start Quiz</span>
        </motion.button>
      </div>

      {/* Push leaderboard toward the bottom */}
      <div className="flex-1" />

      {/* Leaderboard — 2-column grid, near bottom */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative z-10 max-w-2xl w-full mb-36"
      >
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Trophy className="w-6 h-6 text-[#FFC358]" />
          <p className="text-lg font-semibold text-[#FFC358] tracking-widest uppercase">ADH1 Awareness Leaderboard</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[leaderboard.slice(0, 5), leaderboard.slice(5)].map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[6px]">
              {col.map((entry, i) => {
                const rank = colIdx * 5 + i;
                return (
                  <div
                    key={rank}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#252528]/80 border border-[#3a3a3e]"
                  >
                    <span className="text-sm font-light w-5 shrink-0 text-left text-gray-400">{rank + 1}.</span>
                    <span className="text-base font-bold tracking-widest flex-1 text-left text-white">{entry.initials}</span>
                    <span className="text-sm font-light shrink-0 text-gray-300">{entry.score}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

      <Footer />
    </motion.div>
  );
}
