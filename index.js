const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>TOKEN CHECKER V7</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; padding: 20px; text-align: center; }
        .box { border: 2px solid #0f0; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; background: #050505; }
        textarea { width: 100%; background: #111; color: #fff; border: 1px solid #444; padding: 10px; box-sizing: border-box; }
        button { background: #0f0; color: #000; padding: 12px; border: none; width: 100%; font-weight: bold; margin-top: 10px; cursor: pointer; border-radius: 5px; }
        #log { margin-top: 20px; text-align: left; max-height: 250px; overflow-y: auto; background: #000; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="box">
        <h2>◈ TOKEN CHECKER V7 ◈</h2>
        <textarea id="tks" rows="10" placeholder="Paste Tokens (One per line)"></textarea>
        <button onclick="check()">START VERIFY</button>
        <button id="dl" style="display:none; background:#fff;" onclick="download()">DOWNLOAD ACTIVE LIST</button>
        <div id="log">-- READY --</div>
    </div>

    <script>
        let actives = [];
        async function check() {
            const list = document.getElementById('tks').value.split('\\n');
            const log = document.getElementById('log');
            log.innerHTML = "Checking...<br>";
            actives = [];
            
            for(let tk of list) {
                let t = tk.trim();
                if(!t) continue;
                try {
                    let res = await fetch('/verify', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({token: t})
                    });
                    let data = await res.json();
                    if(data.success) {
                        actives.push({n: data.name, i: data.id, t: t});
                        log.innerHTML += "<span style='color:#0f0'>✅ " + data.name + "</span><br>";
                    } else {
                        log.innerHTML += "<span style='color:red'>❌ Dead Token</span><br>";
                    }
                } catch(e) { log.innerHTML += "⚠️ Error<br>"; }
            }
            if(actives.length > 0) document.getElementById('dl').style.display = 'block';
        }

        function download() {
            let out = "";
            actives.forEach(a => {
                out += "Name: " + a.n + " | UID: " + a.i + "\\n" + a.t + "\\n\\n";
            });
            const blob = new Blob([out], {type: 'text/plain'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'V7_Active_Tokens.txt';
            a.click();
        }
    </script>
</body>
</html>`);
});

app.post('/verify', async (req, res) => {
    const { token } = req.body;
    try {
        const fb = await axios.get('https://graph.facebook.com/me', {
            params: {
                fields: 'id,name',
                access_token: token
            }
        });
        res.json({ success: true, name: fb.data.name, id: fb.data.id });
    } catch (e) {
        res.json({ success: false });
    }
});

app.listen(PORT, () => console.log('Server is running!'));
