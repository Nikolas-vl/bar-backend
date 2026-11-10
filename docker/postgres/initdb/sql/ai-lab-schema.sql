-- Schema for the AI / pgvector experiments database (POSTGRES_AI_DB, default jolie_ai).
-- Applied once by 01-create-ai-database.sh when the Postgres volume is initialised.
-- Can be re-applied safely by hand:
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_AI_DB"' < docker/postgres/initdb/sql/ai-lab-schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Toy table with 3-dimensional vectors (first pgvector exercises)
CREATE TABLE IF NOT EXISTS documents (
  id        bigserial PRIMARY KEY,
  content   text NOT NULL,
  embedding vector(3)
);

INSERT INTO documents (content, embedding)
SELECT v.content, v.embedding::vector
FROM (VALUES
  ('Pizza with tomato sauce and mozzarella', '[1,0,0]'),
  ('Pasta with tomato sauce and parmesan',   '[0.9,0.1,0]'),
  ('Chocolate cake with vanilla cream',      '[0,0,1]')
) AS v(content, embedding)
WHERE NOT EXISTS (SELECT 1 FROM documents);

-- Real embeddings from Ollama `embeddinggemma` (768 dimensions)
-- written by src/scripts/generate-embeddings.ts
CREATE TABLE IF NOT EXISTS food_documents (
  id         bigserial PRIMARY KEY,
  content    text NOT NULL,
  embedding  vector(768) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);
