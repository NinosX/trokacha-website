"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Screenshot {
  src: string;
  alt: string;
}

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
  autoPlay?: boolean;
  interval?: number;
}

export function ScreenshotCarousel({
  screenshots,
  autoPlay = true,
  interval = 4000,
}: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      handleNext();
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlay, interval]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % screenshots.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone mockup with screenshot */}
      <div className="relative w-full aspect-[9/19.5] animate-fade-in-up">
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Screenshot */}
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <Image
                src={screenshots[currentIndex].src}
                alt={screenshots[currentIndex].alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
                priority={currentIndex === 0}
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label="Next screenshot"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Dots indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {screenshots.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to screenshot ${idx + 1}`}
          />
        ))}
      </div>

      {/* Screenshot caption */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {screenshots[currentIndex].alt}
        </p>
      </div>
    </div>
  );
}
