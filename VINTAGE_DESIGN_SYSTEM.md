# LinguaSpark Vintage Design System

## Overview

LinguaSpark features a professional, vintage-inspired design that evokes the timeless quality of classic educational materials while maintaining modern usability. The design avoids generic AI-generated aesthetics in favor of a warm, scholarly aesthetic.

## Color Palette

### Primary Colors

- **Vintage Cream** (`--vintage-cream`): `hsl(45, 35%, 95%)` - Main background color
- **Vintage Cream Dark** (`--vintage-cream-dark`): `hsl(45, 30%, 90%)` - Secondary background
- **Vintage Brown** (`--vintage-brown`): `hsl(30, 25%, 25%)` - Primary text and borders
- **Vintage Burgundy** (`--vintage-burgundy`): `hsl(0, 45%, 35%)` - Accent color for CTAs
- **Vintage Gold** (`--vintage-gold`): `hsl(45, 80%, 55%)` - Highlight and decorative accents
- **Vintage Sage** (`--vintage-sage`): `hsl(120, 15%, 45%)` - Optional accent (future use)

### Usage Guidelines

- Use **Vintage Cream** for main backgrounds
- Use **Vintage Brown** for primary text, headings, and borders
- Use **Vintage Burgundy** for primary actions and important elements
- Use **Vintage Gold** for highlights, badges, and decorative elements
- Maintain high contrast ratios for accessibility (WCAG AA minimum)

## Typography

### Font Families

- **Serif (Merriweather)**: Used for headings, titles, and emphasis
  - Weights: 300 (Light), 400 (Regular), 700 (Bold), 900 (Black)
  - Variable: `--font-serif`
  - Usage: `font-serif` class

- **Serif Alt (Lora)**: Alternative serif for variety
  - Weights: 400, 500, 600, 700
  - Variable: `--font-serif-alt`

- **Sans-serif (Inter)**: Used for body text and UI elements
  - Variable: `--font-inter`
  - Usage: `font-sans` class (default)

### Typography Scale

- **Hero Heading**: `text-6xl md:text-7xl font-serif font-bold` (60-72px)
- **Page Heading**: `text-5xl font-serif font-bold` (48px)
- **Section Heading**: `text-4xl font-serif font-bold` (36px)
- **Card Heading**: `text-3xl font-serif font-bold` (30px)
- **Subheading**: `text-2xl font-serif font-bold` (24px)
- **Body Large**: `text-xl` (20px)
- **Body**: `text-base` (16px)
- **Body Small**: `text-sm` (14px)

## Components

### Vintage Card

```tsx
<div className="vintage-card">
  {/* Content */}
</div>
```

**Styles:**
- 3px solid border in Vintage Brown
- Cream background
- 4px offset shadow
- Hover: Lifts up with enhanced shadow
- Border radius: 0.5rem

### Vintage Buttons

#### Primary Button
```tsx
<button className="vintage-button-primary">
  Get Started
</button>
```

**Styles:**
- Burgundy background
- Cream text
- 3px Brown border
- Offset shadow effect
- Serif font, bold weight

#### Secondary Button
```tsx
<button className="vintage-button-secondary">
  Learn More
</button>
```

**Styles:**
- Cream background
- Brown text
- 3px Brown border
- Lighter shadow

#### Light Button (for dark backgrounds)
```tsx
<button className="vintage-button-light">
  Start Now
</button>
```

**Styles:**
- Cream background
- Burgundy text
- 3px Gold border
- Gold shadow

### Decorative Elements

#### Vintage Pattern Background
```tsx
<div className="bg-vintage-pattern opacity-5">
  {/* Subtle crosshatch pattern */}
</div>
```

#### Border Accents
- Use 2-4px solid borders for emphasis
- Combine with gradient borders for special sections:
  ```tsx
  <div className="border-b-4 border-vintage-brown">
    <div className="h-1 bg-gradient-to-r from-vintage-gold via-vintage-burgundy to-vintage-gold" />
  </div>
  ```

## Layout Patterns

