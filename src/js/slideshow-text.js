/**
 * Eliminates hanging single-letter words
 * (e.g., w, z, a, i)
 * and single-digit numbers by replacing the following
 * regular space with a non-breaking space.
 */
function fixHangingShortWords() {
  const slideContents = document.querySelectorAll(".remark-slide-content");

  slideContents.forEach((container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (
          node.parentElement &&
          node.parentElement.closest(
            "code, pre, script, style, textarea, .mermaid, .katex, .math"
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodesToModify = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      nodesToModify.push(currentNode);
    }

    const regex = /(^|[\s(>"'])([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\d)[ \n\r\t]+/g;

    nodesToModify.forEach((textNode) => {
      const text = textNode.nodeValue;
      const newText = text
        .replace(regex, "$1$2\u00A0")
        .replace(regex, "$1$2\u00A0");
      if (text !== newText) {
        textNode.nodeValue = newText;
      }
    });
  });
}

Object.assign(window, {
  fixHangingShortWords
});
