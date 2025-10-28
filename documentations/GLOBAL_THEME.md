# Global Theme Implementation

## Overview
The entire site now features a cohesive, theme-aware ambient background system that creates a stunning visual atmosphere across all pages. The theme uses blue/cyan tones for light mode and mint/green shades for dark mode, creating a consistent and immersive experience throughout the application.

## Color Scheme

### 🌞 Light Mode - Blue/Cyan Ambience
- **Base**: White background with subtle cyan and sky blue tints
- **Aurora Gradients**:
  - Cyan (400-500) with 30-35% opacity
  - Sky blue (400) with 20-25% opacity
  - Bright blue (400) with 20-25% opacity
- **Effect**: Fresh, clean, professional medical atmosphere
- **Matches**: Orb with blue/cyan hue (190°)

### 🌙 Dark Mode - Mint/Green Ambience
- **Base**: Dark gray (900) with subtle emerald undertones
- **Aurora Gradients**:
  - Emerald (400-600) with 15-25% opacity
  - Green (500-600) with 15-20% opacity
  - Mint/Jade tones for freshness
- **Effect**: Soothing, modern, eye-friendly dark interface
- **Matches**: Orb with mint/green hue (150°)

## Global Background System

### Fixed Background Layer
Located in: `src/components/AuroraBackground.jsx`

The background is:
- **Fixed positioned**: Stays in place while content scrolls
- **Z-index -10**: Always behind all content
- **Non-interactive**: Uses `pointer-events-none`
- **Full coverage**: Covers entire viewport

### Layering Structure
```
Application Layer Stack (bottom to top):
├── AuroraBackground (z-index: -10, fixed)
│   ├── Base gradient layer
│   ├── Aurora blob 1 (top-left)
│   ├── Aurora blob 2 (top-right)
│   ├── Aurora blob 3 (bottom-left)
│   ├── Aurora blob 4 (bottom-right)
│   ├── Central floating blob
│   └── Subtle grid overlay
├── Main content (z-index: 0, relative)
├── Navbar (z-index: higher)
└── Modals/Toasts (z-index: highest)
```

### Landing Page Additional Layer
On the landing page hero section, there's an extra ambient layer:
```
Landing Hero Section:
├── AuroraBackground (global, fixed)
├── OrbAmbience (section-specific, absolute)
├── Orb (interactive WebGL element)
└── Hero content (text, buttons)
```

## Visual Effects

### 5 Aurora Blobs
Each blob is an animated gradient sphere that:
- Floats and rotates independently
- Has different timing (20s, 25s, 30s, 22s, 35s)
- Uses heavy blur (3xl = ~64px)
- Fades from vibrant center to transparent edges

### Animations
- **aurora-1**: 20 seconds, gentle movement
- **aurora-2**: 25 seconds, slightly faster
- **aurora-3**: 30 seconds, slowest drift
- **aurora-4**: 22 seconds, medium pace
- **Reverse animation**: Central blob moves in opposite direction (35s)

All animations use `ease-in-out` for smooth, organic motion.

### Blur Effects
- **Aurora blobs**: `blur-3xl` (~64px) for dreamy effect
- **Base transitions**: Smooth 500ms color transitions
- **Grid overlay**: Minimal opacity (0.015 light, 0.03 dark)

## Pages Affected

The global theme applies to **ALL pages**:
- ✅ Landing page
- ✅ Login page
- ✅ Register page
- ✅ Patient Dashboard
- ✅ Doctor Dashboard
- ✅ Symptom Checker
- ✅ Diagnosis History
- ✅ Patient Profile
- ✅ Doctor Profile
- ✅ Doctor Patients
- ✅ All future pages

## Performance Optimizations

### Efficiency Measures
1. **Fixed positioning**: No repainting during scroll
2. **CSS animations**: Hardware-accelerated transforms
3. **Pointer-events-none**: No interaction overhead
4. **Opacity-based**: GPU-optimized rendering
5. **Single global instance**: No duplication per page

### Mobile Considerations
- Animations still run smoothly on mobile
- Blur effects work with hardware acceleration
- Low opacity prevents battery drain
- Minimal performance impact

## Customization

### Adjusting Global Theme Colors

#### For Light Mode (Blue/Cyan)
Edit `src/components/AuroraBackground.jsx`:

```jsx
// Change cyan/blue intensities
from-cyan-400/30  // Increase/decrease number after / for opacity
via-sky-400/20    // Adjust color intensity
```

#### For Dark Mode (Mint/Green)
```jsx
// Change green/emerald intensities
dark:from-emerald-500/25  // Adjust green tones
dark:via-green-500/15     // Modify mint shades
```

### Adjusting Animation Speed
```jsx
style={{
  animation: 'aurora-1 20s ease-in-out infinite',  // Change 20s
}}
```

Recommended ranges:
- Fast: 15-20 seconds
- Medium: 20-30 seconds
- Slow: 30-40 seconds

### Adjusting Blur Intensity
Change Tailwind classes:
- `blur-3xl` = ~64px (current, dreamy)
- `blur-2xl` = ~40px (medium, softer)
- `blur-xl` = ~24px (subtle, crisp)

### Disabling Grid Overlay
Remove or comment out this section:
```jsx
{/* Subtle grid overlay for depth - cyan tint */}
<div className="absolute inset-0 opacity-[0.015]" ... />
```

## Integration with Orb

The orb on the landing page perfectly complements the global theme:
- **Light mode**: Orb uses 190° hue (blue/cyan) matching the aurora
- **Dark mode**: Orb uses 150° hue (mint/green) matching the aurora
- **Golden glints**: Provide warm contrast against cool backgrounds
- **Layered effect**: Orb appears to float in the ambient atmosphere

## Browser Support
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari/iOS Safari (full support)
- ✅ Chrome for Android (full support)
- Requires: CSS backdrop-filter, transform animations

## Theme Switching
When users toggle between light and dark mode:
1. ThemeContext updates `isDarkMode` state
2. Root HTML element gets `dark` class
3. Tailwind dark: modifiers activate
4. CSS transitions smooth color changes (500ms)
5. All gradients fade to new color scheme
6. Orb automatically adjusts hue
7. Entire site transforms cohesively

## Accessibility
- ✅ Low contrast, doesn't interfere with text readability
- ✅ No flashing or rapid movements
- ✅ Respects reduced-motion preferences (can be added)
- ✅ Doesn't affect screen readers
- ✅ Maintains WCAG contrast ratios for text

## Future Enhancements
- Add reduced-motion media query support
- Create theme presets (Ocean, Forest, Sunset)
- Add user customization options
- Implement seasonal themes
- Add particle effects for extra flair

## Troubleshooting

### Background not visible
- Check that AuroraBackground is rendered in App.jsx
- Verify z-index: -10 is set
- Ensure parent containers allow fixed positioning

### Colors not switching with theme
- Verify ThemeProvider wraps the app
- Check that `dark:` classes are applied
- Ensure HTML element receives `dark` class

### Performance issues
- Reduce animation durations
- Decrease blur intensity
- Lower opacity values
- Disable some aurora blobs

### Background appears above content
- Check z-index values
- Ensure content has relative positioning
- Verify -z-10 class is applied

## Files Modified

### `src/components/AuroraBackground.jsx`
- Updated all gradient colors
- Changed from purple/pink to blue/cyan (light)
- Changed to mint/green (dark)
- Added 5th floating blob for more depth
- Updated grid overlay color

### `src/App.jsx`
- Already includes AuroraBackground component
- No changes needed, works globally

### Theme Integration
- Works seamlessly with existing ThemeContext
- Automatically responds to theme changes
- No additional configuration required

