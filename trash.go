package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// MoveToTrash moves a file to the system trash/recycle bin
func MoveToTrash(path string) error {
	switch runtime.GOOS {
	case "darwin":
		return moveToTrashMacOS(path)
	case "windows":
		return moveToTrashWindows(path)
	case "linux":
		return moveToTrashLinux(path)
	default:
		return fmt.Errorf("trash not supported on %s", runtime.GOOS)
	}
}

// moveToTrashMacOS moves file to macOS Trash using AppleScript
func moveToTrashMacOS(path string) error {
	// Get absolute path
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	// Use osascript to move to Trash
	script := fmt.Sprintf(`tell application "Finder" to delete POSIX file "%s"`, absPath)
	cmd := exec.Command("osascript", "-e", script)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to move to trash: %w", err)
	}

	return nil
}

// moveToTrashWindows moves file to Windows Recycle Bin
func moveToTrashWindows(path string) error {
	// Get absolute path
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	// Use PowerShell to move to Recycle Bin
	script := fmt.Sprintf(`Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('%s', 'OnlyErrorDialogs', 'SendToRecycleBin')`, absPath)
	cmd := exec.Command("powershell", "-Command", script)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to move to recycle bin: %w", err)
	}

	return nil
}

// moveToTrashLinux moves file to Linux Trash following freedesktop.org spec
func moveToTrashLinux(path string) error {
	// Get absolute path
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	// Try using trash-cli if available
	if _, err := exec.LookPath("trash-put"); err == nil {
		cmd := exec.Command("trash-put", absPath)
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to move to trash: %w", err)
		}
		return nil
	}

	// Fallback: move to ~/.local/share/Trash/files/
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	trashDir := filepath.Join(homeDir, ".local", "share", "Trash", "files")
	if err := os.MkdirAll(trashDir, 0755); err != nil {
		return err
	}

	// Get filename
	filename := filepath.Base(absPath)
	trashPath := filepath.Join(trashDir, filename)

	// If file already exists in trash, append timestamp
	if _, err := os.Stat(trashPath); err == nil {
		ext := filepath.Ext(filename)
		nameWithoutExt := filename[:len(filename)-len(ext)]
		trashPath = filepath.Join(trashDir, fmt.Sprintf("%s_%d%s", nameWithoutExt, os.Getpid(), ext))
	}

	// Move file to trash
	if err := os.Rename(absPath, trashPath); err != nil {
		return fmt.Errorf("failed to move to trash: %w", err)
	}

	return nil
}

// PermanentlyDelete removes a file permanently (bypass trash)
func PermanentlyDelete(path string) error {
	return os.Remove(path)
}
