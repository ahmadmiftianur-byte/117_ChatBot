
const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const form = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');

const initialWelcome = document.getElementById('welcome');

// Riwayat percakapan
let messages = [
    {
        role: 'system',
        content: 'Kamu adalah NeMo Assistant, asisten AI yang ramah, pintar, dan membantu. Jawablah menggunakan bahasa Indonesia yang mudah dipahami.'
    }
];

// FUNGSI MENAMBAHKAN PESAN
function addMessage(text, sender) {

    const row = document.createElement('div');

    row.className = `message ${sender}`;

    // Avatar chatbot
    if (sender === 'bot') {

        const avatar = document.createElement('div');

        avatar.className = 'mini-avatar';
        avatar.textContent = '✦';

        row.appendChild(avatar);
    }

    // Bubble pesan
    const bubble = document.createElement('div');

    bubble.className = 'bubble';
    bubble.textContent = text;

    row.appendChild(bubble);

    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    return bubble;
}


// FUNGSI MENGIRIM PESAN
async function sendMessage(text) {

    const message = text.trim();

    if (!message || sendBtn.disabled) {
        return;
    }

    // Menghapus halaman sambutan
    const welcome = document.getElementById('welcome');

    if (welcome) {
        welcome.remove();
    }

    // Menampilkan pesan pengguna
    addMessage(message, 'user');

    // Menyimpan pesan ke riwayat
    messages.push({
        role: 'user',
        content: message
    });

    // Mengosongkan input
    input.value = '';

    sendBtn.disabled = true;


    // ANIMASI MENGETIK
    const typing = document.createElement('div');

    typing.className = 'message bot';

    typing.innerHTML = `
        <div class="mini-avatar">✦</div>

        <div class="bubble">

            <div class="typing">
                <i></i>
                <i></i>
                <i></i>
            </div>

        </div>
    `;

    chat.appendChild(typing);

    chat.scrollTop = chat.scrollHeight;


    try {

        // MENGHUBUNGKAN KE BACKEND INDEX.JS
        const response = await fetch('/api/chat', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                messages: messages
            })

        });


        // MEMERIKSA RESPONSE
        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(
                errorData.error || 'Gagal menghubungkan ke server'
            );

        }


        // MEMBACA STREAMING
        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let buffer = '';
        let botReply = '';

        // Menghapus animasi mengetik
        typing.remove();

        // Membuat bubble jawaban AI
        const botBubble = addMessage('', 'bot');


        while (true) {

            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Mengubah data stream menjadi teks
            buffer += decoder.decode(value, {
                stream: true
            });

            // Memisahkan setiap event SSE
            const events = buffer.split('\n\n');

            // Menyimpan data yang belum lengkap
            buffer = events.pop();

            for (const event of events) {

                const line = event
                    .split('\n')
                    .find(line => line.startsWith('data:'));

                if (!line) {
                    continue;
                }

                const data = line.slice(5).trim();

                // Selesai streaming
                if (data === '[DONE]') {
                    continue;
                }

                try {

                    // Membaca JSON dari server
                    const content = JSON.parse(data);

                    botReply += content;

                    // Menampilkan jawaban AI secara langsung
                    botBubble.textContent = botReply;

                    chat.scrollTop = chat.scrollHeight;

                } catch (error) {

                    console.error(
                        'Gagal membaca streaming:',
                        error
                    );

                }
            }
        }

        // Menyimpan sisa data jika ada
        buffer += decoder.decode();

        if (buffer.trim()) {

            const line = buffer
                .split('\n')
                .find(line => line.startsWith('data:'));

            if (line) {

                const data = line.slice(5).trim();

                if (data && data !== '[DONE]') {

                    try {

                        const content = JSON.parse(data);

                        botReply += content;

                        botBubble.textContent = botReply;

                    } catch (error) {

                        console.error(error);

                    }
                }
            }
        }

        // Menyimpan jawaban AI ke riwayat
        if (botReply) {

            messages.push({
                role: 'assistant',
                content: botReply
            });

        } else {

            botBubble.textContent =
                'Maaf, AI tidak memberikan jawaban.';

        }

    } catch (error) {

        // Menghapus animasi mengetik
        typing.remove();

        // Menampilkan error
        addMessage(
            'Terjadi kesalahan: ' + error.message,
            'bot'
        );

        console.error('Chat Error:', error);

    } finally {

        sendBtn.disabled = false;

        input.focus();

    }

}


// EVENT FORM KIRIM PESAN
form.addEventListener('submit', function(e) {

    e.preventDefault();

    sendMessage(input.value);

});


// EVENT TOMBOL SARAN PERTANYAAN
document.addEventListener('click', function(e) {

    const button = e.target.closest('[data-prompt]');

    if (button) {

        sendMessage(button.dataset.prompt);

    }

});


// EVENT PERCAKAPAN BARU
document.getElementById('newChat').addEventListener(
    'click',
    function() {

        // Menghapus riwayat percakapan
        messages = [
            {
                role: 'system',
                content: 'Kamu adalah NeMo Assistant, asisten AI yang ramah, pintar, dan membantu. Jawablah menggunakan bahasa Indonesia yang mudah dipahami.'
            }
        ];

        // Menghapus semua pesan
        chat.innerHTML = '';

        // Menampilkan kembali halaman sambutan
        const newWelcome = initialWelcome.cloneNode(true);

        chat.appendChild(newWelcome);

        // Mengosongkan input
        input.value = '';

        input.focus();

    }
);
