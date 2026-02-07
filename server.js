require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const OpenAI = require("openai");
const pdfjsLib = require("pdfjs-dist/build/pdf");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str).join(" ");
    text += strings + "\n";
  }
  return text;
}

app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const resumeText = await extractTextFromPDF(filePath);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert career coach."
        },
        {
          role: "user",
          content: `
Analyze this resume and return JSON in this exact format:

{
  "summary": "string",
  "rating": number,
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "references": [
    {"title": "string", "type": "website", "link": "string"},
    {"title": "string", "type": "book", "author": "string"}
  ]
}

Resume:
${resumeText}
`
        }
      ],
      response_format: { type: "json_object" }
    });

    fs.unlinkSync(filePath); // delete uploaded file

    const result = JSON.parse(
      completion.choices[0].message.content
    );

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});













