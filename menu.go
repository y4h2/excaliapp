package main

import (
	"context"
	"runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
)

type MenuManager struct {
	ctx          context.Context
	app          *App
	mainMenu     *menu.Menu
}

func NewMenuManager(ctx context.Context, app *App) *MenuManager {
	mm := &MenuManager{
		ctx: ctx,
		app: app,
	}

	mm.mainMenu = mm.createMainMenu()
	return mm
}

func (mm *MenuManager) GetMainMenu() *menu.Menu {
	return mm.mainMenu
}

func (mm *MenuManager) createMainMenu() *menu.Menu {
	mainMenu := menu.NewMenu()

	// File Menu
	fileMenu := mainMenu.AddSubmenu("File")

	// Open Directory (Cmd+O on macOS, Ctrl+O on others)
	openKey := keys.CmdOrCtrl("o")
	fileMenu.AddText("Open Directory", openKey, func(c *menu.CallbackData) {
		mm.onOpenDirectory()
	})

	fileMenu.AddSeparator()

	// New File (Cmd+N on macOS, Ctrl+N on others)
	newKey := keys.CmdOrCtrl("n")
	fileMenu.AddText("New File", newKey, func(c *menu.CallbackData) {
		mm.onNewFile()
	})

	// Save (Cmd+S on macOS, Ctrl+S on others)
	saveKey := keys.CmdOrCtrl("s")
	fileMenu.AddText("Save", saveKey, func(c *menu.CallbackData) {
		mm.onSave()
	})

	fileMenu.AddSeparator()

	// Close File (Cmd+W on macOS, Ctrl+W on others)
	closeKey := keys.CmdOrCtrl("w")
	fileMenu.AddText("Close", closeKey, func(c *menu.CallbackData) {
		mm.onClose()
	})

	fileMenu.AddSeparator()

	// Exit/Quit
	if runtime.GOOS == "darwin" {
		// On macOS, this is handled by the app menu
		mainMenu.AddSubmenu("Edit")
		mainMenu.AddSubmenu("View")
		mainMenu.AddSubmenu("Window")
		mainMenu.AddSubmenu("Help")
	} else {
		// On Windows/Linux, add Exit to File menu
		fileMenu.AddText("Exit", keys.CmdOrCtrl("q"), func(c *menu.CallbackData) {
			mm.onExit()
		})
	}

	return mainMenu
}

func (mm *MenuManager) onOpenDirectory() {
	if mm.app != nil {
		mm.app.OpenDirectoryDialog()
	}
}

func (mm *MenuManager) onNewFile() {
	if mm.app != nil {
		mm.app.NewFileDialog()
	}
}

func (mm *MenuManager) onSave() {
	if mm.app != nil {
		mm.app.SaveCurrentFile()
	}
}

func (mm *MenuManager) onClose() {
	if mm.app != nil {
		mm.app.CloseCurrentFile()
	}
}

func (mm *MenuManager) onExit() {
	if mm.app != nil {
		mm.app.Exit()
	}
}

// UpdateMenuState updates menu item states based on current app state
func (mm *MenuManager) UpdateMenuState(hasOpenDirectory bool, hasOpenFile bool, hasChanges bool) {
	// This would be implemented if we had access to menu items
	// For now, we'll rely on the app to handle enabled/disabled states
}