const express = require('express');
const login = require('josh-fca');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(express.json());

let globalLogs = [">> System Online (Deepak Rajput Brand)"];
let currentStatus = "Idle";
let isRunning = false;

// UI Dashboard
const ui = `
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>DEEPAK RAJPUT V7 PRO</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { background: #000; color: #fff; font-family: sans-serif; margin: 0; padding: 10px; }
        .app { width: 100%; max-width: 450px; margin: auto; border: 2px solid #ff0000; border-radius: 15px; padding: 15px; background: #111; box-sizing: border-box; }
        h2 { color: #ff0000; text-align: center; margin: 5px 0; text-shadow: 0 0 10px #f00; }
        textarea, input { width: 100%; background: #000; border: 1px solid #333; color: #0f0; padding: 12px; margin: 10px 0; border-radius: 8px; box-sizing: border-box; }
        .btn-box { display: flex; gap: 10px; margin-top: 10px; }
        .btn { flex: 1; padding: 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; }
        .btn-start { background: #ff0000; color: #fff; }
        .btn-stop { background: #444; color: #fff; }
        .logs { background: #000; border: 1px solid #222; height: 300px; overflow-y: auto; padding: 10px; font-size: 11px; color: #0f0; margin-top: 15px; border-radius: 8px; font-family: monospace; line-height: 1.5; }
        .status { text-align: center; color: #ff0; font-size: 13px; margin: 10px 0; padding: 5px; background: #222; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="app">
        <h2><i class="fas fa-radiation"></i> NUKE V7 PRO</h2>
        <input type="text" id="target" placeholder="Enemy UID (Only Numbers)">
        <textarea id="cookies" placeholder="Paste String Cookies Here..."></textarea>
        <div class="btn-box">
            <button class="btn btn-start" onclick="start()"><i class="fas fa-play"></i> Launch</button>
            <button class="btn btn-stop" onclick="stop()"><i class="fas fa-stop"></i> Stop</button>
        </div>
        <div class="status">System: <span id="st">Ready</span></div>
        <div class="logs" id="logBox">>> Waiting for command...</div>
    </div>
    <script>
        let interval = null;
        window.onload = () => { startTracking(); };
        async function start() {
            const uid = document.getElementById('target').value;
            const cookieStr = document.getElementById('cookies').value;
            if(!uid || !cookieStr) return alert("Bhai, Cookies aur UID dono daalo!");
            await fetch('/api/nuke', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ uid, cookieStr })
            });
            startTracking();
        }
        async function stop() { await fetch('/api/stop', { method: 'POST' }); }
        function startTracking() {
            if(interval) clearInterval(interval);
            interval = setInterval(async () => {
                const res = await fetch('/api/status');
                const d = await res.json();
                document.getElementById('st').innerText = d.status;
                document.getElementById('logBox').innerHTML = d.logs.join('<br>');
                document.getElementById('logBox').scrollTop = document.getElementById('logBox').scrollHeight;
            }, 2000);
        }
    </script>
</body>
</html>
`;

// --- HELPER: Parse String Cookies ---
function parseCookie(str) {
    return str.split(';').map(v => v.split('=')).reduce((acc, v) => {
        if(v[0]) acc.push({ key: v[0].trim(), value: v[1] ? v[1].trim() : '', domain: 'facebook.com', path: '/' });
        return acc;
    }, []);
}

// --- CORE REPORTING LOOP ---
async function startNukeTask(cookieStr, targetUID) {
    const appState = parseCookie(cookieStr);
    
    login({ appState }, (err, api) => {
        if (err) {
            globalLogs.push(`❌ Login Failed: Cookie Check Kar Bhai!`);
            isRunning = false;
            currentStatus = "Error";
            return;
        }

        const reasons = ["SALE_OF_ARM_WEAPONS", "HATE_SPEECH", "PRETENDING_TO_BE_A_CELEBRITY", "HARASSMENT", "VIOLENCE"];
        
        (async () => {
            for (let reason of reasons) {
                if (!isRunning) break;
                
                globalLogs.push(`🚀 Sending Report: ${reason}...`);
                
                try {
                    await new Promise((resolve) => {
                        api.reportUser(targetUID, reason, (reportErr) => {
                            if (reportErr) globalLogs.push(`⚠️ ID Resting (FB Rate Limit)...`);
                            else globalLogs.push(`✅ SUCCESS: ${reason} Sent!`);
                            resolve();
                        });
                    });

                    // Random Delay 45-90s
                    const wait = Math.floor(Math.random() * (90000 - 45000) + 45000);
                    globalLogs.push(`⏳ Waiting ${Math.round(wait/1000)}s for next hit...`);
                    await new Promise(r => setTimeout(r, wait));

                } catch (e) {
                    globalLogs.push(`❌ Error in Loop.`);
                }
            }
            globalLogs.push("🏁 Mission Accomplished!");
            isRunning = false;
            currentStatus = "Finished";
        })();
    });
}

// --- ROUTES ---
app.get('/', (req, res) => res.send(ui));

app.post('/api/nuke', (req, res) => {
    if (isRunning) return res.json({ success: false, msg: "Already running!" });
    isRunning = true;
    currentStatus = "Attacking 🚀";
    globalLogs = [">> System Online", `>> Target Locked: ${req.body.uid}`];
    
    startNukeTask(req.body.cookieStr, req.body.uid);
    res.json({ success: true });
});

app.post('/api/stop', (req, res) => {
    isRunning = false;
    currentStatus = "Stopped 🛑";
    globalLogs.push(">> Attack Terminated by User.");
    res.json({ success: true });
});

app.get('/api/status', (req, res) => res.json({ status: currentStatus, logs: globalLogs }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready'));
