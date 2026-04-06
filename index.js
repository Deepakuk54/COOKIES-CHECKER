const express = require('express');
const axios = require('axios');
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
    <title>DEEPAK RAJPUT TOKEN CHECKER V7</title>
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; padding: 15px; text-align: center; }
        .v7-box { border: 2px solid #0f0; padding: 25px; border-radius: 15px; max-width: 500px; margin: auto; background: #050505; box-shadow: 0 0 20px #0f0; }
        textarea { width: 100%; background: #111; color: #fff; border: 1px solid #444; padding: 12px; border-radius: 8px; font-size: 13px; box-sizing: border-box; }
        .btn-v7 { background: #0f0; color: #000; padding: 15px; border: none; cursor: pointer; margin-top: 15px; width: 100%; font-weight: bold; text-transform: uppercase; border-radius: 8px; transition: 0.3s; }
        .btn-v7:hover { background: #0c0; transform: scale(1.02); }
        #logBox { margin-top: 20px; text-align: left; background: #000; border: 1px solid #222; padding: 12px; max-height: 250px; overflow-y: auto; font-size: 13px; border-radius: 8px; border-left: 4px solid #0f0; }
        .active-text { color: #0f0; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #111; }
        .dead-text { color: #f00; font-size: 11px; }
        h2 { color: #fff; margin-bottom: 5px; text-shadow: 0 0 10px #0f0; }
    </style>
</head>
<body>
    <div class="v7-box">
        <h2>◈ TOKEN CHECKER V7 ◈</h2>
        <p style="color:#888; font-size:10px; margin-bottom:15px; letter-spacing:2px;">DEEPAK RAJPUT BRAND</p>
        
        <textarea id="tokens" rows="10" placeholder="Paste Tokens (One per line)..."></textarea>
        
        <button class="btn-v7" onclick="checkNow()" id="btnAction">START CHECKING</button>
        <button id="btnDl" class="btn-v7" style="background:#fff; display:none;" onclick="downloadFormatted()">DOWNLOAD ACTIVE LIST</button>
        
        <div id="logBox">-- SYSTEM READY --</div>
    </div>

    <script>
        let validOnes = [];

        async function checkNow() {
            const input = document.getElementById('tokens').value.trim();
            if(!input) return alert("Bhai token toh daal pehle!");

            const list = input.split('\\n');
            const log = document.getElementById('logBox');
            const actionBtn = document.getElementById('btnAction');
            const downBtn = document.getElementById('btnDl');

            log.innerHTML = "Processing Tokens...<br>";
            actionBtn.disabled = true;
            validOnes = [];
            downBtn.style.display = 'none';

            for(let raw of list) {
                let tk = raw.trim();
                if(!tk) continue;

                try {
                    let res = await fetch('/verify-v7', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: tk })
                    });
                    let data = await res.json();

                    if(data.success) {
                        validOnes.push({ name: data.name, id: data.id, token: tk });
                        log.innerHTML += \`<div class="active-text">✅ \${data.name} | \${data.id}</div>\`;
                    } else {
                        log.innerHTML += \`<div class="dead-text">❌ Dead Token Detected</div>\`;
                    }
                } catch(e) {
                    log.innerHTML += \`<div style="color:orange;">⚠️ API Error</div>\`;
                }
                log.scrollTop = log.scrollHeight;
            }

            actionBtn.disabled = false;
            if(validOnes.length > 0) {
                downBtn.style.display = 'block';
                log.innerHTML += \`<br><b style="color:#fff;">Finished! Active: \${validOnes.length}</b>\`;
            }
        }

        function downloadFormatted() {
            // TERA CUSTOM FORMAT: Name upar, Token niche
            let output = "";
            validOnes.forEach(acc => {
                output += "Name: " + acc.name + " | UID: " + acc.id + "\\n" + acc.token + "\\n\\n";
            });

            const blob = new Blob([output], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'V7_Active_Tokens.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    </script>
</body>
</html>`);
});

// --- PURE LOGIC FROM YOUR CODE ---
app.post('/verify-v7', async (req, res) => {
    try {
        const fb = await axios.get(\`https://graph.facebook.com/me?fields=id,name&access_token=\${req.body.token}\`);
        res.json({ success: true, name: fb.data.name, id: fb.data.id });
    } catch (e) {
        res.json({ success: false });
    }
});

app.listen(PORT, () => console.log('V7 Checker Live on ' + PORT));
