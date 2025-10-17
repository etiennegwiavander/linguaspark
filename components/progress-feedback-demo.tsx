"use client";

import React, { useState } from 'react';
import { FloatingActionButton } from '@/components/floating-action-button';
import { Button } from '@/components/ui/button';

export function ProgressFeedbackDemo() {
  const [isExtracting, setIsExtracting] = useState(false);

  // Simulate extraction with progress phases
  const simulateExtraction = async () => {
    setIsExtracting(true);
    
    // Simulate a realistic extraction process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExtracting(false);
  };

  // Simulate extraction error
  const simulateError = async () => {
    setIsExtracting(true);
    
    // Simulate some processing time before error
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsExtracting(false);
    throw new Error('Failed to extract content from this page');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Progress Feedback Demo</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Enhanced Floating Action Button</h2>
          <p className="text-gray-600 mb-6">
            This demo shows the enhanced progress feedback with Sparky animations during extraction phases.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={simulateExtraction}
              disabled={isExtracting}
              className="w-full"
            >
              {isExtracting ? 'Extracting...' : 'Test Extraction Sequence'}
            </Button>
            
            <Button 
              onClick={simulateError}
              disabled={isExtracting}
              variant="destructive"
              className="w-full"
            >
              Test Extraction Error
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Expected Behavior:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Extraction Phases:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Analyzing (0-20%):</strong> Sparky's eyes dart around scanning</li>
                <li>• <strong>Extracting (20-60%):</strong> Sparky bounces with pulling motion</li>
                <li>• <strong>Cleaning (60-80%):</strong> Sparky spins gently with polishing sparks</li>
                <li>• <strong>Preparing (80-100%):</strong> Sparky builds up energy with anticipation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">Interactive Features:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Success:</strong> Sparky celebrates with confetti sparks</li>
                <li>• <strong>Error:</strong> Sparky droops sadly with dim glow</li>
                <li>• <strong>Dragging:</strong> Spark trails follow movement</li>
                <li>• <strong>Hover:</strong> Sparky bounces excitedly</li>
              </ul>
            </div>
          </div>
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