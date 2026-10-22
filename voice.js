/* ==========================================================
   MEET THE VOICES: carousel, reveal animation and bio popup
   ========================================================== */
(function () {
  const section = document.getElementById('voices');
  const track = document.getElementById('voicesTrack');
  if (!section || !track) return;

  const cards = [...track.querySelectorAll('.voice-card')];
  const prev = section.querySelector('.voices-prev');
  const next = section.querySelector('.voices-next');
  const dialog = document.getElementById('voiceDialog');
  const dialogPhoto = document.getElementById('voiceDialogPhoto');
  const dialogName = document.getElementById('voiceDialogName');
  const dialogShow = document.getElementById('voiceDialogShow');
  const dialogBio = document.getElementById('voiceDialogBio');

  // If a photo is missing, remove it so the coloured card with the initial shows.
  cards.forEach(card => {
    const img = card.querySelector('.voice-photo img');
    if (!img) return;
    const drop = () => img.remove();
    img.addEventListener('error', drop);
    if (img.complete && img.naturalWidth === 0) drop();
  });

  // Arrows: scroll one card at a time.
  function stepSize() {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }
  function updateArrows() {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  }
  prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // Cards pop in one after another as they scroll into view.
  if ('IntersectionObserver' in window) {
    section.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const index = cards.indexOf(card);
        card.style.transitionDelay = `${(index % 4) * 110}ms`;
        card.classList.add('is-visible');
        // Clear the delay after the reveal so hover stays snappy.
        setTimeout(() => { card.style.transitionDelay = ''; }, 1200);
        observer.unobserve(card);
      });
    }, { root: null, threshold: 0.2 });
    cards.forEach(card => observer.observe(card));
  }

  // "See Bio" popup.
  track.addEventListener('click', e => {
    const button = e.target.closest('.voice-bio-btn');
    if (!button || !dialog || typeof dialog.showModal !== 'function') return;
    const card = button.closest('.voice-card');
    const img = card.querySelector('.voice-photo img');

    dialogName.textContent = card.dataset.name;
    dialogShow.textContent = card.dataset.show;
    dialogBio.textContent = card.dataset.bio;

    if (img) {
      dialogPhoto.style.backgroundImage = `url("${img.src}")`;
      dialogPhoto.textContent = '';
    } else {
      dialogPhoto.style.backgroundImage = '';
      dialogPhoto.textContent = card.dataset.name.charAt(0);
    }
    dialog.showModal();
  });

  if (dialog) {
    dialog.addEventListener('click', e => {
      // Clicking the dark backdrop or the × closes the popup.
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
  }
})();