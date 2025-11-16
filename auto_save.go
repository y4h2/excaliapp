package main

import (
	"sync"
	"time"

	"github.com/bep/debounce"
)

type AutoSaveManager struct {
	fileManager  *FileManager
	currentFile  string
	currentContent string
	isDirty      bool
	debounceFunc func(func())
	mu           sync.Mutex
}

func NewAutoSaveManager(fileManager *FileManager) *AutoSaveManager {
	asm := &AutoSaveManager{
		fileManager: fileManager,
	}

	// Create a debounce function that waits 5 seconds before executing
	asm.debounceFunc = debounce.New(5 * time.Second)

	return asm
}

func (asm *AutoSaveManager) SetCurrentFile(filePath string) {
	asm.mu.Lock()
	defer asm.mu.Unlock()

	asm.currentFile = filePath
	asm.currentContent = ""
	asm.isDirty = false
}

func (asm *AutoSaveManager) SetContent(content string) {
	asm.mu.Lock()
	defer asm.mu.Unlock()

	asm.currentContent = content
	asm.isDirty = true
}

func (asm *AutoSaveManager) SaveNow() error {
	asm.mu.Lock()
	defer asm.mu.Unlock()

	if !asm.isDirty || asm.currentFile == "" {
		return nil
	}

	if err := asm.fileManager.SaveFile(asm.currentFile, asm.currentContent); err != nil {
		return err
	}

	asm.isDirty = false
	return nil
}

func (asm *AutoSaveManager) TriggerAutoSave() {
	if asm.currentFile == "" {
		return
	}

	asm.debounceFunc(func() {
		asm.SaveNow()
	})
}

func (asm *AutoSaveManager) IsDirty() bool {
	asm.mu.Lock()
	defer asm.mu.Unlock()
	return asm.isDirty
}

func (asm *AutoSaveManager) ForceSave() error {
	asm.mu.Lock()
	defer asm.mu.Unlock()

	if asm.currentFile == "" {
		return nil
	}

	if err := asm.fileManager.SaveFile(asm.currentFile, asm.currentContent); err != nil {
		return err
	}

	asm.isDirty = false
	return nil
}