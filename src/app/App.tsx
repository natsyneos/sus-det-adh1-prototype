import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingScreen } from './components/LandingScreen';
import { QuizScreen } from './components/QuizScreen';
import { FinalScreen } from './components/FinalScreen';
import { PasswordGate } from './components/PasswordGate';

type Screen = 'landing' | 'quiz' | 'final';

const topics = [
  "What Is ADH1?",
  "Mechanism of Disease",
  "Clinical Presentation",
  "Average Time to Diagnosis",
  "Confirming Diagnosis",
  "Limitations of Conventional Therapy"
];

// Design canvas: 9:16 at 1330px tall — all px/rem values in child components
// are authored at this size and scale up/down uniformly via CSS transform.
const DESIGN_HEIGHT = 1330;
const DESIGN_WIDTH = Math.round(DESIGN_HEIGHT * 9 / 16); // 748

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / DESIGN_WIDTH;
      const scaleY = window.innerHeight / DESIGN_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleTopicSelect = (topic: string) => {
    setIsTransitioning(true);
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = () => {
    setIsTransitioning(true);
    setCurrentScreen('final');
  };

  const handleNextQuestion = () => {
    setIsTransitioning(true);
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < topics.length) {
      setSelectedTopic(topics[nextIndex]);
      setCurrentQuestionIndex(nextIndex);
    } else {
      setCurrentScreen('final');
    }
  };

  const handleBackToStart = () => {
    setIsTransitioning(true);
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
  };

  const handleRestart = () => {
    setIsTransitioning(true);
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
  };

  return (
    <PasswordGate>
      {/* Viewport: black letterbox bars fill whatever the browser window is */}
      <div className="w-screen h-screen bg-black overflow-hidden relative">
        {/* Design canvas: fixed 748×1330, scaled uniformly to fit viewport */}
        <div
          className="absolute overflow-hidden"
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setIsTransitioning(false)}
                className="absolute inset-0 bg-[#000000] z-50 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {currentScreen === 'landing' && (
              <LandingScreen
                key="landing"
                onTopicSelect={handleTopicSelect}
              />
            )}
            {currentScreen === 'quiz' && (
              <QuizScreen
                key={`quiz-${currentQuestionIndex}`}
                topic={selectedTopic}
                onComplete={handleQuizComplete}
                onNext={handleNextQuestion}
                onBackToStart={handleBackToStart}
              />
            )}
            {currentScreen === 'final' && (
              <FinalScreen key="final" onRestart={handleRestart} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PasswordGate>
  );
}
