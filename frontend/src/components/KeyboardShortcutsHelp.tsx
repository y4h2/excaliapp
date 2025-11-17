import React from 'react'
import { X } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = [
    { category: 'File Operations', items: [
      { keys: `${modKey}+O`, description: 'Open directory' },
      { keys: `${modKey}+N`, description: 'New file' },
      { keys: `${modKey}+S`, description: 'Save current file' },
      { keys: `${modKey}+W`, description: 'Close current file' },
    ]},
    { category: 'Navigation', items: [
      { keys: `${modKey}+1-9`, description: 'Switch to file by index' },
      { keys: `${modKey}+Tab`, description: 'Next file' },
      { keys: `${modKey}+Shift+Tab`, description: 'Previous file' },
      { keys: `${modKey}+B`, description: 'Toggle sidebar' },
      { keys: `${modKey}+F`, description: 'Focus search box' },
    ]},
    { category: 'Application', items: [
      { keys: `${modKey}+Q`, description: 'Quit application' },
      { keys: `${modKey}+/`, description: 'Show this help' },
    ]},
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-popover border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            title="Close"
          >
            <X className="icon-sm" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, sidx) => (
                  <div
                    key={sidx}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-popover border-t border-border px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">{modKey}+/</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
