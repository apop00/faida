'use client';

import React from 'react';
import { BookOpen, ShieldAlert, Sparkles, Swords, X } from 'lucide-react';

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="w-full max-w-2xl sm:max-w-3xl max-h-[92vh] sm:max-h-[340px] overflow-y-auto no-scrollbar rounded-3xl bg-[#120b22] border border-white/15 p-3.5 sm:p-4 text-slate-200 relative shadow-2xl">
        <button
          onClick={onClose}
          className="sticky top-0 float-right p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer z-30 transition"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest mb-0.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Regolamento Ufficiale</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-white mb-2">
          Colpo Basso: Faida di Semi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-relaxed">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-black text-amber-400 uppercase mb-1">
              🃏 Setup Iniziale &amp; Colpo Finale
            </h4>
            <p>
              Ogni giocatore guida un seme fisso (♥ Cuori, ♦ Quadri, ♣ Fiori, ♠ Picche) e inizia con{' '}
              <strong>8 carte in mano</strong>, di cui <strong>1 Carta STOP (🚫) garantita</strong> (altri 4 Stop sono nel mazzo).
              <br />
              <strong>Regola Colpo Finale:</strong> Non puoi vincere scartando una carta neutra (&quot;Cambia Carta&quot;, figura o evento): l&apos;<strong>ultima carta</strong> per restare a 0 deve essere obbligatoriamente un <strong>Attacco</strong> o una <strong>Difesa</strong>!
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-black text-rose-400 uppercase mb-1 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              <span>1. Palleggio Neutro (Carte Collegate)</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Obbligo di Collegamento:</strong> Puoi buttare giù una carta <strong>solo se ha lo stesso seme o lo stesso numero</strong> della carta a terra! Se non hai carte collegate, devi premere <strong>Pesca e Passa</strong>.
              </li>
              <li>
                <strong>Innesco Attacco (Tuo Seme di Squadra collegato):</strong> 1 carta del tuo seme = <strong>1 sorso</strong>. Puoi calare anche carte uguali in combo (Coppia = <strong>2🍺</strong>, Tris = <strong>3🍺</strong>, Poker = <strong>4🍺</strong>) purché includano il tuo seme e siano collegate alla carta a terra!
              </li>
              <li>
                <strong>Cambia Carta (Scarto di Collegamento):</strong> Carta NON del tuo seme ma collegata per seme o numero alla carta a terra (0 sorsi, cambia il seme/numero sul tavolo).
              </li>
              <li>
                <strong>Figure e Assi (A, J, Q, K):</strong> Giocabili solo se hanno lo stesso seme o valore della carta a terra.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-black text-cyan-400 uppercase mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>2. Catena di Attacco (Difesa)</span>
            </h4>
            <p className="mb-1 text-slate-300">
              La sequenza è circolare: <strong>K (13) ↔ A (1) ↔ 2</strong>.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Contrattacco (-1):</strong> Rimanda i sorsi indietro all&apos;attaccante (se stesso seme: <strong>raddoppia i sorsi x2 senza limite</strong>!).
              </li>
              <li>
                <strong>Deviazione (+1):</strong> Passa i sorsi in avanti (se stesso seme: <strong>raddoppia i sorsi x2 senza limite</strong>!).
              </li>
              <li>
                <strong>Contro-Shock (= Stesso Numero):</strong> Stallo! Attaccante e difensore bevono 1 sorso a testa.
              </li>
              <li>
                <strong>Scudo Alto (Stesso Seme + Valore Più Alto):</strong> Blocca l&apos;attacco (0 sorsi) solo se la tua carta dello stesso seme è <strong>più alta</strong> di quella d&apos;attacco!
              </li>
              <li>
                <strong>Stop (🛑):</strong> Annulla subito qualsiasi attacco nemico a costo ZERO (0 sorsi)! Nel proprio turno si scarta come tregua senza saltare nessuno.
              </li>
              <li>
                <strong>Specchio (🪞):</strong> Riflette qualsiasi attacco indietro al mittente <strong>raddoppiando i sorsi (x2)</strong>! Funziona anche per rispedire al mittente i <strong>Sorsi Diretti</strong> e i <strong>Salta Turno</strong>!
              </li>
              <li>
                <strong>Incasso (Bevi):</strong> Bevi i sorsi accumulati e peschi 1 carta di penalità.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-black text-purple-400 uppercase mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Figure e Assi (Auto-Risoluzione)</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Fante (J) – Spionaggio:</strong> Svela subito la mano del bersaglio (a meno che non abbia un altro J per ribaltare).
              </li>
              <li>
                <strong>Regina (Q) – Il Fardello:</strong> Il bersaglio pesca +2 carte (o risponde con Q / 6 dello stesso seme).
              </li>
              <li>
                <strong>Re (K) – Brindisi Reale:</strong> 1 sorso a tutti tranne a chi lo ha giocato. Se un avversario cala subito un altro Re, il Brindisi viene annullato ed è <strong>Regicidio: 5 sorsi</strong> solo per chi ha messo il primo Re!
              </li>
              <li>
                <strong>Asso (A) – Cascata:</strong> Giro per scartare una carta dello stesso seme dell&apos;Asso. Chi si ferma beve 2 sorsi e pesca 1 carta!
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-black text-emerald-400 uppercase mb-1 flex items-center gap-1.5">
              <span>⚡ 4. Carte Evento Speciali &amp; Titoli Finali</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Carte Sorso Diretto (4x 1🍺, 4x 2🍺, 2x 3🍺, 1x 5🍺):</strong> Si giocano <strong>da sole (1 carta)</strong> sul seme avversario a terra! (Riflettibili con <strong>Specchio 🪞</strong>).
              </li>
              <li>
                <strong>4x Salta Turno (⏭️):</strong> Fa saltare il turno all&apos;avversario successivo! <strong>Non cumulabile</strong>: solo lo <strong>Specchio (🪞)</strong> può rispondere per farlo rimbalzare al mittente!
              </li>
              <li>
                <strong>2x Specchio (🪞):</strong> Rimanda indietro attacchi (x2 sorsi), Sorsi Diretti e Salta Turno!
              </li>
              <li>
                <strong>1x Tassa sui Ricchi (📉):</strong> Chi ha meno carte in mano pesca <strong>+2 carte</strong> e beve <strong>1 sorso</strong>!
              </li>
              <li>
                <strong>4x Duello 1v1 (2x ⚔️▲ Carta Alta, 2x ⚔️▼ Carta Bassa):</strong> Scegli un avversario; il sistema estrae 1 carta numerica (2–10) a testa: chi perde beve <strong>2 sorsi</strong>!
              </li>
              <li>
                <strong>2x Super Duello con Tutti (1x 💥▲ Alta, 1x 💥▼ Bassa):</strong> Sfida tra tutti e 4 con carte da 2 a 10: chi perde beve <strong>2 sorsi</strong>!
              </li>
              <li>
                <strong>8x Stop (🛑 Paracolpi 0🍺), 4x Cambio Giro (🔄), 1x Scambia a Destra (🫱), Rossi/Neri +2, Tutti +1.</strong>
              </li>
              <li>
                <strong>Titoli &amp; Penitenza Finale:</strong> A fine partita vengono incoronati <strong>🧽 La Spugna</strong>, <strong>🗡️ Il Cecchino</strong>, <strong>🛡️ Il Muro</strong> e chi ha più carte in mano beve <strong>1 Sorso Finale ogni 2 carte rimaste</strong>!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
