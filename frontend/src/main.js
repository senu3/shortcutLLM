import MarkdownIt from "markdown-it";
import * as runtime from "../wailsjs/runtime/runtime";
const md = new MarkdownIt();
const MIN_HEIGHT = 300;

const input = document.getElementById("prompt");
const button = document.getElementById("send");
const output = document.getElementById("response");

// タブ切替・設定フォーム制御
const tabMain = document.getElementById("tab-main");
const tabSettings = document.getElementById("tab-settings");
const mainView = document.getElementById("main-view");
const settingsView = document.getElementById("settings-view");
const settingsForm = document.getElementById("settings-form");
const apiBaseUrlInput = document.getElementById("apibaseurl");
const apiKeyInput = document.getElementById("apikey");

// --- ドロップダウンUI制御 ---
const providerDropdown = document.getElementById("provider-dropdown");
const modelDropdown = document.getElementById("model-dropdown");

// プロバイダー候補（今後拡張しやすいよう配列で定義）
const PROVIDERS = [
    { value: "openai", label: "OpenAI" },
    { value: "ollama", label: "Ollama" }
];
// モデル候補（用途に応じて拡張可）
const MODELS = {
    openai: ["gpt-4.1-nano", "gpt-4.1-mini", "gpt-4.1"],
    ollama: ["gemma3", "phi3", "mistral", "Qwen3:4B"]
};

// プロバイダー・モデルドロップダウンを動的生成
function fillProviderDropdown() {
    providerDropdown.innerHTML = PROVIDERS.map(p => `<option value="${p.value}">${p.label}</option>`).join("");
}
function fillModelDropdown(provider, currentModel) {
    const models = MODELS[provider] || [];
    modelDropdown.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join("");
    if (currentModel && models.includes(currentModel)) {
        modelDropdown.value = currentModel;
    }
}

// プロバイダーごとのデフォルトAPIエンドポイント
const API_ENDPOINTS = {
    openai: "",
    ollama: "http://localhost:11434"
};

// 設定反映・保存
async function syncDropdownsWithConfig() {
    const cfg = await window.go.main.App.GetConfig();
    providerDropdown.value = cfg.Provider;
    fillModelDropdown(cfg.Provider, cfg.Model);
    modelDropdown.value = cfg.Model;
    // APIエンドポイントも反映
    apiBaseUrlInput.value = cfg.APIBaseURL || (API_ENDPOINTS[cfg.Provider] || "");
}

providerDropdown.onchange = async () => {
    fillModelDropdown(providerDropdown.value);
    // モデル自動選択
    modelDropdown.value = (MODELS[providerDropdown.value] || [])[0] || "";
    // APIエンドポイント自動セット
    apiBaseUrlInput.value = API_ENDPOINTS[providerDropdown.value] || "";
    // 設定保存
    await window.go.main.App.SetConfig({
        Provider: providerDropdown.value,
        Model: modelDropdown.value,
        APIBaseURL: apiBaseUrlInput.value,
        APIKey: apiKeyInput.value
    });
};
modelDropdown.onchange = async () => {
    await window.go.main.App.SetConfig({
        Provider: providerDropdown.value,
        Model: modelDropdown.value,
        APIBaseURL: apiBaseUrlInput.value,
        APIKey: apiKeyInput.value
    });
};

function showMain() {
    mainView.style.display = "";
    settingsView.style.display = "none";
    tabMain.classList.add("active");
    tabSettings.classList.remove("active");
}
function showSettings() {
    mainView.style.display = "none";
    settingsView.style.display = "";
    tabMain.classList.remove("active");
    tabSettings.classList.add("active");
    loadConfig();
}
tabMain.onclick = showMain;
tabSettings.onclick = showSettings;

// 設定の取得・反映
async function loadConfig() {
    const cfg = await window.go.main.App.GetConfig();
    providerInput.value = cfg.Provider;
    modelInput.value = cfg.Model;
    apiBaseUrlInput.value = cfg.APIBaseURL;
    apiKeyInput.value = cfg.APIKey;
}
// 設定保存
settingsForm.onsubmit = async (e) => {
    e.preventDefault();
    const cfg = {
        Provider: providerInput.value,
        Model: modelInput.value,
        APIBaseURL: apiBaseUrlInput.value,
        APIKey: apiKeyInput.value
    };
    await window.go.main.App.SetConfig(cfg);
    alert("設定を保存しました");
    showMain();
};

// 初期化
fillProviderDropdown();
syncDropdownsWithConfig();
providerDropdown.dispatchEvent(new Event("change"));

button.onclick = async () => {
    const prompt = input.value;
    if (!prompt) return;
    output.innerHTML = '<span class="loading"></span>';
    window.go.main.App.AskAI(prompt).then(res => {
        // <think>...</think>を除去
        const cleanRes = res.replace(/<think>[\s\S]*?<\/think>/gi, '');
        output.innerHTML = md.render(cleanRes.trim());
        setTimeout(async () => {
            const aiwindow = document.getElementById("aiwindow");
            const rect = aiwindow.getBoundingClientRect();
            const width = rect.width;
            const height = Math.max(MIN_HEIGHT, Math.min(Math.round(rect.height), 900));
            await runtime.WindowSetSize(width, height);
            // 画面情報取得
            const screens = await runtime.ScreenGetAll();
            const winPos = await runtime.WindowGetPosition();
            // 現在のウィンドウ位置とサイズ
            let x = winPos.x;
            let y = winPos.y;
            // メインスクリーンを仮定
            const screen = screens.find(s => s.isPrimary) || screens[0];
            // 下にはみ出す場合は調整
            if (y + height > screen.height) y = Math.max(0, screen.height - height + 30);
            await runtime.WindowSetPosition(x, y);
        }, 10);
    }).catch(err => {
        output.textContent = "エラー: " + err;
    });
};

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        button.click();
    }
});

