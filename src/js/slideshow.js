let slideshow;

const slides = window.location.pathname;

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
  let md =
    template[0] +
    slide[0] +
    "\n\n---\nlayout: false\nclass: end-slide\n\n" +
    "<div class=\"end-slide-logo-wrapper\">\n" +
    "<img class=\"end-slide-logo\" " +
    "alt=\"PG Logo\" " +
    "src=\"/img/pg_logo_white.svg\"/>\n" +
    "</div>\n";
  md = md.replace(/\r\n/g, "\n");

  md = window.generateAgenda(md);

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
    }
  );

  mermaid.initialize({
    startOnLoad: false,
    cloneCssStyles: false,
    theme: "neutral"
  });

  window.renderMermaidDiagrams();
  window.renderMathFormulas();
  slideshow.on("afterShowSlide", window.renderMermaidDiagrams);
  slideshow.on("afterShowSlide", window.renderMathFormulas);
  slideshow.on("afterShowSlide", window.fitAutoImagesToContent);
});
