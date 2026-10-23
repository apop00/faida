import { NextResponse } from 'next/server';
import os from 'os';
import { lobbyStore } from '@/lib/lobbyStore';
import { MatchPreset } from '@/types/game';

function getLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    // fallback
  }
  return 'localhost';
}

export async function GET() {
  try {
    const rooms = lobbyStore.getPublicRooms();
    const lanIp = getLanIp();
    return NextResponse.json({ rooms, lanIp });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore caricamento lobby';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === 'leave') {
      const room = lobbyStore.leaveRoom({
        code: body.code,
        clientPlayerId: body.clientPlayerId,
      });
      return NextResponse.json({ ok: true, room });
    }

    if (body.action === 'join') {
      const room = lobbyStore.joinRoom({
        code: body.code,
        playerName: body.playerName || 'Giocatore',
        clientPlayerId: body.clientPlayerId,
        preferredSlot: body.preferredSlot,
      });
      return NextResponse.json({ room });
    }

    const room = lobbyStore.createRoom({
      roomName: body.roomName || 'Tavolo Colpo Basso',
      hostName: body.hostName || 'Giocatore 1',
      hostClientId: body.hostClientId,
      isPublic: body.isPublic ?? true,
      preset: (body.preset as MatchPreset) || '1P_3PC',
      deckConfig: body.deckConfig,
    });

    return NextResponse.json({ room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore operazione lobby';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

