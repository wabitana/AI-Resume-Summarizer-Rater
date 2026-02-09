const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const PINECONE_HOST = process.env.PINECONE_HOST;

async function storeChunks(chunks) {
  //console.log(`Storing chunks in Pinecone: ${chunks.length}`);

  if (!Array.isArray(chunks) || chunks.length === 0) {
    //console.log("🚨 No chunks received. Skipping Pinecone storage.");
    return;
  }

  let vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    /*console.log(
      `Creating embedding for chunk ${i} (length: ${chunks[i].length})`
    );
*/
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks[i],
    });

    vectors.push({
      id: `chunk-${Date.now()}-${i}`,
      values: embeddingRes.data[0].embedding,
      metadata: {
        text: chunks[i],
      },
    });
  }

  //console.log("Final vectors array size:", vectors.length);

  if (vectors.length === 0) {
    //console.log("🚨 No vectors created — aborting upsert.");
    return;
  }

  //console.log("Upserting vectors via Pinecone REST API...");

  const response = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vectors: vectors,
      namespace: "resumes",
    }),
  });

  const data = await response.json();
  //console.log("Pinecone REST response:", data);
  //console.log(`✅ Successfully stored ${vectors.length} vectors in Pinecone.`);
}

module.exports = { storeChunks };
