import React, { useState, useRef, useCallback } from 'react'
import { Menu, Plus, FolderOpen, PanelLeft, PanelRight, FileText, Circle } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { ExcalidrawFile } from '../types'
import { useApp } from '../contexts/AppContext'

interface FileListItemProps {
  file: ExcalidrawFile
  isActive: boolean
  onClick: () => void
  onDoubleClick: () => void
}

const FileListItem: React.FC<FileListItemProps> = ({ file, isActive, onClick, onDoubleClick }) => {
  return (
    <div
      className={cn(
        "file-item",
        isActive && "active",
        file.hasChanges && "has-changes"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${file.name}${file.hasChanges ? ' (modified)' : ''}`}
    >
      <div className="flex items-center min-w-0">
        <FileText className="icon mr-2 flex-shrink-0" />
        <span className="truncate font-medium">{file.name}</span>
        {file.isNew && <Circle className="icon-sm ml-1 text-green-500" />}
      </div>
      <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
        {formatDate(file.modified)}
      </div>
    </div>
  )
}

interface ResizeHandleProps {
  onResize: (delta: number) => void
  minWidth: number
  maxWidth: number
  initialWidth: number
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, minWidth, maxWidth, initialWidth }) => {
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(initialWidth)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = initialWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta))
      onResize(newWidth - startWidthRef.current)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
  }, [onResize, minWidth, maxWidth, initialWidth])

  return (
    <div
      className={cn("resize-handle", isResizing && "bg-primary")}
      onMouseDown={handleMouseDown}
    >
      <div className="sr-only">Resize sidebar</div>
    </div>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  width: number
  onResize: (width: number) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, width, onResize }) => {
  const { files, currentFile, loadFile, openDirectory, newFile, currentDirectory } = useApp()

  const handleFileClick = useCallback((file: ExcalidrawFile) => {
    loadFile(file.path)
  }, [loadFile])

  const handleNewFile = useCallback(() => {
    newFile()
  }, [newFile])

  const handleOpenDirectory = useCallback(() => {
    openDirectory()
  }, [openDirectory])

  if (isCollapsed) {
    return (
      <div className="sidebar w-12 p-2">
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-icon"
            title="Expand sidebar"
          >
            <PanelRight className="icon" />
          </button>
          <button
            onClick={handleOpenDirectory}
            className="btn btn-ghost btn-icon"
            title="Open directory"
          >
            <FolderOpen className="icon" />
          </button>
          <button
            onClick={handleNewFile}
            className="btn btn-ghost btn-icon"
            title="New file"
          >
            <Plus className="icon" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="sidebar relative"
      style={{ width: `${width}px` }}
    >
      <div className="sidebar-header">
        <div className="flex items-center">
          <Menu className="icon mr-2" />
          <h2 className="font-semibold text-sm">Files</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleNewFile}
            className="btn btn-ghost btn-icon btn-sm"
            title="New file"
          >
            <Plus className="icon-sm" />
          </button>
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-icon btn-sm"
            title="Collapse sidebar"
          >
            <PanelLeft className="icon-sm" />
          </button>
        </div>
      </div>

      <div className="p-2 border-b">
        <button
          onClick={handleOpenDirectory}
          className="btn btn-secondary w-full text-sm"
        >
          <FolderOpen className="icon-sm mr-2" />
          {currentDirectory ? 'Change Directory' : 'Open Directory'}
        </button>
        {currentDirectory && (
          <div className="text-xs text-muted-foreground mt-2 truncate" title={currentDirectory}>
            {currentDirectory}
          </div>
        )}
      </div>

      <div className="sidebar-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm">No .excalidraw files found</p>
            <p className="text-xs mt-1">Open a directory to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <FileListItem
                key={file.path}
                file={file}
                isActive={currentFile === file.path}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleFileClick(file)}
              />
            ))}
          </div>
        )}
      </div>

      <ResizeHandle
        onResize={(delta) => onResize(width + delta)}
        minWidth={200}
        maxWidth={500}
        initialWidth={width}
      />
    </div>
  )
}

export default Sidebar