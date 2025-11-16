import React from 'react'
import { Save, FileText, Folder } from 'lucide-react'
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
  const { closeFile } = useApp()

  const fileName = currentFile ? currentFile.split('/').pop() : null

  return (
    <div className="main-header">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FileText className="icon text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">
              {fileName || 'No file selected'}
            </h1>
            {currentDirectory && (
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