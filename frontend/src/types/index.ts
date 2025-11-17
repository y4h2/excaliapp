export interface ExcalidrawFile {
  name: string
  path: string
  modified: string
  hasChanges: boolean
  isNew: boolean
}

export interface AppState {
  lastDirectory: string
  windowWidth: number
  windowHeight: number
  sidebarWidth: number
  isSidebarCollapsed: boolean
}

export interface FileManager {
  getFiles: () => Promise<ExcalidrawFile[]>
  getCurrentDirectory: () => Promise<string>
  openDirectoryDialog: () => Promise<void>
  loadFile: (path: string) => Promise<string>
  saveFile: (content: string) => Promise<void>
  newFileDialog: () => Promise<void>
  saveCurrentFile: () => Promise<void>
  closeCurrentFile: () => Promise<void>
  exit: () => Promise<void>
  updateFileContent: (content: string) => Promise<void>
  getFileContent: () => Promise<string>
  isDirty: () => Promise<boolean>
  getCurrentFile: () => Promise<string>
  getFileName: () => Promise<string>
  getAppState: () => Promise<AppState>
}

export interface ExcalidrawElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  angle: number
  strokeColor: string
  backgroundColor: string
  fillStyle: string
  strokeWidth: number
  strokeStyle: string
  roughness: number
  opacity: number
  groupIds: string[]
  strokeSharpness: string
  seed: number
  version: number
  versionNonce: number
  isDeleted: boolean
  boundElements: any[]
  updated: number
  link: string | null
  locked: boolean
  text?: string
  fontSize?: number
  fontFamily?: number
  textAlign?: string
  verticalAlign?: string
  baseline?: number
  containerId?: string
  originalText?: string
  points?: number[][]
  lastCommittedPoint?: number[] | null
  startBinding?: any
  endBinding?: any
  startArrowhead?: string | null
  endArrowhead?: string | null
}

export interface ExcalidrawAppState {
  gridSize: number | null
  viewBackgroundColor: string
  scrollX: number
  scrollY: number
  zoom: {
    value: number
  }
  currentItemStrokeColor: string
  currentItemBackgroundColor: string
  currentItemFillStyle: string
  currentItemStrokeWidth: number
  currentItemStrokeStyle: string
  currentItemRoughness: number
  currentItemOpacity: number
  currentItemFontFamily: number
  currentItemFontSize: number
  currentItemTextAlign: string
  currentItemStrokeSharpness: string
  currentItemStartArrowhead: string | null
  currentItemEndArrowhead: string | null
  currentItemLinearStrokeSharpness: string
  selectedElementIds: Record<string, boolean>
  previousSelectedElementIds: Record<string, boolean>
  selectedGroupIds: Record<string, boolean>
  editingElement: ExcalidrawElement | null
  editingGroupId: string | null
  editingLinearElement: any | null
  activeTool: {
    type: string
    customType: string | null
    locked: boolean
    lastActiveTool: any | null
  }
  penMode: boolean
  penDetected: boolean
  exportBackground: boolean
  exportEmbedScene: boolean
  exportWithDarkMode: boolean
  exportScale: number
  currentChartType: string
  openMenu: string | null
  openPopup: string | null
  openSidebar: string | null
  openDialog: string | null
  defaultSidebarDockedPreference: boolean
  lastPointerDownWith: any | null
  shouldCacheIgnoreZoom: boolean
  showStats: boolean
  zenModeEnabled: boolean
  theme: string
  gridModeEnabled: boolean
  viewModeEnabled: boolean
  appearance: 'light' | 'dark'
  fileHandle: any | null
  collaborators: Map<string, any>
  showGrid: boolean
  objectSnapModeEnabled: boolean
  snapToObjects: boolean
  userToFollow: any | null
  followedBy: Set<string>
  followers: Set<string>
}

export interface ExcalidrawAPI {
  ready: boolean
  readyPromise: Promise<any>
  updateScene: (scene: any) => void
  updateLibrary: (libraryItems: any[]) => void
  addFiles: (files: any[]) => void
  getSceneElements: () => ExcalidrawElement[]
  getAppState: () => ExcalidrawAppState
  getFiles: () => Record<string, any>
  refresh: () => void
  scrollToContent: (target?: ExcalidrawElement | ExcalidrawElement[], fitToViewport?: boolean) => void
  importLibrary: (url: string, token?: string) => void
  setToastMessage: (message: string) => void
  setToast: (toast: { message: string; closable?: boolean; duration?: number }) => void
  addEventListener: (event: string, callback: Function) => void
  removeEventListener: (event: string, callback: Function) => void
  history: {
    clear: () => void
  }
  setActiveTool: (tool: { type: string }) => void
  toggleTheme: () => void
  resetScene: () => void
}

export interface SaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  hasChanges: boolean
  error: string | null
}

export interface AppContextType {
  files: ExcalidrawFile[]
  currentFile: string | null
  currentContent: string
  isDirty: boolean
  saveStatus: SaveStatus
  appState: AppState | null
  isLoading: boolean
  error: string | null
  currentDirectory: string | null
  loadFiles: () => Promise<void>
  loadFile: (path: string) => Promise<void>
  saveFile: (content: string) => Promise<void>
  openDirectory: () => Promise<void>
  newFile: () => Promise<void>
  closeFile: () => Promise<void>
  updateContent: (content: string) => void
  setError: (error: string | null) => void
  renameFile: (oldPath: string, newName: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
}

export interface ResizeHandleProps {
  onResize: (delta: number) => void
  minWidth: number
  maxWidth: number
  initialWidth: number
}

export interface FileListItemProps {
  file: ExcalidrawFile
  isActive: boolean
  onClick: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

export interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  width: number
  onResize: (width: number) => void
}

export interface CanvasProps {
  content: string
  onChange: (content: string) => void
  isReadOnly: boolean
}

export interface StatusBarProps {
  saveStatus: SaveStatus
  currentFile: string | null
  fileCount: number
  currentDirectory: string | null
  onSave: () => void
}

export interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ComponentType<{ className?: string }>
}