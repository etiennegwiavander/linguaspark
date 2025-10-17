"use client";

import React, { useState } from 'react';
import { SparkyMascot, type SparkyAnimationType } from './sparky-mascot';
import { Button } from './ui/button';

export function SparkyMascotDemo() {
  const [currentAnimation, setCurrentAnimation] = useState<SparkyAnimationType>('idle');
  const [size, setSize] = useState(64);

  const animations: { type: SparkyAnimationType; label: string; description: string }[] = [
    { 
      type: 'idle', 
      label: 'Idle', 
      description: 'Gentle floating with occasional blinking and winking for personality' 
    },
    { 
      type: 'hover', 
      label: 'Hover', 
      description: 'Excited bouncing with increased glow and sparkly eyes' 
    },
    { 
      type: 'click', 
      label: 'Click', 
      description: 'Quick flash with wink and spark burst for immediate feedback' 
    },
    { 
      type: 'loading', 
      label: 'Loading', 
      description: 'Spinning with determined expression and orbiting sparks' 
    },
    { 
      type: 'success', 
      label: 'Success', 
      description: 'Celebration bounce with happy eyes and confetti-like sparks' 
    },
    { 
      type: 'error', 
      label: 'Error', 
      description: 'Sad droop with concerned expression and dimmed glow' 
    },
    { 
      type: 'dragging', 
      label: 'Dragging', 
      description: 'Focused expression with trailing sparks and slight tilt' 
    }
  ];

  const handleAnimationComplete = () => {
    console.log(`${currentAnimation} animation completed`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Meet Sparky! ⚡
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          LinguaSpark's friendly lightning bolt mascot with personality and charm
        </p>
        
        {/* Size Control */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size: {size}px
          </label>
          <input
            type="range"
            min="32"
            max="128"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-64"
          />
        </div>
      </div>

      {/* Sparky Display */}
      <div className="flex justify-center mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-12 shadow-lg">
          <SparkyMascot
            animation={currentAnimation}
            size={size}
            onAnimationComplete={handleAnimationComplete}
          />
        </div>
      </div>

      {/* Current Animation Info */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Current Animation: {animations.find(a => a.type === currentAnimation)?.label}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {animations.find(a => a.type === currentAnimation)?.description}
        </p>
      </div>

      {/* Animation Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {animations.map(({ type, label }) => (
          <Button
            key={type}
            variant={currentAnimation === type ? "default" : "outline"}
            onClick={() => setCurrentAnimation(type)}
            className="h-auto py-3 px-4 text-sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Personality Traits */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Sparky's Personality Traits
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Visual Characteristics</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Electric blue lightning bolt shape (#2563eb)</li>
              <li>• Expressive white eyes with black pupils</li>
              <li>• Yellow/gold spark accents (#fbbf24)</li>
              <li>• Dynamic glow effects that respond to state</li>
              <li>• Physics-based animations with momentum</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Behavioral Traits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Enthusiastic about learning and content</li>
              <li>• Helpful and encouraging demeanor</li>
              <li>• Slightly mischievous (playful winks)</li>
              <li>• Responsive to user interactions</li>
              <li>• Shows determination during work</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Animation Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Animation System Details
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Micro-Animations</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Random blinking every few seconds</li>
              <li>• Occasional playful winks for personality</li>
              <li>• Gentle floating motion during idle</li>
              <li>• Eye sparkles during excitement</li>
              <li>• Contextual facial expressions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Physics Effects</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Spark trails that fade over time</li>
              <li>• Momentum-based bouncing animations</li>
              <li>• Orbital spark effects during loading</li>
              <li>• Burst patterns for celebrations</li>
              <li>• Drag trails with physics simulation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Usage in Extract Button
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Idle:</strong> When button is visible but not interacted with</p>
          <p><strong>Hover:</strong> When user hovers over the extract button</p>
          <p><strong>Click:</strong> Immediate feedback when button is clicked</p>
          <p><strong>Loading:</strong> During content extraction and processing</p>
          <p><strong>Success:</strong> When extraction completes successfully</p>
          <p><strong>Error:</strong> When extraction fails or encounters issues</p>
          <p><strong>Dragging:</strong> When user drags the button to reposition it</p>
        </div>
      </div>
    </div>
  );
}