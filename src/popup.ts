import {
  appendHighlight,
  canSaveHighlight,
  createHighlight,
  deleteHighlightByTimestamp,
  FREE_HIGHLIGHT_LIMIT,
  getHighlightSnippet,
  getRemainingTrialDays,
  type Highlight,
} from "./core/highlights";
import {
  formatLocalizedCurrency,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  resolveSupportedLocale,
} from "./core/format";
import { chromeHighlightStorage } from "./storage/chromeStorage";

const PREMIUM_PRICE_USD = 3;
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
} as const;
const HTML_ENTITY_PATTERN = /[&<>"']/g;

type HtmlEntity = keyof typeof HTML_ENTITIES;
type HtmlElementConstructor<T extends HTMLElement> = { new (): T };

let clearStatusTimer: number | undefined;
let saveButtonLabel = "";

function escapeHtml(value: string): string {
  return value.replace(HTML_ENTITY_PATTERN, (char) => HTML_ENTITIES[char as HtmlEntity]);
}

function getTypedElementById<T extends HTMLElement>(
  id: string,
  constructor: HtmlElementConstructor<T>,
): T | null {
  const element = document.getElementById(id);

  return element instanceof constructor ? element : null;
}

function getUiLocale(): string {
  return resolveSupportedLocale(chrome.i18n.getUILanguage());
}

function getDocumentLanguage(): string {
  return getUiLocale();
}

function formatNumber(value: number): string {
  return formatLocalizedNumber(value, getUiLocale());
}

function formatPremiumPrice(): string {
  return formatLocalizedCurrency(PREMIUM_PRICE_USD, "USD", getUiLocale());
}

function getTrialRemainingMessage(remainingDays: number): string {
  if (remainingDays <= 0) {
    return chrome.i18n.getMessage("trialEnded");
  }

  const messageName = remainingDays === 1 ? "trialRemainingOne" : "trialRemainingOther";
  return chrome.i18n.getMessage(messageName, [formatNumber(remainingDays)]);
}

function setStatusMessage(message: string, tone: "success" | "error" | "info", clearAfterMs?: number) {
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

function setSaveButtonPending(isPending: boolean) {
  const saveButton = getTypedElementById("saveBtn", HTMLButtonElement);
  if (!saveButton) return;

  saveButton.disabled = isPending;
  saveButton.setAttribute("aria-disabled", String(isPending));
  saveButton.setAttribute("aria-busy", String(isPending));
  saveButton.textContent = isPending ? chrome.i18n.getMessage("savingButton") : saveButtonLabel;
}

function getSavedCountMessage(count: number): string {
  const messageName = count === 1 ? "savedCountOne" : "savedCountOther";
  return chrome.i18n.getMessage(messageName, [formatNumber(count)]);
}

function getSavedAtMessage(timestamp: number): string {
  const savedAt = formatLocalizedDateTime(timestamp, getUiLocale());
  return chrome.i18n.getMessage("savedAt", [savedAt]);
}

function renderEmptyState(listContainer: HTMLElement) {
  listContainer.removeAttribute("role");
  listContainer.removeAttribute("aria-describedby");
  listContainer.innerHTML = `
    <div class="emptyState" role="note">
      <p class="emptyStateKicker">${chrome.i18n.getMessage("emptyStateKicker")}</p>
      <div class="emptyStateTitle">${chrome.i18n.getMessage("emptyStateTitle")}</div>
      <p class="emptyStateDescription">${chrome.i18n.getMessage("emptyStateDescription")}</p>
      <ol class="emptyStateSteps">
        <li>${chrome.i18n.getMessage("emptyStateStepSelect")}</li>
        <li>${chrome.i18n.getMessage("emptyStateStepSave")}</li>
        <li>${chrome.i18n.getMessage("emptyStateStepReview")}</li>
      </ol>
      <p class="emptyStateNextAction">${chrome.i18n.getMessage("emptyStateNextAction")}</p>
    </div>
  `;
}

async function renderHighlights() {
  const listContainer = document.getElementById("listContainer");
  if (!listContainer) return;

  listContainer.removeAttribute("role");
  listContainer.setAttribute("aria-busy", "true");
  listContainer.innerHTML = `<div class="loadingState" role="status">${chrome.i18n.getMessage("loadingHighlights")}</div>`;

  const data = await chromeHighlightStorage.load();
  const highlights = data.highlights;
  const isPremium = data.isPremium;
  const listMeta = document.getElementById("listMeta");
  if (listMeta) {
    listMeta.textContent = getSavedCountMessage(highlights.length);
  }
  const onboardingGuide = document.getElementById("onboardingGuide");
  if (onboardingGuide) {
    onboardingGuide.hidden = highlights.length > 0;
  }

  // Render Premium Status
  const premiumInfo = document.getElementById("premiumInfo");
  if (premiumInfo) {
    if (isPremium) {
      premiumInfo.innerHTML = `<div class="premiumBadge">${chrome.i18n.getMessage("isPremium")}</div>`;
    } else {
      const now = Date.now();
      const trialStart = data.trialStartTs || now;
      if (!data.trialStartTs) {
        await chromeHighlightStorage.saveTrialStartTs(now);
      }
      const remainingDays = getRemainingTrialDays(trialStart, now);
      const premiumPrice = formatPremiumPrice();

      premiumInfo.innerHTML = `
        <div class="trialCard">
          <div id="trialStatus" class="trialText">
          ${getTrialRemainingMessage(remainingDays)}
          </div>
          <button type="button" id="upgradeBtn" class="secondaryButton" aria-describedby="trialStatus">${chrome.i18n.getMessage("upgradeButton", [premiumPrice])}</button>
        </div>
      `;
      document.getElementById("upgradeBtn")?.addEventListener("click", async () => {
        if (confirm(chrome.i18n.getMessage("purchaseConfirm", [premiumPrice]))) {
          await chromeHighlightStorage.savePremium(true);
          renderHighlights();
        }
      });
    }
  }

  listContainer.removeAttribute("aria-busy");

  if (highlights.length === 0) {
    renderEmptyState(listContainer);
    return;
  }

  const deleteLabel = chrome.i18n.getMessage("deleteButton");
  const openLabel = chrome.i18n.getMessage("openHighlight");
  listContainer.setAttribute("role", "list");
  listContainer.setAttribute("aria-describedby", "listMeta listInteractionHint");
  const listHtml = [...highlights].reverse().map((item: Highlight) => {
    const snippet = getHighlightSnippet(item.text);
    const deleteAccessibleLabel = `${deleteLabel}: ${snippet}`;
    const savedAt = getSavedAtMessage(item.ts);
    const tagHtml = item.tag ? `<span class="tagPill">${escapeHtml(`#${item.tag}`)}</span>` : "";
    return `
      <div class="highlightItem" role="listitem">
        <button type="button" class="highlightOpenBtn" data-url="${escapeHtml(item.url)}" title="${escapeHtml(openLabel)}">
          <span class="visuallyHidden">${escapeHtml(openLabel)}: </span>
          <span class="highlightSnippet">${tagHtml}${escapeHtml(snippet)}</span>
          <span class="highlightSavedAt">${escapeHtml(savedAt)}</span>
          <span class="highlightUrl">
            ${escapeHtml(item.url)}
          </span>
        </button>
        <button type="button" class="deleteBtn" data-ts="${item.ts}" aria-label="${escapeHtml(deleteAccessibleLabel)}" title="${escapeHtml(deleteLabel)}">×</button>
      </div>
    `;
  }).join("");

  listContainer.innerHTML = listHtml;

  listContainer.querySelectorAll<HTMLButtonElement>(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const ts = btn.getAttribute("data-ts");
      if (ts) {
        await deleteHighlight(Number(ts));
      }
    });
  });

  listContainer.querySelectorAll<HTMLButtonElement>(".highlightOpenBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (url) {
        chrome.tabs.create({ url });
      }
    });
  });
}

