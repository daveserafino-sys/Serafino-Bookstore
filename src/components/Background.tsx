interface BackgroundProps {
  isNoirMode?: boolean;
  scrollY?: number;
  viewportHeight?: number;
}

export default function Background({ isNoirMode = true, scrollY = 0, viewportHeight = 800 }: BackgroundProps) {
  // Parallax translation for the background image
  // It translates upwards as the user scrolls, pulling the desk into view.
  const maxTranslation = viewportHeight * 1.2;
  const parallaxY = -Math.min(scrollY * 0.6, maxTranslation); 

  return (
    <div className="fixed inset-0 w-full h-screen z-0 select-none overflow-hidden bg-[#0a0f16]">
      {/* Main atmospheric image - premium old, washed-out silver halide movie still with the light cord, lightbulb, and desk */}
      <img 
        src="/noir_empty_chamber.jpg"
        alt="Noir Interrogation Scene"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-[220vh] object-cover transition-transform duration-300 ease-out"
        style={{ 
          filter: "grayscale(100%) contrast(112%) brightness(82%) sepia(10%) blur(1.5px)",
          opacity: isNoirMode ? 0.85 : 0.95,
          transform: `translate3d(0, ${parallaxY}px, 0)`,
          willChange: "transform"
        }}
      />

      {/* Hand-colored halogen lightbulb highlight using pixel-perfect SVG projection matching the image's coordinate space */}
      <svg 
        viewBox="0 0 768 1376"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-[220vh] pointer-events-none transition-transform duration-300 ease-out z-10"
        style={{ 
          transform: `translate3d(0, ${parallaxY}px, 0)`,
          willChange: "transform"
        }}
      >
        <defs>
          {/* Professional SVG Blur to completely feather and bloom the light, preventing any artificial digital lines */}
          <filter id="halogen-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>

          {/* Halogen color tint gradient - rich hand-applied vintage warm amber/orange dye for higher contrast */}
          <radialGradient id="halogen-tint" cx="385" cy="703" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffa726" stopOpacity="0.58" />
            <stop offset="45%" stopColor="#ff9100" stopOpacity="0.32" />
            <stop offset="85%" stopColor="#ff6d00" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ff6d00" stopOpacity="0" />
          </radialGradient>

          {/* Warm, soft luminous atmospheric ambient glow over the bulb glass */}
          <radialGradient id="halogen-glow" cx="385" cy="703" r="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff3e0" stopOpacity="0.38" />
            <stop offset="50%" stopColor="#ffe082" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffe082" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft dye overlay to tint the film grain organically */}
        <circle 
          cx="385" 
          cy="703" 
          r="25" 
          fill="url(#halogen-tint)" 
          filter="url(#halogen-blur)"
          style={{ mixBlendMode: "color" }} 
        />

        {/* Delicate glow bloom with screen blend mode to simulate real glass luminescence with muted contrast */}
        <circle 
          cx="385" 
          cy="703" 
          r="38" 
          fill="url(#halogen-glow)" 
          filter="url(#halogen-blur)"
          style={{ mixBlendMode: "screen" }} 
        />
      </svg>

      {/* Soft Vignette Overlay: Fades to a cool silvery/blue-gray at the edges to mimic a vintage photograph with natural lens vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_88%,rgba(28,36,48,0.3)_95%,rgba(32,42,54,0.6)_100%)] z-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[rgba(32,42,54,0.04)] via-transparent to-[rgba(24,32,44,0.35)] z-10" />
    </div>
  );
}
