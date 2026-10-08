/* Self-contained controls; the application demo does not depend on jQuery. */
(function () {
  'use strict';
  var player = document.getElementById('bc-player');
  var caption = document.getElementById('bc-selection');
  var download = document.getElementById('bc-download');
  var choices = document.querySelectorAll('[data-bc-file]');
  if (!player || !caption || !download) return;

  choices.forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.getAttribute('aria-pressed') === 'true') return;
      var resume = !player.paused && !player.ended;
      var name = button.getAttribute('data-bc-file');
      var path = './static/videos/bc/' + name;
      player.pause();
      player.poster = path + '.jpg';
      player.src = path + '.mp4';
      player.setAttribute('aria-label', button.getAttribute('data-bc-label') + ': all controller image inputs and synchronized robot execution');
      caption.textContent = button.getAttribute('data-bc-caption');
      download.href = path + '.mp4';
      choices.forEach(function (choice) {
        var active = choice === button;
        choice.classList.toggle('is-active', active);
        choice.setAttribute('aria-pressed', String(active));
      });
      player.load();
      if (resume) {
        var play = player.play();
        if (play && typeof play.catch === 'function') play.catch(function () {});
      }
    });
  });
})();
