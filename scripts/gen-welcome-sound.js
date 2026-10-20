// Genere public/sounds/welcome.wav : carillon de chargement (E5 > G5 > B5).
// node scripts/gen-welcome-sound.js
const fs = require("fs");
const path = require("path");

const SR = 22050;
const DUR = 1.8;
const N = Math.floor(SR * DUR);
const data = new Float32Array(N);

const notes = [
  { freq: 659.25, start: 0.0, len: 0.7 },   // E5
  { freq: 783.99, start: 0.35, len: 0.7 },  // G5
  { freq: 987.77, start: 0.7, len: 0.9 },   // B5
];

for (const { freq, start, len } of notes) {
  const s0 = Math.floor(start * SR);
  const s1 = Math.min(N, s0 + Math.floor(len * SR));
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const env = Math.min(1, t / 0.02) * Math.exp(-3.2 * t);
    data[i] += Math.sin(2 * Math.PI * freq * t) * env * 0.5;
    data[i] += Math.sin(4 * Math.PI * freq * t) * env * 0.12;
  }
}

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(data[i]));
const gain = peak > 0 ? 0.89 / peak : 1;

const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, data[i] * gain));
  buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
}

const out = path.join(__dirname, "..", "public", "sounds", "welcome.wav");
fs.writeFileSync(out, buf);
console.log("OK " + out + " (" + buf.length + " octets)");
