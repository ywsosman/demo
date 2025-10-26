# StaggeredMenu Customization Guide

## Quick Customization Reference

### 🎨 Change Colors

Open `demo/frontend/src/components/layout/Navbar.jsx` and find the StaggeredMenu component:

```javascript
<StaggeredMenu
  accentColor="#ef4444"  // Change this for different accent color
  colors={isDarkMode ? ['#1f2937', '#111827'] : ['#374151', '#1f2937']}  // Background layers
  menuButtonColor={isDarkMode ? '#9ca3af' : '#6b7280'}  // Closed button
  openMenuButtonColor={isDarkMode ? '#818cf8' : '#4f46e5'}  // Open button
/>
```

**Popular Color Schemes:**

**Medical (Current):**
```javascript
accentColor="#ef4444"  // Red
```

**Professional Blue:**
```javascript
accentColor="#3b82f6"  // Blue
colors={['#1e3a8a', '#1e40af']}
```

**Elegant Purple:**
```javascript
accentColor="#a855f7"  // Purple
colors={['#581c87', '#6b21a8']}
```

**Modern Green:**
```javascript
accentColor="#10b981"  // Green
colors={['#064e3b', '#065f46']}
```

---

### 📝 Add/Remove Menu Items

Find the `getMenuItems()` function in `Navbar.jsx`:

**Add a New Item:**
```javascript
// Inside getMenuItems() function
items.push({
  label: 'About Us',
  ariaLabel: 'Learn about MediDiagnose',
  link: '/about',
  onClick: () => navigate('/about')
});
```

**Add Item for Specific Role Only:**
```javascript
// Only show for doctors
if (user && user.role === 'doctor') {
  items.push({
    label: 'Analytics',
    ariaLabel: 'View analytics dashboard',
    link: '/doctor/analytics',
    onClick: () => navigate('/doctor/analytics')
  });
}
```

**Add External Link:**
```javascript
items.push({
  label: 'Help Center',
  ariaLabel: 'Visit help center',
  link: 'https://help.medidiagnose.com',
  onClick: (e) => {
    e.preventDefault();
    window.open('https://help.medidiagnose.com', '_blank');
  }
});
```

---

### ⏱️ Adjust Animation Speed

Open `demo/frontend/src/components/layout/StaggeredMenu.jsx`:

**Change Opening Speed:**
```javascript
// Line ~96 in buildOpenTimeline()
layerStates.forEach((ls, i) => {
  tl.fromTo(ls.el, { yPercent: ls.start }, { 
    yPercent: 0, 
    duration: 0.5,  // ← Change this (default: 0.5s)
    ease: 'power4.out' 
  }, i * 0.07);  // ← Stagger delay (default: 0.07s)
});

// Main panel animation
tl.fromTo(
  panel,
  { yPercent: panelStart },
  { 
    yPercent: 0, 
    duration: 0.65,  // ← Change this (default: 0.65s)
    ease: 'power4.out' 
  },
  panelInsertTime
);
```

**Change Closing Speed:**
```javascript
// Line ~185 in playClose()
closeTweenRef.current = gsap.to(all, {
  yPercent: offscreen,
  duration: 0.32,  // ← Change this (default: 0.32s)
  ease: 'power3.in',
  overwrite: 'auto',
  onComplete: () => { ... }
});
```

**Presets:**

**Fast & Snappy:**
```javascript
// Opening
duration: 0.35
stagger: 0.04
// Closing
duration: 0.2
```

**Slow & Dramatic:**
```javascript
// Opening
duration: 0.8
stagger: 0.12
// Closing
duration: 0.5
```

**Balanced (Default):**
```javascript
// Opening
duration: 0.5
stagger: 0.07
// Closing
duration: 0.32
```

---

### 🎭 Change Animation Easing

**Available GSAP Easing Functions:**

```javascript
// Smooth easing
ease: 'power1.out'    // Subtle
ease: 'power2.out'    // Medium
ease: 'power3.out'    // Strong
ease: 'power4.out'    // Very strong (current)

// Bouncy easing
ease: 'back.out(1.7)' // Slight overshoot
ease: 'elastic.out'   // Elastic bounce

// Stepped easing
ease: 'steps(10)'     // Choppy, retro feel

// Linear
ease: 'none'          // No easing
```

