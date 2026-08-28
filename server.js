const express = require('express');
const fileUpload = require('express-fileupload');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

let botProcess = null;

app.use(express.static('public'));
app.use(fileUpload());

// File upload aur Bot start endpoint
app.post('/upload', (req, res) => {
    if (!req.files || !req.files.botFile) {
        return res.status(400).send('Koi file select nahi ki gayi.');
    }

    const botFile = req.files.botFile;
    const uploadPath = path.join(__dirname, 'uploads', botFile.name);

    // Uploads folder create karein agar missing ho
    if (!fs.existsSync(path.join(__dirname, 'uploads'))){
        fs.mkdirSync(path.join(__dirname, 'uploads'));
    }

    botFile.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);

        // Purane running bot ko stop karein
        if (botProcess) {
            botProcess.kill();
        }

        // Naye bot ko background mein run karein
        botProcess = spawn('node', [uploadPath]);

        botProcess.stdout.on('data', (data) => {
            console.log(`Bot Output: ${data}`);
        });

        botProcess.stderr.on('data', (data) => {
            console.error(`Bot Error: ${data}`);
        });

        res.send('File successfully upload ho gayi aur Bot start ho chuka hai!');
    });
});

app.listen(PORT, () => {
    console.log(`Dashboard running on port ${PORT}`);
});
  
