"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedMascot, type MascotAnimationType as AnimatedMascotType } from '@/components/animated-mascot-demo';
import { getBrowserCompatibility, type BrowserCompatibility } from '@/lib/browser-compatibility';
import { ButtonConfigurationManager, type ButtonConfiguration as ConfigManagerButtonConfiguration } from '@/lib/button-configuration-manager';

// Types and interfaces
interface Position {
  x: number;
  y: number;
}

interface ButtonConfiguration {
  initialPosition: Position;
  size: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  zIndex: number;
  dragEnabled: boolean;
  snapToEdges: boolean;
  touchFriendly: boolean;
  keyboardShortcut: string;
  mascotEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  accessibility?: Partial<AccessibilityFeatures>;
}

interface ButtonState {
  visible: boolean;
  loading: boolean;
  progress: number;
  disabled: boolean;
  error: string | null;
  success: boolean;
  isDragging: boolean;
  position: Position;
  currentAnimation: MascotAnimationType | null;
  extractionPhase: ExtractionPhase | null;
  progressMessage: string | null;
}

type ExtractionPhase = 'analyzing' | 'extracting' | 'cleaning' | 'preparing';

type MascotAnimationType = 'idle' | 'reading' | 'thinking' | 'success' | 'error';

interface FloatingActionButtonProps {
  onExtract?: () => void | Promise<void>;
  configuration?: Partial<ButtonConfiguration>;
  className?: string;
  onOpenSettings?: () => void;
}

interface AccessibilityFeatures {
  ariaLabel: string;
  ariaDescription: string;
  keyboardShortcut: string;
  screenReaderAnnouncements: boolean;
  highContrastSupport: boolean;
  dragInstructions: string;
  alternativeInteractions: boolean;
  colorBlindSupport: boolean;
  focusManagement: boolean;
  customShortcuts: Record<string, string>;
}

interface KeyboardShortcuts {
  activate: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  moveFast: string;
  escape: string;
  help: string;
  toggleDrag: string;
}

interface AccessibilityState {
  focusVisible: boolean;
  keyboardMode: boolean;
  dragMode: 'mouse' | 'keyboard' | 'touch';
  announceNext: string | null;
  helpVisible: boolean;
  highContrastActive: boolean;
}

// Default configuration
const defaultConfig: ButtonConfiguration = {
  initialPosition: { x: 20, y: 20 }, // From bottom-right
  size: 'medium',
  theme: 'auto',
  zIndex: 10000,
  dragEnabled: true,
  snapToEdges: true,
  touchFriendly: true,
  keyboardShortcut: 'Alt+E',
  mascotEnabled: true,
  animationSpeed: 'normal'
};

// Map extraction phases and old animation states to new mascot animations
const mapToMascotAnimation = (state: string | null): AnimatedMascotType => {
  switch (state) {
    case 'analyzing':
    case 'thinking':
      return 'thinking';
    case 'extracting':
    case 'cleaning':
    case 'preparing':
    case 'loading':
    case 'reading':
      return 'reading';
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'hover':
    case 'click':
    case 'dragging':
    case 'idle':
    default:
      return 'idle';
  }
};

const defaultAccessibility: AccessibilityFeatures = {
  ariaLabel: 'Extract content from page for lesson generation',
  ariaDescription: 'Click to extract webpage content and create a language lesson. Draggable to reposition.',
  keyboardShortcut: 'Alt+E',
  screenReaderAnnouncements: true,
  highContrastSupport: true,
  dragInstructions: 'Use arrow keys to move, Enter to activate, Escape to cancel, H for help',
  alternativeInteractions: true,
  colorBlindSupport: true,
  focusManagement: true,
  customShortcuts: {
    activate: 'Alt+E',
    moveUp: 'ArrowUp',
    moveDown: 'ArrowDown',
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    moveFast: 'Shift',
    escape: 'Escape',
    help: 'KeyH',
    toggleDrag: 'KeyD'
  }
};

