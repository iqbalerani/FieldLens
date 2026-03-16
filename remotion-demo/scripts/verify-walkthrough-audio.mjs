import {spawnSync} from "node:child_process";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(projectRoot, "src", "walkthrough-audio.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

const assetPath = path.join(projectRoot, "public", config.sourceFile);
const trimBeforeSeconds = config.trimBeforeInFrames / config.fps;
const inspectDurationSeconds =
  config.sceneDurationInFrames / config.fps;

const tempDir = mkdtempSync(path.join(os.tmpdir(), "fieldlens-audio-"));
const decodedWavPath = path.join(tempDir, "walkthrough-audio.wav");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const runCommand = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  return {
    ...result,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

const decodeWithFfmpeg = () => {
  const result = runCommand("ffmpeg", [
    "-y",
    "-i",
    assetPath,
    "-vn",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "48000",
    decodedWavPath,
  ]);

  return {
    ok: result.status === 0,
    tool: "ffmpeg",
    details: result.stderr || result.stdout,
  };
};

const decodeWithAfconvert = () => {
  const result = runCommand("afconvert", [
    "-f",
    "WAVE",
    "-d",
    "LEI16@48000",
    assetPath,
    decodedWavPath,
  ]);

  return {
    ok: result.status === 0,
    tool: "afconvert",
    details: result.stderr || result.stdout,
  };
};

const decodeAudioTrack = () => {
  const attempts = [];
  const ffmpegAttempt = decodeWithFfmpeg();
  attempts.push(ffmpegAttempt);
  if (ffmpegAttempt.ok) {
    return ffmpegAttempt.tool;
  }

  if (process.platform === "darwin") {
    const afconvertAttempt = decodeWithAfconvert();
    attempts.push(afconvertAttempt);
    if (afconvertAttempt.ok) {
      return afconvertAttempt.tool;
    }
  }

  const details = attempts
    .map((attempt) => `${attempt.tool}: ${attempt.details.trim()}`)
    .join("\n\n");

  fail(
    `Unable to decode audio from "${config.sourceFile}".\n\n${details}\n\nInstall ffmpeg or run this on macOS with afconvert available.`,
  );
};

const readWav = (wavPath) => {
  const buffer = readFileSync(wavPath);

  if (buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WAVE") {
    fail(`Decoded file is not a valid WAV: ${wavPath}`);
  }

  let offset = 12;
  let fmtChunk = null;
  let dataChunk = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;

    if (chunkId === "fmt ") {
      fmtChunk = {
        audioFormat: buffer.readUInt16LE(chunkStart),
        numChannels: buffer.readUInt16LE(chunkStart + 2),
        sampleRate: buffer.readUInt32LE(chunkStart + 4),
        bitsPerSample: buffer.readUInt16LE(chunkStart + 14),
      };
    }

    if (chunkId === "data") {
      dataChunk = {
        offset: chunkStart,
        size: chunkSize,
      };
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!fmtChunk || !dataChunk) {
    fail(`Decoded WAV is missing a fmt/data chunk: ${wavPath}`);
  }

  const supportedFormats = new Set([1, 65534]);

  if (!supportedFormats.has(fmtChunk.audioFormat) || fmtChunk.bitsPerSample !== 16) {
    fail(
      `Decoded WAV must be 16-bit PCM. Received format=${fmtChunk.audioFormat}, bits=${fmtChunk.bitsPerSample}.`,
    );
  }

  return {
    buffer,
    ...fmtChunk,
    dataOffset: dataChunk.offset,
    dataSize: dataChunk.size,
  };
};

const analyseAudio = (wav) => {
  const bytesPerSample = wav.bitsPerSample / 8;
  const frameSize = bytesPerSample * wav.numChannels;
  const totalFrames = Math.floor(wav.dataSize / frameSize);
  const trimBeforeFrames = Math.min(
    totalFrames,
    Math.floor(trimBeforeSeconds * wav.sampleRate),
  );
  const inspectFrames = Math.min(
    Math.max(totalFrames - trimBeforeFrames, 0),
    Math.floor(inspectDurationSeconds * wav.sampleRate),
  );

  let maxPeak = 0;
  let sumSquares = 0;
  let sampleCount = 0;

  for (let frameIndex = 0; frameIndex < inspectFrames; frameIndex += 1) {
    const absoluteFrameIndex = trimBeforeFrames + frameIndex;
    const frameOffset = wav.dataOffset + absoluteFrameIndex * frameSize;
    for (let channel = 0; channel < wav.numChannels; channel += 1) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      const sample = wav.buffer.readInt16LE(sampleOffset);
      const peak = Math.abs(sample);
      if (peak > maxPeak) {
        maxPeak = peak;
      }
      sumSquares += sample * sample;
      sampleCount += 1;
    }
  }

  const rms = sampleCount === 0 ? 0 : Math.sqrt(sumSquares / sampleCount);
  const decodedDurationSeconds = totalFrames / wav.sampleRate;

  return {
    decodedDurationSeconds,
    inspectedSeconds: inspectFrames / wav.sampleRate,
    trimBeforeSeconds,
    maxPeak,
    rms,
  };
};

let decodeTool = "unknown";

try {
  decodeTool = decodeAudioTrack();
  const wav = readWav(decodedWavPath);
  const analysis = analyseAudio(wav);
  const hasAudibleContent =
    analysis.maxPeak >= config.silenceThreshold.peak ||
    analysis.rms >= config.silenceThreshold.rms;

  console.log(
    `Validated walkthrough audio with ${decodeTool}: ` +
      `trimBefore=${analysis.trimBeforeSeconds.toFixed(2)}s, ` +
      `${analysis.inspectedSeconds.toFixed(2)}s inspected, ` +
      `peak=${analysis.maxPeak}, rms=${analysis.rms.toFixed(2)}, ` +
      `decodedDuration=${analysis.decodedDurationSeconds.toFixed(2)}s.`,
  );

  if (!hasAudibleContent) {
    fail(
      `The source asset "${config.sourceFile}" is silent in the first ${inspectDurationSeconds.toFixed(
        2,
      )} seconds used by the walkthrough scene after trimBefore=${trimBeforeSeconds.toFixed(
        2,
      )}s.\n` +
        `Decoded audio peak=${analysis.maxPeak}, rms=${analysis.rms.toFixed(2)}.\n` +
        `Replace /public/${config.sourceFile} with a non-silent export, or increase trimBeforeInFrames in src/walkthrough-audio.json if the audible section starts later.`,
    );
  }
} finally {
  rmSync(tempDir, {recursive: true, force: true});
}
