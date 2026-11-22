// BRANKAS — Deck Heist. Input: mouse clicks and keyboard, wired by delegation
// so the renderer can rebuild the hand freely. No game logic lives here.
export function createInput(root, actions) {
  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-uid], [data-draft], [data-crew], [data-relic], button');
    if (!target) return;
    if (target.dataset.uid) actions.onPlayCard(Number(target.dataset.uid));
    else if (target.dataset.draft) actions.onDraft(target.dataset.draft);
    else if (target.dataset.crew) actions.onCrew(target.dataset.crew);
    else if (target.dataset.relic) actions.onTakeRelic(target.dataset.relic);
    else if (target.id === 'start-btn') actions.onStart();
    else if (target.id === 'again-btn') actions.onRestart();
    else if (target.id === 'end-turn-btn') actions.onEndTurn();
    else if (target.id === 'pause-btn') actions.onPause();
    else if (target.id === 'resume-btn') actions.onResume();
    else if (target.id === 'restart-btn') actions.onRestart();
    else if (target.id === 'title-btn') actions.onTitle();
    else if (target.id === 'mute-btn') actions.onMute();
    else if (target.id === 'shop-heal') actions.onShopHeal();
    else if (target.id === 'shop-buy') actions.onShopBuy();
    else if (target.id === 'shop-remove') actions.onShopRemove();
    else if (target.id === 'proceed-btn') actions.onProceed();
    else if (target.id === 'howto-btn') {
      const howto = root.querySelector('#howto');
      if (howto) howto.classList.toggle('hidden');
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('[data-uid], [data-draft], [data-crew], [data-relic]')) {
      event.target.click();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') actions.onPause();
    else if (event.key === 'm' || event.key === 'M') actions.onMute();
    else if (event.key === ' ' || event.key === 'Enter') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
      event.preventDefault();
      actions.onConfirm();
    } else if (/^[1-9]$/.test(event.key)) {
      actions.onPlayIndex(Number(event.key) - 1);
    }
  });
}
