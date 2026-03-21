const express = require('express');
const fca = require('fca-mafiya');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
let activeTasks = [];
const DB_FILE = 'database.json';

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

function startBot(task) {
    // Agar input EAAD se shuru hota hai toh use access token ki tarah treat karega
    const loginConfig = task.token.startsWith('EAAD') 
        ? { accessToken: task.token } 
        : { appState: JSON.parse(task.token) };

    fca(loginConfig, (err, api) => {
        if (err || !api) return;

        api.setOptions({ 
            listenEvents: true, 
            selfListen: false, 
            logLevel: 'silent', 
            onlineStatus: false 
        });

        api.setTitle(task.name, task.uid);

        const listener = api.listenMqtt((err, event) => {
            if (event?.type === "event" && event.logMessageType === "log:thread-name" && event.threadID === task.uid) {
                api.setTitle(task.name, task.uid);
            }
        });

        activeTasks.push({ id: task.id, uid: task.uid, name: task.name, api, listener });
    });
}

// Auto-Restart
try {
    const saved = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    saved.forEach(t => startBot(t));
} catch(e) {}

// UI Dashboard
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>V7 Stealth Control</title>
            <style>
                body { background: #000; color: #444; font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .card { width: 100%; max-width: 400px; background: #0a0a0a; padding: 20px; border-radius: 12px; border: 1px solid #111; }
                textarea, input { width: 100%; background: #000; border: 1px solid #222; color: #777; padding: 12px; margin-bottom: 10px; border-radius: 5px; box-sizing: border-box; font-size: 12px; outline: none; }
                button { width: 100%; background: #111; color: #555; border: 1px solid #222; padding: 12px; cursor: pointer; border-radius: 5px; font-weight: bold; }
                button:hover { background: #1a1a1a; color: #00ff88; }
                .bot-item { background: #0d0d0d; border: 1px solid #1a1a1a; padding: 10px; margin-top: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
                .btn-stop { color: #f44; cursor: pointer; background: none; border: 1px solid #300; padding: 4px 8px; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h3 style="text-align:center; color:#222; letter-spacing:3px;">STEALTH V7</h3>
                <textarea id="token" placeholder="Paste EAAD Token or AppState JSON here..." rows="5"></textarea>
                <input type="text" id="uid" placeholder="Target Group UID">
                <input type="text" id="name" placeholder="Name to Lock" value="DEEPAK RAJPUT">
                <button onclick="add()">ACTIVATE LOCK</button>
                <div id="list"></div>
            </div>
            <script>
                let ids = JSON.parse(localStorage.getItem('v7_keys') || "[]");
                async function load() {
                    const r = await fetch('/list');
                    const all = await r.json();
                    const mine = all.filter(t => ids.includes(t.id));
                    document.getElementById('list').innerHTML = mine.map(t => \`
                        <div class="bot-item">
                            <span><b>\${t.name}</b> (\${t.uid})</span>
                            <button class="btn-stop" onclick="stop('\${t.id}')">STOP</button>
                        </div>\`).join('');
                }
                async function add() {
                    const token = document.getElementById('token').value.trim();
                    const uid = document.getElementById('uid').value.trim();
                    const name = document.getElementById('name').value.trim();
                    const res = await fetch('/add', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, uid, name })
                    });
                    const d = await res.json();
                    if(d.id) { ids.push(d.id); localStorage.setItem('v7_keys', JSON.stringify(ids)); load(); }
                }
                async function stop(id) {
                    await fetch('/stop', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id }) });
                    ids = ids.filter(i => i !== id); localStorage.setItem('v7_keys', JSON.stringify(ids)); load();
                }
                load(); setInterval(load, 5000);
            </script>
        </body>
        </html>
    `);
});

// APIs
app.get('/list', (req, res) => res.json(activeTasks.map(t => ({ id: t.id, uid: t.uid, name: t.name }))));
app.post('/add', (req, res) => {
    const taskId = "V7-" + Math.floor(1000 + Math.random() * 9000);
    const task = { ...req.body, id: taskId };
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db.push(task);
    fs.writeFileSync(DB_FILE, JSON.stringify(db));
    startBot(task);
    res.json({ id: taskId });
});
app.post('/stop', (req, res) => {
    const { id } = req.body;
    const i = activeTasks.findIndex(t => t.id === id);
    if (i !== -1) {
        if (activeTasks[i].listener) activeTasks[i].listener.stopListening();
        activeTasks.splice(i, 1);
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).filter(t => t.id !== id);
        fs.writeFileSync(DB_FILE, JSON.stringify(db));
        res.json({ ok: true });
    }
});

app.listen(PORT);
