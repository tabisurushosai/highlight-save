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
      // surroundContents can fail if the range splits a non-Text node
      // with only one of its boundary points.
      // In that case, we use extractContents as a fallback.
      const contents = range.extractContents();
      mark.appendChild(contents);
      range.insertNode(mark);
    }
    // Clear selection after highlighting
    selection.removeAllRanges();
  }

  return text;
}

highlightAndGetText();
