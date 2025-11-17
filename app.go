package main

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	fileManager     *FileManager
	autoSave        *AutoSaveManager
	menuManager     *MenuManager
	appState        *AppState
	currentFile     string
	recoveryManager *RecoveryManager
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// getMenu creates and returns the application menu
// This is called during app startup, so it must not depend on ctx being set
func (a *App) getMenu() *menu.Menu {
	// Create a temporary menu manager just for menu creation
	// The real menu manager will be created during startup with the proper context
	mm := &MenuManager{
		app: a,
	}
	return mm.createMainMenu()
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Load app state
	appState, err := LoadAppState()
	if err != nil {
		appState = &AppState{
			LastDirectory: "",
			WindowWidth:   1024,
			WindowHeight:  768,
			SidebarWidth:  300,
			IsSidebarCollapsed: false,
			Theme:         "system",
		}
	}
	a.appState = appState

	// Initialize menu manager with context for runtime calls
	a.menuManager = NewMenuManager(ctx, a)

	// Initialize file manager
	a.fileManager = NewFileManager()
	a.fileManager.OnFilesChanged(func(files []ExcalidrawFile) {
		runtime.EventsEmit(a.ctx, "files:changed", files)
	})

	// Initialize auto-save manager
	a.autoSave = NewAutoSaveManager(a.fileManager)

	// Initialize recovery manager
	recoveryManager, err := NewRecoveryManager()
	if err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to initialize recovery manager: %v", err))
	} else {
		a.recoveryManager = recoveryManager
	}

	// Set up app focus/blur handlers
	runtime.EventsOn(a.ctx, "app:focus", func(optionalData ...any) {
		// App gained focus
	})

	runtime.EventsOn(a.ctx, "app:blur", func(optionalData ...any) {
		// App lost focus - trigger auto-save
		if err := a.autoSave.ForceSave(); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to auto-save on blur: %v", err))
		}
	})

	// Load last directory if available
	if a.appState.LastDirectory != "" {
		if err := a.fileManager.SetDirectory(a.appState.LastDirectory); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to load last directory: %v", err))
		}
	}
}

// GetAppState returns the current application state
func (a *App) GetAppState() AppState {
	return *a.appState
}

// GetFiles returns the list of Excalidraw files in the current directory
func (a *App) GetFiles() []ExcalidrawFile {
	return a.fileManager.GetFiles()
}

// GetCurrentDirectory returns the current working directory
func (a *App) GetCurrentDirectory() string {
	return a.fileManager.GetCurrentDirectory()
}

// OpenDirectoryDialog opens a directory picker dialog
func (a *App) OpenDirectoryDialog() error {
	selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Directory with Excalidraw Files",
	})

	if err != nil {
		return fmt.Errorf("failed to open directory dialog: %w", err)
	}

	if selection == "" {
		return nil // User cancelled
	}

	// Save current file before switching directories
	if a.currentFile != "" && a.autoSave.IsDirty() {
		if err := a.autoSave.ForceSave(); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to save before switching directories: %v", err))
		}
	}

	// Set new directory
	if err := a.fileManager.SetDirectory(selection); err != nil {
		return fmt.Errorf("failed to set directory: %w", err)
	}

	// Update app state
	a.appState.LastDirectory = selection
	if err := SaveAppState(a.appState); err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to save app state: %v", err))
	}

	// Clear current file
	a.currentFile = ""
	a.autoSave.SetCurrentFile("")

	return nil
}

// LoadFile loads an Excalidraw file
func (a *App) LoadFile(path string) (string, error) {
	// Save current file before loading new one
	if a.currentFile != "" && a.autoSave.IsDirty() {
		if err := a.autoSave.ForceSave(); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to save before switching files: %v", err))
		}
	}

	content, err := a.fileManager.LoadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to load file: %w", err)
	}

	a.currentFile = path
	a.autoSave.SetCurrentFile(path)
	a.autoSave.SetInitialContent(content)

	return content, nil
}

// SaveFile saves the current Excalidraw file
func (a *App) SaveFile(content string) error {
	if a.currentFile == "" {
		return fmt.Errorf("no file is currently open")
	}

	a.autoSave.SetContent(content)
	return a.autoSave.ForceSave()
}

// NewFileDialog creates a new Excalidraw file with an untitled name
func (a *App) NewFileDialog() error {
	if a.fileManager.GetCurrentDirectory() == "" {
		return fmt.Errorf("no directory selected")
	}

	// Generate a unique untitled filename
	fileName := a.fileManager.GenerateUntitledName()
	path, err := a.fileManager.CreateNewFile(fileName)
	if err != nil {
		return fmt.Errorf("failed to create new file: %w", err)
	}

	_, err = a.LoadFile(path)
	return err
}

// SaveCurrentFile saves the current file
func (a *App) SaveCurrentFile() error {
	if a.currentFile == "" {
		return fmt.Errorf("no file is currently open")
	}

	return a.autoSave.ForceSave()
}

// CloseCurrentFile closes the current file
func (a *App) CloseCurrentFile() error {
	if a.currentFile != "" && a.autoSave.IsDirty() {
		// Ask user if they want to save
		result, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Type:        runtime.QuestionDialog,
			Title:       "Save Changes",
			Message:     "Do you want to save changes before closing?",
			Buttons:     []string{"Save", "Don't Save", "Cancel"},
			DefaultButton: "Save",
		})

		if err != nil {
			return err
		}

		switch result {
		case "Save":
			if err := a.autoSave.ForceSave(); err != nil {
				return fmt.Errorf("failed to save file: %w", err)
			}
		case "Cancel":
			return fmt.Errorf("close cancelled by user")
		}
	}

	a.currentFile = ""
	a.autoSave.SetCurrentFile("")
	return nil
}

