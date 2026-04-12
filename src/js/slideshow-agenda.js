/**
 * Generates automatic agenda slide from slide headers.
 * Can be controlled with HTML comments on title slide:
 * - no tag: disabled by default
 * - \<!-- agenda --> to enable with sections and slide titles
 * - \<!-- agenda-sections --> to enable with sections only
 *
 * Ignores headings inside fenced code blocks and balances
 * agenda columns by estimated slide height.
 */
function generateAgenda(markdown) {
  const slides = splitMarkdownSlides(markdown);

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

  const entries = [];
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

    const heading = getFirstMarkdownHeading(slide);
    if (!heading) {
      continue;
    }

    if (heading.level === 2) {
      currentSection = {
        text: heading.text,
        slideNumber: slideNumber,
        subItems: []
      };
      entries.push(currentSection);
      continue;
    }

    if (heading.level === 3) {
      if (heading.text === "!" || heading.text.startsWith("!")) {
        continue;
      }

      if (hasAgendaSections) {
        continue;
      }

      if (hasAgenda && currentSection) {
        currentSection.subItems.push({
          text: heading.text,
          slideNumber: slideNumber
        });
        continue;
      }

      entries.push({
        text: heading.text,
        slideNumber: slideNumber,
        subItems: []
      });
    }
  }

  if (entries.length === 0) {
    return markdown;
  }

  const totalLines = entries.reduce((count, section) => {
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
    const columns = splitAgendaEntriesIntoColumns(entries, columnCount);

    columns.forEach((columnEntries, col) => {
      const startIdx = columns
        .slice(0, col)
        .reduce((sum, column) => sum + column.length, 0);

      if (col > 0) {
        agendaSlide += "\n";
      }
      agendaSlide += ".agenda-column[\n<ol";

      if (col > 0 && startIdx > 0) {
        agendaSlide += ` start="${startIdx + 1}"`;
      }
      agendaSlide += ">\n";

      columnEntries.forEach((section) => {
        agendaSlide +=
          `<li><a href="#slide-${section.slideNumber}">` +
          `${section.text}</a>`;
        if (section.subItems.length > 0) {
          agendaSlide += "\n<ul>\n";
          section.subItems.forEach((item) => {
            agendaSlide +=
              `<li><a href="#slide-${item.slideNumber}">` +
              `${item.text}</a></li>\n`;
          });
          agendaSlide += "</ul>\n";
        }
        agendaSlide += "</li>\n";
      });

      agendaSlide += "</ol>\n]";
    });
  } else {
    agendaSlide += "<ol>\n";
    entries.forEach((section) => {
      agendaSlide +=
        `<li><a href="#slide-${section.slideNumber}">` + `${section.text}</a>`;
      if (section.subItems.length > 0) {
        agendaSlide += "\n<ul>\n";
        section.subItems.forEach((item) => {
          agendaSlide +=
            `<li><a href="#slide-${item.slideNumber}">` +
            `${item.text}</a></li>\n`;
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
 * Splits markdown into slides while ignoring separators
 * inside fenced code blocks.
 */
function splitMarkdownSlides(markdown) {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  const slides = [];
  const currentSlideLines = [];
  let fenceMarker = "";
  let fenceLength = 0;

  lines.forEach((line) => {
    const fenceMatch = line.match(/^\s*([`~]{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      const markerLength = fenceMatch[1].length;
      if (!fenceMarker) {
        fenceMarker = marker;
        fenceLength = markerLength;
      } else if (marker === fenceMarker && markerLength >= fenceLength) {
        fenceMarker = "";
        fenceLength = 0;
      }
      currentSlideLines.push(line);
      return;
    }

    if (!fenceMarker && /^\s*---\s*$/.test(line)) {
      slides.push(currentSlideLines.join("\n"));
      currentSlideLines.length = 0;
      return;
    }

    currentSlideLines.push(line);
  });

  slides.push(currentSlideLines.join("\n"));

  return slides;
}

/**
 * Returns the first markdown H2 or H3 heading outside fenced code blocks.
 */
function getFirstMarkdownHeading(slide) {
  const lines = slide.replace(/\r\n/g, "\n").split("\n");
  let fenceMarker = "";
  let fenceLength = 0;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*([`~]{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      const markerLength = fenceMatch[1].length;
      if (!fenceMarker) {
        fenceMarker = marker;
        fenceLength = markerLength;
      } else if (marker === fenceMarker && markerLength >= fenceLength) {
        fenceMarker = "";
        fenceLength = 0;
      }
      continue;
    }

    if (fenceMarker) {
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      return { level: 2, text: h2Match[1].trim() };
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      return { level: 3, text: h3Match[1].trim() };
    }
  }

  return null;
}

/**
 * Balances agenda entries across columns using estimated item weights.
 */
function splitAgendaEntriesIntoColumns(entries, columnCount) {
  const safeColumnCount = Math.min(columnCount, entries.length);
  if (safeColumnCount <= 1) {
    return [entries];
  }

  const weights = entries.map((entry) => 1 + entry.subItems.length);
  const prefixWeights = [0];
  weights.forEach((weight) => {
    prefixWeights.push(prefixWeights[prefixWeights.length - 1] + weight);
  });

  const totalWeight = prefixWeights[prefixWeights.length - 1];
  const targetWeight = totalWeight / safeColumnCount;
  const entryCount = entries.length;
  const dp = Array.from({ length: safeColumnCount + 1 }, () =>
    Array(entryCount + 1).fill(Number.POSITIVE_INFINITY)
  );
  const previous = Array.from({ length: safeColumnCount + 1 }, () =>
    Array(entryCount + 1).fill(-1)
  );

  dp[0][0] = 0;

  for (let columnIndex = 1; columnIndex <= safeColumnCount; columnIndex += 1) {
    for (
      let entryIndex = columnIndex;
      entryIndex <= entryCount;
      entryIndex += 1
    ) {
      for (
        let splitIndex = columnIndex - 1;
        splitIndex < entryIndex;
        splitIndex += 1
      ) {
        if (dp[columnIndex - 1][splitIndex] === Number.POSITIVE_INFINITY) {
          continue;
        }

        const chunkWeight =
          prefixWeights[entryIndex] - prefixWeights[splitIndex];
        const cost =
          dp[columnIndex - 1][splitIndex] +
          Math.pow(chunkWeight - targetWeight, 2);

        if (cost < dp[columnIndex][entryIndex]) {
          dp[columnIndex][entryIndex] = cost;
          previous[columnIndex][entryIndex] = splitIndex;
        }
      }
    }
  }

  const columns = [];
  let entryIndex = entryCount;

  for (let columnIndex = safeColumnCount; columnIndex > 0; columnIndex -= 1) {
    const splitIndex = previous[columnIndex][entryIndex];
    const startIndex = splitIndex < 0 ? 0 : splitIndex;
    columns.unshift(entries.slice(startIndex, entryIndex));
    entryIndex = startIndex;
  }

  return columns.filter((column) => column.length > 0);
}

/**
 * Adds in-document anchors for slide numbers.
 */
function prepareAgendaPdfAnchors() {
  const slideContents = $(".remark-slide-content")
    .toArray()
    .filter((slideNode) => !window.isEndSlideContent(slideNode));

  if (slideContents.length === 0) {
    return;
  }

  slideContents.forEach((slideNode) => {
    $(slideNode).children("a.agenda-slide-anchor").remove();
  });

  const anchoredNumbers = new Set();

  slideContents.forEach((slideNode) => {
    const slideContent = $(slideNode);
    const slideNumberText = (
      slideContent.children(".remark-slide-number").first().text() || ""
    ).trim();
    const match = slideNumberText.match(/^(\d+)\s*\/\s*\d+$/);

    if (!match) {
      return;
    }

    const slideNumber = match[1];
    if (anchoredNumbers.has(slideNumber)) {
      return;
    }
    anchoredNumbers.add(slideNumber);

    const anchor = $("<a></a>");
    anchor.addClass("agenda-slide-anchor");
    anchor.attr("aria-hidden", "true");
    anchor.attr("id", `slide-${slideNumber}`);
    anchor.attr("name", `slide-${slideNumber}`);
    slideContent.prepend(anchor);
  });
}

/**
 * Keeps browser navigation compatible with remark while preserving
 * PDF-friendly `#slide-N` anchors in generated agenda markup.
 */
function bindAgendaNavigationLinks() {
  const targetLinksSelector =
    ".agenda-column a[data-slide-target], " +
    ".slide-body-content a[data-slide-target]";

  const selector =
    ".agenda-column a[href^='#slide-'], " +
    ".slide-body-content a[href^='#slide-'], " +
    targetLinksSelector;

  $(selector).each(function () {
    const link = $(this);
    const href = (link.attr("href") || "").trim();
    const currentTarget = (link.attr("data-slide-target") || "").trim();

    let slideNumber = "";
    const hrefMatch = href.match(/^#slide-(\d+)$/);
    if (hrefMatch) {
      slideNumber = hrefMatch[1];
    } else if (/^\d+$/.test(currentTarget)) {
      slideNumber = currentTarget;
    }

    if (!slideNumber) {
      return;
    }

    link.attr("data-slide-target", slideNumber);
    link.removeAttr("href");
  });

  syncAgendaNavigationLinksForVisibleSlide();

  $(targetLinksSelector)
    .off("click.agenda-navigation")
    .on("click.agenda-navigation", function (event) {
      const slideNumber = ($(this).attr("data-slide-target") || "").trim();

      if (!/^\d+$/.test(slideNumber)) {
        return;
      }

      event.preventDefault();
      window.location.hash = `#${slideNumber}`;
    });
}

/**
 * Enables PDF anchor href only on currently visible slide links
 * to avoid duplicated annotations from hidden previous/next slides.
 */
function syncAgendaNavigationLinksForVisibleSlide() {
  const targetLinksSelector =
    ".agenda-column a[data-slide-target], " +
    ".slide-body-content a[data-slide-target]";
  const allLinks = $(targetLinksSelector);

  if (allLinks.length === 0) {
    return;
  }

  allLinks.removeAttr("href");

  $(
    ".remark-visible .agenda-column a[data-slide-target], " +
      ".remark-visible .slide-body-content a[data-slide-target]"
  ).each(function () {
    const slideNumber = ($(this).attr("data-slide-target") || "").trim();
    if (!/^\d+$/.test(slideNumber)) {
      return;
    }

    $(this).attr("href", `#slide-${slideNumber}`);
  });
}

Object.assign(window, {
  generateAgenda,
  prepareAgendaPdfAnchors,
  bindAgendaNavigationLinks,
  syncAgendaNavigationLinksForVisibleSlide
});
