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
        width: 160,
        margin: 1.5,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-sm max-h-[96vh] sm:max-h-[340px] overflow-y-auto no-scrollbar bg-[#120b22] border-2 border-rose-500/50 rounded-3xl p-3.5 sm:p-4 shadow-2xl space-y-2.5 sm:space-y-3 text-center relative my-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer z-30 transition"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-black uppercase tracking-widest mb-0.5">
            <QrCode className="w-3 h-3" />
            <span>Invito Rapido Stanza</span>
          </div>
          <h3 className="font-black text-base sm:text-lg text-white tracking-wide truncate px-6">
            {roomName || 'Lobby Colpo Basso'}
          </h3>
          <p className="text-[10px] text-slate-400">
            Inquadra il QR o condividi il codice a 6 caratteri
          </p>
        </div>

        <div className="flex justify-center p-2 bg-white rounded-2xl shadow-inner mx-auto w-fit">
          <canvas ref={canvasRef} />
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
              Codice Lobby
            </span>
            <p className="text-xl sm:text-2xl font-black tracking-widest text-amber-400 leading-none">
              {roomCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-bold transition cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Condividi Invito</span>
        </button>
      </div>
    </div>
  );
}
