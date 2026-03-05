let slideshow;

const HEADER_NODE_SELECTOR = "h1, h2, h3, .logo--horizontal, .logo--full";
const BODY_EXCLUDED_SELECTOR =
  ".slide-header, .remark-slide-number, .slide-body";
const AUTO_IMAGE_SELECTOR = "figure.auto-image";
const AUTO_IMAGE_ROW_SELECTOR = ".auto-image-row";

let slides = window.location.pathname;

if (slides === "/") {
  window.location.replace("/slides/Materials.md");
}

appendCustomSlides(slides);

// Fetch markdown slides.
let slidesRequest = $.ajax({
  url: slides,
  type: "GET",
  headers: {
    Accept: "text/markdown"
  }
}).fail(function () {
  alert(
    "Markdown file not found. Please check if the file exists and the path is correct."
  );
});

// Fetch slides template.
let templateRequest = $.ajax({
  url: "/md/template.md",
  type: "GET",
  headers: {
    Accept: "text/markdown"
  }
});

$.when(slidesRequest, templateRequest).done(function (slide, template) {
  // Markdown source is made with template and appended slides source.
  let md =
    template[0] +
    slide[0] +
    '\n\n---\nlayout: false\nclass: end-slide\n\n<div class="end-slide-logo-wrapper">\n    <img class="end-slide-logo" alt="PG Logo" src="/img/pg_logo_white.svg"/>\n</div>\n';
  md = md.replace(/\r\n/g, "\n");

  $("#source").text(md);

  // Create slideshow.
  slideshow = remark.create(
    {
      ratio: "16:9"
    },
    (event) => {
      // Add each slide title (h3 header) as data-title attribute, so it can be used in CSS selectors.
      $(".remark-slide-container").each(function () {
        $(this).attr("data-title", $(this).find("h3").text());
      });

      normalizeSectionSlides();
      wrapSlideBody();
      ensureSlideStructureOrder();
      normalizeMarkdownFootnotes();
      normalizeMarkdownImages();
      groupAutoImagesIntoRows();
      fitAutoImagesToContent();
    }
  );

  // Initialize mermaid diagram engine.
  mermaid.initialize({
    startOnLoad: false,
    cloneCssStyles: false,
    theme: "neutral"
  });

  renderMermaidDiagrams(); // Render mermaid diagram when displaying slide (e.g.: by direct link).
  slideshow.on("afterShowSlide", renderMermaidDiagrams); // Render mermaid diagram when navigating to next slide.
  slideshow.on("afterShowSlide", fitAutoImagesToContent);
  $(window).on("resize", fitAutoImagesToContent);
});

/**
 * Creates link element pointing to slides custom CSS and adds it to DOM.
 */
function appendCustomSlides(path) {
  const base = path.split("/").slice(2, -1).join("/");
  if (base === "") {
    return;
  }

  const customStyles = document.createElement("link");
  customStyles.href = `/css/slides/${base}/styles.css`;
  customStyles.rel = "stylesheet";
  customStyles.type = "text/css";
  document.head.appendChild(customStyles);
}

/**
 * Iterates through all pre elements containing element with mermaid class and replaces them with div elements with
 * mermaid class. Then for each div with mermaid class calls mermaid library init method to render diagram.
 */
function renderMermaidDiagrams() {
  document.querySelectorAll("pre > .mermaid").forEach((diagram) => {
    let diagramText = "";
    $(diagram)
      .children("div")
      .each(function () {
        diagramText += this.innerText + "\n";
      });
    const mermaidDiagram = $('<div class="mermaid"></div>');
    mermaidDiagram.text(diagramText);
    $(diagram).parent().replaceWith(mermaidDiagram);
  });

  document.querySelectorAll(".mermaid").forEach((diagram) => {
    if (diagram.offsetWidth > 0) {
      mermaid.init(undefined, diagram);
    }
  });
}

/**
 * Converts a slide containing only markdown H2 content into a section divider slide.
 */
function normalizeSectionSlides() {
  $(".remark-slide-content").each(function () {
    const slideContent = $(this);

    const contentNodes = slideContent.children().filter(function () {
      const node = $(this);

      if (node.is(".remark-slide-number")) {
        return false;
      }

      if (
        node.is(".logo--horizontal, .logo--full") ||
        node.find(".logo--horizontal, .logo--full").length > 0
      ) {
        return false;
      }

      return true;
    });

    if (contentNodes.length !== 1) {
      slideContent.removeClass("section-slide");
      return;
    }

    const onlyContentNode = contentNodes.first();

    if (onlyContentNode.is("h2")) {
      const section = $('<div class="section"></div>');
      onlyContentNode.replaceWith(section);
      onlyContentNode.appendTo(section);
    }

    const isSectionSlide =
      onlyContentNode.is("h2") ||
      (onlyContentNode.is(".section") &&
        onlyContentNode.children("h2").length === 1);

    slideContent.toggleClass("section-slide", isSectionSlide);
  });
}

/**
 * Wraps slide body content into dedicated container, excluding logo, headings and slide number.
 */
