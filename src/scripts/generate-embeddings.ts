/**
 * AI / pgvector experiment: embed a text with Ollama and store it in `food_documents`.
 *
 * Connects ONLY to AI_DATABASE_URL (the separate pgvector database, default `jolie_ai`),
 * never to the application database. Run with:  npm run ai:embed
 */
import 'dotenv/config';
import { Ollama } from 'ollama';
import { Pool } from 'pg';

const MODEL = 'embeddinggemma';
const EXPECTED_DIMENSIONS = 768;

const connectionString = process.env.AI_DATABASE_URL;
if (!connectionString) {
  throw new Error('AI_DATABASE_URL is not set. AI scripts never fall back to DATABASE_URL — see .env.example.');
}
if (process.env.DATABASE_URL && connectionString === process.env.DATABASE_URL) {
  throw new Error('AI_DATABASE_URL must not point to the application database (DATABASE_URL).');
}

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
const pool = new Pool({ connectionString });

async function main() {
  const content = 'Pizza with tomato sauce and mozzarella';

  const { rows } = await pool.query<{ db: string }>('SELECT current_database() AS db');
  console.log(`Connected to database: ${rows[0]?.db}`);

  // 1. Generate embedding using Ollama
  const response = await ollama.embed({
    model: MODEL,
    input: content,
  });

  const embedding = response.embeddings[0];

  if (!embedding) {
    throw new Error('Ollama returned an empty embedding');
  }

  // 2. Validate vector dimensions
  if (embedding.length !== EXPECTED_DIMENSIONS) {
    throw new Error(`Expected ${EXPECTED_DIMENSIONS} dimensions, got ${embedding.length}`);
  }

  console.log(`Generated embedding: ${embedding.length} dimensions`);

  // 3. Convert the vector into pgvector format
  const vector = JSON.stringify(embedding);

  // 4. Insert document and embedding into PostgreSQL
  const result = await pool.query(
    `INSERT INTO food_documents (content, embedding)
     VALUES ($1, $2::vector)
     RETURNING id, content`,
    [content, vector],
  );

  console.log('Successfully saved document:');
  console.log(result.rows[0]);
}

main()
  .catch(error => {
    console.error('Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
