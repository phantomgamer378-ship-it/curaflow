# CuraFlow Design System

## Overview
CuraFlow is a premium clinic appointment and live queue management platform. The visual identity is calm, trustworthy, modern — inspired by nature, wellness, and clinical precision.

## Brand Voice
- **Calm** — No unnecessary noise. Every element earns its place.
- **Trustworthy** — Medical-grade clarity. Clear hierarchy. No ambiguity.
- **Modern** — Clean type, generous whitespace, subtle animation.
- **Human** — Warm teal tones, not cold clinical blue.

## Color Palette

### Primary
- Brand Teal: `#176b5f` — primary buttons, links, highlights, brand moments
- Brand Dark: `#0d4d44` — hover states, depth variants
- Accent Teal: `#4ec9b0` — highlights, badges, progress indicators

### Surface
- Canvas: `#f5f7f3` — main page background (light)
- Cream: `#fbfaf5` — auth/form backgrounds
- White: `#ffffff` — cards, panels, inputs
- Mint: `#d9eee8` — section backgrounds, icon fills, subtle accents

### Text
- Ink: `#17312d` — primary text (near-black, warm)
- Muted: `#647672` — secondary text, labels, placeholders
- Line: `#dce4e0` — borders, dividers

### Dark Mode Equivalents
- Dark Canvas: `#0f1a18`
- Dark White: `#111c1a`
- Dark Mint: `#1a3530`
- Dark Ink: `#e8ede9`
- Dark Muted: `#8fa49f`
- Dark Line: `#1e2e2a`
- Dark Brand: `#4ec9b0`

### Status Colors
- Success / Live: `#49a671` (green)
- Warning / Waiting: `#d97706` (amber)
- Error / Remove: `#dc2626` (red)
- Info: `#3a748e` (blue)

## Typography

### Headline Font: Playfair Display
- `font-family: "Playfair Display", Georgia, serif`
- Used for: h1, h2, h3, auth headings, large stats, queue numbers
- Weights: 400 (regular), 500 (medium), italic for accents
- Letter spacing: -0.04em to -0.055em for large display sizes

### Body Font: Manrope
- `font-family: "Manrope", "Avenir Next", "Segoe UI", sans-serif`
- Used for: all body copy, labels, navigation, buttons, inputs
- Weights: 400 (regular), 600 (semibold), 700 (bold), 800 (heavy)

### Type Scale
- Display XL: 72-74px, Playfair, weight 400, -0.055em tracking
- Display LG: 52-61px, Playfair, weight 400, -0.05em tracking
- Display MD: 38-48px, Playfair, weight 400, -0.045em tracking
- Display SM: 27-34px, Playfair, weight 400, -0.04em tracking
- Body LG: 17px, Manrope, weight 400, 1.7 line-height
- Body MD: 14px, Manrope, weight 400, 1.6 line-height
- Body SM: 12-13px, Manrope, weight 400, 1.65 line-height
- Label: 9-11px, Manrope, weight 800, 0.08-0.13em tracking, ALL CAPS
- Micro: 8-9px, Manrope, weight 700

## Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 72, 104px
- Container max-width: 1180px, padding: 28px inline
- Section padding-block: 104px desktop, 75px mobile

## Border Radius
- Pill / Badge: 999px
- Button primary: 999px (pill)
- Card standard: 14-16px
- Card hero/featured: 20-28px
- Input: 12px
- Icon container: 10-14px
- Avatar: 50% (circle)

## Shadows
- Card subtle: `0 2px 8px rgba(20,48,43,.06)`
- Card hover: `0 20px 50px rgba(43,69,64,.08)`
- Card featured: `0 34px 80px rgba(46,82,73,.18)`
- Serving card: `0 32px 80px rgba(23,107,95,.28)`
- Menu dropdown: `0 18px 50px rgba(20,48,43,.15)`

## Component Specifications

### Buttons
- Primary: bg `#176b5f`, color white, pill-shaped, padding 14px 26px, hover `#0d4d44`
- Ghost: transparent bg, 1.5px border `#176b5f`, color `#176b5f`, hover fill mint
- Light: semi-transparent white (for dark backgrounds)
- Large modifier: min-height 56px, font-size 16px
- Icon gap: 9px

### Cards
- Background: white
- Border: 1px solid `#dce4e0`
- Border-radius: 14-20px
- Padding: 28-32px
- Hover: translateY(-3px), enhanced shadow

### Navigation
- Desktop header: sticky, glass-morphism, 72px height
- Sidebar: 245px width, white, border-right
- Nav links: 43px min-height, 10px border-radius, 12px font-size
- Active state: mint background, brand color text

### Forms / Inputs
- Height: 50px min
- Border: 1px solid `#d5dfdb`, focus `#176b5f`
- Border-radius: 12px
- Padding: 0 15px
- Label: 12px, weight 750, color `#354d48`
- Placeholder: `#a5b0ad`

### Status Pills
- Border-radius: 999px
- Font-size: 10px, weight 750
- Padding: 6px 10px
- Live/Confirmed: green `#e7f6ed` bg, `#317458` text
- Pending: amber bg, amber text
- Consultation: green, pulsing dot

### Dashboard Panels
- Background: white
- Border: 1px solid `#dce4e0`
- Border-radius: 15px
- Panel header: 55px height, border-bottom, flex space-between

### Queue Display
- Now Serving number: Playfair Display, 90-140px, weight 400
- Token card: brand gradient background, 28px radius, deep shadow
- Metrics cards: white, 15px radius, centered content

## Page Layouts

### Marketing / Landing
- Full-bleed hero with radial mint gradient
- 2-column grid: 1fr / 1fr (copy + visual)
- Floating glass appointment card in hero right column
- 3-column how-it-works cards on mint background
- Dark teal clinic callout panel
- Testimonials 3-column grid

### Auth (Login / Register)
- Split screen: 42% branded aside / 58% form panel
- Aside: deep teal gradient (#124c44 → #0a2e28), white text
- Form panel: cream background (#fbfaf5)
- Form card: max-width 430px, centered

### Dashboard
- Grid: 245px sidebar / 1fr main
- Sticky topbar: 68px, glass effect
- Page padding: 45px 42px desktop, 30px 20px mobile
- Stats row: 3 columns, 118px min-height cards

### Live Queue Public Display
- Full page: mint/pale green background (#f1f5f1)
- Centered content, max-width 860px
- Hero token card: max-width 520px, dramatic shadow
- 3-column metrics grid below

## Animation Principles
- All transitions: 160-180ms ease
- Hover lifts: translateY(-2px to -3px)
- Card hover shadows: smooth
- Button hover: color transition + slight scale
- Arc reveal intro: cubic-bezier(0.85, 0, 0.15, 1) 1.5s
- Greeting text: fade + translate, 420ms
- Reduced motion: respect prefers-reduced-motion

## Iconography
- Library: Lucide React (stroke-width 1.6-1.7)
- Sizes: 14px (micro), 16px (standard), 18px (medium), 22-25px (large)
- Color: inherits from parent or explicitly `var(--brand)`

## Dark Mode
- Triggered by `data-theme="dark"` on `<html>`
- Default: follows `prefers-color-scheme`
- Persisted: `localStorage` key `curaflow_theme`
- Flash prevention: inline script before hydration
- Toggle: sun/moon icon button on every page
