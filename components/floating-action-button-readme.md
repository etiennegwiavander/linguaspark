# FloatingActionButton Component

## Overview

The FloatingActionButton is a React component that provides a draggable, accessible floating action button with the Sparky mascot character. It's designed for the LinguaSpark Chrome extension to allow users to extract content from webpages for lesson generation.

## Features Implemented

### ✅ Core Functionality
- **Draggable Button**: Fully draggable with mouse and touch support
- **Smart Positioning**: Edge snapping and collision detection with page elements
- **Position Persistence**: Remembers position per domain using localStorage
- **Responsive Sizing**: 64px on desktop, 56px on mobile viewports

### ✅ Sparky Mascot
- **Lightning Bolt Design**: SVG-based character with animated expressions
- **Animation States**: Idle, hover, click, loading, success, error, drag
- **Personality Traits**: Blinking, looking around, bouncing animations
- **Spark Effects**: Trail effects during drag, celebration sparks on success

### ✅ Accessibility Features
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Alt+E shortcut, arrow key movement, Enter/Space activation
- **High Contrast Support**: CSS media query support for accessibility
- **Reduced Motion**: Respects user's motion preferences
- **Touch Friendly**: Optimized for mobile and tablet interactions

### ✅ Advanced Features
- **Collision Detection**: Avoids overlapping with fixed page elements
- **Edge Snapping**: Automatically snaps to screen edges when close
- **Progress Indicators**: Visual progress feedback during operations
- **Error Handling**: User-friendly error states with recovery options
- **Configuration**: Customizable size, position, animations, and behavior

## Component Structure

```typescript
interface FloatingActionButtonProps {
  onExtract?: () => void;
  configuration?: Partial<ButtonConfiguration>;
  className?: string;
}
```

### Configuration Options

```typescript
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
}
```

## Usage Examples

### Basic Usage
```tsx
import { FloatingActionButton } from '@/components/floating-action-button';

function MyComponent() {
  const handleExtract = () => {
    console.log('Extract content clicked');
  };

  return (
    <FloatingActionButton onExtract={handleExtract} />
  );
}
```

### Custom Configuration
```tsx
<FloatingActionButton
  onExtract={handleExtract}
  configuration={{
    size: 'large',
    dragEnabled: true,
    snapToEdges: true,
    keyboardShortcut: 'Alt+E',
    animationSpeed: 'fast'
  }}
/>
```

### Using the Hook for External Control
```tsx
import { useFloatingActionButton } from '@/components/floating-action-button';

function ParentComponent() {
  const { buttonRef } = useFloatingActionButton();

  const showLoading = () => {
    buttonRef?.setLoadingState(true);
  };

  const showError = () => {
    buttonRef?.showError('Extraction failed');
  };

  return (
    <FloatingActionButton
      onExtract={handleExtract}
      ref={buttonRef}
    />
  );
}
```

## Sparky Animation States

| State | Description | Visual Effect |
|-------|-------------|---------------|
| `idle` | Default state | Gentle floating with occasional blinks |
| `hover` | Mouse over | Excited bounce with sparkles |
| `click` | Button pressed | Quick flash and wink |
| `loading` | Processing | Spinning with determined expression |
| `success` | Completed successfully | Celebration bounce with confetti |
| `error` | Failed operation | Sad droop with concerned eyes |
| `drag` | Being dragged | Trail sparks with focused expression |

## Accessibility Features

### Keyboard Navigation
- **Alt+E**: Focus the button
- **Arrow Keys**: Move button position (when focused)
- **Enter/Space**: Activate button
- **Escape**: Remove focus

### Screen Reader Support
- Comprehensive ARIA labels and descriptions
- Announces state changes and progress
- Provides drag instructions for assistive technology

### Visual Accessibility
- High contrast mode support
- Respects reduced motion preferences
- Touch-friendly sizing on mobile devices
- Clear visual feedback for all states

## Browser Compatibility

- ✅ Chrome (full support)
- ✅ Chromium-based browsers (Edge, Brave, Opera)
- ✅ Responsive design for all screen sizes
- ✅ Touch device support
- ✅ Keyboard navigation
- ✅ Screen reader compatibility

## Performance Optimizations

- **Throttled Analysis**: Prevents excessive DOM queries
- **Event Cleanup**: Proper cleanup of event listeners
- **Memory Management**: Efficient state management
- **CSS Animations**: Hardware-accelerated animations
- **Collision Caching**: Optimized collision detection

## Testing

The component includes comprehensive unit tests covering:
- Position calculation and bounds checking
- Keyboard shortcut handling
- Animation state transitions
- Configuration merging
- Collision detection logic
- Accessibility features validation

Run tests with:
```bash
npm test -- --run floating-action-button.test.ts
```

## Requirements Fulfilled

This implementation fulfills all requirements from task 2:

- ✅ **1.3**: Draggable functionality with position persistence
- ✅ **1.4**: Sparky mascot with animated expressions
- ✅ **1.5**: Comprehensive accessibility features
- ✅ **1.6**: Smart positioning and collision detection
- ✅ **7.3**: Responsive sizing for different viewports
- ✅ **7.4**: Touch-friendly interactions
- ✅ **7.5**: Keyboard navigation support
- ✅ **7.6**: Screen reader compatibility

## Next Steps

The component is ready for integration with:
1. Content analysis engine (Task 1)
2. Content extraction functionality (Task 4)
3. Lesson generation interface (Task 10)

The component provides all the necessary hooks and callbacks for seamless integration with the broader extract-from-page feature.