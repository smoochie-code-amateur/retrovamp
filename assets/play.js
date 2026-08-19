(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function loadJSON(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function normGames(data) {
    return Array.isArray(data) ? data : (data && data.games) || [];
  }

  var GAMES_BASE_URL = "";

  function resolveGameUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    var base = GAMES_BASE_URL || "";
    if (base) return base.replace(/\/+$/, "") + "/" + path;
    return "games/" + path;
  }

  var params = new URLSearchParams(location.search);
  var id = params.get("id");

  var titleEl = document.getElementById("game-title");
  var origEl = document.getElementById("origName");
  var descEl = document.getElementById("gameDesc");
  var gameEl = document.getElementById("game");
  var descWrap = document.getElementById("descWrap");
  var toggleBtn = document.getElementById("toggleDesc");
  var fsBtn = document.getElementById("fullscreen");
  var similarSection = document.getElementById("similarSection");
  var similarGrid = document.getElementById("similarGrid");

  if (!id) {
    if (titleEl) titleEl.textContent = "Гра не вказана";
    if (gameEl) gameEl.innerHTML = '<p style="padding:20px">Відсутній параметр гри (?id=).</p>';
    return;
  }

  Promise.all([loadJSON("games/games.json"), loadJSON("config.json")]).then(function (res) {
    var data = res[0];
    var cfg = res[1];
    GAMES_BASE_URL = (cfg && cfg.gamesBaseUrl) || "";
    var games = normGames(data);
    var game = games.find(function (g) { return g.id === id; });
    if (!game) {
      if (titleEl) titleEl.textContent = "Гру не знайдено";
      if (gameEl) gameEl.innerHTML = '<p style="padding:20px">Гру з id=' + esc(id) + " не знайдено.</p>";
      return;
    }

    if (titleEl) titleEl.textContent = game.title;
    document.title = "RetroVamp — " + game.title;
    if (origEl) origEl.textContent = "Оригінальна назва: " + (game.originalName || game.title);
    if (descEl) descEl.innerHTML = esc(game.description || "Опис відсутній").replace(/\n+/g, "<br><br>");

    // ---- Ruffle player ----
    if (gameEl) {
      var file = resolveGameUrl(game.file);
      if (window.RufflePlayer) {
        try {
          var player = window.RufflePlayer.newest().createPlayer();
          gameEl.appendChild(player);
          player.load({ url: file });
        } catch (e) {
          gameEl.innerHTML = '<embed src="' + esc(file) + '" type="application/x-shockwave-flash">';
        }
      } else {
        gameEl.innerHTML = '<embed src="' + esc(file) + '" type="application/x-shockwave-flash">';
      }
    }

    // ---- Description toggle ----
    if (toggleBtn && descWrap) {
      toggleBtn.addEventListener("click", function () {
        var open = descWrap.classList.toggle("open");
        toggleBtn.textContent = open ? "Сховати опис" : "Розкрити опис";
      });
    }

    // ---- Fullscreen ----
    if (fsBtn && gameEl) {
      fsBtn.addEventListener("click", function () {
        var el = gameEl;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      });
    }

    // ---- Similar games ----
    if (similarGrid && similarSection && game.category) {
      var similar = games.filter(function (g) {
        return g.category === game.category && g.id !== game.id;
      }).slice(0, 6);
      if (similar.length) {
        similarSection.style.display = "block";
                similarGrid.innerHTML = similar.map(function (g) {
          var cover = g.cover ? resolveGameUrl(g.cover) : "";
          return '<a class="card" href="play.html?id=' + esc(g.id) + '">' +
            '<svg class="card-stroke" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path d="M0.0000 0.0000 L0.0156 0.0004 L0.0313 0.0008 L0.0469 0.0013 L0.0625 0.0015 L0.0781 0.0042 L0.0938 0.0046 L0.1094 0.0036 L0.1250 0.0034 L0.1406 0.0026 L0.1563 0.0025 L0.1719 0.0002 L0.1875 0.0016 L0.2031 0.0055 L0.2188 0.0028 L0.2344 0.0094 L0.2500 0.0094 L0.2656 0.0116 L0.2813 0.0017 L0.2969 0.0034 L0.3125 0.0010 L0.3281 0.0038 L0.3438 0.0044 L0.3594 0.0070 L0.3750 0.0142 L0.3906 0.0059 L0.4063 0.0153 L0.4219 0.0062 L0.4375 0.0173 L0.4531 0.0041 L0.4688 0.0041 L0.4844 0.0045 L0.5000 0.0021 L0.5156 0.0050 L0.5313 0.0055 L0.5469 0.0153 L0.5625 0.0087 L0.5781 0.0044 L0.5938 0.0151 L0.6094 0.0135 L0.6250 0.0037 L0.6406 0.0000 L0.6563 0.0001 L0.6719 0.0048 L0.6875 0.0038 L0.7031 0.0101 L0.7188 0.0107 L0.7344 0.0036 L0.7500 0.0077 L0.7656 0.0129 L0.7813 0.0105 L0.7969 0.0044 L0.8125 0.0012 L0.8281 0.0005 L0.8438 0.0043 L0.8594 0.0004 L0.8750 0.0045 L0.8906 0.0044 L0.9063 0.0029 L0.9219 0.0025 L0.9375 0.0021 L0.9531 0.0019 L0.9688 0.0000 L0.9844 0.0002 L1.0000 0.0000 L1.0000 0.0000 L0.9998 0.0156 L0.9996 0.0313 L0.9977 0.0469 L0.9988 0.0625 L0.9955 0.0781 L0.9959 0.0938 L0.9950 0.1094 L0.9994 0.1250 L0.9964 0.1406 L0.9956 0.1563 L1.0000 0.1719 L0.9978 0.1875 L0.9967 0.2031 L0.9949 0.2188 L0.9973 0.2344 L0.9962 0.2500 L0.9859 0.2656 L0.9962 0.2813 L0.9991 0.2969 L0.9938 0.3125 L0.9942 0.3281 L0.9909 0.3438 L0.9935 0.3594 L0.9887 0.3750 L0.9885 0.3906 L0.9848 0.4063 L0.9870 0.4219 L0.9922 0.4375 L0.9957 0.4531 L0.9999 0.4688 L0.9984 0.4844 L0.9937 0.5000 L0.9951 0.5156 L0.9900 0.5313 L0.9831 0.5469 L0.9816 0.5625 L0.9891 0.5781 L0.9890 0.5938 L0.9879 0.6094 L0.9898 0.6250 L0.9886 0.6406 L0.9921 0.6563 L0.9927 0.6719 L0.9980 0.6875 L0.9975 0.7031 L0.9919 0.7188 L0.9917 0.7344 L0.9933 0.7500 L0.9966 0.7656 L0.9948 0.7813 L0.9914 0.7969 L0.9978 0.8125 L0.9983 0.8281 L0.9965 0.8438 L0.9992 0.8594 L0.9958 0.8750 L0.9948 0.8906 L0.9967 0.9063 L0.9954 0.9219 L0.9979 0.9375 L0.9983 0.9531 L0.9988 0.9688 L1.0000 0.9844 L1.0000 1.0000 L1.0000 1.0000 L0.9844 0.9998 L0.9688 0.9987 L0.9531 0.9981 L0.9375 0.9991 L0.9219 0.9979 L0.9063 0.9947 L0.8906 0.9957 L0.8750 0.9942 L0.8594 0.9995 L0.8438 0.9983 L0.8281 0.9958 L0.8125 0.9934 L0.7969 0.9931 L0.7813 0.9941 L0.7656 0.9928 L0.7500 0.9905 L0.7344 0.9904 L0.7188 0.9977 L0.7031 0.9889 L0.6875 0.9995 L0.6719 0.9974 L0.6563 0.9911 L0.6406 0.9907 L0.6250 0.9871 L0.6094 0.9887 L0.5938 0.9904 L0.5781 0.9884 L0.5625 0.9893 L0.5469 0.9869 L0.5313 0.9977 L0.5156 0.9950 L0.5000 0.9985 L0.4844 0.9920 L0.4688 0.9983 L0.4531 0.9914 L0.4375 0.9933 L0.4219 0.9846 L0.4063 0.9853 L0.3906 0.9913 L0.3750 0.9990 L0.3594 0.9992 L0.3438 0.9987 L0.3281 0.9952 L0.3125 0.9898 L0.2969 0.9929 L0.2813 0.9962 L0.2656 0.9888 L0.2500 0.9946 L0.2344 0.9957 L0.2188 0.9961 L0.2031 0.9996 L0.1875 0.9974 L0.1719 0.9983 L0.1563 0.9986 L0.1406 0.9970 L0.1250 0.9937 L0.1094 0.9957 L0.0938 0.9988 L0.0781 0.9974 L0.0625 0.9969 L0.0469 0.9985 L0.0313 0.9996 L0.0156 0.9998 L0.0000 1.0000 L0.0000 1.0000 L0.0005 0.9844 L0.0010 0.9688 L0.0014 0.9531 L0.0019 0.9375 L0.0042 0.9219 L0.0042 0.9063 L0.0014 0.8906 L0.0060 0.8750 L0.0054 0.8594 L0.0021 0.8438 L0.0037 0.8281 L0.0053 0.8125 L0.0082 0.7969 L0.0042 0.7813 L0.0033 0.7656 L0.0035 0.7500 L0.0104 0.7344 L0.0041 0.7188 L0.0004 0.7031 L0.0089 0.6875 L0.0009 0.6719 L0.0011 0.6563 L0.0007 0.6406 L0.0054 0.6250 L0.0082 0.6094 L0.0070 0.5938 L0.0183 0.5781 L0.0152 0.5625 L0.0167 0.5469 L0.0028 0.5313 L0.0064 0.5156 L0.0007 0.5000 L0.0086 0.4844 L0.0017 0.4688 L0.0071 0.4531 L0.0171 0.4375 L0.0173 0.4219 L0.0119 0.4063 L0.0161 0.3906 L0.0048 0.3750 L0.0004 0.3594 L0.0048 0.3438 L0.0068 0.3281 L0.0012 0.3125 L0.0018 0.2969 L0.0136 0.2813 L0.0047 0.2656 L0.0044 0.2500 L0.0099 0.2344 L0.0073 0.2188 L0.0063 0.2031 L0.0024 0.1875 L0.0027 0.1719 L0.0009 0.1563 L0.0032 0.1406 L0.0042 0.1250 L0.0051 0.1094 L0.0037 0.0938 L0.0036 0.0781 L0.0029 0.0625 L0.0009 0.0469 L0.0002 0.0313 L0.0001 0.0156 L0.0000 0.0000 Z" fill="none" /></svg>' +
            (cover ? '<img class="card-cover" src="' + esc(cover) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '<div class="card-cover"></div>') +
            '<div class="card-body"><div class="card-title">' + esc(g.title) + "</div></div></a>";
        }).join("");
      }
    }
  });
})();
