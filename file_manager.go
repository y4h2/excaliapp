package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/fsnotify/fsnotify"
)

type ExcalidrawFile struct {
	Name       string    `json:"name"`
	Path       string    `json:"path"`
	Modified   time.Time `json:"modified"`
	HasChanges bool      `json:"hasChanges"`
	IsNew      bool      `json:"isNew"`
}

type FileManager struct {
	currentDirectory string
	files            []ExcalidrawFile
	onFilesChanged   func([]ExcalidrawFile)
	watcher          *fsnotify.Watcher
}

func NewFileManager() *FileManager {
	return &FileManager{
		files: make([]ExcalidrawFile, 0),
	}
}

func (fm *FileManager) SetDirectory(directory string) error {
	if _, err := os.Stat(directory); err != nil {
		return fmt.Errorf("directory does not exist: %w", err)
	}

	// Stop watching previous directory
	fm.StopWatching()

	fm.currentDirectory = directory

	// Scan the directory first
	if err := fm.scanDirectory(); err != nil {
		return err
	}

	// Start watching the new directory
	return fm.StartWatching()
}

func (fm *FileManager) scanDirectory() error {
	if fm.currentDirectory == "" {
		return nil
	}

	entries, err := os.ReadDir(fm.currentDirectory)
	if err != nil {
		return fmt.Errorf("failed to read directory: %w", err)
	}

	fm.files = make([]ExcalidrawFile, 0)
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".excalidraw") {
			info, err := entry.Info()
			if err != nil {
				continue // Skip files we can't get info for
			}
			fm.files = append(fm.files, ExcalidrawFile{
				Name:       entry.Name(),
				Path:       filepath.Join(fm.currentDirectory, entry.Name()),
				Modified:   info.ModTime(),
				HasChanges: false,
				IsNew:      false,
			})
		}
	}

	// Sort files by name for stable ordering
	sort.Slice(fm.files, func(i, j int) bool {
		return strings.ToLower(fm.files[i].Name) < strings.ToLower(fm.files[j].Name)
	})

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}

	return nil
}

func (fm *FileManager) GetFiles() []ExcalidrawFile {
	return fm.files
}

func (fm *FileManager) GetCurrentDirectory() string {
	return fm.currentDirectory
}

func (fm *FileManager) LoadFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	return string(content), nil
}

func (fm *FileManager) SaveFile(path string, content string) error {
	// Validate that it's a valid Excalidraw JSON
	var excalidrawData map[string]any
	if err := json.Unmarshal([]byte(content), &excalidrawData); err != nil {
		return fmt.Errorf("invalid Excalidraw JSON: %w", err)
	}

	// Ensure it has the required Excalidraw fields
	if _, ok := excalidrawData["type"]; !ok {
		excalidrawData["type"] = "excalidraw"
	}
	if _, ok := excalidrawData["version"]; !ok {
		excalidrawData["version"] = 2
	}

	// Format the JSON
	formattedContent, err := json.MarshalIndent(excalidrawData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to format JSON: %w", err)
	}

	if err := os.WriteFile(path, formattedContent, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	// Update the file info
	for i, file := range fm.files {
		if file.Path == path {
			fm.files[i].Modified = time.Now()
			fm.files[i].HasChanges = false
			fm.files[i].IsNew = false
			break
		}
	}

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}

	return nil
}

func (fm *FileManager) CreateNewFile(name string) (string, error) {
	if fm.currentDirectory == "" {
		return "", fmt.Errorf("no directory selected")
	}

	if !strings.HasSuffix(name, ".excalidraw") {
		name += ".excalidraw"
	}

	path := filepath.Join(fm.currentDirectory, name)

	// Check if file already exists
	if _, err := os.Stat(path); err == nil {
		return "", fmt.Errorf("file already exists: %s", name)
	}

	// Create a new empty Excalidraw file
	newFile := map[string]any{
		"type":     "excalidraw",
		"version":  2,
		"source":   "https://excaliapp",
		"elements": []any{},
		"appState": map[string]any{
			"gridSize":            nil,
			"viewBackgroundColor": "#ffffff",
		},
		"files": map[string]any{},
	}

	content, err := json.MarshalIndent(newFile, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to create new file content: %w", err)
	}

	if err := os.WriteFile(path, content, 0644); err != nil {
		return "", fmt.Errorf("failed to write new file: %w", err)
	}

	// Add to files list
	fm.files = append(fm.files, ExcalidrawFile{
		Name:       name,
		Path:       path,
		Modified:   time.Now(),
		HasChanges: false,
		IsNew:      true,
	})

	// Re-sort files
	sort.Slice(fm.files, func(i, j int) bool {
		return fm.files[i].Modified.After(fm.files[j].Modified)
	})

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}

	return path, nil
}

