import { motion } from 'motion/react';
import { useState } from 'react';
import bgImage from '../../assets/bg-v1.jpg';
import { Footer } from './Footer';

interface LandingScreenProps {
  onTopicSelect: (topic: string) => void;
}

const topics = [
  "What Is ADH1?",
  "Mechanism of Disease",
  "Clinical Presentation",
  "Average Time to Diagnosis",
  "Confirming Diagnosis",
  "Limitations of Conventional Therapy"
];

export function LandingScreen({ onTopicSelect }: LandingScreenProps) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic);
    setTimeout(() => {
      onTopicSelect(topic);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-[#1a1a1c] overflow-hidden flex flex-col items-center justify-center px-8 py-10"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" draggable={false} className="w-full h-full object-cover" />
      </div>


      <div className="relative z-10 max-w-7xl w-full -mt-[160px]">
        {/* Main heading */}
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-7xl font-light tracking-wide mb-16 text-center"
        >
          <span className="text-white">SUSPECT &</span>
          <br />
          <span className="text-[#FFC358] font-bold">DETECT ADH1</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl font-light tracking-wide text-gray-300 text-center mb-8"
        >
          Tap a category to join the ADH1 awareness movement
        </motion.p>

        {/* Topic buttons — stacked single column */}
        <div className="flex flex-col gap-3 w-full">
          {topics.map((topic, index) => {
            const isActive = activeTopic === topic;
            return (
              <motion.button
                key={topic}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, scale: isActive ? 1.02 : 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                onClick={() => handleTopicClick(topic)}
                className={`group relative bg-[#252528] border rounded-lg px-12 py-6
                           text-white text-2xl font-light tracking-wide text-left
                           hover:border-[#5a5a5e] transition-all duration-400
                           hover:bg-[#2a2a2e] overflow-hidden z-30
                           ${isActive ? 'border-[#FFC358]' : 'border-[#3a3a3e]'}`}
              >
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-gradient-to-r from-[#FFC358]/20 via-[#FFC358]/10 to-transparent"
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#4a4a4e]/20 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                )}
                <span className="relative z-10 leading-relaxed block">
                  {topic}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
