import React, { useState, useRef, useEffect } from 'react'
import { Save, FileText, Folder, Edit2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../lib/utils'

interface MainHeaderProps {
  currentFile: string | null
  isDirty: boolean
  onSave: () => void
  fileCount: number
  currentDirectory: string | null
}

const MainHeader: React.FC<MainHeaderProps> = ({
  currentFile,
  isDirty,
  onSave,
  fileCount,
  currentDirectory
}) => {
  const { closeFile, renameFile } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const fileName = currentFile ? currentFile.split('/').pop() : null
  const fileNameWithoutExt = fileName ? fileName.replace('.excalidraw', '') : ''

  const handleStartEdit = () => {
    if (currentFile) {
      setEditName(fileNameWithoutExt)
      setIsEditing(true)
    }
  }

  const handleSaveRename = async () => {
    if (editName.trim() && editName !== fileNameWithoutExt && currentFile) {
      try {
        await renameFile(currentFile, editName.trim())
      } catch (error) {
        console.error('Failed to rename file:', error)
      }
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setIsEditing(false)
    setEditName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div className="main-header">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FileText className="icon text-muted-foreground" />
          <div>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveRename}
                  className="text-lg font-semibold bg-transparent border border-primary rounded px-2 py-1 outline-none"
                  style={{ minWidth: '200px' }}
                />
                <span className="text-sm text-muted-foreground">.excalidraw</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 className="text-lg font-semibold">
                  {fileName || 'No file selected'}
                </h1>
                {currentFile && (
                  <button
                    onClick={handleStartEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                    title="Click to rename file"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
            {currentDirectory && !isEditing && (
              <p className="text-xs text-muted-foreground truncate max-w-64">
                {currentDirectory}
              </p>
            )}
          </div>
        </div>

        {isDirty && (
          <span className="text-xs text-destructive font-medium">
            ● Modified
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </div>

        {currentFile && (
          <>
            <button
              onClick={onSave}
              disabled={!isDirty}
              className={cn(
                "btn btn-primary btn-sm",
                !isDirty && "opacity-50 cursor-not-allowed"
              )}
              title={isDirty ? "Save current file" : "File is saved"}
            >
              <Save className="icon-sm mr-1" />
              Save
            </button>

            <button
              onClick={closeFile}
              className="btn btn-ghost btn-sm"
              title="Close current file"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default MainHeader