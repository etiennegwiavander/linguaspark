"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Upload, RotateCcw } from 'lucide-react';
import { ButtonConfigurationManager, type ButtonConfiguration, type UserPreferences } from '@/lib/button-configuration-manager';

interface ButtonSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: (config: ButtonConfiguration) => void;
}

export function ButtonSettingsDialog({ isOpen, onClose, onConfigChange }: ButtonSettingsDialogProps) {
  const [configManager] = useState(() => ButtonConfigurationManager.getInstance());
  const [config, setConfig] = useState<ButtonConfiguration | null>(null);
  const [privacySettings, setPrivacySettings] = useState<UserPreferences['privacySettings'] | null>(null);
  const [domainSettings, setDomainSettings] = useState<Record<string, any>>({});
  const [newExcludeDomain, setNewExcludeDomain] = useState('');
  const [keyboardShortcut, setKeyboardShortcut] = useState('');
  const [shortcutError, setShortcutError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    await configManager.loadPreferences();
    setConfig(configManager.getButtonConfiguration());
    setPrivacySettings(configManager.getPrivacySettings());
    setKeyboardShortcut(configManager.getButtonConfiguration().keyboardShortcut);
  };

  const updateConfig = async (updates: Partial<ButtonConfiguration>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await configManager.updateButtonConfiguration(updates);
    onConfigChange?.(newConfig);
  };

  const updatePrivacySettings = async (updates: Partial<UserPreferences['privacySettings']>) => {
    if (!privacySettings) return;
    
    const newSettings = { ...privacySettings, ...updates };
    setPrivacySettings(newSettings);
    await configManager.updatePrivacySettings(updates);
  };

  const handleKeyboardShortcutChange = (value: string) => {
    setKeyboardShortcut(value);
    
    if (configManager.isValidKeyboardShortcut(value)) {
      setShortcutError('');
      updateConfig({ keyboardShortcut: value });
    } else {
      setShortcutError('Invalid shortcut format. Use format like "Alt+E" or "Ctrl+Shift+L"');
    }
  };

  const addExcludeDomain = async () => {
    if (newExcludeDomain.trim() && config) {
      await configManager.excludeDomain(newExcludeDomain.trim());
      const updatedConfig = configManager.getButtonConfiguration();
      setConfig(updatedConfig);
      setNewExcludeDomain('');
    }
  };

  const removeExcludeDomain = async (domain: string) => {
    await configManager.includeDomain(domain);
    const updatedConfig = configManager.getButtonConfiguration();
    setConfig(updatedConfig);
  };

  const resetToDefaults = async () => {
    await configManager.resetToDefaults();
    await loadSettings();
  };

  const exportSettings = () => {
    const exported = configManager.exportPreferences();
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linguaspark-button-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await configManager.importPreferences(content);
          await loadSettings();
        } catch (error) {
          alert('Failed to import settings: Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen || !config || !privacySettings) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Button Settings</h2>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Settings</CardTitle>
                  <CardDescription>Customize how the button looks and feels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="size">Button Size</Label>
                      <Select value={config.size} onValueChange={(value: 'small' | 'medium' | 'large') => updateConfig({ size: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (48px)</SelectItem>
                          <SelectItem value="medium">Medium (64px)</SelectItem>
                          <SelectItem value="large">Large (80px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={config.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => updateConfig({ theme: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="opacity">Opacity: {Math.round(config.opacity * 100)}%</Label>
                    <Slider
                      value={[config.opacity]}
                      onValueChange={([value]) => updateConfig({ opacity: value })}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sparky Mascot</CardTitle>
                  <CardDescription>Configure the mascot character</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.mascotEnabled}
                      onCheckedChange={(checked) => updateConfig({ mascotEnabled: checked })}
                    />
                    <Label>Enable Sparky mascot</Label>
                  </div>

                  {config.mascotEnabled && (
                    <>
                      <div>
                        <Label htmlFor="animationSpeed">Animation Speed</Label>
                        <Select value={config.animationSpeed} onValueChange={(value: 'slow' | 'normal' | 'fast') => updateConfig({ animationSpeed: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.sparkEffects}
                          onCheckedChange={(checked) => updateConfig({ sparkEffects: checked })}
                        />
                        <Label>Enable spark effects</Label>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interaction Settings</CardTitle>
                  <CardDescription>Configure how the button behaves</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.dragEnabled}
                      onCheckedChange={(checked) => updateConfig({ dragEnabled: checked })}
                    />
                    <Label>Enable dragging</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.snapToEdges}
                      onCheckedChange={(checked) => updateConfig({ snapToEdges: checked })}
                    />
                    <Label>Snap to screen edges</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.showOnHover}
                      onCheckedChange={(checked) => updateConfig({ showOnHover: checked })}
                    />
                    <Label>Only show on hover</Label>
                  </div>

                  <div>
                    <Label htmlFor="keyboardShortcut">Keyboard Shortcut</Label>
                    <Input
                      value={keyboardShortcut}
                      onChange={(e) => handleKeyboardShortcutChange(e.target.value)}
                      placeholder="e.g., Alt+E, Ctrl+Shift+L"
                      className={shortcutError ? 'border-red-500' : ''}
                    />
                    {shortcutError && (
                      <p className="text-sm text-red-500 mt-1">{shortcutError}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control data collection and privacy options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.respectRobotsTxt}
                      onCheckedChange={(checked) => updateConfig({ respectRobotsTxt: checked })}
                    />
                    <Label>Respect robots.txt files</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.showPrivacyNotice}
                      onCheckedChange={(checked) => updateConfig({ showPrivacyNotice: checked })}
                    />
                    <Label>Show privacy notices</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={privacySettings.dataCollection}
                      onCheckedChange={(checked) => updatePrivacySettings({ dataCollection: checked })}
                    />
                    <Label>Allow anonymous usage data collection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={privacySettings.analytics}
                      onCheckedChange={(checked) => updatePrivacySettings({ analytics: checked })}
                    />
                    <Label>Enable analytics</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={privacySettings.errorReporting}
                      onCheckedChange={(checked) => updatePrivacySettings({ errorReporting: checked })}
                    />
                    <Label>Enable error reporting</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Domain Exclusions</CardTitle>
                  <CardDescription>Domains where the button should not appear</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newExcludeDomain}
                      onChange={(e) => setNewExcludeDomain(e.target.value)}
                      placeholder="example.com"
                    />
                    <Button onClick={addExcludeDomain}>Add</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {config.excludeDomains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                        {domain}
                        <button
                          onClick={() => removeExcludeDomain(domain)}
                          className="ml-1 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Export or import your settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button onClick={exportSettings} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Settings
                    </Button>
                    
                    <label className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Import Settings
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importSettings}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <Button onClick={resetToDefaults} variant="destructive">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}