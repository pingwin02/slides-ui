const AUTO_IMAGE_SELECTOR = "figure.auto-image";
const AUTO_IMAGE_ROW_SELECTOR = ".auto-image-row";

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
 * Fits auto-generated markdown images to free vertical
 * space in a slide body, so they don't overlap heading
 * area and shrink when additional text is present.
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

    const textWrapper = $("<div class=\"slide-text\"></div>");
    const imgWrapper = $("<div class=\"slide-img\"></div>");

    textNodes.appendTo(textWrapper);
    imageNodes.appendTo(imgWrapper);

    bodyContent.empty();
    textWrapper.appendTo(bodyContent);
    imgWrapper.appendTo(bodyContent);
  });
}

/**
 * Scales a figure image to fit the available container height.
 */
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

/**
 * Returns an element height including vertical margins.
 */
function getOuterHeightWithMargins(element) {
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return element.getBoundingClientRect().height + marginTop + marginBottom;
}

/**
 * Returns the combined vertical margins of an element.
 */
function getVerticalMargins(element) {
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return marginTop + marginBottom;
}

Object.assign(window, {
  groupAutoImagesIntoRows,
  fitAutoImagesToContent,
  fitMermaidDiagramsToContent,
  restructureImageLayoutSlides,
  applyFigureImageMaxHeight,
  getOuterHeightWithMargins,
  getVerticalMargins
});
