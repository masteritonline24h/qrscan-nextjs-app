"use client";

import { useState, type ComponentType } from "react";
import dynamic from "next/dynamic";

type QrScannerProps = {
  onScanSuccess: (text: string) => void;
};

// Disable SSR for camera hardware access
const QrScanner = dynamic<QrScannerProps>(
  async () => {
    const mod = await import("@/components/QrScanner");
    return mod.default as ComponentType<QrScannerProps>;
  },
  {
    ssr: false,
    loading: () => <p style={{ textAlign: "center" }}>Loading scanner...</p>,
  },
);

export default function Page() {
  const [result, setResult] = useState<string | null>(null);

  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>QR Scanner</h1>

      {result ? (
        <div>
          <p>Scanned: {result}</p>
          <button onClick={() => setResult(null)}>Scan Again</button>
        </div>
      ) : (
        <QrScanner onScanSuccess={(text) => setResult(text)} />
      )}
    </main>
  );
}