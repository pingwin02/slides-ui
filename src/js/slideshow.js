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

  md = generateAgenda(md);

  $("#source").text(md);

  // Create slideshow.
  slideshow = remark.create(
    {
      ratio: "16:9"
    },
    (event) => {
      normalizeSectionSlides();
      wrapSlideBody();
      ensureSlideStructureOrder();
      prepareSlideTitles();
      injectTitleSlideDate();
      normalizeMarkdownFootnotes();
      normalizeMarkdownImages();
      groupAutoImagesIntoRows();
      restructureImageLayoutSlides();
      fitAutoImagesToContent();
      reorderImgTopSlides();
      openLinksInNewTab();
    }
  );

  // Initialize mermaid diagram engine.
  mermaid.initialize({
    startOnLoad: false,
    cloneCssStyles: false,
    theme: "neutral"
  });

  renderMermaidDiagrams(); // Render mermaid diagram when displaying slide (e.g.: by direct link).
  renderMathFormulas();
  slideshow.on("afterShowSlide", renderMermaidDiagrams); // Render mermaid diagram when navigating to next slide.
  slideshow.on("afterShowSlide", renderMathFormulas);
  slideshow.on("afterShowSlide", prepareSlideTitles);
  slideshow.on("afterShowSlide", injectTitleSlideDate);
  slideshow.on("afterShowSlide", fitAutoImagesToContent);
  slideshow.on("afterShowSlide", reorderImgTopSlides);
  $(window).on("resize", fitMermaidDiagramsToContent);
  $(window).on("resize", fitAutoImagesToContent);
  $(window).on("resize", reorderImgTopSlides);
});

/**
 * Renders LaTeX math in slide content using KaTeX auto-render.
 * Supports inline `$...$` and block `$$...$$` delimiters.
 */
function renderMathFormulas() {
  if (typeof renderMathInElement !== "function") {
    return;
  }

  document
    .querySelectorAll(".remark-visible .remark-slide-content")
    .forEach((slideContent) => {
      renderMathInElement(slideContent, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        throwOnError: false,
        strict: "ignore"
      });
    });
}

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
 * Generates automatic agenda slide from slide headers.
 * Can be controlled with HTML comments on title slide:
 * - no tag: disabled by default
 * - <!-- agenda --> to enable with sections and slide titles
 * - <!-- agenda-sections --> to enable with sections only
 * Automatically splits into two columns if there are many items.
 */
