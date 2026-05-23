/**
 * 現在の選択テキストを取得して返す
 */
function getSelectedText(): string {
  return window.getSelection()?.toString() || "";
}

getSelectedText();
