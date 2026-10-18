(() => {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: '160px 0px', threshold: 0.01 });

  document.querySelectorAll('video[data-autoplay]').forEach(video => observer.observe(video));
})();
