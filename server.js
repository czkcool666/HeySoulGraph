const OpenAI = require('openai');
const express = require('express');

const app = express();
const port = 3000;

// Create an OpenAI instance with the API key
const openai = new OpenAI({


//Provids your API key here ............................................


  apiKey: '',




});

app.use(express.json());

app.post('/ask-ai', async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });

    const response = completion.choices[0].message.content;
    res.json({ answer: response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching OpenAI response' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
