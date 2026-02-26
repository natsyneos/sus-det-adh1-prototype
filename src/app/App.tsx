import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LandingScreen } from './components/LandingScreen';
import { QuizScreen } from './components/QuizScreen';
import { FinalScreen } from './components/FinalScreen';
import { PasswordGate } from './components/PasswordGate';
import { FogOverlay, FogConfig, DEFAULT_FOG_CONFIG } from './components/FogOverlay';
import { FogDebugConsole } from './components/FogDebugConsole';

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
  const [score, setScore] = useState(0);
  const [fogConfig, setFogConfig] = useState<FogConfig>(DEFAULT_FOG_CONFIG);

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

  const handleAnswerResult = (correct: boolean) => {
    if (correct) setScore(prev => prev + 100);
  };

  const handleTopicSelect = (topic: string) => {
    setIsTransitioning(true);
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setCurrentScreen('quiz');
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
    setScore(0);
  };

  const handleRestart = () => {
    setIsTransitioning(true);
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  // Fog density:
  //   landing      → 1.0 (maximum)
  //   quiz q1      → 1.0, linear ramp down to 0.35 at q6
  //   final screen → 0.0 (fully clear — full reveal)
  const MIN_QUIZ_DENSITY = 0.35;
  const fogDensity = (() => {
    if (currentScreen === 'final')   return 0;
    if (currentScreen === 'landing') return 1;
    // Linear interpolation: index 0 → 1.0, index (n-1) → MIN_QUIZ_DENSITY
    return 1.0 - currentQuestionIndex * (1.0 - MIN_QUIZ_DENSITY) / (topics.length - 1);
  })();

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
            userSelect: 'none',
          }}
          onDragStart={e => e.preventDefault()}
        >
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
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={topics.length}
                currentScore={score}
                onAnswerResult={handleAnswerResult}
                onNext={handleNextQuestion}
                onBackToStart={handleBackToStart}
              />
            )}
            {currentScreen === 'final' && (
              <FinalScreen key="final" onRestart={handleRestart} score={score} />
            )}
          </AnimatePresence>

          {/* WebGL fog — rendered last so it paints above all screen content (z-[50]).
              The black transition flash uses z-[100] to still appear above the fog. */}
          <FogOverlay density={fogDensity} scale={scale} config={fogConfig} />

          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => setIsTransitioning(false)}
                className="absolute inset-0 bg-[#000000] z-[100] pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Debug console — fixed to viewport so it lives in the black letterbox
          area and never overlaps the 748×1330 design canvas. Remove when done. */}
      <FogDebugConsole
        config={fogConfig}
        autoDensity={fogDensity}
        onChange={setFogConfig}
      />
    </PasswordGate>
  );
}
