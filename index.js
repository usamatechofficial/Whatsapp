// app.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { makeWASocket, useMultiFileAuthState, delay } from "@whiskeysockets/baileys";
import pino from 'pino';
import path from 'path';

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
const logger = pino({ level: 'silent' });

let sock = makeWASocket({ auth: state, logger });

sock.ev.on('creds.update', saveCreds);

app.post('/start', upload.single('messageFile'), async (req, res) => {
  const targets = req.body.targets.split(',').map(t => t.trim());
  const haterName = req.body.haterName;
  const delaySeconds = parseInt(req.body.delay);
  const messages = fs.readFileSync(req.file.path, 'utf-8').split('\n').filter(Boolean);

  async function sendMessages() {
    while (true) {
      for (const msg of messages) {
        for (const number of targets) {
          const fullMessage = `${haterName} ${msg}`;
          await sock.sendMessage(`${number}@c.us`, { text: fullMessage });
          console.log(`Sent to ${number}: ${fullMessage}`);
        }
        await delay(delaySeconds * 1000);
      }
    }
  }

  sendMessages();
  res.send("Message sending started.");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
