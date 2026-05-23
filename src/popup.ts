interface Highlight {
  text: string;
  url: string;
  ts: number;
  tag?: string;
}

async function renderHighlights() {
  const data = await chrome.storage.local.get(["highlights", "isPremium", "trial_start_ts"]);
  const highlights: Highlight[] = data.highlights || [];
  const isPremium = data.isPremium || false;
  const listContainer = document.getElementById("listContainer");
  if (!listContainer) return;

  // Render Premium Status
  const premiumInfo = document.getElementById("premiumInfo");
  if (premiumInfo) {
    if (isPremium) {
      premiumInfo.innerHTML = `<div style="color: #27ae60; font-weight: bold; margin-bottom: 10px;">${chrome.i18n.getMessage("isPremium")}</div>`;
    } else {
      const now = Date.now();
      const trialStart = data.trial_start_ts || now;
      if (!data.trial_start_ts) {
        await chrome.storage.local.set({ trial_start_ts: now });
      }
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const elapsed = now - trialStart;
      const remainingDays = Math.max(0, Math.ceil((sevenDaysMs - elapsed) / (24 * 60 * 60 * 1000)));
      
      premiumInfo.innerHTML = `
        <div style="font-size: 0.8em; margin-bottom: 5px; color: #666;">
          ${chrome.i18n.getMessage("trialRemaining", [remainingDays.toString()])}
        </div>
        <button id="upgradeBtn" style="width: 100%; background: #e67e22; color: white; border: none; padding: 6px; cursor: pointer; border-radius: 4px; font-size: 0.85em; margin-bottom: 10px;">
          ${chrome.i18n.getMessage("upgradeButton")}
        </button>
      `;
      document.getElementById("upgradeBtn")?.addEventListener("click", async () => {
        if (confirm("Simulate Stripe Purchase ($3)?")) {
          await chrome.storage.local.set({ isPremium: true });
          renderHighlights();
        }
      });
    }
  }

  if (highlights.length === 0) {
    listContainer.innerHTML = `<p style='color: #666; font-size: 0.9em;'>${chrome.i18n.getMessage("noHighlights")}</p>`;
    return;
  }

  const listHtml = [...highlights].reverse().map((item: Highlight) => {
    const snippet = item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text;
    const tagHtml = item.tag ? `<span style="background: #e1f5fe; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-right: 6px; color: #0277bd;">#${item.tag}</span>` : "";
    return `
      <div class="highlightItem" data-url="${item.url}" style="border-bottom: 1px solid #eee; padding: 10px 0; font-size: 0.9em; position: relative; cursor: pointer;">
        <div style="font-weight: bold; margin-bottom: 4px; word-break: break-all; padding-right: 24px;">${tagHtml}${snippet}</div>
        <div style="color: #666; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 24px;">
          ${item.url}
        </div>
        <button class="deleteBtn" data-ts="${item.ts}" style="position: absolute; top: 10px; right: 0; background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2em; padding: 0 4px; z-index: 1;">×</button>
      </div>
    `;
  }).join("");

  listContainer.innerHTML = listHtml;

  listContainer.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ts = (e.target as HTMLElement).getAttribute("data-ts");
      if (ts) {
        await deleteHighlight(Number(ts));
      }
    });
  });

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
  let highlights: Highlight[] = data.highlights || [];
  highlights = highlights.filter((item: Highlight) => item.ts !== ts);
  await chrome.storage.local.set({ highlights });
  renderHighlights();
}

async function saveSelection() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const data = await chrome.storage.local.get(["highlights", "isPremium"]);
  const highlights: Highlight[] = data.highlights || [];
  const isPremium = data.isPremium || false;

  if (!isPremium && highlights.length >= 20) {
    const status = document.getElementById("status");
    if (status) {
      status.style.color = "#c0392b";
      status.textContent = chrome.i18n.getMessage("premiumRequired");
    }
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    const text = results[0]?.result;
    if (text && typeof text === "string") {
      const url = tab.url || "";
      const ts = Date.now();
      const tagInput = document.getElementById("tagInput") as HTMLInputElement;
      const tag = tagInput?.value.trim() || "";
      const newItem = { text, url, ts, tag };

      highlights.push(newItem);
      await chrome.storage.local.set({ highlights });

      if (tagInput) tagInput.value = "";

      const status = document.getElementById("status");
      if (status) {
        status.style.color = "#27ae60";
        status.textContent = chrome.i18n.getMessage("savedSuccess");
        setTimeout(() => {
          if (status) status.textContent = "";
        }, 2000);
      }
      renderHighlights();
    } else {
      const status = document.getElementById("status");
      if (status) {
        status.style.color = "#c0392b";
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
      status.style.color = "#c0392b";
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
    <div id="premiumInfo"></div>
    <input type="text" id="tagInput" placeholder="${chrome.i18n.getMessage("tagPlaceholder")}" style="width: 100%; padding: 8px; margin-bottom: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
    <button id="saveBtn" style="width: 100%; padding: 10px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px; font-weight: bold;">${chrome.i18n.getMessage("saveButton")}</button>
    <div id="status" style="margin: 10px 0; font-size: 0.85em; height: 1.2em; text-align: center;"></div>
    <div id="listContainer" style="margin-top: 10px; border-top: 1px solid #eee;"></div>
  `;
  document.getElementById("saveBtn")?.addEventListener("click", saveSelection);
  renderHighlights();
}

export {};
