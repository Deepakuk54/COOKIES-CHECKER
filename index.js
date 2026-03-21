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

// Render Anti-Sleep Heartbeat
setInterval(() => {
    addLog("🛡️ Deepak Brand: Token-V7 Protection is ACTIVE.");
}, 30000);

function startBot(task) {
    const taskId = task.id;
    const LOCKED_TITLE = task.gn || "DEEPAK RAJPUT BRAND 🐉"; 
    const targetUID = String(task.uid); // String conversion for 15-16 digit UIDs

    // Pure Token Login
    wiegine.login({ accessToken: task.token }, { logLevel: 'silent', forceLogin: true }, (err, api) => {
        if (err || !api) return addLog(`❌ Login Failed | Task: ${taskId} | Check Token (EAA...)`);

        api.setOptions({ listenEvents: true, selfListen: false, autoMarkRead: true });
        addLog(`🚀 Lock Active | Task: ${taskId} | Group: ${targetUID}`);

        // Initial Title Fix
        api.setTitle(LOCKED_TITLE, targetUID, (err) => {
            if(!err) addLog(`✅ Title Sync: ${targetUID}`);
        });

        // Anti-Ban Protection Listener
        const listener = api.listenMqtt((err, event) => {
            if (event?.logMessageType === "log:thread-name" && String(event.threadID) === targetUID) {
                if (event.logMessageData.name !== LOCKED_TITLE) {
                    addLog(`⚠️ Attempt on ${targetUID}! Resetting in 2s...`);
                    // Delay to prevent rapid-fire API calls (Anti-Ban)
                    setTimeout(() => {
                        api.setTitle(LOCKED_TITLE, targetUID);
                    }, 2000); 
                }
            }
        });

        activeTasks.set(taskId, { uid: targetUID, gn: LOCKED_TITLE, api, listener });
    });
}

// Auto-Restart
try {
    const saved = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    saved.forEach(t => startBot(t));
} catch(e) {}

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Deepak Token Locker</title>
            <style>
                body { background: #0b0e14; color: #adbac7; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 15px; }
                .main-card { background: #1c2128; border: 1px solid #444c56; padding: 25px; border-radius: 12px; max-width: 450px; margin: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
                input { width: 92%; padding: 12px; margin: 10px 0; background: #22272e; border: 1px solid #444c56; color: #58a6ff; border-radius: 6px; outline: none; }
                button { width: 100%; padding: 14px; background: #238636; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
                #logBox { background: #000; color: #39ff14; padding: 12px; height: 180px; overflow-y: auto; border-radius: 8px; font-family: monospace; font-size: 11px; text-align: left; border: 1px solid #333; margin-top: 20px; }
                .task-item { background: #22272e; border: 1px solid #444c56; padding: 10px; margin-top: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
                .stop-btn { background: #da3633; padding: 6px 12px; width: auto; font-size: 11px; margin: 0; }
            </style>
        </head>
        <body>
            <h2 style="color:#58a6ff;">DEEPAK TOKEN-V7 LOCKER ✅</h2>
            
            <div class="main-card">
                <h3 style="margin-top:0;">Create New Lock</h3>
                <input id="token" placeholder="Paste Token V7 (EAA...)" type="text">
                <input id="uid" placeholder="15-16 Digit Group UID" type="text">
                <input id="gn" placeholder="Group Name to Lock">
                <button onclick="start()">START LOCKING</button>
            </div>

            <div class="main-card" style="margin-top:20px;">
                <h3 style="margin-top:0;">Manage Tasks</h3>
                <input id="searchId" placeholder="Enter Task ID to Find/Stop">
                <button style="background:#1f6feb;" onclick="renderTasks()">SEARCH TASK</button>
                <div id="myTasks"></div>
            </div>

            <div class="main-card" style="margin-top:20px;">
                <h3 style="margin-top:0;">Live Logs</h3>
                <div id="logBox">System Monitoring Active...</div>
            </div>

            <script>
                let myStoredIds = JSON.parse(localStorage.getItem('deepak_token_only_ids') || "[]");

                async function start() {
                    const token = document.getElementById('token').value.trim();
                    const uid = document.getElementById('uid').value.trim();
                    const gn = document.getElementById('gn').value.trim();
                    if(!token || !uid) return alert("Bhai, Token aur UID daalo!");

                    const res = await fetch('/add-task', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, uid, gn })
                    });
                    const data = await res.json();
                    myStoredIds.push(data.id);
                    localStorage.setItem('deepak_token_only_ids', JSON.stringify(myStoredIds));
                    alert("Task Started! Your ID: " + data.id);
                    renderTasks();
                }

                async function stopTask(id) {
                    await fetch('/stop-task', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id }) });
                    myStoredIds = myStoredIds.filter(i => i !== id);
                    localStorage.setItem('deepak_token_only_ids', JSON.stringify(myStoredIds));
                    renderTasks();
                }

                async function renderTasks() {
                    const searchId = document.getElementById('searchId').value.trim();
                    const res = await fetch('/list');
                    const allTasks = await res.json();
                    const filtered = allTasks.filter(t => myStoredIds.includes(t.id) || t.id === searchId);
                    
                    document.getElementById('myTasks').innerHTML = filtered.map(t => \`
                        <div class="task-item">
                            <span style="font-size:12px;">\${t.id} | \${t.uid}</span>
                            <button class="stop-btn" onclick="stopTask('\${t.id}')">STOP</button>
                        </div>\`).join('') || "<p style='font-size:12px;'>No active tasks found.</p>";
                }

                setInterval(async () => {
                    const res = await fetch('/logs');
                    const logs = await res.json();
                    document.getElementById('logBox').innerHTML = logs.reverse().join('<br>');
                }, 4000);
                
                renderTasks();
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

app.post('/stop-task', (req, res) => {
    const { id } = req.body;
    if (activeTasks.has(id)) {
        const t = activeTasks.get(id);
        if (t.listener) t.listener();
        activeTasks.delete(id);
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).filter(x => x.id !== id);
        fs.writeFileSync(DB_FILE, JSON.stringify(db));
        res.json({ ok: true });
    }
});

app.listen(PORT, '0.0.0.0');
