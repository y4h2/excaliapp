import React, { useEffect, useState } from 'react'
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { SaveStatus } from '../types'
import { useApp } from '../contexts/AppContext'

interface StatusBarProps {
  saveStatus: SaveStatus
  currentFile: string | null
  fileCount: number
  currentDirectory: string | null
  onSave: () => void
}

const StatusBar: React.FC<StatusBarProps> = ({
  saveStatus,
  currentFile,
  fileCount,
  currentDirectory,
  onSave
}) => {
  const { isDirty } = useApp()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getSaveStatusIcon = () => {
    if (saveStatus.isSaving) {
      return <Loader2 className="icon-sm animate-spin" />
    }
    if (saveStatus.error) {
      return <AlertCircle className="icon-sm text-destructive" />
    }
    if (saveStatus.lastSaved && !saveStatus.hasChanges) {
      return <CheckCircle className="icon-sm text-green-500" />
    }
    return null
  }

  const getSaveStatusText = () => {
    if (saveStatus.isSaving) {
      return 'Saving...'
    }
    if (saveStatus.error) {
      return `Error: ${saveStatus.error}`
    }
    if (saveStatus.lastSaved && !saveStatus.hasChanges) {
      return `Saved ${formatDate(saveStatus.lastSaved)}`
    }
    if (saveStatus.hasChanges) {
      return 'Unsaved changes'
    }
    return 'Ready'
  }

  return (
    <div className="status-bar">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {getSaveStatusIcon()}
          <span className="text-xs">{getSaveStatusText()}</span>
        </div>

        {currentFile && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">File:</span>
            <span className="text-xs font-medium truncate max-w-48" title={currentFile}>
              {currentFile.split('/').pop()}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Files:</span>
          <span className="text-xs font-medium">{fileCount}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isDirty && (
          <button
            onClick={onSave}
            className="btn btn-primary btn-sm"
            title="Save current file"
          >
            <Save className="icon-sm mr-1" />
            Save
          </button>
        )}

        <div className="text-xs text-muted-foreground">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default StatusBar