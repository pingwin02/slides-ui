let slideshow;

let slides = window.location.pathname;

if (slides === '/') {
    window.location.replace("/slides/Materials.md");
}

let presentationCustomStyles = document.createElement("link");
console.log(slides);
const base = slides.split('/').slice(2, -1).join('/');
const css = `/css/slides/${base}/styles.css`;
presentationCustomStyles.href = css;
presentationCustomStyles.rel = "stylesheet";
presentationCustomStyles.type = "text/css";
document.head.appendChild(presentationCustomStyles);

let slidesRequest = $.ajax({
    url: slides,
    type: 'GET',
    headers: {
        'Accept': 'text/markdown'
    }
});

let templateRequest = $.ajax({
    url: '/md/template.md',
    type: 'GET',
    headers: {
        'Accept': 'text/markdown'
    }
});

$.when(slidesRequest, templateRequest).done(function (slide, template) {
    let md = template[0] + slide[0];
    $('#source').text(md);
    slideshow = remark.create({}, event => {
        $('.remark-slide-container').each(function () {
            $(this).attr('data-title', $(this).find('h3').text());
        });
    });

    mermaid.initialize({
        startOnLoad: false,
        cloneCssStyles: false,
        theme: 'neutral'
    });

    function initMermaid(s) {
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

    initMermaid(slideshow.getSlides()[slideshow.getCurrentSlideIndex()]);
    slideshow.on('afterShowSlide', initMermaid);

});