function generateAgenda(markdown) {
  const slides = markdown.split(/\n---\n/);

  if (slides.length < 3) {
    return markdown;
  }

  const titleSlide = slides[1];
  const hasAgenda = titleSlide.includes("<!-- agenda -->");
  const hasAgendaSections = titleSlide.includes("<!-- agenda-sections -->");

  if (!hasAgenda && !hasAgendaSections) {
    return markdown;
  }

  if (markdown.match(/^###?\s+Agenda\s*$/im)) {
    return markdown;
  }

  const sections = [];
  let currentSection = null;

  for (let i = 2; i < slides.length; i++) {
    const slide = slides[i];
    const slideNumber = i + 1;

    if (
      slide.includes("class: end-slide") ||
      slide.includes("end-slide-logo")
    ) {
      continue;
    }

    const h2Match = slide.match(/^##\s+(.+)$/m);
    if (h2Match) {
      const headerText = h2Match[1].trim();
      currentSection = {
        text: headerText,
        slideNumber: slideNumber,
        subItems: []
      };
      sections.push(currentSection);
      continue;
    }

    if (hasAgenda && currentSection) {
      const h3Match = slide.match(/^###\s+(.+)$/m);
      if (h3Match) {
        const headerText = h3Match[1].trim();
        if (headerText !== "!" && !headerText.startsWith("!")) {
          currentSection.subItems.push({
            text: headerText,
            slideNumber: slideNumber
          });
        }
      }
    }
  }

  if (sections.length === 0) {
    return markdown;
  }

  const totalLines = sections.reduce((count, section) => {
    return count + 1 + section.subItems.length;
  }, 0);

  let columnCount = 1;
  if (totalLines > 48) {
    columnCount = 3;
  } else if (totalLines > 24) {
    columnCount = 2;
  }

  let agendaSlide = `class: agenda-columns-${columnCount}\n\n### Agenda\n\n`;

  if (columnCount > 1) {
    const sectionsPerColumn = Math.ceil(sections.length / columnCount);

    for (let col = 0; col < columnCount; col++) {
      const startIdx = col * sectionsPerColumn;
      const endIdx = Math.min((col + 1) * sectionsPerColumn, sections.length);
      const columnSections = sections.slice(startIdx, endIdx);

      if (col > 0) {
        agendaSlide += "\n";
      }
      agendaSlide += ".agenda-column[\n<ol";

      if (col > 0 && startIdx > 0) {
        agendaSlide += ` start="${startIdx + 1}"`;
      }
      agendaSlide += ">\n";

      columnSections.forEach((section) => {
        agendaSlide += `<li><a href="#${section.slideNumber}">${section.text}</a>`;
        if (section.subItems.length > 0) {
          agendaSlide += "\n<ul>\n";
          section.subItems.forEach((item) => {
            agendaSlide += `<li><a href="#${item.slideNumber}">${item.text}</a></li>\n`;
          });
          agendaSlide += "</ul>\n";
        }
        agendaSlide += "</li>\n";
      });

      agendaSlide += "</ol>\n]";
    }
  } else {
    agendaSlide += "<ol>\n";
    sections.forEach((section) => {
      agendaSlide += `<li><a href="#${section.slideNumber}">${section.text}</a>`;
      if (section.subItems.length > 0) {
        agendaSlide += "\n<ul>\n";
        section.subItems.forEach((item) => {
          agendaSlide += `<li><a href="#${item.slideNumber}">${item.text}</a></li>\n`;
        });
        agendaSlide += "</ul>\n";
      }
      agendaSlide += "</li>\n";
    });
    agendaSlide += "</ol>";
  }

  slides.splice(2, 0, agendaSlide.trim());

  return slides.join("\n---\n");
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
    mermaidDiagram.attr("data-mermaid-source", diagramText);
    mermaidDiagram.text(diagramText);
    $(diagram).parent().replaceWith(mermaidDiagram);
  });

  const visibleDiagrams = Array.from(
    document.querySelectorAll(".remark-visible .mermaid")
  );

  if (visibleDiagrams.length === 0) {
    fitMermaidDiagramsToContent();
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
    fitMermaidDiagramsToContent();
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
        fitMermaidDiagramsToContent();
      })
      .catch(() => {
        fitMermaidDiagramsToContent();
      });
    return;
  }

  renderableDiagrams.forEach((diagram) => {
    if (diagram.offsetWidth > 0) {
      mermaid.init(undefined, diagram);
      diagram.setAttribute("data-mermaid-rendered", "true");
    }
  });

  fitMermaidDiagramsToContent();
}

/**
 * Returns true if slide content belongs to terminal/end slide.
 */
function isEndSlideContent(slideNode) {
  const slideContent = $(slideNode);
  const slideContainer = slideContent.closest(".remark-slide-container");

  return (
    slideContent.hasClass("end-slide") ||
    slideContainer.hasClass("end-slide") ||
    slideContent.closest(".end-slide").length > 0 ||
    slideContent.find(".end-slide-logo-wrapper, .end-slide-logo").length > 0
  );
}

/**
 * Prepares slide titles in one pass:
 * - supports `### !` as an explicit no-title marker
 * - inherits H3 title across following slides
 * - adds (index/total) counters for repeated contiguous H3 titles
 */
