import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import bgImage from '../../assets/bg-v2.jpg';
import { Footer } from './Footer';

interface FinalScreenProps {
  onRestart: () => void;
  score: number;
}

interface LeaderboardEntry {
  initials: string;
  score: number;
}

type Phase = 'reveal' | 'initials' | 'leaderboard';

const STORAGE_KEY = 'adh1-leaderboard';

const SEED_ENTRIES: LeaderboardEntry[] = [
  { initials: 'ACE', score: 500 },
  { initials: 'PRO', score: 400 },
  { initials: 'JDS', score: 400 },
  { initials: 'MHC', score: 300 },
  { initials: 'KLP', score: 300 },
  { initials: 'BRT', score: 200 },
  { initials: 'TBK', score: 200 },
  { initials: 'FGH', score: 200 },
  { initials: 'ZQP', score: 100 },
  { initials: 'RGM', score: 0 },
];

// Initials belonging to pre-seeded placeholder entries — excluded from peer percentile calculation
const SEED_INITIALS = new Set(['ACE', 'PRO', 'JDS', 'MHC', 'KLP', 'BRT', 'TBK', 'FGH', 'ZQP', 'RGM']);

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

function loadLeaderboard(): LeaderboardEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES));
  return [...SEED_ENTRIES];
}

export function FinalScreen({ onRestart, score }: FinalScreenProps) {
  const [phase, setPhase] = useState<Phase>('reveal');
  const [chars, setChars] = useState(['', '', '']);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerIndex, setPlayerIndex] = useState(-1);

  // Compute peer percentile against real (non-seeded) players only.
  // Returns "Congratulations! You scored in the top X% of your peers." if top 50% or better,
  // otherwise null (show encouragement fallback).
  const peerMessage = (() => {
    const board = loadLeaderboard();
    const realPlayers = board.filter(e => !SEED_INITIALS.has(e.initials));
    if (realPlayers.length === 0) return null;
    const playersBelow = realPlayers.filter(e => e.score < score).length;
    const betterThanPct = Math.floor((playersBelow / realPlayers.length) * 100);
    if (betterThanPct >= 50) {
      const topPct = Math.max(1, 100 - betterThanPct);
      return `Congratulations! You scored in the top ${topPct}% of your peers.`;
    }
    return null;
  })();

  const handleAddToLeaderboard = () => {
    setChars(['', '', '']);
    setFocusedIdx(0);
    setPhase('initials');
  };

  const handleSkip = () => {
    const board = loadLeaderboard();
    setLeaderboard(board);
    setPlayerIndex(-1);
    setPhase('leaderboard');
  };

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      if (chars[focusedIdx]) {
        const newChars = [...chars];
        newChars[focusedIdx] = '';
        setChars(newChars);
      } else if (focusedIdx > 0) {
        const newChars = [...chars];
        newChars[focusedIdx - 1] = '';
        setChars(newChars);
        setFocusedIdx(focusedIdx - 1);
      }
    } else {
      const newChars = [...chars];
      newChars[focusedIdx] = key;
      setChars(newChars);
      if (focusedIdx < 2) setFocusedIdx(focusedIdx + 1);
    }
  };

  const handleSubmit = () => {
    if (!chars.some(c => c)) return;
    const entry: LeaderboardEntry = { initials: chars.map(c => c || '_').join(''), score };
    const board = loadLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const top10 = board.slice(0, 10);
    const idx = top10.indexOf(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
    setLeaderboard(top10);
    setPlayerIndex(idx);
    setPhase('leaderboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`absolute inset-0 bg-[#1a1a1c] overflow-hidden flex flex-col items-center px-8
                  ${phase === 'leaderboard' ? 'justify-start pt-[56px] pb-10' : 'justify-center py-10'}`}
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" draggable={false} className="w-full h-full object-cover" />
      </div>



      <div className="relative z-10 max-w-4xl w-full text-center">
        <AnimatePresence mode="wait">

          {/* ── Phase 1: Score reveal ── */}
          {phase === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="-mt-[260px]"
            >
              {/* Score — first */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-10"
              >
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mb-1">Your Score Is</p>
                <p className="text-9xl font-bold text-[#FFC358] leading-none">{score}</p>
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mt-2">out of 600</p>
              </motion.div>

              {/* Peer message — below score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-[80px]"
              >
                <p className="text-3xl font-light text-white leading-[1.35]">
                  {peerMessage ?? "Awareness is the first step. You're already moving toward deeper knowledge of ADH1."}
                </p>
              </motion.div>

              {/* CTAs — third */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col items-center gap-5"
              >
                <button
                  onClick={handleAddToLeaderboard}
                  className="group relative bg-[#FFC358] border border-[#FFC358] rounded-lg px-14 py-5
                             text-[#1a1a1c] hover:bg-[#ffce75] transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 text-xl font-semibold tracking-wide">Add to Leaderboard</span>
                </button>
                <button
                  onClick={handleSkip}
                  className="text-white hover:text-gray-300 text-lg font-light tracking-wide transition-colors duration-300"
                >
                  Skip
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── Phase 2: Initials entry ── */}
          {phase === 'initials' && (
            <motion.div
              key="initials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="-mt-[260px]"
            >
              {/* Score reminder — same position and copy as reveal screen */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-5"
              >
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mb-1">Your Score Is</p>
                <p className="text-9xl font-bold text-[#FFC358] leading-none">{score}</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <p className="text-2xl font-light text-white mb-5 leading-[1.25]">Enter your initials</p>

                {/* Character boxes */}
                <div className="flex items-center justify-center gap-5 mb-8">
                  {chars.map((char, i) => (
                    <div
                      key={i}
                      onClick={() => setFocusedIdx(i)}
                      className={`w-24 h-24 flex items-center justify-center text-4xl font-bold text-white
                                 bg-[#252528] border-2 rounded-xl transition-colors duration-200 cursor-pointer
                                 ${i === focusedIdx ? 'border-[#FFC358]' : 'border-[#5a5a5e]'}`}
                    >
                      {char}
                    </div>
                  ))}
                </div>

                {/* On-screen QWERTY keyboard */}
                <div className="flex flex-col gap-[5px] mb-8">
                  {KEYBOARD_ROWS.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-[5px]">
                      {row.map(key => (
                        <button
                          key={key}
                          onClick={() => handleKeyPress(key)}
                          className={`${key === '⌫' ? 'w-[84px]' : 'w-[60px]'} h-[52px]
                                     flex items-center justify-center rounded-lg
                                     bg-[#3a3a3e] hover:bg-[#4a4a4e] active:bg-[#5a5a5e]
                                     text-white text-lg font-medium transition-colors duration-100
                                     select-none`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!chars.some(c => c)}
                  className="bg-[#FFC358] border border-[#FFC358] rounded-lg px-14 py-4
                             text-[#1a1a1c] text-xl font-semibold tracking-wide
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:bg-[#ffce75] transition-all duration-300"
                >
                  Submit
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── Phase 3: Leaderboard ── */}
          {phase === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {/* Back to Start */}
                <button
                  onClick={onRestart}
                  className="group relative bg-[#252528] border border-[#5a5a5e] rounded-lg px-14 py-6
                             text-white hover:border-[#7a7a7e] transition-all duration-400
                             hover:bg-[#2a2a2e] overflow-hidden mb-16"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4a4a4e]/20 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                  <span className="relative z-10 flex items-center gap-3 text-xl font-light tracking-wide">
                    <X className="w-5 h-5" />Back to Start
                  </span>
                </button>

                {/* Trophy inline with heading */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Trophy className="w-10 h-10 text-[#FFC358] shrink-0" />
                  <p className="text-3xl font-bold text-[#FFC358] tracking-wide">ADH1 Awareness Leaderboard</p>
                </div>

                {/* 2-column grid: positions 1–5 left, 6–10 right */}
                <div className="grid grid-cols-2 gap-4">
                  {[leaderboard.slice(0, 5), leaderboard.slice(5)].map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-2">
                      {col.map((entry, i) => {
                        const rank = colIdx * 5 + i;
                        const isPlayer = rank === playerIndex;
                        return (
                          <div
                            key={rank}
                            className={`flex items-center gap-2 px-4 py-5 rounded-lg
                                        ${isPlayer
                                          ? 'bg-[#FFC358]/20 border border-[#FFC358]'
                                          : 'bg-[#252528] border border-[#3a3a3e]'}`}
                          >
                            <span className={`text-lg font-light w-7 shrink-0 text-left ${isPlayer ? 'text-[#FFC358]' : 'text-gray-400'}`}>
                              {rank + 1}.
                            </span>
                            <span className={`text-2xl font-bold tracking-widest flex-1 text-left ${isPlayer ? 'text-[#FFC358]' : 'text-white'}`}>
                              {entry.initials}
                            </span>
                            <span className={`text-lg font-light shrink-0 ${isPlayer ? 'text-[#FFC358]' : 'text-gray-300'}`}>
                              {entry.score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* "The next era..." — yellow bold */}
                <p className="text-4xl font-bold text-[#FFC358] leading-[1.25] mt-[60px] mb-6">
                  The next era of ADH1 care<br />starts with awareness
                </p>

                {/* Learn more */}
                <p className="text-2xl text-white mb-8">
                  <span className="font-light">Learn more at </span><span className="font-bold">ADH1.com</span>
                </p>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer onExit={phase !== 'leaderboard' ? onRestart : undefined} />
    </motion.div>
  );
}
