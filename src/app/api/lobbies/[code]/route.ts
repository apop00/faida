import { NextResponse } from 'next/server';
import { lobbyStore } from '@/lib/lobbyStore';

export async function GET(
  _req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const room = lobbyStore.getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Lobby non trovata' }, { status: 404 });
    }
    return NextResponse.json({ room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore lettura lobby';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await req.json();

    if (body.operation === 'configure') {
      const room = lobbyStore.configureSlot({
        code,
        slotIndex: body.slotIndex ?? 0,
        isAI: body.isAI,
        name: body.name,
        preset: body.preset,
        isPublic: body.isPublic,
        deckConfig: body.deckConfig,
      });
      return NextResponse.json({ room });
    }

    if (body.operation === 'start') {
      const room = lobbyStore.startRoomGame(code);
      return NextResponse.json({ room });
    }

    if (body.operation === 'dispatch' && body.gameAction) {
      const room = lobbyStore.dispatchGameAction(code, body.gameAction);
      return NextResponse.json({ room });
    }

    return NextResponse.json({ error: 'Operazione non valida' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore aggiornamento lobby';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
