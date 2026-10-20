// Genere public/sounds/money-theme.wav : musique de fond "argent" en boucle.
// Pad chaud (Am - F - C - G) + tintements de pieces + basse douce.
// node scripts/gen-money-theme.js
const fs = require("fs");
const path = require("path");

const SR = 22050;
const LOOP = 10; // secondes
const N = Math.floor(SR * LOOP);
const data = new Float32Array(N);

const mid = (n) => 440 * Math.pow(2, (n - 69) / 12); // note MIDI -> Hz

// Progression Am - F - C - G (2.5 s par accord)
const chords = [
  { t0: 0.0, notes: [57, 60, 64, 69] }, // Am
  { t0: 2.5, notes: [53, 57, 60, 65] }, // F
  { t0: 5.0, notes: [60, 64, 67, 72] }, // C
  { t0: 7.5, notes: [55, 59, 62, 67] }, // G
];

const CHORD_LEN = 2.5;
const ATTACK = 0.25;
const RELEASE = 0.6;

for (const chord of chords) {
  const s0 = Math.floor(chord.t0 * SR);
  const s1 = Math.min(N, Math.floor((chord.t0 + CHORD_LEN + RELEASE) * SR));
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    // enveloppe douce (attaque + relachement)
    const env =
      Math.min(1, t / ATTACK) *
      (t > CHORD_LEN ? Math.max(0, 1 - (t - CHORD_LEN) / RELEASE) : 1);
    // pad : chaque note + un leger detune pour la chaleur
    for (const midi of chord.notes) {
      const f = mid(midi);
      data[i] += Math.sin(2 * Math.PI * f * t) * env * 0.055;
      data[i] += Math.sin(2 * Math.PI * f * 1.002 * t) * env * 0.03;
    }
    // basse : fondamentale a l'octave en dessous
    const bf = mid(chord.notes[0] - 12);
    data[i] += Math.sin(2 * Math.PI * bf * t) * env * 0.09;
  }
}

// Tintements de pieces (bell : 3 partiels, decroissance rapide)
const coins = [1.1, 2.2, 3.4, 4.6, 5.8, 7.0, 8.1, 9.2];
for (const ct of coins) {
  const s0 = Math.floor(ct * SR);
  const len = Math.floor(0.45 * SR);
  for (let k = 0; k < len; k++) {
    const i = s0 + k;
    if (i >= N) break;
    const t = k / SR;
    const env = Math.exp(-9 * t) * 0.12;
    data[i] += Math.sin(2 * Math.PI * 1760 * t) * env;
    data[i] += Math.sin(2 * Math.PI * 2640 * t) * env * 0.6;
    data[i] += Math.sin(2 * Math.PI * 3520 * t) * env * 0.35;
  }
}

// Boucle propre : fondu d'entree (0.15 s) et de sortie (0.5 s) vers le silence
const fadeIn = Math.floor(0.15 * SR);
const fadeOut = Math.floor(0.5 * SR);
for (let i = 0; i < fadeIn; i++) data[i] *= i / fadeIn;
for (let i = 0; i < fadeOut; i++) {
  const idx = N - fadeOut + i;
  if (idx >= 0) data[idx] *= 1 - i / fadeOut;
}

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(data[i]));
const gain = peak > 0 ? 0.72 / peak : 1;

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

const out = path.join(__dirname, "..", "public", "sounds", "money-theme.wav");
fs.writeFileSync(out, buf);
console.log("OK " + out + " (" + Math.round(buf.length / 1024) + " Ko, " + LOOP + " s en boucle)");
