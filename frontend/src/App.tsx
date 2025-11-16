import React, { useState, useEffect, useCallback } from 'react'
import { AppProvider, useApp } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import StatusBar from './components/StatusBar'
import MainHeader from './components/MainHeader'
import { NoDirectoryEmptyState, NoFilesEmptyState, NoFileSelectedEmptyState } from './components/EmptyState'
import { setDocumentTheme, getSystemTheme } from './lib/utils'
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

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev)
  }, [])

  const handleSidebarResize = useCallback((width: number) => {
    setSidebarWidth(width)
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
      />

      <div className="flex-1 flex flex-col">
        <MainHeader
          currentFile={currentFile}
          isDirty={isDirty}
          onSave={handleSave}
          fileCount={files.length}
          currentDirectory={appState?.lastDirectory || null}
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
