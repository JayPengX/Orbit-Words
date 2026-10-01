// Quadra's bridge for a game ported from an open-source project, played in an
// iframe in Rewards (games-ui.js portedStage): the game reports its running
// score (quadra.score(n)) and its end (quadra.over(n)); Rewards pays the round
// like any of its games. One round per opening: quadra.done stops the game's
// own restart, and a new round starts from Rewards.
//
// quadra.pad(buttons): on-screen buttons for a keyboard game, each pressing
// its key ({ key: 'ArrowLeft', code: 37, label: '◀', hold: true }).
(function () {
  var send = function (kind, n) {
    try {
      parent.postMessage({ quadra: kind, score: Number(n) || 0 }, location.origin);
    } catch (e) {}
  };
  var last = null;
  var lang = /[?&]lang=en\b/.test(location.search) ? 'en' : 'zh';
  var key = function (type, b) {
    var e = new KeyboardEvent(type, { key: b.key, code: b.key, bubbles: true, cancelable: true });
    try {
      Object.defineProperty(e, 'keyCode', { get: function () { return b.code; } });
      Object.defineProperty(e, 'which', { get: function () { return b.code; } });
    } catch (x) {}
    (document.activeElement || document.body || document).dispatchEvent(e);
  };
  window.quadra = {
    done: false,
    lang: lang,
    L: function (zh, en) {
      return lang === 'en' ? en : zh;
    },
    score: function (n) {
      if (window.quadra.done || n === last) return;
      last = n;
      send('score', n);
    },
    over: function (n) {
      if (window.quadra.done) return;
      window.quadra.done = true;
      send('over', n);
    },
    pad: function (buttons, cls) {
      var bar = document.createElement('div');
      bar.className = 'quadra-pad ' + (cls || '');
      buttons.forEach(function (b) {
        var el = document.createElement('button');
        el.type = 'button';
        el.textContent = b.label;
        if (b.wide) el.className = 'wide';
        var down = function (ev) {
          ev.preventDefault();
          key('keydown', b);
          if (!b.hold) key('keyup', b);
        };
        var up = function (ev) {
          ev.preventDefault();
          if (b.hold) key('keyup', b);
        };
        el.addEventListener('touchstart', down, { passive: false });
        el.addEventListener('touchend', up, { passive: false });
        el.addEventListener('touchcancel', up, { passive: false });
        el.addEventListener('mousedown', down);
        el.addEventListener('mouseup', up);
        bar.appendChild(el);
      });
      var css = document.createElement('style');
      css.textContent =
        '.quadra-pad{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));z-index:99999;justify-content:space-between;pointer-events:none}' +
        '.quadra-pad button{pointer-events:auto;flex:1;min-height:64px;border:0;border-radius:16px;background:rgba(15,23,42,.55);color:#fff;font:800 24px system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:none;backdrop-filter:blur(6px)}' +
        '.quadra-pad button:active{background:rgba(124,58,237,.75)}.quadra-pad button.wide{flex:1.6}';
      document.head.appendChild(css);
      (document.body || document.documentElement).appendChild(bar);
      return bar;
    }
  };
})();