### Hero Section
- Full-width with pattern background
- Centered content, max-width 4xl
- Badge/pill for category
- Large serif heading
- Descriptive subtext
- CTA buttons (primary + secondary)
- Decorative border at bottom

### Feature Grid
- 2-3 column grid on desktop
- Vintage cards with icons
- Hover effects for interactivity
- Consistent spacing (gap-8)

### Step-by-Step Section
- Numbered circles with gold borders
- Large serif headings
- Descriptive text
- Vertical layout with generous spacing

## Accessibility

### Contrast Ratios
- Vintage Brown on Cream: 8.5:1 (AAA)
- Vintage Burgundy on Cream: 7.2:1 (AAA)
- Ensure all text meets WCAG AA minimum (4.5:1)

### Interactive Elements
- Clear focus states with visible outlines
- Sufficient touch target sizes (44x44px minimum)
- Hover states that don't rely solely on color
- Keyboard navigation support

### Motion
- Respect `prefers-reduced-motion`
- Subtle animations (transform, shadow)
- No auto-playing animations

## Implementation

### Using Vintage Classes

```tsx
// Background colors
<div className="bg-vintage-cream">
<div className="bg-vintage-brown">

// Text colors
<h1 className="text-vintage-brown">
<p className="text-vintage-brown/70"> {/* 70% opacity */}

// Borders
<div className="border-2 border-vintage-brown">
<div className="border-vintage-gold">

// Complete card example
<div className="vintage-card hover:shadow-vintage-lg">
  <h3 className="font-serif text-2xl font-bold text-vintage-brown mb-3">
    Card Title
  </h3>
  <p className="text-vintage-brown/70">
    Card description text
  </p>
</div>
```

### Page Structure Template

```tsx
export default function VintagePage() {
  return (
    <div className="min-h-screen bg-vintage-cream">
      {/* Header */}
      <header className="border-b-3 border-vintage-brown bg-vintage-cream-dark">
        <div className="container mx-auto px-6 py-4">
          <h1 className="font-serif text-3xl font-bold text-vintage-brown">
            LinguaSpark
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Your content */}
      </main>

      {/* Footer */}
      <footer className="bg-vintage-brown text-vintage-cream py-8 border-t-4 border-vintage-gold">
        <div className="container mx-auto px-6 text-center">
          <p className="font-serif">LinguaSpark</p>
        </div>
      </footer>
    </div>
  );
}
```

## Design Principles

1. **Timeless Over Trendy**: Classic design elements that won't feel dated
2. **Warmth Over Sterility**: Cream tones and serif fonts create approachability
3. **Substance Over Flash**: Meaningful interactions, not gratuitous animations
4. **Clarity Over Complexity**: Clear hierarchy and generous whitespace
5. **Crafted Over Generated**: Intentional design choices that feel human-made

## Navigation

### Navbar Component

The sticky navbar features:
- Vintage cream background with brown border
- Logo with Sparkles icon
- Navigation links (Features, How It Works)
- Primary CTA button with Chrome icon
- Shadow effect for depth
- Sticky positioning (z-50)

```tsx
<nav className="sticky top-0 z-50 bg-vintage-cream border-b-3 border-vintage-brown shadow-vintage">
  <div className="container mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-vintage-burgundy" />
        <div>
          <h1 className="font-serif text-2xl font-bold text-vintage-brown">
            LinguaSpark
          </h1>
          <p className="text-xs text-vintage-brown/60">Chrome Extension</p>
        </div>
      </div>
      {/* Nav items */}
    </div>
  </div>
</nav>
```

## Chrome Extension Emphasis

Throughout the design, emphasize the Chrome extension nature:
- Use Chrome icon in CTAs and badges
- Include "Chrome Extension" subtitle in branding
- Show browser-based benefits prominently
- Use extension-specific language ("Install", "Launch", "One-Click")

## Future Enhancements

- Dark mode variant with inverted vintage palette
- Additional accent colors for different lesson types
- Vintage-inspired illustrations and icons
- Textured backgrounds for premium feel
- Animated transitions between sections
- Chrome Web Store badges and links
