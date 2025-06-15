import MarkdownIt from "markdown-it";
import * as runtime from "../wailsjs/runtime/runtime";
const md = new MarkdownIt();

const input = document.getElementById("prompt");
const button = document.getElementById("send");
const output = document.getElementById("response");

button.onclick = async () => {
    const prompt = input.value;
    if (!prompt) return;
    output.textContent = "応答中...";
    window.go.main.App.AskAI(prompt).then(res => {
        // <think>...</think>を除去
        const cleanRes = res.replace(/<think>[\s\S]*?<\/think>/gi, '');
        output.innerHTML = md.render(cleanRes.trim());
        setTimeout(async () => {
            const aiwindow = document.getElementById("aiwindow");
            const rect = aiwindow.getBoundingClientRect();
            const width = Math.round(rect.width);
            const height = Math.min(Math.round(rect.height), 900);
            await runtime.WindowSetSize(width, height);
            // 画面情報取得
            const screens = await runtime.ScreenGetAll();
            const winPos = await runtime.WindowGetPosition();
            // 現在のウィンドウ位置とサイズ
            let x = winPos.x;
            let y = winPos.y;
            // メインスクリーンを仮定
            const screen = screens.find(s => s.isPrimary) || screens[0];
            // 右・下にはみ出す場合は調整
            if (x + width > screen.width) x = Math.max(0, screen.width - width);
            if (y + height > screen.height) y = Math.max(0, screen.height - height);
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

