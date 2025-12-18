# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Say's Barbers - a barbershop website with integrated admin CMS for content management, visitor analytics, and image uploads.

## Project Structure

```
web_samir/
├── src/                    # Source code
│   ├── css/                # Stylesheets
│   │   ├── variables.css   # CSS variables
│   │   ├── base.css        # Base styles
│   │   ├── components.css  # Reusable components
│   │   ├── navigation.css  # Navigation styles
│   │   ├── sections.css    # Section-specific styles
│   │   ├── utilities.css   # Utility classes
│   │   └── admin.css       # Admin panel styles
│   ├── js/
│   │   ├── site/           # Main site scripts
│   │   │   ├── utils.js
│   │   │   ├── navigation.js
│   │   │   ├── animations.js
│   │   │   ├── modals.js
│   │   │   ├── main.js
│   │   │   ├── data-loader.js
│   │   │   ├── analytics.js
│   │   │   └── sanitizer.js
│   │   ├── admin/          # Admin panel modules
│   │   │   ├── renderers/  # Data renderers
│   │   │   └── forms/      # Form handlers
│   │   ├── shared/         # Shared modules
│   │   │   └── icons.js
│   │   └── admin.bundle.js # Generated admin bundle
│   └── sections/           # HTML sections for index.html
├── scripts/
│   └── build.py            # Build script
├── data/                   # JSON data storage
├── uploads/                # Uploaded images
├── tests/                  # Python tests
├── admin.html              # Admin panel
├── index.html              # Generated main page
├── server.py               # HTTP server
├── config.json             # Server config
├── package.json            # NPM config
└── requirements-dev.txt    # Python dev deps
```

## Tech Stack

- **Backend**: Python 3 with built-in `http.server` (server.py)
- **Frontend**: Vanilla JavaScript (ES6 modules with IIFE pattern)
- **Data Storage**: JSON files in `/data/` directory (no database)
- **Styling**: Modular CSS with CSS variables

## Development Commands

```bash
# Start development server (auto-opens browser at http://localhost:8000)
python3 server.py

# Rebuild index.html from sections
python3 scripts/build.py

# Watch sections and auto-rebuild on changes
python3 scripts/build.py --watch

# Build admin bundle only
python3 scripts/build.py --admin-only

# Linting and formatting (requires: npm install)
npm run lint              # Check JS with ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run format            # Format JS/CSS with Prettier
npm run format:check      # Check formatting

# Testing
npm test                  # Run all Python tests
npm run test:server       # Run server tests only
python3 -m pytest tests/test_server.py::test_function_name -v  # Run single test
python3 -m pytest tests/ --cov=.  # Run with coverage
```

## Architecture

### Modular HTML Assembly

The main `index.html` is **generated** - do not edit directly. Edit files in `/src/sections/` instead:
- `scripts/build.py` concatenates sections in order to create `index.html`
- Section order defined in `SECTIONS` list in build.py
- `server.py` runs `build.py` automatically on startup

### API Endpoints

All endpoints return JSON with CORS headers:

```
GET/POST  /api/masters      - Barber profiles
GET/POST  /api/services     - Services and pricing (3 tiers: green, pink, blue)
GET/POST  /api/articles     - Blog articles
GET/POST  /api/principles   - Quality principles
GET/POST  /api/faq          - FAQ items
GET/POST  /api/social       - Social media & contact info
POST      /api/upload       - Upload image (base64)
DELETE    /api/upload/{filename}
GET/POST  /api/stats        - Visitor statistics
POST      /api/stats/visit  - Record page/section view
```

### JavaScript Module Loading Order

Scripts in `src/js/site/` load in sequence (each depends on previous):
1. `utils.js` - DOM utilities ($, $$, byId, toggleClass, lockScroll, on, ready)
2. `sanitizer.js` - XSS protection
3. `navigation.js` - Mobile menu handling
4. `animations.js` - Fade-in effects
5. `modals.js` - Blog modal & FAQ accordion
6. `main.js` - Service tabs initialization
7. `data-loader.js` - Fetches API data, renders templates into DOM
8. `analytics.js` - Visitor tracking with session IDs

### Admin Panel

`admin.html` + `src/js/admin/` modules (bundled to `admin.bundle.js`):
- Password-protected (server-side token auth)
- CRUD operations for all content types
- Image upload with UUID naming to `/uploads/`
- Stats dashboard with 14-day chart

### Data Flow

1. Browser loads `index.html` (assembled from sections)
2. `data-loader.js` fetches from `/api/*` endpoints
3. Templates render data into DOM placeholders
4. Changes in admin → POST to API → server writes to JSON files

## Key Patterns

- **IIFE modules**: Each JS file wrapped in `(function() { 'use strict'; ... })();`
- **CSS variables**: Defined in `src/css/variables.css`
- **Badge colors**: Masters have badge-green, badge-pink, or badge-blue class
- **Services pricing**: 3 price columns per service matching badge colors
