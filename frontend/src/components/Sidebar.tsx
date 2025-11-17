import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Menu, Plus, FolderOpen, PanelLeft, PanelRight, FileText, Circle, Search, X } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { ExcalidrawFile } from '../types'
import { useApp } from '../contexts/AppContext'

interface FileListItemProps {
  file: ExcalidrawFile
  isActive: boolean
  onClick: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

const FileListItem: React.FC<FileListItemProps> = ({ file, isActive, onClick, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

  const handleDelete = () => {
    setShowContextMenu(false)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false)
    onDelete()
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
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
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-32"
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`,
          }}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
            onClick={handleStartRename}
          >
            <span>Rename</span>
          </button>
          <div className="border-t border-border my-1"></div>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-destructive transition-colors"
            onClick={handleDelete}
          >
            <span>Delete</span>
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancelDelete}>
          <div
            className="bg-popover border border-border rounded-lg shadow-xl p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Delete File?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <span className="font-medium text-foreground">"{file.name}"</span>?
              <br />
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelDelete}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface ResizeHandleProps {
  onResize: (delta: number) => void
  onResizeComplete?: (finalWidth: number) => void
  minWidth: number
  maxWidth: number
  initialWidth: number
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, onResizeComplete, minWidth, maxWidth, initialWidth }) => {
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(initialWidth)
  const currentWidthRef = useRef(initialWidth)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = initialWidth
    currentWidthRef.current = initialWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta))
      currentWidthRef.current = newWidth
      onResize(newWidth - startWidthRef.current)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''

      // Trigger complete callback with final width
      if (onResizeComplete) {
        onResizeComplete(currentWidthRef.current)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
  }, [onResize, onResizeComplete, minWidth, maxWidth, initialWidth])

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
  onResizeComplete?: (width: number) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, width, onResize, onResizeComplete }) => {
  const { files, currentFile, loadFile, openDirectory, newFile, currentDirectory, renameFile, deleteFile } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter files based on search term
  const filteredFiles = useCallback(() => {
    if (!searchTerm.trim()) return files

    const term = searchTerm.toLowerCase()
    return files.filter(file =>
      file.name.toLowerCase().includes(term)
    )
  }, [files, searchTerm])()

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

  const handleDelete = useCallback((filePath: string) => {
    deleteFile(filePath)
  }, [deleteFile])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    searchInputRef.current?.focus()
  }, [])

  // Keyboard shortcut to focus search (Cmd/Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl+F: Focus search input (only if sidebar is expanded and has files)
      if (modifier && e.key === 'f' && !isCollapsed && files.length > 0) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, files.length])

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

      <div className="p-2 border-b space-y-2">
        <button
          onClick={handleOpenDirectory}
          className="btn btn-secondary w-full text-sm"
        >
          <FolderOpen className="icon-sm mr-2" />
          {currentDirectory ? 'Change Directory' : 'Open Directory'}
        </button>

        {currentDirectory && files.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-8 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {currentDirectory && (
          <div className="text-xs text-muted-foreground truncate" title={currentDirectory}>
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
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <Search className="w-8 h-8 text-muted-foreground mb-2 mx-auto" />
            <p className="text-sm">No matching files</p>
            <p className="text-xs mt-1">Try a different search term</p>
            <button
              onClick={handleClearSearch}
              className="btn btn-ghost btn-sm mt-3"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map((file) => (
              <FileListItem
                key={file.path}
                file={file}
                isActive={currentFile === file.path}
                onClick={() => handleFileClick(file)}
                onRename={(newName) => handleRename(file.path, newName)}
                onDelete={() => handleDelete(file.path)}
              />
            ))}
          </div>
        )}
      </div>

      <ResizeHandle
        onResize={(delta) => onResize(width + delta)}
        onResizeComplete={onResizeComplete}
        minWidth={200}
        maxWidth={500}
        initialWidth={width}
      />
    </div>
  )
}

export default Sidebar