//import 'dotenv/config';
//import OpenAI from 'openai';

//const client = new OpenAI({
  //apiKey: process.env.OPENAI_API_KEY,
//});

//async function main(): Promise<void> {
//  const response = await client.responses.create({
//    model: 'gpt-4.5',
//    instructions: 'You are a helpful assistant. Answer briefly.',
//    input: 'Explain what a REST API is in simple terms.',
//  });

//  console.log(response.output_text);
//}

//main().catch(console.error);

//import 'dotenv/config';
//import OpenAI from 'openai';

//const client = new OpenAI({
//  baseURL: 'https://ollama.com/v1',
//  apiKey: process.env.OLLAMA_API_KEY,
//});

//async function main(): Promise<void> {
//  const response = await client.chat.completions.create({
//    model: 'gemma4:31b',
//    messages: [
//      { role: 'user', content: 'Explain what a REST API is in simple terms.' }
//    ],
//    stream: false,
//  });

//  console.log(response.choices[0]?.message?.content);
//}

//main().catch(console.error);


import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1', // Point to your local Ollama app
  apiKey: 'ollama',                      // Keep required placeholder string
});

async function main(): Promise<void> {
  // Convert responses.create into standard chat.completions.create
  const response = await client.chat.completions.create({
    model: 'llama3.2', // Your local pulled model

    messages: [
      {
        role: 'system',
        content: `
          You are an assistant for a restaurant app.
          Write concise, appetizing menu descriptions.
          Use the language specified in the input.
          Use only the provided ingredients.
          Do not invent ingredients or claim unverified facts.
          Return only the description.
          First write description in english and only after this translate using google translate
        `,
      },
      {
        role: 'user',
        content: `
          Create a menu description for this dish.

          Name: Margherita Pizza
          Ingredients:
          - tomato
          - mozzarella
          - basil

          Language: Ukrainian
        `,
      },
    ],
    stream: false,
  });

  // Extract the text content from the choices array
  console.log(response.choices[0]?.message?.content);
}

main().catch(console.error);

