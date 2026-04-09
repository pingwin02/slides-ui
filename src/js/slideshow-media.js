/**
 * Iterates through all pre elements containing
 * element with mermaid class and replaces them with
 * div elements with mermaid class. Then for each div
 * with mermaid class calls mermaid library init method
 * to render diagram.
 */
function renderMermaidDiagrams() {
  document.querySelectorAll("pre > .mermaid").forEach((diagram) => {
    let diagramText = "";
    $(diagram)
      .children("div")
      .each(function () {
        diagramText += this.innerText + "\n";
      });
    const mermaidDiagram = $("<div class=\"mermaid\"></div>");
    mermaidDiagram.attr("data-mermaid-source", diagramText);
    mermaidDiagram.text(diagramText);
    $(diagram).parent().replaceWith(mermaidDiagram);
  });

  const visibleDiagrams = Array.from(
    document.querySelectorAll(".remark-visible .mermaid")
  );

  if (visibleDiagrams.length === 0) {
    window.fitMermaidDiagramsToContent();
    return;
  }

  const renderableDiagrams = visibleDiagrams.filter((diagram) => {
    const source = (
      diagram.getAttribute("data-mermaid-source") ||
      diagram.textContent ||
      ""
    ).trim();

    if (source.length === 0) {
      return false;
    }

    diagram.setAttribute("data-mermaid-source", source);
    return diagram.getAttribute("data-mermaid-rendered") !== "true";
  });

  if (renderableDiagrams.length === 0) {
    window.fitMermaidDiagramsToContent();
    return;
  }

  const markAsRendered = () => {
    renderableDiagrams.forEach((diagram) => {
      diagram.setAttribute("data-mermaid-rendered", "true");
    });
  };

  if (typeof mermaid.run === "function") {
    mermaid
      .run({ nodes: renderableDiagrams })
      .then(() => {
        markAsRendered();
        window.fitMermaidDiagramsToContent();
      })
      .catch(() => {
        window.fitMermaidDiagramsToContent();
      });
    return;
  }

  renderableDiagrams.forEach((diagram) => {
    if (diagram.offsetWidth > 0) {
      mermaid.init(undefined, diagram);
      diagram.setAttribute("data-mermaid-rendered", "true");
    }
  });

  window.fitMermaidDiagramsToContent();
}

/**
 * Converts markdown-like footnotes ([^id] and
 * [^id]: text) into rendered footnote references
 * and a notes block.
 */
function normalizeMarkdownFootnotes() {
  $(".slide-body").each(function () {
    const slideBody = this;
    const bodyContent = slideBody.querySelector(".slide-body-content");
    if (!bodyContent) {
      return;
    }

    const existingFootnotes = slideBody.querySelector(".slide-footnotes");
    if (existingFootnotes) {
      existingFootnotes.remove();
    }

    const definitions = collectFootnoteDefinitions(bodyContent);
    if (definitions.size === 0) {
      return;
    }

    const usedFootnotes = replaceFootnoteReferences(bodyContent, definitions);
    if (usedFootnotes.length === 0) {
      return;
    }

    const notesContainer = document.createElement("div");
    notesContainer.className = "slide-footnotes";

    const notesList = document.createElement("ol");
    usedFootnotes.forEach((note) => {
      const item = document.createElement("li");
      appendCaptionTextWithLinks($(item), note.text);
      notesList.appendChild(item);
    });

    notesContainer.appendChild(notesList);
    slideBody.appendChild(notesContainer);
  });
}

/**
 * Collects footnote definitions from paragraphs and list items.
 */
function collectFootnoteDefinitions(container) {
  const definitions = new Map();

  container.querySelectorAll("p, li").forEach((node) => {
    const text = (node.textContent || "").trim();
    const match = text.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
    if (!match) {
      return;
    }

    const id = match[1].trim();
    const content = match[2].trim();
    if (id.length === 0 || content.length === 0) {
      return;
    }

    definitions.set(id, content);
    node.remove();
  });

  return definitions;
}

/**
 * Replaces footnote references in text nodes with superscript markers.
 */
function replaceFootnoteReferences(container, definitions) {
  const referenceOrder = [];
  const assignedNumbers = new Map();

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || node.nodeValue.indexOf("[^") === -1) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("code, pre, a, .slide-footnotes")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    const regex = /\[\^([^\]]+)\]/g;
    let match;
    let lastIndex = 0;
    let replaced = false;
    const fragment = document.createDocumentFragment();

    while ((match = regex.exec(text)) !== null) {
      const id = (match[1] || "").trim();
      if (!definitions.has(id)) {
        continue;
      }

      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      if (!assignedNumbers.has(id)) {
        assignedNumbers.set(id, assignedNumbers.size + 1);
        referenceOrder.push(id);
      }

      const sup = document.createElement("sup");
      sup.className = "footnote-ref";
      sup.textContent = String(assignedNumbers.get(id));
      fragment.appendChild(sup);

      lastIndex = regex.lastIndex;
      replaced = true;
    }

    if (!replaced) {
      return;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  });

  return referenceOrder.map((id) => ({
    id,
    number: assignedNumbers.get(id),
    text: definitions.get(id)
  }));
}

/**
 * Converts standalone markdown images into figure
 * elements with optional figcaption generated from
 * alt text.
 */
function normalizeMarkdownImages() {
  $(".slide-body-content").each(function () {
    $(this)
      .children("p")
      .each(function () {
        const paragraph = $(this);
        const image = paragraph.children("img:only-child");

        if (image.length === 0) {
          return;
        }

        if ((paragraph.text() || "").trim().length > 0) {
          return;
        }

        const figure = $("<figure class=\"auto-image\"></figure>");
        const caption = (image.attr("alt") || "").trim();

        image.appendTo(figure);

        if (caption.length > 0) {
          const captionNode = $("<figcaption></figcaption>");
          const lines = caption.split(/<br\s*\/?>|\r?\n/i);

          lines.forEach((line, index) => {
            if (index > 0) {
              captionNode.append("<br>");
            }
            appendCaptionTextWithLinks(captionNode, line);
          });

          captionNode.appendTo(figure);
        }

        paragraph.replaceWith(figure);
      });
  });
}

/**
 * Appends text to caption node while preserving markdown links and plain URLs.
 */
function appendCaptionTextWithLinks(captionNode, line) {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      appendPlainTextWithAutoLinks(
        captionNode,
        line.slice(lastIndex, match.index)
      );
    }

    appendLinkNode(captionNode, match[1], match[2]);
    lastIndex = markdownLinkRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    appendPlainTextWithAutoLinks(captionNode, line.slice(lastIndex));
  }
}

/**
 * Appends text and turns plain HTTP links into anchors.
 */
function appendPlainTextWithAutoLinks(captionNode, text) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      captionNode.append(
        document.createTextNode(text.slice(lastIndex, match.index))
      );
    }

    appendLinkNode(captionNode, match[0], match[0]);
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    captionNode.append(document.createTextNode(text.slice(lastIndex)));
  }
}

/**
 * Appends an anchor node to the given caption container.
 */
function appendLinkNode(captionNode, label, href) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  captionNode.append(link);
}

Object.assign(window, {
  renderMermaidDiagrams,
  normalizeMarkdownFootnotes,
  collectFootnoteDefinitions,
  replaceFootnoteReferences,
  normalizeMarkdownImages,
  appendCaptionTextWithLinks,
  appendPlainTextWithAutoLinks,
  appendLinkNode
});
