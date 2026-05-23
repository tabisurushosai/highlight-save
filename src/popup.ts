async function saveSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    const text = results[0]?.result;
    if (text && typeof text === "string") {
      const url = tab.url || "";
      const ts = Date.now();
      const newItem = { text, url, ts };

      const data = await chrome.storage.local.get("highlights");
      const highlights = data.highlights || [];
      highlights.push(newItem);
      await chrome.storage.local.set({ highlights });

      const status = document.getElementById("status");
      if (status) {
        status.textContent = "保存しました！";
        setTimeout(() => {
          if (status) status.textContent = "";
        }, 2000);
      }
    } else {
      const status = document.getElementById("status");
      if (status) {
        status.textContent = "選択範囲が見つかりません";
        setTimeout(() => {
          if (status) status.textContent = "";
        }, 2000);
      }
    }
  } catch (err) {
    console.error("Failed to execute script:", err);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = "エラーが発生しました";
    }
  }
}

const app = document.getElementById("app");
if (app) {
  app.innerHTML = `
    <button id="saveBtn">選択を保存</button>
    <div id="status" style="margin-top: 10px; font-size: 0.8em;"></div>
  `;
  document.getElementById("saveBtn")?.addEventListener("click", saveSelection);
}

export {};
