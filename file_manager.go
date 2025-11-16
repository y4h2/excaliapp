package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
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

	fm.currentDirectory = directory
	return fm.scanDirectory()
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
