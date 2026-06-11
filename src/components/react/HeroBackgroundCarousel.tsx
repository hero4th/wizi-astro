import { useState, useEffect, useRef } from "react";

const originalImages = [
  "/images/bg-hero-1.webp",
  "/images/bg-hero-2.webp",
  "/images/bg-hero-3.webp",
  "/images/bg-hero-4.webp",
];

// Append first image to end for infinite slide loop
const slides = [...originalImages, originalImages[0]];



export default function HeroBackgroundCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // start timer
    const startTimer = () => {
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
      }, 5000);
    };

    startTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  const handleTransitionEnd = () => {
    if (currentIndex === slides.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-ink-950 pointer-events-none">
      <div
        className="flex h-full w-full"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning
            ? "transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)"
            : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="h-full w-full shrink-0 relative overflow-hidden"
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                transform: idx === currentIndex ? "translateZ(0) scale(1.04)" : "translateZ(0) scale(1)",
                transition: "transform 7s ease-out",
                willChange: "transform",
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased"
              }}
            />
          </div>
        ))}
      </div>

      {/* Overlays aún más claros para maximizar el brillo de la foto */}
      <div className="absolute inset-0 z-10 bg-ink-950/10 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-ink-950/50 via-ink-950/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
