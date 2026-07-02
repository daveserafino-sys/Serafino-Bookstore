import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Sparkles, Volume2, VolumeX, Flame } from "lucide-react";

interface WritersStudyProps {
  onToggleNoirMode: () => void;
  isNoirMode: boolean;
  onBack?: () => void;
}

// Pure Web Audio Synth for Typewriter Sound Effects (no external files needed!)
class TypewriterSound {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy loaded on first user interaction
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("AudioContext not supported", e);
      }
    }
  }

  playKeyClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (browser security policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // Low mechanical wood/plastic thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.06);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    // High metal dynamic snap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1600 + Math.random() * 300, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    
    gain2.gain.setValueAtTime(0.06, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    // Connect and play
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
    osc2.start(now);
    osc2.stop(now + 0.03);
  }

  playCarriageBell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Clear ringing antique brass chime
    osc.type = "sine";
    osc.frequency.setValueAtTime(2150, now);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playCarriageReturn() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Slide mechanical sound
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.25);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

const audioInstance = new TypewriterSound();

export default function WritersStudy({ onToggleNoirMode, isNoirMode, onBack }: WritersStudyProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  const typewriterEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync sound status
  useEffect(() => {
    audioInstance.enabled = soundOn;
  }, [soundOn]);

  // Handle custom code unlocking
  useEffect(() => {
    const checkText = typedText.toLowerCase();
    if (checkText.includes("townley76") && !isUnlocked) {
      setIsUnlocked(true);
      audioInstance.playCarriageBell();
      triggerAlert("Declassified Telegram Decrypted.");
    }
  }, [typedText, isUnlocked]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.toLowerCase().trim() === "townley76") {
      setIsUnlocked(true);
      audioInstance.playCarriageBell();
      triggerAlert("Declassified Telegram Decrypted.");
    } else {
      triggerAlert("Passcode rejected. Document remains locked.");
    }
  };

  const triggerAlert = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Keyboard typing interception
  const handleTypewriterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const diff = val.length - typedText.length;
    
    if (diff > 0) {
      // Key pressed
      const lastChar = val.charAt(val.length - 1);
      if (lastChar === "\n") {
        audioInstance.playCarriageReturn();
      } else {
        audioInstance.playKeyClick();
      }
    }
    
    setTypedText(val);
    
    // Auto scroll typing paper
    setTimeout(() => {
      if (typewriterEndRef.current) {
        typewriterEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const clearTypewriter = () => {
    audioInstance.playCarriageReturn();
    setTypedText("");
  };

  const handleVirtualKeyClick = (char: string) => {
    audioInstance.playKeyClick();
    if (char === "SPACE") {
      setTypedText(prev => prev + " ");
    } else if (char === "RETURN") {
      audioInstance.playCarriageReturn();
      setTypedText(prev => prev + "\n");
    } else {
      setTypedText(prev => prev + char.toLowerCase());
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto px-6 py-4 select-none font-sans pb-32">
      {/* Return Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-10 font-mono text-[10px] tracking-[0.2em] text-[#8C7A5B] hover:text-[#5E4E35] transition-colors cursor-pointer flex items-center gap-1.5 uppercase self-start"
        >
          <span>← return to manuscripts</span>
        </button>
      )}

      {/* Immersive Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#23211E] text-[#FAF8F5] border border-[#8C7A5B]/50 px-6 py-3 shadow-2xl font-mono text-xs tracking-wider flex items-center gap-3"
          >
            <Sparkles size={14} className="text-[#8C7A5B] animate-pulse" />
            <span>{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Title */}
      <div className="flex flex-col items-center mb-10 text-center">
        <span className="font-serif italic text-xs tracking-wider text-[#8C7A5B] font-light">The Creative Space</span>
        <div className="h-[1px] w-12 bg-[#8C7A5B]/30 my-3" />
        <h3 className="font-portia-serif tracking-[0.18em] text-[13px] text-[#e2e7ec] uppercase font-normal">
          Inside the Writer's Study
        </h3>
      </div>

      {/* Grid Layout: Polaroid Left, Typewriter Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
        
        {/* LEFT COLUMN: INTERACTIVE POLAROID PHOTO (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="perspective-1000 w-[280px] h-[350px]">
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative w-full h-full transform-style-3d cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* POLAROID FRONT */}
              <div className="absolute inset-0 w-full h-full bg-[#FAF8F5] border-2 border-stone-200 shadow-xl rounded-sm p-4 flex flex-col items-center backface-hidden justify-between">
                <div className="w-full h-[240px] bg-stone-900 overflow-hidden relative border border-stone-200/50">
                  <img
                    src="/src/assets/images/film_noir_room_1782657430302.jpg"
                    alt="Writer's Study"
                    className="w-full h-full object-cover filter sepia contrast-125 saturate-50 hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
                <div className="w-full text-center font-serif italic text-stone-600 text-sm tracking-wide mt-3 select-none">
                  "David's study — Rome, October 1976"
                </div>
                <div className="text-[9px] font-mono uppercase text-[#8C7A5B]/60 tracking-widest mt-1">
                  [ Click to Flip ]
                </div>
              </div>

              {/* POLAROID BACK */}
              <div className="absolute inset-0 w-full h-full bg-[#EFECE6] border-2 border-stone-300 shadow-xl rounded-sm p-6 flex flex-col justify-between items-center backface-hidden rotateY-180 text-[#23211E]">
                <div className="flex flex-col items-center w-full h-full justify-center text-center space-y-4 font-serif">
                  <div className="w-10 h-10 border border-double border-[#8C7A5B]/30 rounded-full flex items-center justify-center text-xs italic font-semibold text-[#8C7A5B]/80 mb-2">
                    DS
                  </div>
                  <p className="text-sm italic font-light text-stone-700 leading-relaxed font-serif tracking-wide max-w-[210px] select-text">
                    "The Rome manuscript is complete. But the shadow of Orlando Letelier's death still hangs over these heavy metal keys."
                  </p>
                  <p className="text-[11px] font-mono tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-800/20 px-3 py-1 mt-2">
                    code: townley76
                  </p>
                </div>
                <div className="text-[9px] font-mono uppercase text-stone-400 tracking-widest">
                  [ Click to Return ]
                </div>
              </div>
            </motion.div>
          </div>

          <p className="text-xs text-[#625E57] font-light leading-relaxed text-center max-w-[280px]">
            A snapshot of David's workspace in Rome. Examine the photo closely. There are secrets inscribed on the back for those willing to decrypt them.
          </p>

          {/* Interactive Study Controls */}
          <div className="w-full max-w-[280px] bg-[#F1EDE6] border border-[#8C7A5B]/20 p-4 rounded flex flex-col gap-3">
            <h4 className="font-mono text-[9px] tracking-widest uppercase text-[#8C7A5B] font-bold border-b border-[#8C7A5B]/10 pb-1.5">
              Study Controls
            </h4>
            
            {/* Noir Mode Trigger */}
            <div className="flex items-center justify-between text-xs text-[#23211E]">
              <span className="font-serif italic text-[#625E57]">Noir Mode</span>
              <button
                onClick={onToggleNoirMode}
                className={`px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase border transition-all ${isNoirMode ? "bg-[#23211E] text-[#FAF8F5] border-[#23211E]" : "bg-[#FAF8F5] text-stone-700 border-stone-300 hover:border-stone-500"}`}
              >
                {isNoirMode ? "ON (Dark)" : "OFF (Light)"}
              </button>
            </div>

            {/* Audio Toggle */}
            <div className="flex items-center justify-between text-xs text-[#23211E]">
              <span className="font-serif italic text-[#625E57]">Typewriter Sound</span>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className="p-1.5 text-[#8C7A5B] hover:text-[#5E4E35] transition-colors rounded-full hover:bg-stone-200/50"
                title={soundOn ? "Mute sounds" : "Enable sounds"}
              >
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MECHANICAL TYPEWRITER INTERFACE (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Typewriter Roller Paper Container */}
          <div className="w-full bg-[#FCFAF7] border-4 border-double border-stone-300 rounded shadow-lg overflow-hidden flex flex-col h-[320px] relative">
            <div className="w-full bg-stone-100 border-b border-stone-200 h-6 flex items-center justify-between px-3 text-[9px] font-mono text-stone-500 uppercase select-none">
              <span>Remington Portable roller paper</span>
              <span className="flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                READY
              </span>
            </div>

            {/* Roll of Paper */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-stone-800 leading-relaxed bg-paper bg-gradient-to-b from-[#FAF8F5] to-white relative">
              {/* Typewriter Ribbon Lines styling */}
              <div className="absolute inset-0 border-r border-red-900/10 pointer-events-none" style={{ left: '40px' }} />
              
              <textarea
                ref={inputRef}
                value={typedText}
                onChange={handleTypewriterChange}
                placeholder="Type here using your keyboard to compose..."
                className="w-full h-full bg-transparent resize-none border-none outline-none font-mono text-stone-800 placeholder-stone-400 select-text relative z-10 leading-6 tracking-wide"
                style={{ fontFamily: '"Courier New", Courier, monospace', outline: 'none' }}
              />
              <div ref={typewriterEndRef} />
            </div>

            {/* Clear Lever */}
            <button
              onClick={clearTypewriter}
              className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-[#FAF8F5] hover:bg-stone-100 border border-stone-300 text-stone-600 hover:text-stone-800 text-[9px] font-mono tracking-widest uppercase transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              title="Pull Carriage Return Line Feed"
            >
              <span>[ Pull Carriage ]</span>
            </button>
          </div>

          {/* Virtual Keypad (for mobile and tablet touch convenience) */}
          <div className="w-full bg-[#EAE5DC] border border-[#8C7A5B]/20 p-4 rounded shadow-md select-none">
            <div className="text-center font-mono text-[9px] tracking-widest uppercase text-stone-500 mb-3 border-b border-[#8C7A5B]/10 pb-1.5">
              Virtual Heavy-Metal Typewriter Keys
            </div>
            
            <div className="grid grid-cols-10 gap-1.5">
              {/* QWERTY Row 1 */}
              {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map(k => (
                <button
                  key={k}
                  onClick={() => handleVirtualKeyClick(k)}
                  className="h-8 bg-stone-100 hover:bg-stone-50 active:bg-stone-200 border border-stone-400 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow text-stone-800 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
              {/* Row 2 */}
              <div className="col-span-1" />
              {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map(k => (
                <button
                  key={k}
                  onClick={() => handleVirtualKeyClick(k)}
                  className="h-8 bg-stone-100 hover:bg-stone-50 active:bg-stone-200 border border-stone-400 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow text-stone-800 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
              <div className="col-span-1" />
              {/* Row 3 */}
              <div className="col-span-1" />
              {["Z", "X", "C", "V", "B", "N", "M"].map(k => (
                <button
                  key={k}
                  onClick={() => handleVirtualKeyClick(k)}
                  className="h-8 bg-stone-100 hover:bg-stone-50 active:bg-stone-200 border border-stone-400 rounded-full flex items-center justify-center font-mono text-xs font-bold shadow text-stone-800 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleVirtualKeyClick("RETURN")}
                className="col-span-2 h-8 bg-stone-300 hover:bg-stone-200 border border-stone-500 rounded flex items-center justify-center font-mono text-[10px] tracking-wide font-bold shadow text-stone-800 active:translate-y-0.5 transition-all cursor-pointer"
              >
                RETURN
              </button>
              {/* Row 4 (Space) */}
              <div className="col-span-3" />
              <button
                onClick={() => handleVirtualKeyClick("SPACE")}
                className="col-span-4 h-8 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-900 rounded-full flex items-center justify-center font-mono text-[10px] tracking-widest font-bold shadow active:translate-y-0.5 transition-all cursor-pointer"
              >
                SPACE BAR
              </button>
              <div className="col-span-3" />
            </div>
          </div>

          {/* Passcode Unlock Desk Diary */}
          <div className="w-full bg-[#FAF8F5] border border-stone-200 rounded p-5 shadow-sm text-[#23211E]">
            <h4 className="font-serif italic text-sm text-[#8C7A5B] mb-2 font-medium">Declassification Decoder</h4>
            <p className="text-xs text-[#625E57] mb-4 font-light leading-relaxed">
              If you have deciphered the code from the Polaroid's handwritten back, enter it here to decrypt David's restricted Rome dossier immediately.
            </p>

            <form onSubmit={handlePasscodeSubmit} className="flex gap-3">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter 9-character code..."
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded text-xs focus:outline-none focus:border-[#8C7A5B] font-mono tracking-widest text-center"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#8C7A5B] hover:bg-[#5E4E35] text-[#FAF8F5] font-mono text-[10px] tracking-widest uppercase transition-all duration-300 cursor-pointer"
              >
                Decrypt
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* SECRET MANUSCRIPT REVEAL */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="w-full mt-16 border-t-2 border-double border-[#8C7A5B]/30 pt-16 flex flex-col items-center select-text"
          >
            {/* Ink Stamp */}
            <div className="relative border-2 border-red-800/40 text-red-800 font-mono text-[10px] tracking-[0.25em] font-semibold px-4 py-1.5 uppercase rotate-[-3deg] select-none rounded-sm bg-red-50/20 mb-8 max-w-max self-center">
              ▲ Restricted Archives — Declassified 2026
            </div>

            {/* Document Content */}
            <div className="w-full max-w-xl bg-[#FAF8F5] border border-stone-300/60 p-10 md:p-14 shadow-2xl relative font-mono text-xs sm:text-[13px] text-[#23211E] leading-6 tracking-wide space-y-8 select-text">
              {/* Header declassified logs */}
              <div className="border-b border-stone-200 pb-4 text-[10px] text-stone-500 font-mono tracking-wider space-y-1 select-none">
                <p>DOSSIER REFERENCE: LETELIER / TOWNLEY CLASSIFIED INTERCEPT</p>
                <p>LOCATION CORRESPONDENCE: ROME STATION / SANTIAGO OUTPOST</p>
                <p>DATE RESOLVED: OCTOBER 12, 1976 [DECL. JUNE 2026]</p>
              </div>

              {/* Telegram Body */}
              <div className="space-y-6" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                <p className="font-bold text-center border border-dashed border-stone-300 py-2 my-4 select-none">
                  [ TELEX DECRYPTION SECURED ]
                </p>

                <p>ROME — OCT 12, 1976</p>

                <p>THE SEWING MACHINE HAS BEEN DELIVERED TO THE DIPLOMAT'S QUARTERS. TOWNLEY CONFIRMS THE CONDUIT IS SECURED. THE EMBASSY IN SANTIAGO REMAINS SILENT ON THE LETELIER INCIDENT, BUT THE FOG IN CAPRI IS CLEARING.</p>

                <p>KEEP THE SALTWATER ARCHIVES DRIED. IF CONFRONTED IN MILITARY COURT, RECALL THE HUNDRED AND EIGHTY-SECOND READER. THE BOOKS ARE NOT REAL, BUT THE SHELVES ARE WATCHING.</p>

                <p>— SERAFINO</p>
              </div>

              {/* Divider lines */}
              <div className="border-t border-stone-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-500 gap-4 select-none">
                <span>SYSTEM LEVEL: VERIFIED</span>
                
                <button
                  onClick={() => {
                    const blob = new Blob([
                      "ROME — OCT 12, 1976\n\nTHE SEWING MACHINE HAS BEEN DELIVERED TO THE DIPLOMAT'S QUARTERS.\nTOWNLEY CONFIRMS THE CONDUIT IS SECURED. THE EMBASSY IN SANTIAGO\nREMAINS SILENT ON THE LETELIER INCIDENT, BUT THE FOG IN CAPRI IS\nCLEARING.\n\nKEEP THE SALTWATER ARCHIVES DRIED.\nIF CONFRONTED IN MILITARY COURT, RECALL THE HUNDRED AND EIGHTY-SECOND READER.\n\n— SERAFINO"
                    ], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "david_serafino_rome_intercept_1976.txt";
                    a.click();
                    triggerAlert("Dossier downloaded as TXT.");
                  }}
                  className="px-2.5 py-1 text-[9px] font-mono tracking-widest text-stone-700 hover:text-stone-900 transition-all border border-stone-300 rounded-none uppercase cursor-pointer flex items-center gap-1.5 bg-[#FAF8F5]"
                >
                  <Download size={10} />
                  <span>Download File (.txt)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
