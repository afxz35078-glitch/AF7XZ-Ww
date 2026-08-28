const express = require('express');
const fileUpload = require('express-fileupload');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

const botDir = path.join(__dirname, 'user_bots');
if (!fs.existsSync(botDir)) fs.mkdirSync(botDir);

let activeBotProcess = null;
let consoleLogs = ["=== Server Online ==="];
let botStatus = { running: false, mode: 'None' };

function addLog(msg) {
    const time = new Date().toLocaleTimeString();
    consoleLogs.push(`[${time}] ${msg}`);
    if (consoleLogs.length > 200) consoleLogs.shift();
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

app.post('/api/host-code', (req, res) => {
    const { token, code } = req.body;
    if (!token || !code) return res.status(400).json({ success: false, message: 'Token & Code required' });

    const scriptPath = path.join(botDir, 'index.js');
    fs.writeFileSync(scriptPath, code);

    if (activeBotProcess) activeBotProcess.kill();
    activeBotProcess = spawn('node', [scriptPath], { env: { ...process.env, DISCORD_TOKEN: token }, cwd: botDir });
    botStatus = { running: true, mode: 'Code Editor' };

    activeBotProcess.stdout.on('data', data => addLog(`[BOT] ${data.toString().trim()}`));
    activeBotProcess.stderr.on('data', data => addLog(`[BOT-ERROR] ${data.toString().trim()}`));

    res.json({ success: true, message: 'Bot Started Successfully!' });
});

app.post('/api/stop-bot', (req, res) => {
    if (activeBotProcess) {
        activeBotProcess.kill();
        activeBotProcess = null;
        botStatus.running = false;
        addLog('Bot Stopped');
        return res.json({ success: true, message: 'Bot Stopped' });
    }
    res.json({ success: false, message: 'No Bot Running' });
});

app.get('/api/terminal-logs', (req, res) => res.json({ status: botStatus, logs: consoleLogs }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
