/* Shared playback for the three matched recordings, independent of jQuery. */
(function () {
  'use strict';
  var players = Array.from(document.querySelectorAll('.bc-demo-video'));
  var playButton = document.getElementById('bc-play-all');
  var pauseButton = document.getElementById('bc-pause-all');
  var status = document.getElementById('bc-playback-status');
  if (!players.length || !playButton || !pauseButton || !status) return;
  var request = 0;
  var syncTimer = null;

  function stopSync() {
    clearInterval(syncTimer);
    syncTimer = null;
  }

  function syncToLeader() {
    var time = players[0].currentTime;
    players.slice(1).forEach(function (player) {
      if (!player.seeking && Math.abs(player.currentTime - time) > 0.10) {
        player.currentTime = time;
      }
    });
  }

  function waitFor(player, event, ready) {
    if (ready()) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { finish(new Error('Media timeout')); }, 15000);
      function finish(error) {
        clearTimeout(timer);
        player.removeEventListener(event, success);
        player.removeEventListener('error', failure);
        if (error) reject(error); else resolve();
      }
      function success() { finish(); }
      function failure() { finish(new Error('Media unavailable')); }
      player.addEventListener(event, success, { once: true });
      player.addEventListener('error', failure, { once: true });
      if (player.error) failure();
    });
  }

  playButton.addEventListener('click', async function () {
    var current = ++request;
    stopSync();
    playButton.disabled = true;
    status.textContent = 'Loading comparison…';
    players.forEach(function (player) { player.pause(); player.preload = 'auto'; });
    try {
      await Promise.all(players.map(function (player) {
        return waitFor(player, 'canplay', function () { return player.readyState >= 3; });
      }));
      if (current !== request) return;
      await Promise.all(players.map(function (player) {
        if (player.currentTime === 0 && !player.seeking) return Promise.resolve();
        var ready = waitFor(player, 'seeked', function () { return false; });
        player.currentTime = 0;
        return ready;
      }));
      if (current !== request) return;
      await Promise.all(players.map(function (player) { return player.play(); }));
      if (current === request) {
        syncToLeader();
        syncTimer = setInterval(function () {
          if (current !== request || players.some(function (player) { return player.paused; })) {
            stopSync();
            return;
          }
          syncToLeader();
        }, 100);
        status.textContent = 'Playing all three recordings from the same start.';
      }
    } catch (_) {
      if (current === request) {
        stopSync();
        players.forEach(function (player) { player.pause(); });
        status.textContent = 'Unable to start the comparison. Please retry or use the individual video controls.';
      }
    } finally {
      if (current === request) playButton.disabled = false;
    }
  });

  pauseButton.addEventListener('click', function () {
    request++;
    stopSync();
    players.forEach(function (player) { player.pause(); });
    playButton.disabled = false;
    status.textContent = 'All recordings paused. Individual video controls are also available.';
  });
  playButton.disabled = false;
  pauseButton.disabled = false;
})();