function prepareSlideTitles() {
  const rawSlides = $(".remark-slide-content")
    .toArray()
    .filter((slideNode) => !isEndSlideContent(slideNode));
  if (rawSlides.length === 0) {
    return;
  }

  const getTitleNode = (slideContent) => {
    const titleFromHeader = slideContent
      .children(".slide-header")
      .children("h3")
      .first();
    return titleFromHeader.length > 0
      ? titleFromHeader
      : slideContent.children("h3").first();
  };

  const getSlideNumber = (slideContent) => {
    const text = (
      slideContent.children(".remark-slide-number").first().text() || ""
    ).trim();
    const match = text.match(/^(\d+)\s*\/\s*\d+$/);
    return match ? Number(match[1]) : null;
  };

  const bySlideNumber = new Map();
  const groups = [];
  rawSlides.forEach((slideNode) => {
    const slideContent = $(slideNode);
    const slideNumber = getSlideNumber(slideContent);
    const existingGroup =
      slideNumber === null ? null : bySlideNumber.get(slideNumber);

    if (existingGroup) {
      existingGroup.members.push(slideNode);
      return;
    }

    const group = { representative: slideNode, members: [slideNode] };
    groups.push(group);
    if (slideNumber !== null) {
      bySlideNumber.set(slideNumber, group);
    }
  });

  const slides = groups.map((group) => group.representative);
  const groupByRepresentative = new Map(
    groups.map((group) => [group.representative, group])
  );

  const forEachGroupMember = (slideNode, callback) => {
    const group = groupByRepresentative.get(slideNode);
    if (!group) {
      callback(slideNode);
      return;
    }
    group.members.forEach((member) => callback(member));
  };

  const clearInjectedTitles = (slideNode) => {
    forEachGroupMember(slideNode, (memberNode) => {
      const slideContent = $(memberNode);
      slideContent.find("h3.slide-title-inherited").remove();
      slideContent.find(".slide-title-counter").remove();
    });
  };

  const setNoTitleOverride = (slideNode, enabled) => {
    forEachGroupMember(slideNode, (memberNode) => {
      const memberContent = $(memberNode);
      if (enabled) {
        memberContent.attr("data-no-title-override", "true");
      } else {
        memberContent.removeAttr("data-no-title-override");
      }
    });
  };

  const setDataTitle = (slideNode, title) => {
    forEachGroupMember(slideNode, (memberNode) => {
      const container = $(memberNode).closest(".remark-slide-container");
      if ((title || "").length > 0) {
        container.attr("data-title", title);
      } else {
        container.removeAttr("data-title");
      }
    });
  };

  const appendInheritedTitle = (slideNode, title) => {
    forEachGroupMember(slideNode, (memberNode) => {
      const memberContent = $(memberNode);
      const inheritedHeading = $(
        '<h3 class="slide-title-inherited"></h3>'
      ).text(title);
      const header = memberContent.children(".slide-header");
      if (header.length > 0) {
        inheritedHeading.appendTo(header);
      } else {
        inheritedHeading.appendTo(memberContent);
      }
    });
    setDataTitle(slideNode, title);
  };

  const getFallbackTitle = (slideContent) => {
    return (
      slideContent.children("h2, h1").first().text() ||
      slideContent
        .children(".slide-header")
        .children("h2, h1")
        .first()
        .text() ||
      ""
    ).trim();
  };

  slides.forEach(clearInjectedTitles);

  let activeSectionTitle = "";

  slides.forEach((slideNode) => {
    const slideContent = $(slideNode);
    const titleNode = getTitleNode(slideContent);
    const currentTitle = (titleNode.text() || "").trim();

    if (slideContent.attr("data-no-title-override") === "true") {
      setDataTitle(slideNode, "");
      return;
    }

    const isSectionDivider =
      slideContent.hasClass("section-slide") ||
      slideContent.find(".slide-body-content > .section > h2").length > 0;
    if (isSectionDivider) {
      setNoTitleOverride(slideNode, false);
      activeSectionTitle = "";
      const sectionTitle = (
        slideContent
          .find(".slide-body-content > .section > h2")
          .first()
          .text() || ""
      ).trim();
      setDataTitle(slideNode, sectionTitle);
      return;
    }

    if (currentTitle === "!") {
      setNoTitleOverride(slideNode, true);
      forEachGroupMember(slideNode, (memberNode) => {
        getTitleNode($(memberNode)).remove();
      });
      setDataTitle(slideNode, "");
      return;
    }

    if (currentTitle.length > 0) {
      setNoTitleOverride(slideNode, false);
      activeSectionTitle = currentTitle;
      setDataTitle(slideNode, currentTitle);
      return;
    }

    const hasTopLevelSectionHeading =
      slideContent.children("h1, h2, .section").length > 0 ||
      slideContent.children(".slide-header").children("h1, h2").length > 0;
    if (hasTopLevelSectionHeading) {
      setNoTitleOverride(slideNode, false);
      activeSectionTitle = "";
      setDataTitle(slideNode, getFallbackTitle(slideContent));
      return;
    }

    if (activeSectionTitle.length > 0) {
      setNoTitleOverride(slideNode, false);
      appendInheritedTitle(slideNode, activeSectionTitle);
      return;
    }

    setDataTitle(slideNode, "");
    setNoTitleOverride(slideNode, false);
  });

  slides.forEach((slideNode) => {
    forEachGroupMember(slideNode, (memberNode) => {
      getTitleNode($(memberNode)).find(".slide-title-counter").remove();
    });
  });

  let runStart = 0;
  while (runStart < slides.length) {
    const runTitle = (getTitleNode($(slides[runStart])).text() || "").trim();
    let runEnd = runStart + 1;

    while (runEnd < slides.length) {
      const nextTitle = (getTitleNode($(slides[runEnd])).text() || "").trim();
      if (nextTitle !== runTitle) {
        break;
      }
      runEnd += 1;
    }

    const runLength = runEnd - runStart;
    if (runTitle.length > 0 && runLength > 1) {
      for (let index = runStart; index < runEnd; index += 1) {
        forEachGroupMember(slides[index], (memberNode) => {
          const titleNode = getTitleNode($(memberNode));
          if (titleNode.length === 0) {
            return;
          }

          const counter = document.createElement("span");
          counter.className = "slide-title-counter";
          counter.textContent = ` (${index - runStart + 1}/${runLength})`;
          titleNode.append(counter);
        });
      }
    }

    runStart = runEnd;
  }
}

