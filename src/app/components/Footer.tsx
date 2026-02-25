import { useState } from 'react';
import { X } from 'lucide-react';
import Layer1 from '../../imports/Layer1';

const references = [
  "Carmichael J, et al. Autosomal Dominant Hypocalcemia: A Systematic Review. J Bone Miner Res. 2020.",
  "Hannan FM, et al. Calcium-sensing receptor (CaSR) mutations and disorders of calcium homeostasis. Best Pract Res Clin Endocrinol Metab. 2013.",
  "Thakker RV. Diseases associated with the extracellular calcium-sensing receptor. Cell Calcium. 2004.",
  "Pallais JC, et al. Autosomal Dominant Hypocalcemia. In: GeneReviews. University of Washington, Seattle. 2004.",
  "Bilezikian JP, et al. Hypoparathyroidism in the adult: epidemiology, diagnosis, pathophysiology, target-organ involvement, treatment, and challenges for future research. J Bone Miner Res. 2011.",
  "Shoback DM, et al. Calcimimetic agents in autosomal dominant hypocalcemia. N Engl J Med. 2004.",
  "Roszko KL, et al. Autosomal Dominant Hypocalcemia Type 1: A Systematic Review. J Bone Miner Res. 2022.",
];

export function Footer() {
  const [showReferences, setShowReferences] = useState(false);

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-40 px-8 py-5 flex items-center justify-between">
        {/* Left side: logo + legal */}
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24">
            <Layer1 />
          </div>
          <p className="text-xs font-light opacity-50 text-white tracking-wide">
            ©2026 BridgeBio Pharma, Inc. All rights reserved.<br />MAT-US-ECLTX-XXXX
          </p>
        </div>

        {/* Right side: References button */}
        <button
          onClick={() => setShowReferences(true)}
          className="bg-[#252528] border border-[#5a5a5e] rounded-lg px-6 py-3 text-white text-sm font-light tracking-wide hover:bg-[#2a2a2e] transition-all duration-300"
        >
          References
        </button>
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
                  {ref}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
