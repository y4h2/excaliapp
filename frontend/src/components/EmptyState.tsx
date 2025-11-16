import React from 'react'
import { FolderOpen, FileText, Save } from 'lucide-react'
import { cn } from '../lib/utils'

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon: Icon = FileText,
  className
}) => {
  return (
    <div className={cn("empty-state", className)}>
      <Icon className="icon-lg mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export const NoDirectoryEmptyState: React.FC<{ onOpenDirectory: () => void }> = ({ onOpenDirectory }) => (
  <EmptyState
    icon={FolderOpen}
    title="No Directory Selected"
    message="Select a directory containing .excalidraw files to get started."
    actionLabel="Open Directory"
    onAction={onOpenDirectory}
  />
)

export const NoFilesEmptyState: React.FC<{ onOpenDirectory: () => void }> = ({ onOpenDirectory }) => (
  <EmptyState
    icon={FileText}
    title="No Excalidraw Files Found"
    message="This directory doesn't contain any .excalidraw files."
    actionLabel="Open Another Directory"
    onAction={onOpenDirectory}
  />
)

export const NoFileSelectedEmptyState: React.FC<{ onNewFile: () => void }> = ({ onNewFile }) => (
  <EmptyState
    icon={Save}
    title="No File Selected"
    message="Select a file from the sidebar or create a new one to start editing."
    actionLabel="New File"
    onAction={onNewFile}
  />
)

export default EmptyState