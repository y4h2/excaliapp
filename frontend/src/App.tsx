import React, { useState, useEffect, useCallback } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import MainHeader from './components/MainHeader'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import { NoDirectoryEmptyState, NoFilesEmptyState, NoFileSelectedEmptyState } from './components/EmptyState'
import { setDocumentTheme, getSystemTheme } from './lib/utils'
import { UpdateSidebarWidth, UpdateSidebarCollapsed } from '../wailsjs/go/main/App'
import './styles/globals.css'

function AppContent() {
  const {
    files,
    currentFile,
    currentContent,
    isDirty,
    saveStatus,
    appState,
    isLoading,
    error,
    loadFile,
    saveFile,
    openDirectory,
    newFile,
    closeFile,
    updateContent
  } = useApp()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Handle system theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const theme = getSystemTheme()
      setDocumentTheme(theme)
    }

    // Set initial theme
    handleThemeChange()

    // Watch for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  // Restore sidebar state from appState
  useEffect(() => {
    if (appState) {
      setIsSidebarCollapsed(appState.isSidebarCollapsed)
      setSidebarWidth(appState.sidebarWidth)
    }
  }, [appState])

  // Callback functions
  const handleSidebarToggle = useCallback(async () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)

    // Persist to backend
    try {
      await UpdateSidebarCollapsed(newState)
    } catch (error) {
      console.error('Failed to save sidebar state:', error)
    }
  }, [isSidebarCollapsed])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+B: Toggle sidebar
      if (modifier && e.key === 'b') {
        e.preventDefault()
        handleSidebarToggle()
        return
      }

      // Cmd/Ctrl+1-9: Switch to file by index
      if (modifier && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < files.length) {
          loadFile(files[index].path)
        }
        return
      }

      // Cmd/Ctrl+Tab: Next file
      if (modifier && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const currentIndex = files.findIndex(f => f.path === currentFile)
        if (currentIndex >= 0 && files.length > 0) {
          const nextIndex = (currentIndex + 1) % files.length
          loadFile(files[nextIndex].path)
        }
        return
      }

      // Cmd/Ctrl+Shift+Tab: Previous file
      if (modifier && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const currentIndex = files.findIndex(f => f.path === currentFile)
        if (currentIndex >= 0 && files.length > 0) {
          const prevIndex = currentIndex === 0 ? files.length - 1 : currentIndex - 1
          loadFile(files[prevIndex].path)
        }
        return
      }

      // Cmd/Ctrl+/: Show keyboard shortcuts help
      if (modifier && e.key === '/') {
        e.preventDefault()
        setShowKeyboardHelp(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [files, currentFile, handleSidebarToggle, loadFile])

  const handleSidebarResize = useCallback((width: number) => {
    setSidebarWidth(width)
  }, [])

  const handleSidebarResizeComplete = useCallback(async (width: number) => {
    // Persist to backend when resize completes
    try {
      await UpdateSidebarWidth(width)
    } catch (error) {
      console.error('Failed to save sidebar width:', error)
    }
  }, [])

  const handleCanvasChange = useCallback((content: string) => {
    updateContent(content)
  }, [updateContent])

  const handleSave = useCallback(async () => {
    try {
      await saveFile(currentContent)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [saveFile, currentContent])

  const handleFileClick = useCallback((filePath: string) => {
    loadFile(filePath)
  }, [loadFile])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="loading mb-4">Loading application...</div>
          <p className="text-sm text-muted-foreground">Initializing Excalidraw desktop app</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center text-destructive">
          <h2 className="text-lg font-semibold mb-2">Application Error</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        width={sidebarWidth}
        onResize={handleSidebarResize}
        onResizeComplete={handleSidebarResizeComplete}
      />

      <div className="flex-1 flex flex-col">
        <MainHeader
          currentFile={currentFile}
          isDirty={isDirty}
          onSave={handleSave}
          fileCount={files.length}
          currentDirectory={appState?.lastDirectory || null}
          onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
        />

        <div className="flex-1 relative overflow-hidden">
          {!appState?.lastDirectory ? (
            <NoDirectoryEmptyState onOpenDirectory={openDirectory} />
          ) : files.length === 0 ? (
            <NoFilesEmptyState onOpenDirectory={openDirectory} />
          ) : !currentFile ? (
            <NoFileSelectedEmptyState onNewFile={newFile} />
          ) : (
            <Canvas
              content={currentContent}
              onChange={handleCanvasChange}
              isReadOnly={false}
            />
          )}
        </div>

        <StatusBar
          saveStatus={saveStatus}
          currentFile={currentFile}
          fileCount={files.length}
          currentDirectory={appState?.lastDirectory || null}
          onSave={handleSave}
        />
      </div>

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
