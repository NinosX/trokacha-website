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
}: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveInterval = autoPlayInterval ?? interval;

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, [screenshots.length]);

  // Auto-play avec useRef pour éviter les problèmes de closure
  useEffect(() => {
    if (!autoPlay || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    }, effectiveInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoPlay, isPaused, effectiveInterval, screenshots.length]);

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
      className={`relative w-full h-[560px] flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Phone mockup */}
      <div className="relative w-[260px] sm:w-[290px] h-[520px] sm:h-[580px] animate-fade-in-up">
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2.5rem] shadow-2xl p-2">
          {/* Notch */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />
          
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
            {/* Screenshots */}
            <div className="relative w-full h-full">
              {screenshots.map((screenshot, index) => (
                <div
                  key={getScreenshotSrc(screenshot)}
                  className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={getScreenshotSrc(screenshot)}
                    alt={getScreenshotAlt(screenshot, index)}
                    fill
                    className="object-contain"
                    priority={index === 0}
                    sizes="290px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating emojis */}
        <div className="absolute -top-6 -right-6 text-4xl sm:text-5xl animate-float hidden sm:block">
          ✨
        </div>
        <div className="absolute -bottom-6 -left-6 text-4xl sm:text-5xl animate-float-reverse hidden sm:block">
          💫
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Previous screenshot"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Next screenshot"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to screenshot ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
