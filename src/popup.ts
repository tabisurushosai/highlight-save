async function renderHighlights() {
  const data = await chrome.storage.local.get("highlights");
  const highlights = data.highlights || [];
  const listContainer = document.getElementById("listContainer");
  if (!listContainer) return;

  if (highlights.length === 0) {
    listContainer.innerHTML = `<p style='color: #666; font-size: 0.9em;'>${chrome.i18n.getMessage("noHighlights")}</p>`;
    return;
  }

  const listHtml = [...highlights].reverse().map((item: any) => {
    const snippet = item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text;
    return `
      <div class="highlightItem" data-url="${item.url}" style="border-bottom: 1px solid #eee; padding: 8px 0; font-size: 0.9em; position: relative; cursor: pointer;">
        <div style="font-weight: bold; margin-bottom: 4px; word-break: break-all; padding-right: 24px;">${snippet}</div>
        <div style="color: #666; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 24px;">
          ${item.url}
        </div>
        <button class="deleteBtn" data-ts="${item.ts}" style="position: absolute; top: 8px; right: 0; background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2em; padding: 0 4px; z-index: 1;">×</button>
      </div>
    `;
  }).join("");

  listContainer.innerHTML = listHtml;

  // Add event listeners for delete buttons
  listContainer.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ts = (e.target as HTMLElement).getAttribute("data-ts");
      if (ts) {
        await deleteHighlight(Number(ts));
      }
    });
  });

  // Add event listeners for item clicks
  listContainer.querySelectorAll(".highlightItem").forEach(item => {
    item.addEventListener("click", (e) => {
      const url = (e.currentTarget as HTMLElement).getAttribute("data-url");
      if (url) {
        chrome.tabs.create({ url });
      }
    });
  });
}

async function deleteHighlight(ts: number) {
  const data = await chrome.storage.local.get("highlights");
  let highlights = data.highlights || [];
  highlights = highlights.filter((item: any) => item.ts !== ts);
  await chrome.storage.local.set({ highlights });
  renderHighlights();
}

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
        status.textContent = chrome.i18n.getMessage("savedSuccess");
        setTimeout(() => {
          if (status) status.textContent = "";
        }, 2000);
      }
      renderHighlights();
    } else {
      const status = document.getElementById("status");
      if (status) {
        status.textContent = chrome.i18n.getMessage("noSelectionError");
        setTimeout(() => {
          if (status) status.textContent = "";
        }, 2000);
      }
    }
  } catch (err) {
    console.error("Failed to execute script:", err);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = chrome.i18n.getMessage("genericError");
    }
  }
}

const app = document.getElementById("app");
const appName = document.getElementById("appName");
if (appName) {
  appName.textContent = chrome.i18n.getMessage("appName");
}
if (app) {
  app.innerHTML = `
    <button id="saveBtn" style="width: 100%; padding: 8px; cursor: pointer;">${chrome.i18n.getMessage("saveButton")}</button>
    <div id="status" style="margin: 10px 0; font-size: 0.8em; height: 1.2em;"></div>
    <div id="listContainer" style="margin-top: 10px; border-top: 1px solid #ccc;"></div>
  `;
  document.getElementById("saveBtn")?.addEventListener("click", saveSelection);
  renderHighlights();
}

export {};
