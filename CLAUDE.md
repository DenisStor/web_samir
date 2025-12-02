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
1. `css/variables.css` - CSS custom properties (colors, theme values)
2. `css/base.css` - Reset, typography, scrollbar, fade-in animations
3. `css/navigation.css` - Fixed nav, mobile menu, marquee
4. `css/components.css` - Buttons, badges, price tags, forms
5. `css/sections.css` - All page sections (Hero, Services, Podology, Masters, Blog, FAQ, Booking, Footer)

### JavaScript Modules
- `js/navigation.js` - `toggleMenu()`, `closeMenu()`, scroll effects
- `js/animations.js` - IntersectionObserver for scroll-triggered fade-ins
- `js/forms.js` - Form submission, date validation, phone mask (+7 format)
- `js/modals.js` - `openBlogModal(articleId)`, `closeBlogModal()`, `toggleFaq(element)`
- `js/main.js` - Service tabs initialization

### Key Files
- `index.html` - Main production HTML
- `says_barbers.html` - Backup/original HTML file
- `server.py` - Custom Python HTTP server with cache-control headers

### Theme Colors (in variables.css)
```css
--bg-dark: #0d0d0d        /* Main background */
--accent-green: #00ff88   /* Primary accent */
--medical-bg: #f5f7f5     /* Podology section (light theme) */
```

## Notes

- Site is in Russian language
- Podology section uses inverted light theme
- All animations use IntersectionObserver for performance
- Phone input has mask: +7 (XXX) XXX-XX-XX
