'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';

export function QrCodeModal({
  isOpen,
  onClose,
  roomCode,
  roomName,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?lobby=${roomCode}`
      : `http://localhost:3001/?lobby=${roomCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, inviteUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#090414',
          light: '#ffffff',
        },
      });
    }
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Colpo Basso: Faida di Semi',
          text: `Unisciti al tavolo "${roomName || roomCode}" con il codice ${roomCode}!`,
          url: inviteUrl,
        });
      } catch {
        // Fallback
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#120b22] border-2 border-rose-500/50 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-black uppercase tracking-widest mb-1">
            <QrCode className="w-3 h-3" />
            <span>Invito Rapido Stanza</span>
          </div>
          <h3 className="font-black text-xl text-white tracking-wide">
            {roomName || 'Lobby Colpo Basso'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Fai inquadrare il QR Code o condividi il codice stanza a 6 caratteri
          </p>
        </div>

        <div className="flex justify-center p-3.5 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <canvas ref={canvasRef} />
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Codice Lobby
            </span>
            <p className="text-2xl font-black tracking-widest text-amber-400">
              {roomCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-bold transition cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Condividi Invito</span>
        </button>
      </div>
    </div>
  );
}
