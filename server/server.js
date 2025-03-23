// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const { AI21 } = require('ai21');
// import { AI21 } from 'ai21';

dotenv.config(); // Load environment variables from .env
console.log(process.env.AI21_API_KEY);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  const { AI21 } = await import('ai21');

  try {
    const client = new AI21({
      apiKey: process.env.AI21_API_KEY,
    });

    const ai21Response = await client.chat.completions.create({
      model: 'jamba-large',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ response: ai21Response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling AI21 API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});