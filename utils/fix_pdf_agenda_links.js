const fs = require("fs");
const process = require("process");
const { PDFArray, PDFDict, PDFDocument, PDFName } = require("pdf-lib");

function parseSlideDestinationName(destination) {
  if (!(destination instanceof PDFName)) {
    return null;
  }

  const decoded = destination.toString();
  const match = decoded.match(/^\/slide-(\d+)$/);

  if (!match) {
    return null;
  }

  const slideNumber = Number(match[1]);
  return Number.isInteger(slideNumber) ? slideNumber : null;
}

async function convertAgendaLinks(pdfPath) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const pages = pdf.getPages();
  let converted = 0;

  pages.forEach((page) => {
    const annotsRef = page.node.get(PDFName.of("Annots"));
    if (!annotsRef) {
      return;
    }

    const annots = pdf.context.lookup(annotsRef);
    if (!(annots instanceof PDFArray)) {
      return;
    }

    for (let index = 0; index < annots.size(); index += 1) {
      const annotRef = annots.get(index);
      const annotation = pdf.context.lookup(annotRef);

      if (!(annotation instanceof PDFDict)) {
        continue;
      }

      if (annotation.get(PDFName.of("Subtype")) !== PDFName.of("Link")) {
        continue;
      }

      const slideNumber = parseSlideDestinationName(
        annotation.get(PDFName.of("Dest"))
      );

      if (!slideNumber || slideNumber < 1 || slideNumber > pages.length) {
        continue;
      }

      const targetPageRef = pages[slideNumber - 1].ref;
      annotation.set(
        PDFName.of("Dest"),
        pdf.context.obj([targetPageRef, PDFName.of("Fit")])
      );
      converted += 1;
    }
  });

  if (converted > 0) {
    fs.writeFileSync(pdfPath, await pdf.save({ addDefaultPage: false }));
    console.warn(`Converted ${converted} agenda links in ${pdfPath}.`);
  }
}

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error("Missing PDF path for agenda links conversion.");
    process.exit(1);
  }

  await convertAgendaLinks(pdfPath);
}

main().catch((error) => {
  console.error(`Agenda links conversion failed: ${error.message}`);
  process.exit(1);
});
