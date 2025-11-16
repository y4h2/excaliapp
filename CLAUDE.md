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
- **Frontend**: React 18.2.0 + TypeScript + Vite 7.2.2
- **Styling**: TailwindCSS
- **Excalidraw**: Full SDK integration
- **Communication**: Auto-generated TypeScript bindings via `frontend/wailsjs/`
- **Distribution**: Single binary with embedded web assets

### Project Structure
```
/Users/y4h2/projects/excaliapp/
├── main.go                   # Application entry point
├── app.go                    # Main App struct with backend logic
├── file_manager.go           # File system operations
├── auto_save.go              # Auto-save functionality
├── menu.go                   # Native menu bar
├── persistence.go            # State persistence
├── build/                   # Platform-specific build assets
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── main.tsx         # React entry point with global shims
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React Context (AppContext.tsx)
│   │   ├── lib/             # Utilities
│   │   └── styles/          # Global styles
│   └── wailsjs/             # Auto-generated bindings (DO NOT EDIT)
└── specs/                   # Product requirements and design
```

### Key Files
- **app.go**: Main application struct with file management and auto-save
- **file_manager.go**: Handles directory scanning and file operations
- **auto_save.go**: Debounced auto-save with multiple triggers
- **menu.go**: Cross-platform native menu bar
- **frontend/src/App.tsx**: Main React component with sidebar and canvas
- **frontend/src/contexts/AppContext.tsx**: Centralized state management
- **frontend/vite.config.ts**: Vite config with Node.js global shims for Excalidraw

### Wails Communication Pattern
1. Backend methods defined on `App` struct are automatically bound
2. Frontend imports from `../../wailsjs/runtime/runtime` for events
3. Frontend imports from `../../wailsjs/go/main` for Go method calls
4. Runtime initialization: Add delay/check before using EventsOn (see AppContext.tsx:146-171)

## Current State

The application is **fully functional** with all core features implemented:
✅ File management (directory selection, auto-scan, .excalidraw file discovery)
✅ Native menu bar with File menu (Open Directory, New File, Save, Close, Exit)
✅ Full Excalidraw SDK integration in main canvas
✅ Auto-save system (on file switch, app blur, 5s inactivity)
✅ Dual-panel UI (collapsible sidebar + main canvas)
✅ State persistence (last directory, window size, sidebar state)
✅ Cross-platform support (macOS, Windows, Linux)

### Known Implementation Details

**Excalidraw Compatibility**: Excalidraw requires Node.js globals (`process`, `global`). Fixed by adding Vite `define` in `vite.config.ts`:
```javascript
define: {
  'process.env': {},
  'process.platform': '"browser"',
  'process.version': '""',
  global: 'globalThis'
}
```

**Runtime Initialization**: EventsOn needs runtime to be ready. Fixed with async setup and error handling in AppContext.tsx.

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