**Example - Bouncy Menu:**
```javascript
tl.fromTo(
  panel,
  { yPercent: panelStart },
  { 
    yPercent: 0, 
    duration: 0.8,
    ease: 'back.out(1.7)'  // ← Bouncy overshoot
  },
  panelInsertTime
);
```

---

### 📐 Adjust Menu Size & Layout

Open `demo/frontend/src/components/layout/StaggeredMenu.css`:

**Change Font Size:**
```css
.sm-panel-item {
  /* Current: clamp(2.5rem, 6vw, 4.5rem) */
  font-size: clamp(2rem, 5vw, 3.5rem);  /* Smaller */
  /* or */
  font-size: clamp(3rem, 7vw, 5.5rem);  /* Larger */
}
```

**Change Spacing Between Items:**
```css
.sm-panel-list {
  gap: 1rem;     /* Current: 1rem */
  /* gap: 0.5rem;  Compact */
  /* gap: 2rem;    Spacious */
}
```

**Change Header Height:**
```css
.staggered-menu-header {
  padding: 1.5rem 2rem;  /* Current */
  /* padding: 2rem 3rem;  Taller header */
  /* padding: 1rem 1.5rem; Compact header */
}
```

**Change Panel Padding:**
```css
.staggered-menu-panel {
  padding: 8rem 2rem 2rem 2rem;  /* Current */
  /* Top, Right, Bottom, Left */
}
```

---

### 🔤 Change Menu Button Text

In `StaggeredMenu.jsx`, find the initial state:

```javascript
const [textLines, setTextLines] = useState(['Menu', 'Close']);
```

Change to custom text:
```javascript
const [textLines, setTextLines] = useState(['Open', 'Exit']);
// or
const [textLines, setTextLines] = useState(['☰', '✕']);
// or
const [textLines, setTextLines] = useState(['Explore', 'Back']);
```

---

### 🎯 Enable Item Numbering

In `Navbar.jsx`:

```javascript
<StaggeredMenu
  displayItemNumbering={true}  // ← Change from false to true
  // ... other props
/>
```

This will show "01", "02", "03" next to each menu item.

**Customize numbering color** in `StaggeredMenu.css`:
```css
.sm-panel-list[data-numbering] .sm-panel-item::after {
  color: var(--sm-accent, #ef4444);  /* Uses accent color */
}
```

---

### 🌐 Add Social Links

In `Navbar.jsx`, create social items array:

```javascript
const socialItems = [
  { label: 'Twitter', link: 'https://twitter.com/medidiagnose' },
  { label: 'Facebook', link: 'https://facebook.com/medidiagnose' },
  { label: 'LinkedIn', link: 'https://linkedin.com/company/medidiagnose' }
];

return (
  <StaggeredMenu
    items={menuItems}
    socialItems={socialItems}
    displaySocials={true}  // ← Enable socials
    // ... other props
  />
);
```

---

### 🖼️ Change Logo

**Option 1: Use Image URL**
```javascript
<StaggeredMenu
  logoUrl="/path/to/logo.svg"
  logoComponent={null}
  // ...
/>
```

**Option 2: Use Custom Component (Current)**
```javascript
const LogoComponent = () => (
  <Link to="/" className="flex items-center space-x-2">
    <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
    <span className="text-xl font-bold">Brand</span>
  </Link>
);
```

**Option 3: Text Only**
```javascript
const LogoComponent = () => (
  <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
    MediDiagnose
  </Link>
);
```

---

### 🎪 Add Custom Menu Effects

**Add blur background:**
```css
/* In StaggeredMenu.css */
.staggered-menu-panel {
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(20px);  /* Current */
  /* backdrop-filter: blur(40px);  More blur */
}
```

**Add gradient overlay:**
```css
.staggered-menu-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    rgba(79, 70, 229, 0.1) 0%, 
    transparent 50%);
  pointer-events: none;
}
```

**Add noise texture:**
```css
.staggered-menu-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml,...');
  opacity: 0.03;
  pointer-events: none;
}
```

---

### 🔊 Add Sound Effects (Advanced)

**1. Add sound files to `public/sounds/`:**
- `menu-open.mp3`
- `menu-close.mp3`
- `menu-click.mp3`

