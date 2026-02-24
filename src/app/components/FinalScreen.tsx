import { motion } from 'motion/react';
import bgImage from '../../assets/bf8f2b863e3bdcc5b498287cc66cff8fb490e1d4.png';
import Layer1 from '../../imports/Layer1';
import Layer11493 from '../../imports/Layer1-14-93';

interface FinalScreenProps {
  onRestart: () => void;
}

export function FinalScreen({ onRestart }: FinalScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#1a1a1c] relative overflow-hidden flex flex-col items-center justify-center px-16 py-12"
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Subtle dark overlay */}
      <div className="absolute inset-0 bg-black/5 z-[1]"></div>

      {/* Animated fog overlay */}
      <div className="absolute inset-0 opacity-20 z-[2]">
        <div className="fog-layer"></div>
      </div>

      {/* Corporate logo at bottom right */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="absolute bottom-[132px] right-[67px] z-10 w-[320px]"
      >
        <Layer1 />
      </motion.div>

      <div className="relative z-10 max-w-4xl w-full text-center -mt-[250px]">
        {/* Main message */}
        <motion.h2
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl font-light tracking-wide text-white mb-8 leading-tight"
        >
          <span className="font-bold text-[#FFC358]">The next era of ADH1 care starts with awareness.</span>
          <br />
          A new breakthrough in treatment is coming.
        </motion.h2>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-3xl font-light text-gray-300 mb-12">
            Learn more at <span className="text-[#FFC358]">ADH1.com</span>
          </p>

          <div className="flex items-center justify-center gap-20">
            <button
              onClick={onRestart}
              className="group relative bg-[#252528] border border-[#5a5a5e] rounded-lg px-12 py-5
                         text-white hover:border-[#7a7a7e] transition-all duration-400
                         hover:bg-[#2a2a2e] overflow-hidden"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#4a4a4e]/20 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              
              <span className="relative z-10 text-xl font-light tracking-wide">
                Back to Start
              </span>
            </button>

            {/* QR Code CTA */}
            <div className="flex items-center gap-4">
              <div className="h-[60px] w-[60px]">
                <Layer11493 />
              </div>
              <p className="text-lg font-light text-gray-300 max-w-[180px] leading-snug text-left">
                Scan to download<br />the whitepaper
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
