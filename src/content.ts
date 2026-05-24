import { contentChromeHighlightStorage } from "./storage/contentChromeStorage";

/**
 * 保存されたハイライトを現在のページに適用する
 */
async function restoreHighlights() {
  const url = window.location.href;
  const data = await contentChromeHighlightStorage.load();
  const pageHighlights = data.highlights.filter((item) => item.url === url);

  pageHighlights.forEach((item) => {
    applyHighlight(item.text);
  });
}

/**
 * 特定のテキストをページ内で検索してハイライトする
 */
function applyHighlight(textToMatch: string) {
  if (!textToMatch) return;

  // TreeWalkerを使ってテキストノードを走査
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();
  const nodesToHighlight: Node[] = [];

  while (node) {
    if (node.textContent && node.textContent.includes(textToMatch)) {
      nodesToHighlight.push(node);
    }
    node = walker.nextNode();
  }

  nodesToHighlight.forEach(node => {
    const content = node.textContent;
    if (!content) return;

    const index = content.indexOf(textToMatch);
    if (index === -1) return;

    const range = document.createRange();
    try {
      range.setStart(node, index);
      range.setEnd(node, index + textToMatch.length);

      const mark = document.createElement("mark");
      range.surroundContents(mark);
    } catch {
      // ノードが跨がっている場合などは失敗する
    }
  });
}

/**
 * 現在の選択テキストを取得してハイライトし、テキストを返す
 */
function highlightAndGetText(): string {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  const text = selection.toString();

  if (text.trim() !== "") {
    const mark = document.createElement("mark");
    try {
      range.surroundContents(mark);
    } catch {
      const contents = range.extractContents();
      mark.appendChild(contents);
      range.insertNode(mark);
    }
    selection.removeAllRanges();
  }

  return text;
}

// 起動時にハイライトを復元
restoreHighlights();

// executeScript 用に結果を返す
highlightAndGetText();
