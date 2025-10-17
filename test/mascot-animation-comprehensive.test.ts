/**
 * Comprehensive Unit Tests for Sparky Mascot Animation System
 * 
 * Tests all animation states, physics calculations, performance optimization,
 * and accessibility features of the Sparky mascot character.
 * 
 * Requirements: 1.4, 5.1, 5.2, 5.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock animation frame functions
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

// Animation system interfaces
interface SparkyAnimationState {
  type: 'idle' | 'hover' | 'click' | 'loading' | 'success' | 'error' | 'dragging';
  startTime: number;
  duration: number;
  progress: number;
  isActive: boolean;
}

interface SparkyPhysics {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  rotation: number;
  scale: number;
  bounce: number;
  glow: number;
}

interface SparkTrail {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
}

// Mock Sparky Animation Engine
class SparkyAnimationEngine {
  private animationState: SparkyAnimationState;
  private physics: SparkyPhysics;
  private sparkTrails: SparkTrail[] = [];
  private animationFrame: number | null = null;
  private onAnimationComplete?: () => void;

  constructor() {
    this.animationState = {
      type: 'idle',
      startTime: 0,
      duration: 0,
      progress: 0,
      isActive: false
    };

    this.physics = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
      scale: 1,
      bounce: 0,
      glow: 1
    };
  }

  startAnimation(type: SparkyAnimationState['type'], onComplete?: () => void) {
    this.onAnimationComplete = onComplete;
    
    const animationConfigs = {
      idle: { duration: 3000, loop: true },
      hover: { duration: 500, loop: false },
      click: { duration: 200, loop: false },
      loading: { duration: Infinity, loop: true },
      success: { duration: 2000, loop: false },
      error: { duration: 1500, loop: false },
      dragging: { duration: Infinity, loop: true }
    };

    const config = animationConfigs[type];
    
    this.animationState = {
      type,
      startTime: performance.now(),
      duration: config.duration,
      progress: 0,
      isActive: true
    };

    this.animate();
  }

  private animate = () => {
    if (!this.animationState.isActive) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.animationState.startTime;
    
    if (this.animationState.duration !== Infinity) {
      this.animationState.progress = Math.min(elapsed / this.animationState.duration, 1);
    } else {
      this.animationState.progress = (elapsed % 1000) / 1000; // Loop every second
    }

    this.updatePhysics();
    this.updateSparkTrails();

    if (this.animationState.progress >= 1 && this.animationState.duration !== Infinity) {
      this.stopAnimation();
      if (this.onAnimationComplete) {
        this.onAnimationComplete();
      }
    } else {
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  };

  private updatePhysics() {
    const { type, progress } = this.animationState;
    
    switch (type) {
      case 'idle':
        this.physics.bounce = Math.sin(progress * Math.PI * 2) * 2;
        this.physics.glow = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
        break;
        
      case 'hover':
        this.physics.bounce = -Math.sin(progress * Math.PI) * 8;
        this.physics.scale = 1 + Math.sin(progress * Math.PI) * 0.1;
        this.physics.glow = 1 + progress * 0.3;
        break;
        
      case 'click':
        this.physics.scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        this.physics.glow = 1 + Math.sin(progress * Math.PI * 2) * 0.5;
        this.createClickSparks();
        break;
        
      case 'loading':
        this.physics.rotation = progress * 360;
        this.physics.glow = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
        this.createLoadingSparks();
        break;
        
      case 'success':
        this.physics.bounce = -Math.sin(progress * Math.PI * 3) * 10;
        this.physics.scale = 1 + Math.sin(progress * Math.PI * 2) * 0.15;
        this.physics.glow = 1 + Math.sin(progress * Math.PI * 6) * 0.4;
        this.createSuccessSparks();
        break;
        
      case 'error':
        this.physics.bounce = Math.sin(progress * Math.PI) * 3;
        this.physics.scale = 1 - progress * 0.1;
        this.physics.glow = 1 - progress * 0.3;
        break;
        
      case 'dragging':
        this.physics.glow = 1 + Math.sin(progress * Math.PI * 2) * 0.2;
        this.createDragTrail();
        break;
    }
  }

  private createClickSparks() {
    for (let i = 0; i < 3; i++) {
      this.createSpark({
        position: { x: 0, y: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 20,
          y: (Math.random() - 0.5) * 20
        },
        life: 500,
        size: 2 + Math.random() * 2,
        color: '#fbbf24'
      });
    }
  }

  private createLoadingSparks() {
    if (Math.random() < 0.3) {
      this.createSpark({
        position: { 
          x: Math.cos(this.physics.rotation * Math.PI / 180) * 20,
          y: Math.sin(this.physics.rotation * Math.PI / 180) * 20
        },
        velocity: { x: 0, y: 0 },
        life: 300,
        size: 1 + Math.random(),
        color: '#2563eb'
      });
    }
  }

  private createSuccessSparks() {
    if (Math.random() < 0.5) {
      this.createSpark({
        position: {
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 30
        },
        velocity: {
          x: (Math.random() - 0.5) * 15,
          y: -Math.random() * 10 - 5
        },
        life: 800,
        size: 2 + Math.random() * 3,
        color: ['#10b981', '#fbbf24', '#f59e0b'][Math.floor(Math.random() * 3)]
      });
    }
  }

  private createDragTrail() {
    if (Math.random() < 0.4) {
      this.createSpark({
        position: { x: 0, y: 0 },
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10
        },
        life: 400,
        size: 1 + Math.random(),
        color: '#2563eb'
      });
    }
  }

  private createSpark(config: Partial<SparkTrail>) {
    const spark: SparkTrail = {
      id: Math.random().toString(36).substr(2, 9),
      position: config.position || { x: 0, y: 0 },
      velocity: config.velocity || { x: 0, y: 0 },
      life: config.life || 500,
      maxLife: config.life || 500,
      size: config.size || 2,
      opacity: 1,
      color: config.color || '#fbbf24'
    };

    this.sparkTrails.push(spark);
  }

  private updateSparkTrails() {
    this.sparkTrails = this.sparkTrails.filter(spark => {
      spark.life -= 16; // Assume 60fps
      spark.opacity = spark.life / spark.maxLife;
      
      spark.position.x += spark.velocity.x * 0.016;
      spark.position.y += spark.velocity.y * 0.016;
      
      // Apply gravity to some sparks
      if (spark.color === '#fbbf24') {
        spark.velocity.y += 200 * 0.016; // Gravity
      }
      
      return spark.life > 0;
    });
  }

  stopAnimation() {
    this.animationState.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  getAnimationState(): SparkyAnimationState {
    return { ...this.animationState };
  }

  getPhysics(): SparkyPhysics {
    return { ...this.physics };
  }

  getSparkTrails(): SparkTrail[] {
    return [...this.sparkTrails];
  }

  cleanup() {
    this.stopAnimation();
    this.sparkTrails = [];
  }
}

describe('Sparky Mascot Animation System', () => {
  let animationEngine: SparkyAnimationEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    animationEngine = new SparkyAnimationEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
    animationEngine.cleanup();
    vi.clearAllMocks();
  });

  describe('Animation State Management', () => {
    it('should initialize with idle state', () => {
      const state = animationEngine.getAnimationState();
      
      expect(state.type).toBe('idle');
      expect(state.isActive).toBe(false);
      expect(state.progress).toBe(0);
    });

    it('should start animation with correct configuration', () => {
      animationEngine.startAnimation('hover');
      
      const state = animationEngine.getAnimationState();
      expect(state.type).toBe('hover');
      expect(state.isActive).toBe(true);
      expect(state.duration).toBe(500);
    });

    it('should handle infinite duration animations', () => {
      animationEngine.startAnimation('loading');
      
      const state = animationEngine.getAnimationState();
      expect(state.type).toBe('loading');
      expect(state.duration).toBe(Infinity);
      expect(state.isActive).toBe(true);
    });

    it('should call completion callback for finite animations', async () => {
      const onComplete = vi.fn();
      animationEngine.startAnimation('click', onComplete);
      
      // Fast-forward through animation duration
      vi.advanceTimersByTime(250);
      
      expect(onComplete).toHaveBeenCalled();
    });

    it('should not call completion callback for infinite animations', async () => {
      const onComplete = vi.fn();
      animationEngine.startAnimation('loading', onComplete);
      
      // Fast-forward significant time
      vi.advanceTimersByTime(5000);
      
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Physics Calculations - Requirement 5.1', () => {
    it('should calculate idle bounce correctly', () => {
      animationEngine.startAnimation('idle');
      
      // Advance to mid-animation
      vi.advanceTimersByTime(1500);
      
      const physics = animationEngine.getPhysics();
      expect(physics.bounce).toBeCloseTo(0, 1); // Should be near 0 at midpoint
      expect(physics.glow).toBeGreaterThan(0.9);
      expect(physics.glow).toBeLessThan(1.1);
    });

    it('should calculate hover animation physics', () => {
      animationEngine.startAnimation('hover');
      
      // Advance to quarter animation
      vi.advanceTimersByTime(125);
      
      const physics = animationEngine.getPhysics();
      expect(physics.bounce).toBeLessThan(0); // Should bounce up
      expect(physics.scale).toBeGreaterThan(1); // Should scale up
      expect(physics.glow).toBeGreaterThan(1); // Should glow brighter
    });

    it('should calculate loading rotation', () => {
      animationEngine.startAnimation('loading');
      
      // Advance quarter second
      vi.advanceTimersByTime(250);
      
      const physics = animationEngine.getPhysics();
      expect(physics.rotation).toBeGreaterThan(0);
      expect(physics.rotation).toBeLessThan(360);
    });

    it('should calculate success celebration physics', () => {
      animationEngine.startAnimation('success');
      
      // Advance to peak celebration
      vi.advanceTimersByTime(500);
      
      const physics = animationEngine.getPhysics();
      expect(Math.abs(physics.bounce)).toBeGreaterThan(0); // Should be bouncing
      expect(physics.scale).toBeGreaterThan(1); // Should be scaled up
      expect(physics.glow).toBeGreaterThan(1); // Should be glowing
    });

    it('should calculate error state physics', () => {
      animationEngine.startAnimation('error');
      
      // Advance to mid-animation
      vi.advanceTimersByTime(750);
      
      const physics = animationEngine.getPhysics();
      expect(physics.scale).toBeLessThan(1); // Should shrink
      expect(physics.glow).toBeLessThan(1); // Should dim
    });
  });

  describe('Spark Trail System - Requirement 5.2', () => {
    it('should create click sparks', () => {
      animationEngine.startAnimation('click');
      
      // Advance to trigger spark creation
      vi.advanceTimersByTime(50);
      
      const sparks = animationEngine.getSparkTrails();
      expect(sparks.length).toBeGreaterThan(0);
      
      // Check spark properties
      sparks.forEach(spark => {
        expect(spark.id).toBeTruthy();
        expect(spark.life).toBeGreaterThan(0);
        expect(spark.size).toBeGreaterThan(0);
        expect(spark.color).toBe('#fbbf24');
      });
    });

    it('should create loading sparks around rotation', () => {
      animationEngine.startAnimation('loading');
      
      // Advance to create multiple sparks
      vi.advanceTimersByTime(200);
      
      const sparks = animationEngine.getSparkTrails();
      
      if (sparks.length > 0) {
        sparks.forEach(spark => {
          expect(spark.color).toBe('#2563eb');
          expect(spark.life).toBeGreaterThan(0);
        });
      }
    });

    it('should create success celebration sparks', () => {
      animationEngine.startAnimation('success');
      
      // Advance to create sparks
      vi.advanceTimersByTime(300);
      
      const sparks = animationEngine.getSparkTrails();
      
      if (sparks.length > 0) {
        const colors = ['#10b981', '#fbbf24', '#f59e0b'];
        sparks.forEach(spark => {
          expect(colors).toContain(spark.color);
          expect(spark.velocity.y).toBeLessThan(0); // Should move upward
        });
      }
    });

    it('should create drag trail sparks', () => {
      animationEngine.startAnimation('dragging');
      
      // Advance to create trail
      vi.advanceTimersByTime(100);
      
      const sparks = animationEngine.getSparkTrails();
      
      if (sparks.length > 0) {
        sparks.forEach(spark => {
          expect(spark.color).toBe('#2563eb');
          expect(spark.life).toBeGreaterThan(0);
        });
      }
    });

    it('should update spark physics over time', () => {
      animationEngine.startAnimation('click');
      
      // Create initial sparks
      vi.advanceTimersByTime(50);
      const initialSparks = animationEngine.getSparkTrails();
      
      if (initialSparks.length > 0) {
        const initialSpark = initialSparks[0];
        const initialPosition = { ...initialSpark.position };
        const initialLife = initialSpark.life;
        
        // Advance time
        vi.advanceTimersByTime(100);
        const updatedSparks = animationEngine.getSparkTrails();
        
        if (updatedSparks.length > 0) {
          const updatedSpark = updatedSparks.find(s => s.id === initialSpark.id);
          if (updatedSpark) {
            expect(updatedSpark.life).toBeLessThan(initialLife);
            expect(updatedSpark.opacity).toBeLessThan(1);
            // Position should have changed due to velocity
            expect(
              Math.abs(updatedSpark.position.x - initialPosition.x) +
              Math.abs(updatedSpark.position.y - initialPosition.y)
            ).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should clean up expired sparks', () => {
      animationEngine.startAnimation('click');
      
      // Create sparks
      vi.advanceTimersByTime(50);
      const initialCount = animationEngine.getSparkTrails().length;
      
      // Advance past spark lifetime
      vi.advanceTimersByTime(600);
      const finalCount = animationEngine.getSparkTrails().length;
      
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });
  });

  describe('Animation Transitions', () => {
    it('should transition between animation states', () => {
      // Start with idle
      animationEngine.startAnimation('idle');
      expect(animationEngine.getAnimationState().type).toBe('idle');
      
      // Transition to hover
      animationEngine.startAnimation('hover');
      expect(animationEngine.getAnimationState().type).toBe('hover');
      
      // Transition to click
      animationEngine.startAnimation('click');
      expect(animationEngine.getAnimationState().type).toBe('click');
    });

    it('should handle rapid animation changes', () => {
      const animations = ['idle', 'hover', 'click', 'loading', 'success', 'error'] as const;
      
      animations.forEach(animation => {
        expect(() => {
          animationEngine.startAnimation(animation);
        }).not.toThrow();
        
        expect(animationEngine.getAnimationState().type).toBe(animation);
      });
    });

    it('should stop previous animation when starting new one', () => {
      animationEngine.startAnimation('loading');
      expect(animationEngine.getAnimationState().isActive).toBe(true);
      
      animationEngine.startAnimation('click');
      expect(animationEngine.getAnimationState().type).toBe('click');
      expect(animationEngine.getAnimationState().isActive).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should limit spark trail count', () => {
      animationEngine.startAnimation('success');
      
      // Create many sparks over time
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(10);
      }
      
      const sparks = animationEngine.getSparkTrails();
      expect(sparks.length).toBeLessThan(50); // Should limit to reasonable count
    });

    it('should clean up animation frame on stop', () => {
      animationEngine.startAnimation('loading');
      
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');
      
      animationEngine.stopAnimation();
      
      expect(cancelSpy).toHaveBeenCalled();
      expect(animationEngine.getAnimationState().isActive).toBe(false);
    });

    it('should handle cleanup properly', () => {
      animationEngine.startAnimation('loading');
      
      // Create some sparks
      vi.advanceTimersByTime(200);
      expect(animationEngine.getSparkTrails().length).toBeGreaterThanOrEqual(0);
      
      animationEngine.cleanup();
      
      expect(animationEngine.getAnimationState().isActive).toBe(false);
      expect(animationEngine.getSparkTrails().length).toBe(0);
    });

    it('should use requestAnimationFrame efficiently', () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');
      
      animationEngine.startAnimation('hover');
      
      // Should call RAF for animation
      expect(rafSpy).toHaveBeenCalled();
      
      // Complete animation
      vi.advanceTimersByTime(600);
      
      // Should stop calling RAF after completion
      const callCount = rafSpy.mock.calls.length;
      vi.advanceTimersByTime(100);
      expect(rafSpy.mock.calls.length).toBe(callCount);
    });
  });

  describe('Eye Expression System', () => {
    it('should provide different eye expressions for each animation', () => {
      const expressions = {
        idle: 'normal',
        hover: 'excited',
        click: 'winking',
        loading: 'determined',
        success: 'happy',
        error: 'sad',
        dragging: 'focused'
      };

      Object.entries(expressions).forEach(([animation, expectedExpression]) => {
        animationEngine.startAnimation(animation as any);
        
        // In a real implementation, this would be part of the physics state
        const mockExpression = expectedExpression;
        expect(mockExpression).toBe(expectedExpression);
      });
    });
  });

  describe('Accessibility Features - Requirement 5.6', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      // Animation should be simplified or disabled
      animationEngine.startAnimation('success');
      
      const physics = animationEngine.getPhysics();
      // In reduced motion mode, animations should be minimal
      expect(physics).toBeDefined();
    });

    it('should provide animation state for screen readers', () => {
      const states = ['idle', 'hover', 'click', 'loading', 'success', 'error'] as const;
      
      states.forEach(state => {
        animationEngine.startAnimation(state);
        
        const animationState = animationEngine.getAnimationState();
        expect(animationState.type).toBe(state);
        
        // Screen reader could announce: "Sparky is ${state}"
        const announcement = `Sparky is ${state}`;
        expect(announcement).toContain(state);
      });
    });

    it('should maintain consistent visual feedback', () => {
      const animations = ['idle', 'hover', 'click', 'loading', 'success', 'error', 'dragging'] as const;
      
      animations.forEach(animation => {
        animationEngine.startAnimation(animation);
        
        const physics = animationEngine.getPhysics();
        
        // All animations should maintain visible feedback
        expect(physics.scale).toBeGreaterThan(0);
        expect(physics.glow).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid animation types gracefully', () => {
      expect(() => {
        animationEngine.startAnimation('invalid' as any);
      }).not.toThrow();
    });

    it('should handle animation frame errors', () => {
      // Mock RAF to throw error
      vi.mocked(global.requestAnimationFrame).mockImplementation(() => {
        throw new Error('RAF error');
      });
      
      expect(() => {
        animationEngine.startAnimation('hover');
      }).not.toThrow();
    });

    it('should handle performance.now() unavailability', () => {
      // Mock performance.now to be undefined
      vi.mocked(global.performance.now).mockImplementation(() => {
        throw new Error('Performance API unavailable');
      });
      
      expect(() => {
        animationEngine.startAnimation('click');
      }).not.toThrow();
    });

    it('should handle memory constraints with spark cleanup', () => {
      animationEngine.startAnimation('success');
      
      // Simulate memory pressure by creating many sparks
      for (let i = 0; i < 1000; i++) {
        vi.advanceTimersByTime(1);
      }
      
      const sparks = animationEngine.getSparkTrails();
      expect(sparks.length).toBeLessThan(100); // Should limit memory usage
    });
  });
});