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

/**
 * Applies global dynamic typography to text-first slides.
 * Font size is adjusted to content density while staying
 * between current body size and slide title size.
 */
let dynamicTextEnabled = false;

/**
 * Detects dynamic text control tag on title slide \<!-- dynamic-text -->
 * and returns whether dynamic typography mode should be enabled.
 */
function hasDynamicTextTagInMarkdown(markdown) {
  const normalizedMarkdown = (markdown || "").replace(/\r\n/g, "\n");
  const slides = normalizedMarkdown.split("\n---\n");

  if (slides.length < 2) {
    return false;
  }

  const titleSlide = slides[1];
  return titleSlide.includes("<!-- dynamic-text -->");
}

/**
 * Sets global state for dynamic typography mode.
 */
function setDynamicTextEnabledState(isEnabled) {
  dynamicTextEnabled = Boolean(isEnabled);

  const root = document.documentElement;
  if (!root) {
    return;
  }

  root.classList.toggle("dynamic-text-enabled", dynamicTextEnabled);
}

/**
 * Returns whether dynamic typography mode is enabled.
 */
function isDynamicTextEnabled() {
  return dynamicTextEnabled;
}

function resetDynamicTypographyState(container) {
  if (!container) {
    return;
  }

  container.classList.remove(
    "dynamic-center-content",
    "dynamic-center-text-column",
    "table-vertical-center-content",
    "dynamic-text-line-height"
  );
  container.style.removeProperty("font-size");
  container.style.removeProperty("line-height");
  container.style.removeProperty("padding-top");
  container.style.removeProperty("--dynamic-code-font-size");
}

/**
 * Scales code block text together with dynamic
 * slide typography while keeping a readable floor.
 */
function applyDynamicCodeFontSize(container, targetSize) {
  const codeFontSize = Math.max(15, targetSize * 0.72);
  container.style.setProperty(
    "--dynamic-code-font-size",
    `${codeFontSize.toFixed(2)}px`
  );
}

/**
 * Returns true for agenda slides where dynamic
 * typography and centering should not be applied.
 */
function isAgendaSlide(slideContent) {
  return (
    slideContent.className.includes("agenda-columns-") ||
    Boolean(slideContent.querySelector(".agenda-column"))
  );
}

/**
 * Returns the column count for dedicated multi-column
 * text slides, or 0 when class is not present.
 */
function getTextColumnCount(slideContent) {
  if (slideContent.classList.contains("col-3")) {
    return 3;
  }

  return slideContent.classList.contains("col-2") ? 2 : 0;
}

/**
 * Applies dynamic font scaling and vertical centering
 * for multi-column text slides.
 */
function applyDynamicTypographyToMultiColumnContainer(
  container,
  slideContent,
  columnCount
) {
  const computedStyles = window.getComputedStyle(container);
  const baseSize = parseFloat(computedStyles.fontSize) || 16;
  const titleNode = slideContent.querySelector(
    ".slide-header h3, .slide-header h2"
  );
  const titleSize = titleNode
    ? parseFloat(window.getComputedStyle(titleNode).fontSize) || 28
    : 28;

  const minSize = baseSize;
  const maxSize = Math.max(minSize, titleSize);
  const textContent = (container.textContent || "").trim();
  const charCount = textContent.length;
  const slideBody = slideContent.querySelector(".slide-body");
  const maxContentHeight = slideBody
    ? Math.max(120, slideBody.clientHeight)
    : Math.max(120, container.clientHeight);

  const densityDivider = columnCount === 3 ? 3.4 : 2.2;
  const effectiveDensity = charCount / densityDivider;

  let targetSize = maxSize;

  if (effectiveDensity > 900) {
    targetSize = minSize;
  } else if (effectiveDensity > 760) {
    targetSize = minSize + (maxSize - minSize) * 0.2;
  } else if (effectiveDensity > 620) {
    targetSize = minSize + (maxSize - minSize) * 0.35;
  } else if (effectiveDensity > 500) {
    targetSize = minSize + (maxSize - minSize) * 0.55;
  } else if (effectiveDensity > 360) {
    targetSize = minSize + (maxSize - minSize) * 0.75;
  }

  targetSize = Math.max(minSize, Math.min(maxSize, targetSize));
  container.classList.add("dynamic-text-line-height");
  container.style.fontSize = `${targetSize.toFixed(2)}px`;
  applyDynamicCodeFontSize(container, targetSize);

  let guard = 0;
  while (
    container.getBoundingClientRect().height > maxContentHeight - 4 &&
    targetSize > minSize &&
    guard < 40
  ) {
    targetSize = Math.max(minSize, targetSize - 0.5);
    container.style.fontSize = `${targetSize.toFixed(2)}px`;
    applyDynamicCodeFontSize(container, targetSize);
    guard += 1;
  }
}

