import React, { createContext, useContext, useReducer, useEffect } from 'react'
import {
  AppContextType,
  ExcalidrawFile,
  AppState,
  SaveStatus,
  FileManager as FileManagerType
} from '../types'

// Import Wails runtime and Go bindings
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime'
import {
  GetFiles,
  GetCurrentDirectory,
  GetCurrentFile,
  GetFileContent,
  IsDirty,
  GetAppState,
  LoadFile,
  SaveFile,
  OpenDirectoryDialog,
  NewFileDialog,
  SaveCurrentFile,
  CloseCurrentFile,
  UpdateFileContent,
  GetFileName
} from '../../wailsjs/go/main/App'

interface AppStateInternal {
  files: ExcalidrawFile[]
  currentFile: string | null
  currentContent: string
  isDirty: boolean
  saveStatus: SaveStatus
  appState: AppState | null
  isLoading: boolean
  error: string | null
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILES'; payload: ExcalidrawFile[] }
  | { type: 'SET_CURRENT_FILE'; payload: string | null }
  | { type: 'SET_CURRENT_CONTENT'; payload: string }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: Partial<SaveStatus> }
  | { type: 'SET_APP_STATE'; payload: AppState }
  | { type: 'UPDATE_CONTENT'; payload: string }

const initialState: AppStateInternal = {
  files: [],
  currentFile: null,
  currentContent: '',
  isDirty: false,
  saveStatus: {
    isSaving: false,
    lastSaved: null,
    hasChanges: false,
    error: null
  },
  appState: null,
  isLoading: true,
  error: null
}

function appReducer(state: AppStateInternal, action: AppAction): AppStateInternal {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_FILES':
      return { ...state, files: action.payload }
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload }
    case 'SET_CURRENT_CONTENT':
      return { ...state, currentContent: action.payload }
    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload,
        saveStatus: { ...state.saveStatus, hasChanges: action.payload }
      }
    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: { ...state.saveStatus, ...action.payload }
      }
    case 'SET_APP_STATE':
      return { ...state, appState: action.payload }
    case 'UPDATE_CONTENT':
      return {
        ...state,
        currentContent: action.payload,
        isDirty: true,
        saveStatus: { ...state.saveStatus, hasChanges: true }
      }
    default:
      return state
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Try calling Go function with retry
  const tryCallWithRetry = async <T,>(fn: () => Promise<T>, retries = 10, delay = 200): Promise<T> => {
    let lastError: any
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        // If it's a runtime error (can't read property of undefined), retry
        if (i < retries - 1 && String(error).includes('Cannot read')) {
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
    throw lastError
  }

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        // Load app state with retry
        const appState = await tryCallWithRetry(() => GetAppState())
        dispatch({ type: 'SET_APP_STATE', payload: appState })

        // Load files
        await loadFiles()

        // Load current file if any
        const currentFile = await tryCallWithRetry(() => GetCurrentFile())
        if (currentFile) {
          const content = await tryCallWithRetry(() => GetFileContent())
          dispatch({ type: 'SET_CURRENT_FILE', payload: currentFile })
          dispatch({ type: 'SET_CURRENT_CONTENT', payload: content })
        }

        // Check if dirty
        const isDirty = await tryCallWithRetry(() => IsDirty())
        dispatch({ type: 'SET_DIRTY', payload: isDirty })

      } catch (error) {
        console.error('Failed to load initial data:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load application data' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadInitialData()
  }, [])

  // Listen for file changes from backend
  useEffect(() => {
    const handleFilesChanged = (files: ExcalidrawFile[]) => {
      dispatch({ type: 'SET_FILES', payload: files })
    }

    let isListenerSetup = false

    // Setup event listener with retry
    const setupEventListenerWithRetry = async (retries = 5) => {
      let lastError: any
      for (let i = 0; i < retries; i++) {
        try {
          EventsOn("files:changed", handleFilesChanged)
          isListenerSetup = true
          return true
        } catch (error) {
          lastError = error
          if (i < retries - 1 && String(error).includes('Cannot read')) {
            await new Promise(resolve => setTimeout(resolve, 200))
          } else if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          } else {
            console.warn('Failed to setup file change event listener:', lastError)
            return false
          }
        }
      }
      return false
    }

    setupEventListenerWithRetry()

    return () => {
      if (isListenerSetup) {
        try {
          EventsOff("files:changed")
        } catch (error) {
          console.warn('Failed to cleanup event listener:', error)
        }
      }
    }
  }, [])

  const loadFiles = async () => {
    try {
      const files = await tryCallWithRetry(() => GetFiles())
      dispatch({ type: 'SET_FILES', payload: files })
    } catch (error) {
      console.error('Failed to load files:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load files' })
    }
  }

  const loadFile = async (path: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const content = await LoadFile(path)
      dispatch({ type: 'SET_CURRENT_FILE', payload: path })
      dispatch({ type: 'SET_CURRENT_CONTENT', payload: content })
      dispatch({ type: 'SET_DIRTY', payload: false })

    } catch (error) {
      console.error('Failed to load file:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load file' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const saveFile = async (content: string) => {
    try {
      dispatch({ type: 'SET_SAVE_STATUS', payload: { isSaving: true, error: null } })

      await SaveFile(content)
      dispatch({ type: 'SET_CURRENT_CONTENT', payload: content })
      dispatch({ type: 'SET_DIRTY', payload: false })
      dispatch({ type: 'SET_SAVE_STATUS', payload: {
        isSaving: false,
        lastSaved: new Date(),
        hasChanges: false
      }})

    } catch (error) {
      console.error('Failed to save file:', error)
      dispatch({ type: 'SET_SAVE_STATUS', payload: {
        isSaving: false,
        error: 'Failed to save file'
      }})
    }
  }

  const openDirectory = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      await OpenDirectoryDialog()
      await loadFiles()
    } catch (error) {
      console.error('Failed to open directory:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open directory' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const newFile = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      await NewFileDialog()
      await loadFiles()
    } catch (error) {
      console.error('Failed to create new file:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create new file' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const closeFile = async () => {
    try {
      await CloseCurrentFile()
      dispatch({ type: 'SET_CURRENT_FILE', payload: null })
      dispatch({ type: 'SET_CURRENT_CONTENT', payload: '' })
      dispatch({ type: 'SET_DIRTY', payload: false })
    } catch (error) {
      console.error('Failed to close file:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to close file' })
    }
  }

  const updateContent = (content: string) => {
    dispatch({ type: 'UPDATE_CONTENT', payload: content })
    // Notify backend about content change for auto-save
    UpdateFileContent(content)
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const contextValue: AppContextType = {
    files: state.files,
    currentFile: state.currentFile,
    currentContent: state.currentContent,
    isDirty: state.isDirty,
    saveStatus: state.saveStatus,
    appState: state.appState,
    isLoading: state.isLoading,
    error: state.error,
    loadFiles,
    loadFile,
    saveFile,
    openDirectory,
    newFile,
    closeFile,
    updateContent,
    setError,
    currentDirectory: state.appState?.lastDirectory || null
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext
