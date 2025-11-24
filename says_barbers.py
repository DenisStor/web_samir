#!/usr/bin/env python3
"""
Say's Barbers - Landing Page Generator
Generates a complete single-page landing site for Say's Barbers barbershop
"""

HTML_CONTENT = '''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Say's Barbers — Серо-зелёный код твоего стиля</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0d0d0d;
            --bg-darker: #080808;
            --content-bg: #1a1a1a;
            --content-bg-light: #242424;
            --accent-green: #00ff88;
            --accent-green-dim: #00cc6a;
            --accent-green-glow: rgba(0, 255, 136, 0.3);
            --accent-green-subtle: rgba(0, 255, 136, 0.1);
            --text-white: #ffffff;
            --text-gray: #a0a0a0;
            --text-gray-light: #c0c0c0;
            --badge-green: #00ff88;
            --badge-pink: #ff6b9d;
            --badge-blue: #4d7cff;
            --medical-bg: #f5f7f5;
            --medical-text: #1a1a1a;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Manrope', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-white);
            line-height: 1.6;
            overflow-x: hidden;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: var(--bg-darker);
        }
        ::-webkit-scrollbar-thumb {
            background: var(--accent-green-dim);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--accent-green);
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Unbounded', sans-serif;
            font-weight: 700;
            line-height: 1.2;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* Navigation */
        .nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 20px 0;
            background: rgba(13, 13, 13, 0.85);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .nav.scrolled {
            padding: 12px 0;
            background: rgba(8, 8, 8, 0.95);
        }

        .nav-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-family: 'Unbounded', sans-serif;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-white);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo-accent {
            color: var(--accent-green);
            text-shadow: 0 0 20px var(--accent-green-glow);
        }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: var(--text-gray-light);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            position: relative;
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--accent-green);
            transition: width 0.3s ease;
            box-shadow: 0 0 10px var(--accent-green-glow);
        }

        .nav-links a:hover {
            color: var(--accent-green);
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        .nav-cta {
            background: var(--accent-green);
            color: var(--bg-dark);
            padding: 12px 28px;
            border-radius: 50px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 0 30px var(--accent-green-glow);
        }

        .nav-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 50px var(--accent-green-glow), 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        /* Burger Menu */
        .burger {
            display: none;
            flex-direction: column;
            gap: 5px;
            cursor: pointer;
            padding: 10px;
            z-index: 1001;
        }

        .burger span {
            width: 28px;
            height: 2px;
            background: var(--text-white);
            transition: all 0.3s ease;
        }

        .burger.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }

        .burger.active span:nth-child(2) {
            opacity: 0;
        }

        .burger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }

        /* Mobile Menu */
        .mobile-menu {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg-darker);
            z-index: 999;
            padding: 100px 24px 40px;
            flex-direction: column;
            gap: 20px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .mobile-menu.active {
            opacity: 1;
            pointer-events: all;
        }

        .mobile-menu a {
            color: var(--text-white);
            text-decoration: none;
            font-family: 'Unbounded', sans-serif;
            font-size: 1.5rem;
            font-weight: 600;
            padding: 16px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        .mobile-menu a:hover {
            color: var(--accent-green);
            padding-left: 16px;
        }

        /* Hero Section */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            position: relative;
            padding: 120px 0 80px;
            overflow: hidden;
        }

        .hero-bg {
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 50%),
                radial-gradient(ellipse 50% 30% at 0% 80%, rgba(0, 255, 136, 0.03) 0%, transparent 50%);
            pointer-events: none;
        }

        .hero-noise {
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            opacity: 0.03;
            pointer-events: none;
        }

        .hero-content {
            position: relative;
            z-index: 1;
            max-width: 900px;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--accent-green-subtle);
            border: 1px solid rgba(0, 255, 136, 0.2);
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 0.85rem;
            color: var(--accent-green);
            margin-bottom: 32px;
            animation: fadeInUp 0.8s ease forwards;
        }

        .hero-badge::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--accent-green);
            border-radius: 50%;
            animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }

        .hero h1 {
            font-size: clamp(2.5rem, 6vw, 5rem);
            font-weight: 900;
            margin-bottom: 24px;
            animation: fadeInUp 0.8s ease 0.1s forwards;
            opacity: 0;
        }

        .hero h1 .accent {
            color: var(--accent-green);
            text-shadow: 0 0 40px var(--accent-green-glow);
        }

        .hero-description {
            font-size: 1.25rem;
            color: var(--text-gray-light);
            margin-bottom: 24px;
            max-width: 700px;
            animation: fadeInUp 0.8s ease 0.2s forwards;
            opacity: 0;
        }

        .hero-features {
            display: grid;
            gap: 12px;
            margin-bottom: 40px;
            animation: fadeInUp 0.8s ease 0.3s forwards;
            opacity: 0;
        }

        .hero-feature {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-gray);
            font-size: 1rem;
        }

        .hero-feature svg {
            width: 20px;
            height: 20px;
            color: var(--accent-green);
            flex-shrink: 0;
        }

        .hero-buttons {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            animation: fadeInUp 0.8s ease 0.4s forwards;
            opacity: 0;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 18px 36px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            transition: all 0.3s ease;
            cursor: pointer;
            border: none;
            font-family: inherit;
        }

        .btn-primary {
            background: var(--accent-green);
            color: var(--bg-dark);
            box-shadow: 0 0 40px var(--accent-green-glow);
        }

        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 60px var(--accent-green-glow), 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary {
            background: transparent;
            color: var(--text-white);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
            border-color: var(--accent-green);
            color: var(--accent-green);
            background: var(--accent-green-subtle);
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Section Styles */
        .section {
            padding: 100px 0;
            position: relative;
        }

        .section-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .section-tag {
            display: inline-block;
            color: var(--accent-green);
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 16px;
        }

        .section-title {
            font-size: clamp(2rem, 4vw, 3rem);
            margin-bottom: 16px;
        }

        .section-subtitle {
            color: var(--text-gray);
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto;
        }

        /* Services Section */
        .services {
            background: var(--bg-darker);
        }

        .services-grid {
            display: grid;
            gap: 32px;
        }

        .service-category {
            background: var(--content-bg);
            border-radius: 24px;
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .service-category:hover {
            border-color: rgba(0, 255, 136, 0.2);
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.05);
        }

        .category-title {
            font-size: 1.5rem;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .category-title svg {
            width: 28px;
            height: 28px;
            color: var(--accent-green);
        }

        .category-description {
            color: var(--text-gray);
            margin-bottom: 32px;
            font-size: 0.95rem;
        }

        /* Price Legend */
        .price-legend {
            display: flex;
            gap: 24px;
            margin-bottom: 32px;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: var(--text-gray);
        }

        .legend-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.75rem;
        }

        .badge-green {
            background: rgba(0, 255, 136, 0.15);
            color: var(--badge-green);
        }

        .badge-pink {
            background: rgba(255, 107, 157, 0.15);
            color: var(--badge-pink);
        }

        .badge-blue {
            background: rgba(77, 124, 255, 0.15);
            color: var(--badge-blue);
        }

        /* Service Items */
        .service-list {
            display: grid;
            gap: 16px;
        }

        .service-item {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: center;
            padding: 20px 24px;
            background: var(--content-bg-light);
            border-radius: 16px;
            transition: all 0.3s ease;
        }

        .service-item:hover {
            background: rgba(0, 255, 136, 0.05);
            transform: translateX(8px);
        }

        .service-name {
            font-weight: 600;
            font-size: 1rem;
        }

        .service-note {
            font-size: 0.85rem;
            color: var(--text-gray);
            margin-top: 4px;
        }

        .service-prices {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .price-tag {
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .price-green {
            background: rgba(0, 255, 136, 0.1);
            color: var(--badge-green);
            border: 1px solid rgba(0, 255, 136, 0.2);
        }

        .price-pink {
            background: rgba(255, 107, 157, 0.1);
            color: var(--badge-pink);
            border: 1px solid rgba(255, 107, 157, 0.2);
        }

        .price-blue {
            background: rgba(77, 124, 255, 0.1);
            color: var(--badge-blue);
            border: 1px solid rgba(77, 124, 255, 0.2);
        }

        /* Podology Section */
        .podology {
            background: linear-gradient(180deg, var(--medical-bg) 0%, #e8ede8 100%);
            color: var(--medical-text);
            position: relative;
            overflow: hidden;
        }

        .podology::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-green), var(--badge-blue));
        }

        .podology .section-tag {
            color: var(--accent-green-dim);
        }

        .podology .section-subtitle {
            color: #666;
        }

        .podology-intro {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 60px;
        }

        .podology-intro p {
            color: #555;
            font-size: 1.1rem;
            line-height: 1.8;
        }

        .podology-specialist {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 24px;
            padding: 20px 32px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            display: inline-flex;
        }

        .specialist-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-green-dim), var(--badge-blue));
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Unbounded', sans-serif;
            font-weight: 700;
            font-size: 1.2rem;
            color: white;
        }

        .specialist-info h4 {
            font-size: 1.1rem;
            color: var(--medical-text);
        }

        .specialist-info span {
            color: #666;
            font-size: 0.9rem;
        }

        .podology-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }

        .podology-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }

        .podology-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .podology-item-info h4 {
            font-size: 1rem;
            font-weight: 600;
            color: var(--medical-text);
            margin-bottom: 4px;
        }

        .podology-item-info span {
            font-size: 0.85rem;
            color: #888;
        }

        .podology-price {
            font-family: 'Unbounded', sans-serif;
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--accent-green-dim);
        }

        .podology-free {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 204, 106, 0.1));
            border: 2px solid var(--accent-green-dim);
        }

        .podology-free .podology-price {
            color: var(--accent-green-dim);
        }

        /* Masters Section */
        .masters {
            background: var(--bg-dark);
        }

        .masters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 32px;
        }

        .master-card {
            background: var(--content-bg);
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.4s ease;
            position: relative;
        }

        .master-card:hover {
            transform: translateY(-8px);
            border-color: var(--accent-green);
            box-shadow: 0 0 40px var(--accent-green-glow), 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .master-image {
            height: 320px;
            background: linear-gradient(135deg, var(--content-bg-light) 0%, var(--content-bg) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .master-image::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 50%, var(--content-bg) 100%);
        }

        .master-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-green-dim), var(--badge-blue));
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Unbounded', sans-serif;
            font-size: 2.5rem;
            font-weight: 800;
            color: white;
            position: relative;
            z-index: 1;
        }

        .master-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .master-content {
            padding: 32px;
        }

        .master-name {
            font-size: 1.5rem;
            margin-bottom: 4px;
        }

        .master-role {
            color: var(--accent-green);
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .master-specialization {
            color: var(--text-gray);
            font-size: 0.95rem;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .master-principles {
            display: grid;
            gap: 12px;
        }

        .master-principle {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            color: var(--text-gray-light);
        }

        .master-principle svg {
            width: 16px;
            height: 16px;
            color: var(--accent-green);
            flex-shrink: 0;
        }

        .master-extra {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease;
        }

        .master-card:hover .master-extra {
            max-height: 200px;
        }

        /* Quality Section */
        .quality {
            background: var(--bg-darker);
        }

        .quality-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }

        .quality-item {
            background: var(--content-bg);
            padding: 40px 32px;
            border-radius: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .quality-item:hover {
            border-color: rgba(0, 255, 136, 0.3);
            transform: translateY(-4px);
        }

        .quality-icon {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            background: var(--accent-green-subtle);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .quality-icon svg {
            width: 32px;
            height: 32px;
            color: var(--accent-green);
        }

        .quality-item h3 {
            font-size: 1.2rem;
            margin-bottom: 12px;
        }

        .quality-item p {
            color: var(--text-gray);
            font-size: 0.95rem;
        }

        /* Location Section */
        .location {
            background: var(--bg-dark);
        }

        .location-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            align-items: center;
        }

        .location-info {
            display: grid;
            gap: 32px;
        }

        .location-block h3 {
            font-size: 1.1rem;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .location-block h3 svg {
            width: 24px;
            height: 24px;
            color: var(--accent-green);
        }

        .location-block p {
            color: var(--text-gray);
            font-size: 1rem;
            line-height: 1.8;
        }

        .location-map {
            border-radius: 24px;
            overflow: hidden;
            height: 400px;
            background: var(--content-bg);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .location-map iframe {
            width: 100%;
            height: 100%;
            border: none;
            filter: grayscale(0.5) contrast(1.1);
        }

        .btn-route {
            margin-top: 16px;
        }

        /* Social Section */
        .social {
            background: var(--bg-darker);
            padding: 60px 0;
        }

        .social-content {
            text-align: center;
        }

        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 32px;
        }

        .social-link {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: var(--content-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .social-link svg {
            width: 28px;
            height: 28px;
            color: var(--text-gray-light);
            transition: color 0.3s ease;
        }

        .social-link:hover {
            background: var(--accent-green-subtle);
            border-color: var(--accent-green);
            transform: translateY(-4px);
            box-shadow: 0 0 30px var(--accent-green-glow);
        }

        .social-link:hover svg {
            color: var(--accent-green);
        }

        /* Booking Section */
        .booking {
            background: linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-darker) 100%);
            position: relative;
            overflow: hidden;
        }

        .booking::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0, 255, 136, 0.08) 0%, transparent 60%);
            pointer-events: none;
        }

        .booking-content {
            position: relative;
            z-index: 1;
        }

        .booking-form {
            max-width: 600px;
            margin: 0 auto;
            background: var(--content-bg);
            padding: 48px;
            border-radius: 32px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .form-group {
            margin-bottom: 24px;
        }

        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }

        .form-input {
            width: 100%;
            padding: 16px 20px;
            background: var(--content-bg-light);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: var(--text-white);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.3s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent-green);
            box-shadow: 0 0 20px var(--accent-green-glow);
        }

        .form-input::placeholder {
            color: var(--text-gray);
        }

        select.form-input {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300ff88' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            background-size: 20px;
        }

        select.form-input option {
            background: var(--content-bg);
            color: var(--text-white);
        }

        textarea.form-input {
            resize: vertical;
            min-height: 100px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .btn-submit {
            width: 100%;
            justify-content: center;
            font-size: 1.1rem;
            padding: 20px;
        }

        .booking-alt {
            text-align: center;
            margin-top: 32px;
        }

        .booking-alt p {
            color: var(--text-gray);
            margin-bottom: 16px;
        }

        /* Footer */
        .footer {
            background: var(--bg-darker);
            padding: 40px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .footer-copy {
            color: var(--text-gray);
            font-size: 0.9rem;
        }

        .footer-links {
            display: flex;
            gap: 24px;
        }

        .footer-links a {
            color: var(--text-gray);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }

        .footer-links a:hover {
            color: var(--accent-green);
        }

        /* Success Message */
        .form-success {
            display: none;
            text-align: center;
            padding: 40px;
        }

        .form-success.active {
            display: block;
        }

        .form-success svg {
            width: 80px;
            height: 80px;
            color: var(--accent-green);
            margin-bottom: 24px;
        }

        .form-success h3 {
            font-size: 1.5rem;
            margin-bottom: 12px;
        }

        .form-success p {
            color: var(--text-gray);
        }

        /* Animations on Scroll */
        .fade-in {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Responsive Styles */
        @media (max-width: 1024px) {
            .nav-links, .nav-cta {
                display: none;
            }

            .burger {
                display: flex;
            }

            .mobile-menu {
                display: flex;
            }

            .location-content {
                grid-template-columns: 1fr;
            }

            .location-map {
                height: 300px;
            }
        }

        @media (max-width: 768px) {
            .section {
                padding: 60px 0;
            }

            .hero {
                padding: 100px 0 60px;
            }

            .hero-buttons {
                flex-direction: column;
            }

            .btn {
                width: 100%;
                justify-content: center;
            }

            .service-item {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .service-prices {
                justify-content: flex-start;
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .booking-form {
                padding: 32px 24px;
            }

            .podology-grid {
                grid-template-columns: 1fr;
            }

            .footer-content {
                flex-direction: column;
                text-align: center;
            }
        }

        @media (max-width: 480px) {
            .price-legend {
                flex-direction: column;
                gap: 12px;
            }

            .service-category {
                padding: 24px;
            }

            .master-content {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="container nav-content">
            <a href="#" class="logo">
                Say's<span class="logo-accent">Barbers</span>
            </a>
            <ul class="nav-links">
                <li><a href="#services">Услуги</a></li>
                <li><a href="#podology">Патологический кабинет</a></li>
                <li><a href="#masters">Мастера</a></li>
                <li><a href="#quality">О нас</a></li>
                <li><a href="#location">Контакты</a></li>
            </ul>
            <a href="#booking" class="nav-cta">Онлайн-запись</a>
            <div class="burger" onclick="toggleMenu()">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
        <a href="#services" onclick="closeMenu()">Услуги</a>
        <a href="#podology" onclick="closeMenu()">Патологический кабинет</a>
        <a href="#masters" onclick="closeMenu()">Мастера</a>
        <a href="#quality" onclick="closeMenu()">О нас</a>
        <a href="#location" onclick="closeMenu()">Контакты</a>
        <a href="#booking" onclick="closeMenu()">Онлайн-запись</a>
    </div>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-noise"></div>
        <div class="container">
            <div class="hero-content">
                <div class="hero-badge">
                    <span>Премиум барбершоп в вашем городе</span>
                </div>
                <h1>Say's Barbers — <span class="accent">серо-зелёный код</span> твоего стиля</h1>
                <p class="hero-description">
                    Барбершоп с сильной командой мастеров, вниманием к деталям, абсолютной чистотой и честным сервисом. Мы создаём не просто стрижки — мы создаём ваш образ.
                </p>
                <div class="hero-features">
                    <div class="hero-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Индивидуальный подбор формы стрижки и бороды под черты лица</span>
                    </div>
                    <div class="hero-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Работа только с проверенной профессиональной косметикой</span>
                    </div>
                    <div class="hero-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Стерильность, аккуратность и внимание к каждой детали</span>
                    </div>
                    <div class="hero-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Честные рекомендации без навязывания лишних процедур</span>
                    </div>
                </div>
                <div class="hero-buttons">
                    <a href="#booking" class="btn btn-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Онлайн-запись
                    </a>
                    <a href="#services" class="btn btn-secondary">
                        Услуги и цены
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="section services" id="services">
        <div class="container">
            <div class="section-header fade-in">
                <span class="section-tag">Прайс-лист</span>
                <h2 class="section-title">Услуги и цены</h2>
                <p class="section-subtitle">Цены варьируются в зависимости от квалификации мастера</p>
            </div>

            <!-- Price Legend -->
            <div class="price-legend fade-in">
                <div class="legend-item">
                    <span class="legend-badge badge-green">Green</span>
                    <span>Начальная квалификация</span>
                </div>
                <div class="legend-item">
                    <span class="legend-badge badge-pink">Pink</span>
                    <span>Средняя квалификация</span>
                </div>
                <div class="legend-item">
                    <span class="legend-badge badge-blue">Dark Blue</span>
                    <span>Максимальная квалификация</span>
                </div>
            </div>

            <div class="services-grid">
                <!-- Main Services -->
                <div class="service-category fade-in">
                    <h3 class="category-title">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                        Основные услуги
                    </h3>
                    <p class="category-description">Классические и современные стрижки, работа с бородой и бритьё</p>
                    <div class="service-list">
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка мужская</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1000 ₽</span>
                                <span class="price-tag price-pink">1300 ₽</span>
                                <span class="price-tag price-blue">2000 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Оформление бороды</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">800 ₽</span>
                                <span class="price-tag price-pink">1000 ₽</span>
                                <span class="price-tag price-blue">1500 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка детская</div>
                                <div class="service-note">до 11 лет</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">800 ₽</span>
                                <span class="price-tag price-pink">1000 ₽</span>
                                <span class="price-tag price-blue">1500 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Опасное бритьё</div>
                                <div class="service-note">головы / лица</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">800 ₽</span>
                                <span class="price-tag price-pink">1000 ₽</span>
                                <span class="price-tag price-blue">1500 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Фейд</div>
                                <div class="service-note">под машинку</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">800 ₽</span>
                                <span class="price-tag price-pink">1000 ₽</span>
                                <span class="price-tag price-blue">1500 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка под машинку</div>
                                <div class="service-note">до двух насадок</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">600 ₽</span>
                                <span class="price-tag price-pink">700 ₽</span>
                                <span class="price-tag price-blue">1100 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Борода под машинку</div>
                                <div class="service-note">под одну насадку, без контуров</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">300 ₽</span>
                                <span class="price-tag price-pink">400 ₽</span>
                                <span class="price-tag price-blue">500 ₽</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Complex Services -->
                <div class="service-category fade-in">
                    <h3 class="category-title">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                        Комплексные услуги
                    </h3>
                    <p class="category-description">Выгодные комбинации услуг для полного преображения</p>
                    <div class="service-list">
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка + оформление бороды</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1500 ₽</span>
                                <span class="price-tag price-pink">2000 ₽</span>
                                <span class="price-tag price-blue">3000 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка + стрижка детская</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1600 ₽</span>
                                <span class="price-tag price-pink">2100 ₽</span>
                                <span class="price-tag price-blue">3100 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка + бритьё опасное</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1500 ₽</span>
                                <span class="price-tag price-pink">2000 ₽</span>
                                <span class="price-tag price-blue">3000 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Оформление бороды + окантовка головы</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1000 ₽</span>
                                <span class="price-tag price-pink">1200 ₽</span>
                                <span class="price-tag price-blue">1900 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Стрижка + камуфляж седины</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1500 ₽</span>
                                <span class="price-tag price-pink">2000 ₽</span>
                                <span class="price-tag price-blue">3000 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Оформление бороды + камуфляж седины</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1300 ₽</span>
                                <span class="price-tag price-pink">1600 ₽</span>
                                <span class="price-tag price-blue">2500 ₽</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Services -->
                <div class="service-category fade-in">
                    <h3 class="category-title">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        Дополнительные услуги
                    </h3>
                    <p class="category-description">Уход, укладка и специальные процедуры</p>
                    <div class="service-list">
                        <div class="service-item">
                            <div>
                                <div class="service-name">Уход за кожей лица</div>
                                <div class="service-note">очищение и увлажнение косметикой Volcano, 6 этапов ухода, массаж</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">1100 ₽</span>
                                <span class="price-tag price-pink">1400 ₽</span>
                                <span class="price-tag price-blue">1700 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Уход за кожей головы и волосами</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">400 ₽</span>
                                <span class="price-tag price-pink">500 ₽</span>
                                <span class="price-tag price-blue">700 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Камуфляж седины</div>
                                <div class="service-note">голова или борода</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">700 ₽</span>
                                <span class="price-tag price-pink">900 ₽</span>
                                <span class="price-tag price-blue">1400 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Окантовка головы</div>
                                <div class="service-note">оформление контуров триммером</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">400 ₽</span>
                                <span class="price-tag price-pink">500 ₽</span>
                                <span class="price-tag price-blue">700 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Мытьё и укладка волос</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">300 ₽</span>
                                <span class="price-tag price-pink">400 ₽</span>
                                <span class="price-tag price-blue">600 ₽</span>
                            </div>
                        </div>
                        <div class="service-item">
                            <div>
                                <div class="service-name">Удаление волос воском</div>
                                <div class="service-note">одна зона — нос / уши</div>
                            </div>
                            <div class="service-prices">
                                <span class="price-tag price-green">300 ₽</span>
                                <span class="price-tag price-pink">400 ₽</span>
                                <span class="price-tag price-blue">500 ₽</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Podology Section -->
    <section class="section podology" id="podology">
        <div class="container">
            <div class="section-header fade-in">
                <span class="section-tag">Премиум сервис</span>
                <h2 class="section-title" style="color: var(--medical-text);">Патологический кабинет</h2>
                <p class="section-subtitle">Подология для самых требовательных клиентов</p>
            </div>

            <div class="podology-intro fade-in">
                <p>
                    Для тех, кто заботится о здоровье и комфорте своих ног. 
                    Профессиональный подологический уход с использованием современных методик и инструментов.
                    Потому что настоящий стиль начинается с заботы о себе — от головы до пят.
                </p>
                <div class="podology-specialist">
                    <div class="specialist-avatar">Е</div>
                    <div class="specialist-info">
                        <h4>Елена — подолог</h4>
                        <span>Ведущий специалист кабинета</span>
                    </div>
                </div>
            </div>

            <div class="podology-grid">
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Подологический ногтевой сервис рук</h4>
                        <span>1 час</span>
                    </div>
                    <div class="podology-price">1700 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Подологический ногтевой сервис ног</h4>
                        <span>1 час, без обработки стоп</span>
                    </div>
                    <div class="podology-price">1800 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Подологическая обработка стоп</h4>
                        <span>30 минут</span>
                    </div>
                    <div class="podology-price">1100 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Коррекция длины ногтей рук или ног</h4>
                        <span>30 минут</span>
                    </div>
                    <div class="podology-price">1000 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка ногтей, поражённых грибком</h4>
                        <span>1 час 15 минут</span>
                    </div>
                    <div class="podology-price">3000 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка стоп, поражённых грибком</h4>
                        <span>45 минут</span>
                    </div>
                    <div class="podology-price">2000 ₽</div>
                </div>
                <div class="podology-item podology-free fade-in">
                    <div class="podology-item-info">
                        <h4>Консультация</h4>
                        <span>15 минут</span>
                    </div>
                    <div class="podology-price">Бесплатно</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка проблемного ногтя</h4>
                        <span>30 минут</span>
                    </div>
                    <div class="podology-price">900 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка мозоли</h4>
                        <span>30 минут</span>
                    </div>
                    <div class="podology-price">900 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка бородавки</h4>
                        <span>30 минут</span>
                    </div>
                    <div class="podology-price">900 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Антисептическая повязка</h4>
                        <span>15 минут</span>
                    </div>
                    <div class="podology-price">600 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Разгрузка</h4>
                        <span>15 минут, снятие избыточной нагрузки</span>
                    </div>
                    <div class="podology-price">600 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Комплекс: ногтевой сервис рук + ног + обработка стоп</h4>
                        <span>2 часа</span>
                    </div>
                    <div class="podology-price">4000 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Комплекс: ногтевой сервис ног + обработка стоп</h4>
                        <span>1 час 30 минут</span>
                    </div>
                    <div class="podology-price">2500 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Обработка стоп и ногтей, поражённых грибком</h4>
                        <span>1 час 45 минут</span>
                    </div>
                    <div class="podology-price">4000 ₽</div>
                </div>
                <div class="podology-item fade-in">
                    <div class="podology-item-info">
                        <h4>Установка корректирующей системы «титановая нить»</h4>
                        <span>Уточняйте у специалиста</span>
                    </div>
                    <div class="podology-price">По прайсу</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Masters Section -->
    <section class="section masters" id="masters">
        <div class="container">
            <div class="section-header fade-in">
                <span class="section-tag">Команда</span>
                <h2 class="section-title">Наши мастера</h2>
                <p class="section-subtitle">Профессионалы своего дела с индивидуальным подходом к каждому клиенту</p>
            </div>

            <div class="masters-grid">
                <!-- Samir -->
                <div class="master-card fade-in">
                    <div class="master-image">
                        <div class="master-avatar">С</div>
                        <span class="master-badge badge-blue">Dark Blue</span>
                    </div>
                    <div class="master-content">
                        <h3 class="master-name">Самир</h3>
                        <div class="master-role">Основатель и главный мастер</div>
                        <p class="master-specialization">
                            Эксперт в классических и современных стрижках. Специализируется на сложных фейдах, работе с бородой и индивидуальном подборе образа.
                        </p>
                        <div class="master-principles">
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Уважение к времени клиента</span>
                            </div>
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Максимальное внимание к деталям</span>
                            </div>
                            <div class="master-extra">
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Аккуратность и стерильность</span>
                                </div>
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Честные рекомендации по уходу</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Daniel -->
                <div class="master-card fade-in">
                    <div class="master-image">
                        <div class="master-avatar">Д</div>
                        <span class="master-badge badge-pink">Pink</span>
                    </div>
                    <div class="master-content">
                        <h3 class="master-name">Даниэль</h3>
                        <div class="master-role">Мастер</div>
                        <p class="master-specialization">
                            Мастер современных техник стрижки. Отлично работает с текстурными укладками и креативными решениями.
                        </p>
                        <div class="master-principles">
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Уважение к времени клиента</span>
                            </div>
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Креативный подход к образу</span>
                            </div>
                            <div class="master-extra">
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Аккуратность и стерильность</span>
                                </div>
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Консультации по стайлингу</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Andrey -->
                <div class="master-card fade-in">
                    <div class="master-image">
                        <div class="master-avatar">А</div>
                        <span class="master-badge badge-pink">Pink</span>
                    </div>
                    <div class="master-content">
                        <h3 class="master-name">Андрей</h3>
                        <div class="master-role">Мастер</div>
                        <p class="master-specialization">
                            Специалист по классическим стрижкам и работе с бородой. Внимательный подход к пожеланиям клиента.
                        </p>
                        <div class="master-principles">
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Уважение к времени клиента</span>
                            </div>
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Классика в современном прочтении</span>
                            </div>
                            <div class="master-extra">
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Аккуратность и стерильность</span>
                                </div>
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Честные рекомендации по уходу</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Raf -->
                <div class="master-card fade-in">
                    <div class="master-image">
                        <div class="master-avatar">Р</div>
                        <span class="master-badge badge-green">Green</span>
                    </div>
                    <div class="master-content">
                        <h3 class="master-name">Раф</h3>
                        <div class="master-role">Мастер</div>
                        <p class="master-specialization">
                            Талантливый мастер с острым взглядом на детали. Отлично справляется с фейдами и современными техниками.
                        </p>
                        <div class="master-principles">
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Уважение к времени клиента</span>
                            </div>
                            <div class="master-principle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Энтузиазм и свежий взгляд</span>
                            </div>
                            <div class="master-extra">
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Аккуратность и стерильность</span>
                                </div>
                                <div class="master-principle">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    <span>Постоянное развитие навыков</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Quality Section -->
    <section class="section quality" id="quality">
        <div class="container">
            <div class="section-header fade-in">
                <span class="section-tag">Наш подход</span>
                <h2 class="section-title">Принципы работы</h2>
                <p class="section-subtitle">Качество — это не просто слово, это наш стандарт</p>
            </div>

            <div class="quality-grid">
                <div class="quality-item fade-in">
                    <div class="quality-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </div>
                    <h3>Постоянное обучение</h3>
                    <p>Регулярное обучение и повышение квалификации мастеров. Следим за трендами и осваиваем новые техники.</p>
                </div>
                <div class="quality-item fade-in">
                    <div class="quality-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <h3>Проверенная косметика</h3>
                    <p>Работаем только с профессиональной косметикой от проверенных брендов. Никаких компромиссов с качеством.</p>
                </div>
                <div class="quality-item fade-in">
                    <div class="quality-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h3>Качество, не количество</h3>
                    <p>Фокус на каждом клиенте. Не гонимся за потоком — важен результат и ваше удовлетворение.</p>
                </div>
                <div class="quality-item fade-in">
                    <div class="quality-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <h3>Чистота и порядок</h3>
                    <p>Аккуратный сервис, стерильные инструменты, чистые рабочие места. Чёткая запись без очередей и суеты.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Location Section -->
    <section class="section location" id="location">
        <div class="container">
            <div class="section-header fade-in">
                <span class="section-tag">Контакты</span>
                <h2 class="section-title">Как нас найти</h2>
            </div>

            <div class="location-content">
                <div class="location-info fade-in">
                    <div class="location-block">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Адрес
                        </h3>
                        <p>
                            г. Москва, ул. Примерная, д. 42<br>
                            Станция метро «Примерная», выход №3<br>
                            5 минут пешком от метро
                        </p>
                    </div>
                    <div class="location-block">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Режим работы
                        </h3>
                        <p>
                            Пн–Пт: 10:00 – 21:00<br>
                            Сб–Вс: 10:00 – 20:00<br>
                            Без перерывов и выходных
                        </p>
                    </div>
                    <div class="location-block">
                        <h3>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            Телефон
                        </h3>
                        <p>
                            +7 (999) 123-45-67<br>
                            Звоните или пишите в мессенджеры
                        </p>
                    </div>
                    <a href="https://yandex.ru/maps" target="_blank" class="btn btn-secondary btn-route">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                        Построить маршрут
                    </a>
                </div>
                <div class="location-map fade-in">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.3714386744307!2d37.61844631592892!3d55.75396998055648!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa886bf5a3d9b2e68!2z0JzQvtGB0LrQvtCy0YHQutC40Lkg0JrRgNC10LzQu9GM!5e0!3m2!1sru!2sru!4v1234567890" allowfullscreen="" loading="lazy"></iframe>
                </div>
            </div>
        </div>
    </section>

    <!-- Social Section -->
    <section class="section social" id="social">
        <div class="container">
            <div class="social-content fade-in">
                <span class="section-tag">Будьте на связи</span>
                <h2 class="section-title">Мы в социальных сетях</h2>
                <div class="social-links">
                    <a href="#" class="social-link" title="Instagram">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                    <a href="#" class="social-link" title="VK">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.97 4 8.463c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.455 2.27 4.607 2.862 4.607.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.15-3.574 2.15-3.574.119-.254.305-.491.745-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
                    </a>
                    <a href="#" class="social-link" title="Telegram">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    </a>
                    <a href="#" class="social-link" title="WhatsApp">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Booking Section -->
    <section class="section booking" id="booking">
        <div class="container">
            <div class="booking-content">
                <div class="section-header fade-in">
                    <span class="section-tag">Запись</span>
                    <h2 class="section-title">Онлайн-запись</h2>
                    <p class="section-subtitle">Выберите удобное время и запишитесь к любимому мастеру</p>
                </div>

                <div class="booking-form fade-in" id="bookingForm">
                    <form id="appointmentForm" onsubmit="submitForm(event)">
                        <div class="form-group">
                            <label for="name">Ваше имя</label>
                            <input type="text" id="name" class="form-input" placeholder="Как к вам обращаться?" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Телефон</label>
                            <input type="tel" id="phone" class="form-input" placeholder="+7 (___) ___-__-__" required>
                        </div>
                        <div class="form-group">
                            <label for="master">Выберите мастера</label>
                            <select id="master" class="form-input">
                                <option value="">Любой свободный мастер</option>
                                <option value="samir">Самир (Dark Blue)</option>
                                <option value="daniel">Даниэль (Pink)</option>
                                <option value="andrey">Андрей (Pink)</option>
                                <option value="raf">Раф (Green)</option>
                                <option value="elena">Елена — подолог</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="date">Желаемая дата</label>
                                <input type="date" id="date" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="time">Желаемое время</label>
                                <input type="time" id="time" class="form-input" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="comment">Комментарий</label>
                            <textarea id="comment" class="form-input" placeholder="Укажите желаемую услугу или дополнительные пожелания"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-submit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Записаться онлайн
                        </button>
                    </form>
                    <div class="form-success" id="formSuccess">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <h3>Заявка отправлена!</h3>
                        <p>Мы свяжемся с вами в ближайшее время для подтверждения записи.</p>
                    </div>
                </div>

                <div class="booking-alt fade-in">
                    <p>Или запишитесь напрямую через сервис YPlaces</p>
                    <a href="#" class="btn btn-secondary">
                        Открыть YPlaces
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-copy">
                    © 2025 Say's Barbers. Все права защищены.
                </div>
                <div class="footer-links">
                    <a href="#">Политика конфиденциальности</a>
                    <a href="#">Пользовательское соглашение</a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Mobile Menu
        function toggleMenu() {
            const burger = document.querySelector('.burger');
            const mobileMenu = document.getElementById('mobileMenu');
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        }

        function closeMenu() {
            const burger = document.querySelector('.burger');
            const mobileMenu = document.getElementById('mobileMenu');
            burger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Navigation scroll effect
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.nav');
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });

        // Scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

        // Form submission
        function submitForm(e) {
            e.preventDefault();
            const form = document.getElementById('appointmentForm');
            const success = document.getElementById('formSuccess');
            
            // Simulate form submission
            form.style.display = 'none';
            success.classList.add('active');
            
            // Reset after 5 seconds
            setTimeout(() => {
                form.style.display = 'block';
                success.classList.remove('active');
                form.reset();
            }, 5000);
        }

        // Set minimum date for date input
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        // Phone mask
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    if (value[0] === '8') {
                        value = '7' + value.slice(1);
                    }
                    if (value[0] !== '7') {
                        value = '7' + value;
                    }
                }
                
                let formatted = '';
                if (value.length > 0) {
                    formatted = '+7';
                }
                if (value.length > 1) {
                    formatted += ' (' + value.slice(1, 4);
                }
                if (value.length > 4) {
                    formatted += ') ' + value.slice(4, 7);
                }
                if (value.length > 7) {
                    formatted += '-' + value.slice(7, 9);
                }
                if (value.length > 9) {
                    formatted += '-' + value.slice(9, 11);
                }
                
                e.target.value = formatted;
            });
        }
    </script>
</body>
</html>
'''

def generate_landing_page(output_path: str = "says_barbers.html") -> str:
    """
    Generate the Say's Barbers landing page HTML file.
    
    Args:
        output_path: Path where the HTML file will be saved
        
    Returns:
        Path to the generated HTML file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(HTML_CONTENT)
    
    print(f"✅ Landing page generated successfully: {output_path}")
    return output_path


if __name__ == "__main__":
    import sys
    
    # Allow custom output path via command line argument
    output_path = sys.argv[1] if len(sys.argv) > 1 else "says_barbers.html"
    generate_landing_page(output_path)
