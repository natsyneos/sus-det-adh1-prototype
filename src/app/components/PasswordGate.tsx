import { useState } from 'react';
import React from 'react';
import { motion } from 'motion/react';

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem('adh1_unlocked') === 'true';
  });
  const [error, setError] = useState(false);

  const SECRET = 'bridge';

  const handleSubmit = () => {
    if (password === SECRET) {
      sessionStorage.setItem('adh1_unlocked', 'true');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="w-full h-screen bg-[#1a1a1c] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 w-full max-w-sm px-8"
      >
        <p className="text-sm font-light tracking-wide text-gray-400 mb-4">
          Enter password to continue
        </p>

        <input
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          className="w-full bg-[#252528] border border-[#3a3a3e] rounded-lg px-6 py-4
                     text-white font-light tracking-wide placeholder-gray-600
                     focus:outline-none focus:border-[#FFC358] transition-colors duration-300"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[#d64545] font-light tracking-wide"
          >
            Incorrect password. Please try again.
          </motion.p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#FFC358] text-[#1a1a1c] rounded-lg px-6 py-4
                     font-normal tracking-wide hover:bg-[#ffce75] transition-colors duration-300"
        >
          Enter
        </button>
      </motion.div>
    </div>
  );
}