/**
 * Applies centering and dynamic sizing for a target
 * content container inside a single slide.
 */
function applyDynamicTypographyToContainer(
  container,
  slideContent,
  centerClassName
) {
  if (!container) {
    return;
  }

  const hasTableContent = container.querySelector("table");
  const hasComplexContent = container.querySelector(
    ".mermaid, figure.auto-image, .auto-image-row, img, " +
      "div[style*='display:flex']"
  );

  if (hasTableContent && !hasComplexContent) {
    container.classList.add("table-vertical-center-content");
  }

  if (hasComplexContent) {
    return;
  }

  container.classList.add(centerClassName);

  const baseSize =
    parseFloat(window.getComputedStyle(container).fontSize) || 16;
  const titleNode = slideContent.querySelector(
    ".slide-header h3, .slide-header h2"
  );
  const titleSize = titleNode
    ? parseFloat(window.getComputedStyle(titleNode).fontSize) || 28
    : 28;

  const minSize = baseSize;
  const maxSize = Math.max(minSize, titleSize);

  const textContent = (container.textContent || "").trim();
  const charCount = textContent.length;
  const blockCount =
    container.querySelectorAll("p, ul, ol, blockquote, pre").length || 1;

  let targetSize = maxSize;

  if (charCount > 900 || blockCount > 9) {
    targetSize = minSize;
  } else if (charCount > 700 || blockCount > 7) {
    targetSize = minSize + (maxSize - minSize) * 0.25;
  } else if (charCount > 500 || blockCount > 6) {
    targetSize = minSize + (maxSize - minSize) * 0.45;
  } else if (charCount > 320 || blockCount > 4) {
    targetSize = minSize + (maxSize - minSize) * 0.7;
  }

  targetSize = Math.max(minSize, Math.min(maxSize, targetSize));

  container.classList.add("dynamic-text-line-height");
  container.style.fontSize = `${targetSize.toFixed(2)}px`;
  applyDynamicCodeFontSize(container, targetSize);

  let guard = 0;
  while (
    container.scrollHeight > container.clientHeight + 2 &&
    targetSize > minSize &&
    guard < 30
  ) {
    targetSize = Math.max(minSize, targetSize - 0.5);
    container.style.fontSize = `${targetSize.toFixed(2)}px`;
    applyDynamicCodeFontSize(container, targetSize);
    guard += 1;
  }
}

function applyDynamicSlideTypographyAndAlignment() {
  const dynamicModeEnabled = isDynamicTextEnabled();

  document.querySelectorAll(".remark-slide-content").forEach((slideContent) => {
    const slideBody = slideContent.querySelector(".slide-body");
    const bodyContent = slideContent.querySelector(".slide-body-content");
    const textColumn = slideContent.querySelector(
      ".slide-body-content > .slide-text"
    );
    const textColumnCount = getTextColumnCount(slideContent);

    if (slideBody) {
      slideBody.classList.remove("slide-body-top-aligned");
    }

    resetDynamicTypographyState(bodyContent);
    resetDynamicTypographyState(textColumn);

    if (
      !dynamicModeEnabled &&
      slideBody &&
      bodyContent &&
      textColumnCount > 0 &&
      !slideContent.classList.contains("section-slide") &&
      !isAgendaSlide(slideContent)
    ) {
      slideBody.classList.add("slide-body-top-aligned");
    }

    if (
      !dynamicModeEnabled ||
      !bodyContent ||
      slideContent.classList.contains("section-slide") ||
      isAgendaSlide(slideContent)
    ) {
      return;
    }

    if (textColumnCount > 0) {
      if (bodyContent.querySelector(".mermaid")) {
        return;
      }

      applyDynamicTypographyToMultiColumnContainer(
        bodyContent,
        slideContent,
        textColumnCount
      );
      return;
    }

    const isImageLayout =
      slideContent.classList.contains("img-right") ||
      slideContent.classList.contains("img-left");

    if (isImageLayout && textColumn) {
      applyDynamicTypographyToContainer(
        textColumn,
        slideContent,
        "dynamic-center-text-column"
      );
      return;
    }

    applyDynamicTypographyToContainer(
      bodyContent,
      slideContent,
      "dynamic-center-content"
    );
  });
}

Object.assign(window, {
  fixHangingShortWords,
  hasDynamicTextTagInMarkdown,
  setDynamicTextEnabledState,
  isDynamicTextEnabled,
  applyDynamicSlideTypographyAndAlignment
});
