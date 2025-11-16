import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { isValidExcalidrawContent } from '../lib/utils'

interface CanvasProps {
  content: string
  onChange: (content: string) => void
  isReadOnly?: boolean
}

const Canvas: React.FC<CanvasProps> = ({ content, onChange, isReadOnly = false }) => {
  const [isLoading, setIsLoading] = useState(true)
  const contentRef = useRef(content)

  // Update content ref when content prop changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Handle scene changes
  const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    try {
      // Create the Excalidraw JSON structure
      const excalidrawData = {
        type: "excalidraw",
        version: 2,
        source: "https://excaliapp",
        elements: elements,
        appState: {
          ...appState,
          theme: appState.theme || 'light'
        },
        files: files || {}
      }

      const newContent = JSON.stringify(excalidrawData, null, 2)

      // Only trigger onChange if content actually changed
      if (newContent !== contentRef.current) {
        contentRef.current = newContent
        onChange(newContent)
      }
    } catch (error) {
      console.error('Failed to serialize Excalidraw content:', error)
    }
  }, [onChange])

  if (isLoading) {
    return (
      <div className="canvas-container loading">
        Loading Excalidraw...
      </div>
    )
  }

  return (
    <div className="canvas-container">
      <Excalidraw
        onChange={handleChange}
        isCollaborating={false}
        gridModeEnabled={false}
        viewModeEnabled={isReadOnly}
        zenModeEnabled={false}
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        name="Excalidraw Canvas"
        renderTopRightUI={() => <div />} // Hide default UI
        renderCustomStats={() => <div />} // Hide custom stats
        UIOptions={{
          canvasActions: {
            export: false, // Hide export button
            loadScene: false,   // Hide load button
            saveToActiveFile: false, // Hide save as button
          },
          tools: {
            image: false, // Disable image tool
          }
        }}
        initialData={{
          appState: {
            viewBackgroundColor: document.documentElement.classList.contains('dark') ? '#1e1e1e' : '#ffffff',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
          }
        }}
      />
    </div>
  )
}

export default Canvas