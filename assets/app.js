(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function normGames(data) {
    return Array.isArray(data) ? data : (data && data.games) || [];
  }

  function iconHTML(icon) {
    if (!icon) return '<span class="cat-icon">🎮</span>';
    if (icon.indexOf("data:") === 0 || icon.indexOf("http") === 0 || icon.indexOf("/") === 0) {
      return '<img class="cat-icon" src="' + esc(icon) + '" alt="">';
    }
    if (icon.indexOf(".svg") > -1) {
      return '<img class="cat-icon" src="assets/theme/' + esc(icon) + '" alt="">';
    }
    if (/^[A-Za-z0-9+/=]{40,}$/.test(icon)) {
      return '<img class="cat-icon" src="data:image/svg+xml;base64,' + esc(icon) + '" alt="">';
    }
    return '<span class="cat-icon">' + esc(icon) + "</span>";
  }

  function loadJSON(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  var GAMES_BASE_URL = "";

  function resolveGameUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    var base = GAMES_BASE_URL || "";
    if (base) return base.replace(/\/+$/, "") + "/" + path;
    return "games/" + path;
  }

  var marqueeEl = document.getElementById("marquee");
  if (marqueeEl) {
    loadJSON("config.json").then(function (cfg) {
      if (cfg) {
        var text = cfg.marquee || cfg.subtitle || "";
        if (text) marqueeEl.textContent = text;
        renderFooter(cfg.links);
      } else {
        renderFooter(null);
      }
    });
  }

  function renderFooter(links) {
    var nav = document.getElementById("footer-links");
    if (!nav) return;
    if (!links || !links.length) {
      links = [
        { label: "GitHub", href: "https://github.com/" },
        { label: "Приватність", href: "privacy.html" }
      ];
    }
    nav.innerHTML = links.map(function (l) {
      return '<a href="' + esc(l.href || l.url) + '">' + esc(l.label) + "</a>";
    }).join('<span> | </span>');
  }

  var CURSOR_THEMES = {
    system: {
      default: null, pointer: null, text: null, wait: null, progress: null,
      move: null, help: null, "not-allowed": null, ew: null, ns: null, nwse: null, nesw: null
    },
    "gothic-black-red": {
      default: "cursors/gothic-black-red-cursors/Goth Main.cur",
      pointer: "cursors/gothic-black-red-cursors/Goth Link.cur",
      text: "cursors/gothic-black-red-cursors/Goth Text.cur",
      wait: "cursors/gothic-black-red-cursors/Goth Busy.cur",
      progress: "cursors/gothic-black-red-cursors/Goth WIB.cur",
      move: "cursors/gothic-black-red-cursors/Goth Move.cur",
      help: "cursors/gothic-black-red-cursors/Goth Help.cur",
      "not-allowed": "cursors/gothic-black-red-cursors/Goth Unavailable.cur",
      ew: "cursors/gothic-black-red-cursors/Goth Horizontal Resize.cur",
      ns: "cursors/gothic-black-red-cursors/Goth Vertical Resize.cur",
      nwse: "cursors/gothic-black-red-cursors/Goth Diagonal Resize 1.cur",
      nesw: "cursors/gothic-black-red-cursors/Goth Diagonal Resize 2.cur"
    },
    vampire: {
      default: "cursors/vampire/normal cursor.cur",
      pointer: "cursors/vampire/link select.cur",
      text: "cursors/vampire/text.cur",
      wait: "cursors/vampire/busy.cur",
      progress: "cursors/vampire/wib.cur",
      move: "cursors/vampire/move.cur",
      help: null,
      "not-allowed": "cursors/vampire/UNABAVIBLE.cur",
      ew: null, ns: null, nwse: null, nesw: null
    }
  };

  var CURSOR_ROLES = ["default", "pointer", "text", "wait", "progress", "move", "help", "not-allowed", "ew", "ns", "nwse", "nesw"];
  var CURSOR_FALLBACK = {
    default: "auto", pointer: "pointer", text: "text", wait: "wait", progress: "progress",
    move: "move", help: "help", "not-allowed": "not-allowed", ew: "ew-resize", ns: "ns-resize",
    nwse: "nwse-resize", nesw: "nesw-resize"
  };

  function applyCursorTheme(name) {
    var theme = CURSOR_THEMES[name] || CURSOR_THEMES["gothic-black-red"];
    var root = document.documentElement.style;
    CURSOR_ROLES.forEach(function (role) {
      var file = theme[role];
      var val = file ? 'url("' + file + '"), ' + CURSOR_FALLBACK[role] : CURSOR_FALLBACK[role];
      root.setProperty("--cur-" + role, val);
    });
    try { localStorage.setItem("rv_cursor", name); } catch (e) {}
  }

  var picker = document.getElementById("cursorPicker");
  if (picker) {
    var saved = null;
    try { saved = localStorage.getItem("rv_cursor"); } catch (e) {}
    if (!saved || !CURSOR_THEMES[saved]) saved = "vampire";
    picker.value = saved;
    applyCursorTheme(saved);
    picker.addEventListener("change", function () { applyCursorTheme(picker.value); });
  }

  loadJSON("categories.json").then(function (cats) {
    var ul = document.getElementById("cats");
    if (!ul || !cats) return;
    cats.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var params = new URLSearchParams(location.search);
    var activeCat = params.get("cat") || "";
    ul.innerHTML = cats.map(function (c) {
      return '<li class="cat' + (c.name === activeCat ? " active" : "") + '" data-name="' + esc(c.name) + '">' +
        iconHTML(c.icon) +
        "<span>" + esc(c.name) + "</span></li>";
    }).join("");
    Array.prototype.forEach.call(ul.querySelectorAll(".cat"), function (li) {
      li.addEventListener("click", function () {
        location.href = "index.html?cat=" + encodeURIComponent(li.getAttribute("data-name"));
      });
    });
    window.setupCustomScroll(document.querySelector(".cats-scroll"));
  });

  var grid = document.getElementById("grid");
  if (grid) {
    var searchEl = document.getElementById("search");
    Promise.all([loadJSON("games/games.json"), loadJSON("config.json")]).then(function (res) {
      var games = normGames(res[0]);
      var cfg = res[1] || {};
      GAMES_BASE_URL = cfg.gamesBaseUrl || "";
      var PAGE_SIZE = Math.max(1, parseInt(cfg.pageSize, 10) || 10);
      var params = new URLSearchParams(location.search);
      var catFilter = params.get("cat") || "";

      function render(list) {
        if (!list.length) {
          grid.innerHTML = '<p style="opacity:.8">Ігор не знайдено.</p>';
          return;
        }
        grid.innerHTML = list.map(function (g) {
          var cover = g.cover ? resolveGameUrl(g.cover) : "";
          return '<a class="card" href="play.html?id=' + esc(g.id) + '">' +
            '<svg class="card-stroke" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path d="M0.0000 0.0000 L0.0156 0.0004 L0.0313 0.0008 L0.0469 0.0013 L0.0625 0.0015 L0.0781 0.0042 L0.0938 0.0046 L0.1094 0.0036 L0.1250 0.0034 L0.1406 0.0026 L0.1563 0.0025 L0.1719 0.0002 L0.1875 0.0016 L0.2031 0.0055 L0.2188 0.0028 L0.2344 0.0094 L0.2500 0.0094 L0.2656 0.0116 L0.2813 0.0017 L0.2969 0.0034 L0.3125 0.0010 L0.3281 0.0038 L0.3438 0.0044 L0.3594 0.0070 L0.3750 0.0142 L0.3906 0.0059 L0.4063 0.0153 L0.4219 0.0062 L0.4375 0.0173 L0.4531 0.0041 L0.4688 0.0041 L0.4844 0.0045 L0.5000 0.0021 L0.5156 0.0050 L0.5313 0.0055 L0.5469 0.0153 L0.5625 0.0087 L0.5781 0.0044 L0.5938 0.0151 L0.6094 0.0135 L0.6250 0.0037 L0.6406 0.0000 L0.6563 0.0001 L0.6719 0.0048 L0.6875 0.0038 L0.7031 0.0101 L0.7188 0.0107 L0.7344 0.0036 L0.7500 0.0077 L0.7656 0.0129 L0.7813 0.0105 L0.7969 0.0044 L0.8125 0.0012 L0.8281 0.0005 L0.8438 0.0043 L0.8594 0.0004 L0.8750 0.0045 L0.8906 0.0044 L0.9063 0.0029 L0.9219 0.0025 L0.9375 0.0021 L0.9531 0.0019 L0.9688 0.0000 L0.9844 0.0002 L1.0000 0.0000 L1.0000 0.0000 L0.9998 0.0156 L0.9996 0.0313 L0.9977 0.0469 L0.9988 0.0625 L0.9955 0.0781 L0.9959 0.0938 L0.9950 0.1094 L0.9994 0.1250 L0.9964 0.1406 L0.9956 0.1563 L1.0000 0.1719 L0.9978 0.1875 L0.9967 0.2031 L0.9949 0.2188 L0.9973 0.2344 L0.9962 0.2500 L0.9859 0.2656 L0.9962 0.2813 L0.9991 0.2969 L0.9938 0.3125 L0.9942 0.3281 L0.9909 0.3438 L0.9935 0.3594 L0.9887 0.3750 L0.9885 0.3906 L0.9848 0.4063 L0.9870 0.4219 L0.9922 0.4375 L0.9957 0.4531 L0.9999 0.4688 L0.9984 0.4844 L0.9937 0.5000 L0.9951 0.5156 L0.9900 0.5313 L0.9831 0.5469 L0.9816 0.5625 L0.9891 0.5781 L0.9890 0.5938 L0.9879 0.6094 L0.9898 0.6250 L0.9886 0.6406 L0.9921 0.6563 L0.9927 0.6719 L0.9980 0.6875 L0.9975 0.7031 L0.9919 0.7188 L0.9917 0.7344 L0.9933 0.7500 L0.9966 0.7656 L0.9948 0.7813 L0.9914 0.7969 L0.9978 0.8125 L0.9983 0.8281 L0.9965 0.8438 L0.9992 0.8594 L0.9958 0.8750 L0.9948 0.8906 L0.9967 0.9063 L0.9954 0.9219 L0.9979 0.9375 L0.9983 0.9531 L0.9988 0.9688 L1.0000 0.9844 L1.0000 1.0000 L1.0000 1.0000 L0.9844 0.9998 L0.9688 0.9987 L0.9531 0.9981 L0.9375 0.9991 L0.9219 0.9979 L0.9063 0.9947 L0.8906 0.9957 L0.8750 0.9942 L0.8594 0.9995 L0.8438 0.9983 L0.8281 0.9958 L0.8125 0.9934 L0.7969 0.9931 L0.7813 0.9941 L0.7656 0.9928 L0.7500 0.9905 L0.7344 0.9904 L0.7188 0.9977 L0.7031 0.9889 L0.6875 0.9995 L0.6719 0.9974 L0.6563 0.9911 L0.6406 0.9907 L0.6250 0.9871 L0.6094 0.9887 L0.5938 0.9904 L0.5781 0.9884 L0.5625 0.9893 L0.5469 0.9869 L0.5313 0.9977 L0.5156 0.9950 L0.5000 0.9985 L0.4844 0.9920 L0.4688 0.9983 L0.4531 0.9914 L0.4375 0.9933 L0.4219 0.9846 L0.4063 0.9853 L0.3906 0.9913 L0.3750 0.9990 L0.3594 0.9992 L0.3438 0.9987 L0.3281 0.9952 L0.3125 0.9898 L0.2969 0.9929 L0.2813 0.9962 L0.2656 0.9888 L0.2500 0.9946 L0.2344 0.9957 L0.2188 0.9961 L0.2031 0.9996 L0.1875 0.9974 L0.1719 0.9983 L0.1563 0.9986 L0.1406 0.9970 L0.1250 0.9937 L0.1094 0.9957 L0.0938 0.9988 L0.0781 0.9974 L0.0625 0.9969 L0.0469 0.9985 L0.0313 0.9996 L0.0156 0.9998 L0.0000 1.0000 L0.0000 1.0000 L0.0005 0.9844 L0.0010 0.9688 L0.0014 0.9531 L0.0019 0.9375 L0.0042 0.9219 L0.0042 0.9063 L0.0014 0.8906 L0.0060 0.8750 L0.0054 0.8594 L0.0021 0.8438 L0.0037 0.8281 L0.0053 0.8125 L0.0082 0.7969 L0.0042 0.7813 L0.0033 0.7656 L0.0035 0.7500 L0.0104 0.7344 L0.0041 0.7188 L0.0004 0.7031 L0.0089 0.6875 L0.0009 0.6719 L0.0011 0.6563 L0.0007 0.6406 L0.0054 0.6250 L0.0082 0.6094 L0.0070 0.5938 L0.0183 0.5781 L0.0152 0.5625 L0.0167 0.5469 L0.0028 0.5313 L0.0064 0.5156 L0.0007 0.5000 L0.0086 0.4844 L0.0017 0.4688 L0.0071 0.4531 L0.0171 0.4375 L0.0173 0.4219 L0.0119 0.4063 L0.0161 0.3906 L0.0048 0.3750 L0.0004 0.3594 L0.0048 0.3438 L0.0068 0.3281 L0.0012 0.3125 L0.0018 0.2969 L0.0136 0.2813 L0.0047 0.2656 L0.0044 0.2500 L0.0099 0.2344 L0.0073 0.2188 L0.0063 0.2031 L0.0024 0.1875 L0.0027 0.1719 L0.0009 0.1563 L0.0032 0.1406 L0.0042 0.1250 L0.0051 0.1094 L0.0037 0.0938 L0.0036 0.0781 L0.0029 0.0625 L0.0009 0.0469 L0.0002 0.0313 L0.0001 0.0156 L0.0000 0.0000 Z" fill="none" /></svg>' +
            (cover ? '<img class="card-cover" src="' + esc(cover) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '<div class="card-cover"></div>') +
            '<div class="card-body">' +
            '<div class="card-title">' + esc(g.title) + "</div>" +
            '<div class="card-meta">' + esc(g.category || "") + (g.author ? " · " + esc(g.author) : "") + "</div>" +
            "</div></a>";
        }).join("");
      }

      var page = 1;
      var currentList = [];
      var pager = document.getElementById("pager");

      function pageWindow(cur, total) {
        if (total <= 7) {
          var a = [];
          for (var i = 1; i <= total; i++) a.push(i);
          return a;
        }
        var out = [1];
        if (cur > 3) out.push("…");
        var s = Math.max(2, cur - 1), e = Math.min(total - 1, cur + 1);
        for (var i = s; i <= e; i++) out.push(i);
        if (cur < total - 2) out.push("…");
        out.push(total);
        return out;
      }

      function renderPager(totalPages) {
        pager.innerHTML = "";
        if (totalPages <= 1) return;
        function mk(label, p, opts) {
          opts = opts || {};
          var b = document.createElement("button");
          var cls = "page" + (opts.active ? " active" : "") + (opts.disabled ? " disabled" : "");
          if (label === "‹" || label === "›") cls += " arrow";
          b.className = cls;
          b.textContent = label;
          if (opts.disabled) b.disabled = true;
          else b.addEventListener("click", function () {
            page = p;
            goPage();
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          return b;
        }
        pager.appendChild(mk("‹", page - 1, { disabled: page === 1 }));
        pageWindow(page, totalPages).forEach(function (p) {
          if (p === "…") {
            var g = document.createElement("span");
            g.className = "gap";
            g.textContent = "…";
            pager.appendChild(g);
          } else {
            pager.appendChild(mk(String(p), p, { active: p === page }));
          }
        });
        pager.appendChild(mk("›", page + 1, { disabled: page === totalPages }));
      }

      function goPage() {
        var totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        var start = (page - 1) * PAGE_SIZE;
        render(currentList.slice(start, start + PAGE_SIZE));
        renderPager(totalPages);
      }

      function apply() {
        var q = (searchEl.value || "").trim().toLowerCase();
        currentList = games.filter(function (g) {
          if (catFilter && g.category !== catFilter) return false;
          if (q && (g.title + " " + (g.description || "")).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        page = 1;
        goPage();
      }

      if (searchEl) searchEl.addEventListener("input", apply);
      apply();
    });
  }

  window.setupCustomScroll = function (container) {
    if (!container || container.dataset.scrollReady) return;
    container.dataset.scrollReady = "1";

    var track = document.createElement("div");
    track.className = "scroll-track";
    var thumb = document.createElement("div");
    thumb.className = "scroll-thumb";
    track.appendChild(thumb);
    (container.parentElement || container).appendChild(track);

    function refresh() {
      var scrollable = container.scrollHeight - container.clientHeight;
      if (scrollable <= 2) { track.style.display = "none"; return; }
      track.style.display = "block";
      var c = container.clientHeight;
      var s = container.scrollHeight;
      var trackH = track.clientHeight;
      var ideal = s > 0 ? (c / s) * trackH : trackH;
      var img, h;
      if (ideal <= 54) { img = "assets/theme/scroll_bar_active.png"; h = 54; }
      else if (ideal <= 183) { img = "assets/theme/scroll_bar_active_longer.png"; h = 183; }
      else { img = "assets/theme/scroll_bar_active_longest.png"; h = 425; }
      if (h > trackH) h = trackH;
      thumb.style.backgroundImage = 'url("' + img + '")';
      thumb.style.width = "21px";
      thumb.style.height = h + "px";
      var maxTop = trackH - h;
      var ratio = scrollable > 0 ? container.scrollTop / scrollable : 0;
      if (ratio < 0) ratio = 0; if (ratio > 1) ratio = 1;
      thumb.style.top = (ratio * maxTop) + "px";
    }

    container.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);

    var dragging = false, startY = 0, startTop = 0;
    thumb.addEventListener("mousedown", function (e) {
      dragging = true;
      startY = e.clientY;
      startTop = parseFloat(thumb.style.top) || 0;
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    track.addEventListener("mousedown", function (e) {
      if (e.target === thumb) return;
      var rect = track.getBoundingClientRect();
      var th = thumb.clientHeight || 30;
      var maxTop = track.clientHeight - th;
      var nt = Math.max(0, Math.min(maxTop, (e.clientY - rect.top) - th / 2));
      var scrollable = container.scrollHeight - container.clientHeight;
      container.scrollTop = maxTop > 0 ? (nt / maxTop) * scrollable : 0;
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var th = thumb.clientHeight || 30;
      var maxTop = track.clientHeight - th;
      var dy = e.clientY - startY;
      var nt = Math.max(0, Math.min(maxTop, startTop + dy));
      thumb.style.top = nt + "px";
      var scrollable = container.scrollHeight - container.clientHeight;
      container.scrollTop = maxTop > 0 ? (nt / maxTop) * scrollable : 0;
    });
    window.addEventListener("mouseup", function () {
      if (dragging) { dragging = false; document.body.style.userSelect = ""; }
    });

    refresh();
    requestAnimationFrame(refresh);
    setTimeout(refresh, 250);
    setTimeout(refresh, 800);
    return refresh;
  };
})();
