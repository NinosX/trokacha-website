"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Screenshot = string | { src: string; alt?: string };

interface ScreenshotCarouselProps {
  screenshots?: Screenshot[];
  autoPlayInterval?: number;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  size?: "default" | "compact";
}

function getScreenshotSrc(screenshot: Screenshot): string {
  return typeof screenshot === "string" ? screenshot : screenshot.src;
}

function getScreenshotAlt(screenshot: Screenshot, index: number): string {
  if (typeof screenshot === "string") {
    return `Screenshot ${index + 1}`;
  }
  return screenshot.alt || `Screenshot ${index + 1}`;
}

export function ScreenshotCarousel({
  screenshots = [
    "/screenshots/1.png",
    "/screenshots/2.png",
    "/screenshots/3.png",
    "/screenshots/4.png",
    "/screenshots/5.png",
  ],
  autoPlayInterval,
  autoPlay = true,
  interval = 4000,
  className = "",
  size = "default",
}: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const effectiveInterval = autoPlayInterval ?? interval;
  
  // Tailles selon le mode
  const isCompact = size === "compact" || className.includes("h-[400px]");
  const phoneWidth = isCompact ? 180 : 270;
  const phoneHeight = isCompact ? 390 : 585;

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  // Auto-play - toujours actif, loop infini
  useEffect(() => {
    if (!autoPlay) return;

    const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % screenshots.length);
      }, effectiveInterval);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, effectiveInterval, screenshots.length]);

  // Keyboard navigation (seulement pour desktop)
  useEffect(() => {
    if (isCompact) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, isCompact]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      goToNext();
    } else if (diff < -threshold) {
      goToPrev();
    }
  };

  return (
    <div
      className={`relative w-full flex items-center justify-center ${className}`}
      style={{ height: isCompact ? 'auto' : '600px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Phone mockup - ratio 9:19.5 comme iPhone */}
      <div 
        className="relative animate-fade-in-up" 
        style={{ width: `${phoneWidth}px`, height: `${phoneHeight}px` }}
      >
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-[4px] sm:p-[6px]">
          {/* Notch */}
          <div className={`absolute ${isCompact ? 'top-2 w-16 h-4' : 'top-3 w-24 h-6'} left-1/2 transform -translate-x-1/2 bg-black rounded-full z-20`} />
          
          {/* Screen - même ratio que les screenshots */}
          <div className="w-full h-full bg-black rounded-[1.7rem] sm:rounded-[2.7rem] overflow-hidden relative">
            {/* Screenshots */}
            {screenshots.map((screenshot, index) => (
              <div
                key={getScreenshotSrc(screenshot)}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <Image
                  src={getScreenshotSrc(screenshot)}
                  alt={getScreenshotAlt(screenshot, index)}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes={`${phoneWidth}px`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows - cachés en mode compact */}
      {!isCompact && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className={`absolute ${isCompact ? '-bottom-6' : 'bottom-2'} left-0 right-0 flex justify-center gap-1.5 sm:gap-2`}>
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? `${isCompact ? 'w-4 h-1.5' : 'w-6 h-2'} bg-white`
                : `${isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-white/40 hover:bg-white/60`
            }`}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
