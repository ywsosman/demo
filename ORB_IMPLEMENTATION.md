# Orb Component Implementation

## Overview
A beautiful, theme-aware WebGL orb component with animated ambient background has been integrated into the Landing page as the hero background element. The system features a stunning blurry gradient backdrop that complements the orb's colors and creates an immersive aesthetic experience.

## Features Implemented

### 🎨 Theme-Aware Colors
- **Light Mode**: Blue/Cyan and shades of blue (hue: 190°)
  - Orb displays vibrant cyan and sky blue tones
  - Ambient background: Soft blue/cyan blurred gradients
- **Dark Mode**: Mint/Green and its shades (hue: 150°)
  - Orb displays refreshing mint and emerald tones
  - Ambient background: Smooth mint/green blurred gradients
- Automatically switches based on your theme context

### 🌫️ Ambient Background
- **Blurry Gradient Backdrop**: Animated radial gradient that pulses and moves
- **Multiple Gradient Blobs**: Three floating gradient spheres at different positions
- **Smooth Animations**: Gentle floating motion for organic feel
- **Heavy Blur Effects**: 80px blur on main gradient, 60px on blobs for dreamy aesthetic
- **Theme-Matched Colors**: Perfectly complements the orb's color scheme
- **Responsive Design**: Adjusts blur and size based on screen size

### ⚡ Interactivity
- **Hover Intensity**: Set to 0.75 for enhanced visual feedback
- **Rotation on Hover**: Smooth rotation animation when hovering over the orb
- **Full Touch Support**: 
  - Detects finger taps (touchstart)
  - Tracks continuous finger movements (touchmove)
  - Responds to touch drag gestures
  - Handles touch cancellation for interrupted gestures
  - Prevents scrolling when touching the orb

### ✨ Aesthetic Enhancements
- **Moving Glints**: Four golden/amber glints that move in different patterns:
  - Glint 1: Circular orbit
  - Glint 2: Counter-circular orbit
  - Glint 3: Figure-8 pattern
  - Glint 4: Slower outer orbit
- Contrasting warm golden color against the cool blue/cyan and mint/green base

### 📱 Responsive Design
- Adapts to desktop and mobile devices
- Optimized performance with capped device pixel ratio
- Responsive sizing:
  - Mobile: 200px min height
  - Tablet: 250px min height
  - Desktop: Full hero section height
- Touch-friendly with proper event handling

## Files Created

### 1. `src/components/Orb.jsx`
Main WebGL orb component with:
- WebGL shader implementation
- Theme context integration
- Mouse and touch event handlers
- Responsive resize handling
- Performance optimizations

### 2. `src/components/Orb.css`
Orb styling with:
- Container positioning
- Mobile-responsive breakpoints
- Touch action optimizations
- Canvas styling

### 3. `src/components/OrbAmbience.jsx`
Ambient background component that renders:
- Main animated gradient backdrop
- Three floating gradient blobs
- Theme-aware color system

### 4. `src/components/OrbAmbience.css`
Ambient styling with:
- Heavy blur effects (80px main, 60px blobs)
- Radial gradient definitions for both themes
- Smooth floating animations
- Responsive blur and size adjustments

### 5. `src/pages/Landing.jsx`
Integration of Orb and OrbAmbience components:
- OrbAmbience positioned as deepest background layer
- Orb layered on top with 40% opacity
- Centered and sized appropriately for hero section
- Interactive with mouse and touch detection enabled
- Creates stunning layered visual effect

## Component Props

```jsx
<Orb 
  hoverIntensity={0.75}      // Intensity of hover effect (0-1)
  rotateOnHover={true}        // Enable/disable rotation
  forceHoverState={false}     // Force hover state (for demos)
/>
```

## Technical Details

### Dependencies
- **ogl**: Lightweight WebGL library (version 1.0.11)
- Automatically installed via npm

### Touch Event Handling
- **touchstart**: Initiates hover effect on tap
- **touchmove**: Continuously tracks finger position with preventDefault to avoid scrolling
- **touchend**: Resets hover state when finger lifts
- **touchcancel**: Handles interrupted gestures gracefully
- Events use `{ passive: false }` option for proper preventDefault support

