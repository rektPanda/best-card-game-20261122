// BRANKAS — Deck Heist. The renderer: every screen is plain DOM, so cards stay
// legible at thumbnail size and clickable with mouse or keyboard. The skeleton
// is built once; each render updates bars, hands and overlays in place.
import { SUITS, ENERGY_PER_TURN } from './config.js';
import { cardById, describeCard, relicById, CREWS } from './cards.js';
import { currentIntent, incomingDamage, levelName, isBossFight, runScore, SHOP_BUY_COST, SHOP_REMOVE_COST } from './world.js';
import { LEVELS } from './enemies.js';

const APP_TITLE_TEXT = 'BRANKAS — DECK HEIST';

function hpBar(hp, maxHp) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return `<div class="hpbar"><div class="hpfill" style="width:${pct}%"></div><span>${Math.max(0, hp)} / ${maxHp}</span></div>`;
}

function suitTag(card) {
  const s = SUITS[card.suit];
  return `<span class="suit-tag" style="color:${s.color}">${s.glyph} ${s.name}</span>`;
}

export function cardHtml(entry, state) {
  const card = cardById(entry.id);
  const s = SUITS[card.suit];
  const affordable = state.energy >= card.cost;
  const chained = state.chainSuit === card.suit && state.chainCount >= 1;
  return `<div class="card suit-${card.suit}${affordable ? ' playable' : ' costly'}${chained ? ' chained' : ''}" data-uid="${entry.uid}" tabindex="0" role="button" aria-label="${card.name}, biaya ${card.cost}, ${describeCard(card)}">
    <div class="card-cost">${card.cost}</div>
    <div class="card-suit" style="color:${s.color}">${s.glyph}<span>${s.name}</span></div>
    <div class="card-art" style="color:${s.color};border-color:${s.color}">${s.glyph}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-text">${describeCard(card)}</div>
    ${chained ? `<div class="card-chain">RANTAI x${state.chainCount + 1}</div>` : ''}
  </div>`;
}

function intentHtml(state) {
  const intent = currentIntent(state);
  if (!intent) return '';
  const kind = intent.type === 'attack' || intent.type === 'double' ? 'atk'
    : intent.type === 'block' ? 'blk' : 'buf';
  const dmg = (intent.type === 'attack' || intent.type === 'double') ? incomingDamage(state) : null;
  const text = dmg !== null ? `${intent.label.split(' ')[0].toUpperCase()} ${dmg}` : intent.label.toUpperCase();
  return `<div class="intent ${kind}"><div class="intent-label">GERAKAN BERIKUTNYA</div><div class="intent-text">${text}</div></div>`;
}

