import React, { useState, useEffect } from "react";
import { Book, WriterData } from "./types";
import Background from "./components/Background";
import BookScroll from "./components/BookScroll";
import AdminPanel from "./components/AdminPanel";
import PublicationsList from "./components/PublicationsList";
import WritersStudy from "./components/WritersStudy";
import { Key, Moon, Sun } from "lucide-react";

export default function App() {
  const [writerData, setWriterData] = useState<WriterData>({ books: [], publications: [] });
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNoirMode, setIsNoirMode] = useState(true);
  const [currentView, setCurrentView] = useState<"books" | "publications" | "study">("books");

  // Parallax Scroll State
  const [scrollY, setScrollY] = useState(0);

  // Viewport Height State to keep parallax scrolling consistent in all device formats
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const maxTranslation = viewportHeight * 1.2;
  const parallaxY = -Math.min(scrollY * 0.6, maxTranslation);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch writer data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/writer-data");
        if (response.ok) {
          const data = await response.json();
          setWriterData(data);
        }
      } catch (error) {
        console.error("Error fetching writer data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save updated data to API (Admin panel action)
  const handleSaveData = async (updatedData: WriterData, passcode: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/writer-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, data: updatedData })
      });

      if (response.ok) {
        setWriterData(updatedData);
        return true;
      }
    } catch (error) {
      console.error("Error updating writer data:", error);
    }
    return false;
  };

  return (
    <div 
      className={`relative w-full flex flex-col justify-start pb-2 transition-colors duration-1000 ${isNoirMode ? "text-stone-300" : "text-stone-100"}`}
      style={{ minHeight: `${viewportHeight * 3.3}px` }}
    >
      {/* Immersive static backdrop & grain textures */}
      <Background isNoirMode={isNoirMode} scrollY={scrollY} viewportHeight={viewportHeight} />
      <div className="grain-overlay" />

      {/* Interactive Easter Egg Layer for the Lightbulb, Water Glass & Pen/Paper (positioned exactly matching background elements) */}
      <div 
        className="fixed inset-0 w-full h-screen z-[45] select-none overflow-hidden pointer-events-none"
        id="interactive-easter-eggs"
      >
        <svg 
          viewBox="0 0 768 1376"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-[220vh] transition-transform duration-300 ease-out pointer-events-none"
          style={{ 
            transform: `translate3d(0, ${parallaxY}px, 0)`,
            willChange: "transform",
          }}
        >
          {/* Lightbulb - Top/Center Hotspot */}
          <a 
            href="https://www.thenation.com/article/archive/the-chicago-boys-in-chile-economic-freedoms-awful-toll/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer pointer-events-auto"
            style={{ pointerEvents: "auto" }}
          >
            <circle 
              cx="385" 
              cy="703" 
              r="40" 
              fill="rgba(0,0,0,0)" 
              stroke="none"
              strokeWidth="0"
              className="cursor-pointer"
            />
          </a>

          {/* Glass of Water - Hotspot */}
          <a 
            href="https://www.tni.org/es/node/9159" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer pointer-events-auto"
            style={{ pointerEvents: "auto" }}
          >
            <circle 
              cx="424" 
              cy="945" 
              r="25" 
              fill="rgba(0,0,0,0)" 
              stroke="none"
              strokeWidth="0"
              className="cursor-pointer"
            />
          </a>

          {/* Pen and Paper - Hotspot */}
          <a 
            href="https://nsarchive.gwu.edu/document/19608-national-security-archive-doc-1-letelier" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer pointer-events-auto"
            style={{ pointerEvents: "auto" }}
          >
            <circle 
              cx="467" 
              cy="1014" 
              r="25" 
              fill="rgba(0,0,0,0)" 
              stroke="none"
              strokeWidth="0"
              className="cursor-pointer"
            />
          </a>

          {/* Ashtray - Hotspot */}
          <a 
            href="https://www.youtube.com/watch?reload=9&v=KP9Aqf-NwbI" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer pointer-events-auto"
            style={{ pointerEvents: "auto" }}
          >
            <circle 
              cx="502" 
              cy="968" 
              r="25" 
              fill="rgba(0,0,0,0)" 
              stroke="none"
              strokeWidth="0"
              className="cursor-pointer"
            />
          </a>
        </svg>
      </div>

      {/* Low-profile Admin trigger button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50 opacity-40 hover:opacity-100 transition-opacity duration-300">
        <button
          id="admin-open-trigger-btn"
          onClick={() => setIsAdminOpen(true)}
          className={`p-2 rounded border bg-black/40 backdrop-blur-sm transition-all duration-300 cursor-pointer ${isNoirMode ? "border-stone-800 text-stone-500 hover:bg-stone-800/10" : "border-stone-700 text-stone-400 hover:text-[#c29f72] hover:bg-stone-800/20"}`}
          title="Open Administration Deck"
        >
          <Key size={14} />
        </button>
      </div>

      {/* Atmospheric Minimalist Header with Parallax Scrolling */}
      <header 
        className="w-full text-center pt-8 pb-4 z-40 relative select-none"
        style={{ 
          transform: `translate3d(0, ${scrollY * 0.25}px, 0)`,
          willChange: "transform"
        }}
      >
        <a 
          href="https://en.wikipedia.org/wiki/Assassination_of_Orlando_Letelier"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity"
        >
          <h1 
            className="font-portia-serif tracking-[0.3em] text-[11px] sm:text-[13px] font-normal text-[#c29f72] uppercase transition-colors duration-1000"
          >
            {currentView === "publications" ? "SELECTED PUBLICATIONS" : "The Letelier / Townley Novels"}
          </h1>
        </a>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col items-center justify-start z-30 py-8">
        {loading ? (
          <div className="text-center font-serif italic text-sm tracking-widest text-[#8C7A5B] animate-pulse pt-28">
            Unrolling archival scrolls...
          </div>
        ) : currentView === "publications" ? (
          <PublicationsList 
            publications={writerData.publications} 
            onBack={() => {
              setCurrentView("books");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} 
          />
        ) : currentView === "study" ? (
          <WritersStudy 
            isNoirMode={isNoirMode} 
            onToggleNoirMode={() => setIsNoirMode(!isNoirMode)} 
            onBack={() => {
              setCurrentView("books");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : (
          <div className="w-full flex flex-col items-center">
            <BookScroll
              books={writerData.books}
              scrollY={scrollY}
              merchantConfig={writerData.merchantConfig}
            />
          </div>
        )}
      </main>

      {/* Triggerable Modals */}
      {isAdminOpen && (
        <AdminPanel
          isOpen={true}
          onClose={() => setIsAdminOpen(false)}
          writerData={writerData}
          onSaveData={handleSaveData}
        />
      )}

      {/* Minimalist Editorial Footer with Copyright & CC License */}
      <footer className="w-full text-center pt-48 pb-4 z-30 relative select-none flex flex-col items-center justify-center gap-1.5 px-4 mt-auto" id="app-footer">
        {/* Consolidated Author & Copyright/License Block */}
        <div className="flex flex-col items-center gap-0.5 max-w-lg text-center font-serif" id="footer-consolidated-block">
          {/* Author Credit */}
          <button
            onClick={() => {
              setCurrentView("publications");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-sm font-medium text-[#c29f72]/80 hover:text-[#c29f72] transition-colors duration-300 underline underline-offset-4 cursor-pointer"
            id="author-credit"
          >
            Novels & Stories by David Serafino
          </button>

          {/* CC License Text (Three lines, centered, block text structure in an old-fashioned serif) */}
          <p className="text-xs leading-tight text-[#c29f72]/70 italic tracking-wide" id="cc-license-text">
            CC BY-NC-ND 4.0
          </p>

          {/* Some Rights Reserved in small caps */}
          <div 
            className="text-[10px] tracking-[0.15em] text-[#c29f72]/60" 
            style={{ fontVariant: "small-caps" }}
            id="some-rights-reserved"
          >
            Some Rights Reserved
          </div>
        </div>

        {/* CC Icon Group (Inline, vector, high-contrast, scalable) */}
        <a 
          href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center items-center hover:opacity-100 transition-opacity duration-300" 
          id="creative-commons-logo"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 120 30" 
            width="100" 
            height="25" 
            fill="none" 
            className="text-[#c29f72] opacity-60 hover:opacity-90 transition-opacity duration-300"
          >
            {/* Circle 1: CC */}
            <g transform="translate(0, 0)">
              <circle cx="15" cy="15" r="11" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M 18,11 A 5.5,5.5 0 0,0 12,15 A 5.5,5.5 0 0,0 18,19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M 23,11 A 5.5,5.5 0 0,0 17,15 A 5.5,5.5 0 0,0 23,19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </g>
            {/* Circle 2: BY (Attribution) */}
            <g transform="translate(30, 0)">
              <circle cx="15" cy="15" r="11" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="15" cy="10" r="2.2" fill="currentColor"/>
              <path d="M 11.5,15 C 11.5,13.5 18.5,13.5 18.5,15 L 17.5,19.5 L 16.2,19.5 L 16.2,24 L 13.8,24 L 13.8,19.5 L 12.5,19.5 Z" fill="currentColor"/>
            </g>
            {/* Circle 3: NC (Non-Commercial) */}
            <g transform="translate(60, 0)">
              <circle cx="15" cy="15" r="11" stroke="currentColor" strokeWidth="1.8"/>
              {/* Dollar sign symbol inside */}
              <path d="M 15,6 L 15,24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M 17.5,10 C 17.5,8 12.5,8 12.5,11 C 12.5,14 17.5,15 17.5,18 C 17.5,21 12.5,21 12.5,19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              {/* Circle-strikethrough diagonal line from bottom-left to top-right */}
              <line x1="7.2" y1="22.8" x2="22.8" y2="7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </g>
            {/* Circle 4: ND (NoDerivatives - Equals Sign) */}
            <g transform="translate(90, 0)">
              <circle cx="15" cy="15" r="11" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="10" y1="13" x2="20" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="10" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </g>
          </svg>
        </a>
      </footer>
    </div>
  );
}
