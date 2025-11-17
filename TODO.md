# ExcaliApp TODO List

Based on PRD analysis (specs/0001-spec.md) - Last updated: 2025-11-16

## Overall Status
- **P0 (Core Features):** ✅ 100% Complete
- **P1 (Important Features):** ✅ 100% Complete
- **P2 (Enhancement Features):** 🟡 50% Complete
- **Overall Completion:** ~92%

---

## HIGH Priority - Bug Fixes

### 1. ❌ Fix Sidebar Width Persistence Bug
**Status:** Not implemented (broken feature)
**Location:** `frontend/src/components/Sidebar.tsx`, `app.go`
**Issue:** ResizeHandle component exists and works in UI, but width changes don't persist to backend AppState. After restart, sidebar reverts to default 300px.

**Fix Required:**
- Add `UpdateSidebarWidth(width int)` method in `app.go`
- Update `AppState` struct to persist `SidebarWidth` field
- Call backend method from `handleSidebarResize` in `App.tsx`
- Ensure persistence saves to config file

**Priority:** HIGH (data loss - user preferences not saved)

---

## MEDIUM Priority - UX Enhancements

### 2. ✅ Add Keyboard Shortcuts
**Status:** Implemented
**Location:** `frontend/src/App.tsx`, `frontend/src/components/KeyboardShortcutsHelp.tsx`, `menu.go`

**Implemented Shortcuts:**

**File Operations:**
- Cmd/Ctrl+O: Open directory
- Cmd/Ctrl+N: New file
- Cmd/Ctrl+S: Save current file
- Cmd/Ctrl+W: Close current file
- Cmd/Ctrl+Q: Quit application

**Navigation:**
- Cmd/Ctrl+1-9: Switch to file by index
- Cmd/Ctrl+Tab: Next file
- Cmd/Ctrl+Shift+Tab: Previous file
- Cmd/Ctrl+B: Toggle sidebar

**Help:**
- Cmd/Ctrl+/: Show keyboard shortcuts help dialog

**Implementation:**
- Global keyboard event handler in `App.tsx` (lines 60-117)
- Help modal component with all shortcuts listed
- Help button in MainHeader with HelpCircle icon
- Cross-platform modifier key detection (Cmd on macOS, Ctrl on Windows/Linux)

**Priority:** MEDIUM (improves power user experience) ✅ COMPLETED

---

### 3. ✅ File Search/Filter in Sidebar
**Status:** Implemented
**Location:** `frontend/src/components/Sidebar.tsx`

**Implemented Features:**
- Search input field with magnifying glass icon (appears when directory has files)
- Real-time filtering of file list by name (case-insensitive)
- Clear search button (X icon) appears when typing
- "No matching files" empty state with clear search option
- Keyboard shortcut: Cmd/Ctrl+F to focus search box
- Search bar positioned below "Open Directory" button

**Implementation Details:**
- `searchTerm` state and `searchInputRef` for input control
- `filteredFiles` computed from files array using lowercase matching
- Three UI states:
  1. No files: "No .excalidraw files found"
  2. Files but no matches: "No matching files" with clear button
  3. Matches found: Display filtered file list
- Keyboard listener for Cmd/Ctrl+F (lines 305-320)
- Auto-focus on clear for better UX

**Priority:** MEDIUM (useful when managing many files) ✅ COMPLETED

---

### 4. ❌ Manual Dark Mode Toggle
**Status:** Partially implemented
**Location:** `frontend/src/App.tsx`, `frontend/src/lib/utils.ts`
**Current State:** App follows system theme automatically

**Missing:**
- Manual theme override (light/dark/system)
- Theme preference persistence
- Toggle button in UI (header or status bar)

**Implementation:**
- Add `theme` field to AppState ("system" | "light" | "dark")
- Add theme toggle button component
- Override system theme when manually selected
- Save preference to backend persistence

**Priority:** MEDIUM (user preference feature)

---

## LOW Priority - Nice-to-Have

### 5. ❌ Crash Recovery with Temp Backups
**Status:** Not implemented
**Location:** `auto_save.go`, `frontend/src/contexts/AppContext.tsx`
**PRD Reference:** Section 5.2 - Stability Requirements
**Current State:** Auto-save on blur/switch reduces risk

**Missing:**
- Temporary backup files during editing
- Recovery check on app startup
- User prompt to restore unsaved content

**Implementation:**
- Save temp backup every N seconds while editing
- On startup, check for temp files newer than last saved version
- Prompt user with recovery option if found
- Clean up temp files after successful recovery

**Priority:** LOW (auto-save already covers most cases)

---

### 6. ❌ Trash/Recycle Bin Integration
**Status:** Not implemented
**Location:** `file_manager.go:283` (uses `os.Remove()`)
**PRD Reference:** Section 2.4.3 - Optional safety feature

**Missing:**
- Move files to system trash instead of permanent deletion
- Cross-platform trash support (macOS/Windows/Linux)

**Implementation:**
- Use cross-platform trash library (e.g., `github.com/atotto/trash` or similar)
- Replace `os.Remove()` with trash move operation
- Optional: Add preference toggle for permanent delete vs trash

**Priority:** LOW (nice safety feature but not critical)

---

## Completed Features (Reference)

### P0 - Core Features ✅
- [x] Directory selection and file list display
- [x] Excalidraw editor integration
- [x] File opening and switching
- [x] Auto-save mechanism (5s debounce, on file switch, on blur)

### P1 - Important Features ✅
- [x] New file creation with auto-incremented naming
- [x] Rename file (inline header + context menu)
- [x] Delete file with confirmation dialog
- [x] Status bar with save status display
- [x] Save state indicators and timestamps

### P2 - Partial ✅
- [x] File modification time in sidebar
- [x] Unsaved file markers (dot indicator)
- [x] Sidebar collapse/expand
- [x] System theme following (dark/light mode)

---

## Future Enhancements (Not in Current Version)
- File export (PNG, SVG, PDF)
- Multi-tab support
- Cloud sync
- Team collaboration
- Version history

---

**Next Steps:**
1. Fix sidebar width persistence (HIGH)
2. Add keyboard shortcuts (MEDIUM)
3. Implement file search (MEDIUM)
4. Add dark mode toggle (MEDIUM)
