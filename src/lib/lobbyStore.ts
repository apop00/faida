import fs from 'fs';
import path from 'path';
import {
  createInitialGameState,
  gameReducer,
  SUITS,
  SUIT_INFO,
} from '@/lib/gameEngine';
import {
  CustomDeckConfig,
  GameAction,
  LobbyRoom,
  LobbySlot,
  MatchPreset,
} from '@/types/game';

const PRESET_AI_FLAGS: Record<MatchPreset, boolean[]> = {
  '1P_3PC': [false, true, true, true],
  '2P_2PC': [false, false, true, true],
  '3P_1PC': [false, false, false, true],
  '4P_0PC': [false, false, false, false],
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

class LobbyStore {
  private rooms: Map<string, LobbyRoom> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private getRedisConfig(): { url: string; token: string } | null {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token) {
      return { url: url.replace(/\/+$/, ''), token };
    }
    return null;
  }

  private async syncFromStore(): Promise<void> {
    const redis = this.getRedisConfig();
    if (redis) {
      try {
        const res = await fetch(`${redis.url}/get/colpo_basso_lobbies`, {
          headers: { Authorization: `Bearer ${redis.token}` },
          cache: 'no-store',
        });
        const data = await res.json();
        if (data && data.result) {
          const parsed: [string, LobbyRoom][] =
            typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          this.rooms = new Map(parsed);
          return;
        }
      } catch {
        // Fallback to local disk
      }
    }
    this.loadFromDisk();
  }

  private async syncToStore(): Promise<void> {
    this.saveToDisk();
    const redis = this.getRedisConfig();
    if (redis) {
      try {
        const entries = Array.from(this.rooms.entries());
        await fetch(`${redis.url}/set/colpo_basso_lobbies`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redis.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(entries)),
        });
      } catch {
        // Ignore
      }
    }
  }

  private getFilePath(): string {
    const baseDir = process.env.VERCEL ? '/tmp' : process.cwd();
    const dir = path.join(baseDir, '.data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fallback to /tmp if process.cwd() is read-only
        const tmpDir = path.join('/tmp', '.data');
        try {
          fs.mkdirSync(tmpDir, { recursive: true });
          return path.join(tmpDir, 'lobbies.json');
        } catch {
          // Ignore
        }
      }
    }
    return path.join(dir, 'lobbies.json');
  }

  private loadFromDisk() {
    try {
      const file = this.getFilePath();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        if (raw.trim()) {
          const parsed: [string, LobbyRoom][] = JSON.parse(raw);
          this.rooms = new Map(parsed);
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  private saveToDisk() {
    try {
      const file = this.getFilePath();
      const data = Array.from(this.rooms.entries());
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Ignore write errors
    }
  }

  public async getPublicRooms(): Promise<LobbyRoom[]> {
    await this.syncFromStore();
    const now = Date.now();
    const list: LobbyRoom[] = [];
    for (const room of this.rooms.values()) {
      const ageMinutes = (now - new Date(room.updatedAt).getTime()) / 60000;
      if (ageMinutes > 120) continue;
      if (room.isPublic) {
        list.push(room);
      }
    }
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getRoom(code: string): Promise<LobbyRoom | null> {
    await this.syncFromStore();
    return this.rooms.get(code.trim().toUpperCase()) || null;
  }

  public async createRoom(params: {
    roomName: string;
    hostName: string;
    hostClientId: string;
    isPublic: boolean;
    preset: MatchPreset;
    deckConfig?: CustomDeckConfig;
  }): Promise<LobbyRoom> {
    await this.syncFromStore();
    let code = generateCode();
    while (this.rooms.has(code)) {
      code = generateCode();
    }

    const aiFlags = PRESET_AI_FLAGS[params.preset] || PRESET_AI_FLAGS['1P_3PC'];
    const slots: LobbySlot[] = SUITS.map((suit, idx) => {
      if (idx === 0) {
        return {
          slotIndex: 0,
          suit,
          name: params.hostName.trim() || 'Host Cuori',
          isAI: false,
          clientPlayerId: params.hostClientId,
          isHost: true,
        };
      }
      const isBot = aiFlags[idx];
      return {
        slotIndex: idx,
        suit,
        name: isBot
          ? `Bot ${SUIT_INFO[suit].name} 🤖`
          : `Attesa ${SUIT_INFO[suit].name}...`,
        isAI: isBot,
        clientPlayerId: null,
        isHost: false,
      };
    });

    const now = new Date().toISOString();
    const room: LobbyRoom = {
      code,
      roomName: params.roomName.trim() || `Tavolo di ${params.hostName || 'Host'}`,
      isPublic: params.isPublic,
      preset: params.preset,
      hostClientId: params.hostClientId,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      slots,
      gameState: null,
      deckConfig: params.deckConfig,
    };

    this.rooms.set(code, room);
    await this.syncToStore();
    return room;
  }

  public async joinRoom(params: {
    code: string;
    playerName: string;
    clientPlayerId: string;
    preferredSlot?: number;
  }): Promise<LobbyRoom> {
    await this.syncFromStore();
    const code = params.code.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error(`Lobby "${code}" non trovata.`);
    }

    // Check if client already has a slot
    const existingSlot = room.slots.find(
      (s) => s.clientPlayerId === params.clientPlayerId
    );
    if (existingSlot) {
      existingSlot.name = params.playerName.trim() || existingSlot.name;
      existingSlot.isAI = false;

      // Allow switching to preferredSlot if open during waiting room phase
      if (
        params.preferredSlot !== undefined &&
        params.preferredSlot !== existingSlot.slotIndex &&
        room.slots[params.preferredSlot] &&
        !room.slots[params.preferredSlot].clientPlayerId &&
        room.status === 'waiting'
      ) {
        existingSlot.clientPlayerId = null;
        existingSlot.name = `Attesa ${SUIT_INFO[existingSlot.suit].name}...`;
        existingSlot.isAI = false;

        const newSlot = room.slots[params.preferredSlot];
        newSlot.clientPlayerId = params.clientPlayerId;
        newSlot.name = params.playerName.trim() || `Giocatore ${newSlot.slotIndex + 1}`;
        newSlot.isAI = false;
      }

      room.updatedAt = new Date().toISOString();
      await this.syncToStore();
      return room;
    }

    // Find an open human slot first, or replace a Bot PC slot if all open slots are filled
    let targetSlot: LobbySlot | undefined;
    if (
      params.preferredSlot !== undefined &&
      room.slots[params.preferredSlot] &&
      !room.slots[params.preferredSlot].clientPlayerId
    ) {
      targetSlot = room.slots[params.preferredSlot];
    } else {
      targetSlot =
        room.slots.find((s) => !s.clientPlayerId && !s.isAI) ||
        room.slots.find((s) => !s.clientPlayerId);
    }

    if (!targetSlot) {
      throw new Error('Tutti i 4 posti della lobby sono già occupati da giocatori umani!');
    }

    targetSlot.clientPlayerId = params.clientPlayerId;
    targetSlot.name =
      params.playerName.trim() || `Giocatore ${targetSlot.slotIndex + 1}`;
    targetSlot.isAI = false;

    // Also update active gameState player name & isAI if already playing
    if (room.gameState && room.gameState.players[targetSlot.slotIndex]) {
      room.gameState.players[targetSlot.slotIndex].name = targetSlot.name;
      room.gameState.players[targetSlot.slotIndex].isAI = false;
      room.gameState.players[targetSlot.slotIndex].clientPlayerId =
        params.clientPlayerId;
    }

    room.updatedAt = new Date().toISOString();
    await this.syncToStore();
    return room;
  }

  public async leaveRoom(params: { code: string; clientPlayerId: string }): Promise<LobbyRoom> {
    await this.syncFromStore();
    const code = params.code.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) throw new Error('Lobby non trovata.');

    const slot = room.slots.find((s) => s.clientPlayerId === params.clientPlayerId);
    if (slot) {
      if (slot.isHost) {
        // If host leaves before game starts, look for another human to promote or delete if empty
        const otherHuman = room.slots.find(
          (s) => s.clientPlayerId && s.clientPlayerId !== params.clientPlayerId
        );
        if (otherHuman) {
          otherHuman.isHost = true;
          room.hostClientId = otherHuman.clientPlayerId!;
          slot.isHost = false;
          slot.clientPlayerId = null;
          slot.name = `Attesa ${SUIT_INFO[slot.suit].name}...`;
        } else {
          // If no other humans left, remove the room
          this.rooms.delete(code);
          await this.syncToStore();
          return room;
        }
      } else {
        slot.clientPlayerId = null;
        slot.name = `Attesa ${SUIT_INFO[slot.suit].name}...`;
        slot.isAI = false;
      }
      room.updatedAt = new Date().toISOString();
      await this.syncToStore();
    }
    return room;
  }

  public async configureSlot(params: {
    code: string;
    slotIndex: number;
    isAI?: boolean;
    name?: string;
    preset?: MatchPreset;
    isPublic?: boolean;
    deckConfig?: CustomDeckConfig;
  }): Promise<LobbyRoom> {
    await this.syncFromStore();
    const room = this.rooms.get(params.code.trim().toUpperCase());
    if (!room) throw new Error('Lobby non trovata.');

    if (params.isPublic !== undefined) {
      room.isPublic = params.isPublic;
    }

    if (params.deckConfig !== undefined) {
      room.deckConfig = params.deckConfig;
    }

    if (params.preset) {
      room.preset = params.preset;
      const flags = PRESET_AI_FLAGS[params.preset];
      room.slots.forEach((slot, idx) => {
        if (idx === 0 && slot.isHost) return;
        const makeBot = flags[idx];
        slot.isAI = makeBot;
        if (makeBot) {
          slot.clientPlayerId = null;
          slot.name = `Bot ${SUIT_INFO[slot.suit].name} 🤖`;
        } else if (!slot.clientPlayerId) {
          slot.name = `Giocatore ${idx + 1} (${SUIT_INFO[slot.suit].name})`;
        }
      });
    } else {
      const slot = room.slots[params.slotIndex ?? 0];
      if (slot) {
        if (params.isAI !== undefined) {
          slot.isAI = params.isAI;
          if (params.isAI) {
            slot.clientPlayerId = null;
            slot.name = `Bot ${SUIT_INFO[slot.suit].name} 🤖`;
          } else {
            slot.name = `Giocatore ${slot.slotIndex + 1} (${SUIT_INFO[slot.suit].name})`;
          }
        }
        if (params.name !== undefined) {
          slot.name = params.name;
        }
      }
    }

    room.updatedAt = new Date().toISOString();
    await this.syncToStore();
    return room;
  }

  public async startRoomGame(code: string): Promise<LobbyRoom> {
    await this.syncFromStore();
    const room = this.rooms.get(code.trim().toUpperCase());
    if (!room) throw new Error('Lobby non trovata.');

    const names = room.slots.map((s, idx) => {
      if (s.isAI) return `Bot ${SUIT_INFO[s.suit].name} 🤖`;
      if (s.name.startsWith('Attesa ')) {
        return `Giocatore ${idx + 1} (${SUIT_INFO[s.suit].name})`;
      }
      return s.name;
    });
    const aiFlags = room.slots.map((s) => s.isAI);

    const initial = createInitialGameState(names, aiFlags, room.deckConfig);
    initial.players = initial.players.map((p, idx) => ({
      ...p,
      clientPlayerId: room.slots[idx]?.clientPlayerId || undefined,
    }));

    room.status = 'playing';
    room.gameState = initial;
    room.updatedAt = new Date().toISOString();
    await this.syncToStore();
    return room;
  }

  public async dispatchGameAction(code: string, action: GameAction): Promise<LobbyRoom> {
    await this.syncFromStore();
    const room = this.rooms.get(code.trim().toUpperCase());
    if (!room || !room.gameState) {
      throw new Error('Partita non attiva per questa lobby.');
    }

    room.gameState = gameReducer(room.gameState, action);
    room.updatedAt = new Date().toISOString();
    await this.syncToStore();
    return room;
  }
}

export const lobbyStore = new LobbyStore();
