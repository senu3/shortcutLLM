package main

import (
	"context"
	"embed"
	"os"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// プロンプトを受けてAIで返答
func (a *App) AskAI(prompt string) (string, error) {
	cfg, err := a.GetConfig()
	if err != nil {
		return "", err
	}
	ctx := context.Background()
	var llm llms.Model
	if cfg.Provider == "openai" {
		token := cfg.APIKey
		if token == "" {
			token = os.Getenv("OPENAI_API_KEY")
		}
		llm, err = openai.New(
			openai.WithModel(cfg.Model),
			openai.WithBaseURL(cfg.APIBaseURL),
			openai.WithToken(token),
		)
	} else {
		llm, err = ollama.New(
			ollama.WithModel(cfg.Model),
			ollama.WithServerURL(cfg.APIBaseURL),
		)
	}
	if err != nil {
		return "", err
	}
	completion, err := llms.GenerateFromSinglePrompt(ctx, llm, prompt)
	if err != nil {
		return "", err
	}
	return completion, nil
}

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:       "AIチャット（Wails×Go）",
		Width:       700,
		Height:      300,
		AlwaysOnTop: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
