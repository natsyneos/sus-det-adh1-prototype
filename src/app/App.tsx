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
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [quizDurationSec, setQuizDurationSec] = useState(0);

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
    setQuestionAnswered(true);
    if (currentQuestionIndex === topics.length - 1) {
      const durationSec = Math.round((Date.now() - quizStartTime) / 1000);
      setQuizDurationSec(durationSec);
      setTimeBonus(
        durationSec < 60  ? 100 :
        durationSec < 120 ? 75  :
        durationSec < 210 ? 50  :
        durationSec < 300 ? 25  :
        durationSec < 420 ? 10  : 0
      );
    }
  };

  const handleTopicSelect = (topic: string) => {
    setIsTransitioning(true);
    setSelectedTopic(topic);
    setCurrentQuestionIndex(0);
    setQuizStartTime(Date.now());
    setCurrentScreen('quiz');
  };

  const handleNextQuestion = () => {
    setQuestionAnswered(false);
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < topics.length) {
      // Question-to-question: no flash, content transitions internally
      setSelectedTopic(topics[nextIndex]);
      setCurrentQuestionIndex(nextIndex);
    } else {
      // Last question → final screen: use flash
      setIsTransitioning(true);
      setCurrentScreen('final');
    }
  };

  const handleBackToStart = () => {
    setIsTransitioning(true);
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
    setQuestionAnswered(false);
    setScore(0);
    setTimeBonus(0);
    setQuizDurationSec(0);
  };

  const handleRestart = () => {
    setIsTransitioning(true);
    setCurrentScreen('landing');
    setSelectedTopic('');
    setCurrentQuestionIndex(0);
    setQuestionAnswered(false);
    setScore(0);
    setTimeBonus(0);
    setQuizDurationSec(0);
  };

  // Fog density:
  //   landing         → 1.0 (maximum)
  //   quiz unanswered → ramp based on question index
  //   quiz answered   → immediately step to next level (fog clears on answer, not on Next)
  //   final screen    → 0.0 (fully clear — full reveal)
  const MIN_QUIZ_DENSITY = 0.35;
  const fogDensity = (() => {
    if (currentScreen === 'final')   return 0;
    if (currentScreen === 'landing') return 1;
    // Advance one step as soon as the question is answered
    const effectiveIndex = currentQuestionIndex + (questionAnswered ? 1 : 0);
    return 1.0 - effectiveIndex * (1.0 - MIN_QUIZ_DENSITY) / (topics.length - 1);
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
                key="quiz"
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
              <FinalScreen key="final" onRestart={handleRestart} score={score} timeBonus={timeBonus} quizDurationSec={quizDurationSec} />
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
