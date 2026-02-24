import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import bgImage from '../../assets/033b0a9678b326af3e1307879cea8820c2f1418b.png';

interface LandingScreenProps {
  onTopicSelect: (topic: string) => void;
  lightsOn: boolean;
  onToggleLights: () => void;
}

const topics = [
  "What Is ADH1?",
  "Mechanism of Disease",
  "Clinical Presentation",
  "Average Time to Diagnosis",
  "Confirming Diagnosis",
  "Limitations of Conventional Therapy"
];

export function LandingScreen({ onTopicSelect, lightsOn, onToggleLights }: LandingScreenProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [isUserControlling, setIsUserControlling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roamAnimRef = useRef<number>(0);
  const roamPositionRef = useRef({ x: 0, y: 0 });

  // Roaming spotlight animation
  useEffect(() => {
    if (lightsOn) return;

    let startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      if (!isUserControlling && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        // Lissajous-style roam pattern
        const x = cx + Math.sin(elapsed * 0.6) * cx * 0.55;
        const y = cy + Math.cos(elapsed * 0.4) * cy * 0.5;
        roamPositionRef.current = { x, y };
        setMousePosition({ x, y });
      }

      roamAnimRef.current = requestAnimationFrame(animate);
    };

    roamAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(roamAnimRef.current);
  }, [isUserControlling, lightsOn]);

  // Track mouse for user control
  useEffect(() => {
    if (lightsOn) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      setIsUserControlling(true);

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        setIsUserControlling(false);
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [lightsOn]);

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic);
    setTimeout(() => {
      onTopicSelect(topic);
    }, 400);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#1a1a1c] relative overflow-hidden flex flex-col items-center justify-center px-16 py-12"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Animated fog overlay */}
      {!lightsOn && (
        <div className="absolute inset-0 opacity-30 z-[1]">
          <div className="fog-layer"></div>
        </div>
      )}

      {/* Spotlight overlay effect */}
      {!lightsOn && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle 280px at ${mousePosition.x}px ${mousePosition.y}px, 
                         transparent 0%, 
                         transparent 40%, 
                         rgba(0, 0, 0, 0.7) 100%)`
          }}
        />
      )}

      <div className="relative z-10 max-w-7xl w-full">
        {/* Main heading */}
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl font-light tracking-wide mb-6 text-center"
        >
          <span className="text-white">SUSPECT & </span>
          <span className="text-[#FFC358] font-bold">DETECT ADH1</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl font-light tracking-wide text-gray-300 text-center mb-20"
        >
          Tap a category to join the ADH1 awareness movement
        </motion.p>

        {/* Topic grid */}
        <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
          {topics.map((topic, index) => {
            const isActive = activeTopic === topic;
            return (
              <motion.button
                key={topic}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, scale: isActive ? 1.02 : 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                onClick={() => handleTopicClick(topic)}
                className={`group relative bg-[#252528] border rounded-lg px-8 py-12 
                           text-white hover:border-[#5a5a5e] transition-all duration-400
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
                <span className="relative z-10 text-lg font-light tracking-wide leading-relaxed block">
                  {topic}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lights On toggle */}
      <button
        onClick={onToggleLights}
        className="absolute bottom-6 left-8 z-50 text-xs font-light tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity duration-300 text-white flex items-center gap-2"
      >
        <span className={`inline-block w-2 h-2 rounded-full border border-white ${lightsOn ? 'bg-white' : 'bg-transparent'}`}></span>
        {lightsOn ? 'Lights Off' : 'Lights On'}
      </button>
    </motion.div>
  );
}