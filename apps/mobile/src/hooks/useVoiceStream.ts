import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

type RecordingState = "idle" | "recording" | "processing";

/**
 * Real voice recording hook using expo-av.
 *
 * Flow:
 *  1. startRecording() — requests mic permission, starts Audio.Recording
 *  2. stopRecording()  — stops recording, uploads the audio file to
 *                        POST /voice/transcribe, returns the transcript text
 *
 * Legacy fallback: streamWords() sends pre-written text word-by-word over the
 * WebSocket so the demo works without a real microphone.
 */
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
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecordingState("recording");
      setConnected(true);
      startDurationTimer();
    } catch {
      setRecordingState("idle");
    }
  }

  async function stopRecording(): Promise<string> {
    stopDurationTimer();
    setRecordingState("processing");
    setConnected(false);
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
      const text = await api.transcribeAudio(uri);
      setTranscript(text);
      setRecordingState("idle");
      return text;
    } catch {
      setRecordingState("idle");
      return "";
    }
  }

  /** Legacy WebSocket text-simulation — keeps demo working without mic. */
  function streamWords(sessionId: string, input: string): void {
    const url = api.getBaseUrl().replace("http", "ws") + `/ws/voice/${sessionId}`;
    socketRef.current?.close();
    const socket = new WebSocket(url);
    socketRef.current = socket;
    socket.onopen = () => {
      setConnected(true);
      const words = input.split(/\s+/).filter(Boolean);
      words.forEach((word, index) => {
        setTimeout(() => {
          socket.send(JSON.stringify({ text: word, final: index === words.length - 1 }));
        }, index * 110);
      });
    };
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data as string) as { text?: string };
      if (payload.text) setTranscript(payload.text);
    };
    socket.onclose = () => setConnected(false);
  }

  return { transcript, setTranscript, connected, recordingState, durationMs, startRecording, stopRecording, streamWords };
}
