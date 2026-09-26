"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, Mic, MicOff, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/shared/states";
import { cn } from "@/lib/utils";

type MediaState =
  | { status: "requesting" }
  | { status: "ready" }
  | { status: "error"; message: string };

function describeMediaError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera and microphone access was blocked. Allow access in your browser's site settings, then try again. You can still join without them.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera or microphone was found on this device. Connect one and try again.";
  }
  if (name === "NotReadableError") {
    return "Your camera or microphone is being used by another application. Close it and try again.";
  }
  return "We couldn't start your camera and microphone. Please try again.";
}

/**
 * Pre-join lobby: local camera/mic self-preview and toggles. Only the local
 * preview is real. The call itself is a provider integration point (see below).
 */
export function ConsultationLobby({ counterpart }: { counterpart: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [media, setMedia] = useState<MediaState>({ status: "requesting" });
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMedia({ status: "error", message: "Your browser doesn't support camera access here. Use a recent browser over a secure (HTTPS) connection." });
        return;
      }
      setMedia({ status: "requesting" });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setMicOn(true);
        setCamOn(true);
        setMedia({ status: "ready" });
      } catch (err) {
        if (!cancelled) setMedia({ status: "error", message: describeMediaError(err) });
      }
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [attempt, stop]);

  // Attach the stream once the <video> element exists.
  useEffect(() => {
    if (media.status === "ready" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [media.status]);

  function toggle(kind: "audio" | "video") {
    const tracks = kind === "audio" ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    const next = !(kind === "audio" ? micOn : camOn);
    tracks?.forEach((t) => (t.enabled = next));
    if (kind === "audio") setMicOn(next);
    else setCamOn(next);
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-navy">
        {media.status === "ready" ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview" className={cn("h-full w-full -scale-x-100 object-cover", !camOn && "invisible")} />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                <VideoOff className="h-8 w-8" aria-hidden="true" />
                <p className="text-sm">Your camera is off</p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
            {media.status === "requesting" ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <p className="text-sm">Requesting camera and microphone access…</p>
              </>
            ) : (
              <>
                <CameraOff className="h-8 w-8" aria-hidden="true" />
                <p className="text-sm">Camera preview unavailable</p>
              </>
            )}
          </div>
        )}
      </div>

      {media.status === "error" && (
        <InlineAlert variant="warning" title="Device access problem">
          {media.message}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          </div>
        </InlineAlert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={micOn ? "outline" : "destructive"} onClick={() => toggle("audio")} disabled={media.status !== "ready"} aria-pressed={!micOn}>
          {micOn ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />} {micOn ? "Mute microphone" : "Unmute microphone"}
        </Button>
        <Button variant={camOn ? "outline" : "destructive"} onClick={() => toggle("video")} disabled={media.status !== "ready"} aria-pressed={!camOn}>
          {camOn ? <Camera aria-hidden="true" /> : <CameraOff aria-hidden="true" />} {camOn ? "Turn camera off" : "Turn camera on"}
        </Button>
        <Button className="sm:ml-auto" onClick={() => setJoined(true)} disabled={joined}>
          Join consultation
        </Button>
      </div>

      {joined && (
        <Card className="border-cyan/40 bg-cyan-light animate-fade-in">
          <CardContent className="space-y-1 p-5" role="status">
            <p className="font-semibold text-navy">Video provider integration point</p>
            <p className="text-sm text-navy">
              Connect a WebRTC/telehealth provider (e.g. Daily, Twilio, Zoom SDK) here. No call is connected in this demo, so
              {" "}{counterpart} cannot see or hear you yet. Your camera preview above stays on this device only.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