// Exit exits the application
func (a *App) Exit() {
	// Save current file if dirty
	if a.currentFile != "" && a.autoSave.IsDirty() {
		if err := a.autoSave.ForceSave(); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to save before exit: %v", err))
		}
	}

	// Save app state
	if err := SaveAppState(a.appState); err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to save app state: %v", err))
	}

	runtime.Quit(a.ctx)
}

// UpdateFileContent updates the current file content (triggered by frontend)
func (a *App) UpdateFileContent(content string) {
	// Check if content actually changed before marking dirty
	currentContent := a.autoSave.GetCurrentContent()

	// Only process if content actually changed
	if currentContent != content {
		a.autoSave.SetContent(content)
		a.autoSave.TriggerAutoSave()

		// Update file changed status
		if a.currentFile != "" {
			a.fileManager.SetFileChanged(a.currentFile, a.autoSave.IsDirty())
		}
	}
}

// GetFileContent returns the current file content
func (a *App) GetFileContent() string {
	if a.currentFile == "" {
		return ""
	}
	return a.autoSave.currentContent
}

// IsDirty returns whether the current file has unsaved changes
func (a *App) IsDirty() bool {
	return a.autoSave.IsDirty()
}

// GetCurrentFile returns the path of the currently open file
func (a *App) GetCurrentFile() string {
	return a.currentFile
}

// GetFileName returns just the filename of the current file
func (a *App) GetFileName() string {
	if a.currentFile == "" {
		return ""
	}
	return filepath.Base(a.currentFile)
}

// RenameFile renames a file and updates the current file if it matches
// Returns the new file path
func (a *App) RenameFile(oldPath string, newName string) (string, error) {
	newPath, err := a.fileManager.RenameFile(oldPath, newName)
	if err != nil {
		return "", fmt.Errorf("failed to rename file: %w", err)
	}

	// If the renamed file is currently open, update the current file path
	if a.currentFile == oldPath {
		a.currentFile = newPath
		a.autoSave.SetCurrentFile(newPath)
	}

	return newPath, nil
}

// DeleteFile deletes a file and closes it if it's currently open
func (a *App) DeleteFile(path string) error {
	// If the file is currently open, close it first
	if a.currentFile == path {
		a.currentFile = ""
		a.autoSave.SetCurrentFile("")
	}

	if err := a.fileManager.DeleteFile(path); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// UpdateSidebarWidth updates the sidebar width in app state and persists it
func (a *App) UpdateSidebarWidth(width int) error {
	a.appState.SidebarWidth = width
	if err := SaveAppState(a.appState); err != nil {
		return fmt.Errorf("failed to save sidebar width: %w", err)
	}
	return nil
}

// UpdateSidebarCollapsed updates the sidebar collapsed state and persists it
func (a *App) UpdateSidebarCollapsed(isCollapsed bool) error {
	a.appState.IsSidebarCollapsed = isCollapsed
	if err := SaveAppState(a.appState); err != nil {
		return fmt.Errorf("failed to save sidebar state: %w", err)
	}
	return nil
}

// UpdateTheme updates the theme preference and persists it
func (a *App) UpdateTheme(theme string) error {
	a.appState.Theme = theme
	if err := SaveAppState(a.appState); err != nil {
		return fmt.Errorf("failed to save theme preference: %w", err)
	}
	return nil
}

// CheckRecoveryFiles checks for available recovery files
func (a *App) CheckRecoveryFiles() ([]RecoveryInfo, error) {
	if a.recoveryManager == nil {
		return []RecoveryInfo{}, nil
	}
	return a.recoveryManager.CheckRecoveryFiles()
}

// RecoverFromBackup recovers content from a backup file
func (a *App) RecoverFromBackup(backupPath string) (string, error) {
	if a.recoveryManager == nil {
		return "", fmt.Errorf("recovery manager not initialized")
	}
	return a.recoveryManager.RecoverFile(backupPath)
}

// DiscardBackup removes a backup file
func (a *App) DiscardBackup(backupPath string) error {
	if a.recoveryManager == nil {
		return fmt.Errorf("recovery manager not initialized")
	}
	return a.recoveryManager.CleanupBackup(backupPath)
}

// SaveBackup saves current content to backup file
func (a *App) SaveBackup(content string) error {
	if a.recoveryManager == nil || a.currentFile == "" {
		return nil
	}
	return a.recoveryManager.SaveBackup(a.currentFile, content)
}

// domReady is called after the frontend has been loaded
func (a *App) domReady(ctx context.Context) {
	// Menu manager is now created in startup and getMenu creates it during app creation
}

// beforeClose is called when the application is about to close
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	// Save current file if dirty
	if a.currentFile != "" && a.autoSave.IsDirty() {
		if err := a.autoSave.ForceSave(); err != nil {
			runtime.LogError(a.ctx, fmt.Sprintf("Failed to save before exit: %v", err))
		}
	}

	// Save app state
	if err := SaveAppState(a.appState); err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to save app state: %v", err))
	}

	return false // Don't prevent closing
}

// shutdown is called during application shutdown
func (a *App) shutdown(ctx context.Context) {
	// Perform cleanup
}

