const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
// Render automatic PORT assign karta hai, isliye process.env.PORT zaroori hai
const PORT = process.env.PORT || 10000; 

app.use(express.json());

let liveTokens = [];
let isRunning = false;

// --- 🛡️ TOKEN VALIDATOR ---
async function validateTokens(tokenArray) {
    let active = [];
    for (let t of tokenArray) {
        let cleanToken = t.trim();
        if (!cleanToken) continue;
        try {
            const res = await axios.get(`https://graph.facebook.com/me?access_token=${cleanToken}`);
            if (res.data.id) {
                active.push({ token: cleanToken, name: res.data.name });
            }
        } catch (e) {}
    }
    return active;
}

// --- ⚔️ RENDER STEALTH ENGINE ---
async function startV7Attack(data) {
    const { target, hater, delay: baseDelay, messages, tokens } = data;
    isRunning = true;
    
    liveTokens = await validateTokens(tokens);
    if (liveTokens.length === 0) {
        isRunning = false; return;
    }

    let msgList = messages.split('\n').filter(m => m.trim());
    let mIdx = 0; let tIdx = 0;

    while (isRunning && liveTokens.length > 0) {
        const current = liveTokens[tIdx];
        const finalMsg = `${hater} ${msgList[mIdx]}`;

        try {
            await axios.post(`https://graph.facebook.com/v15.0/${target}/messages`, {
                message: finalMsg,
                access_token: current.token
            });
            console.log(`✔️ Strike: ${current.name} -> ${target}`);
        } catch (err) {
            console.log(`⚠️ Checkpoint: ${current.name} Removed.`);
            liveTokens.splice(tIdx, 1);
            if (liveTokens.length === 0) break;
        }

        mIdx = (mIdx + 1) % msgList.length;
        tIdx = (tIdx + 1) % liveTokens.length;

        const jitter = Math.floor(Math.random() * 2000); 
        const waitTime = (parseInt(baseDelay) * 1000) + jitter;
        await new Promise(r => setTimeout(r, waitTime));
    }
    isRunning = false;
}

// --- DASHBOARD ---
app.get('/', (req, res) => {
    res.send(`
    <html><head><title>DEEPAK RAJPUT RENDER V7</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        body{background:#000;color:#00ffcc;font-family:sans-serif;padding:20px;text-align:center}
        .main{border:2px solid #00ffcc;border-radius:15px;padding:20px;max-width:450px;margin:auto;box-shadow:0 0 15px #00ffcc55}
        textarea, input{width:100%;background:#0a0a0a;color:#fff;border:1px solid #333;padding:12px;margin:8px 0;border-radius:8px;outline:none}
        button{width:100%;padding:15px;background:#00ffcc;color:#000;border:none;font-weight:bold;cursor:pointer;border-radius:8px;width:100%}
    </style></head><body>
    <div class="main">
        <h2>DEEPAK RAJPUT BRAND</h2>
        <p style="font-size:10px">RENDER CLOUD EDITION</p>
        <input id="target" placeholder="Target ID">
        <input id="hater" placeholder="Hater Name">
        <input id="delay" type="number" placeholder="Delay" value="10">
        <textarea id="tokens" placeholder="EAAG6V7 Tokens (Line by Line)" rows="5"></textarea>
        <textarea id="msgs" placeholder="Messages" rows="5"></textarea>
        <button onclick="run()">LAUNCH ON RENDER</button>
        <div id="res" style="margin-top:10px; font-size:12px">> System Ready...</div>
    </div>
    <script>
        function run(){
            const d = {
                target: document.getElementById('target').value,
                hater: document.getElementById('hater').value,
                delay: document.getElementById('delay').value,
                tokens: document.getElementById('tokens').value.split('\\n'),
                messages: document.getElementById('msgs').value
            };
            fetch('/start', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
            document.getElementById('res').innerText = "> Attack Running 24/7 on Render!";
        }
    </script></body></html>`);
});

app.post('/start', (req, res) => {
    if(!isRunning) startV7Attack(req.body);
    res.json({status:"running"});
});

// --- RENDER KEEP-ALIVE (Heartbeat) ---
setInterval(() => {
    // Ye bot khud ko hi ping karta rahega taaki Render use "Sleep" na kare
    axios.get(`https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost'}`).catch(() => {});
}, 5 * 60 * 1000); // Every 5 minutes

app.listen(PORT, () => console.log(`Deepak Rajput Brand: Render Port ${PORT}`))
