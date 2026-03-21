const express = require('express');
const wiegine = require('fca-mafiya');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
let activeTasks = new Map();
let logs = []; 
const DB_FILE = 'database.json';

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    logs.push(`[${time}] ${msg}`);
    if (logs.length > 50) logs.shift();
    console.log(msg);
}

setInterval(() => {
    addLog("🛡️ Deepak Brand: Token Engine Running...");
}, 30000);

function startBot(task) {
    const taskId = task.id;
    const LOCKED_TITLE = task.gn || "DEEPAK RAJPUT BRAND 🐉"; 
    const targetUID = String(task.uid);

    // Advanced Token Login with Error Details
    wiegine.login({ accessToken: task.token }, { logLevel: 'silent', forceLogin: true }, (err, api) => {
        if (err) {
            // Yeh line aapko batayegi ki problem kya hai
            const errorMsg = err.error || err.error_message || "Invalid Token / Expired";
            addLog(`❌ Login Failed [${taskId}]: ${errorMsg}`);
            return;
        }

        if (!api) return addLog(`❌ API Error [${taskId}]: Could not initialize session.`);

        api.setOptions({ listenEvents: true, selfListen: false, autoMarkRead: true });
        addLog(`🚀 Lock Active | Task: ${taskId} | Group: ${targetUID}`);

        api.setTitle(LOCKED_TITLE, targetUID, (e) => {
            if(e) addLog(`⚠️ Title Error: Check if ID is Admin in ${targetUID}`);
            else addLog(`✅ Success: Title Synced for ${targetUID}`);
        });

        const listener = api.listenMqtt((err, event) => {
            if (event?.logMessageType === "log:thread-name" && String(event.threadID) === targetUID) {
                if (event.logMessageData.name !== LOCKED_TITLE) {
                    addLog(`⚠️ Attempt on ${targetUID}! Resetting...`);
                    setTimeout(() => api.setTitle(LOCKED_TITLE, targetUID), 2000);
                }
            }
        });

        activeTasks.set(taskId, { uid: targetUID, gn: LOCKED_TITLE, api, listener });
    });
}

// Rest of the code (Express routes) remains same as previous...
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deepak Token Fixer</title>
            <style>
                body { background: #0d1117; color: #c9d1d9; font-family: sans-serif; text-align: center; padding: 15px; }
                .card { background: #161b22; border: 1px solid #30363d; padding: 20px; border-radius: 12px; max-width: 450px; margin: auto; margin-bottom: 15px; }
                input { width: 90%; padding: 12px; margin: 8px 0; background: #0d1117; border: 1px solid #30363d; color: #7ee787; border-radius: 8px; outline: none; }
                button { width: 100%; padding: 12px; background: #238636; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
                #logBox { background: #000; color: #00ff00; padding: 10px; height: 180px; overflow-y: auto; border-radius: 8px; font-family: monospace; font-size: 11px; text-align: left; border: 1px solid #333; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h2 style="color:#58a6ff;">DEEPAK TOKEN-V7 DEBUGGER ✅</h2>
            <div class="card">
                <input id="token" placeholder="Paste Token V7 (EAA...)" type="text">
                <input id="uid" placeholder="15-16 Digit Group UID" type="text">
                <input id="gn" placeholder="Group Name to Lock">
                <button onclick="start()">START & DEBUG</button>
            </div>
            <div class="card">
                <h4>Check Logs Below for Errors</h4>
                <div id="logBox">Waiting for login...</div>
            </div>
            <script>
                async function start() {
                    const token = document.getElementById('token').value.trim();
                    const uid = document.getElementById('uid').value.trim();
                    const gn = document.getElementById('gn').value.trim();
                    await fetch('/add-task', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, uid, gn })
                    });
                }
                setInterval(async () => {
                    const res = await fetch('/logs');
                    const logs = await res.json();
                    document.getElementById('logBox').innerHTML = logs.reverse().join('<br>');
                }, 3000);
            </script>
        </body>
        </html>
    `);
});

app.get('/logs', (req, res) => res.json(logs));
app.get('/list', (req, res) => {
    const list = [];
    activeTasks.forEach((v, k) => list.push({ id: k, uid: v.uid }));
    res.json(list);
});
app.post('/add-task', (req, res) => {
    const taskId = "LOCK-" + Math.floor(1000 + Math.random() * 9000);
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const newTask = {...req.body, id: taskId};
    db.push(newTask);
    fs.writeFileSync(DB_FILE, JSON.stringify(db));
    startBot(newTask);
    res.json({ id: taskId });
});
app.listen(PORT, '0.0.0.0');
