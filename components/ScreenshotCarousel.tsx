"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Screenshot = string | { src: string; alt?: string };

interface ScreenshotCarouselProps {
  screenshots?: Screenshot[];
  autoPlayInterval?: number;
  // Legacy props for backward compatibility
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

// Helper to normalize screenshot format
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
}: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use autoPlayInterval if provided, otherwise fall back to interval
  const effectiveInterval = autoPlayInterval ?? interval;
  const isAutoPlayEnabled = autoPlay;

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % screenshots.length);
  }, [currentIndex, screenshots.length, goToSlide]);

  const goToPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + screenshots.length) % screenshots.length);
  }, [currentIndex, screenshots.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (isPaused || !isAutoPlayEnabled) return;
    const timer = setInterval(goToNext, effectiveInterval);
    return () => clearInterval(timer);
  }, [isPaused, isAutoPlayEnabled, goToNext, effectiveInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  return (
    <div
      className={`relative w-full h-[600px] flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Phone mockup */}
      <div className="relative w-[280px] sm:w-[320px] h-[560px] sm:h-[600px] animate-fade-in-up">
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-2 sm:p-3">
          {/* Notch */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
          
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Screenshots */}
            <div className="relative w-full h-full">
              {screenshots.map((screenshot, index) => (
                <div
                  key={getScreenshotSrc(screenshot)}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    index === currentIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95"
                  }`}
                >
                  <Image
                    src={getScreenshotSrc(screenshot)}
                    alt={getScreenshotAlt(screenshot, index)}
                    fill
                    className="object-cover object-top"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating emojis */}
        <div className="absolute -top-8 -right-8 text-5xl sm:text-6xl animate-float hidden sm:block">
          ✨
        </div>
        <div className="absolute -bottom-8 -left-8 text-5xl sm:text-6xl animate-float-reverse hidden sm:block">
          💫
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Previous screenshot"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Next screenshot"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white/60 transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / screenshots.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
