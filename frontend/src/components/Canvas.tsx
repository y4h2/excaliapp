import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { isValidExcalidrawContent } from '../lib/utils'

interface CanvasProps {
  content: string
  onChange: (content: string) => void
  isReadOnly?: boolean
}

// Normalize JSON by sorting keys recursively
const normalizeJSON = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeJSON)

  const sorted: any = {}
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = normalizeJSON(obj[key])
  })
  return sorted
}

const Canvas: React.FC<CanvasProps> = ({ content, onChange, isReadOnly = false }) => {
  const [isLoading, setIsLoading] = useState(true)
  const contentRef = useRef(content)
  const [initialElements, setInitialElements] = useState([])

  // Update content ref when content prop changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Parse initial data from content
  useEffect(() => {
    try {
      if (content) {
        const data = JSON.parse(content)
        if (data.elements) {
          setInitialElements(data.elements)
        }
      }
    } catch (error) {
      console.error('Failed to parse content:', error)
    }
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

      // Debug: compare contents
      if (newContent !== contentRef.current) {
        console.log('🔴 Content changed!')
        console.log('📄 Original length:', contentRef.current.length)
        console.log('📄 New length:', newContent.length)

        try {
          const originalData = JSON.parse(contentRef.current)
          const newData = JSON.parse(newContent)

          console.log('🔍 Original elements count:', originalData.elements?.length || 0)
          console.log('🔍 New elements count:', newData.elements?.length || 0)

          // Normalize and compare to ignore property order differences
          const normalizedOriginalElements = normalizeJSON(originalData.elements)
          const normalizedNewElements = normalizeJSON(newData.elements)
          const normalizedOriginalFiles = normalizeJSON(originalData.files)
          const normalizedNewFiles = normalizeJSON(newData.files)

          const elementsChanged = JSON.stringify(normalizedOriginalElements) !== JSON.stringify(normalizedNewElements)
          const filesChanged = JSON.stringify(normalizedOriginalFiles) !== JSON.stringify(normalizedNewFiles)

          console.log('📊 Elements changed:', elementsChanged)
          console.log('📊 Files changed:', filesChanged)

          // Detailed appState comparison
          const originalAppState = originalData.appState || {}
          const newAppState = newData.appState || {}

          console.group('🔎 AppState Comparison')

          // Get all unique keys from both objects
          const allKeys = new Set([...Object.keys(originalAppState), ...Object.keys(newAppState)])

          const changedFields: string[] = []
          const addedFields: string[] = []
          const removedFields: string[] = []

          allKeys.forEach(key => {
            const hasOriginal = key in originalAppState
            const hasNew = key in newAppState

            if (!hasOriginal && hasNew) {
              addedFields.push(key)
              console.log(`  ➕ ${key}: (added) = ${JSON.stringify(newAppState[key])}`)
            } else if (hasOriginal && !hasNew) {
              removedFields.push(key)
              console.log(`  ➖ ${key}: (removed) was ${JSON.stringify(originalAppState[key])}`)
            } else if (JSON.stringify(originalAppState[key]) !== JSON.stringify(newAppState[key])) {
              changedFields.push(key)
              console.log(`  🔄 ${key}:`)
              console.log(`     Old: ${JSON.stringify(originalAppState[key])}`)
              console.log(`     New: ${JSON.stringify(newAppState[key])}`)
            }
          })

          console.log(`Total fields changed: ${changedFields.length}`)
          console.log(`Total fields added: ${addedFields.length}`)
          console.log(`Total fields removed: ${removedFields.length}`)
          console.groupEnd()

          if (!elementsChanged && !filesChanged) {
            console.log('⚠️ Only appState changed, not actual drawing content - NOT marking as dirty')
            console.log('Changed fields:', changedFields)
            console.log('Added fields:', addedFields)
            console.log('Removed fields:', removedFields)

            // Update contentRef but DON'T call onChange since only viewport/UI state changed
            contentRef.current = newContent
            return // Don't trigger onChange for appState-only changes
          }
        } catch (e) {
          console.error('Failed to parse for comparison:', e)
        }

        console.log('✅ Actual content changed - marking as dirty')
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
          elements: initialElements,
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