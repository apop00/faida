'use client';

import React, { useEffect, useState } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { ColpoBassoArena } from '@/components/ColpoBassoArena';
import { MatchPreset } from '@/types/game';

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'arena'>('home');
  const [arenaProps, setArenaProps] = useState<{
    preset?: MatchPreset;
    playerNames?: string[];
    aiFlags?: boolean[];
    initialOpenLobbyTab?: 'quick' | 'create' | 'join' | null;
  }>({});

  // Auto-switch to arena if user arrived from an invite link (?lobby=CODE or ?code=CODE)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('lobby') || params.get('code');
    if (code) {
      setCurrentScreen('arena');
    }
  }, []);

  if (currentScreen === 'arena') {
    return (
      <ColpoBassoArena
        initialPreset={arenaProps.preset}
        initialPlayerNames={arenaProps.playerNames}
        initialAiFlags={arenaProps.aiFlags}
        initialOpenLobbyTab={arenaProps.initialOpenLobbyTab}
        onBackToHome={() => setCurrentScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      onStartQuickGame={(nickname) => {
        const cleanName = nickname.trim() || 'Giocatore 1';
        setArenaProps({
          preset: '1P_3PC',
          playerNames: [
            cleanName,
            'Bot Quadri 🤖',
            'Bot Fiori 🤖',
            'Bot Picche 🤖',
          ],
          aiFlags: [false, true, true, true],
          initialOpenLobbyTab: null,
        });
        setCurrentScreen('arena');
      }}
      onOpenOnline={(nickname) => {
        const cleanName = nickname.trim() || 'Giocatore 1';
        setArenaProps({
          preset: '1P_3PC',
          playerNames: [
            cleanName,
            'Bot Quadri 🤖',
            'Bot Fiori 🤖',
            'Bot Picche 🤖',
          ],
          aiFlags: [false, true, true, true],
          initialOpenLobbyTab: 'create',
        });
        setCurrentScreen('arena');
      }}
      onStartLocalPreset={(preset, names, flags) => {
        setArenaProps({
          preset,
          playerNames: names,
          aiFlags: flags,
          initialOpenLobbyTab: null,
        });
        setCurrentScreen('arena');
      }}
    />
  );
}
