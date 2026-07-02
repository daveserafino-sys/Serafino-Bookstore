import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable larger payloads for base64 file uploads (admin panel)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded PDF/EPUB files statically
app.use("/uploads", express.static(uploadsDir));

// Serve files from public folder at root
app.use(express.static(path.join(process.cwd(), "public")));

// Create a default fallback sample PDF & EPUB inside uploads so downloads work immediately
const defaultPdfPath = path.join(uploadsDir, "sample.pdf");
const defaultEpubPath = path.join(uploadsDir, "sample.epub");
if (!fs.existsSync(defaultPdfPath)) {
  fs.writeFileSync(defaultPdfPath, "%PDF-1.4 ... (Writer Website Sample Book PDF Document) ... Lorem ipsum dolor sit amet.");
}
if (!fs.existsSync(defaultEpubPath)) {
  fs.writeFileSync(defaultEpubPath, "EPUB ... (Writer Website Sample Book EPUB Document) ... Lorem ipsum dolor sit amet.");
}

const dataFilePath = path.join(process.cwd(), "src", "data", "writer-data.json");

// Helper to read data safely
function readWriterData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading writer data:", error);
  }
  // Return hardcoded fallback if file does not exist or fails
  return {
    books: [
      { id: "corilocho", title: "Corilocho", price: 0, pdfUrl: "", epubUrl: "" },
      { id: "saltwater-archives", title: "Saltwater Archives", price: 1, pdfUrl: "", epubUrl: "" },
      { id: "we-are-sympathetic", title: "We Are Sympathetic", price: 2, pdfUrl: "", epubUrl: "" }
    ],
    publications: []
  };
}

// Helper to write data safely
function writeWriterData(data: any) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing writer data:", error);
    return false;
  }
}

// API Routes

// Get data
app.get("/api/writer-data", (req, res) => {
  const data = readWriterData();
  res.json(data);
});

// Update data (Admin Panel)
app.post("/api/writer-data", (req, res) => {
  const { passcode, data } = req.body;
  
  // Basic admin protection (can be configured in env, defaults to "writer123")
  const adminPasscode = process.env.ADMIN_PASSCODE || "writer123";
  if (passcode !== adminPasscode) {
    return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
  }

  if (!data || !data.books || !data.publications) {
    return res.status(400).json({ error: "Invalid data payload." });
  }

  const success = writeWriterData(data);
  if (success) {
    res.json({ success: true, message: "Data updated successfully." });
  } else {
    res.status(500).json({ error: "Failed to write data to file." });
  }
});

// Handle Admin File Upload (Base64 PDF or EPUB)
app.post("/api/upload-file", (req, res) => {
  const { passcode, fileName, fileData } = req.body;

  const adminPasscode = process.env.ADMIN_PASSCODE || "writer123";
  if (passcode !== adminPasscode) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Filename or file data is missing." });
  }

  try {
    // Sanitize filename
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join(uploadsDir, sanitizedName);
    
    // Extract base64 content
    const base64Content = fileData.split(";base64,").pop();
    if (!base64Content) {
      return res.status(400).json({ error: "Invalid base64 file data." });
    }

    fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
    
    // Return the URL pathway to download
    const fileUrl = `/uploads/${sanitizedName}`;
    res.json({ success: true, url: fileUrl, fileName: sanitizedName });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to save file." });
  }
});

// Record PayPal Email Address
app.post("/api/record-paypal-email", (req, res) => {
  const { email, bookTitle, format } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const data = readWriterData();
    if (!data.paypalEmails) {
      data.paypalEmails = [];
    }
    data.paypalEmails.push({
      email: email.trim(),
      bookTitle: bookTitle || "Unknown",
      format: format || "pdf",
      date: new Date().toISOString()
    });

    const success = writeWriterData(data);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to record purchase email." });
    }
  } catch (err: any) {
    console.error("Error saving PayPal email:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Dedicated secure file stream download endpoint to log or guard downloads
app.get("/api/download/:bookId/:format", (req, res) => {
  const { bookId, format } = req.params;
  const data = readWriterData();
  const book = data.books.find((b: any) => b.id === bookId) || data.publications.find((p: any) => p.id === bookId);

  if (!book) {
    return res.status(404).send("Book not found");
  }

  // Increment download count
  let found = false;
  const bookIndex = data.books.findIndex((b: any) => b.id === bookId);
  if (bookIndex !== -1) {
    data.books[bookIndex].downloads = (data.books[bookIndex].downloads || 0) + 1;
    found = true;
  } else {
    const pubIndex = data.publications.findIndex((p: any) => p.id === bookId);
    if (pubIndex !== -1) {
      data.publications[pubIndex].downloads = (data.publications[pubIndex].downloads || 0) + 1;
      found = true;
    }
  }

  if (found) {
    writeWriterData(data);
  }

  // Get requested format URL
  const relativeUrl = format === "epub" ? book.epubUrl : book.pdfUrl;
  
  // Use uploaded file or fallback to sample
  let fileToServe = relativeUrl ? path.join(process.cwd(), relativeUrl) : "";
  if (!fileToServe || !fs.existsSync(fileToServe)) {
    // serve sample
    fileToServe = format === "epub" ? defaultEpubPath : defaultPdfPath;
  }

  const fileExt = format === "epub" ? "epub" : "pdf";
  const contentType = format === "epub" ? "application/epub+zip" : "application/pdf";
  const downloadName = `${book.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${fileExt}`;

  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  res.setHeader("Content-Type", contentType);
  
  const stream = fs.createReadStream(fileToServe);
  stream.pipe(res);
});

// Serve Vite dev server or build static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static handler attached.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
