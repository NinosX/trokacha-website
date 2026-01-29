"use client";

import { useState, useEffect } from "react";

interface Category {
  icon: string;
  key: string;
  label: string;
}

interface TypewriterCategoriesProps {
  categories: Category[];
  prefix?: string;
  typingSpeed?: number;
  pauseDuration?: number;
  size?: "default" | "small";
}

export function TypewriterCategories({
  categories,
  prefix = "",
  typingSpeed = 50,
  pauseDuration = 1000,
  size = "default",
}: TypewriterCategoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentCategory = categories[currentIndex];

  useEffect(() => {
    const fullText = currentCategory.label;

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing
        if (displayedText.length < fullText.length) {
          setDisplayedText(fullText.slice(0, displayedText.length + 1));
        } else {
          // Pause at full text
          setTimeout(() => setIsDeleting(true), pauseDuration);
          return;
        }
      } else {
        // Deleting
        if (displayedText.length > 0) {
          setDisplayedText(fullText.slice(0, displayedText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % categories.length);
          return;
        }
      }
    };

    const speed = isDeleting ? typingSpeed / 2 : typingSpeed;
    const timer = setTimeout(handleTyping, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentCategory.label, categories.length, typingSpeed, pauseDuration]);

  const isSmall = size === "small";

  return (
    <div className={`flex items-center gap-3 font-medium ${isSmall ? "text-base" : "text-xl md:text-2xl"}`}>
      {prefix && <span className="text-white/80">{prefix}</span>}
      <span 
        className={`inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full transition-all duration-300 ${isSmall ? "px-3 py-1.5" : "px-4 py-2"}`}
      >
        <span className={`transition-transform duration-300 ${isSmall ? "text-xl" : "text-2xl md:text-3xl"}`}>
          {currentCategory.icon}
        </span>
        <span className={`text-white font-semibold ${isSmall ? "min-w-[80px]" : "min-w-[100px]"}`}>
          {displayedText}
          <span className="animate-pulse">|</span>
        </span>
      </span>
    </div>
  );
}
