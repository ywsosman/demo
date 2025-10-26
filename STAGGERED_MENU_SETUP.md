# StaggeredMenu Integration Guide

## Overview

The MediDiagnose application now uses a modern **StaggeredMenu** component for navigation instead of the traditional navbar. The menu features:

- **Top-positioned** menu that stays fixed at the top of the viewport
- **Downward animation** when opening/closing (not left/right)
- **Smooth GSAP-powered animations** with staggered entrance effects
- **Dark mode support** matching the application theme
- **Responsive design** for mobile and desktop
- **Accessibility features** with ARIA labels and keyboard navigation

## Key Features

### 🎨 Design
- Clean, minimalist header with logo and menu button
- Full-screen dropdown menu with large, readable menu items
- Medical theme colors (red accent, dark backgrounds)
- Smooth transitions matching the Aurora background

### 📱 Responsive
- Works seamlessly on all screen sizes
- Touch-friendly on mobile devices
- Prevents body scroll when menu is open

### ♿ Accessibility
- Full keyboard navigation support
- ARIA labels for screen readers
- Focus visible indicators
- Semantic HTML structure

## Components Created

### 1. StaggeredMenu Component
**Location:** `a:\Grad\demo\frontend\src\components\layout\StaggeredMenu.jsx`

Main component that handles:
- Menu animations (downward from top)
- State management
- Item rendering
- Click handlers

### 2. StaggeredMenu Styles
**Location:** `a:\Grad\demo\frontend\src\components\layout\StaggeredMenu.css`

Styles adapted for:
- Top positioning (changed from right/left)
- Downward animation (yPercent instead of xPercent)
- Medical theme colors
- Dark mode support

### 3. Updated Navbar
**Location:** `a:\Grad\demo\frontend\src\components\layout\Navbar.jsx`

Simplified to use StaggeredMenu:
- Logo component with HeartIcon
- Dynamic menu items based on user role (patient/doctor)
- Theme toggle integration
- Logout functionality

## Dependencies Added

```json
{
  "gsap": "^3.12.5"
}
```

**GSAP** (GreenSock Animation Platform) is required for the smooth, performant animations.

## Installation

If you're setting up the project fresh:

```bash
cd demo/frontend
npm install
npm run dev
```

## How It Works

### Menu Item Structure

Menu items are dynamically generated based on:
1. **User authentication state** (logged in or not)
2. **User role** (patient or doctor)
3. **Current theme** (light or dark mode)

Example menu item structure:
```javascript
{
  label: 'Dashboard',
  ariaLabel: 'View your dashboard',
  link: '/patient/dashboard',
  onClick: () => navigate('/patient/dashboard')
}
```

### Animation Flow

1. **User clicks Menu button** → Icon rotates, text cycles between "Menu" and "Close"
2. **Panel animates down** → Background layers stagger in from top
3. **Items appear** → Menu items animate in with stagger effect
4. **Hover effects** → Items scale and change color on hover
5. **Click item** → Navigate to page and close menu

### Key Modifications from Original

The original StaggeredMenu component was modified to:

1. **Position at top instead of right/left**
   - Changed `right/left` positioning to `top: 0`
   - Full width instead of sidebar width

2. **Animate downward instead of sideways**
   - Changed `xPercent` animations to `yPercent`
   - Panels slide down from top instead of from side

3. **Match medical theme**
   - Red accent color (#ef4444)
   - Dark gray backgrounds matching dark mode
   - Medical-600 colors for logo and highlights

4. **Integrate with existing app**
   - Uses existing AuthContext for user state
   - Uses ThemeContext for dark mode
   - React Router for navigation
   - Prevents body scroll when open

## Customization

### Colors

Customize colors in `Navbar.jsx`:

```javascript
<StaggeredMenu
  accentColor="#ef4444" // Accent color for hover states
  colors={isDarkMode ? ['#1f2937', '#111827'] : ['#374151', '#1f2937']} // Background layers
  menuButtonColor={isDarkMode ? '#9ca3af' : '#6b7280'} // Button color (closed)
  openMenuButtonColor={isDarkMode ? '#818cf8' : '#4f46e5'} // Button color (open)
/>
```

### Menu Items

Add/remove menu items by modifying the `getMenuItems()` function in `Navbar.jsx`:

```javascript
items.push({
  label: 'New Page',
  ariaLabel: 'Go to new page',
  link: '/new-page',
  onClick: () => navigate('/new-page')
});
```

### Animations

Adjust animation timing in `StaggeredMenu.jsx`:

```javascript
// Line ~96 - Layer stagger timing
tl.fromTo(ls.el, { yPercent: ls.start }, { 
  yPercent: 0, 
  duration: 0.5,  // Adjust duration
  ease: 'power4.out' 
}, i * 0.07); // Adjust stagger delay
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

The menu uses:
- **GSAP** for hardware-accelerated animations
- **CSS transforms** for smooth performance
- **Will-change** properties for optimization
- **Pointer-events: none** to prevent unnecessary repaints

## Accessibility Checklist

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus indicators
- ✅ Semantic HTML
- ✅ Color contrast (WCAG AA)
- ✅ Reduced motion support (respects user preferences)

## Troubleshooting

### Menu not appearing
- Check that GSAP is installed: `npm list gsap`
- Verify z-index in browser DevTools
- Check console for errors

### Animations not smooth
- Ensure hardware acceleration is enabled in browser
- Check for CSS conflicts
- Verify GSAP version is 3.12+

### Dark mode not working
- Verify ThemeContext is available
- Check that colors are passed correctly to StaggeredMenu
- Inspect CSS variables in DevTools

### Click handlers not working
- Check React Router is set up correctly
- Verify navigate function is available
- Check console for navigation errors

## Future Enhancements

Potential improvements:
- [ ] Add keyboard shortcuts (e.g., Cmd+K to open)
- [ ] Add search functionality in menu
- [ ] Add recently viewed pages
- [ ] Add user profile preview in menu
- [ ] Add notifications badge
- [ ] Add menu presets/favorites
- [ ] Add gesture support (swipe down to close)

## Credits

- **Original Component:** React Bits StaggeredMenu
- **Modified By:** MediDiagnose Team
- **Animation Library:** GSAP by GreenSock
- **Icons:** Heroicons

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all dependencies are installed
3. Check that imports are correct
4. Review this documentation

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0

