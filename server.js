require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const OpenAI = require("openai");
const pdfjsLib = require("pdfjs-dist/build/pdf");
const mammoth = require("mammoth");

const { storeChunks } = require("./vector/vectorStore");
const { retrieveRelevant } = require("./vector/retrieve");

const { resumePipeline } = require("./langgraph/workflow");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// ---------- BETTER PDF TEXT EXTRACTION ----------
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map(item => item.str)
      .filter(s => s && s.trim().length > 0)
      .join(" ");

    text += strings + "\n";
  }

  return text.trim();
}



// ---------- MAIN ENDPOINT ----------
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    let resumeText = "";

    // ---- PDF or DOCX detection ----
    if (req.file.mimetype === "application/pdf") {
      resumeText = await extractTextFromPDF(filePath);
    } else {
      const result = await mammoth.extractRawText({ path: filePath });
      resumeText = result.value;
    }

    //console.log("Extracted text length:", resumeText.length);

    // ---- If text is EMPTY, still continue (NO PINECONE) ----
    await resumePipeline(resumeText);

    // ---- Create chunks safely ----
    const chunks = resumeText
      .replace(/\s+/g, " ")
      .match(/.{1,800}/g) || [];

    let relevantText = "";


if (Array.isArray(chunks) && chunks.length > 0) {
  //console.log("Storing chunks in Pinecone:", chunks.length);

  await storeChunks(chunks);

  //console.log("Retrieving from Pinecone...");
  relevantText = await retrieveRelevant(
    "Summarize and rate this resume"
  );
} else {
  //console.log("⚠️ No valid chunks — skipping Pinecone.");
}


    // ---- Use RAG context if available, otherwise use full text ----
 const contextForAI =
  typeof relevantText === "string" && relevantText.length > 0
    ? relevantText
    : resumeText;



    const prompt = `
You are an expert career coach.
"rating": MUST be a number between 1 and 10 (no quotes)

Relevant parts of resume:
${contextForAI}

Return ONLY valid JSON (no markdown, no backticks):

{
  "summary": "...",
  "rating": 1-10,
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "references": [
    {"title": "...", "type": "website", "link": "..."},
    {"title": "...", "type": "book", "author": "..."}
  ]
}
`;

const completion = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL,
  messages: [{ role: "user", content: prompt }],
});

fs.unlinkSync(filePath); // delete uploaded file

const raw = completion.choices[0].message.content;

// remove ```json blocks
const cleaned = raw
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

let result;

try {
  const parsed = JSON.parse(cleaned);

  // ----- FIX SUMMARY -----
  let summaryText = "";
  if (typeof parsed.summary === "string") {
    summaryText = parsed.summary;
  } else if (typeof parsed.summary === "object") {
    summaryText =
      parsed.summary.professional_experience ||
      parsed.summary.concise ||
      JSON.stringify(parsed.summary);
  }

  // ----- FIX STRENGTHS -----
  let strengthsList = [];
  if (Array.isArray(parsed.strengths)) {
    parsed.strengths.forEach(item => {
      if (typeof item === "string") {
        strengthsList.push(item);
      } else if (item.achievement) {
        strengthsList.push(item.achievement);
      } else {
        strengthsList.push(JSON.stringify(item));
      }
    });
  }

  // ----- FIX WEAKNESSES -----
  let weaknessesList = [];
  if (Array.isArray(parsed.weaknesses)) {
    parsed.weaknesses.forEach(item => {
      if (typeof item === "string") {
        weaknessesList.push(item);
      } else if (item.issue) {
        weaknessesList.push(item.issue);
      } else {
        weaknessesList.push(JSON.stringify(item));
      }
    });
  }

  result = {
    summary: summaryText,
    rating:
  typeof parsed.rating === "number"
    ? parsed.rating
    : 0,

    strengths: strengthsList,
    weaknesses: weaknessesList,
    references: Array.isArray(parsed.references)
      ? parsed.references
      : []
  };

} catch (e) {
  console.log("AI returned invalid JSON:", raw);
  result = {
    summary: "Could not parse AI response.",
    rating: 0,
    strengths: [],
    weaknesses: [],
    references: []
  };
}

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

