# Orb Component Implementation

## Overview
A beautiful, theme-aware WebGL orb component has been integrated into the Landing page as the hero background element.

## Features Implemented

### 🎨 Theme-Aware Colors
- **Light Mode**: Jade green tint (hue: 160°)
- **Dark Mode**: Turquoise tint (hue: 180°)
- Automatically switches based on your theme context

### ⚡ Interactivity
- **Hover Intensity**: Set to 0.75 for enhanced visual feedback
- **Rotation on Hover**: Smooth rotation animation when hovering over the orb
- **Touch Support**: Works on mobile devices with touch events

### ✨ Aesthetic Enhancements
- **Moving Glints**: Four golden/amber glints that move in different patterns:
  - Glint 1: Circular orbit
  - Glint 2: Counter-circular orbit
  - Glint 3: Figure-8 pattern
  - Glint 4: Slower outer orbit
- Contrasting warm golden color against the cool jade/turquoise base

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
Main component file with:
- WebGL shader implementation
- Theme context integration
- Mouse and touch event handlers
- Responsive resize handling
- Performance optimizations

### 2. `src/components/Orb.css`
Styling with:
- Container positioning
- Mobile-responsive breakpoints
- Touch action optimizations
- Canvas styling

### 3. Updated `src/pages/Landing.jsx`
Integration of the Orb component:
- Positioned as background in hero section
- Centered and sized appropriately
- 40% opacity for subtle effect
- Non-interactive (pointer-events-none) to allow clicking through

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

To use the Orb component elsewhere:

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
const hue = isDarkMode ? 180 : 160; // Adjust these values
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

## Browser Support
- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge
- iOS Safari and Chrome for Android

## Troubleshooting

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

