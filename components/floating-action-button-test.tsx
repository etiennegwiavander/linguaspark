"use client";

import React, { useState } from 'react';
import { FloatingActionButton } from './floating-action-button';
import { Button } from '@/components/ui/button';

export const FloatingActionButtonTest: React.FC = () => {
  const [showButton, setShowButton] = useState(true);
  const [testMessage, setTestMessage] = useState('');

  const handleExtract = () => {
    setTestMessage('Extract button clicked! Content extraction would start here.');
    console.log('FloatingActionButton extract clicked');
  };

  const simulateLoading = () => {
    setTestMessage('Simulating loading state...');
    // This would be handled by the parent component in real usage
  };

  const simulateError = () => {
    setTestMessage('Simulating error state...');
    // This would be handled by the parent component in real usage
  };

  const simulateSuccess = () => {
    setTestMessage('Simulating success state...');
    // This would be handled by the parent component in real usage
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Floating Action Button Test</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Test the floating action button functionality. The button should be draggable, 
          responsive, and accessible.
        </p>
        
        {testMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{testMessage}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={() => setShowButton(!showButton)}
          variant="outline"
        >
          {showButton ? 'Hide' : 'Show'} Button
        </Button>
        
        <Button 
          onClick={simulateLoading}
          variant="outline"
        >
          Test Loading
        </Button>
        
        <Button 
          onClick={simulateError}
          variant="outline"
        >
          Test Error
        </Button>
        
        <Button 
          onClick={simulateSuccess}
          variant="outline"
        >
          Test Success
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Features to Test:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Drag the button around the screen</li>
          <li>Try keyboard navigation (Alt+E to focus, arrow keys to move)</li>
          <li>Test on different screen sizes (resize window)</li>
          <li>Check accessibility with screen reader</li>
          <li>Verify touch interactions on mobile devices</li>
          <li>Test edge snapping behavior</li>
          <li>Verify position persistence (refresh page)</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sparky Animations:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Idle: Gentle floating animation</li>
          <li>Hover: Excited bounce with sparkles</li>
          <li>Click: Quick flash animation</li>
          <li>Loading: Spinning with determined expression</li>
          <li>Success: Celebration bounce with confetti sparks</li>
          <li>Error: Sad droop with concerned expression</li>
          <li>Drag: Trail sparks with focused eyes</li>
        </ul>
      </div>

      {showButton && (
        <FloatingActionButton
          onExtract={handleExtract}
          configuration={{
            initialPosition: { x: 20, y: 20 },
            size: 'medium',
            dragEnabled: true,
            snapToEdges: true,
            touchFriendly: true,
            keyboardShortcut: 'Alt+E',
            mascotEnabled: true,
            animationSpeed: 'normal'
          }}
        />
      )}
    </div>
  );
};