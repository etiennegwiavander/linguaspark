"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export type MascotAnimationType = 'idle' | 'reading' | 'thinking' | 'success' | 'error';

interface AnimatedMascotProps {
  animation: MascotAnimationType;
  size?: number;
  className?: string;
  imagePath?: string;
}

export function AnimatedMascot({ 
  animation, 
  size = 120, 
  className = "",
  imagePath = "/mascot.png" // Your PNG path
}: AnimatedMascotProps) {
  const [blinkPhase, setBlinkPhase] = useState<'open' | 'closing' | 'closed' | 'opening'>('open');

  // Enhanced blinking logic with smooth phases
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout;
    
    const performBlink = (duration: number) => {
      const closeDuration = duration * 0.3;
      const holdDuration = duration * 0.2;
      const openDuration = duration * 0.3;
      
      setBlinkPhase('closing');
      setTimeout(() => setBlinkPhase('closed'), closeDuration);
      setTimeout(() => setBlinkPhase('opening'), closeDuration + holdDuration);
      setTimeout(() => setBlinkPhase('open'), closeDuration + holdDuration + openDuration);
    };
    
    switch (animation) {
      case 'idle':
        blinkInterval = setInterval(() => {
          performBlink(150);
        }, 3000 + Math.random() * 2000); // Random blink every 3-5 seconds
        break;
        
      case 'reading':
        blinkInterval = setInterval(() => {
          performBlink(200);
        }, 4000); // Slower, focused blinks
        break;
        
      case 'thinking':
        blinkInterval = setInterval(() => {
          performBlink(180);
        }, 2000); // More frequent when thinking
        break;
        
      case 'success':
        // Quick double blink for celebration
        performBlink(100);
        setTimeout(() => performBlink(100), 300);
        break;
        
      case 'error':
        // Longer blink for concern
        performBlink(300);
        break;
    }

    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [animation]);

  // Animation classes based on state
  const getAnimationClass = () => {
    switch (animation) {
      case 'idle':
        return 'animate-float-gentle';
      case 'reading':
        return 'animate-float-gentle animate-tilt-reading';
      case 'thinking':
        return 'animate-float-thinking';
      case 'success':
        return 'animate-bounce-success';
      case 'error':
        return 'animate-sway-concern';
      default:
        return '';
    }
  };

  const getGlowClass = () => {
    switch (animation) {
      case 'success':
        return 'drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]';
      case 'error':
        return 'drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'thinking':
        return 'drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]';
      default:
        return 'drop-shadow-lg';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Hidden description for screen readers */}
      <div className="sr-only">
        Mascot is currently {animation}
      </div>

      {/* Main mascot image with animations */}
      <div className={`relative w-full h-full ${getAnimationClass()} ${getGlowClass()}`}>
        <Image
          src={imagePath}
          alt="LinguaSpark mascot"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
        
        {/* Enhanced eye blink overlay with smooth animation phases */}
        {blinkPhase !== 'open' && (
          <div className="absolute inset-0">
            {/* Left eye blink with smooth transitions */}
            <div 
              className="absolute bg-[#2d2d2d] rounded-full transition-all duration-75 ease-in-out"
              style={{
                width: '10%',
                height: blinkPhase === 'closing' ? '1.5%' : blinkPhase === 'closed' ? '0.5%' : '1.5%',
                left: '39.5%',
                top: blinkPhase === 'closing' ? '23.2%' : blinkPhase === 'closed' ? '23.5%' : '23.2%',
                opacity: blinkPhase === 'opening' ? 0.7 : 1,
              }}
            />
            {/* Right eye blink with smooth transitions */}
            <div 
              className="absolute bg-[#2d2d2d] rounded-full transition-all duration-75 ease-in-out"
              style={{
                width: '10%',
                height: blinkPhase === 'closing' ? '1.5%' : blinkPhase === 'closed' ? '0.5%' : '1.5%',
                left: '50.5%',
                top: blinkPhase === 'closing' ? '23.2%' : blinkPhase === 'closed' ? '23.5%' : '23.2%',
                opacity: blinkPhase === 'opening' ? 0.7 : 1,
              }}
            />
          </div>
        )}

        {/* Reading indicator - subtle page flip animation */}
        {animation === 'reading' && (
          <div className="absolute bottom-[30%] right-[25%] animate-page-flip">
            <div className="w-2 h-3 bg-white/20 rounded-sm" />
          </div>
        )}

        {/* Thinking indicator - small thought bubble */}
        {animation === 'thinking' && (
          <div className="absolute top-[15%] right-[10%] animate-float-bubble">
            <div className="flex flex-col items-end gap-1">
              <div className="w-1 h-1 bg-blue-400/60 rounded-full" />
              <div className="w-1.5 h-1.5 bg-blue-400/70 rounded-full" />
              <div className="w-2 h-2 bg-blue-400/80 rounded-full" />
            </div>
          </div>
        )}

        {/* Success sparkles */}
        {animation === 'success' && (
          <>
            <div className="absolute top-[10%] left-[15%] animate-sparkle-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <div className="absolute top-[20%] right-[15%] animate-sparkle-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            </div>
            <div className="absolute bottom-[25%] left-[10%] animate-sparkle-3">
              <div className="w-1 h-1 bg-green-300 rounded-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Demo component to test all states
export function AnimatedMascotDemo() {
  const [currentAnimation, setCurrentAnimation] = useState<MascotAnimationType>('idle');
  const [size, setSize] = useState(120);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Animated Mascot Demo
        </h1>
        <p className="text-slate-600 mb-8">
          Testing subtle animations with your PNG mascot
        </p>

        {/* Main demo area */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-8">
          <div className="flex justify-center items-center min-h-[200px]">
            <AnimatedMascot 
              animation={currentAnimation}
              size={size}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Animation State
          </h2>
          <div className="flex flex-wrap gap-3">
            {(['idle', 'reading', 'thinking', 'success', 'error'] as MascotAnimationType[]).map((anim) => (
              <button
                key={anim}
                onClick={() => setCurrentAnimation(anim)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentAnimation === anim
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {anim.charAt(0).toUpperCase() + anim.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Size control */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Size: {size}px
          </h2>
          <input
            type="range"
            min="60"
            max="200"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Animation descriptions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Animation Details
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div><strong>Idle:</strong> Gentle floating with natural blinking (every 3-5 seconds)</div>
            <div><strong>Reading:</strong> Focused state with slower blinks and subtle tilt</div>
            <div><strong>Thinking:</strong> Slight sway with thought bubbles and more frequent blinks</div>
            <div><strong>Success:</strong> Celebratory bounce with sparkles and excited double-blink</div>
            <div><strong>Error:</strong> Concerned sway with longer blink duration</div>
          </div>
        </div>
      </div>
    </div>
  );
}
