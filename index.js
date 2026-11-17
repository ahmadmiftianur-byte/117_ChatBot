const express = require('express');
const dotenv = require('dotenv');
const { buffer } = require('node:stream/consumers');

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post("/api/chat", async (req, res) => {
    try {
        const messages = req.body.messages;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: "message harus berupa array" 
            });
        }

        const response = await fetch(
            "https://api.openrouter.ai/v1/chat/completions", 
            {
                method: "POST",
                
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
                },
                
                body: JSON.stringify({
                    model: "openchatinclusionai/ling-3.2-flash:free",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: true
                })
            }
        );
        
        if (!response.ok) {
            const erroData = await response.text();

            consule.error("openRouter error: ", errorData);

            return res.status(response.status).json({
                error: errorData
            });
        }

 //header untuk streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.set.Header("Cache-Control", "no-cache");
        res.set.Header("Connection", "keep-alive");

        const reader = response.body.getReader();
        const decorer = new TextDecoder();


        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            buffer += decoder.decode(value, {
                stream: true 
            });

            const lines = buffer.split("\n");

            