/**
 * Adds current date to the first (title) slide only.
 * Date is generated dynamically on render and updated idempotently.
 */
function injectTitleSlideDate() {
  const slides = $(".remark-slide-content")
    .toArray()
    .filter((slideNode) => {
      return !isEndSlideContent(slideNode);
    });

  if (slides.length === 0) {
    return;
  }

  const titleSlide = $(slides[0]);
  const titleSlideContainer = titleSlide.closest(".remark-slide-container");
  const header = titleSlide.children(".slide-header").first();
  const hasTitleLayout =
    header.children("h1").length > 0 && header.children("h2").length > 0;
  if (!hasTitleLayout) {
    return;
  }

  const bodyContent = titleSlide
    .children(".slide-body")
    .children(".slide-body-content")
    .first();

  const overrideDate = extractTitleDateOverride(bodyContent);
  const hideDate = overrideDate === "!";

  if (hideDate) {
    titleSlide.children("p.slide-title-date").remove();
    titleSlideContainer.removeClass("has-title-date");
    return;
  }

  titleSlideContainer.addClass("has-title-date");

  const currentDate = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
  const dateText = overrideDate || currentDate;
  let dateNode = titleSlide.children("p.slide-title-date").first();

  if (dateNode.length === 0) {
    dateNode = $('<p class="slide-title-date"></p>');
    titleSlide.append(dateNode);
  }

  dateNode.text(dateText);
}

/**
 * Allows overriding auto date on title slide using:
 * - `Date: <value>`
 * - `Date: !` to hide date
 * - an existing `.slide-title-date` paragraph in slide body.
 */