func (fm *FileManager) SetFileChanged(path string, hasChanges bool) {
	for i, file := range fm.files {
		if file.Path == path {
			fm.files[i].HasChanges = hasChanges
			break
		}
	}

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}
}

func (fm *FileManager) OnFilesChanged(callback func([]ExcalidrawFile)) {
	fm.onFilesChanged = callback
}

// GenerateUntitledName generates a unique untitled filename
func (fm *FileManager) GenerateUntitledName() string {
	baseName := "untitled"
	extension := ".excalidraw"

	// Check if "untitled.excalidraw" exists
	untitledPath := filepath.Join(fm.currentDirectory, baseName+extension)
	if _, err := os.Stat(untitledPath); os.IsNotExist(err) {
		return baseName + extension
	}

	// Find the next available number
	counter := 1
	for {
		name := fmt.Sprintf("%s-%d%s", baseName, counter, extension)
		path := filepath.Join(fm.currentDirectory, name)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			return name
		}
		counter++
	}
}

// RenameFile renames a file and returns the new path
func (fm *FileManager) RenameFile(oldPath string, newName string) (string, error) {
	if !strings.HasSuffix(newName, ".excalidraw") {
		newName += ".excalidraw"
	}

	newPath := filepath.Join(filepath.Dir(oldPath), newName)

	// Check if the new path already exists
	if oldPath != newPath {
		if _, err := os.Stat(newPath); err == nil {
			return "", fmt.Errorf("file already exists: %s", newName)
		}
	}

	// Rename the file
	if err := os.Rename(oldPath, newPath); err != nil {
		return "", fmt.Errorf("failed to rename file: %w", err)
	}

	// Update the file in the list
	for i, file := range fm.files {
		if file.Path == oldPath {
			fm.files[i].Name = newName
			fm.files[i].Path = newPath
			fm.files[i].IsNew = false
			break
		}
	}

	// Re-sort files
	sort.Slice(fm.files, func(i, j int) bool {
		return strings.ToLower(fm.files[i].Name) < strings.ToLower(fm.files[j].Name)
	})

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}

	return newPath, nil
}

// DeleteFile moves a file to the system trash/recycle bin
func (fm *FileManager) DeleteFile(path string) error {
	// Move the file to trash instead of permanent deletion
	if err := MoveToTrash(path); err != nil {
		return fmt.Errorf("failed to move file to trash: %w", err)
	}

	// Remove the file from the list
	for i, file := range fm.files {
		if file.Path == path {
			fm.files = append(fm.files[:i], fm.files[i+1:]...)
			break
		}
	}

	if fm.onFilesChanged != nil {
		fm.onFilesChanged(fm.files)
	}

	return nil
}

// StartWatching starts watching the current directory for file changes
func (fm *FileManager) StartWatching() error {
	if fm.currentDirectory == "" {
		return nil
	}

	// Create new watcher
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("failed to create watcher: %w", err)
	}

	fm.watcher = watcher

	// Add directory to watcher
	if err := fm.watcher.Add(fm.currentDirectory); err != nil {
		fm.watcher.Close()
		fm.watcher = nil
		return fmt.Errorf("failed to watch directory: %w", err)
	}

	// Start watching in a goroutine
	go func() {
		for {
			select {
			case event, ok := <-fm.watcher.Events:
				if !ok {
					return
				}

				// Only process .excalidraw files
				if !strings.HasSuffix(event.Name, ".excalidraw") {
					continue
				}

				// Re-scan directory on any Create, Remove, or Rename event
				if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
					fm.scanDirectory()
				}

			case err, ok := <-fm.watcher.Errors:
				if !ok {
					return
				}
				fmt.Printf("File watcher error: %v\n", err)
			}
		}
	}()

	return nil
}

// StopWatching stops watching the current directory
func (fm *FileManager) StopWatching() {
	if fm.watcher != nil {
		fm.watcher.Close()
		fm.watcher = nil
	}
}
