const express = require('express');
const wiegine = require('fca-mafiya');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DEEPAK RAJPUT - SECURE CHECKER</title>
    <style>
        body { font-family: sans-serif; background: #050505; color: #eee; text-align: center; padding: 20px; }
        .container { max-width: 550px; margin: auto; background: #111; padding: 20px; border-radius: 15px; border: 1px solid #ff00ff; }
        textarea { width: 100%; height: 150px; background: #000; color: #0f0; border: 1px solid #333; border-radius: 8px; padding: 10px; margin-bottom: 10px; outline: none; }
        .main-btn { width: 100%; padding: 15px; background: #ff00ff; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .copy-btn { width: 100%; padding: 10px; background: #28a745; color: #fff; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px; display: none; }
        #status { margin: 15px 0; color: #ffc107; font-weight: bold; }
        .res-box { margin-top: 15px; text-align: left; max-height: 300px; overflow-y: auto; }
        .item { padding: 10px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; }
        .live { color: #00ff00; }
        .dead { color: #ff0000; }
    </style>
</head>
<body>
    <div class="container">
        <h2>◈ DEEPAK RAJPUT BRAND ◈</h2>
        <p style="font-size: 11px; color: #888;">(Safe Mode: 3s Delay Active)</p>
        <textarea id="cookieInput" placeholder="Paste Cookies Here..."></textarea>
        <button class="main-btn" onclick="startCheck()">START SAFE CHECK</button>
        <button id="copyBtn" class="copy-btn" onclick="copyLive()">COPY ALL LIVE COOKIES</button>
        <div id="status">Ready...</div>
        <div id="results" class="res-box"></div>
    </div>

    <script>
        let liveList = [];
        async function startCheck() {
            const input = document.getElementById('cookieInput').value.trim();
            const cookies = input.split('\\n').filter(Boolean);
            const status = document.getElementById('status');
            const resDiv = document.getElementById('results');
            
            resDiv.innerHTML = ''; liveList = [];
            document.getElementById('copyBtn').style.display = 'none';

            for(let i=0; i < cookies.length; i++) {
                status.innerText = "Checking: " + (i+1) + "/" + cookies.length + " (Waiting 3s for Safety...)";
                
                const res = await fetch('/check-secure', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ cookie: cookies[i].trim() })
                });
                const data = await res.json();
                
                if(data.status === 'LIVE') liveList.push(cookies[i].trim());

                resDiv.innerHTML += \`<div class="item">
                    <span><b>\${data.name}</b><br><small>\${data.uid}</small></span>
                    <span class="\${data.status === 'LIVE' ? 'live' : 'dead'}">\${data.status}</span>
                </div>\`;

                // --- ANTI-CHECKPOINT DELAY ---
                await new Promise(resolve => setTimeout(resolve, 3000)); 
            }
            status.innerText = "✅ Finished!";
            if(liveList.length > 0) document.getElementById('copyBtn').style.display = 'block';
        }

        function copyLive() {
            navigator.clipboard.writeText(liveList.join('\\n'));
            alert("Live Cookies Copied!");
        }
    </script>
</body>
</html>
    `);
});

app.post('/check-secure', (req, res) => {
    const { cookie } = req.body;
    wiegine.login({ cookie: cookie }, { 
        logLevel: 'silent',
        forceLogin: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }, (err, api) => {
        if (err || !api) {
            return res.json({ name: "Dead/Checkpoint", uid: "---", status: "DEAD" });
        }
        const uid = api.getCurrentUserID();
        api.getUserInfo(uid, (e, info) => {
            const name = (!e && info[uid]) ? info[uid].name : "Active User";
            // Checkpoint se bachne ke liye kaam hote hi session logout nahi, bas response bhej rahe hain
            res.json({ name: name, uid: uid, status: "LIVE" });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => console.log('Secure Checker Live!'));