const defaultKeyboardShortcuts: KeyboardShortcuts = {
  activate: 'Alt+E',
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  moveFast: 'Shift',
  escape: 'Escape',
  help: 'KeyH',
  toggleDrag: 'KeyD'
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onExtract,
  configuration = {},
  className = '',
  onOpenSettings
}) => {
  // Configuration manager instance
  const [configManager] = useState(() => ButtonConfigurationManager.getInstance());
  const [managedConfig, setManagedConfig] = useState<ConfigManagerButtonConfiguration | null>(null);
  
  // Merge configurations (managed config takes precedence)
  const config = managedConfig 
    ? { ...defaultConfig, ...configuration, ...managedConfig }
    : { ...defaultConfig, ...configuration };
  const accessibility = { ...defaultAccessibility, ...configuration.accessibility };
  const shortcuts = { ...defaultKeyboardShortcuts, ...accessibility.customShortcuts };
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    isDragging: false
  });
  
  // Browser compatibility instance
  const compatibility = useRef<BrowserCompatibility>(getBrowserCompatibility());
  const [compatibilitySettings, setCompatibilitySettings] = useState(() => ({
    browser: compatibility.current.getBrowserInfo(),
    device: compatibility.current.getDeviceInfo(),
    viewport: compatibility.current.getViewportInfo(),
    touch: compatibility.current.getTouchSettings(),
    keyboard: compatibility.current.getKeyboardSettings(),
    accessibility: compatibility.current.getAccessibilitySettings(),
    animation: compatibility.current.getAnimationSettings()
  }));

  // State management
  const [state, setState] = useState<ButtonState>({
    visible: true,
    loading: false,
    progress: 0,
    disabled: false,
    error: null,
    success: false,
    isDragging: false,
    position: config.initialPosition,
    currentAnimation: 'idle',
    extractionPhase: null,
    progressMessage: null
  });

  // Check domain visibility
  useEffect(() => {
    const checkDomainVisibility = async () => {
      if (managedConfig) {
        const domain = window.location.hostname;
        const isEnabled = configManager.isDomainEnabled(domain);
        setState(prev => ({ ...prev, visible: isEnabled }));
      }
    };
    
    checkDomainVisibility();
  }, [managedConfig, configManager]);

  // Accessibility state management
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    focusVisible: false,
    keyboardMode: false,
    dragMode: 'mouse',
    announceNext: null,
    helpVisible: false,
    highContrastActive: false
  });

  // Responsive sizing based on device and browser compatibility
  const getButtonSize = useCallback(() => {
    const optimalSize = compatibility.current.getOptimalButtonSize();
    
    // Apply size configuration adjustments
    if (config.size === 'small') return Math.max(44, optimalSize - 8);
    if (config.size === 'large') return optimalSize + 8;
    return optimalSize; // medium (default)
  }, [config.size]);

  // Smart edge snapping
  const snapToEdge = useCallback((position: Position): Position => {
    if (!config.snapToEdges) return position;

    const buttonSize = getButtonSize();
    const margin = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Snap to edges if close enough (within 50px)
    if (x < 50) x = margin;
    if (x > viewportWidth - buttonSize - 50) x = viewportWidth - buttonSize - margin;
    if (y < 50) y = margin;
    if (y > viewportHeight - buttonSize - 50) y = viewportHeight - buttonSize - margin;

    return { x, y };
  }, [config.snapToEdges, getButtonSize]);

  // Collision detection with page elements
  const detectCollisions = useCallback((position: Position): Position => {
    const buttonSize = getButtonSize();
    const buttonRect = {
      left: position.x,
      top: position.y,
      right: position.x + buttonSize,
      bottom: position.y + buttonSize
    };

    // Check for collisions with fixed elements
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position: sticky"]');
    
    for (let i = 0; i < fixedElements.length; i++) {
      const element = fixedElements[i];
      const rect = element.getBoundingClientRect();
      if (
        buttonRect.left < rect.right &&
        buttonRect.right > rect.left &&
        buttonRect.top < rect.bottom &&
        buttonRect.bottom > rect.top
      ) {
        // Collision detected, move button away
        const moveRight = rect.right + 10;
        const moveLeft = rect.left - buttonSize - 10;
        const moveDown = rect.bottom + 10;
        const moveUp = rect.top - buttonSize - 10;

        // Choose the closest valid position
        if (moveRight + buttonSize < window.innerWidth) {
          return { x: moveRight, y: position.y };
        } else if (moveLeft > 0) {
          return { x: moveLeft, y: position.y };
        } else if (moveDown + buttonSize < window.innerHeight) {
          return { x: position.x, y: moveDown };
        } else if (moveUp > 0) {
          return { x: position.x, y: moveUp };
        }
      }
    }

    return position;
  }, [getButtonSize]);

  // Position calculation with smart positioning
  const calculatePosition = useCallback((rawPosition: Position): Position => {
    let position = { ...rawPosition };
    
    // Apply collision detection
    position = detectCollisions(position);
    
    // Apply edge snapping
    position = snapToEdge(position);
    
    // Ensure position is within viewport bounds
    const buttonSize = getButtonSize();
    const margin = 10;
    
    position.x = Math.max(margin, Math.min(position.x, window.innerWidth - buttonSize - margin));
    position.y = Math.max(margin, Math.min(position.y, window.innerHeight - buttonSize - margin));
    
    return position;
  }, [detectCollisions, snapToEdge, getButtonSize]);

  // Save position using configuration manager
  const savePosition = useCallback(async () => {
    const domain = window.location.hostname;
    await configManager.saveDomainPosition(domain, state.position);
    
    // Also update the global button position
    await configManager.updateButtonConfiguration({ position: { ...state.position, edge: 'none' } });
  }, [state.position, configManager]);

  // Load saved position from localStorage
  const loadSavedPosition = useCallback((): Position => {
    const domain = window.location.hostname;
    const savedPositions = JSON.parse(localStorage.getItem('linguaspark-button-positions') || '{}');
    return savedPositions[domain] || config.initialPosition;
  }, [config.initialPosition]);

  // Load configuration and initialize position
  useEffect(() => {
    const initializeConfiguration = async () => {
      await configManager.loadPreferences();
      const buttonConfig = configManager.getButtonConfiguration();
      setManagedConfig(buttonConfig);
      
      // Get domain-specific position or use saved/default position
      const domain = window.location.hostname;
      const domainPosition = configManager.getDomainPosition(domain);
      const savedPosition = domainPosition || loadSavedPosition();
      const optimalPosition = compatibility.current.getOptimalButtonPosition(savedPosition);
      const calculatedPosition = calculatePosition(optimalPosition);
      setState(prev => ({ ...prev, position: calculatedPosition }));
    };
    
    initializeConfiguration();
    
    // Update compatibility settings on viewport changes
    const updateCompatibility = () => {
      setCompatibilitySettings({
        browser: compatibility.current.getBrowserInfo(),
        device: compatibility.current.getDeviceInfo(),
        viewport: compatibility.current.getViewportInfo(),
        touch: compatibility.current.getTouchSettings(),
        keyboard: compatibility.current.getKeyboardSettings(),
        accessibility: compatibility.current.getAccessibilitySettings(),
        animation: compatibility.current.getAnimationSettings()
      });
    };
    
    const cleanupOrientationListener = compatibility.current.onOrientationChange(updateCompatibility);
    
    return cleanupOrientationListener;
  }, [loadSavedPosition, calculatePosition, configManager]);

  // Enhanced drag functionality with touch support
  const startDrag = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!config.dragEnabled) return;
    
    // Prevent default behavior
    event.preventDefault();
    
    // Get coordinates based on event type
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    // Apply touch threshold for better touch experience
    const { dragThreshold } = compatibilitySettings.touch;
    
    dragRef.current = {
      startX: clientX - state.position.x,
      startY: clientY - state.position.y,
      isDragging: true
    };
    
    setState(prev => ({ 
      ...prev, 
      isDragging: true, 
      currentAnimation: 'dragging' 
    }));
    
    // Announce drag start for screen readers
    if (compatibilitySettings.accessibility.announcements) {
      const announcement = compatibilitySettings.accessibility.ariaLabels.dragging;
      // Create temporary element for screen reader announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    }
  }, [config.dragEnabled, state.position, compatibilitySettings.touch, compatibilitySettings.accessibility]);

  const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const newPosition = calculatePosition({
      x: clientX - dragRef.current.startX,
      y: clientY - dragRef.current.startY
    });
    
    setState(prev => ({ ...prev, position: newPosition }));
  }, [calculatePosition]);

  const endDrag = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    
    dragRef.current.isDragging = false;
    setState(prev => ({ 
      ...prev, 
      isDragging: false, 
      currentAnimation: 'idle' 
    }));
    
    savePosition();
    
    // Show position saved feedback
    setTimeout(() => {
      setState(prev => ({ ...prev, currentAnimation: 'success' }));
      setTimeout(() => {
        setState(prev => ({ ...prev, currentAnimation: 'idle' }));
      }, 1000);
    }, 100);
  }, [savePosition]);

  // Event listeners for drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDrag(e);
    const handleMouseUp = () => endDrag();
    const handleTouchMove = (e: TouchEvent) => handleDrag(e);
    const handleTouchEnd = () => endDrag();

    if (state.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state.isDragging, handleDrag, endDrag]);

  // Enhanced accessibility methods
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!accessibility.screenReaderAnnouncements) return;
    
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only absolute -left-10000 w-1 h-1 overflow-hidden';
    announcer.textContent = message;
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer);
      }
    }, 1000);
  }, [accessibility.screenReaderAnnouncements]);

  const detectHighContrast = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check for Windows high contrast mode
    if (window.matchMedia) {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
      return highContrastQuery.matches || forcedColorsQuery.matches;
    }
    
    return false;
  }, []);

  const updateAccessibilityState = useCallback(() => {
    setAccessibilityState(prev => ({
      ...prev,
      highContrastActive: detectHighContrast()
    }));
  }, [detectHighContrast]);

  const showHelp = useCallback(() => {
    setAccessibilityState(prev => ({ ...prev, helpVisible: true }));
    announceToScreenReader('Help dialog opened. Press Escape to close.', 'assertive');
  }, [announceToScreenReader]);

  const hideHelp = useCallback(() => {
    setAccessibilityState(prev => ({ ...prev, helpVisible: false }));
    buttonRef.current?.focus();
  }, []);

  const toggleDragMode = useCallback(() => {
    const newMode = accessibilityState.dragMode === 'keyboard' ? 'mouse' : 'keyboard';
    setAccessibilityState(prev => ({ ...prev, dragMode: newMode }));
    
    const message = newMode === 'keyboard' 
      ? 'Keyboard drag mode enabled. Use arrow keys to move the button.'
      : 'Mouse drag mode enabled. Click and drag to move the button.';
    
    announceToScreenReader(message, 'assertive');
  }, [accessibilityState.dragMode, announceToScreenReader]);

  // Enhanced keyboard navigation with accessibility support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global keyboard shortcut (Alt+E by default)
      if (event.altKey && event.key.toLowerCase() === shortcuts.activate.toLowerCase().replace('alt+', '')) {
        event.preventDefault();
        buttonRef.current?.focus();
        setAccessibilityState(prev => ({ ...prev, keyboardMode: true, focusVisible: true }));
        announceToScreenReader('Extract button focused. Press Enter to activate or use arrow keys to move.');
        return;
      }

      // Handle keys when button is focused
      if (document.activeElement === buttonRef.current) {
        const moveDistance = event.shiftKey ? 25 : (compatibilitySettings.device.isMobile ? 15 : 10);
        const buttonSize = getButtonSize();
        const viewport = compatibility.current.getCurrentViewportInfo();
        let newPosition = { ...state.position };
        let handled = false;

        switch (event.code) {
          case shortcuts.moveUp:
            event.preventDefault();
            newPosition.y = Math.max(10 + viewport.safeAreaInsets.top, newPosition.y - moveDistance);
            handled = true;
            break;
          case shortcuts.moveDown:
            event.preventDefault();
            newPosition.y = Math.min(
              window.innerHeight - buttonSize - 10 - viewport.safeAreaInsets.bottom, 
              newPosition.y + moveDistance
            );
            handled = true;
            break;
          case shortcuts.moveLeft:
            event.preventDefault();
            newPosition.x = Math.max(10 + viewport.safeAreaInsets.left, newPosition.x - moveDistance);
            handled = true;
            break;
          case shortcuts.moveRight:
            event.preventDefault();
            newPosition.x = Math.min(
              window.innerWidth - buttonSize - 10 - viewport.safeAreaInsets.right, 
              newPosition.x + moveDistance
            );
            handled = true;
            break;
          case 'Enter':
          case 'Space':
            event.preventDefault();
            handleClick();
            break;
          case shortcuts.escape:
            event.preventDefault();
            if (accessibilityState.helpVisible) {
              hideHelp();
            } else {
              buttonRef.current?.blur();
              setAccessibilityState(prev => ({ ...prev, keyboardMode: false, focusVisible: false }));
            }
            break;
          case shortcuts.help:
            event.preventDefault();
            showHelp();
            break;
          case shortcuts.toggleDrag:
            event.preventDefault();
            toggleDragMode();
            break;
          case 'KeyS':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              onOpenSettings?.();
            }
            break;
        }

        if (handled) {
          const calculatedPosition = calculatePosition(newPosition);
          setState(prev => ({ ...prev, position: calculatedPosition }));
          savePosition();
          
          // Announce position change for screen readers
          const direction = event.code.includes('Up') ? 'up' : 
                          event.code.includes('Down') ? 'down' :
                          event.code.includes('Left') ? 'left' : 'right';
          const distance = event.shiftKey ? 'fast' : 'normal';
          announceToScreenReader(`Moved ${direction} ${distance} speed. Position: ${Math.round(calculatedPosition.x)}, ${Math.round(calculatedPosition.y)}`);
        }
      }

      // Handle help dialog keys
      if (accessibilityState.helpVisible && event.code === shortcuts.escape) {
        event.preventDefault();
        hideHelp();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Detect keyboard usage for focus management
      if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(event.key)) {
        setAccessibilityState(prev => ({ ...prev, keyboardMode: true }));
      }
    };

    const handleMouseDown = () => {
      // Switch to mouse mode when mouse is used
      setAccessibilityState(prev => ({ ...prev, keyboardMode: false }));
    };

    if (compatibilitySettings.keyboard.enabled) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      document.addEventListener('mousedown', handleMouseDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [
    state.position, 
    calculatePosition, 
    savePosition, 
    getButtonSize, 
    compatibilitySettings, 
    handleClick,
    shortcuts,
    accessibilityState.helpVisible,
    announceToScreenReader,
    hideHelp,
    showHelp,
    toggleDragMode
  ]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newPosition = calculatePosition(state.position);
      setState(prev => ({ ...prev, position: newPosition }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.position, calculatePosition]);

  // Monitor accessibility preferences
  useEffect(() => {
    updateAccessibilityState();
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const handleAccessibilityChange = () => {
        updateAccessibilityState();
      };
      
      highContrastQuery.addEventListener('change', handleAccessibilityChange);
      forcedColorsQuery.addEventListener('change', handleAccessibilityChange);
      reducedMotionQuery.addEventListener('change', handleAccessibilityChange);
      
      return () => {
        highContrastQuery.removeEventListener('change', handleAccessibilityChange);
        forcedColorsQuery.removeEventListener('change', handleAccessibilityChange);
        reducedMotionQuery.removeEventListener('change', handleAccessibilityChange);
      };
    }
  }, [updateAccessibilityState]);

  // Focus management
  useEffect(() => {
    const handleFocus = () => {
      setAccessibilityState(prev => ({ ...prev, focusVisible: true }));
    };
    
    const handleBlur = () => {
      setAccessibilityState(prev => ({ ...prev, focusVisible: false }));
    };
    
    const button = buttonRef.current;
    if (button) {
      button.addEventListener('focus', handleFocus);
      button.addEventListener('blur', handleBlur);
      
      return () => {
        button.removeEventListener('focus', handleFocus);
        button.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  // Enhanced progress methods for extraction phases
  const setExtractionProgress = useCallback((phase: ExtractionPhase, progress: number) => {
    let phaseProgress = 0;
    let message = '';
    
    switch (phase) {
      case 'analyzing':
        phaseProgress = Math.max(0, Math.min(20, progress * 0.2));
        message = 'Analyzing the page...';
        break;
      case 'extracting':
        phaseProgress = 20 + Math.max(0, Math.min(40, progress * 0.4));
        message = 'Extracting content...';
        break;
      case 'cleaning':
        phaseProgress = 60 + Math.max(0, Math.min(20, progress * 0.2));
        message = 'Cleaning the content...';
        break;
      case 'preparing':
        phaseProgress = 80 + Math.max(0, Math.min(20, progress * 0.2));
        message = 'Preparing your lesson...';
        break;
    }
    
    setState(prev => ({ 
      ...prev, 
      progress: phaseProgress,
      extractionPhase: phase,
      progressMessage: message,
      loading: true,
      currentAnimation: 'loading'
    }));
  }, []);

  const startExtractionSequence = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      progress: 0,
      extractionPhase: 'analyzing',
      progressMessage: 'Starting extraction...',
      currentAnimation: 'reading'
    }));
  }, []);

  const completeExtractionSequence = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      progress: 100,
      extractionPhase: null,
      progressMessage: null,
      currentAnimation: 'success'
    }));
    
    // Return to idle after success animation
    setTimeout(() => {
      setState(prev => ({ ...prev, currentAnimation: 'idle', progress: 0 }));
    }, 2000);
  }, []);

  const failExtractionSequence = useCallback((errorMessage: string) => {
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      progress: 0,
      extractionPhase: null,
      progressMessage: null,
      error: errorMessage,
      currentAnimation: 'error'
    }));
    
    // Clear error after 3 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, error: null, currentAnimation: 'idle' }));
    }, 3000);
  }, []);

  // Click handler with enhanced extraction feedback
  const handleClick = useCallback(async () => {
    if (state.disabled || state.loading) return;
    
    setState(prev => ({ ...prev, currentAnimation: 'click' }));
    announceToScreenReader('Starting content extraction', 'assertive');
    
    // Reset animation after a short delay, then start extraction sequence
    setTimeout(async () => {
      if (onExtract) {
        startExtractionSequence();
        
        try {
          await onExtract();
          completeExtractionSequence();
          announceToScreenReader('Content extraction completed successfully', 'assertive');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
          failExtractionSequence(errorMessage);
          announceToScreenReader(`Extraction failed: ${errorMessage}`, 'assertive');
        }
      } else {
        setState(prev => ({ ...prev, currentAnimation: 'idle' }));
      }
    }, 200);
  }, [state.disabled, state.loading, onExtract, startExtractionSequence, completeExtractionSequence, failExtractionSequence, announceToScreenReader]);



  // Mouse event handlers for animations
  const handleMouseEnter = useCallback(() => {
    if (!state.isDragging && !state.loading) {
      setState(prev => ({ ...prev, currentAnimation: 'hover' }));
    }
  }, [state.isDragging, state.loading]);

  const handleMouseLeave = useCallback(() => {
    if (!state.isDragging && !state.loading) {
      setState(prev => ({ ...prev, currentAnimation: 'idle' }));
    }
  }, [state.isDragging, state.loading]);

  // Public methods for external control
  const show = useCallback(() => {
    setState(prev => ({ ...prev, visible: true }));
  }, []);

  const hide = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const setLoadingState = useCallback((loading: boolean) => {
    setState(prev => ({ 
      ...prev, 
      loading, 
      currentAnimation: loading ? 'loading' : 'idle' 
    }));
  }, []);

  const setProgressState = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }));
  }, []);

  const showError = useCallback((message: string) => {
    setState(prev => ({ 
      ...prev, 
      error: message, 
      loading: false, 
      currentAnimation: 'error' 
    }));
    
    // Clear error after 3 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, error: null, currentAnimation: 'idle' }));
    }, 3000);
  }, []);

  const showSuccess = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      success: true, 
      loading: false, 
      currentAnimation: 'success' 
    }));
    
    // Clear success after 2 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, success: false, currentAnimation: 'idle' }));
    }, 2000);
  }, []);

  // Handle right-click for context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    onOpenSettings?.();
  }, [onOpenSettings]);

  if (!state.visible) return null;

  const buttonSize = getButtonSize();
  const { isTouchDevice } = compatibilitySettings.device;
  const { reducedMotion, duration } = compatibilitySettings.animation;
  const { ariaLabels } = compatibilitySettings.accessibility;
  
  // Enhanced color schemes for accessibility
  const getButtonColors = () => {
    if (accessibilityState.highContrastActive) {
      if (state.error) return 'bg-red-700 hover:bg-red-800 border-2 border-white text-white';
      if (state.success) return 'bg-green-700 hover:bg-green-800 border-2 border-white text-white';
      return 'bg-blue-800 hover:bg-blue-900 border-2 border-white text-white';
    }
    
    if (state.error) return 'bg-red-500 hover:bg-red-600 text-white';
    if (state.success) return 'bg-green-500 hover:bg-green-600 text-white';
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };
  
  const getFocusStyles = () => {
    if (accessibilityState.highContrastActive) {
      return 'focus:ring-4 focus:ring-yellow-400 focus:ring-offset-4 focus:ring-offset-black';
    }
    return 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  };
  
  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: state.position.x,
        top: state.position.y,
        zIndex: config.zIndex,
        width: buttonSize,
        height: buttonSize
      }}
    >
      <Button
        ref={buttonRef}
        className={`
          pointer-events-auto
          rounded-full
          shadow-lg
          ${!reducedMotion ? 'transition-all' : ''}
          ${!reducedMotion ? `duration-${duration}ms` : ''}
          ${!reducedMotion ? `ease-in-out` : ''}
          focus:outline-none
          ${getFocusStyles()}
          ${getButtonColors()}
          ${accessibilityState.focusVisible && accessibilityState.keyboardMode ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
          ${state.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${!reducedMotion && state.isDragging ? 'scale-110' : ''}
          ${!reducedMotion && !state.isDragging ? 'hover:scale-105' : ''}
          ${state.loading && !reducedMotion ? 'animate-pulse' : ''}
          ${isTouchDevice ? 'active:scale-95' : ''}
          ${accessibilityState.dragMode === 'keyboard' ? 'ring-2 ring-purple-400' : ''}
          ${className}
        `}
        style={{
          width: buttonSize,
          height: buttonSize,
          minWidth: buttonSize,
          minHeight: buttonSize,
          touchAction: isTouchDevice ? 'none' : 'auto',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={state.disabled}
        aria-label={state.loading ? ariaLabels.loading : 
                   state.error ? ariaLabels.error : 
                   state.success ? ariaLabels.success : 
                   accessibility.ariaLabel}
        aria-description={`${accessibility.ariaDescription} ${accessibility.dragInstructions}`}
        aria-pressed={state.loading}
        aria-expanded={accessibilityState.helpVisible}
        aria-live={state.loading || state.error || state.success ? 'polite' : 'off'}
        aria-keyshortcuts={shortcuts.activate}
        aria-roledescription="Draggable extract button"
        role="button"
        tabIndex={compatibilitySettings.keyboard.enabled ? 0 : -1}
        title={`${accessibility.ariaLabel} (${shortcuts.activate}). Press H for help.`}
        data-keyboard-mode={accessibilityState.keyboardMode}
        data-drag-mode={accessibilityState.dragMode}
      >
        <AnimatedMascot
          animation={mapToMascotAnimation(state.extractionPhase || state.currentAnimation || 'idle')}
          size={60}
          imagePath="/mascot.png"
        />
      </Button>
      
      {/* Enhanced Progress indicator */}
      {state.loading && state.progress > 0 && (
        <>
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-pulse"
            style={{
              background: `conic-gradient(from 0deg, #3b82f6 ${state.progress * 3.6}deg, transparent ${state.progress * 3.6}deg)`,
              filter: 'drop-shadow(0 0 4px #3b82f6)'
            }}
          />
          {/* Progress percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(state.progress)}%
            </span>
          </div>
        </>
      )}
      
      {/* Progress message tooltip */}
      {state.progressMessage && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-pulse">
          {state.progressMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600" />
        </div>
      )}
      
      {/* Error tooltip */}
      {state.error && (
        <div className={`
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
          ${accessibilityState.highContrastActive ? 'bg-red-800 border-2 border-white' : 'bg-red-600'} 
          text-white text-sm rounded-lg shadow-lg whitespace-nowrap
        `}>
          {state.error}
          <div className={`
            absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent 
            ${accessibilityState.highContrastActive ? 'border-t-red-800' : 'border-t-red-600'}
          `} />
        </div>
      )}

      {/* Keyboard navigation help dialog */}
      {accessibilityState.helpVisible && (
        <div 
          ref={helpRef}
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 p-4 
            ${accessibilityState.highContrastActive ? 'bg-black border-2 border-white text-white' : 'bg-white border border-gray-300 text-gray-900'} 
            rounded-lg shadow-xl z-50 w-80 max-w-sm
          `}
          role="dialog"
          aria-labelledby="help-title"
          aria-describedby="help-content"
          tabIndex={-1}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 id="help-title" className="font-semibold text-lg">Keyboard Shortcuts</h3>
            <button
              onClick={hideHelp}
              className={`
                p-1 rounded 
                ${accessibilityState.highContrastActive ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-500'}
              `}
              aria-label="Close help dialog"
            >
              ✕
            </button>
          </div>
          <div id="help-content" className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Activate:</div>
              <div className="font-mono">{shortcuts.activate}</div>
              
              <div className="font-medium">Move:</div>
              <div className="font-mono">Arrow Keys</div>
              
              <div className="font-medium">Fast Move:</div>
              <div className="font-mono">Shift + Arrows</div>
              
              <div className="font-medium">Toggle Drag:</div>
              <div className="font-mono">D</div>
              
              <div className="font-medium">Help:</div>
              <div className="font-mono">H</div>
              
              <div className="font-medium">Cancel:</div>
              <div className="font-mono">Escape</div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs">
                Current mode: <span className="font-semibold capitalize">{accessibilityState.dragMode}</span>
              </p>
              {accessibilityState.dragMode === 'keyboard' && (
                <p className="text-xs mt-1 text-blue-600">
                  Use arrow keys to move the button position
                </p>
              )}
            </div>
          </div>
          <div className={`
            absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent 
            ${accessibilityState.highContrastActive ? 'border-t-black' : 'border-t-white'}
          `} />
        </div>
      )}

      {/* Drag mode indicator */}
      {accessibilityState.dragMode === 'keyboard' && (
        <div className={`
          absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 
          ${accessibilityState.highContrastActive ? 'bg-purple-800 border border-white' : 'bg-purple-600'} 
          text-white text-xs rounded whitespace-nowrap
        `}>
          Keyboard Drag Mode
        </div>
      )}

      {/* Screen reader only instructions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {accessibilityState.announceNext && (
          <span>{accessibilityState.announceNext}</span>
        )}
      </div>
    </div>
  );
};



// Export the component and its types
export type { 
  FloatingActionButtonProps, 
  ButtonConfiguration, 
  ButtonState, 
  MascotAnimationType,
  ExtractionPhase,
  Position 
};

// Export methods for external control
export const useFloatingActionButton = () => {
  const [buttonRef, setButtonRef] = useState<{
    show: () => void;
    hide: () => void;
    setLoadingState: (loading: boolean) => void;
    setProgressState: (progress: number) => void;
    setExtractionProgress: (phase: ExtractionPhase, progress: number) => void;
    startExtractionSequence: () => void;
    completeExtractionSequence: () => void;
    failExtractionSequence: (errorMessage: string) => void;
    showError: (message: string) => void;
    showSuccess: () => void;
  } | null>(null);

  return { buttonRef, setButtonRef };
};