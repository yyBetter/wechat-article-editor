# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3001 (not 3000, configured in vite.config.ts)
- `npm run build` - Build production version (runs TypeScript check + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with TypeScript support

## Architecture Overview

This is a WeChat public account article formatting tool built with React + TypeScript + Vite. The application uses a **template engine architecture** where users write in Markdown and the system applies professional WeChat article styling.

### Core Architecture Pattern

The app follows a **Template-Engine-Preview** pattern:
1. **Templates** (`src/templates/`) define styling rules and fixed elements (headers/footers)
2. **TemplateEngine** (`src/utils/template-engine.ts`) processes Markdown + applies template styles + injects brand assets
3. **Preview** renders final WeChat-styled HTML that can be copied directly to WeChat editor

### State Management Architecture

Uses React Context + useReducer pattern (`src/utils/app-context.tsx`):
- **AppState** contains all app state (editor content, selected template, brand assets, UI state)
- **Actions** include `UPDATE_EDITOR_CONTENT`, `SELECT_TEMPLATE`, `UPDATE_TEMPLATE_VARIABLES`, etc.
- State flows: User input → Actions → Reducer → Template Engine → Preview update

### Template System Design

Templates are TypeScript objects with:
- **styles**: CSS-in-JS styling rules for typography, containers, elements
- **fixedElements**: Header/footer templates with variable interpolation (e.g. `{{title}}`, `{{#if logo}}`)
- **Brand color integration**: Templates automatically apply user's brand colors to predefined color values

Key insight: The template engine uses a **multi-pass variable substitution** system to handle nested conditionals like `{{#if author}}...{{#if date}}...{{/if}}...{{/if}}`.

### Component Organization

- **Left Sidebar**: Template selection, global settings, publish flow (tabbed interface)
- **Center**: Markdown editor with toolbar
- **Right**: Real-time WeChat-styled preview

### WeChat Integration Features

- **Rich Text Copy**: Uses `document.createRange()` to copy formatted content directly pasteable to WeChat editor
- **Mobile Preview**: Generates QR codes for mobile preview (simulated WeChat browser environment)
- **Brand Asset Pipeline**: Logo, QR codes, dividers automatically inject into articles
- **Color Theme System**: User-configured brand colors dynamically replace template colors

## Critical Implementation Details

### Template Variable Processing
The `renderTemplateString()` method in TemplateEngine handles nested conditionals through iterative processing - it must process inner-most conditionals first to avoid parsing conflicts.

### Brand Color Application
Brand colors from user settings are passed through the entire rendering pipeline:
```
Settings → App State → Template Variables → Template Engine → CSS Generation → Preview
```

Colors are dynamically substituted during CSS generation where `#1e6fff` → user's primary brand color.

### WeChat Styling Compliance
Preview CSS uses WeChat's exact specifications:
- Container max-width: 677px (WeChat standard)
- Font family: `-apple-system-font, "Helvetica Neue"`
- Font sizes: H1 24px, H2 20px, body 17px, line-height 1.75
- Link color: Brand primary or WeChat blue #576b95

### Copy Functionality Architecture
Two copy modes:
1. **Rich text copy**: Creates temporary DOM element, selects content, uses `document.execCommand('copy')` for direct paste to WeChat
2. **Plain text copy**: Strips Markdown syntax, converts to clean text with bullet points

## File Structure Context

- `src/templates/` - Template definitions (simple-doc.ts, image-text.ts)
- `src/components/PublishFlow.tsx` - WeChat publishing simulation with progress steps
- `src/components/WeChatConfig.tsx` - WeChat API authorization interface (mock implementation)
- `src/styles/` - Component-specific stylesheets (publish.css, sidebar.css, wechat-theme.css)
- `/style/` - Reference images from original WeChat articles for template design

## Development Notes

- Server runs on port 3001 (conflicts with other projects on 3000)
- Uses manual JSX transform in vite.config.ts (esbuild jsx: 'transform')
- All brand assets (logos, QR codes) are stored as URLs in app state, not uploaded files
- Template engine supports intelligent template recommendation based on content analysis (image count, code blocks, lists)
- WeChat publishing is currently simulated - real WeChat API integration is architected but not implemented