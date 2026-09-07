let slideshow;

const slides = window.location.pathname;
const END_SLIDE_DISABLED_TAG = "<!-- no-end-slide -->";
const END_SLIDE_MARKDOWN =
  "\n\n---\nlayout: false\nclass: end-slide\n\n" +
  "<div class=\"end-slide-logo-wrapper\">\n" +
  "<img class=\"end-slide-logo\" " +
  "alt=\"PG Logo\" src=\"/img/pg_logo_white.svg\"/>\n" +
  "</div>\n";

function splitMarkdownSlides(markdown) {
  const normalizedMarkdown = (markdown || "").replace(/\r\n/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  const markdownSlides = [];
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
      markdownSlides.push(currentSlideLines.join("\n"));
      currentSlideLines.length = 0;
      return;
    }

    currentSlideLines.push(line);
  });

  markdownSlides.push(currentSlideLines.join("\n"));

  return markdownSlides;
}

function hasEndSlideDisabledTagInMarkdown(markdown) {
  const markdownSlides = splitMarkdownSlides(markdown);

  if (markdownSlides.length === 0) {
    return false;
  }

  return markdownSlides[0].includes(END_SLIDE_DISABLED_TAG);
}

if (slides === "/") {
  window.location.replace("/slides/Materials.md");
}

window.appendCustomSlides(slides);

const slidesRequest = $.ajax({
  url: slides,
  type: "GET",
  headers: {
    Accept: "text/markdown"
  }
}).fail(function () {
  alert(
    "Markdown file not found. " +
      "Please check if the file exists " +
      "and the path is correct."
  );
});

const templateRequest = $.ajax({
  url: "/md/template.md",
  type: "GET",
  headers: {
    Accept: "text/markdown"
  }
});

$.when(slidesRequest, templateRequest).done(function (slide, template) {
  const slideMarkdown = slide[0].replace(/\r\n/g, "\n");
  const shouldAppendEndSlide = !hasEndSlideDisabledTagInMarkdown(slideMarkdown);
  let md = template[0] + slideMarkdown;

  if (shouldAppendEndSlide) {
    md += END_SLIDE_MARKDOWN;
  }

  md = md.replace(/\r\n/g, "\n");

  md = window.generateAgenda(md);

  if (typeof window.setDynamicTextEnabledState === "function") {
    const dynamicTextEnabled =
      typeof window.hasDynamicTextTagInMarkdown === "function" &&
      window.hasDynamicTextTagInMarkdown(md);
    window.setDynamicTextEnabledState(dynamicTextEnabled);
  }

  $("#source").text(md);

  slideshow = remark.create(
    {
      ratio: "16:9"
    },
    () => {
      window.normalizeSectionSlides();
      window.wrapSlideBody();
      window.ensureSlideStructureOrder();
      window.prepareSlideTitles();
      window.prepareAgendaPdfAnchors();
      window.bindAgendaNavigationLinks();
      window.injectTitleSlideDate();
      window.normalizeMarkdownFootnotes();
      window.normalizeMarkdownImages();
      window.fixHangingShortWords();
      window.groupAutoImagesIntoRows();
      window.restructureImageLayoutSlides();
      window.fitAutoImagesToContent();
      if (
        typeof window.applyDynamicSlideTypographyAndAlignment === "function"
      ) {
        window.applyDynamicSlideTypographyAndAlignment();
      }
    }
  );

  mermaid.initialize({
    startOnLoad: false,
    cloneCssStyles: false,
    theme: "neutral"
  });

  function refreshCurrentSlideLayout() {
    window.fitAutoImagesToContent();
    if (typeof window.applyDynamicSlideTypographyAndAlignment === "function") {
      window.applyDynamicSlideTypographyAndAlignment();
    }
  }

  window.renderMermaidDiagrams();
  window.renderMathFormulas();
  slideshow.on("afterShowSlide", window.renderMermaidDiagrams);
  slideshow.on("afterShowSlide", window.renderMathFormulas);
  if (typeof window.syncAgendaNavigationLinksForVisibleSlide === "function") {
    slideshow.on(
      "afterShowSlide",
      window.syncAgendaNavigationLinksForVisibleSlide
    );
  }
  slideshow.on("afterShowSlide", refreshCurrentSlideLayout);

  requestAnimationFrame(() => {
    refreshCurrentSlideLayout();
    setTimeout(refreshCurrentSlideLayout, 50);
    setTimeout(refreshCurrentSlideLayout, 200);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      requestAnimationFrame(refreshCurrentSlideLayout);
    });
  }

  window.addEventListener("load", () => {
    requestAnimationFrame(refreshCurrentSlideLayout);
  });

  $(".slide-img img").on("load", () => {
    requestAnimationFrame(refreshCurrentSlideLayout);
  });
});
