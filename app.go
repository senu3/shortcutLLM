package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// 設定構造体
type Config struct {
	Provider   string `json:"Provider"`
	Model      string `json:"Model"`
	APIBaseURL string `json:"APIBaseURL"`
	APIKey     string `json:"APIKey"`
}

// 設定ファイルパス
const configPath = "config.json"

// 設定を取得
func (a *App) GetConfig() (Config, error) {
	var cfg Config
	f, err := os.Open(configPath)
	if err != nil {
		// ファイルがなければ初期値を返す
		cfg = Config{
			Provider:   "OpenAI",
			Model:      "gpt-4.1-nano",
			APIBaseURL: "",
			APIKey:     "",
		}
		return cfg, nil
	}
	defer f.Close()
	json.NewDecoder(f).Decode(&cfg)
	return cfg, nil
}

// 設定を保存
func (a *App) SetConfig(cfg Config) error {
	f, err := os.Create(configPath)
	if err != nil {
		return err
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(cfg)
}
