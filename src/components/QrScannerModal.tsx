'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Image as ImageIcon, AlertCircle } from 'lucide-react';

export function QrScannerModal({
  isOpen,
  onClose,
  onCodeScanned,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extractCode = (decodedText: string): string => {
    const clean = decodedText.trim();
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const url = new URL(clean);
        const lobbyParam = url.searchParams.get('lobby') || url.searchParams.get('code');
        if (lobbyParam) return lobbyParam.toUpperCase();
      }
    } catch {
      // Plain text code
    }
    return clean.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    const code = extractCode(decodedText);
    if (code && code.length >= 4) {
      stopScanner();
      onCodeScanned(code);
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setScannerError(null);
    let mounted = true;

    const startScanner = async () => {
      try {
        await new Promise((r) => setTimeout(r, 150));
        if (!mounted) return;

        const html5QrCode = new Html5Qrcode('cb-qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 210, height: 210 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) handleScanSuccess(decodedText);
          },
          () => {}
        );
        if (mounted) setIsScanning(true);
      } catch {
        if (!mounted) return;
        setScannerError(
          'Fotocamera non disponibile o permesso negato. Puoi caricare uno screenshot del QR o digitare il codice a 6 lettere.'
        );
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const html5QrCode = new Html5Qrcode('cb-qr-reader-file');
      const result = await html5QrCode.scanFile(file, true);
      handleScanSuccess(result);
      html5QrCode.clear();
    } catch {
      setScannerError('Nessun QR Code valido trovato nell\'immagine selezionata.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#120b22] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
        <button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-1">
            <Camera className="w-3.5 h-3.5" />
            <span>Scanner QR Lobby</span>
          </div>
          <h3 className="text-xl font-black text-white">Inquadra QR Code</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Inquadra il QR Code mostrato sullo schermo dell&apos;Host
          </p>
        </div>

        <div className="relative mx-auto w-60 h-60 rounded-3xl overflow-hidden bg-black border-2 border-cyan-500/50 flex items-center justify-center">
          <div id="cb-qr-reader" className="w-full h-full" />
          <div id="cb-qr-reader-file" className="hidden" />
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-44 border-2 border-dashed border-cyan-400 rounded-2xl animate-pulse" />
            </div>
          )}
        </div>

        {scannerError && (
          <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{scannerError}</span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span>Da Immagine</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold cursor-pointer"
          >
            Inserisci Codice
          </button>
        </div>
      </div>
    </div>
  );
}
