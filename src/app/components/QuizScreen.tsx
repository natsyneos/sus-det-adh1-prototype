import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
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
  answers: Array<{ text: string; display?: string; correct: boolean }>;
  explanation: string;
}

function renderMarkup(text: string, showRefs = true) {
  const parts = text.split(/(\[SUP\][^\[]*\[\/SUP\]|\[I\][^\[]*\[\/I\]|\[BR\])/);
  return parts.map((part, i) => {
    if (part.startsWith('[SUP]')) return showRefs ? <sup key={i} className="text-[0.65em]">{part.slice(5, -6)}</sup> : null;
    if (part.startsWith('[I]')) return <em key={i} style={{ marginRight: '0.15em' }}>{part.slice(3, -4)}</em>;
    if (part === '[BR]') return <br key={i} />;
    return part || null;
  });
}

const quizDataMap: Record<string, QuizData> = {
  "What Is ADH1?": {
    question: "What is autosomal dominant[BR]hypocalcemia type 1 (ADH1)?",
    answers: [
      {
        text: "A genetic form of hypoparathyroidism caused by gain-of-function variants in the calcium-sensing receptor gene (CASR).",
        display: "A genetic form of hypoparathyroidism caused by gain-of-function variants in the calcium-sensing receptor gene ([I]CASR[/I]).[SUP]1[/SUP]",
        correct: true,
      },
      { text: "A hypocalcemic disorder caused by magnesium deficiency leading to impaired parathyroid hormone (PTH) secretion.", correct: false },
      { text: "An autoimmune form of hypoparathyroidism.", correct: false },
    ],
    explanation: "In ADH1, overly-sensitive calcium-sensing receptors dysregulate calcium homeostasis.[SUP]2[/SUP]",
  },
  "Mechanism of Disease": {
    question: "How is the mechanism of disease in ADH1 distinct from other forms of hypoparathyroidism?",
    answers: [
      { text: "ADH1 is solely a kidney-related condition.", correct: false },
      { text: "ADH1 is caused by an injury to the parathyroid glands.", correct: false },
      {
        text: "ADH1 is caused by the body misreading calcium levels due to a variant of the CASR gene.",
        display: "ADH1 is caused by the body misreading calcium levels due to a variant of the [I]CASR[/I]\u00A0gene.[SUP]3[/SUP]",
        correct: true,
      },
    ],
    explanation: "In ADH1, the calcium-sensing receptors are too sensitive, \"tricking\" the body into believing low levels of calcium in the blood are normal or high. As a result, the parathyroid glands don't produce enough parathyroid hormone, and the kidneys excrete too much calcium into the urine.[SUP]3[/SUP]",
  },
  "Clinical Presentation": {
    question: "What are the most common physical symptoms of ADH1?",
    answers: [
      {
        text: "Paresthesia, fatigue, tetany",
        display: "Paresthesia, fatigue, tetany[SUP]2[/SUP]",
        correct: true,
      },
      { text: "Restless legs, anxiety, and dry skin", correct: false },
      { text: "Numbness, insomnia, and sensitivity to heat", correct: false },
    ],
    explanation: "A common sign of ADH1 is low serum calcium, which results in symptoms including paresthesia or numbness, fatigue, and muscle cramps and spasms (including tetany). In more severe cases, seizures, laryngospasms, and arrhythmias can occur.[SUP]2,4[/SUP]",
  },
  "Average Time to Diagnosis": {
    question: "True or False:[BR]ADH1 is typically diagnosed soon after birth.",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true },
    ],
    explanation: "While some cases are diagnosed in the first year of life, most cases take years and even decades to be diagnosed. There is a 20-plus-year gap between median age of diagnosis for a hypocalcemia-related disorder (4 years) and genetic confirmation of ADH1 (25 years).[SUP]2[/SUP]",
  },
  "Confirming Diagnosis": {
    question: "How is a diagnosis of ADH1 definitively confirmed?",
    answers: [
      { text: "Kidney ultrasound showing nephrocalcinosis", correct: false },
      { text: "Parathyroid hormone (PTH) test and 24-hour urine test", correct: false },
      {
        text: "Genetic testing",
        display: "Genetic testing[SUP]1[/SUP]",
        correct: true,
      },
    ],
    explanation: "Genetic testing is the only way to determine whether you carry any of the 26 genes known to cause hypoparathyroidism, including the calcium-sensing receptor gene ([I]CASR[/I]) that causes ADH1.[SUP]1[/SUP]",
  },
  "Limitations of Conventional Therapy": {
    question: "True or False:[BR]Conventional therapy for hypoparathyroidism using calcium supplementation and active vitamin D (calcitriol) is effective at controlling both serum calcium and urine calcium.[SUP]2[/SUP]",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true },
    ],
    explanation: "Conventional therapy effectively regulates calcium but does not address the continued CaSR dysfunction in the kidneys, which may lead to increased urine calcium excretion.[SUP]2[/SUP]",
  },
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

  const correctIdx = answers.findIndex(a => a.correct);
  const correctLabel = answers.length > 2
    ? ['A', 'B', 'C'][correctIdx]
    : answers[correctIdx]?.text;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-[#1a1a1c] overflow-hidden flex flex-col items-center justify-start px-8 pt-60 pb-10"
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
              className="text-3xl font-light text-white mb-16 text-center leading-[1.25]"
            >
              {quizData ? renderMarkup(quizData.question, !!selectedAnswer) : "What is the average diagnostic time for patients living with ADH1?"}
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
                    className={`relative bg-[#252528] border rounded-lg pl-7 pr-20 py-8
                               text-white text-2xl font-light text-left
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
                    {isSelected && isCorrect && (
                      <Check className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 text-[#FFC358]" strokeWidth={3} />
                    )}
                    {isSelected && !isCorrect && (
                      <X className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-9 h-9 text-[#d64545]" strokeWidth={3} />
                    )}
                    <span className="relative z-10 flex items-start gap-2">
                      {answers.length > 2 && (
                        <span className={`text-2xl font-bold w-8 shrink-0 leading-[1.4]
                          ${isSelected && isCorrect ? 'text-[#FFC358]' : ''}
                          ${isSelected && !isCorrect ? 'text-[#d64545]' : ''}
                          ${!isSelected ? 'text-gray-400' : ''}`}>
                          {['A', 'B', 'C'][index]}.
                        </span>
                      )}
                      <span className="flex-1">{renderMarkup(answer.display || answer.text, !!selectedAnswer)}</span>
                    </span>
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
                  <p className="text-xl font-light text-white mb-3 text-left">
                    The correct answer is: {correctLabel}
                  </p>
                  <p className="text-2xl font-bold text-[#FFC358] leading-[1.25] mb-12 text-left">
                    {quizData ? renderMarkup(quizData.explanation) : "There is a 20-plus-year gap between median age of diagnosis for a hypocalcemia-related disorder (4 years) and genetic confirmation of ADH1 (25 years)."}
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
