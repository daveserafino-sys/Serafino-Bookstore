import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Book } from "../types";
import { Download } from "lucide-react";
import PaymentPanel from "./PaymentPanel";

interface BookScrollProps {
  books: Book[];
  scrollY: number;
}

export default function BookScroll({ books, scrollY }: BookScrollProps) {
  const [activePayment, setActivePayment] = useState<{
    book: Book;
    format: "pdf" | "epub";
  } | null>(null);

  return (
    <div className="w-full max-w-xl mx-auto px-6 select-none font-sans flex flex-col items-center">
      {/* 
        Grouped titles with elegant, compact vertical rhythm 
      */}
      <div className="w-full flex flex-col gap-[180px] pt-[50vh] pb-36">
        {books.map((book, idx) => {
          const handleDownload = (format: "pdf" | "epub") => {
            if (book.id === "corilocho" || book.price === 0) {
              window.location.href = `/api/download/${book.id}/${format}`;
            } else {
              setActivePayment({ book, format });
            }
          };

          // Elegant subtle parallax effect: each title scrolls at a custom relative offset for visual depth
          const titleParallax = scrollY * 0.08 * (idx + 1) * 0.4;

          return (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
              className="flex flex-col items-center w-full text-center"
              style={{
                transform: `translate3d(0, ${titleParallax}px, 0)`,
                willChange: "transform"
              }}
            >
              {/* Centered Title with modern italic sans-serif font and silvery/blue color */}
              <h2 className="font-sans italic font-light tracking-wide text-[45px] sm:text-[54px] leading-tight text-[#e2e7ec] hover:text-white transition-colors duration-300 whitespace-nowrap">
                {book.title}
              </h2>
              
              {/* Centered Price underneath ($0 for complimentary, strip decimals for others) */}
              <div className="font-serif text-[14.3px] sm:text-[15.4px] text-[#8C7A5B] italic tracking-wide mt-2 mb-4 font-light">
                {book.price === 0 ? "$0" : `$${book.price}`}
              </div>

              {/* PDF and EPUB Buttons centered underneath, dark glass styling for high-end feel */}
              <div className="flex items-center justify-center gap-3">
                <button
                  id={`download-pdf-btn-${book.id}`}
                  onClick={() => handleDownload("pdf")}
                  className="px-4 py-1.5 bg-black/50 hover:bg-black/80 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100 text-xs font-serif italic tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 rounded-sm shadow-sm"
                  title="Download PDF"
                >
                  <span className="lowercase">pdf</span>
                  <Download size={9} className="opacity-70" />
                </button>

                <button
                  id={`download-epub-btn-${book.id}`}
                  onClick={() => handleDownload("epub")}
                  className="px-4 py-1.5 bg-black/50 hover:bg-black/80 border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100 text-xs font-serif italic tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 rounded-sm shadow-sm"
                  title="Download EPUB"
                >
                  <span className="lowercase">epub</span>
                  <Download size={9} className="opacity-70" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activePayment && (
          <PaymentPanel
            book={activePayment.book}
            format={activePayment.format}
            onClose={() => setActivePayment(null)}
            onSuccess={() => {
              window.location.href = `/api/download/${activePayment.book.id}/${activePayment.format}`;
              setActivePayment(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