### Shader Features
- Custom GLSL shaders for advanced visual effects
- Simplex noise for organic movement
- Multiple light sources for depth
- YIQ color space for accurate hue shifting
- Real-time glint animations

### Performance Optimizations
- Device pixel ratio capped at 2x for mobile
- Efficient requestAnimationFrame loop
- Proper cleanup on unmount
- WebGL context loss handling

## Usage in Other Pages

To use the Orb with ambient background elsewhere:

```jsx
import Orb from '../components/Orb';
import OrbAmbience from '../components/OrbAmbience';

function MyPage() {
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      {/* Ambient background */}
      <OrbAmbience />
      
      {/* Orb on top */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Orb
          hoverIntensity={0.75}
          rotateOnHover={true}
          forceHoverState={false}
        />
      </div>
    </div>
  );
}
```

To use just the Orb without ambient background:

```jsx
import Orb from '../components/Orb';

function MyPage() {
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <Orb
        hoverIntensity={0.75}
        rotateOnHover={true}
        forceHoverState={false}
      />
    </div>
  );
}
```

## Customization

### Adjusting Colors
Colors automatically adjust based on theme. To change the hue values, edit `Orb.jsx`:

```javascript
// Line ~14 in Orb.jsx
const hue = isDarkMode ? 150 : 190; // Adjust these values
// Light mode: 190 (blue/cyan), Dark mode: 150 (mint/green)
```

### Modifying Glints
Glint colors, positions, and behaviors can be adjusted in the shader code:

```glsl
// In the fragment shader
vec3 glintColor = vec3(1.0, 0.8, 0.3); // RGB values (0-1)
```

### Changing Hover Behavior
Adjust the hover intensity prop or modify rotation speed:

```javascript
// Line ~247 in Orb.jsx
const rotationSpeed = 0.3; // Adjust rotation speed
```

### Customizing Ambient Background

#### Adjust Blur Intensity
Edit `OrbAmbience.css`:

```css
.orb-ambience-gradient {
  filter: blur(80px); /* Increase for more blur, decrease for sharper */
}

.orb-ambience-blob-1,
.orb-ambience-blob-2,
.orb-ambience-blob-3 {
  filter: blur(60px); /* Adjust blob blur */
}
```

#### Change Ambient Colors
For light mode blue/cyan:
```css
.light .orb-ambience-gradient {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(56, 189, 248, 0.4) 0%,  /* Modify these RGB values */
    /* ... */
  );
}
```

For dark mode mint/green:
```css
.dark .orb-ambience-gradient {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(52, 211, 153, 0.4) 0%,  /* Modify these RGB values */
    /* ... */
  );
}
```

#### Adjust Animation Speed
```css
.orb-ambience-gradient {
  animation: ambience-float 20s ease-in-out infinite; /* Change 20s */
}

.orb-ambience-blob-1 {
  animation: blob-float-1 15s ease-in-out infinite; /* Change 15s */
}
```

## Browser Support
- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge
- iOS Safari and Chrome for Android

## Troubleshooting

### Mouse or touch not detected by orb
- The orb container needs `pointer-events-auto` class to enable mouse/touch interaction
- Ensure parent containers don't have `pointer-events-none` blocking events
- Touch events are set to `{ passive: false }` for proper preventDefault support
- This is already fixed in the Landing.jsx integration

### Touch interaction causes page scrolling
- The orb now prevents default touch behavior with `preventDefault()`
- If scrolling is still an issue, check that CSS `touch-action: none` is applied to `.orb-container`
- This is already configured in the Orb.css file

### Orb not appearing
- Check browser console for WebGL errors
- Ensure ogl package is installed: `npm install ogl`
- Verify ThemeContext is available

### Performance issues on mobile
- Device pixel ratio is already capped at 2x
- Consider reducing orb size on mobile
- Check for other heavy animations on the page

### Theme not switching
- Ensure ThemeContext is properly wrapped around the app
- Check localStorage for theme persistence
- Verify dark mode classes are applied to `<html>` element

## Future Enhancements
- Add color customization props
- Implement additional glint patterns
- Add intensity controls for individual effects
- Create presets for different moods/themes

