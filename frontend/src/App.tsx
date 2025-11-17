import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import MainHeader from './components/MainHeader'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import RecoveryDialog from './components/RecoveryDialog'
import ThemeToggle, { Theme } from './components/ThemeToggle'
import { NoDirectoryEmptyState, NoFilesEmptyState, NoFileSelectedEmptyState } from './components/EmptyState'
import { setDocumentTheme, getSystemTheme } from './lib/utils'
import { UpdateSidebarWidth, UpdateSidebarCollapsed, UpdateTheme, CheckRecoveryFiles, RecoverFromBackup, DiscardBackup, SaveBackup } from '../wailsjs/go/main/App'
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
  const [theme, setTheme] = useState<Theme>('system')
  const [recoveryFiles, setRecoveryFiles] = useState<any[]>([])
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Handle theme changes (manual or system)
  useEffect(() => {
    const applyTheme = () => {
      if (theme === 'system') {
        const systemTheme = getSystemTheme()
        setDocumentTheme(systemTheme)
      } else {
        setDocumentTheme(theme)
      }
    }

    // Apply theme immediately
    applyTheme()

    // Watch for system theme changes (only when theme is 'system')
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [theme])

  // Restore sidebar state and theme from appState
  useEffect(() => {
    if (appState) {
      setIsSidebarCollapsed(appState.isSidebarCollapsed)
      setSidebarWidth(appState.sidebarWidth)
      if (appState.theme) {
        setTheme(appState.theme as Theme)
      }
    }
  }, [appState])

  // Check for recovery files on startup
  useEffect(() => {
    const checkRecovery = async () => {
      try {
        const files = await CheckRecoveryFiles()
        if (files && files.length > 0) {
          setRecoveryFiles(files)
          setShowRecoveryDialog(true)
        }
      } catch (error) {
        console.error('Failed to check recovery files:', error)
      }
    }

    checkRecovery()
  }, [])

  // Periodic backup save (every 30 seconds when file is open and dirty)
  useEffect(() => {
    if (currentFile && isDirty && currentContent) {
      // Clear existing interval
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current)
      }

      // Set new interval
      backupIntervalRef.current = setInterval(async () => {
        try {
          await SaveBackup(currentContent)
        } catch (error) {
          console.error('Failed to save backup:', error)
        }
      }, 30000) // 30 seconds

      return () => {
        if (backupIntervalRef.current) {
          clearInterval(backupIntervalRef.current)
        }
      }
    }
  }, [currentFile, isDirty, currentContent])

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

  const handleThemeChange = useCallback(async (newTheme: Theme) => {
    setTheme(newTheme)

    // Persist to backend
    try {
      await UpdateTheme(newTheme)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    }
  }, [])

  const handleRecover = useCallback(async (backupPath: string, filePath: string) => {
    try {
      // Recover content from backup
      const content = await RecoverFromBackup(backupPath)

      // Load the file and set recovered content
      await loadFile(filePath)
      updateContent(content)

      // Remove this recovery file from the list
      setRecoveryFiles(prev => prev.filter(f => f.backupPath !== backupPath))

      // Close dialog if no more files
      if (recoveryFiles.length <= 1) {
        setShowRecoveryDialog(false)
      }
    } catch (error) {
      console.error('Failed to recover file:', error)
    }
  }, [loadFile, updateContent, recoveryFiles.length])

  const handleDiscardBackup = useCallback(async (backupPath: string) => {
    try {
      await DiscardBackup(backupPath)

      // Remove from list
      setRecoveryFiles(prev => prev.filter(f => f.backupPath !== backupPath))

      // Close dialog if no more files
      if (recoveryFiles.length <= 1) {
        setShowRecoveryDialog(false)
      }
    } catch (error) {
      console.error('Failed to discard backup:', error)
    }
  }, [recoveryFiles.length])

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
        >
          <ThemeToggle currentTheme={theme} onThemeChange={handleThemeChange} />
        </StatusBar>
      </div>

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {showRecoveryDialog && (
        <RecoveryDialog
          recoveryFiles={recoveryFiles}
          onRecover={handleRecover}
          onDiscard={handleDiscardBackup}
          onClose={() => setShowRecoveryDialog(false)}
        />
      )}
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
