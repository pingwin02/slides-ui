/**
 * Prepares slide titles in one pass:
 * - supports `### !` as an explicit no-title marker
 * - inherits H3 title across following slides
 * - adds (index/total) counters for repeated contiguous H3 titles
 */
function prepareSlideTitles() {
  const rawSlides = $(".remark-slide-content")
    .toArray()
    .filter((slideNode) => !window.isEndSlideContent(slideNode));
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
        "<h3 class=\"slide-title-inherited\"></h3>"
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
      const sectionTitle = (
        slideContent
          .find(".slide-body-content > .section > h2")
          .first()
          .text() || ""
      ).trim();
      activeSectionTitle = sectionTitle;
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
        const appendix = ` (${index - runStart + 1}/${runLength})`;
        const numberedTitle = runTitle + appendix;
        setDataTitle(slides[index], numberedTitle);
        forEachGroupMember(slides[index], (memberNode) => {
          const titleNode = getTitleNode($(memberNode));
          if (titleNode.length === 0) {
            return;
          }
          const counter = document.createElement("span");
          counter.className = "slide-title-counter";
          counter.textContent = appendix;
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
      return !window.isEndSlideContent(slideNode);
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
    dateNode = $("<p class=\"slide-title-date\"></p>");
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

Object.assign(window, {
  prepareSlideTitles,
  injectTitleSlideDate,
  extractTitleDateOverride
});
