import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
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

  const handleAddToLeaderboard = () => {
    setChars(['', '', '']);
    setFocusedIdx(0);
    setPhase('initials');
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
                  ${phase === 'leaderboard' ? 'justify-start pt-20 pb-10' : 'justify-center py-10'}`}
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
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
              className="-mt-[220px]"
            >
              {/* Messaging — top of the block */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-[100px]"
              >
                <p className="text-4xl font-bold text-[#FFC358] leading-[1.25] mb-6">
                  The next era of ADH1 care<br />starts with awareness.
                </p>
                <p className="text-2xl font-light text-white leading-[1.25]">
                  A new breakthrough in treatment is coming.
                </p>
              </motion.div>

              {/* Score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-10"
              >
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mb-1">Your Score</p>
                <p className="text-9xl font-bold text-[#FFC358] leading-none">{score}</p>
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mt-2">out of 600</p>
              </motion.div>

              {/* CTAs */}
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
                  onClick={onRestart}
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
            >
              {/* Score reminder — same size as reveal screen */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-5"
              >
                <p className="text-xl font-light text-gray-400 tracking-widest uppercase mb-1">Your Score</p>
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
                {/* Trophy above heading */}
                <div className="flex flex-col items-center mb-6">
                  <Trophy className="w-10 h-10 text-[#FFC358] mb-3" />
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

                {/* Learn more — extra padding above and below */}
                <p className="text-3xl font-bold text-[#FFC358] mt-[90px] mb-8">Learn more at ADH1.com</p>

                {/* Back to Start */}
                <button
                  onClick={onRestart}
                  className="group relative bg-[#252528] border border-[#5a5a5e] rounded-lg px-14 py-6
                             text-white hover:border-[#7a7a7e] transition-all duration-400
                             hover:bg-[#2a2a2e] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4a4a4e]/20 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                  <span className="relative z-10 text-xl font-light tracking-wide">Back to Start</span>
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <Footer onExit={phase !== 'leaderboard' ? onRestart : undefined} />
    </motion.div>
  );
}
