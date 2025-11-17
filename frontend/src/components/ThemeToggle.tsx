import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '../lib/utils'

export type Theme = 'system' | 'light' | 'dark'

interface ThemeToggleProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  className?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onThemeChange, className }) => {
  const getNextTheme = (): Theme => {
    switch (currentTheme) {
      case 'system':
        return 'light'
      case 'light':
        return 'dark'
      case 'dark':
        return 'system'
      default:
        return 'system'
    }
  }

  const handleClick = () => {
    onThemeChange(getNextTheme())
  }

  const getIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="icon-sm" />
      case 'dark':
        return <Moon className="icon-sm" />
      case 'system':
      default:
        return <Monitor className="icon-sm" />
    }
  }

  const getLabel = () => {
    switch (currentTheme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
      default:
        return 'System theme'
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn("btn btn-ghost btn-icon btn-sm", className)}
      title={`${getLabel()} (click to cycle)`}
      aria-label={`Switch theme. Current: ${getLabel()}`}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
