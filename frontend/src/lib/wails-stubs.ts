// Stub implementations for Wails bindings until they are properly generated
// These will be replaced when running `wails dev` or `wails build`

export const GetFiles = (): Promise<any[]> => Promise.resolve([])
export const GetCurrentDirectory = (): Promise<string> => Promise.resolve('')
export const GetCurrentFile = (): Promise<string> => Promise.resolve('')
export const GetFileContent = (): Promise<string> => Promise.resolve('')
export const IsDirty = (): Promise<boolean> => Promise.resolve(false)
export const GetAppState = (): Promise<any> => Promise.resolve({ lastDirectory: '', sidebarWidth: 300, isSidebarCollapsed: false })
export const LoadFile = (path: string): Promise<string> => Promise.resolve('')
export const SaveFile = (content: string): Promise<void> => Promise.resolve()
export const OpenDirectoryDialog = (): Promise<void> => Promise.resolve()
export const NewFileDialog = (): Promise<void> => Promise.resolve()
export const SaveCurrentFile = (): Promise<void> => Promise.resolve()
export const CloseCurrentFile = (): Promise<void> => Promise.resolve()
export const UpdateFileContent = (content: string): Promise<void> => Promise.resolve()
export const GetFileName = (): Promise<string> => Promise.resolve('')
export const RenameFile = (oldPath: string, newName: string): Promise<string> => Promise.resolve('/fake/path/renamed.excalidraw')
export const DeleteFile = (path: string): Promise<void> => Promise.resolve()