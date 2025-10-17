"use client";

import React, { useState } from 'react';
import { FloatingActionButton } from '@/components/floating-action-button';
import { ButtonSettingsDialog } from '@/components/button-settings-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ButtonConfigurationDemo() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>('');

  const handleExtract = async () => {
    setExtractionStatus('Starting extraction...');
    
    // Simulate extraction process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setExtractionStatus('Extraction completed successfully!');
    
    setTimeout(() => {
      setExtractionStatus('');
    }, 3000);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleConfigChange = (config: any) => {
    console.log('Configuration updated:', config);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Button Configuration Demo</CardTitle>
            <CardDescription>
              Test the floating action button with configuration and personalization options.
              Right-click the button or use Ctrl+S to open settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => setSettingsOpen(true)}>
                Open Settings
              </Button>
              <Button variant="outline" onClick={handleExtract}>
                Simulate Extraction
              </Button>
            </div>
            
            {extractionStatus && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">{extractionStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Appearance Settings</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Button size (small, medium, large)</li>
                  <li>• Theme (light, dark, auto)</li>
                  <li>• Opacity control</li>
                  <li>• Sparky mascot toggle</li>
                  <li>• Animation speed settings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Behavior Settings</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Drag enable/disable</li>
                  <li>• Edge snapping</li>
                  <li>• Hover-only visibility</li>
                  <li>• Custom keyboard shortcuts</li>
                  <li>• Domain-specific positioning</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Privacy Settings</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Robots.txt respect</li>
                  <li>• Domain exclusions</li>
                  <li>• Data collection controls</li>
                  <li>• Analytics opt-out</li>
                  <li>• Error reporting toggle</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Advanced Features</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Settings backup/restore</li>
                  <li>• Reset to defaults</li>
                  <li>• Smart positioning</li>
                  <li>• Cross-domain memory</li>
                  <li>• Accessibility compliance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Opening Settings:</h4>
                <ul className="text-sm text-gray-600 mt-1">
                  <li>• Right-click the floating button</li>
                  <li>• Use keyboard shortcut Ctrl+S (when button is focused)</li>
                  <li>• Click the "Open Settings" button above</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Keyboard Navigation:</h4>
                <ul className="text-sm text-gray-600 mt-1">
                  <li>• Alt+E: Focus the button</li>
                  <li>• Arrow keys: Move button position</li>
                  <li>• Shift+Arrows: Fast movement</li>
                  <li>• H: Show help dialog</li>
                  <li>• D: Toggle drag mode</li>
                  <li>• Escape: Cancel/close</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Domain Features:</h4>
                <ul className="text-sm text-gray-600 mt-1">
                  <li>• Button position is remembered per domain</li>
                  <li>• Domains can be excluded from showing the button</li>
                  <li>• Smart positioning avoids page elements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onExtract={handleExtract}
        onOpenSettings={handleOpenSettings}
        configuration={{
          initialPosition: { x: 50, y: 50 },
          size: 'medium',
          dragEnabled: true,
          snapToEdges: true,
          mascotEnabled: true,
        }}
      />

      {/* Settings Dialog */}
      <ButtonSettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}