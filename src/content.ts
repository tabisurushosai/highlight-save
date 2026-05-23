/**
 * 保存されたハイライトを現在のページに適用する
 */
async function restoreHighlights() {
  const url = window.location.href;
  const data = await chrome.storage.local.get("highlights");
  const highlights = data.highlights || [];
  const pageHighlights = highlights.filter((item: any) => item.url === url);

  pageHighlights.forEach((item: any) => {
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
  let node;
  const nodesToHighlight: Node[] = [];
  
  while (node = walker.nextNode()) {
    if (node.textContent && node.textContent.includes(textToMatch)) {
      nodesToHighlight.push(node);
    }
  }

  nodesToHighlight.forEach(node => {
    const content = node.textContent!;
    let index = content.indexOf(textToMatch);
    
    // 同一ノード内に複数ある場合も考慮 (簡易版)
    while (index !== -1) {
      const range = document.createRange();
      try {
        range.setStart(node, index);
        range.setEnd(node, index + textToMatch.length);
        
        const mark = document.createElement("mark");
        range.surroundContents(mark);
        
        // 次の検索位置へ (surroundContentsでノードが分割されるため、実際には複雑だが簡易的に終了)
        break; 
      } catch (e) {
        // ノードが跨がっている場合などは失敗する
        break;
      }
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
    } catch (e) {
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
