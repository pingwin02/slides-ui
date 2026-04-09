const HEADER_NODE_SELECTOR = "h1, h2, h3, .logo--horizontal, .logo--full";
const BODY_EXCLUDED_SELECTOR =
  ".slide-header, .remark-slide-number, .slide-body";

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
 * Converts a slide containing only markdown H2 content
 * into a section divider slide.
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
      const section = $("<div class=\"section\"></div>");
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
 * Wraps slide body content into dedicated container,
 * excluding logo, headings and slide number.
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
      const header = $("<div class=\"slide-header\"></div>");
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

    const body = $("<div class=\"slide-body\"></div>");
    const bodyNodes = slideContent.children().filter(function () {
      return !$(this).is(BODY_EXCLUDED_SELECTOR);
    });

    if (bodyNodes.length === 0) {
      return;
    }

    const bodyContent = $("<div class=\"slide-body-content\"></div>");
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

Object.assign(window, {
  isEndSlideContent,
  normalizeSectionSlides,
  wrapSlideBody,
  ensureSlideStructureOrder
});
