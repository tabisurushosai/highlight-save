interface Highlight {
  text: string;
  url: string;
  ts: number;
  tag?: string;
}

let clearStatusTimer: number | undefined;

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

function setStatusMessage(message: string, tone: "success" | "error", clearAfterMs?: number) {
  const status = document.getElementById("status");
  if (!status) return;

  if (clearStatusTimer) {
    window.clearTimeout(clearStatusTimer);
    clearStatusTimer = undefined;
  }

  status.textContent = message;
  status.className = `statusMessage statusMessage--${tone}`;

  if (clearAfterMs) {
    clearStatusTimer = window.setTimeout(() => {
      status.textContent = "";
      status.className = "statusMessage";
      clearStatusTimer = undefined;
    }, clearAfterMs);
  }
}

async function renderHighlights() {
  const listContainer = document.getElementById("listContainer");
  if (!listContainer) return;

  listContainer.setAttribute("aria-busy", "true");
  listContainer.innerHTML = `<div class="loadingState">${chrome.i18n.getMessage("loadingHighlights")}</div>`;

  const data = await chrome.storage.local.get(["highlights", "isPremium", "trial_start_ts"]);
  const highlights: Highlight[] = data.highlights || [];
  const isPremium = data.isPremium || false;

  // Render Premium Status
  const premiumInfo = document.getElementById("premiumInfo");
  if (premiumInfo) {
    if (isPremium) {
      premiumInfo.innerHTML = `<div class="premiumBadge">${chrome.i18n.getMessage("isPremium")}</div>`;
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
        <div class="trialCard">
          <div class="trialText">
          ${chrome.i18n.getMessage("trialRemaining", [remainingDays.toString()])}
          </div>
          <button id="upgradeBtn" class="secondaryButton">${chrome.i18n.getMessage("upgradeButton")}</button>
        </div>
      `;
      document.getElementById("upgradeBtn")?.addEventListener("click", async () => {
        if (confirm("Simulate Stripe Purchase ($3)?")) {
          await chrome.storage.local.set({ isPremium: true });
          renderHighlights();
        }
      });
    }
  }

  listContainer.removeAttribute("aria-busy");

  if (highlights.length === 0) {
    listContainer.innerHTML = `<div class="emptyState">${chrome.i18n.getMessage("noHighlights")}</div>`;
    return;
  }

  const deleteLabel = chrome.i18n.getMessage("deleteButton");
  const listHtml = [...highlights].reverse().map((item: Highlight) => {
    const snippet = item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text;
    const tagHtml = item.tag ? `<span class="tagPill">${escapeHtml(`#${item.tag}`)}</span>` : "";
    return `
      <div class="highlightItem" data-url="${escapeHtml(item.url)}">
        <div class="highlightSnippet">${tagHtml}${escapeHtml(snippet)}</div>
        <div class="highlightUrl">
          ${escapeHtml(item.url)}
        </div>
        <button class="deleteBtn" data-ts="${item.ts}" aria-label="${escapeHtml(deleteLabel)}" title="${escapeHtml(deleteLabel)}">×</button>
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
    setStatusMessage(chrome.i18n.getMessage("premiumRequired"), "error");
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

      setStatusMessage(chrome.i18n.getMessage("savedSuccess"), "success", 2000);
      renderHighlights();
    } else {
      setStatusMessage(chrome.i18n.getMessage("noSelectionError"), "error", 2000);
    }
  } catch (err) {
    console.error("Failed to execute script:", err);
    setStatusMessage(chrome.i18n.getMessage("genericError"), "error");
  }
}

const app = document.getElementById("app");
const appName = document.getElementById("appName");
if (appName) {
  appName.textContent = chrome.i18n.getMessage("appName");
}
if (app) {
  app.innerHTML = `
    <div id="premiumInfo" class="premiumArea"></div>
    <div class="savePanel">
      <label class="fieldLabel" for="tagInput">${chrome.i18n.getMessage("tagPlaceholder")}</label>
      <input type="text" id="tagInput" class="textInput" placeholder="${chrome.i18n.getMessage("tagPlaceholder")}">
      <button id="saveBtn" class="primaryButton">${chrome.i18n.getMessage("saveButton")}</button>
    </div>
    <div id="status" class="statusMessage" role="status" aria-live="polite"></div>
    <div id="listContainer" class="highlightList" aria-live="polite"></div>
  `;
  document.getElementById("saveBtn")?.addEventListener("click", saveSelection);
  renderHighlights();
}

export {};
