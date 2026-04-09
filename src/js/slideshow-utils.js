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

Object.assign(window, {
  appendCustomSlides,
  renderMathFormulas
});
