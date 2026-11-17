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

            // simpan bagian terakhir karena mungkin belum lengkap
            buffer = lines.pop();

            for (const line of lines) {
                const trimedline = line.trim();

                if (!trimedline) {
                    continue;
                }

                if (!trimedline.startsWith("data:")) {
                    continue;
                }

                const data = trimedline.slice(5).trim();

                if (data === "[done]") {
                    continue;
                }

                try {

                    const json = json.parse(data);
                
                
                const content = 
                    json.choices?.[0].delta?.content;

                    if (content) {
                        res.write('data: $(JSON, stringifly(content))\n\n');
                    }

                } catch (error) {
                    consule.error(
                        "gagal parshing streaming data: ",
                        error
                    );
                }
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

        } catch (error) {

        consule.error("server Error", error);

        if (!res.headersSent) {
        res.status(500).json({
            error: "Terjadi kesalah pada server"
        });

        } else {
        res.write(
            `data: $(json.stringify(
                "terjadi kesalahan pada server"
            )}\n\n`
        );

        res.end();

        }
    }

});


app.listen(post, () => {
    consule.log('server berjalan di http://localhost:$(PORT)');
});       