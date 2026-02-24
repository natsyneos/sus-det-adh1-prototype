import { useState } from 'react';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);

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
      <div className="w-full h-screen overflow-hidden bg-[#000000] relative">
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => setIsTransitioning(false)}
              className="fixed inset-0 bg-[#000000] z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentScreen === 'landing' && (
            <LandingScreen
              key="landing"
              onTopicSelect={handleTopicSelect}
              lightsOn={lightsOn}
              onToggleLights={() => setLightsOn(prev => !prev)}
            />
          )}
          {currentScreen === 'quiz' && (
            <QuizScreen
              key={`quiz-${currentQuestionIndex}`}
              topic={selectedTopic}
              onComplete={handleQuizComplete}
              onNext={handleNextQuestion}
              onBackToStart={handleBackToStart}
              lightsOn={lightsOn}
              onToggleLights={() => setLightsOn(prev => !prev)}
            />
          )}
          {currentScreen === 'final' && (
            <FinalScreen key="final" onRestart={handleRestart} />
          )}
        </AnimatePresence>
      </div>
    </PasswordGate>
  );
}