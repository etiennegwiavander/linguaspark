"use client";

import React, { useState } from 'react';
import { FloatingActionButton, type ExtractionPhase } from '@/components/floating-action-button';
import { Button } from '@/components/ui/button';

export function FloatingActionButtonProgressTest() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ExtractionPhase>('analyzing');
  const [progress, setProgress] = useState(0);

  // Simulate extraction sequence
  const simulateExtraction = async () => {
    setIsExtracting(true);
    
    // Analyzing phase (0-20%)
    setCurrentPhase('analyzing');
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i * 0.2);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Extracting phase (20-60%)
    setCurrentPhase('extracting');
    for (let i = 0; i <= 100; i += 3) {
      setProgress(20 + (i * 0.4));
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    
    // Cleaning phase (60-80%)
    setCurrentPhase('cleaning');
    for (let i = 0; i <= 100; i += 4) {
      setProgress(60 + (i * 0.2));
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // Preparing phase (80-100%)
    setCurrentPhase('preparing');
    for (let i = 0; i <= 100; i += 2) {
      setProgress(80 + (i * 0.2));
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    
    setIsExtracting(false);
    setProgress(0);
  };

  const simulateError = async () => {
    setIsExtracting(true);
    setCurrentPhase('analyzing');
    
    // Start extraction then fail
    for (let i = 0; i <= 50; i += 10) {
      setProgress(i * 0.2);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Simulate error
    throw new Error('Failed to extract content from this page');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Floating Action Button Progress Test</h2>
        <p className="text-gray-600 mb-6">
          Test the enhanced progress feedback with Sparky animations during extraction phases.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={simulateExtraction}
            disabled={isExtracting}
            className="w-full"
          >
            {isExtracting ? 'Extracting...' : 'Test Full Extraction Sequence'}
          </Button>
          
          <Button 
            onClick={simulateError}
            disabled={isExtracting}
            variant="destructive"
            className="w-full"
          >
            Test Extraction Error
          </Button>
          
          {isExtracting && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Current Phase: {currentPhase}
              </div>
              <div className="text-sm text-blue-700">
                Progress: {Math.round(progress)}%
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Expected Behavior:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Analyzing (0-20%):</strong> Sparky's eyes dart around scanning, blue scanning indicators</li>
            <li>• <strong>Extracting (20-60%):</strong> Sparky bounces with pulling motion, focused expression</li>
            <li>• <strong>Cleaning (60-80%):</strong> Sparky spins gently with polishing sparks</li>
            <li>• <strong>Preparing (80-100%):</strong> Sparky builds up energy with anticipation sparks</li>
            <li>• <strong>Success:</strong> Sparky celebrates with confetti sparks and happy expression</li>
            <li>• <strong>Error:</strong> Sparky droops sadly with dim glow</li>
            <li>• <strong>Dragging:</strong> Spark trails follow movement, position saved feedback</li>
          </ul>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <FloatingActionButton
        onExtract={simulateExtraction}
        configuration={{
          initialPosition: { x: 50, y: 50 },
          size: 'large',
          dragEnabled: true,
          mascotEnabled: true
        }}
      />
    </div>
  );
}