# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExcaliApp is a desktop application for viewing and editing Excalidraw files. It's built using Wails v2 (Go backend + React TypeScript frontend) and follows a dual-panel design: sidebar for file management and main canvas for Excalidraw editing.

## Development Commands

### Primary Development
```bash
wails dev                    # Start development server with hot reload (frontend + backend)
```

### Frontend Development
```bash
cd frontend && npm install   # Install frontend dependencies (required first time)
cd frontend && npm run dev   # Frontend only development server
```

### Building
```bash
wails build                  # Build production application for current platform
cd frontend && npm run build # Build frontend only
```

### Go Module Management
```bash
go mod tidy                  # Clean up Go dependencies
go mod download              # Download Go dependencies
```

## Architecture

### Technology Stack
- **Backend**: Go 1.23 with Wails v2.11.0
- **Frontend**: React 18.2.0 + TypeScript + Vite 3.0.7
- **Communication**: Auto-generated TypeScript bindings via `frontend/wailsjs/`
- **Distribution**: Single binary with embedded web assets

### Project Structure
```
/Users/y4h2/projects/excaliapp/
├── main.go                   # Application entry point (1024x768 window)
├── app.go                    # Main App struct - backend logic goes here
├── go.mod                    # Go dependencies
├── wails.json               # Wails configuration
├── frontend/                # React TypeScript frontend
│   ├── src/App.tsx          # Main React component
│   ├── src/main.tsx         # React entry point
│   └── wailsjs/             # Auto-generated bindings (DO NOT EDIT)
├── build/                   # Platform-specific build assets
└── specs/                   # Product requirements and design
```

### Key Files
- **main.go**: Wails app configuration, window setup (1024x768), asset embedding
- **app.go**: Backend application logic, exposed methods to frontend via Wails binding
- **frontend/src/App.tsx**: Main React component, frontend application logic

### Wails Communication Pattern
1. Define methods in `App` struct (app.go) with `//export` comments
2. Methods are automatically exposed to frontend via Wails binding
3. Frontend calls backend methods through auto-generated bindings in `frontend/wailsjs/`
4. Backend can call frontend runtime methods using saved context

## Current State

The project is in initial setup phase with basic Wails template structure. Core functionality to implement:
- Directory selection and file discovery
- Excalidraw SDK integration
- Auto-save system
- Dual-panel UI (sidebar + canvas)

## Product Requirements

Refer to `/Users/y4h2/projects/excaliapp/specs/0001-spec.md` for detailed Chinese PRD. Key features:
- Local `.excalidraw` file management
- Directory-based file browser in sidebar
- Full Excalidraw editing in main canvas
- Auto-save when switching files
- Remember last used directory

## Development Notes

- **No test framework** currently configured
- **No linting** setup (consider adding ESLint/Prettier)
- **Frontend dev server** runs at `http://localhost:34115` during `wails dev`
- **Hot reload** enabled for both frontend and backend changes
- **File operations** should use Go backend for native file system access
- **State management** currently basic - consider React Context for complex state