package main

import (
	"context"
	"embed"
	"os"

	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/anthropic"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
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
			openai.WithToken(token),
		)
	} else if cfg.Provider == "anthropic" {
		token := cfg.APIKey
		if token == "" {
			token = os.Getenv("ANTHROPIC_API_KEY")
		}
		llm, err = anthropic.New(
			anthropic.WithModel(cfg.Model),
			anthropic.WithToken(token),
		)
	} else if cfg.Provider == "gemini" {
		token := cfg.APIKey
		if token == "" {
			token = os.Getenv("GEMINI_API_KEY")
		}
		llm, err = googleai.New(
			context.Background(),
			googleai.WithDefaultModel(cfg.Model),
			googleai.WithAPIKey(token),
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
	completion, err := llms.GenerateFromSinglePrompt(ctx, llm, prompt, llms.WithTemperature(1))
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
		Height:      360,
		AlwaysOnTop: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		OnStartup:        app.startup,
		OnBeforeClose:    app.OnBeforeClose,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			BackdropType:         windows.Acrylic,
			DisableWindowIcon:    false,
			IsZoomControlEnabled: false,
			ZoomFactor:           1.0,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
