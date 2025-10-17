"use client";

import React, { useState, useEffect, useRef } from 'react';

export type SparkyAnimationType = 'idle' | 'hover' | 'click' | 'loading' | 'success' | 'error' | 'dragging' | 'analyzing' | 'extracting' | 'cleaning' | 'preparing';

interface SparkyMascotProps {
  animation: SparkyAnimationType;
  size?: number;
  className?: string;
  onAnimationComplete?: () => void;
  extractionProgress?: number;
}

interface SparkTrail {
  id: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  createdAt: number;
}

export function SparkyMascot({ 
  animation, 
  size = 48, 
  className = "",
  onAnimationComplete,
  extractionProgress = 0
}: SparkyMascotProps) {
  const [sparkTrails, setSparkTrails] = useState<SparkTrail[]>([]);
  const [eyeState, setEyeState] = useState<'open' | 'blink' | 'wink'>('open');
  const [bounceOffset, setBounceOffset] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const animationRef = useRef<number>();
  const lastSparkTime = useRef(0);

  // Idle animation with blinking and subtle floating
  useEffect(() => {
    if (animation === 'idle') {
      const idleInterval = setInterval(() => {
        // Random blinking
        if (Math.random() < 0.1) {
          setEyeState('blink');
          setTimeout(() => setEyeState('open'), 150);
        }
        
        // Occasional wink for personality
        if (Math.random() < 0.05) {
          setEyeState('wink');
          setTimeout(() => setEyeState('open'), 300);
        }
        
        // Gentle floating animation
        setBounceOffset(Math.sin(Date.now() * 0.002) * 2);
        
        // Gentle glow pulsing
        setGlowIntensity(0.8 + Math.sin(Date.now() * 0.003) * 0.2);
      }, 100);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(idleInterval);
        }
      };
    }
  }, [animation]);

  // Hover animation with excited bouncing
  useEffect(() => {
    if (animation === 'hover') {
      const hoverInterval = setInterval(() => {
        setBounceOffset(Math.sin(Date.now() * 0.01) * 4);
        setGlowIntensity(1.2 + Math.sin(Date.now() * 0.008) * 0.3);
        
        // Excited blinking
        if (Math.random() < 0.2) {
          setEyeState('blink');
          setTimeout(() => setEyeState('open'), 100);
        }
      }, 50);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(hoverInterval);
        }
      };
    }
  }, [animation]);

  // Click animation with flash and wink
  useEffect(() => {
    if (animation === 'click') {
      setEyeState('wink');
      setGlowIntensity(2);
      setBounceOffset(-8);
      
      // Create spark burst
      createSparkBurst(size / 2, size / 2);
      
      setTimeout(() => {
        setEyeState('open');
        setGlowIntensity(1);
        setBounceOffset(0);
        onAnimationComplete?.();
      }, 200);
    }
  }, [animation, size, onAnimationComplete]);

  // Loading animation with spinning and determined expression
  useEffect(() => {
    if (animation === 'loading') {
      const loadingInterval = setInterval(() => {
        setRotationAngle(prev => (prev + 2) % 360);
        setGlowIntensity(1 + Math.sin(Date.now() * 0.01) * 0.5);
        
        // Create spinning sparks
        if (Date.now() - lastSparkTime.current > 100) {
          createSpinningSpark();
          lastSparkTime.current = Date.now();
        }
      }, 16);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(loadingInterval);
        }
      };
    }
  }, [animation]);

  // Success animation with celebration
  useEffect(() => {
    if (animation === 'success') {
      setBounceOffset(-12);
      setGlowIntensity(2);
      setEyeState('open');
      
      // Create celebration sparks
      createCelebrationSparks();
      
      const successTimeout = setTimeout(() => {
        setBounceOffset(0);
        setGlowIntensity(1);
        onAnimationComplete?.();
      }, 2000);

      return () => clearTimeout(successTimeout);
    }
  }, [animation, onAnimationComplete]);

  // Error animation with sad expression
  useEffect(() => {
    if (animation === 'error') {
      setBounceOffset(4);
      setGlowIntensity(0.3);
      setEyeState('blink');
      
      const errorTimeout = setTimeout(() => {
        setBounceOffset(0);
        setGlowIntensity(1);
        setEyeState('open');
        onAnimationComplete?.();
      }, 1500);

      return () => clearTimeout(errorTimeout);
    }
  }, [animation, onAnimationComplete]);

  // Dragging animation with trail effects
  useEffect(() => {
    if (animation === 'dragging') {
      const dragInterval = setInterval(() => {
        setRotationAngle(prev => prev + 1);
        setGlowIntensity(1.3);
        
        // Create drag trail sparks
        if (Date.now() - lastSparkTime.current > 50) {
          createDragTrailSpark();
          lastSparkTime.current = Date.now();
        }
      }, 16);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(dragInterval);
        }
      };
    }
  }, [animation]);

  // Analyzing animation (0-20%) - Eyes darting around, scanning
  useEffect(() => {
    if (animation === 'analyzing') {
      const analyzeInterval = setInterval(() => {
        // Eyes dart around scanning
        setEyeState(Math.random() < 0.3 ? 'blink' : 'open');
        setBounceOffset(Math.sin(Date.now() * 0.008) * 3);
        setGlowIntensity(1 + Math.sin(Date.now() * 0.01) * 0.4);
        
        // Create scanning sparks
        if (Date.now() - lastSparkTime.current > 150) {
          createScanningSparkPattern();
          lastSparkTime.current = Date.now();
        }
      }, 100);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(analyzeInterval);
        }
      };
    }
  }, [animation]);

  // Extracting animation (20-60%) - Pulling motion with sparks
  useEffect(() => {
    if (animation === 'extracting') {
      const extractInterval = setInterval(() => {
        setBounceOffset(Math.sin(Date.now() * 0.012) * 5);
        setGlowIntensity(1.2 + Math.sin(Date.now() * 0.008) * 0.5);
        setRotationAngle(prev => (prev + 0.5) % 360);
        
        // Create pulling sparks
        if (Date.now() - lastSparkTime.current > 80) {
          createPullingSparkEffect();
          lastSparkTime.current = Date.now();
        }
      }, 50);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(extractInterval);
        }
      };
    }
  }, [animation]);

  // Cleaning animation (60-80%) - Gentle spinning, polishing
  useEffect(() => {
    if (animation === 'cleaning') {
      const cleanInterval = setInterval(() => {
        setRotationAngle(prev => (prev + 1) % 360);
        setBounceOffset(Math.sin(Date.now() * 0.006) * 2);
        setGlowIntensity(1.1 + Math.sin(Date.now() * 0.005) * 0.3);
        
        // Create polishing sparks
        if (Date.now() - lastSparkTime.current > 120) {
          createPolishingSparkEffect();
          lastSparkTime.current = Date.now();
        }
      }, 30);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(cleanInterval);
        }
      };
    }
  }, [animation]);

  // Preparing animation (80-100%) - Building up energy
  useEffect(() => {
    if (animation === 'preparing') {
      const prepareInterval = setInterval(() => {
        const intensity = 1 + (extractionProgress / 100) * 0.8;
        setBounceOffset(Math.sin(Date.now() * 0.015) * (4 * intensity));
        setGlowIntensity(1.3 + Math.sin(Date.now() * 0.012) * (0.7 * intensity));
        
        // Create anticipation sparks
        if (Date.now() - lastSparkTime.current > 60) {
          createAnticipationSparkEffect(intensity);
          lastSparkTime.current = Date.now();
        }
      }, 40);

      return () => {
        if (typeof clearInterval !== 'undefined') {
          clearInterval(prepareInterval);
        }
      };
    }
  }, [animation, extractionProgress]);

  // Spark trail cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setSparkTrails(prev => 
        prev.filter(spark => Date.now() - spark.createdAt < 1000)
          .map(spark => ({
            ...spark,
            opacity: Math.max(0, spark.opacity - 0.02),
            scale: Math.max(0, spark.scale - 0.01)
          }))
      );
    }, 16);

    return () => {
      if (typeof clearInterval !== 'undefined') {
        clearInterval(cleanupInterval);
      }
    };
  }, []);

  const createSparkBurst = (centerX: number, centerY: number) => {
    const newSparks: SparkTrail[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 20 + Math.random() * 10;
      newSparks.push({
        id: `burst-${Date.now()}-${i}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        opacity: 1,
        scale: 0.8 + Math.random() * 0.4,
        createdAt: Date.now()
      });
    }
    setSparkTrails(prev => [...prev, ...newSparks]);
  };

  const createSpinningSpark = () => {
    const angle = (Date.now() * 0.01) % (Math.PI * 2);
    const radius = size * 0.6;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const newSpark: SparkTrail = {
      id: `spin-${Date.now()}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      opacity: 1,
      scale: 0.6,
      createdAt: Date.now()
    };
    
    setSparkTrails(prev => [...prev, newSpark]);
  };

  const createCelebrationSparks = () => {
    const newSparks: SparkTrail[] = [];
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const centerX = size / 2;
        const centerY = size / 2;
        
        const spark: SparkTrail = {
          id: `celebration-${Date.now()}-${i}`,
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          opacity: 1,
          scale: 1 + Math.random() * 0.5,
          createdAt: Date.now()
        };
        
        setSparkTrails(prev => [...prev, spark]);
      }, i * 100);
    }
  };

  const createDragTrailSpark = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    
    const newSpark: SparkTrail = {
      id: `trail-${Date.now()}`,
      x: centerX + offsetX,
      y: centerY + offsetY,
      opacity: 0.8,
      scale: 0.4 + Math.random() * 0.3,
      createdAt: Date.now()
    };
    
    setSparkTrails(prev => [...prev, newSpark]);
  };

  const createScanningSparkPattern = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const angle = (Date.now() * 0.02) % (Math.PI * 2);
    const radius = size * 0.4;
    
    const newSpark: SparkTrail = {
      id: `scan-${Date.now()}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      opacity: 0.9,
      scale: 0.5,
      createdAt: Date.now()
    };
    
    setSparkTrails(prev => [...prev, newSpark]);
  };

  const createPullingSparkEffect = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const direction = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 10;
    
    const newSpark: SparkTrail = {
      id: `pull-${Date.now()}`,
      x: centerX + Math.cos(direction) * distance,
      y: centerY + Math.sin(direction) * distance,
      opacity: 1,
      scale: 0.6 + Math.random() * 0.3,
      createdAt: Date.now()
    };
    
    setSparkTrails(prev => [...prev, newSpark]);
  };

  const createPolishingSparkEffect = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const angle = (Date.now() * 0.005) % (Math.PI * 2);
    const radius = size * 0.3;
    
    for (let i = 0; i < 2; i++) {
      const sparkAngle = angle + (i * Math.PI);
      const newSpark: SparkTrail = {
        id: `polish-${Date.now()}-${i}`,
        x: centerX + Math.cos(sparkAngle) * radius,
        y: centerY + Math.sin(sparkAngle) * radius,
        opacity: 0.7,
        scale: 0.4,
        createdAt: Date.now()
      };
      
      setSparkTrails(prev => [...prev, newSpark]);
    }
  };

  const createAnticipationSparkEffect = (intensity: number) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const sparkCount = Math.floor(2 + intensity * 2);
    
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const radius = size * (0.2 + intensity * 0.2);
      
      const newSpark: SparkTrail = {
        id: `anticipation-${Date.now()}-${i}`,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        opacity: 0.8 + intensity * 0.2,
        scale: 0.5 + intensity * 0.3,
        createdAt: Date.now()
      };
      
      setSparkTrails(prev => [...prev, newSpark]);
    }
  };

  const getEyeExpression = () => {
    switch (animation) {
      case 'success':
        return 'happy';
      case 'error':
        return 'sad';
      case 'loading':
      case 'preparing':
        return 'determined';
      case 'dragging':
      case 'extracting':
      case 'cleaning':
        return 'focused';
      case 'analyzing':
        return 'scanning';
      default:
        return 'normal';
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        transform: `translateY(${bounceOffset}px)`
      }}
    >
      {/* Hidden description for screen readers */}
      <div id={`sparky-${animation}-state`} className="sr-only">
        Sparky is currently in {animation} state
      </div>
      {/* Spark trails */}
      {sparkTrails.map(spark => (
        <div
          key={spark.id}
          className="absolute pointer-events-none"
          style={{
            left: spark.x - 2,
            top: spark.y - 2,
            opacity: spark.opacity,
            transform: `scale(${spark.scale})`,
            transition: 'opacity 0.1s ease-out'
          }}
        >
          <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      ))}
      
      {/* Main Sparky SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="drop-shadow-lg"
        role="img"
        aria-label="Sparky the lightning bolt mascot"
        aria-describedby={`sparky-${animation}-state`}
        style={{
          filter: `drop-shadow(0 0 ${glowIntensity * 8}px #3b82f6)`,
          transform: `rotate(${rotationAngle}deg)`,
          transition: animation === 'click' ? 'all 0.2s ease-out' : 'filter 0.3s ease-out'
        }}
      >
        {/* Lightning bolt body */}
        <path
          d="M24 4 L16 20 L22 20 L18 44 L32 16 L26 16 L24 4 Z"
          fill="#2563eb"
          stroke="#1d4ed8"
          strokeWidth="1"
          className="transition-all duration-300"
        />
        
        {/* Inner highlight */}
        <path
          d="M24 6 L18 18 L22 18 L20 38 L28 18 L26 18 L24 6 Z"
          fill="#3b82f6"
          className="transition-all duration-300"
        />
        
        {/* Eyes */}
        <g className="transition-all duration-150">
          {eyeState === 'open' && (
            <>
              <circle cx="21" cy="14" r="2" fill="white" />
              <circle cx="27" cy="14" r="2" fill="white" />
              <circle 
                cx={getEyeExpression() === 'scanning' ? 21 + Math.sin(Date.now() * 0.01) * 0.5 : 21} 
                cy={getEyeExpression() === 'happy' ? "13.5" : getEyeExpression() === 'sad' ? "14.5" : "14"} 
                r="1" 
                fill="black" 
              />
              <circle 
                cx={getEyeExpression() === 'scanning' ? 27 + Math.sin(Date.now() * 0.01 + 0.5) * 0.5 : 27} 
                cy={getEyeExpression() === 'happy' ? "13.5" : getEyeExpression() === 'sad' ? "14.5" : "14"} 
                r="1" 
                fill="black" 
              />
              {/* Eye sparkles for excitement */}
              {(animation === 'hover' || animation === 'success') && (
                <>
                  <circle cx="21.5" cy="13.5" r="0.3" fill="white" opacity="0.8" />
                  <circle cx="27.5" cy="13.5" r="0.3" fill="white" opacity="0.8" />
                </>
              )}
              {/* Scanning indicators */}
              {getEyeExpression() === 'scanning' && (
                <>
                  <circle cx="21.2" cy="13.8" r="0.2" fill="blue" opacity="0.6" />
                  <circle cx="27.2" cy="13.8" r="0.2" fill="blue" opacity="0.6" />
                </>
              )}
            </>
          )}
          
          {eyeState === 'blink' && (
            <>
              <ellipse cx="21" cy="14" rx="2" ry="0.2" fill="white" />
              <ellipse cx="27" cy="14" rx="2" ry="0.2" fill="white" />
            </>
          )}
          
          {eyeState === 'wink' && (
            <>
              <ellipse cx="21" cy="14" rx="2" ry="0.2" fill="white" />
              <circle cx="27" cy="14" r="2" fill="white" />
              <circle cx="27" cy="14" r="1" fill="black" />
            </>
          )}
        </g>
        
        {/* Mouth */}
        <g className="transition-all duration-300">
          {getEyeExpression() === 'happy' && (
            <path d="M20 18 Q24 22 28 18" stroke="white" strokeWidth="1" fill="none" />
          )}
          {getEyeExpression() === 'sad' && (
            <path d="M20 20 Q24 16 28 20" stroke="white" strokeWidth="1" fill="none" />
          )}
          {getEyeExpression() === 'determined' && (
            <line x1="20" y1="19" x2="28" y2="19" stroke="white" strokeWidth="1" />
          )}
          {getEyeExpression() === 'focused' && (
            <ellipse cx="24" cy="19" rx="2" ry="0.5" fill="white" />
          )}
          {getEyeExpression() === 'scanning' && (
            <ellipse cx="24" cy="19" rx="1.5" ry="0.3" fill="white" opacity="0.8" />
          )}
          {getEyeExpression() === 'normal' && (
            <circle cx="24" cy="19" r="1" fill="white" opacity="0.7" />
          )}
        </g>
        
        {/* Accent sparks around edges */}
        <g className="transition-all duration-300" opacity={glowIntensity * 0.6}>
          <circle cx="16" cy="12" r="1" fill="#fbbf24" />
          <circle cx="32" cy="12" r="1" fill="#fbbf24" />
          <circle cx="14" cy="24" r="0.8" fill="#fbbf24" />
          <circle cx="34" cy="24" r="0.8" fill="#fbbf24" />
          <circle cx="18" cy="36" r="0.6" fill="#fbbf24" />
          <circle cx="30" cy="36" r="0.6" fill="#fbbf24" />
        </g>
      </svg>
    </div>
  );
}