import ollama from 'ollama';

const response = await ollama.embed({
  model: 'embeddinggemma',
  input: 'Pizza with tomato sauce and mozzarella',
});

const embedding = response.embeddings[0];

console.log(embedding.length);
