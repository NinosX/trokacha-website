"use client";

import { useRef, useEffect, useState } from "react";

interface Step {
  number: number;
  icon: string;
  timestamp: number; // en secondes
}

interface VideoPhoneProps {
  src: string;
  steps?: Step[];
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

export function VideoPhone({
  src,
  steps,
  onStepChange,
  className = "",
}: VideoPhoneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Sync video with steps
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !steps || steps.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      // Trouver l'étape correspondante
      let newStep = 0;
      for (let i = steps.length - 1; i >= 0; i--) {
        if (currentTime >= steps[i].timestamp) {
          newStep = i;
          break;
        }
      }
      if (newStep !== currentStep) {
        setCurrentStep(newStep);
        onStepChange?.(newStep);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [steps, currentStep, onStepChange]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Phone mockup */}
      <div 
        className="relative animate-fade-in-up" 
        style={{ width: '270px', height: '585px' }}
      >
        {/* Phone frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-[6px]">
          {/* Notch */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
          
          {/* Screen */}
          <div className="w-full h-full bg-black rounded-[2.7rem] overflow-hidden relative">
            <video
              ref={videoRef}
              src={src}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </div>
    </div>
  );
}