function focusAfterListUpdate() {
  const firstOpenButton = document.querySelector<HTMLButtonElement>(".highlightOpenBtn");
  if (firstOpenButton) {
    firstOpenButton.focus();
    return;
  }

  getTypedElementById("saveBtn", HTMLButtonElement)?.focus();
}

async function deleteHighlight(ts: number) {
  setStatusMessage(chrome.i18n.getMessage("deletingHighlight"), "info");
  const data = await chromeHighlightStorage.load();
  const highlights = deleteHighlightByTimestamp(data.highlights, ts);

  await chromeHighlightStorage.saveHighlights(highlights);
  await renderHighlights();
  focusAfterListUpdate();
  setStatusMessage(chrome.i18n.getMessage("deletedSuccess"), "success", 2000);
}

async function saveSelection() {
  const saveButton = getTypedElementById("saveBtn", HTMLButtonElement);
  if (saveButton?.disabled) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  setSaveButtonPending(true);
  setStatusMessage(chrome.i18n.getMessage("savingHighlight"), "info");

  try {
    const data = await chromeHighlightStorage.load();
    const highlights = data.highlights;
    const isPremium = data.isPremium;

    if (!canSaveHighlight(highlights, isPremium)) {
      setStatusMessage(chrome.i18n.getMessage("premiumRequired", [formatNumber(FREE_HIGHLIGHT_LIMIT)]), "error");
      return;
    }

    const results = await chrome.scripting.executeScript<[], string>({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    const text = results[0]?.result;
    if (text && typeof text === "string") {
      const url = tab.url || "";
      const ts = Date.now();
      const tagInput = getTypedElementById("tagInput", HTMLInputElement);
      const tag = tagInput?.value.trim() || "";
      const newItem = createHighlight({ text, url, ts, tag });

      await chromeHighlightStorage.saveHighlights(appendHighlight(highlights, newItem));

      if (tagInput) tagInput.value = "";

      setStatusMessage(chrome.i18n.getMessage("savedSuccess"), "success", 2000);
      await renderHighlights();
    } else {
      setStatusMessage(chrome.i18n.getMessage("noSelectionError"), "error", 2000);
    }
  } catch (err) {
    console.error("Failed to execute script:", err);
    setStatusMessage(chrome.i18n.getMessage("genericError"), "error");
  } finally {
    setSaveButtonPending(false);
  }
}

const app = document.getElementById("app");
const appName = document.getElementById("appName");
if (appName) {
  const localizedAppName = chrome.i18n.getMessage("appName");
  document.documentElement.lang = getDocumentLanguage();
  document.title = localizedAppName;
  appName.textContent = localizedAppName;
}
if (app) {
  app.setAttribute("role", "main");
  app.setAttribute("aria-labelledby", "appName");
  saveButtonLabel = chrome.i18n.getMessage("saveButton");
  app.innerHTML = `
    <div id="premiumInfo" class="premiumArea" aria-live="polite" aria-atomic="true"></div>
    <form id="saveForm" class="savePanel" aria-describedby="onboardingGuide">
      <p id="onboardingGuide" class="onboardingGuide">${chrome.i18n.getMessage("onboardingGuide")}</p>
      <label class="fieldLabel" for="tagInput">${chrome.i18n.getMessage("tagPlaceholder")}</label>
      <p id="tagInputHelp" class="visuallyHidden">${chrome.i18n.getMessage("tagInputHelp")}</p>
      <input type="text" id="tagInput" class="textInput" placeholder="${chrome.i18n.getMessage("tagPlaceholder")}" autocomplete="off" aria-describedby="tagInputHelp">
      <button type="submit" id="saveBtn" class="primaryButton" aria-disabled="false" aria-busy="false">${saveButtonLabel}</button>
    </form>
    <div id="status" class="statusMessage" role="status" aria-live="polite" aria-atomic="true"></div>
    <div class="sectionHeader">
      <h2 id="highlightListTitle" class="sectionTitle">${chrome.i18n.getMessage("highlightListLabel")}</h2>
      <span id="listMeta" class="sectionMeta" aria-live="polite" aria-atomic="true">${getSavedCountMessage(0)}</span>
    </div>
    <p id="listInteractionHint" class="visuallyHidden">${chrome.i18n.getMessage("listInteractionHint")}</p>
    <div id="listContainer" class="highlightList" aria-live="polite" aria-labelledby="highlightListTitle"></div>
  `;
  getTypedElementById("saveForm", HTMLFormElement)?.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSelection();
  });
  renderHighlights();
}
