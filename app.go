package main

import (
	"context"
	"encoding/json"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	lastContent string
	sentToAI    bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.WindowShow(a.ctx)
}

// GetClipboard returns the current text in the clipboard
func (a *App) GetClipboard() (string, error) {
	return runtime.ClipboardGetText(a.ctx)
}

// SetClipboard sets the given text to the clipboard
func (a *App) SetClipboard(text string) error {
	return runtime.ClipboardSetText(a.ctx, text)
}

// UpdateContent syncs the frontend text content to the backend
func (a *App) UpdateContent(text string) {
	a.lastContent = text
	a.sentToAI = false
}

// MarkSentToAI marks that the content was sent to AI
func (a *App) MarkSentToAI() {
	a.sentToAI = true
}

// OnBeforeClose checks state and saves to clipboard if needed
func (a *App) OnBeforeClose(ctx context.Context) (prevent bool) {
	if !a.sentToAI && a.lastContent != "" {
		runtime.ClipboardSetText(a.ctx, a.lastContent)
	}
	return false
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
			Model:      "gpt-5-nano",
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
