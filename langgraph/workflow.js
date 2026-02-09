async function resumePipeline(resumeText) {
  console.log("🔹 Step 1: Extracting text...");
  console.log("🔹 Step 2: Chunking & storing...");
  console.log("🔹 Step 3: Retrieving relevant parts...");
  console.log("🔹 Step 4: Summarizing...");
  console.log("🔹 Step 5: Rating...");
  console.log("🔹 Step 6: Formatting output...");

  return resumeText;
}

module.exports = { resumePipeline };
