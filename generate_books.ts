import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import nodepub from "nodepub";

const dataPath = path.join(process.cwd(), "src", "data", "writer-data.json");
const storiesDir = path.join(process.cwd(), "src", "data", "stories");
const uploadsDir = path.join(process.cwd(), "uploads", "publications");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Read metadata
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

async function generatePDF(id: string, title: string, outlet: string, date: string, textContent: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 54, bottom: 54, left: 54, right: 54 },
        bufferPages: true
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Metadatas
      doc.info.Title = title;
      doc.info.Author = "David Serafino";

      // Cover / Title Section on Page 1
      doc.moveDown(4);
      doc.font("Times-Italic").fontSize(32).text(title, { align: "center" });
      doc.moveDown(1);
      doc.font("Times-Roman").fontSize(14).text("by David Serafino", { align: "center" });
      doc.moveDown(2);
      doc.font("Times-Italic").fontSize(11).text(`First published in ${outlet}, ${date}`, { align: "center" });
      
      // Separator rule
      doc.moveDown(2);
      doc.lineWidth(0.5).strokeColor("#cccccc")
         .moveTo(150, doc.y).lineTo(doc.page.width - 150, doc.y).stroke();
      
      doc.moveDown(3);

      // Parse paragraphs
      // Split story text into lines, skipping the title line if it matches
      const lines = textContent.split(/\r?\n/);
      let started = false;
      const paragraphs: string[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!started && (trimmed.toLowerCase() === title.toLowerCase() || trimmed.toLowerCase() === id.toLowerCase())) {
          started = true;
          continue;
        }
        started = true;
        paragraphs.push(trimmed);
      }

      // Render paragraphs
      paragraphs.forEach((p, idx) => {
        if (p === "~" || p === "***" || p === "* * *") {
          doc.moveDown(1.5);
          doc.font("Times-Roman").fontSize(14).text("~", { align: "center" });
          doc.moveDown(1.5);
        } else if (p.startsWith("Bio:")) {
          doc.moveDown(2);
          doc.font("Times-Italic").fontSize(10).text(p, { align: "left", lineGap: 3 });
        } else {
          // Indent first line of paragraph (except first paragraph or after separators)
          const isFirstOrSep = idx === 0 || paragraphs[idx - 1] === "~" || paragraphs[idx - 1] === "***";
          doc.font("Times-Roman").fontSize(11);
          if (isFirstOrSep) {
            doc.text(p, { align: "justify", lineGap: 4 });
          } else {
            // Indent text manually or prefix space
            doc.text("      " + p, { align: "justify", lineGap: 4 });
          }
          doc.moveDown(0.8);
        }
      });

      // Second Pass - Header & Footer (Page numbers)
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Footer: Page X of Y
        doc.font("Times-Roman").fontSize(9).fillColor("#777777");
        doc.text(
          `Page ${i + 1} of ${range.count}`,
          54,
          doc.page.height - 40,
          { align: "center", width: doc.page.width - 108 }
        );

        // Header: Story Title (skip page 1)
        if (i > range.start) {
          doc.text(title, 54, 30, { align: "right", width: doc.page.width - 108 });
          doc.lineWidth(0.25).strokeColor("#dddddd")
             .moveTo(54, 42).lineTo(doc.page.width - 54, 42).stroke();
        }
      }

      doc.end();

      writeStream.on("finish", () => {
        resolve();
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function generateEPUB(id: string, title: string, outlet: string, date: string, textContent: string, outputPath: string) {
  const metadata = {
    id: `epub-${id}`,
    title: title,
    author: "David Serafino",
    cover: path.join(process.cwd(), "public", "noir_bg_1.jpg"),
    published: date,
    copyright: "David Serafino, 2026",
    publisher: outlet,
    genre: "Fiction",
    language: "en",
    showTOC: false
  };

  const epub = nodepub.document(metadata);

  // Parse paragraphs and format as HTML
  const lines = textContent.split(/\r?\n/);
  let htmlContent = `<div style="font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 10px;">`;
  htmlContent += `<h1 style="text-align: center; margin-top: 40px; font-style: italic;">${title}</h1>`;
  htmlContent += `<h3 style="text-align: center; font-weight: normal; margin-bottom: 40px;">by David Serafino</h3>`;
  htmlContent += `<p style="text-align: center; font-style: italic; color: #555555; margin-bottom: 50px;">First published in ${outlet}, ${date}</p>`;

  let started = false;
  let paragraphIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!started && (trimmed.toLowerCase() === title.toLowerCase() || trimmed.toLowerCase() === id.toLowerCase())) {
      started = true;
      continue;
    }
    started = true;

    if (trimmed === "~" || trimmed === "***" || trimmed === "* * *") {
      htmlContent += `<p style="text-align: center; margin: 30px 0; font-size: 1.4em;">~</p>`;
    } else if (trimmed.startsWith("Bio:")) {
      htmlContent += `<hr style="border: 0; border-top: 1px solid #cccccc; margin: 40px 0;" />`;
      htmlContent += `<p style="font-style: italic; font-size: 0.95em; line-height: 1.4; color: #444444;">${trimmed}</p>`;
    } else {
      // Indent subsequent paragraphs
      const indentStyle = paragraphIndex > 0 ? "text-indent: 2em; margin: 0 0 1em 0;" : "margin: 0 0 1em 0;";
      htmlContent += `<p style="text-align: justify; ${indentStyle}">${trimmed}</p>`;
      paragraphIndex++;
    }
  }

  htmlContent += `</div>`;

  epub.addSection(title, htmlContent);

  const parsedPath = path.parse(outputPath);
  await epub.writeEPUB(parsedPath.dir, parsedPath.name);
}

async function run() {
  console.log("Starting full publication PDF and EPUB compile...");
  const publications = data.publications;

  for (const pub of publications) {
    const txtPath = path.join(storiesDir, `${pub.id}.txt`);
    if (!fs.existsSync(txtPath)) {
      console.warn(`WARNING: Text file for ${pub.id} not found at ${txtPath}. Skipping.`);
      continue;
    }

    const textContent = fs.readFileSync(txtPath, "utf-8");
    const pdfPath = path.join(uploadsDir, `${pub.id}.pdf`);
    const epubPath = path.join(uploadsDir, `${pub.id}.epub`);

    console.log(`Compiling [${pub.title}]...`);

    // Generate PDF
    await generatePDF(pub.id, pub.title, pub.outlet, pub.date, textContent, pdfPath);
    console.log(` - Generated PDF: ${pdfPath}`);

    // Generate EPUB
    await generateEPUB(pub.id, pub.title, pub.outlet, pub.date, textContent, epubPath);
    console.log(` - Generated EPUB: ${epubPath}`);

    // Update metadata references
    pub.pdfUrl = `uploads/publications/${pub.id}.pdf`;
    pub.epubUrl = `uploads/publications/${pub.id}.epub`;
  }

  // Save the updated JSON back
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log("Success! writer-data.json updated successfully.");
}

run().catch((err) => {
  console.error("Compilation failed:", err);
  process.exit(1);
});