**2. Create sound utility:**
```javascript
// utils/sounds.js
export const playSound = (soundName) => {
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  audio.volume = 0.2;
  audio.play();
};
```

**3. Use in Navbar:**
```javascript
import { playSound } from '../utils/sounds';

const handleMenuOpen = () => {
  playSound('menu-open');
  document.body.classList.add('menu-open');
};

const handleMenuClose = () => {
  playSound('menu-close');
  document.body.classList.remove('menu-open');
};
```

---

### 📊 Add Menu Analytics (Advanced)

**Track menu interactions:**
```javascript
const handleMenuOpen = () => {
  document.body.classList.add('menu-open');
  
  // Analytics
  if (window.gtag) {
    window.gtag('event', 'menu_opened', {
      event_category: 'navigation',
      event_label: 'staggered_menu'
    });
  }
};

const getMenuItems = () => {
  const items = [
    { 
      label: 'Dashboard', 
      // ...
      onClick: () => {
        // Track click
        if (window.gtag) {
          window.gtag('event', 'menu_click', {
            event_category: 'navigation',
            event_label: 'Dashboard'
          });
        }
        navigate('/dashboard');
      }
    }
  ];
  return items;
};
```

---

### 🎨 Create Theme Variants

**Light Theme Override:**
```javascript
const lightModeColors = {
  background: 'rgba(255, 255, 255, 0.98)',
  text: '#111827',
  accent: '#3b82f6'
};
```

**Update StaggeredMenu.css:**
```css
/* Light mode */
@media (prefers-color-scheme: light) {
  .staggered-menu-panel {
    background: rgba(255, 255, 255, 0.98);
    color: #111827;
  }
  
  .sm-panel-item {
    color: #111827;
  }
  
  .sm-panel-item:hover {
    color: #3b82f6;
  }
}
```

---

### 🚀 Performance Optimization

**Reduce animation complexity:**
```javascript
// Disable prelayers for faster performance
const colors = []; // Empty array = no prelayers
```

**Lazy load GSAP:**
```javascript
const [gsapLoaded, setGsapLoaded] = useState(false);

useEffect(() => {
  import('gsap').then(module => {
    setGsapLoaded(true);
  });
}, []);
```

**Reduce item stagger:**
```javascript
// Faster stagger
stagger: { each: 0.04, from: 'start' }  // Instead of 0.1
```

---

## 🔧 Common Customization Combinations

### Minimalist Style
```javascript
// Navbar.jsx
<StaggeredMenu
  items={menuItems}
  displaySocials={false}
  displayItemNumbering={false}
  accentColor="#000000"
  colors={['#ffffff', '#f9fafb']}
/>
```

```css
/* StaggeredMenu.css */
.sm-panel-item {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  text-transform: none;
}
```

### Bold & Colorful
```javascript
<StaggeredMenu
  items={menuItems}
  displayItemNumbering={true}
  accentColor="#f59e0b"
  colors={['#7c3aed', '#5b21b6']}
/>
```

### Corporate Professional
```javascript
<StaggeredMenu
  items={menuItems}
  displaySocials={true}
  socialItems={socialItems}
  accentColor="#1e40af"
  colors={['#1e293b', '#0f172a']}
/>
```

---

## 📝 Customization Checklist

- [ ] Choose accent color
- [ ] Adjust animation speeds
- [ ] Configure menu items
- [ ] Customize logo
- [ ] Set up social links (optional)
- [ ] Enable/disable item numbering
- [ ] Adjust font sizes
- [ ] Test on mobile
- [ ] Test dark mode
- [ ] Test accessibility
- [ ] Optimize performance

---

## 💡 Pro Tips

1. **Use CSS variables** for easy theme switching
2. **Test animations at 0.5x speed** in Chrome DevTools
3. **Keep menu items under 8** for best UX
4. **Use semantic HTML** for accessibility
5. **Optimize images** (logo should be < 50KB)
6. **Test on real devices** not just browser resize

---

## 🆘 Need Help?

Refer to:
- `STAGGERED_MENU_SETUP.md` - Setup guide
- `MENU_CHANGES_SUMMARY.md` - Technical details
- GSAP Docs - https://greensock.com/docs/

---

*Last Updated: October 26, 2025*