export function createRenderer(root) {
  root.innerHTML = `
    <header id="hud">
      <div class="hud-left"><span class="logo">BRANKAS</span><span id="hud-level" class="hud-level"></span></div>
      <div class="hud-mid"><span class="hud-label">KRU</span><span id="hud-hp"></span><span id="hud-block" class="hud-block"></span></div>
      <div class="hud-right">
        <span class="hud-gold" title="Emas jarahan">◆ <b id="hud-gold">0</b></span>
        <span class="hud-deck" title="Deck / Buangan">🂠 <b id="hud-deck">0</b> / <b id="hud-discard">0</b></span>
        <button id="mute-btn" class="hud-btn" title="Suara (M)">♪</button>
        <button id="pause-btn" class="hud-btn" title="Jeda (Esc)">II</button>
      </div>
    </header>
    <main id="stage">
      <section id="enemy-zone"></section>
      <section id="table-zone">
        <div id="relics"></div>
        <div id="combo-meter"></div>
        <div id="log"></div>
      </section>
      <section id="hand-zone">
        <div id="hand-controls">
          <span id="energy-pips" class="energy-pips"></span>
          <button id="end-turn-btn" class="btn gold">AKHIRI GILIRAN ⏎</button>
        </div>
        <div id="hand"></div>
      </section>
    </main>
    <div id="overlay" class="hidden"></div>
    <div id="status" class="sr-only" aria-live="polite"></div>`;

  const el = (id) => root.querySelector(`#${id}`);
  const hud = { level: el('hud-level'), hp: el('hud-hp'), block: el('hud-block'), gold: el('hud-gold'), deck: el('hud-deck'), discard: el('hud-discard') };
  const enemyZone = el('enemy-zone');
  const comboMeter = el('combo-meter');
  const relicsEl = el('relics');
  const logEl = el('log');
  const handEl = el('hand');
  const energyEl = el('energy-pips');
  const endTurnBtn = el('end-turn-btn');
  const overlay = el('overlay');
  const statusEl = el('status');
  let lastScreen = null;
  let lastEnemyId = null;
  let lastEnemyHp = null;

  function renderEnemy(state) {
    const enemy = state.enemy;
    if (!enemy) { enemyZone.innerHTML = '<div class="enemy-empty">Tidak ada musuh.</div>'; lastEnemyId = null; return; }
    const shaken = lastEnemyHp !== null && enemy.hp < lastEnemyHp && lastEnemyId === enemy.id;
    if (lastEnemyId !== enemy.id) {
      enemyZone.innerHTML = `<div class="enemy${isBossFight(state) ? ' boss' : ''}" id="enemy-panel">
        <div class="enemy-glyph" style="color:${enemy.color}">${enemy.glyph}</div>
        <div class="enemy-info">
          <div class="enemy-name">${enemy.name}${isBossFight(state) ? ' <span class="boss-tag">BOS</span>' : ''}</div>
          <div class="enemy-title">${enemy.title}</div>
          ${enemy.power ? `<div class="enemy-power">${enemy.power}</div>` : ''}
          <div id="enemy-hp"></div>
          <div id="enemy-status" class="enemy-status"></div>
        </div>
        <div id="enemy-intent"></div>
      </div>`;
      lastEnemyId = enemy.id;
    }
    const panel = root.querySelector('#enemy-panel');
    if (panel) {
      if (shaken) { panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake'); }
      root.querySelector('#enemy-hp').innerHTML = hpBar(enemy.hp, enemy.maxHp);
      const status = [];
      if (enemy.block > 0) status.push(`Blok ${enemy.block}`);
      if (enemy.poison > 0) status.push(`Racun ${enemy.poison}`);
      if (enemy.burn > 0) status.push(`Bakar ${enemy.burn}`);
      if (enemy.weaken > 0) status.push(`Lemah ${enemy.weaken}`);
      if (enemy.buff > 0) status.push(`Kuat +${enemy.buff}`);
      if (enemy.stunned) status.push('Diam!');
      root.querySelector('#enemy-status').textContent = status.join(' · ') || '—';
      root.querySelector('#enemy-intent').innerHTML = intentHtml(state);
    }
    lastEnemyHp = enemy.hp;
  }

  function renderHand(state) {
    // Fan the hand: overlap only as much as needed to fit the row.
    const n = state.hand.length;
    const overlap = n > 1 ? Math.max(0, Math.ceil((n * 148 + 16 - 1220) / (n - 1))) : 0;
    handEl.innerHTML = state.hand.map((entry, i) => {
      const html = cardHtml(entry, state);
      if (i === 0 || overlap === 0) return html;
      return html.replace('data-uid=', `style="margin-left:-${overlap}px" data-uid=`);
    }).join('') || '<div class="hand-empty">Tangan kosong.</div>';
    let pips = '';
    for (let i = 0; i < ENERGY_PER_TURN + 2; i += 1) {
      if (i < state.energy) pips += '<span class="pip on">●</span>';
      else if (i < ENERGY_PER_TURN) pips += '<span class="pip">○</span>';
    }
    energyEl.innerHTML = `<span class="energy-label">ENERGI</span> ${pips}`;
    endTurnBtn.disabled = state.screen !== 'fight';
  }

  function renderOverlay(state, ui) {
    const show = (html) => { overlay.innerHTML = html; overlay.classList.remove('hidden'); };
    const hide = () => { overlay.classList.add('hidden'); overlay.innerHTML = ''; };
    if (ui.paused && (state.screen === 'fight' || state.screen === 'draft')) {
      show(`<div class="panel"><h1>JEDA</h1><p class="sub">Istirahat sebentar. Penjaga tidak curiga… belum.</p>
        <div class="btn-row"><button class="btn gold" id="resume-btn">LANJUTKAN</button>
        <button class="btn" id="restart-btn">MULAI ULANG</button>
        <button class="btn" id="title-btn">MENU UTAMA</button></div></div>`);
      return;
    }
    if (state.screen === 'title') {
      const best = ui.bestScore > 0 ? `<p class="best">Skor terbaik: ${ui.bestScore} (emas terbaik ◆ ${ui.best})</p>` : '';
      show(`<div class="panel title-panel">
        <div class="title-kicker">ROGUELIKE KARTU PERAMPOKAN</div>
        <h1 class="title">BRANKAS</h1>
        <p class="sub">Bangun deck pencuri, rantai kartu sesuit, dan bobol tiga heist — toko emas, kasino, museum berlian — sebelum kru tertangkap.</p>
        <div class="heist-list">${LEVELS.map((l, i) => `<div class="heist-card"><b>HEIST ${i + 1}</b><span>${l.name.split('— ')[1]}</span></div>`).join('')}</div>
        <div class="crew-row">${CREWS.map((c) => `<div class="crew-card${ui.crew === c.id ? ' selected' : ''}" data-crew="${c.id}" tabindex="0" role="button" aria-label="${c.name}">
          <div class="crew-glyph" style="color:${c.color}">${c.glyph}</div>
          <b>${c.name}</b><span>${c.desc}</span></div>`).join('')}</div>
        <p class="facts">44 kartu unik · 9 musuh · 6 relik · kombo RANTAI &amp; SILANG · draft &amp; toko tiap heist</p>
        ${best}
        <div class="btn-row"><button class="btn gold big" id="start-btn">MULAI HEIST</button>
        <button class="btn big" id="howto-btn">CARA MAIN</button></div>
        <div id="howto" class="howto hidden">
          <p><b>Energi:</b> 3 tiap giliran. Kartu butuh energi sesuai angka di pojok kiri atas.</p>
          <p><b>RANTAI:</b> mainkan kartu sesuit berturut-turut dalam satu giliran — kartu ke-2 +1, ke-3 +2, dan seterusnya untuk serang &amp; blok.</p>
          <p><b>SILANG:</b> mainkan suit berbeda tepat setelah suit lain — sekali tiap giliran, +1 energi.</p>
          <p><b>Musuh:</b> gerakan berikutnya selalu terlihat. Blok saat ia menyerang, serang saat ia bersiaga. Tiap bos punya kuasa unik.</p>
          <p><b>Menang:</b> kalahkan 9 musuh termasuk 3 bos. Tiap menang, pilih 1 dari 3 kartu baru; tiap bos, pilih 1 relik dan belanja di persinggahan.</p>
          <p><b>Tombol:</b> klik kartu untuk main, 1–9 pilih kartu, Spasi akhiri giliran, Esc jeda, M suara.</p>
        </div>
      </div>`);
      return;
    }
    if (state.screen === 'draft') {
      show(`<div class="panel"><h1>JARAHAN!</h1>
        <p class="sub">${state.pendingLevelEnd ? 'Bos tumbang. ' : ''}Pilih 1 kartu untuk deck-mu.</p>
        <div class="draft-row">${state.draft.map((id) => {
          const card = cardById(id);
          return `<div class="card suit-${card.suit} draft-card" data-draft="${id}" tabindex="0" role="button" aria-label="${card.name}, ${describeCard(card)}">
            <div class="card-cost">${card.cost}</div>
            <div class="card-suit" style="color:${SUITS[card.suit].color}">${SUITS[card.suit].glyph}<span>${SUITS[card.suit].name}</span></div>
            <div class="card-art" style="color:${SUITS[card.suit].color};border-color:${SUITS[card.suit].color}">${SUITS[card.suit].glyph}</div>
            <div class="card-name">${card.name}</div><div class="card-text">${describeCard(card)}</div></div>`;
        }).join('')}</div>
        <p class="facts">Deck sekarang: ${state.deck.length} kartu · Emas: ◆ ${state.gold}</p></div>`);
      return;
    }
    if (state.screen === 'level') {
      const relicHtml = state.levelRelicTaken
        ? `<p class="facts">Relik diambil: ${state.relics.map((id) => relicById(id).name).join(', ')}</p>`
        : `<div class="relic-row">${state.levelRelics.map((id) => {
          const r = relicById(id);
          return `<div class="relic-card" data-relic="${id}" tabindex="0" role="button" aria-label="${r.name}, ${r.desc}">
            <div class="relic-glyph">✦</div><b>${r.name}</b><span>${r.desc}</span></div>`;
        }).join('')}</div>`;
      show(`<div class="panel"><h1>${levelName(state)} SELESAI!</h1>
        <p class="sub">Bos tumbang. Persinggahan: ambil satu relik, belanja, lalu lanjut.</p>
        ${relicHtml}
        <div class="btn-row">
          <button class="btn" id="shop-heal" ${state.levelHealed ? 'disabled' : ''}>ISTIRAHAT · +10 HP</button>
          <button class="btn" id="shop-buy" ${state.gold < SHOP_BUY_COST ? 'disabled' : ''}>BELI KARTU ACAK · ◆ ${SHOP_BUY_COST}</button>
          <button class="btn" id="shop-remove" ${state.gold < SHOP_REMOVE_COST || state.deck.length <= 10 ? 'disabled' : ''}>HAPUS KARTU TERLEMAH · ◆ ${SHOP_REMOVE_COST}</button>
        </div>
        <div class="btn-row"><button class="btn gold big" id="proceed-btn">LANJUT KE HEIST BERIKUTNYA</button></div>
        <p class="facts">HP ${Math.max(0, state.hp)} / ${state.maxHp} · Emas ◆ ${state.gold} · Deck ${state.deck.length} kartu${state.relics.length ? ` · Relik: ${state.relics.map((id) => relicById(id).name).join(', ')}` : ''}</p></div>`);
      return;
    }
    if (state.screen === 'win') {
      const score = runScore(state);
      show(`<div class="panel"><div class="title-kicker">SEMUA HEIST BERHASIL</div><h1 class="win">HEIST BERHASIL!</h1>
        <p class="sub">Berlian museum sudah di tangan. Kru pulang kaya — dan tak satu pun penjaga tahu siapa kalian.</p>
        <div class="score-line">SKOR <b>${score}</b></div>
        <div class="stats">
          <div><b>◆ ${state.gold}</b><span>emas dijarah</span></div>
          <div><b>${state.stats.fightsWon}</b><span>musuh dikalahkan</span></div>
          <div><b>${state.stats.turns}</b><span>giliran</span></div>
          <div><b>${state.stats.cardsPlayed}</b><span>kartu dimainkan</span></div>
          <div><b>${state.stats.damageDealt}</b><span>damage total</span></div>
          <div><b>${state.deck.length}</b><span>kartu di deck</span></div>
        </div>
        <p class="facts">Kru: ${state.crew.name} · Relik: ${state.relics.map((id) => relicById(id).name).join(', ') || '—'}${ui.bestScore > 0 ? ` · Skor terbaik: ${ui.bestScore}` : ''}</p>
        <div class="btn-row"><button class="btn gold big" id="again-btn">MAIN LAGI</button></div></div>`);
      return;
    }
    if (state.screen === 'lose') {
      show(`<div class="panel"><div class="title-kicker">KRU TERTANGKAP</div><h1 class="lose">TERTANGKAP!</h1>
        <p class="sub">Sirene meraung, pintu terkunci. Heist berakhir di ${levelName(state)} — pertarungan ${state.fightIndex + 1}.</p>
        <div class="stats">
          <div><b>◆ ${state.gold}</b><span>emas dijarah</span></div>
          <div><b>${state.stats.fightsWon} / 9</b><span>musuh dikalahkan</span></div>
          <div><b>${state.stats.turns}</b><span>giliran bertahan</span></div>
          <div><b>${state.stats.damageDealt}</b><span>damage total</span></div>
          <div><b>${state.deck.length}</b><span>kartu di deck</span></div>
        </div>
        <div class="btn-row"><button class="btn gold big" id="again-btn">COBA LAGI</button>
        <button class="btn" id="title-btn">MENU UTAMA</button></div></div>`);
      return;
    }
    hide();
  }

  function render(state, ui) {
    hud.level.textContent = state.screen === 'title' ? APP_TITLE_TEXT : `${state.crew.name} · ${levelName(state)} · LAWAN ${state.fightIndex + 1}/3`;
    hud.hp.innerHTML = hpBar(state.hp, state.maxHp);
    hud.block.textContent = state.block > 0 ? `Blok ${state.block}` : '';
    hud.gold.textContent = state.gold;
    hud.deck.textContent = state.drawPile.length;
    hud.discard.textContent = state.discardPile.length;
    if (state.screen === 'fight') {
      renderEnemy(state);
      renderHand(state);
      relicsEl.innerHTML = state.relics.length
        ? `<span class="relics-label">RELIK:</span> ${state.relics.map((id) => `<span class="relic-chip" title="${relicById(id).desc}">✦ ${relicById(id).name}</span>`).join(' ')}`
        : '';
      comboMeter.innerHTML = state.chainCount >= 2
        ? `<span class="combo on" style="color:${SUITS[state.chainSuit].color}">RANTAI x${state.chainCount} ${SUITS[state.chainSuit].glyph} ${SUITS[state.chainSuit].name}</span>`
        : '<span class="combo">Mainkan kartu sesuit berturut-turut untuk RANTAI</span>';
      logEl.innerHTML = state.log.map((l) => `<div>${l}</div>`).join('');
    } else {
      if (state.screen === 'draft' || state.screen === 'level') {
        enemyZone.innerHTML = '<div class="enemy-empty">Musuh dikalahkan — jarahan menanti.</div>';
      } else if (state.screen !== 'fight') {
        enemyZone.innerHTML = '';
      }
      handEl.innerHTML = '';
      energyEl.innerHTML = '';
      endTurnBtn.disabled = true;
    }
    renderOverlay(state, ui);
    lastScreen = state.screen;
  }

  function announce(message) {
    statusEl.textContent = message;
  }

  /** A played card flies from the hand toward the enemy, then vanishes. */
  function playGhost(card, fromRect) {
    const enemyPanel = root.querySelector('#enemy-panel');
    if (!enemyPanel || !fromRect) return;
    const toRect = enemyPanel.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = `card suit-${card.suit} ghost`;
    ghost.innerHTML = `<div class="card-cost">${card.cost}</div>
      <div class="card-art" style="color:${SUITS[card.suit].color};border-color:${SUITS[card.suit].color}">${SUITS[card.suit].glyph}</div>
      <div class="card-name">${card.name}</div>`;
    ghost.style.left = `${fromRect.left}px`;
    ghost.style.top = `${fromRect.top}px`;
    ghost.style.width = `${fromRect.width}px`;
    ghost.style.height = `${fromRect.height}px`;
    document.body.appendChild(ghost);
    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
    ghost.animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(0.7) rotate(8deg)`, opacity: 0.2 }],
      { duration: 320, easing: 'ease-in' },
    ).onfinish = () => ghost.remove();
  }

  return { render, announce, playGhost };
}