function wrapSlideBody() {
  $(".remark-slide-content").each(function () {
    const slideContent = $(this);

    if (
      slideContent.children(".slide-body").length > 0 &&
      slideContent.children(".slide-header").length > 0
    ) {
      return;
    }

    if (slideContent.children(".slide-header").length === 0) {
      const header = $('<div class="slide-header"></div>');
      const headerNodes = slideContent.children().filter(function () {
        const node = $(this);
        return (
          node.is(HEADER_NODE_SELECTOR) ||
          node.find(".logo--horizontal, .logo--full").length > 0
        );
      });

      if (headerNodes.length > 0) {
        headerNodes.appendTo(header);
        header.prependTo(slideContent);
      }
    }

    if (slideContent.children(".slide-body").length > 0) {
      return;
    }

    const body = $('<div class="slide-body"></div>');
    const bodyNodes = slideContent.children().filter(function () {
      return !$(this).is(BODY_EXCLUDED_SELECTOR);
    });

    if (bodyNodes.length === 0) {
      return;
    }

    const bodyContent = $('<div class="slide-body-content"></div>');
    bodyNodes.appendTo(bodyContent);
    bodyContent.appendTo(body);
    body.appendTo(slideContent);
  });
}

/**
 * Ensures slide main blocks are ordered as: header, body, slide number.
 */
function ensureSlideStructureOrder() {
  $(".remark-slide-content").each(function () {
    const slideContent = $(this);
    [".slide-header", ".slide-body", ".remark-slide-number"].forEach(
      (selector) => {
        const element = slideContent.children(selector);
        if (element.length > 0) {
          element.appendTo(slideContent);
        }
      }
    );
  });
}

/**
 * Converts markdown-like footnotes ([^id] and [^id]: text) into rendered footnote references and a notes block.
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
      item.textContent = note.text;
      notesList.appendChild(item);
    });

    notesContainer.appendChild(notesList);
    slideBody.appendChild(notesContainer);
  });
}

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
 * Converts standalone markdown images into figure elements with optional figcaption generated from alt text.
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

        if ($.trim(paragraph.text()).length > 0) {
          return;
        }

        const figure = $('<figure class="auto-image"></figure>');
        const caption = (image.attr("alt") || "").trim();

        image.appendTo(figure);

        if (caption.length > 0) {
          $("<figcaption></figcaption>").text(caption).appendTo(figure);
        }

        paragraph.replaceWith(figure);
      });
  });
}

/**
 * Groups consecutive auto image figures into horizontal rows.
 */
function groupAutoImagesIntoRows() {
  $(".slide-body-content").each(function () {
    const bodyContent = this;
    const children = Array.from(bodyContent.children);
    let index = 0;

    while (index < children.length) {
      if (!children[index].matches("figure.auto-image")) {
        index += 1;
        continue;
      }

      const run = [];
      while (
        index < children.length &&
        children[index].matches("figure.auto-image")
      ) {
        run.push(children[index]);
        index += 1;
      }

      if (run.length <= 1) {
        continue;
      }

      const row = document.createElement("div");
      row.className = "auto-image-row";
      run[0].before(row);
      run.forEach((figure) => row.appendChild(figure));
    }
  });
}

/**
 * Fits auto-generated markdown images to free vertical space in a slide body, so they don't overlap heading area
 * and shrink when additional text is present.
 */
function fitAutoImagesToContent() {
  $(".slide-body-content").each(function () {
    const bodyContent = this;
    const body = bodyContent.closest(".slide-body");
    if (!body) {
      return;
    }

    const figures = bodyContent.querySelectorAll(AUTO_IMAGE_SELECTOR);
    if (figures.length === 0) {
      return;
    }

    const safeContentHeight = Math.max(
      120,
      bodyContent.clientHeight || body.clientHeight
    );

    const nonFigureHeight = Array.from(bodyContent.children)
      .filter(
        (node) =>
          !node.matches(`${AUTO_IMAGE_SELECTOR}, ${AUTO_IMAGE_ROW_SELECTOR}`)
      )
      .reduce((sum, node) => sum + getOuterHeightWithMargins(node), 0);

    const standaloneFigures = Array.from(bodyContent.children).filter((node) =>
      node.matches(AUTO_IMAGE_SELECTOR)
    );
    const rows = Array.from(bodyContent.children).filter((node) =>
      node.matches(AUTO_IMAGE_ROW_SELECTOR)
    );
    const imageContainers = [...standaloneFigures, ...rows];
    const containerCount = imageContainers.length;
    if (containerCount === 0) {
      return;
    }

    const availableForImages = Math.max(
      100,
      safeContentHeight - nonFigureHeight - 12
    );
    const perContainerHeight = Math.max(
      100,
      Math.floor(availableForImages / containerCount)
    );

    standaloneFigures.forEach((figure) => {
      applyFigureImageMaxHeight(figure, perContainerHeight);
    });

    rows.forEach((row) =>
      row
        .querySelectorAll(AUTO_IMAGE_SELECTOR)
        .forEach((figure) =>
          applyFigureImageMaxHeight(figure, perContainerHeight)
        )
    );
  });
}

function applyFigureImageMaxHeight(figure, containerHeight) {
  const image = figure.querySelector("img");
  if (!image) {
    return;
  }

  const caption = figure.querySelector("figcaption");
  const captionHeight = caption ? getOuterHeightWithMargins(caption) : 0;
  const figureVerticalMargins = getVerticalMargins(figure);
  const maxImageHeight = Math.max(
    90,
    containerHeight - captionHeight - figureVerticalMargins - 8
  );

  image.style.maxHeight = `${maxImageHeight}px`;
}

function getOuterHeightWithMargins(element) {
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return element.getBoundingClientRect().height + marginTop + marginBottom;
}

function getVerticalMargins(element) {
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return marginTop + marginBottom;
}
