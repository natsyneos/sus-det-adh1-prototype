import { useState } from 'react';
import { X } from 'lucide-react';

function renderMarkup(text: string) {
  const parts = text.split(/(\[I\][^\[]*\[\/I\])/);
  return parts.map((part, i) => {
    if (part.startsWith('[I]')) return <em key={i}>{part.slice(3, -4)}</em>;
    return part || null;
  });
}

const references = [
  "Mannstadt M, Mathew A, Sridhar A, Stapleton Smith L, Roberts MS, Adler S. SAT231 next-generation sequencing for detection of underlying genetic causes of nonsurgical hypoparathyroidism: preliminary results from a sponsored testing program. [I]J Endocr Soc.[/I] 2023;7(Suppl 1):A284. doi:10.1210/jendso/bvad114.527",
  "Roszko KL, Stapleton Smith LM, Sridhar AV, et al. Autosomal dominant hypocalcemia type 1: a systematic review. [I]J Bone Miner Res[/I]. 2022;37(10):1926–1935. doi:10.1002/jbmr.4659",
  "De Coster T, David K, Breckpot J, Decallonne B. Management of autosomal dominant hypocalcemia type 1: literature review and clinical practice recommendations. [I]J Endocrinol Invest.[/I] 2025;48:831–844. doi:10.1007/s40618-024-02496-y",
  "Khan S, Khan AA. Hypoparathyroidism: diagnosis, management and emerging therapies. [I]Nat Rev Endocrinol[/I]. 2025;21(6):360–374. doi:10.1038/s41574-024-01075-8",
  "Khan AA, Ali DS, Bilezikian JP, et al. Best practice recommendations for the diagnosis and management of hypoparathyroidism. [I]Metabolism[/I]. 2025;171:156335. doi:10.1016/j.metabol.2025.156335",
];

interface FooterProps {
  onExit?: () => void;
}

export function Footer({ onExit }: FooterProps) {
  const [showReferences, setShowReferences] = useState(false);

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-40 px-8 py-5 flex items-center justify-between">
        {/* Left side: legal */}
        <p className="text-xs font-light opacity-50 text-white tracking-wide">
          © 2026 BridgeBio Pharma, Inc. All rights reserved.<br />MAT-US-ECLTX-0125
        </p>

        {/* Right side: References + optional Exit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReferences(true)}
            className="bg-[#252528] border border-[#5a5a5e] rounded-lg px-6 py-3 text-white text-sm font-light tracking-wide hover:bg-[#2a2a2e] transition-all duration-300"
          >
            References
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="bg-[#252528] border border-[#5a5a5e] rounded-lg px-6 py-3 text-white text-sm font-light tracking-wide hover:bg-[#2a2a2e] transition-all duration-300 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
          )}
        </div>
      </div>

      {/* References modal */}
      {showReferences && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a1c] border border-[#3a3a3e] rounded-2xl mx-8 p-10 max-h-[75vh] overflow-y-auto relative">
            <button
              onClick={() => setShowReferences(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#252528] border border-[#5a5a5e] flex items-center justify-center hover:bg-[#2a2a2e] transition-all duration-300"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <h2 className="text-3xl font-light text-[#FFC358] mb-8">References</h2>
            <ol className="list-decimal list-inside space-y-4">
              {references.map((ref, index) => (
                <li key={index} className="text-lg font-light text-gray-300 leading-relaxed">
                  {renderMarkup(ref)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
