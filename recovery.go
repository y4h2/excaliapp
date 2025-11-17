package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type RecoveryInfo struct {
	FilePath      string    `json:"filePath"`
	BackupPath    string    `json:"backupPath"`
	LastModified  time.Time `json:"lastModified"`
	BackupCreated time.Time `json:"backupCreated"`
}

type RecoveryManager struct {
	backupDir string
}

func NewRecoveryManager() (*RecoveryManager, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	backupDir := filepath.Join(homeDir, ".config", "excaliapp", "backups")
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return nil, err
	}

	return &RecoveryManager{
		backupDir: backupDir,
	}, nil
}

// SaveBackup creates a temporary backup of the file
func (r *RecoveryManager) SaveBackup(filePath string, content string) error {
	if filePath == "" {
		return nil // No file to backup
	}

	// Create backup filename (original name + .backup)
	originalName := filepath.Base(filePath)
	backupName := fmt.Sprintf("%s.backup", originalName)
	backupPath := filepath.Join(r.backupDir, backupName)

	// Save content to backup file
	if err := os.WriteFile(backupPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to save backup: %w", err)
	}

	// Save metadata
	metadata := map[string]string{
		"originalPath": filePath,
		"backupTime":   time.Now().Format(time.RFC3339),
	}
	metadataPath := backupPath + ".meta"
	metadataJSON, _ := json.Marshal(metadata)
	os.WriteFile(metadataPath, metadataJSON, 0644)

	return nil
}

// CheckRecoveryFiles looks for backup files that are newer than the original
func (r *RecoveryManager) CheckRecoveryFiles() ([]RecoveryInfo, error) {
	var recoveryFiles []RecoveryInfo

	entries, err := os.ReadDir(r.backupDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".backup") {
			continue
		}

		backupPath := filepath.Join(r.backupDir, entry.Name())
		metadataPath := backupPath + ".meta"

		// Get backup file info
		backupInfo, err := entry.Info()
		if err != nil {
			continue
		}

		// Read metadata
		metadataBytes, err := os.ReadFile(metadataPath)
		if err != nil {
			continue // Skip if metadata is missing
		}

		var metadata map[string]string
		if err := json.Unmarshal(metadataBytes, &metadata); err != nil {
			continue
		}

		originalPath := metadata["originalPath"]
		if originalPath == "" {
			continue
		}

		// Check if original file exists and compare timestamps
		originalInfo, err := os.Stat(originalPath)
		backupCreated := backupInfo.ModTime()

		// If original doesn't exist or backup is newer, offer recovery
		if err != nil || backupCreated.After(originalInfo.ModTime()) {
			var lastModified time.Time
			if err == nil {
				lastModified = originalInfo.ModTime()
			}

			recoveryFiles = append(recoveryFiles, RecoveryInfo{
				FilePath:      originalPath,
				BackupPath:    backupPath,
				LastModified:  lastModified,
				BackupCreated: backupCreated,
			})
		}
	}

	return recoveryFiles, nil
}

// RecoverFile restores content from backup to original file
func (r *RecoveryManager) RecoverFile(backupPath string) (string, error) {
	content, err := os.ReadFile(backupPath)
	if err != nil {
		return "", fmt.Errorf("failed to read backup: %w", err)
	}

	return string(content), nil
}

// CleanupBackup removes a backup file and its metadata
func (r *RecoveryManager) CleanupBackup(backupPath string) error {
	// Remove backup file
	if err := os.Remove(backupPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	// Remove metadata file
	metadataPath := backupPath + ".meta"
	if err := os.Remove(metadataPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}

// CleanupAllBackups removes all backup files
func (r *RecoveryManager) CleanupAllBackups() error {
	return os.RemoveAll(r.backupDir)
}
