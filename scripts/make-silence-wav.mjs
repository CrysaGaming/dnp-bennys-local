#!/usr/bin/env node
/**
 * Erzeugt `public/audio/silence-1s.wav` – 1 s Stille (8 kHz, 8 bit, mono) für die
 * E2E-Tests. Der echte Song liegt nicht im Repo (Spec 6.4), die Tests laufen deshalb
 * mit dieser Datei über `NEXT_PUBLIC_MUSIC_SRC`.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const SAMPLE_RATE = 8000;
const SECONDS = 1;
const data = Buffer.alloc(SAMPLE_RATE * SECONDS, 128);

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE, 28); // ByteRate bei 8 bit
header.writeUInt16LE(1, 32); // BlockAlign
header.writeUInt16LE(8, 34); // Bits per sample
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

mkdirSync("public/audio", { recursive: true });
const file = Buffer.concat([header, data]);
writeFileSync("public/audio/silence-1s.wav", file);
console.log(`silence-1s.wav: ${file.length} bytes`);
