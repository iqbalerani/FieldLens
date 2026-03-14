import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

type RecordingState = "idle" | "recording" | "processing";

const WAV_RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: ".wav",
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: ".wav",
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

export function useVoiceStream() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [transcript, setTranscript] = useState("");
  const [connected, setConnected] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  function startDurationTimer() {
    setDurationMs(0);
    timerRef.current = setInterval(() => setDurationMs((d) => d + 100), 100);
  }

  function stopDurationTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording(): Promise<void> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      setTranscript("");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(WAV_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setRecordingState("recording");
      startDurationTimer();
    } catch {
      setRecordingState("idle");
    }
  }

  async function streamAudioFile(uri: string): Promise<string> {
    const url = api.getBaseUrl().replace(/^http/, "ws") + `/ws/voice/voice-${Date.now()}`;
    const base64 = await api.readFileBase64(uri);
    const chunkSize = 16_384;
    let finalTranscript = "";

    return new Promise<string>((resolve, reject) => {
      socketRef.current?.close();
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        socket.send(JSON.stringify({ type: "start", contentType: "audio/wav" }));
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data as string) as { type?: string; text?: string; message?: string };
        if (payload.type === "ready") {
          for (let index = 0; index < base64.length; index += chunkSize) {
            socket.send(JSON.stringify({ type: "audio_chunk", content: base64.slice(index, index + chunkSize) }));
          }
          socket.send(JSON.stringify({ type: "end" }));
          return;
        }
        if (payload.type === "partial_transcript" && payload.text) {
          setTranscript(payload.text);
          return;
        }
        if (payload.type === "final_transcript" && payload.text) {
          finalTranscript = payload.text;
          setTranscript(payload.text);
          return;
        }
        if (payload.type === "completed") {
          const text = payload.text ?? finalTranscript;
          setConnected(false);
          socket.close();
          resolve(text ?? "");
          return;
        }
        if (payload.type === "error") {
          setConnected(false);
          socket.close();
          reject(new Error(payload.message ?? "Voice streaming failed"));
        }
      };

      socket.onerror = () => {
        setConnected(false);
        reject(new Error("Voice websocket connection failed"));
      };
      socket.onclose = () => setConnected(false);
    });
  }

  async function stopRecording(): Promise<string> {
    stopDurationTimer();
    setRecordingState("processing");
    const recording = recordingRef.current;
    if (!recording) {
      setRecordingState("idle");
      return "";
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) {
        setRecordingState("idle");
        return "";
      }

      let text = "";
      try {
        text = await streamAudioFile(uri);
      } catch {
        text = await api.transcribeAudio(uri);
      }

      setTranscript(text);
      setRecordingState("idle");
      return text;
    } catch {
      setRecordingState("idle");
      return "";
    }
  }

  return { transcript, setTranscript, connected, recordingState, durationMs, startRecording, stopRecording };
}
