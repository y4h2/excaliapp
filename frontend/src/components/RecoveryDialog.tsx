import React from 'react'
import { AlertTriangle, FileText, X } from 'lucide-react'

interface RecoveryInfo {
  filePath: string
  backupPath: string
  lastModified: string
  backupCreated: string
}

interface RecoveryDialogProps {
  recoveryFiles: RecoveryInfo[]
  onRecover: (backupPath: string, filePath: string) => void
  onDiscard: (backupPath: string) => void
  onClose: () => void
}

const RecoveryDialog: React.FC<RecoveryDialogProps> = ({
  recoveryFiles,
  onRecover,
  onDiscard,
  onClose
}) => {
  if (recoveryFiles.length === 0) return null

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown'
    try {
      const date = new Date(dateStr)
      return date.toLocaleString()
    } catch {
      return dateStr
    }
  }

  const getFileName = (path: string) => {
    return path.split('/').pop() || path
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-popover border border-border rounded-lg shadow-xl max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Unsaved Changes Detected</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            title="Close"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            We found backup files that may contain unsaved changes from a previous session.
            Would you like to recover them?
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recoveryFiles.map((file, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate" title={file.filePath}>
                        {getFileName(file.filePath)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Backup created:</span>{' '}
                        {formatDate(file.backupCreated)}
                      </div>
                      {file.lastModified && (
                        <div>
                          <span className="font-medium">Last saved:</span>{' '}
                          {formatDate(file.lastModified)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => onRecover(file.backupPath, file.filePath)}
                      className="btn btn-primary btn-sm"
                      title="Recover this file"
                    >
                      Recover
                    </button>
                    <button
                      onClick={() => onDiscard(file.backupPath)}
                      className="btn btn-ghost btn-sm"
                      title="Discard backup"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Tip: Backups are created automatically while editing. You can safely discard old backups.
          </p>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecoveryDialog
