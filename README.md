# AI Resume Summarizer & Rater

A web application that allows users to upload a PDF resume, extracts the text, analyzes it using OpenAI, and provides a structured summary including strengths, weaknesses, rating, and references.

---

## Features

- Upload PDF resumes.
- Extract text from PDFs using `pdfjs-dist`.
- Analyze resumes with OpenAI GPT model.
- Display structured JSON results in a user-friendly web interface.
- Highlights:
  - Summary
  - Rating
  - Strengths
  - Weaknesses
  - References

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **File Uploads:** Multer
- **PDF Parsing:** pdfjs-dist
- **AI Analysis:** OpenAI API for LLM, Langgraph, Langchain, RAG, Chromadb etc....
- **CORS:** Enabled for frontend-backend communication

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ai-resume-summarizer.git
cd ai-resume-summarizer
