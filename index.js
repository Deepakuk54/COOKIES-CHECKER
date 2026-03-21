const express = require('express');
const wiegine = require('fca-mafiya');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
let activeTasks = [];
const DB_FILE = 'database.json';

// Bina kisi shor-sharabe ke database check
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

function startBot(task, isAuto = false) {
    const taskId = task.id || (isAuto ? "AUTO-" + Math.floor(100+Math.random()*900) : "USER-" + Math.floor(1000+Math.random()*9000));
    
    let appState;
    try {
        appState = JSON.parse(task.cookie);
    } catch (e) { return; }

    wiegine({ appState }, (err, api) => {
        if (err || !api) return;
        
        api.setOptions({ 
            listenEvents: true, 
            selfListen: false, 
            logLevel: 'silent', 
            onlineStatus: false 
        });
        
        // Pehli baar naam set karega
        api.setTitle(task.name, task.uid);

        const listener = api.listenMqtt((err, event) => {
            if (err) return;
            // Agar koi naam badle to bina kisi message ke wapas wahi kar dega
            if (event?.type === "event" && event.logMessageType === "log:thread-name" && event.threadID === task.uid) {
                api.setTitle(task.name, task.uid);
            }
        });

        // Task ko list mein add karega taaki aap dashboard par dekh saken
        activeTasks.push({ id: taskId, uid: task.uid, name: task.name, api, listener });
    });
}

// Auto-Restart
try {
    const savedTasks = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    savedTasks.forEach(t => startBot(t, true));
} catch(e) {}

// --- PRIVATE CONTROL DASHBOARD ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stealth Control</title>
            <style>
                body { background: #050505; color: #ccc; font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                .container { width: 100%; max-width: 400px; background: #0a0a0a; padding: 20px; border-radius: 15px; border: 1px solid #1a1a1a; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                h2 { color: #444; font-size: 18px; text-align: center; margin-bottom: 20px; letter-spacing: 2px; }
                textarea, input { width: 100%; background: #000; border: 1px solid #222; color: #eee; padding: 12px; border-radius: 8px; margin-bottom: 10px; box-sizing: border-box; outline: none; font-size: 13px; }
                .btn-add { width: 100%; background: #111; color: #777; border: 1px solid #222; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
                .btn-add:hover { background: #1a1a1a; color: #fff; }
                .list-area { margin-top: 25px; border-top: 1px solid #111; padding-top: 15px; }
                .bot-card { background: #0d0d0d; border: 1px solid #1a1a1a; padding: 12px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
                .bot-info { font-size: 12px; }
                .bot-info b { color: #00ff88; display: block; margin-bottom: 2px; }
                .btn-stop { background: #300; color: #f55; border: 1px solid #500; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>V7 STEALTH LOCKER</h2>
                <textarea id="cookie" placeholder="Paste AppState JSON" rows="3"></textarea>
                <input type="text" id="uid" placeholder="Group UID">
                <input type="text" id="name" placeholder="Lock Name" value="DEEPAK RAJPUT">
                <button class="btn-add" onclick="addTask()">START STEALTH LOCK</button>
                
                <div class="list-area" id="botList">
                    </div>
            </div>

            <script>
                // LocalStorage taaki sirf aapko aapke bots dikhen
                let myIds = JSON.parse(localStorage.getItem('my_active_bots') || "[]");

                async function fetchBots() {
                    const res = await fetch('/list-tasks');
                    const allTasks = await res.json();
                    const mine = allTasks.filter(t => myIds.includes(t.id));
                    const listDiv = document.getElementById('botList');
                    
                    if(mine.length === 0) {
                        listDiv.innerHTML = '<p style="color:#333; text-align:center; font-size:12px;">No Active Bots Found</p>';
                    } else {
                        listDiv.innerHTML = mine.map(t => \`
                            <div class="bot-card">
                                <div class="bot-info">
                                    <b>\${t.name}</b>
                                    UID: \${t.uid}
                                </div>
                                <button class="btn-stop" onclick="stopBot('\${t.id}')">STOP</button>
                            </div>
                        \`).join('');
                    }
                }

                async function addTask() {
                    const cookie = document.getElementById('cookie').value.trim();
                    const uid = document.getElementById('uid').value.trim();
                    const name = document.getElementById('name').value.trim();
                    if(!cookie || !uid) return;

                    const res = await fetch('/add-task', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ cookie, uid, name })
                    });
                    const data = await res.json();
                    if(data.id) {
                        myIds.push(data.id);
                        localStorage.setItem('my_active_bots', JSON.stringify(myIds));
                        document.getElementById('cookie').value = "";
                        document.getElementById('uid').value = "";
                        fetchBots();
                    }
                }

                async function stopBot(id) {
                    await fetch('/stop-task', { 
                        method: 'POST', 
                        headers: {'Content-Type': 'application/json'}, 
                        body: JSON.stringify({ id }) 
                    });
                    myIds = myIds.filter(i => i !== id);
                    localStorage.setItem('my_active_bots', JSON.stringify(myIds));
                    fetchBots();
                }

                fetchBots();
                setInterval(fetchBots, 5000); // Har 5 sec mein refresh
            </script>
        </body>
        </html>
    `);
});

// APIs (Logs disabled)
app.get('/list-tasks', (req, res) => res.json(activeTasks.map(t => ({ id: t.id, uid: t.uid, name: t.name }))));

app.post('/add-task', (req, res) => {
    const task = req.body;
    const taskId = "S-" + Math.floor(1000 + Math.random() * 9000);
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db.push({...task, id: taskId});
    fs.writeFileSync(DB_FILE, JSON.stringify(db));
    startBot({...task, id: taskId});
    res.json({ success: true, id: taskId });
});

app.post('/stop-task', (req, res) => {
    const { id } = req.body;
    const i = activeTasks.findIndex(t => t.id === id);
    if (i !== -1) {
        if (activeTasks[i].listener) activeTasks[i].listener.stopListening();
        activeTasks.splice(i, 1);
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')).filter(t => t.id !== id);
        fs.writeFileSync(DB_FILE, JSON.stringify(db));
        res.json({ success: true });
    }
});

app.listen(PORT, '0.0.0.0');
