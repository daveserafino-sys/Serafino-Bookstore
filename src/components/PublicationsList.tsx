import { motion } from "motion/react";
import { Download } from "lucide-react";
import { Publication } from "../types";

interface PublicationsListProps {
  publications: Publication[];
  onBack: () => void;
}

export default function PublicationsList({ publications, onBack }: PublicationsListProps) {
  const handleDownload = (pubId: string, format: "pdf" | "epub") => {
    window.location.href = `/api/download/${pubId}/${format}`;
  };

  // Reverse the publications array so the newest stories are at the top
  const reversedPublications = [...publications].reverse();

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto px-6 pt-[12vh] pb-32 select-none font-sans" id="publications-container">
      {/* Return Button */}
      <button
        onClick={onBack}
        className="mb-12 font-serif italic text-xs tracking-wider text-[#8C7A5B] hover:text-[#C5B395] transition-colors cursor-pointer flex items-center gap-1.5 self-start"
        id="return-manuscripts-btn"
      >
        <span>← back</span>
      </button>

      {reversedPublications.length === 0 ? (
        <div className="text-center py-12 w-full">
          <p className="text-sm font-mono text-stone-600">No entries listed at this time.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <div className="w-full flex flex-col gap-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col divide-y divide-stone-800/30"
            >
              {reversedPublications.map((pub, idx) => (
                <motion.div
                  key={pub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 w-full"
                  id={`pub-item-${pub.id}`}
                >
                  <div className="flex flex-col max-w-lg">
                    {/* Story title as a hyperlink */}
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans italic font-light tracking-wide text-[30px] sm:text-[36px] leading-snug text-[#e2e7ec] hover:text-white transition-colors duration-300 underline underline-offset-4 decoration-stone-800/40 hover:decoration-white cursor-pointer"
                      id={`pub-title-link-${pub.id}`}
                    >
                      {pub.title}
                    </a>
                    
                    {/* Place & date of publication */}
                    <p className="font-serif text-stone-400 text-xs mt-1.5" id={`pub-metadata-${pub.id}`}>
                      {pub.outlet} — {pub.date}
                    </p>
                  </div>

                  {/* PDF and EPUB download buttons, no price associated */}
                  <div className="flex items-center gap-2 shrink-0" id={`pub-downloads-${pub.id}`}>
                    <button
                      onClick={() => handleDownload(pub.id, "pdf")}
                      className="px-3 py-1 bg-black/40 hover:bg-black/70 border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-stone-200 text-[11px] font-serif italic tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1 rounded-sm shadow-sm"
                      title="Download PDF"
                      id={`pub-download-pdf-${pub.id}`}
                    >
                      <span className="lowercase">pdf</span>
                      <Download size={8} className="opacity-60" />
                    </button>
                    <button
                      onClick={() => handleDownload(pub.id, "epub")}
                      className="px-3 py-1 bg-black/40 hover:bg-black/70 border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-stone-200 text-[11px] font-serif italic tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1 rounded-sm shadow-sm"
                      title="Download EPUB"
                      id={`pub-download-epub-${pub.id}`}
                    >
                      <span className="lowercase">epub</span>
                      <Download size={8} className="opacity-60" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
