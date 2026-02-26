import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import bgImage from '../../assets/bg-v1.jpg';
import { Footer } from './Footer';

interface QuizScreenProps {
  topic: string;
  questionNumber: number;
  totalQuestions: number;
  currentScore: number;
  onAnswerResult: (correct: boolean) => void;
  onNext: () => void;
  onBackToStart: () => void;
}

interface QuizData {
  question: string;
  answers: Array<{ text: string; correct: boolean }>;
  explanation: string;
}

const quizDataMap: Record<string, QuizData> = {
  "What Is ADH1?": {
    question: "What is autosomal dominant hypocalcemia type 1 (ADH1)?",
    answers: [
      { text: "A rare genetic condition caused by gain-of-function variants in the calcium-sensing receptor gene (CASR).", correct: true },
      { text: "A condition caused by low calcium intake", correct: false },
      { text: "An autoimmune form of hypoparathyroidism", correct: false }
    ],
    explanation: "In ADH1, over-sensitive calcium-sensing receptor (CaSR) causes dysregulation of calcium homeostasis."
  },
  "Mechanism of Disease": {
    question: "Which statement describes how the mechanism of disease in ADH1 is distinct from other forms of hypoparathyroidism?",
    answers: [
      { text: "ADH1 is solely a kidney-related condition.", correct: false },
      { text: "ADH1 is caused by parathyroid gland injury.", correct: false },
      { text: "In ADH1, the body misreads calcium levels due to malfunction of the CaSR protein.", correct: true }
    ],
    explanation: "In ADH1, the calcium sensing receptor is too sensitive, \"tricking\" the body into believing low levels of calcium in the blood are normal, or normal levels are too high. As a result, the parathyroid glands don't produce enough parathyroid hormone, and the kidneys excrete too much calcium into the urine."
  },
  "Average Time to Diagnosis": {
    question: "True or False: ADH1 is typically diagnosed at birth.",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true }
    ],
    explanation: "There is a 20-plus-year gap between median age of hypocalcemia diagnosis (4 years) and genetic confirmation of ADH1 (25 years)."
  },
  "Clinical Presentation": {
    question: "What are the most common physical symptoms of ADH1?",
    answers: [
      { text: "Numbness, fatigue, tetany", correct: true },
      { text: "Restless legs and anxiety", correct: false },
      { text: "Paresthesia and insomnia", correct: false }
    ],
    explanation: "A common sign of ADH1 is low serum calcium, resulting in muscle cramps and spasms (tetany), and in severe cases seizures, laryngospasms, and arrhythmias."
  },
  "Confirming Diagnosis": {
    question: "How is a diagnosis of ADH1 definitively confirmed?",
    answers: [
      { text: "Kidney ultrasound showing nephrocalcinosis", correct: false },
      { text: "Parathyroid hormone (PTH) test and 24-hour urine test", correct: false },
      { text: "Genetic testing", correct: true }
    ],
    explanation: "Genetic testing of the calcium-sensing receptor gene (CASR) is the only way to confirm a diagnosis of ADH1."
  },
  "Limitations of Conventional Therapy": {
    question: "True or False: Conventional therapy for hypoparathyroidism (calcium supplements and activated Vitamin D) also effectively treats ADH1.",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true }
    ],
    explanation: "Conventional therapy does not address the continued dysfunction in the kidneys. Without addressing the underlying issue, conventional therapy may exacerbate hypercalciuria and lead to long-term renal complications, such as kidney stones, kidney calcification, and kidney failure. Serum calcium may not be controlled either."
  }
};

export function QuizScreen({ topic, questionNumber, totalQuestions, currentScore, onAnswerResult, onNext, onBackToStart }: QuizScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset per-question state when question changes (without remounting)
  useEffect(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [questionNumber]);

  const handleAnswerSelect = (answer: { text: string; correct: boolean }) => {
    if (!selectedAnswer) {
      setSelectedAnswer(answer.text);
      onAnswerResult(answer.correct);
      setTimeout(() => setShowExplanation(true), 600);
    }
  };

  const quizData = quizDataMap[topic];
  const answers = quizData ? quizData.answers : [];
  const progressBefore = ((questionNumber - 1) / totalQuestions) * 100;
  const progressAfter = (questionNumber / totalQuestions) * 100;
  const isLastQuestion = questionNumber === totalQuestions;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-[#1a1a1c] overflow-hidden flex flex-col items-center justify-center px-8 pt-36 pb-10"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" draggable={false} className="w-full h-full object-cover" />
      </div>


      {/* Progress header — black bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-0 left-0 right-0 z-50 bg-black/40"
      >
        <div className="flex items-center gap-5 px-8 pt-6 pb-5">
          <span className="text-white text-xl font-light tracking-wide leading-snug text-center">
            <span className="block">Question</span>
            <span className="block">{questionNumber} of {totalQuestions}</span>
          </span>
          <div className="flex-1 h-4 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FFC358] rounded-full"
              initial={{ width: `${progressBefore}%` }}
              animate={{ width: `${progressAfter}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[#FFC358] text-3xl font-bold whitespace-nowrap">
            {currentScore} pts
          </span>
        </div>
      </motion.div>


      <div className="relative z-10 max-w-5xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionNumber}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question */}
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl font-light tracking-wide text-white mb-16 text-center leading-[1.25]"
            >
              {quizData ? quizData.question : "What is the average diagnostic time for patients living with ADH1?"}
            </motion.h2>

            {/* Answer options */}
            <div className="flex flex-col gap-6 mb-12">
              {answers.map((answer, index) => {
                const isSelected = selectedAnswer === answer.text;
                const isCorrect = answer.correct;
                const shouldDim = selectedAnswer && !isCorrect && !isSelected;

                return (
                  <motion.button
                    key={answer.text}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: shouldDim ? 0.3 : 1, scale: isSelected ? 1.02 : 1 }}
                    transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
                    onClick={() => handleAnswerSelect(answer)}
                    disabled={!!selectedAnswer}
                    className={`relative bg-[#252528] border rounded-lg px-12 py-8
                               text-white text-2xl font-light tracking-wide text-left
                               transition-all duration-500 overflow-hidden
                               ${!selectedAnswer ? 'hover:bg-[#2a2a2e] cursor-pointer' : 'cursor-default'}
                               ${isSelected && isCorrect ? 'border-[#FFC358]' : ''}
                               ${isSelected && !isCorrect ? 'border-[#d64545]' : ''}
                               ${!isSelected ? 'border-[#3a3a3e]' : ''}
                    `}
                  >
                    {isSelected && isCorrect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-gradient-to-r from-[#FFC358]/20 via-[#FFC358]/10 to-transparent"
                      />
                    )}
                    {isSelected && !isCorrect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-gradient-to-r from-[#d64545]/20 via-[#d64545]/10 to-transparent"
                      />
                    )}
                    <span className="relative z-10">{answer.text}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-[#FFC358] leading-[1.25] mb-12 text-left">
                    {quizData ? quizData.explanation : "There is a 20-plus-year gap between median age of diagnosis for hypocalcemia-related disorder (4 years) and genetic confirmation of ADH1 (25 years)."}
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-8">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      onClick={onNext}
                      className="group relative bg-[#FFC358] border border-[#FFC358] rounded-lg px-10 py-4
                                 text-[#1a1a1c] hover:bg-[#ffce75] transition-all duration-400 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                      <span className="relative z-10 text-lg font-normal tracking-wide">
                        {isLastQuestion ? 'See Results' : 'Next Question'}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer onExit={onBackToStart} />
    </motion.div>
  );
}
