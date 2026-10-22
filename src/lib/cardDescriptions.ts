import { Card, Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';

export interface CardDetailInfo {
  title: string;
  category: 'ATTACCO' | 'DIFESA' | 'FIGURA' | 'EVENTO' | 'SCARTO';
  categoryColor: string; // Tailwind color class
  tagline: string;
  effect: string;
  defenseInfo?: string;
  sipsInfo?: string;
  colpoFinaleValid: boolean;
  funFact: string;
}

export function getCardDetails(card: Card, playerSuit?: Suit): CardDetailInfo {
  const suitMeta = SUIT_INFO[card.suit];
  const isOwnSuit = playerSuit ? card.suit === playerSuit : false;

  // 1. CARTE EVENTO
  if (card.eventKind) {
    switch (card.eventKind) {
      case 'DIRECT_SIPS':
        return {
          title: `SORSO DIRETTO (${card.sipsAmount}🍺)`,
          category: 'EVENTO',
          categoryColor: 'bg-amber-500 text-slate-950',
          tagline: 'Colpo basso a tradimento sul seme a terra!',
          effect: `Infligge istantaneamente ${card.sipsAmount} ${card.sipsAmount === 1 ? 'sorso' : 'sorsi'} al proprietario del seme che si trova attualmente a terra. Si scarta da sola (1 carta singola)!`,
          defenseInfo: 'Non si para con carte normali! L\'unica difesa possibile è lo SPECCHIO (🪞).',
          sipsInfo: `${card.sipsAmount}🍺 diretti`,
          colpoFinaleValid: false,
          funFact: 'Perfetto quando l\'avversario si sente al sicuro pensando che tocca a qualcun altro.',
        };

      case 'MIRROR':
        return {
          title: 'SPECCHIO RIFLETTENTE (🪞)',
          category: 'DIFESA',
          categoryColor: 'bg-fuchsia-500 text-white',
          tagline: 'Chi la fa l\'aspetti: il boomerang della serata!',
          effect: 'Riflette qualsiasi Attacco o Sorso Diretto direttamente indietro all\'aggressore, RADDOPPIANDO i sorsi in palio (x2)!',
          defenseInfo: 'È la difesa suprema: non può essere contrastata, l\'aggressore deve bere il doppio.',
          sipsInfo: 'Raddoppia i sorsi (x2)',
          colpoFinaleValid: false,
          funFact: 'La carta che trasforma un attacco spavaldo da 3 sorsi in un boomerang letale da 6 sorsi!',
        };

      case 'STOP_SUIT':
        return {
          title: `CARTELLINO ROSSO - STOP (🛑 ${suitMeta.symbol})`,
          category: 'DIFESA',
          categoryColor: 'bg-rose-500 text-white',
          tagline: 'Il paracolpi supremo: ferma ogni attacco a 0 sorsi!',
          effect: 'In difesa: annulla completamente qualsiasi attacco subito a costo ZERO (0 sorsi)! Nel proprio turno si scarta pacificamente stabilendo una tregua.',
          defenseInfo: 'Usata in difesa cancella l\'attacco all\'istante senza subire penalità o sorsi.',
          sipsInfo: '0 sorsi (annulla)',
          colpoFinaleValid: false,
          funFact: 'Ognuno ne ha uno garantito a inizio partita come scudo difensivo personale!',
        };

      case 'SKIP_TURN':
        return {
          title: `SALTA TURNO (⏭️ ${suitMeta.symbol})`,
          category: 'EVENTO',
          categoryColor: 'bg-amber-500 text-slate-950',
          tagline: 'Non cumulabile: battibile solo con lo Specchio!',
          effect: 'Fa saltare immediatamente il turno all\'avversario successivo! I Salta Turno non sono cumulabili (non si può rispondere con un altro Salta Turno): SOLO lo Specchio (🪞) può rispondere riflettendolo indietro!',
          defenseInfo: 'Se subisci un Salta Turno, puoi giocare SOLO la carta Specchio (🪞) per farlo rimbalzare su chi te l\'ha lanciato.',
          colpoFinaleValid: false,
          funFact: 'Chi subisce un Salta Turno prega di avere uno Specchio per servire la vendetta!',
        };

      case 'REVERSE_SUIT':
        return {
          title: `CAMBIO GIRO (🔄 ${suitMeta.symbol})`,
          category: 'EVENTO',
          categoryColor: 'bg-cyan-500 text-slate-950',
          tagline: 'Inverte il senso di rotazione del tavolo!',
          effect: 'Ribalta l\'ordine di gioco (da orario ad antiorario o viceversa). Chi stava per tirare un sospiro di sollievo si ritrova subito di turno!',
          colpoFinaleValid: false,
          funFact: 'L\'arma preferita per salvare un compagno o incastrare il vicino di destra.',
        };

      case 'TAX_RICH':
        return {
          title: 'TASSA SUI RICCHI (📉)',
          category: 'EVENTO',
          categoryColor: 'bg-amber-400 text-slate-950',
          tagline: 'La patrimoniale del mazzo: ferma il leader!',
          effect: 'Il giocatore con MENO CARTE in mano al tavolo in quel momento deve pescare +2 carte e bere 1 sorso!',
          sipsInfo: '1🍺 + 2🃏 al leader',
          colpoFinaleValid: false,
          funFact: 'Quando qualcuno ha solo 1 carta e pregusta la vittoria, questa carta lo rimette in riga.',
        };

      case 'DUEL_HIGH':
        return {
          title: 'DUELLO CARTA ALTA (⚔️▲)',
          category: 'EVENTO',
          categoryColor: 'bg-rose-600 text-white',
          tagline: 'Sfida 1 contro 1 a chi estrae il numero più alto!',
          effect: 'Scegli un avversario. Il mazzo estrae 1 carta numerica (2-10) per ciascuno: chi estrae il numero più basso perde e DEVE BERE 2 SORSI! (In parità 1 sorso a testa).',
          sipsInfo: '2🍺 a chi perde',
          colpoFinaleValid: false,
          funFact: 'Suspense pura: le carte vengono rivelate una alla volta al tavolo!',
        };

      case 'DUEL_LOW':
        return {
          title: 'DUELLO CARTA BASSA (⚔️▼)',
          category: 'EVENTO',
          categoryColor: 'bg-cyan-600 text-white',
          tagline: 'Sfida 1 contro 1 al limbo: chi fa meno vince!',
          effect: 'Scegli un avversario. Il mazzo estrae 1 carta numerica (2-10) per ciascuno: chi estrae il numero più ALTO perde e DEVE BERE 2 SORSI!',
          sipsInfo: '2🍺 a chi perde',
          colpoFinaleValid: false,
          funFact: 'Un 2 è la carta degli dei in questo duello al ribasso.',
        };

      case 'SUPER_DUEL_HIGH':
        return {
          title: 'SUPER DUELLO TUTTI - ALTA (💥▲)',
          category: 'EVENTO',
          categoryColor: 'bg-amber-500 text-slate-950',
          tagline: 'Rissa generale al tavolo!',
          effect: 'Tutti e 4 i giocatori estraggono 1 carta numerica (2-10) dal mazzo contemporaneamente: il giocatore con il numero più basso perde e beve 2 sorsi!',
          sipsInfo: '2🍺 al peggiore',
          colpoFinaleValid: false,
          funFact: 'Quattro carte sul tavolo, un solo sfortunato che deve svuotare il bicchiere.',
        };

      case 'SUPER_DUEL_LOW':
        return {
          title: 'SUPER DUELLO TUTTI - BASSA (💥▼)',
          category: 'EVENTO',
          categoryColor: 'bg-purple-600 text-white',
          tagline: 'Il limbo dei 4 semi!',
          effect: 'Tutti e 4 i giocatori estraggono 1 carta numerica (2-10) dal mazzo: chi estrae il numero più ALTO perde e beve 2 sorsi!',
          sipsInfo: '2🍺 al peggiore',
          colpoFinaleValid: false,
          funFact: 'Chi pesca un 10 si mette le mani nei capelli.',
        };

      case 'PASS_RIGHT':
        return {
          title: 'SCAMBIO A DESTRA (🫱)',
          category: 'EVENTO',
          categoryColor: 'bg-emerald-500 text-slate-950',
          tagline: 'Gira la ruota: tutti passano 1 carta al vicino!',
          effect: 'Ogni giocatore sceglie 1 carta dalla propria mano e la cede al compagno alla propria destra. Un modo perfetto per liberarsi di una carta scomoda!',
          colpoFinaleValid: false,
          funFact: 'Regalare un Asso o un Re al compagno che non se lo aspetta non ha prezzo.',
        };

      case 'RED_DRAW_2':
        return {
          title: 'MALEDIZIONE DEI ROSSI (♥♦+2)',
          category: 'EVENTO',
          categoryColor: 'bg-rose-500 text-white',
          tagline: 'Cuori e Quadri sotto tiro!',
          effect: 'I giocatori delle fazioni Cuori (♥) e Quadri (♦) devono pescare 2 carte ciascuno dal mazzo!',
          colpoFinaleValid: false,
          funFact: 'I neri ringraziano e brindano alla salute dei rossi.',
        };

      case 'BLACK_DRAW_2':
        return {
          title: 'MALEDIZIONE DEI NERI (♣♠+2)',
          category: 'EVENTO',
          categoryColor: 'bg-slate-700 text-cyan-200',
          tagline: 'Fiori e Picche sotto tiro!',
          effect: 'I giocatori delle fazioni Fiori (♣) e Picche (♠) devono pescare 2 carte ciascuno dal mazzo!',
          colpoFinaleValid: false,
          funFact: 'La vendetta perfetta contro il blocco nero.',
        };

      case 'ALL_DRAW_1':
        return {
          title: 'BRINDISI DI CARTE (🃏+1)',
          category: 'EVENTO',
          categoryColor: 'bg-violet-500 text-white',
          tagline: 'Carte per tutti: nessuno escluso!',
          effect: 'Tutti e 4 i giocatori al tavolo pescano 1 carta dal mazzo. Rallenta la partita per chi stava per chiudere!',
          colpoFinaleValid: false,
          funFact: 'Democrazia alcolica: un regalo equo per tutto il tavolo.',
        };
    }
  }

  // 2. FIGURE E ASSI (A, J, Q, K)
  if (card.value === 1) {
    return {
      title: `ASSO (${card.label}${suitMeta.symbol}) – CASCATA DI SEMI`,
      category: 'FIGURA',
      categoryColor: 'bg-emerald-500 text-slate-950',
      tagline: 'Chi ha il seme si salva, gli altri pagano caro!',
      effect: `Innesca una Cascata al tavolo sul seme ${suitMeta.name} (${suitMeta.symbol}). A partire dal giocatore successivo, chi ha carte di questo seme deve scartarne una. Chi non ne ha o si ferma beve 1 sorso per ogni carta accumulata nella catena!`,
      defenseInfo: 'Rispondi calando qualsiasi carta del seme della cascata.',
      sipsInfo: '1🍺 per carta accumulata',
      colpoFinaleValid: false,
      funFact: 'Più è lunga la cascata, più il malcapitato che non ha il seme dovrà bere!',
    };
  }

  if (card.value === 11) {
    return {
      title: `FANTE (${card.label}${suitMeta.symbol}) – SPIA D'ASSALTO`,
      category: 'FIGURA',
      categoryColor: 'bg-cyan-500 text-slate-950',
      tagline: 'Guarda le carte nemiche e colpisci a colpo sicuro!',
      effect: 'Scegli un avversario e sveli interamente la sua mano! Se non si difende, puoi scegliere una carta dalla tua mano e attaccarlo a colpo sicuro.',
      defenseInfo: 'Il bersaglio può difendersi calando a sua volta un Contro-Fante (J) per ribaltare lo spionaggio!',
      colpoFinaleValid: false,
      funFact: 'Vedere la mano dell\'avversario ti permette di sapere esattamente se ha o meno lo Stop!',
    };
  }

  if (card.value === 12) {
    return {
      title: `REGINA (${card.label}${suitMeta.symbol}) – IL FARDELLO REALE`,
      category: 'FIGURA',
      categoryColor: 'bg-purple-500 text-white',
      tagline: 'Pesca obbligatoria per il bersaglio!',
      effect: 'Ordina a un avversario di pescare +2 carte dal mazzo.',
      defenseInfo: `Il bersaglio può rispondere con una Contro-Regina (Q) oppure con la Beffa del 6 (giocando un 6 di ${suitMeta.name}): il 6 azzera le carte su di sé e reindirizza le 2 carte su chiunque altro!`,
      sipsInfo: '+2 carte di penalità',
      colpoFinaleValid: false,
      funFact: 'La Beffa del 6 è il contropiede più velenoso del gioco.',
    };
  }

  if (card.value === 13) {
    return {
      title: `RE (${card.label}${suitMeta.symbol}) – BRINDISI REALE & REGICIDIO`,
      category: 'FIGURA',
      categoryColor: 'bg-amber-500 text-slate-950',
      tagline: 'Brindisi generale... a meno che non ci sia un Regicidio!',
      effect: 'Il Re ordina un Brindisi Reale: tutti gli avversari al tavolo bevono 1 sorso a testa (tranne chi ha giocato il Re)!',
      defenseInfo: 'Se un avversario gioca subito un altro Re (K su K), compie il REGICIDIO: il Brindisi viene annullato e chi ha giocato il primo Re DEVE BERE 5 SORSI!',
      sipsInfo: '1🍺 a tutti / 5🍺 con Regicidio',
      colpoFinaleValid: false,
      funFact: 'Attenzione a dichiararsi Re troppo presto: il Regicidio fa malissimo!',
    };
  }

  // 3. CARTE NUMERICHE (2 - 10)
  if (isOwnSuit) {
    return {
      title: `${card.label} di ${suitMeta.name} (${suitMeta.symbol}) – ATTACCO DI FAZIONE`,
      category: 'ATTACCO',
      categoryColor: 'bg-rose-500 text-white',
      tagline: 'È la tua fazione! Lanci un attacco al tavolo!',
      effect: `Essendo del tuo seme squadra (${suitMeta.symbol}), calata sul tavolo innesca un Attacco Diretto al giocatore successivo per 1 sorso! Se hai altre carte dello stesso numero puoi calare una Coppia (2🍺), Tris (3🍺) o Poker (4🍺)!`,
      defenseInfo: 'Il difensore può fare Contrattacco (-1), Deviazione (+1), Contro-Shock (=), Scudo Alto (>), Specchio (🪞) o Stop (🚫).',
      sipsInfo: '1🍺 (fino a 4🍺 con combo)',
      colpoFinaleValid: true,
      funFact: 'Valida come Colpo Finale: può essere la tua ultima carta per vincere la partita!',
    };
  }

  return {
    title: `${card.label} di ${suitMeta.name} (${suitMeta.symbol}) – CAMBIA CARTA`,
    category: 'SCARTO',
    categoryColor: 'bg-emerald-500 text-slate-950',
    tagline: 'Scarto strategico per cambiare seme sul tavolo',
    effect: `Non è del tuo seme: si usa per collegarsi alla carta a terra (per stesso seme, stesso numero o valore adiacente ±1 circolare K↔A↔2). Non infligge sorsi, ma cambia il seme/numero a terra per mettere in difficoltà gli altri!`,
    defenseInfo: 'Non innesca attacchi, il gioco prosegue normalmente.',
    colpoFinaleValid: true,
    funFact: 'Utile per liberarsi delle carte avversarie e avvicinarsi a zero carte!',
  };
}
