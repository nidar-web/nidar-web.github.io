(() => {
  const header = document.querySelector('[data-site-navigation]');
  if (!header) return;

  const toggle = header.querySelector('.site-nav-toggle');
  const links = header.querySelector('.site-nav-links');
  const mobile = window.matchMedia('(max-width: 900px)');

  const setOpen = (open) => {
    header.toggleAttribute('data-navigation-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  header.setAttribute('data-navigation-ready', '');
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.hasAttribute('data-navigation-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  mobile.addEventListener('change', () => setOpen(false));
})();
