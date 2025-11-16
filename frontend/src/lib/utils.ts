import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? 'just now' : `${minutes} minutes ago`
    }
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`

  return d.toLocaleDateString()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

export function isValidExcalidrawContent(content: string): boolean {
  try {
    const data = JSON.parse(content)
    return (
      typeof data === 'object' &&
      data !== null &&
      data.type === 'excalidraw' &&
      typeof data.version === 'number'
    )
  } catch {
    return false
  }
}

export function createNewExcalidrawFile(): string {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "https://excaliapp",
    elements: [],
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff"
    },
    files: {}
  }, null, 2)
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export function getFileNameWithoutExtension(filename: string): string {
  return filename.slice(0, filename.lastIndexOf('.'))
}

export function generateFileName(baseName: string, existingFiles: string[]): string {
  let counter = 1
  let fileName = `${baseName}.excalidraw`

  while (existingFiles.includes(fileName)) {
    fileName = `${baseName}-${counter}.excalidraw`
    counter++
  }

  return fileName
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setDocumentTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}