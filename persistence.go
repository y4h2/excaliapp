package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type AppState struct {
	LastDirectory string `json:"lastDirectory"`
	WindowWidth   int    `json:"windowWidth"`
	WindowHeight  int    `json:"windowHeight"`
	SidebarWidth  int    `json:"sidebarWidth"`
	IsSidebarCollapsed bool `json:"isSidebarCollapsed"`
	Theme         string `json:"theme"` // "system" | "light" | "dark"
}

const appStateFile = "excaliapp_state.json"

func getAppStatePath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return appStateFile
	}
	return filepath.Join(homeDir, ".config", "excaliapp", appStateFile)
}

func LoadAppState() (*AppState, error) {
	statePath := getAppStatePath()

	// Create config directory if it doesn't exist
	configDir := filepath.Dir(statePath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, err
	}

	// Check if state file exists
	if _, err := os.Stat(statePath); os.IsNotExist(err) {
		// Return default state
		return &AppState{
			LastDirectory: "",
			WindowWidth:   1024,
			WindowHeight:  768,
			SidebarWidth:  300,
			IsSidebarCollapsed: false,
			Theme:         "system",
		}, nil
	}

	// Read state file
	data, err := ioutil.ReadFile(statePath)
	if err != nil {
		return nil, err
	}

	var state AppState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}

	return &state, nil
}

func SaveAppState(state *AppState) error {
	statePath := getAppStatePath()

	// Create config directory if it doesn't exist
	configDir := filepath.Dir(statePath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(statePath, data, 0644)
}