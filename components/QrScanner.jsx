"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const QrScanner = forwardRef(({ onScanSuccess }, ref) => {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState("Initializing camera...");

  useImperativeHandle(ref, () => ({
    pause: () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    },
    resume: () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    },
  }));

  useEffect(() => {
    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();
    codeReader.timeBetweenDecodingAttempts = 300;

    const initCamera = async () => {
      try {
        // 1. Request media permissions directly from browser first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // 2. Attach raw stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus(""); // Clear status once camera is running

        // 3. Start scanning frames
        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (isMounted && result && onScanSuccess) {
              onScanSuccess(result.getText());
            }
          }
        );

        if (isMounted) {
          controlsRef.current = controls;
        } else {
          controls.stop();
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Camera Error:", err);

        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setStatus("Camera permission denied. Please allow camera access in your browser bar.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setStatus("No camera found on this device.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setStatus("Camera is in use by another app (e.g. Zoom, Teams, or another browser tab).");
        } else {
          setStatus("Failed to access camera. Ensure you are on https:// or localhost.");
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;

      // Stop decoding controls
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      // Stop media tracks and release camera hardware
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "500px",
        margin: "0 auto",
        minHeight: "320px",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {status ? (
        <p style={{ color: "#fff", padding: "1.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          {status}
        </p>
      ) : null}

      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: status ? "none" : "block",
        }}
      />

      {!status && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "220px",
            height: "220px",
            border: "3px solid rgba(255, 255, 255, 0.8)",
            borderRadius: "12px",
            boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.5)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
});

QrScanner.displayName = "QrScanner";
export default QrScanner;