function extractTitleDateOverride(bodyContent) {
  if (!bodyContent || bodyContent.length === 0) {
    return "";
  }

  const cachedOverride = bodyContent.attr("data-title-date-override");
  if (typeof cachedOverride === "string") {
    return cachedOverride;
  }

  const inlineDateNode = bodyContent.children("p.slide-title-date").first();
  if (inlineDateNode.length > 0) {
    const inlineDate = (inlineDateNode.text() || "").trim();
    inlineDateNode.addClass("slide-title-date-override-source");
    inlineDateNode.hide();
    if (inlineDate.length > 0) {
      bodyContent.attr("data-title-date-override", inlineDate);
      return inlineDate;
    }
  }

  let overrideDate = "";
  bodyContent.children("p").each(function () {
    if (overrideDate.length > 0) {
      return;
    }

    const paragraph = $(this);
    const text = (paragraph.text() || "").trim();
    const match = text.match(/^date\s*:\s*(.+)$/i);
    if (!match) {
      return;
    }

    overrideDate = (match[1] || "").trim();
    paragraph.addClass("slide-title-date-override-source");
    paragraph.hide();
  });

  bodyContent.attr("data-title-date-override", overrideDate);

  return overrideDate;
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
      appendCaptionTextWithLinks($(item), note.text);
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

        if ((paragraph.text() || "").trim().length > 0) {
          return;
        }

        const figure = $('<figure class="auto-image"></figure>');
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

function appendLinkNode(captionNode, label, href) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  captionNode.append(link);
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

    const slideContent = body.closest(".remark-slide-content");
    if (
      slideContent &&
      (slideContent.classList.contains("img-right") ||
        slideContent.classList.contains("img-left"))
    ) {
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

/**
 * Fits Mermaid diagrams to free vertical space in a slide body,
 * similar to how auto-generated markdown images are fitted.
 */
function fitMermaidDiagramsToContent() {
  $(".slide-body-content").each(function () {
    const bodyContent = this;
    const diagrams = Array.from(bodyContent.children).filter((node) =>
      node.matches(".mermaid")
    );

    if (diagrams.length === 0) {
      return;
    }

    const safeContentHeight = Math.max(120, bodyContent.clientHeight);

    const nonDiagramHeight = Array.from(bodyContent.children)
      .filter((node) => !node.matches(".mermaid"))
      .reduce((sum, node) => sum + getOuterHeightWithMargins(node), 0);

    const availableForDiagrams = Math.max(
      100,
      safeContentHeight - nonDiagramHeight - 12
    );
    const perDiagramHeight = Math.max(
      100,
      Math.floor(availableForDiagrams / diagrams.length)
    );

    diagrams.forEach((diagram) => {
      diagram.style.setProperty(
        "--mermaid-max-height",
        `${perDiagramHeight}px`
      );
    });
  });
}

/**
 * Reorders children in img-top slides so that image figures appear before text content.
 * Runs after fitAutoImagesToContent so images are already sized correctly.
 */
function reorderImgTopSlides() {
  $(".remark-slide-content.img-top").each(function () {
    const bodyContent = $(this).find(".slide-body-content");
    if (bodyContent.length === 0) {
      return;
    }

    const children = bodyContent.children();
    const imageNodes = children.filter(function () {
      return $(this).is("figure.auto-image, .auto-image-row");
    });

    if (imageNodes.length === 0) {
      return;
    }

    imageNodes.prependTo(bodyContent);
  });
}

/**
 * Restructures slides with img-right or img-left class by wrapping
 * non-image content in .slide-text and image figures in .slide-img,
 * enabling side-by-side layout via CSS.
 */
function restructureImageLayoutSlides() {
  $(".remark-slide-content").each(function () {
    const slideContent = $(this);
    if (
      !slideContent.hasClass("img-right") &&
      !slideContent.hasClass("img-left")
    ) {
      return;
    }

    const bodyContent = slideContent.find(".slide-body-content");
    if (bodyContent.length === 0) {
      return;
    }

    const children = bodyContent.children();
    const textNodes = children.filter(function () {
      return !$(this).is("figure.auto-image, .auto-image-row");
    });
    const imageNodes = children.filter(function () {
      return $(this).is("figure.auto-image, .auto-image-row");
    });

    if (imageNodes.length === 0) {
      return;
    }

    const textWrapper = $('<div class="slide-text"></div>');
    const imgWrapper = $('<div class="slide-img"></div>');

    textNodes.appendTo(textWrapper);
    imageNodes.appendTo(imgWrapper);

    bodyContent.empty();
    textWrapper.appendTo(bodyContent);
    imgWrapper.appendTo(bodyContent);
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

/**
 * Makes all markdown-rendered links in slides open in a new tab.
 */
function openLinksInNewTab() {
  document.querySelectorAll(".remark-slide-content a").forEach((link) => {
    if (
      !link.getAttribute("href") ||
      link.getAttribute("href").startsWith("#")
    ) {
      return;
    }
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}
