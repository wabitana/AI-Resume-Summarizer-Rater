const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const PINECONE_HOST = process.env.PINECONE_HOST;

async function retrieveRelevant(query) {
  //console.log("Creating embedding for query...");

  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryVector = embeddingRes.data[0].embedding;

  //console.log("Querying Pinecone for similar chunks...");

  const response = await fetch(`${PINECONE_HOST}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.PINECONE_API_KEY,
    },
    body: JSON.stringify({
      namespace: "resumes",
      topK: 4,
      includeMetadata: true,
      vector: queryVector,
    }),
  });

  const data = await response.json();
  //console.log("Pinecone query result:", data);

  const matches = data.matches || [];
  const relevantTexts = matches
    .map((m) => m.metadata?.text)
    .filter(Boolean);

  const combinedText = relevantTexts.join("\n\n");

  //console.log("Retrieved relevant text length:", combinedText.length);

  return combinedText || "";
}

module.exports = { retrieveRelevant };
