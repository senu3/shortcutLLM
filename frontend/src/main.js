import MarkdownIt from "markdown-it";
import * as runtime from "../wailsjs/runtime/runtime";

const md = new MarkdownIt();

// UI Elements
const clipboardText = document.getElementById("clipboard-text");
const saveBtn = document.getElementById("save-btn");
const sendBtn = document.getElementById("send-btn");
const responseArea = document.getElementById("response-area"); // Initially hidden via CSS
const responseContent = document.getElementById("response-content");

// Settings UI
const providerDropdown = document.getElementById("provider-dropdown");
const modelDropdown = document.getElementById("model-dropdown");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const settingsForm = document.getElementById("settings-form");
const modelInput = document.getElementById("model-input");
const apiBaseUrlInput = document.getElementById("api-base-url-input");

// Configuration Data
const PROVIDERS = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "gemini", label: "Gemini" },
    { value: "ollama", label: "Ollama" },
];

const MODELS = {
    openai: ["gpt-5-chat-latest", "gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini"],
    anthropic: ["claude-opus-4-0", "claude-sonnet-4-0", "claude-3-7-sonnet-latest"],
    gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
    ollama: ["gemma3", "llama3"]
};

const API_ENDPOINTS = {
    ollama: "http://localhost:11434"
};

const MIN_HEIGHT = 200; // Base height without response

// --- Initialization ---

async function init() {
    // Fill Dropdowns
    providerDropdown.innerHTML = PROVIDERS.map(p => `<option value="${p.value}">${p.label}</option>`).join("");

    // Load Config
    try {
        const cfg = await window.go.main.App.GetConfig();
        if (cfg) {
            providerDropdown.value = cfg.Provider || "openai";
            fillModelDropdown(providerDropdown.value, cfg.Model);
            modelInput.value = cfg.Model;
            apiBaseUrlInput.value = cfg.APIBaseURL;
        }
    } catch (e) {
        console.error("Failed to load config", e);
        fillModelDropdown("openai");
    }

    // Load Clipboard
    loadClipboard();
}

function fillModelDropdown(provider, currentModel) {
    const models = MODELS[provider] || [];
    modelDropdown.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join("");
    if (currentModel && models.includes(currentModel)) {
        modelDropdown.value = currentModel;
    } else {
        modelDropdown.value = models[0] || "";
    }
}

// --- Window Resizing ---

async function adjustWindowSize() {
    requestAnimationFrame(async () => {
        const container = document.querySelector('.app-container');
        const contentHeight = container.scrollHeight;
        const width = 700;
        await runtime.WindowSetSize(width, contentHeight + 40);
    });
}

// --- Clipboard & Sync Logic ---

let debounceTimer;
async function syncContent() {
    const text = clipboardText.value;
    window.go.main.App.UpdateContent(text);
}

clipboardText.onfocus = () => {
    // Un-collapse if collapsed
    if (document.body.classList.contains("sending")) {
        document.body.classList.remove("sending");
        // Hide response area as requested
        responseArea.style.display = "none";
        adjustWindowSize();
    }
};

clipboardText.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(syncContent, 500); // 500ms debounce
    // Also handy to save locally if needed, but backend sync is key for 'OnExit'
};

async function loadClipboard() {
    try {
        const text = await window.go.main.App.GetClipboard();
        clipboardText.value = text;
        syncContent(); // Initial sync
        setTimeout(adjustWindowSize, 100);
    } catch (e) {
        console.error("Failed to get clipboard", e);
    }
}

async function saveToClipboard() {
    const text = clipboardText.value;
    try {
        await window.go.main.App.SetClipboard(text);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Saved!";
        setTimeout(() => saveBtn.textContent = originalText, 1000);
    } catch (e) {
        alert("Failed to save clipboard: " + e);
    }
}

// --- AI Logic ---

async function sendToAI() {
    const prompt = clipboardText.value;
    if (!prompt.trim()) return;

    // Collapse UI
    document.body.classList.add("sending");

    // Mark as sent
    window.go.main.App.MarkSentToAI();

    responseContent.innerHTML = '<div class="loading-spinner"></div>';
    responseArea.style.display = "block";
    adjustWindowSize();

    try {
        const res = await window.go.main.App.AskAI(prompt);
        const cleanRes = res.replace(/<think>[\s\S]*?<\/think>/gi, '');
        responseContent.innerHTML = md.render(cleanRes.trim());
        adjustWindowSize();
    } catch (err) {
        responseContent.textContent = "Error: " + err;
        adjustWindowSize();
    }
}

// --- Event Listeners ---

saveBtn.onclick = saveToClipboard;
sendBtn.onclick = sendToAI;

// Ctrl+Enter to Send
clipboardText.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        sendToAI();
    }
});

// Sync Dropdowns
providerDropdown.onchange = async () => {
    const provider = providerDropdown.value;
    fillModelDropdown(provider);
    modelInput.value = modelDropdown.value;
    apiBaseUrlInput.value = API_ENDPOINTS[provider] || "";
    await saveConfig();
};

modelDropdown.onchange = async () => {
    modelInput.value = modelDropdown.value;
    await saveConfig();
};

async function saveConfig() {
    const cfg = {
        Provider: providerDropdown.value,
        Model: modelInput.value,
        APIBaseURL: apiBaseUrlInput.value,
        APIKey: ""
    };
    const current = await window.go.main.App.GetConfig();
    cfg.APIKey = current.APIKey;

    await window.go.main.App.SetConfig(cfg);
}

// Settings Modal
settingsBtn.onclick = () => settingsModal.style.display = "flex";
closeSettingsBtn.onclick = () => settingsModal.style.display = "none";
settingsForm.onsubmit = async (e) => {
    e.preventDefault();
    const cfg = {
        Provider: providerDropdown.value,
        Model: modelInput.value,
        APIBaseURL: apiBaseUrlInput.value,
        APIKey: ""
    };
    const current = await window.go.main.App.GetConfig();
    cfg.APIKey = current.APIKey;

    await window.go.main.App.SetConfig(cfg);
    settingsModal.style.display = "none";
};

// Start
init();
