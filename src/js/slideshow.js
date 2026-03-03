let slideshow;

let slides = window.location.pathname;

if (slides === '/') {
    window.location.replace('/slides/Materials.md');
}

appendCustomSlides(slides);

// Fetch markdown slides.
let slidesRequest = $.ajax({
    url: slides,
    type: 'GET',
    headers: {
        'Accept': 'text/markdown'
    }
}).fail(function () {
    alert("Markdown file not found. Please check if the file exists and the path is correct.");
});

// Fetch slides template.
let templateRequest = $.ajax({
    url: '/md/template.md',
    type: 'GET',
    headers: {
        'Accept': 'text/markdown'
    }
});

$.when(slidesRequest, templateRequest).done(function (slide, template) {
    // Markdown source is made with template and appended slides source.
    let md = template[0] + slide[0] + '\n\n---\nlayout: false\nclass: end-slide\n\n<div class="end-slide-logo-wrapper">\n    <img class="end-slide-logo" alt="PG Logo" src="/img/pg_logo_white.svg"/>\n</div>\n';
    md = md.replace(/\r\n/g, '\n');

    $('#source').text(md);

    // Create slideshow.
    slideshow = remark.create({
        ratio: "16:9"
    }, event => {
        // Add each slide title (h3 header) as data-title attribute, so it can be used in CSS selectors.
        $('.remark-slide-container').each(function () {
            $(this).attr('data-title', $(this).find('h3').text());
        });

        wrapSlideBody();
    });

    // Initialize mermaid diagram engine.
    mermaid.initialize({
        startOnLoad: false,
        cloneCssStyles: false,
        theme: 'neutral'
    });

    renderMermaidDiagrams(); // Render mermaid diagram when displaying slide (e.g.: by direct link).
    slideshow.on('afterShowSlide', renderMermaidDiagrams); // Render mermaid diagram when navigating to next slide.
});

/**
 * Creates link element pointing to slides custom CSS and adds it to DOM.
 */
function appendCustomSlides(path) {
    let customStyles = document.createElement('link');
    const base = path.split('/').slice(2, -1).join('/');
    if (base != '') {
        customStyles.href = `/css/slides/${base}/styles.css`;
        customStyles.rel = 'stylesheet';
        customStyles.type = 'text/css';
        document.head.appendChild(customStyles);
    }
}

/**
 * Iterates through all pre elements containing element with mermaid class and replaces them with div elements with
 * mermaid class. Then for each div with mermaid class calls mermaid library init method to render diagram.
 */
function renderMermaidDiagrams() {
    let diagrams = document.querySelectorAll('pre > .mermaid');
    for (let i = 0; i < diagrams.length; i++) {
        let diagramText = '';
        $(diagrams[i]).children('div').each(function () {
            diagramText += this.innerText + '\n'
        });
        let mermaidDiagram = $('<div class="mermaid"></div>');
        mermaidDiagram.text(diagramText);
        $(diagrams[i]).parent().replaceWith(mermaidDiagram);
    }

    diagrams = document.querySelectorAll('.mermaid');
    for (let i = 0; i < diagrams.length; i++) {
        if (diagrams[i].offsetWidth > 0) {
            mermaid.init(undefined, diagrams[i]);
        }
    }
}

/**
 * Wraps slide body content into dedicated container, excluding logo, headings and slide number.
 */
function wrapSlideBody() {
    $('.remark-slide-content').each(function () {
        const slideContent = $(this);

        if (slideContent.children('.slide-body').length > 0 && slideContent.children('.slide-header').length > 0) {
            return;
        }

        if (slideContent.children('.slide-header').length === 0) {
            const header = $('<div class="slide-header"></div>');
            const headerNodes = slideContent.children().filter(function () {
                const node = $(this);

                if (node.is('h1, h2, h3, .logo--horizontal, .logo--full')) {
                    return true;
                }

                if (node.find('.logo--horizontal, .logo--full').length > 0) {
                    return true;
                }

                return false;
            });

            if (headerNodes.length > 0) {
                headerNodes.appendTo(header);
                header.prependTo(slideContent);
            }
        }

        if (slideContent.children('.slide-body').length > 0) {
            return;
        }

        const body = $('<div class="slide-body"></div>');
        const bodyNodes = slideContent.children().filter(function () {
            const node = $(this);

            if (node.is('.slide-header, .remark-slide-number, .slide-body')) {
                return false;
            }

            return true;
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
