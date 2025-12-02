# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Say's Barbers - a static barbershop website with dark theme and green accents (#00ff88). Built with vanilla HTML, CSS, and JavaScript (no frameworks).

## Running the Project

```bash
# Start local dev server (auto-opens browser at http://localhost:8000)
python3 server.py

# Alternative: Python built-in server
python3 -m http.server 8000
```

## Architecture

### CSS Modules (load order matters)
1. `css/variables.css` - Design tokens: colors, shadows, borders, transitions, spacing, z-index
2. `css/utilities.css` - Shared keyframes, card styles, flex/grid utilities, icon sizes
3. `css/base.css` - Reset, typography, scrollbar, container
4. `css/navigation.css` - Fixed nav, mobile menu, marquee
5. `css/components.css` - Buttons, badges, price tags, forms
6. `css/sections.css` - All page sections (Hero, Services, Podology, Masters, Blog, FAQ, Booking, Footer)

### JavaScript Modules (load order matters)
1. `js/utils.js` - Core utilities: `SaysApp` namespace with DOM helpers, scroll lock, aria, events
2. `js/navigation.js` - Mobile menu: `toggleMenu()`, `closeMenu()`, scroll effect
3. `js/animations.js` - IntersectionObserver for fade-in animations
4. `js/forms.js` - Form validation, phone mask (+7 format), `submitForm()`
5. `js/modals.js` - `openBlogModal()`, `closeBlogModal()`, `toggleFaq()`
6. `js/main.js` - Service tabs initialization

### Key Design Tokens (variables.css)
```css
--accent-green: #00ff88         /* Primary accent */
--transition-base: 0.3s ease    /* Standard transition */
--transition-bounce: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)
--radius-xl: 24px               /* Card radius */
--border-subtle: rgba(255, 255, 255, 0.05)
--shadow-glow-md: 0 0 30px var(--accent-green-glow)
```

### Global JavaScript API (SaysApp)
```javascript
SaysApp.$('.selector')     // querySelector
SaysApp.$$('.selector')    // querySelectorAll
SaysApp.byId('id')         // getElementById
SaysApp.lockScroll(bool)   // Lock/unlock body scroll
SaysApp.toggleClass(el, 'class', force)
SaysApp.onEscape(callback) // Handle Escape key
SaysApp.ready(fn)          // DOMContentLoaded wrapper
```

## Notes

- Site is in Russian language
- Podology section uses inverted light theme (medical colors in variables.css)
- All JS modules use IIFE pattern and depend on SaysApp from utils.js
- Phone input has mask: +7 (XXX) XXX-XX-XX
