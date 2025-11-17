import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Menu, Plus, FolderOpen, PanelLeft, PanelRight, FileText, Circle } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { ExcalidrawFile } from '../types'
import { useApp } from '../contexts/AppContext'

interface FileListItemProps {
  file: ExcalidrawFile
  isActive: boolean
  onClick: () => void
  onRename: (newName: string) => void
}

const FileListItem: React.FC<FileListItemProps> = ({ file, isActive, onClick, onRename }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleStartRename = () => {
    const nameWithoutExt = file.name.replace('.excalidraw', '')
    setEditName(nameWithoutExt)
    setIsEditing(true)
    setShowContextMenu(false)
  }

  const handleSave = () => {
    if (editName.trim() && editName !== file.name.replace('.excalidraw', '')) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false)
      }
    }

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showContextMenu])

  if (isEditing) {
    return (
      <div
        className={cn(
          "file-item",
          isActive && "active"
        )}
      >
        <div className="flex items-center min-w-0 flex-1">
          <FileText className="icon mr-2 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="flex-1 bg-transparent border border-primary rounded px-1 py-0.5 text-sm font-medium outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          "file-item",
          isActive && "active",
          file.hasChanges && "has-changes"
        )}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        title={`${file.name}${file.hasChanges ? ' (modified)' : ''}\nRight-click for options`}
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

      {showContextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50"
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`,
          }}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center space-x-2"
            onClick={handleStartRename}
          >
            <span>Rename</span>
          </button>
        </div>
      )}
    </>
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
  const { files, currentFile, loadFile, openDirectory, newFile, currentDirectory, renameFile } = useApp()

  const handleFileClick = useCallback((file: ExcalidrawFile) => {
    loadFile(file.path)
  }, [loadFile])

  const handleNewFile = useCallback(() => {
    newFile()
  }, [newFile])

  const handleOpenDirectory = useCallback(() => {
    openDirectory()
  }, [openDirectory])

  const handleRename = useCallback((filePath: string, newName: string) => {
    renameFile(filePath, newName)
  }, [renameFile])

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
                onRename={(newName) => handleRename(file.path, newName)}
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