import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import bgImage from '../../assets/033b0a9678b326af3e1307879cea8820c2f1418b.png';
import { Footer } from './Footer';

interface QuizScreenProps {
  topic: string;
  onComplete: () => void;
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

export function QuizScreen({ topic, onNext, onBackToStart }: QuizScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    if (!selectedAnswer) {
      setSelectedAnswer(answer);
      setTimeout(() => setShowExplanation(true), 600);
    }
  };

  const handleNextClick = () => {
    onNext();
  };

  const quizData = quizDataMap[topic];
  const answers = quizData ? quizData.answers : [];

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
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Animated fog overlay */}
      <div className="absolute inset-0 opacity-40 z-[1]">
        <div className="fog-layer"></div>
      </div>

      {/* Exit button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        onClick={onBackToStart}
        className="absolute top-8 right-8 z-50 bg-[#252528] border border-[#5a5a5e] rounded-lg px-6 py-3
                   text-white text-sm font-light tracking-wide hover:bg-[#2a2a2e]
                   transition-all duration-300 flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Exit
      </motion.button>

      <div className="relative z-10 max-w-5xl w-full">
        {/* Question */}
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-light tracking-wide text-white mb-16 text-center leading-relaxed"
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
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                onClick={() => handleAnswerSelect(answer.text)}
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
              <p className="text-2xl font-bold text-[#FFC358] leading-relaxed mb-12 text-left">
                {quizData ? quizData.explanation : "There is a 20-plus-year gap between median age of diagnosis for hypocalcemia-related disorder (4 years) and genetic confirmation of ADH1 (25 years)."}
              </p>
              <div className="flex items-center justify-center gap-6 mt-8">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  onClick={handleNextClick}
                  className="group relative bg-[#FFC358] border border-[#FFC358] rounded-lg px-10 py-4
                             text-[#1a1a1c] hover:bg-[#ffce75] transition-all duration-400 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
                  <span className="relative z-10 text-lg font-normal tracking-wide">Next Question</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </motion.div>
  );
}
