(() => {
  const WORLD_W = 5600;
  const WORLD_H = 5600;
  const FOOD_COUNT = 4500;
  const VIRUS_FOOD_CAP = 200;
  const VIRUS_SPIT_INTERVAL = 0.38;
  const BOT_COUNT = 18;
  const VIRUS_COUNT = 16;
  const START_MASS = 22;
  const FOOD_MASS = 1.7;
  const EJECT_MASS = 14;
  const VIRUS_MASS = 92;
  const VIRUS_MAX = 180;
  const VIRUS_EAT_MASS = 150;
  const EAT_RATIO = 1.22;
  const MAX_CELLS = 20;
  const SPLIT_MIN = 36;
  const CELL_MASS_BUDGET = 16;
  const EJECT_MIN = 32;
  const EJECT_LIFE = 15;
  const MOVE_BURN = 0.72;
  const MOVE_MIN_MASS = 12;
  const MERGE_BASE = 14;
  const FOOD_SEED = 77421;
  const NET_PATH = "blobio/arena";
  const HALL_PATH = "blobio/hall";
  const USERS_PATH = "blobio/users";
  const CHAT_PATH = "blobio/chat";
  const CHAT_TTL_MS = 10 * 60 * 1000;
  const CHAT_MAX = 60;
  const HALL_STORE = 15;
  const HALL_SHOW = 10;
  const STALE_NET_MS = 4500;
  const SKIN_CACHE = "blobio-skin-v1";
  const SKIN_CACHE_URL = "/blobio-local-skin";
  const PLAYER_COLORS = [
    "#c45a6e",
    "#c47a5c",
    "#c9a85a",
    "#3aa88a",
    "#5a9fc4",
    "#6a4a9e",
    "#c45a8a",
    "#4a7eb8",
    "#5ab8a8",
    "#c45a5a",
  ];
  const FOOD_COLORS = [
    "#c46a6a",
    "#c48a5a",
    "#c4b06a",
    "#5aa87a",
    "#5a9ac4",
    "#6a5ab0",
    "#c47a9a",
    "#5aacc4",
    "#c4885a",
    "#a06ab8",
  ];
  const BOT_NAMES = [
    "Waffle", "Noodle", "Pixel", "Mango", "Zigzag", "Ninja", "Soup", "Cactus",
    "Moon", "Ramen", "Pebble", "Turbo", "Kiwi", "Echo", "Salsa", "Nugget",
    "Comet", "Panda", "YoYo", "Gizmo", "Fizz", "Doodle", "Mochi", "Blaze",
    "Olive", "Pudding", "Rocket", "Bean", "Cloud", "Pickle",
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const mini = document.getElementById("minimap");
  const mctx = mini.getContext("2d");
  const hud = document.getElementById("hud");
  const menu = document.getElementById("menu");
  const death = document.getElementById("death");
  const lbList = document.getElementById("lb-list");
  const scoreEl = document.getElementById("score");
  const nickEl = document.getElementById("nick");
  const colorsEl = document.getElementById("colors");
  const bestEl = document.getElementById("best-score");
  const levelEl = document.getElementById("level-score");
  const gloryEl = document.getElementById("glory-score");
  const accountStatsEl = document.getElementById("account-stats");
  const hallListEl = document.getElementById("hall-list");
  const hallBoardEl = document.getElementById("hall");
  const chatBoardEl = document.getElementById("chat");
  const chatListEl = document.getElementById("chat-list");
  const chatInputEl = document.getElementById("chat-input");
  const chatFormEl = document.getElementById("chat-form");
  const chatTtlEl = document.getElementById("chat-ttl");
  const creditEl = document.querySelector(".credit");
  const googleBtn = document.getElementById("google-btn");
  const authUserEl = document.getElementById("auth-user");
  const authAvatarEl = document.getElementById("auth-avatar");
  const authNameEl = document.getElementById("auth-name");
  const authLevelEl = document.getElementById("auth-level");
  const authSignOutBtn = document.getElementById("auth-signout");
  const deathTitleEl = document.getElementById("death-title");
  const deathPeakEl = document.getElementById("death-peak");
  const deathScoreEl = document.getElementById("death-score");
  const deathBestEl = document.getElementById("death-best");
  const deathAccountEl = document.getElementById("death-account");
  const deathLevelEl = document.getElementById("death-level");
  const deathGloryEl = document.getElementById("death-glory");
  const themeBtn = document.getElementById("theme-toggle");
  const menuNet = document.getElementById("menu-net");
  const hudNet = document.getElementById("hud-net");

  const mouse = { x: 0, y: 0, down: false };
  const camera = { x: WORLD_W / 2, y: WORLD_H / 2, scale: 0.7 };
  let dpr = 1;
  let viewW = 0;
  let viewH = 0;
  let foods = [];
  let virusFoods = [];
  let viruses = [];
  let virusSeq = 0;
  let ejects = [];
  let pops = [];
  let floats = [];
  let players = [];
  let me = null;
  let selectedColor = PLAYER_COLORS[4];
  let skinImg = null;
  let best = Number(localStorage.getItem("blobio-best") || 0);
  let glory = 0;
  let level = 1;
  let peakScore = 0;
  let killedSelf = false;
  let lastChatSent = 0;
  let chatRaw = null;
  const skinFileEl = document.getElementById("skin-file");
  const skinClearEl = document.getElementById("skin-clear");
  const skinPreviewEl = document.getElementById("skin-preview");
  let dark =
    localStorage.getItem("blobio-dark") === "1" ||
    (localStorage.getItem("blobio-dark") === null &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  {
    const qDark = new URLSearchParams(location.search).get("dark");
    if (qDark === "1") dark = true;
    if (qDark === "0") dark = false;
  }
  let audio;
  let last = performance.now();
  let animT = 0;
  let lbTimer = 0;
  let mode = "menu";
  let db = null;
  let auth = null;
  let authUser = null;
  let netReady = false;
  let netError = "";
  let myNetId = "p" + Math.random().toString(36).slice(2, 10);
  let playerRef = null;
  let netTimer = 0;
  let eatenQueue = [];
  let remoteCount = 0;
  const SESSION_KEY = "blobio-session";
  const tabId = "t" + Math.random().toString(36).slice(2, 10);
  let sessionChannel = null;
  try {
    sessionChannel = new BroadcastChannel("blobio-session");
  } catch (_) {}

  function claimSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: tabId, t: Date.now() }));
    if (sessionChannel) sessionChannel.postMessage({ type: "claim", id: tabId });
  }

  function releaseSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.id === tabId) localStorage.removeItem(SESSION_KEY);
      }
    } catch (_) {}
  }

  function bumpSession() {
    if (mode !== "play") return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: tabId, t: Date.now() }));
  }

  function yieldToOtherTab() {
    if (mode === "menu") return;
    netLeave(true);
    releaseSession();
    mode = "menu";
    if (me) {
      me.dead = true;
      me.cells.length = 0;
      me = null;
    }
    death.classList.add("hidden");
    hud.classList.add("hidden");
    menu.classList.remove("hidden");
    bestEl.textContent = String(Math.round(best));
    syncNpcPopulation();
    setNetStatus("Only one game tab allowed — this tab stopped", "bad");
  }

  function bindSessionLock() {
    if (sessionChannel) {
      sessionChannel.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || msg.id === tabId) return;
        if (msg.type === "claim") yieldToOtherTab();
      };
    }
    window.addEventListener("storage", (e) => {
      if (e.key !== SESSION_KEY || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        if (data.id !== tabId) yieldToOtherTab();
      } catch (_) {}
    });
  }

  function applyTheme() {
    document.documentElement.classList.toggle("dark", dark);
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeBtn.title = dark ? "Light mode" : "Dark mode";
    localStorage.setItem("blobio-dark", dark ? "1" : "0");
  }

  function toggleTheme() {
    dark = !dark;
    applyTheme();
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function radius(mass) {
    return 4 + Math.sqrt(mass) * 5.4;
  }
  function speedFor(mass) {
    return 620 * Math.pow(mass, -0.221);
  }
  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
  }
  function shade(hex, amt) {
    const { r, g, b } = hexRgb(hex);
    return `rgb(${clamp(r + amt, 0, 255)},${clamp(g + amt, 0, 255)},${clamp(b + amt, 0, 255)})`;
  }
  function rgba(hex, a) {
    const { r, g, b } = hexRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class SpatialHash {
    constructor(size) {
      this.size = size;
      this.map = new Map();
    }
    clear() {
      this.map.clear();
    }
    key(x, y) {
      return `${Math.floor(x / this.size)},${Math.floor(y / this.size)}`;
    }
    insert(item) {
      const k = this.key(item.x, item.y);
      let bucket = this.map.get(k);
      if (!bucket) {
        bucket = [];
        this.map.set(k, bucket);
      }
      bucket.push(item);
    }
    query(x, y, r, out) {
      const s = this.size;
      const x0 = Math.floor((x - r) / s);
      const y0 = Math.floor((y - r) / s);
      const x1 = Math.floor((x + r) / s);
      const y1 = Math.floor((y + r) / s);
      for (let gx = x0; gx <= x1; gx++) {
        for (let gy = y0; gy <= y1; gy++) {
          const bucket = this.map.get(`${gx},${gy}`);
          if (bucket) for (const item of bucket) out.push(item);
        }
      }
      return out;
    }
  }

  const foodHash = new SpatialHash(90);

  function setNetStatus(text, kind) {
    for (const el of [menuNet, hudNet]) {
      if (!el) continue;
      el.textContent = text;
      el.classList.remove("ok", "bad");
      if (kind) el.classList.add(kind);
    }
  }

  function spawnVirus(x, y, mass) {
    viruses.push({
      id: ++virusSeq,
      x: x ?? rand(200, WORLD_W - 200),
      y: y ?? rand(200, WORLD_H - 200),
      mass: mass ?? VIRUS_MASS,
      angle: rand(0, Math.PI * 2),
      spitT: rand(0, VIRUS_SPIT_INTERVAL),
      spitA: rand(0, Math.PI * 2),
    });
  }

  function countVirusFood(virusId) {
    let n = 0;
    for (const f of virusFoods) if (f.virusId === virusId) n++;
    return n;
  }

  function spitVirusFood(v) {
    if (countVirusFood(v.id) >= VIRUS_FOOD_CAP) return false;
    v.spitA += rand(0.4, 0.75);
    const a = v.spitA + rand(-0.06, 0.06);
    const edge = radius(v.mass) * 0.82;
    const speed = rand(36, 78);
    virusFoods.push({
      virusId: v.id,
      x: v.x + Math.cos(a) * edge,
      y: v.y + Math.sin(a) * edge,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      mass: FOOD_MASS,
      color: FOOD_COLORS[(Math.random() * FOOD_COLORS.length) | 0],
      r: 4.2 + Math.random() * 2.8,
      age: 0,
    });
    return true;
  }

  function updateVirusSpit(dt) {
    for (const v of viruses) {
      v.spitT += dt;
      while (v.spitT >= VIRUS_SPIT_INTERVAL) {
        v.spitT -= VIRUS_SPIT_INTERVAL;
        if (!spitVirusFood(v)) {
          v.spitT = 0;
          break;
        }
      }
    }
  }

  function makeCell(player, x, y, mass, bx = 0, by = 0) {
    const cell = {
      x,
      y,
      tx: x,
      ty: y,
      vx: 0,
      vy: 0,
      bx,
      by,
      mass,
      show: mass,
      player,
      mergeAt: performance.now() + (MERGE_BASE + mass * 0.045) * 1000,
    };
    player.cells.push(cell);
    return cell;
  }

  function makePlayer(name, color, isHuman, x, y, mass, id) {
    const p = {
      id: id || uid(),
      name: name || "Blob",
      color,
      isHuman,
      isRemote: false,
      cells: [],
      dead: false,
      ai: {
        kind: Math.random() < 0.45 ? "hunter" : Math.random() < 0.5 ? "scared" : "grazer",
        tx: 0,
        ty: 0,
        retarget: 0,
      },
    };
    makeCell(p, x, y, mass);
    players.push(p);
    return p;
  }

  function randomEmpty() {
    for (let i = 0; i < 12; i++) {
      const x = rand(180, WORLD_W - 180);
      const y = rand(180, WORLD_H - 180);
      let ok = true;
      for (const p of players) {
        for (const c of p.cells) {
          if (hypot(c.x - x, c.y - y) < radius(c.mass) + 80) ok = false;
        }
      }
      if (ok) return { x, y };
    }
    return { x: rand(180, WORLD_W - 180), y: rand(180, WORLD_H - 180) };
  }

  function totalMass(p) {
    let m = 0;
    for (const c of p.cells) m += c.mass;
    return m;
  }

  function centerOfMass(p) {
    let x = 0;
    let y = 0;
    let m = 0;
    for (const c of p.cells) {
      x += c.x * c.mass;
      y += c.y * c.mass;
      m += c.mass;
    }
    if (!m) return { x: camera.x, y: camera.y, mass: 0, r: 40 };
    return { x: x / m, y: y / m, mass: m, r: radius(m) };
  }

  function ensureAudio() {
    if (audio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
  }

  function beep(freq, dur, type = "sine", vol = 0.06) {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  }

  function burst(x, y, color, n = 10, r = 8) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(40, 220);
      pops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(0.25, 0.55),
        max: 0.5,
        color,
        r: rand(r * 0.4, r),
      });
    }
  }

  function floatText(x, y, text) {
    floats.push({ x, y, text, life: 0.7 });
  }

  function worldMouse() {
    return {
      x: camera.x + (mouse.x - viewW / 2) / camera.scale,
      y: camera.y + (mouse.y - viewH / 2) / camera.scale,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initFood() {
    const rng = mulberry32(FOOD_SEED);
    foods = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      foods.push({
        id: i,
        x: 20 + rng() * (WORLD_W - 40),
        y: 20 + rng() * (WORLD_H - 40),
        mass: FOOD_MASS,
        color: FOOD_COLORS[(rng() * FOOD_COLORS.length) | 0],
        r: 4.5 + rng() * 2.2,
        alive: true,
        hideUntil: 0,
      });
    }
  }

  function fillBots() {
    const used = new Set(players.map((p) => p.name));
    const have = players.filter((p) => !p.isHuman && !p.isRemote && !p.dead).length;
    for (let i = have; i < BOT_COUNT; i++) {
      let name = pick(BOT_NAMES);
      while (used.has(name)) name = pick(BOT_NAMES) + (i + 1);
      used.add(name);
      const pos = randomEmpty();
      const mass = rand(18, 70) + (Math.random() < 0.12 ? rand(80, 220) : 0);
      makePlayer(name, pick(PLAYER_COLORS), false, pos.x, pos.y, mass);
    }
  }

  function stripBots() {
    for (const p of players) {
      if (!p.isHuman && !p.isRemote) {
        p.dead = true;
        p.cells.length = 0;
      }
    }
    players = players.filter((p) => p.isHuman || p.isRemote);
  }

  function syncNpcPopulation() {
    remoteCount = players.filter((p) => p.isRemote && !p.dead).length;
    if (remoteCount > 0) stripBots();
    else fillBots();
  }

  function dropRemotePlayer(id, purgeFirebase) {
    const before = players.length;
    players = players.filter((p) => p.id !== id);
    if (players.length !== before) syncNpcPopulation();
    if (purgeFirebase && db) {
      db.ref(`${NET_PATH}/players/${id}`).remove().catch(() => {});
    }
  }

  function pruneStaleRemotes() {
    const now = Date.now();
    for (const p of players.slice()) {
      if (!p.isRemote) continue;
      if (!p.lastNet || now - p.lastNet > STALE_NET_MS) {
        dropRemotePlayer(p.id, true);
      }
    }
  }

  function initWorld() {
    initFood();
    virusFoods = [];
    viruses = [];
    ejects = [];
    pops = [];
    floats = [];
    players = [];
    me = null;
    const rng = mulberry32(FOOD_SEED + 99);
    for (let i = 0; i < VIRUS_COUNT; i++) {
      spawnVirus(200 + rng() * (WORLD_W - 400), 200 + rng() * (WORLD_H - 400), VIRUS_MASS);
    }
    fillBots();
  }

  function spawnMe(name) {
    if (me) {
      const idx = players.indexOf(me);
      if (idx >= 0) players.splice(idx, 1);
    }
    const pos = randomEmpty();
    me = makePlayer(name, selectedColor, true, pos.x, pos.y, START_MASS, myNetId);
    killedSelf = false;
    peakScore = Math.round(START_MASS);
    camera.x = pos.x;
    camera.y = pos.y;
    camera.scale = 1.05;
  }

  function cellLimit(p) {
    const bySize = Math.max(1, Math.floor(totalMass(p) / CELL_MASS_BUDGET));
    return Math.min(MAX_CELLS, bySize);
  }

  function splitPlayer(p) {
    let limit = cellLimit(p);
    if (p.cells.length >= limit) return;
    const aim = p.isHuman && !p.isRemote ? worldMouse() : { x: p.ai.tx, y: p.ai.ty };
    const originals = p.cells.slice().sort((a, b) => b.mass - a.mass);
    let did = false;
    for (const cell of originals) {
      limit = cellLimit(p);
      if (p.cells.length >= limit) break;
      if (cell.mass < SPLIT_MIN) continue;
      const dx = aim.x - cell.x;
      const dy = aim.y - cell.y;
      const d = hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;
      cell.mass *= 0.5;
      cell.mergeAt = performance.now() + (MERGE_BASE + cell.mass * 0.045) * 1000;
      const boost = 780 + radius(cell.mass) * 2;
      makeCell(p, cell.x + nx * 8, cell.y + ny * 8, cell.mass, nx * boost, ny * boost);
      did = true;
    }
    if (did && p === me) beep(520, 0.08, "triangle", 0.05);
  }

  function ejectPlayer(p) {
    const aim = p.isHuman && !p.isRemote ? worldMouse() : { x: p.ai.tx, y: p.ai.ty };
    for (const cell of p.cells) {
      if (cell.mass < EJECT_MIN) continue;
      const dx = aim.x - cell.x;
      const dy = aim.y - cell.y;
      const d = hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;
      cell.mass -= EJECT_MASS;
      const r = radius(cell.mass);
      ejects.push({
        x: cell.x + nx * (r + 8),
        y: cell.y + ny * (r + 8),
        vx: nx * 620,
        vy: ny * 620,
        mass: EJECT_MASS,
        color: p.color,
        age: 0,
      });
    }
    if (p === me) beep(240, 0.05, "sine", 0.04);
  }

  function explodeCell(player, cell) {
    const slots = cellLimit(player) - player.cells.length + 1;
    const pieces = Math.max(2, Math.min(slots, 12));
    const each = Math.max(12, cell.mass / pieces);
    const ox = cell.x;
    const oy = cell.y;
    cell.mass = each;
    cell.mergeAt = performance.now() + (MERGE_BASE + each * 0.05) * 1000;
    burst(ox, oy, "#6a9e78", 16, 10);
    for (let i = 1; i < pieces; i++) {
      const a = (i / pieces) * Math.PI * 2 + rand(-0.2, 0.2);
      makeCell(
        player,
        ox,
        oy,
        each,
        Math.cos(a) * rand(520, 900),
        Math.sin(a) * rand(520, 900)
      );
    }
  }

  function killSelf() {
    if (mode !== "play" || !me || me.dead) return;
    killedSelf = true;
    for (const cell of me.cells) {
      burst(cell.x, cell.y, me.color, 18, Math.min(22, radius(cell.mass) * 0.45));
      const pieces = Math.min(24, Math.max(8, Math.round(Math.min(cell.mass, 336) / EJECT_MASS)));
      const each = EJECT_MASS;
      for (let i = 0; i < pieces; i++) {
        const a = (i / pieces) * Math.PI * 2 + rand(-0.2, 0.2);
        const dist = rand(6, Math.max(10, radius(cell.mass) * 0.55));
        ejects.push({
          x: cell.x + Math.cos(a) * dist,
          y: cell.y + Math.sin(a) * dist,
          vx: Math.cos(a) * rand(220, 640),
          vy: Math.sin(a) * rand(220, 640),
          mass: each,
          color: me.color,
          age: 0,
        });
      }
    }
    me.cells.length = 0;
    me.dead = true;
  }

  function eatCell(eater, victim, owner) {
    const localGain = eater.player === me || (!eater.player.isRemote && !owner.isRemote);
    if (localGain) eater.mass += victim.mass;
    burst(victim.x, victim.y, owner.color, 14, Math.min(16, radius(victim.mass) * 0.4));
    if (eater.player === me) {
      floatText(victim.x, victim.y, `+${Math.round(victim.mass)}`);
      beep(360 + Math.min(220, victim.mass), 0.07, "sine", 0.05);
      if (owner.isRemote) netKill(owner.id);
    }
    const idx = owner.cells.indexOf(victim);
    if (idx >= 0) owner.cells.splice(idx, 1);
    if (!owner.cells.length) {
      owner.dead = true;
      if (!owner.isHuman && !owner.isRemote) {
        setTimeout(() => {
          if ((mode === "play" || mode === "menu") && remoteCount === 0) {
            const pos = randomEmpty();
            owner.dead = false;
            owner.color = pick(PLAYER_COLORS);
            makeCell(owner, pos.x, pos.y, rand(18, 40));
          }
        }, rand(800, 2200));
      }
    }
  }

  function canEat(a, b) {
    if (a.mass < b.mass * EAT_RATIO) return false;
    const d = hypot(a.x - b.x, a.y - b.y);
    return d < radius(a.mass) - radius(b.mass) * 0.38;
  }

  function moveCell(cell, tx, ty, dt) {
    const dx = tx - cell.x;
    const dy = ty - cell.y;
    const dist = hypot(dx, dy);
    const spd = speedFor(cell.mass);
    if (dist > 4) {
      const nx = dx / dist;
      const ny = dy / dist;
      const reach = Math.min(1, dist / 90);
      cell.vx += (nx * spd * reach - cell.vx) * Math.min(1, 8 * dt);
      cell.vy += (ny * spd * reach - cell.vy) * Math.min(1, 8 * dt);
    } else {
      cell.vx *= 0.9;
      cell.vy *= 0.9;
    }
    cell.bx *= Math.pow(0.08, dt);
    cell.by *= Math.pow(0.08, dt);
    cell.x += (cell.vx + cell.bx) * dt;
    cell.y += (cell.vy + cell.by) * dt;
    const r = radius(cell.mass);
    cell.x = clamp(cell.x, r, WORLD_W - r);
    cell.y = clamp(cell.y, r, WORLD_H - r);
    cell.show += (cell.mass - cell.show) * Math.min(1, 10 * dt);
  }

  function applyMoveFuel(p, dt) {
    if (!p || p.dead || p.isRemote) return;
    for (const cell of p.cells) {
      const spd = hypot(cell.vx + cell.bx, cell.vy + cell.by);
      if (spd < 28) continue;
      const full = Math.max(40, speedFor(cell.mass));
      const sizeFactor = 0.4 + Math.sqrt(Math.max(1, cell.mass)) * 0.09;
      const burn = MOVE_BURN * Math.min(1.45, spd / full) * sizeFactor * dt;
      cell.mass = Math.max(MOVE_MIN_MASS, cell.mass - burn);
    }
  }

  function interpolateRemote(p, dt) {
    for (const cell of p.cells) {
      cell.x += (cell.tx - cell.x) * Math.min(1, 14 * dt);
      cell.y += (cell.ty - cell.y) * Math.min(1, 14 * dt);
      cell.show += (cell.mass - cell.show) * Math.min(1, 10 * dt);
    }
  }

  function separateSamePlayer(p) {
    const now = performance.now();
    for (let i = 0; i < p.cells.length; i++) {
      for (let j = i + 1; j < p.cells.length; j++) {
        const a = p.cells[i];
        const b = p.cells[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = hypot(dx, dy) || 0.01;
        const min = radius(a.show) + radius(b.show);
        if (dist >= min) continue;
        const ready = now > a.mergeAt && now > b.mergeAt;
        if (ready) {
          if (a.mass >= b.mass) {
            a.mass += b.mass;
            a.mergeAt = now + 400;
            p.cells.splice(j, 1);
            j--;
          } else {
            b.mass += a.mass;
            b.mergeAt = now + 400;
            p.cells.splice(i, 1);
            i--;
            break;
          }
        } else {
          const overlap = (min - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }

  function retargetBot(p, now) {
    const body = centerOfMass(p);
    let threat = null;
    let threatD = 420;
    let prey = null;
    let preyD = 520;
    let food = null;
    let foodD = 380;
    for (const o of players) {
      if (o === p || o.dead) continue;
      for (const c of o.cells) {
        const d = hypot(c.x - body.x, c.y - body.y);
        if (c.mass > body.mass * 1.18 && d < threatD) {
          threat = c;
          threatD = d;
        } else if (body.mass > c.mass * EAT_RATIO && d < preyD) {
          prey = c;
          preyD = d;
        }
      }
    }
    const nearby = [];
    foodHash.query(body.x, body.y, 420, nearby);
    for (const f of nearby) {
      const d = hypot(f.x - body.x, f.y - body.y);
      if (d < foodD) {
        food = f;
        foodD = d;
      }
    }
    if (threat && (p.ai.kind !== "hunter" || threatD < 260)) {
      const dx = body.x - threat.x;
      const dy = body.y - threat.y;
      const d = hypot(dx, dy) || 1;
      p.ai.tx = clamp(body.x + (dx / d) * 500, 80, WORLD_W - 80);
      p.ai.ty = clamp(body.y + (dy / d) * 500, 80, WORLD_H - 80);
    } else if (prey && p.ai.kind !== "scared") {
      p.ai.tx = prey.x;
      p.ai.ty = prey.y;
      if (p.ai.kind === "hunter" && preyD < 220 && body.mass > SPLIT_MIN * 1.4 && Math.random() < 0.012) {
        splitPlayer(p);
      }
    } else if (food) {
      p.ai.tx = food.x;
      p.ai.ty = food.y;
    } else {
      p.ai.tx = clamp(body.x + rand(-400, 400), 80, WORLD_W - 80);
      p.ai.ty = clamp(body.y + rand(-400, 400), 80, WORLD_H - 80);
    }
    p.ai.retarget = now + rand(180, 520);
  }

  function hideFood(f, ms) {
    f.alive = false;
    f.hideUntil = Math.max(f.hideUntil, performance.now() + ms);
  }

  function update(dt) {
    const now = performance.now();
    animT += dt;
    for (const f of foods) {
      if (!f.alive && now > f.hideUntil) f.alive = true;
    }
    foodHash.clear();
    for (const f of foods) if (f.alive) foodHash.insert(f);

    const aim = worldMouse();
    for (const p of players) {
      if (p.dead) continue;
      if (p.isRemote) {
        interpolateRemote(p, dt);
        continue;
      }
      if (!p.isHuman && now > p.ai.retarget) retargetBot(p, now);
      const target = p.isHuman ? aim : { x: p.ai.tx, y: p.ai.ty };
      for (const cell of p.cells) moveCell(cell, target.x, target.y, dt);
      if (p === me) applyMoveFuel(p, dt);
      separateSamePlayer(p);
    }

    for (let i = virusFoods.length - 1; i >= 0; i--) {
      const f = virusFoods[i];
      f.age += dt;
      f.vx *= Math.pow(0.02, dt);
      f.vy *= Math.pow(0.02, dt);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.x = clamp(f.x, 6, WORLD_W - 6);
      f.y = clamp(f.y, 6, WORLD_H - 6);
      if (f.age > 0.45 && hypot(f.vx, f.vy) < 8) {
        f.vx = 0;
        f.vy = 0;
      }
    }

    for (const p of players) {
      if (p.dead || p.isRemote) continue;
      for (const cell of p.cells) {
        const r = radius(cell.mass);
        const nearby = [];
        foodHash.query(cell.x, cell.y, r + 12, nearby);
        for (const f of nearby) {
          if (!f.alive) continue;
          if (hypot(cell.x - f.x, cell.y - f.y) < r - 1) {
            cell.mass += f.mass;
            hideFood(f, 9000);
            if (p === me) eatenQueue.push(f.id);
          }
        }
        for (let i = virusFoods.length - 1; i >= 0; i--) {
          const f = virusFoods[i];
          if (hypot(cell.x - f.x, cell.y - f.y) < r - 1) {
            cell.mass += f.mass;
            virusFoods.splice(i, 1);
          }
        }
      }
    }

    for (let i = ejects.length - 1; i >= 0; i--) {
      const e = ejects[i];
      e.age += dt;
      e.vx *= Math.pow(0.04, dt);
      e.vy *= Math.pow(0.04, dt);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, 8, WORLD_W - 8);
      e.y = clamp(e.y, 8, WORLD_H - 8);
      let eaten = false;
      for (const v of viruses) {
        if (hypot(e.x - v.x, e.y - v.y) < radius(v.mass) * 0.9) {
          v.mass += e.mass * 0.7;
          if (v.mass > VIRUS_MAX) {
            v.mass = VIRUS_MASS;
            const dx = e.x - v.x;
            const dy = e.y - v.y;
            const d = hypot(dx, dy) || 1;
            if (viruses.length < VIRUS_COUNT + 6) {
              spawnVirus(v.x + (dx / d) * 30, v.y + (dy / d) * 30, VIRUS_MASS);
              const nv = viruses[viruses.length - 1];
              nv._bx = (dx / d) * 700;
              nv._by = (dy / d) * 700;
            }
          }
          eaten = true;
          break;
        }
      }
      if (!eaten) {
        for (const p of players) {
          if (p.dead || p.isRemote) continue;
          for (const cell of p.cells) {
            if (hypot(cell.x - e.x, cell.y - e.y) < radius(cell.mass) - 2) {
              cell.mass += e.mass;
              eaten = true;
              break;
            }
          }
          if (eaten) break;
        }
      }
      if (eaten || e.age >= EJECT_LIFE) {
        ejects.splice(i, 1);
      }
    }

    for (const v of viruses) {
      if (v._bx) {
        v.x += v._bx * dt;
        v.y += v._by * dt;
        v._bx *= Math.pow(0.05, dt);
        v._by *= Math.pow(0.05, dt);
        const r = radius(v.mass);
        v.x = clamp(v.x, r, WORLD_W - r);
        v.y = clamp(v.y, r, WORLD_H - r);
      }
      v.angle += dt * 0.12;
    }
    updateVirusSpit(dt);

    for (const p of players) {
      if (p.dead || p.isRemote) continue;
      for (const cell of p.cells.slice()) {
        if (!p.cells.includes(cell)) continue;
        for (const v of viruses) {
          const vr = radius(v.mass) * 0.92;
          if (cell.mass > v.mass * 1.18 && hypot(cell.x - v.x, cell.y - v.y) < radius(cell.mass) - vr * 0.25) {
            const vi = viruses.indexOf(v);
            if (vi >= 0) viruses.splice(vi, 1);
            if (p.cells.length >= cellLimit(p)) {
              cell.mass += VIRUS_EAT_MASS;
              burst(v.x, v.y, "#3f7a52", 18, 12);
              if (p === me) {
                floatText(v.x, v.y, `+${VIRUS_EAT_MASS}`);
                beep(280, 0.1, "sine", 0.05);
              }
            } else {
              explodeCell(p, cell);
              cell.mass += VIRUS_EAT_MASS;
              burst(v.x, v.y, "#3f7a52", 14, 10);
              if (p === me) {
                floatText(v.x, v.y, `+${VIRUS_EAT_MASS}`);
                beep(140, 0.16, "sawtooth", 0.04);
              }
            }
            if (viruses.length < VIRUS_COUNT) spawnVirus();
            break;
          }
        }
      }
    }

    const alive = players.filter((p) => !p.dead);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        if (a.isRemote && b.isRemote) continue;
        for (const ca of a.cells.slice()) {
          if (!a.cells.includes(ca)) continue;
          for (const cb of b.cells.slice()) {
            if (!b.cells.includes(cb)) continue;
            if (canEat(ca, cb)) eatCell(ca, cb, b);
            else if (canEat(cb, ca)) eatCell(cb, ca, a);
          }
        }
      }
    }

    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      if (p.life <= 0) pops.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].life -= dt;
      floats[i].y -= 28 * dt;
      if (floats[i].life <= 0) floats.splice(i, 1);
    }

    updateCamera(dt);
    pruneStaleRemotes();
    bumpSession();
    netTimer += dt;
    if (netTimer > 0.08) {
      netTimer = 0;
      netPublish();
      flushEaten();
    }
    lbTimer += dt;
    if (lbTimer > 0.25) {
      lbTimer = 0;
      refreshHud();
    }

    if (mode === "play" && me && me.dead) {
      mode = "dead";
      const endScore = Math.round(Number(scoreEl.textContent) || 0);
      const peak = Math.max(peakScore, endScore);
      const name = me.name || (nickEl.value || "").trim() || "Blob";
      best = Math.max(best, peak);
      localStorage.setItem("blobio-best", String(best));
      let gained = 0;
      if (hasAccount()) gained = awardGlory(peak);
      saveCloudBest();
      if (deathTitleEl) deathTitleEl.textContent = killedSelf ? "Gave up" : "Eaten";
      killedSelf = false;
      if (deathPeakEl) deathPeakEl.textContent = String(peak);
      deathScoreEl.textContent = String(endScore);
      deathBestEl.textContent = String(Math.round(best));
      if (deathAccountEl) deathAccountEl.classList.toggle("hidden", !hasAccount());
      if (deathLevelEl) deathLevelEl.textContent = String(level);
      if (deathGloryEl) deathGloryEl.textContent = String(gained);
      death.classList.remove("hidden");
      hud.classList.add("hidden");
      syncMenuChrome();
      beep(110, 0.25, "sine", 0.07);
      netLeave(true);
      submitHallScore(name, peak);
    }
  }

  function updateCamera(dt) {
    let target = { x: camera.x, y: camera.y, mass: 40, r: 40 };
    if (mode === "play" && me && !me.dead) target = centerOfMass(me);
    else {
      let bestP = null;
      let bestM = 0;
      for (const p of players) {
        if (p.dead) continue;
        const m = totalMass(p);
        if (m > bestM) {
          bestM = m;
          bestP = p;
        }
      }
      if (bestP) target = centerOfMass(bestP);
    }
    camera.x += (target.x - camera.x) * Math.min(1, 5 * dt);
    camera.y += (target.y - camera.y) * Math.min(1, 5 * dt);
    const spread = me && me.cells.length > 1 ? 1 + (me.cells.length - 1) * 0.045 : 1;
    const sizeZoom = 1.08 / (Math.sqrt(Math.max(12, target.mass)) * 0.055 * spread);
    const want = clamp(sizeZoom, 0.34, 1.18);
    camera.scale += (want - camera.scale) * Math.min(1, 3 * dt);
    camera.scale = clamp(camera.scale, 0.34, 1.18);
  }

  function refreshHud() {
    const ranked = players
      .filter((p) => !p.dead)
      .map((p) => ({ p, m: totalMass(p) }))
      .sort((a, b) => b.m - a.m)
      .slice(0, 10);
    lbList.innerHTML = ranked
      .map((row, i) => {
        const mine = row.p === me ? " class=\"me\"" : "";
        return `<li${mine}><span class="lb-name"><i class="dot" style="background:${row.p.color}"></i>${i + 1}. ${escapeHtml(row.p.name)}</span><span class="mass">${Math.round(row.m)}</span></li>`;
      })
      .join("");
    if (me && !me.dead) {
      const score = Math.round(totalMass(me));
      scoreEl.textContent = String(score);
      if (score > peakScore) peakScore = score;
      if (peakScore > best) {
        best = peakScore;
        localStorage.setItem("blobio-best", String(best));
      }
    }
    if (netReady) {
      const n = 1 + remoteCount;
      setNetStatus(mode === "play" ? `Online · ${n}` : `Online · ${remoteCount} others`, "ok");
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function drawGrid() {
    const step = 48;
    const left = camera.x - viewW / 2 / camera.scale;
    const right = camera.x + viewW / 2 / camera.scale;
    const top = camera.y - viewH / 2 / camera.scale;
    const bottom = camera.y + viewH / 2 / camera.scale;
    ctx.beginPath();
    ctx.strokeStyle = dark ? "rgba(140,170,210,0.045)" : "rgba(50,80,110,0.055)";
    ctx.lineWidth = 1 / camera.scale;
    const x0 = Math.floor(left / step) * step;
    const y0 = Math.floor(top / step) * step;
    for (let x = x0; x <= right; x += step) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = y0; y <= bottom; y += step) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
    ctx.strokeStyle = dark ? "rgba(90, 140, 190, 0.35)" : "rgba(70, 120, 170, 0.32)";
    ctx.lineWidth = 10 / camera.scale;
    ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
  }

  function drawFood() {
    const pad = 24;
    const left = camera.x - viewW / 2 / camera.scale - pad;
    const right = camera.x + viewW / 2 / camera.scale + pad;
    const top = camera.y - viewH / 2 / camera.scale - pad;
    const bottom = camera.y + viewH / 2 / camera.scale + pad;
    for (const f of foods) {
      if (!f.alive) continue;
      if (f.x < left || f.x > right || f.y < top || f.y > bottom) continue;
      ctx.beginPath();
      ctx.fillStyle = f.color;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const f of virusFoods) {
      if (f.x < left || f.x > right || f.y < top || f.y > bottom) continue;
      ctx.beginPath();
      ctx.fillStyle = f.color;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of ejects) {
      const r = radius(e.mass) * 0.9;
      ctx.beginPath();
      ctx.fillStyle = e.color;
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVirus(v) {
    const r = radius(v.mass) * 0.9;
    const spikes = 16;
    const outer = r;
    const inner = r * 0.72;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = v.angle + (i / (spikes * 2)) * Math.PI * 2;
      const rr = i % 2 === 0 ? outer : inner;
      const x = v.x + Math.cos(a) * rr;
      const y = v.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "#3f7a52";
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.strokeStyle = "#244a32";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(v.x, v.y, inner * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = "#356846";
    ctx.fill();
  }

  function drawCell(cell) {
    const r = radius(cell.show);
    const p = cell.player;
    const useSkin = p === me && skinImg && skinImg.complete && skinImg.naturalWidth > 0;
    ctx.save();
    if (p === me) {
      ctx.shadowColor = rgba(p.color, 0.14);
      ctx.shadowBlur = Math.min(10, r * 0.1);
    }
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, r, 0, Math.PI * 2);
    if (useSkin) {
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, r, 0, Math.PI * 2);
      ctx.clip();
      const iw = skinImg.naturalWidth;
      const ih = skinImg.naturalHeight;
      const scale = Math.max((r * 2) / iw, (r * 2) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(skinImg, cell.x - dw / 2, cell.y - dh / 2, dw, dh);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, r, 0, Math.PI * 2);
    } else {
      const g = ctx.createRadialGradient(cell.x, cell.y, r * 0.55, cell.x, cell.y, r);
      g.addColorStop(0, p.color);
      g.addColorStop(1, shade(p.color, -22));
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, r * 0.055);
    ctx.strokeStyle = "rgba(8,16,28,0.28)";
    ctx.stroke();
    if (r * camera.scale > 10) {
      ctx.fillStyle = "#e8eef6";
      ctx.strokeStyle = "rgba(8,16,28,0.45)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let font = r * 0.4;
      ctx.font = `800 ${font}px Syne, DM Sans, sans-serif`;
      const maxW = r * 1.55;
      const nameW = ctx.measureText(p.name).width || 1;
      if (nameW > maxW) font *= maxW / nameW;
      font = Math.max(9, font);
      ctx.font = `800 ${font}px Syne, DM Sans, sans-serif`;
      ctx.lineWidth = Math.max(1.8, font * 0.14);
      ctx.strokeText(p.name, cell.x, cell.y - font * 0.14);
      ctx.fillText(p.name, cell.x, cell.y - font * 0.14);
      if (r * camera.scale > 18) {
        const mFont = Math.max(8, font * 0.52);
        ctx.font = `800 ${mFont}px Syne, DM Sans, sans-serif`;
        ctx.lineWidth = Math.max(1.4, mFont * 0.14);
        const mass = String(Math.round(cell.mass));
        ctx.strokeText(mass, cell.x, cell.y + font * 0.55);
        ctx.fillText(mass, cell.x, cell.y + font * 0.55);
      }
    }
    ctx.restore();
  }

  function render() {
    ctx.fillStyle = dark ? "#0a1018" : "#d8e2ec";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);
    drawGrid();
    drawFood();
    for (const v of viruses) drawVirus(v);
    const cells = [];
    for (const p of players) if (!p.dead) for (const c of p.cells) cells.push(c);
    cells.sort((a, b) => a.mass - b.mass);
    for (const c of cells) drawCell(c);
    for (const p of pops) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life / 0.7);
      ctx.fillStyle = dark ? "#f2f6fb" : "#16324f";
      ctx.font = "800 16px Syne, DM Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.2, viewW / 2, viewH / 2, viewH * 0.88);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, dark ? "rgba(4,10,18,0.55)" : "rgba(30,50,70,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, viewW, viewH);
    drawMinimap();
  }

  function drawMinimap() {
    if (hud.classList.contains("hidden")) return;
    const w = mini.width;
    const h = mini.height;
    mctx.clearRect(0, 0, w, h);
    mctx.fillStyle = dark ? "rgba(8,14,28,0.35)" : "rgba(255,255,255,0.08)";
    mctx.fillRect(0, 0, w, h);
    const sx = w / WORLD_W;
    const sy = h / WORLD_H;
    for (const p of players) {
      if (p.dead) continue;
      const c = centerOfMass(p);
      mctx.fillStyle = p === me ? "#fff" : p.color;
      const s = p === me ? 5 : 3.2;
      mctx.beginPath();
      mctx.arc(c.x * sx, c.y * sy, s, 0, Math.PI * 2);
      mctx.fill();
    }
    const vw = viewW / camera.scale;
    const vh = viewH / camera.scale;
    mctx.strokeStyle = "rgba(255,255,255,0.75)";
    mctx.lineWidth = 1;
    mctx.strokeRect((camera.x - vw / 2) * sx, (camera.y - vh / 2) * sy, vw * sx, vh * sy);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function netKill(id) {
    if (!db || !netReady) return;
    db.ref(`${NET_PATH}/kills/${id}`).set({ by: myNetId, t: Date.now() });
  }

  function flushEaten() {
    if (!db || !netReady || !eatenQueue.length) return;
    const q = eatenQueue.slice(-40).join(",");
    eatenQueue = [];
    db.ref(`${NET_PATH}/eaten/${myNetId}`).set({ q, t: Date.now() });
  }

  function applyRemoteEaten(data) {
    if (!data || !data.q) return;
    const ids = String(data.q).split(",");
    for (const raw of ids) {
      const id = Number(raw);
      if (foods[id]) hideFood(foods[id], 8000);
    }
  }

  function applyRemotePlayer(id, data) {
    if (id === myNetId) return;
    if (!data || !data.a || !data.t || Date.now() - data.t > STALE_NET_MS) {
      const purge = !!(data && (!data.a || !data.t || Date.now() - data.t > STALE_NET_MS));
      dropRemotePlayer(id, purge);
      return;
    }
    let p = players.find((x) => x.id === id);
    if (!p) {
      const first = (data.s && data.s[0]) || { x: WORLD_W / 2, y: WORLD_H / 2, m: START_MASS };
      p = makePlayer(data.n, data.c, true, first.x, first.y, first.m, id);
      p.isRemote = true;
      p.ai.retarget = Infinity;
      stripBots();
    }
    p.name = data.n || p.name;
    p.color = data.c || p.color;
    p.dead = false;
    p.lastNet = Date.now();
    const cells = data.s || [];
    while (p.cells.length < cells.length) {
      const src = cells[p.cells.length];
      makeCell(p, src.x, src.y, src.m);
    }
    while (p.cells.length > cells.length) p.cells.pop();
    for (let i = 0; i < cells.length; i++) {
      const src = cells[i];
      const cell = p.cells[i];
      if (!cell._got) {
        cell.x = src.x;
        cell.y = src.y;
        cell._got = true;
      }
      cell.tx = src.x;
      cell.ty = src.y;
      cell.mass = src.m;
    }
    remoteCount = players.filter((pl) => pl.isRemote && !pl.dead).length;
  }

  function netPublish() {
    if (!playerRef || !me || me.dead || mode !== "play") return;
    const s = me.cells.map((c) => ({
      x: Math.round(c.x * 10) / 10,
      y: Math.round(c.y * 10) / 10,
      m: Math.round(c.mass * 10) / 10,
    }));
    playerRef.set({
      n: String(me.name).slice(0, 16),
      c: me.color,
      a: 1,
      m: Math.round(totalMass(me)),
      s,
      t: Date.now(),
    }).catch((err) => {
      netReady = false;
      const msg = String(err && err.code === "PERMISSION_DENIED" ? "Deploy Blobio Firebase rules" : "Online write failed");
      setNetStatus(msg, "bad");
    });
  }

  function netJoin() {
    if (!db || !netReady || !me) return;
    playerRef = db.ref(`${NET_PATH}/players/${myNetId}`);
    playerRef.onDisconnect().remove();
    netPublish();
    db.ref(`${NET_PATH}/kills/${myNetId}`).on("value", (snap) => {
      const val = snap.val();
      if (val && val.by && val.by !== myNetId && me && !me.dead) {
        me.dead = true;
        me.cells.length = 0;
      }
    });
  }

  function ensureNetPresence() {
    if (!db || !netReady || mode !== "play" || !me || me.dead) return;
    if (!playerRef) playerRef = db.ref(`${NET_PATH}/players/${myNetId}`);
    playerRef.onDisconnect().remove();
    netPublish();
  }

  function netLeave(remove = true) {
    if (playerRef) {
      try {
        playerRef.onDisconnect().cancel();
      } catch (_) {}
      if (remove) playerRef.remove();
      else playerRef.update({ a: 0, s: [], m: 0, t: Date.now() });
    }
    playerRef = null;
  }

  function hasAccount() {
    return !!(authUser && !authUser.isAnonymous);
  }

  function gloryToReachLevel(lvl) {
    const n = Math.max(1, Math.min(99, Math.floor(lvl)));
    if (n <= 1) return 0;
    let total = 0;
    for (let i = 1; i < n; i++) total += Math.round(35 + i * 30 + i * i * 2.2);
    return total;
  }

  function levelFromGlory(g) {
    const gloryPts = Math.max(0, Number(g) || 0);
    let lvl = 1;
    while (lvl < 99 && gloryPts >= gloryToReachLevel(lvl + 1)) lvl++;
    return lvl;
  }

  function syncLevelFromGlory() {
    level = hasAccount() ? levelFromGlory(glory) : 1;
    return level;
  }

  function awardGlory(score) {
    if (!hasAccount()) return 0;
    const gained = Math.max(0, Math.round(Number(score) || 0));
    if (gained <= 0) {
      syncLevelFromGlory();
      refreshLevelUi();
      return 0;
    }
    glory += gained;
    syncLevelFromGlory();
    refreshLevelUi();
    return gained;
  }

  function refreshLevelUi() {
    const account = hasAccount();
    syncLevelFromGlory();
    if (accountStatsEl) accountStatsEl.classList.toggle("hidden", !account);
    if (deathAccountEl) deathAccountEl.classList.toggle("hidden", !account || mode !== "dead");
    if (levelEl) levelEl.textContent = String(level);
    if (gloryEl) gloryEl.textContent = String(Math.round(glory));
    if (authLevelEl) authLevelEl.textContent = `Lv ${level} · ${Math.round(glory)} glory`;
    if (deathLevelEl) deathLevelEl.textContent = String(level);
  }

  function syncMenuChrome() {
    const onMenu = mode === "menu";
    if (hallBoardEl) hallBoardEl.classList.toggle("hidden", !onMenu);
    if (creditEl) creditEl.classList.toggle("hidden", !onMenu);
    if (chatBoardEl) chatBoardEl.classList.toggle("in-play", mode === "play");
  }

  function updateAuthUi() {
    const signedIn = hasAccount();
    if (googleBtn) googleBtn.classList.toggle("hidden", signedIn);
    if (authUserEl) authUserEl.classList.toggle("hidden", !signedIn);
    if (!signedIn) {
      glory = 0;
      level = 1;
    }
    refreshLevelUi();
    if (!signedIn) return;
    const name = authUser.displayName || authUser.email || "Player";
    if (authNameEl) authNameEl.textContent = name;
    if (authAvatarEl) {
      if (authUser.photoURL) {
        authAvatarEl.src = authUser.photoURL;
        authAvatarEl.classList.remove("hidden");
      } else {
        authAvatarEl.removeAttribute("src");
        authAvatarEl.classList.add("hidden");
      }
    }
  }

  function loadCloudBest(uid) {
    if (!db || !uid) return;
    db.ref(`${USERS_PATH}/${uid}`)
      .once("value")
      .then((snap) => {
        const data = snap.val() || {};
        const cloudBest = Number(data.best || 0);
        const cloudGlory = Number(data.glory || 0);
        if (cloudBest > best) {
          best = cloudBest;
          localStorage.setItem("blobio-best", String(best));
        }
        glory = Math.max(0, cloudGlory);
        if (bestEl) bestEl.textContent = String(Math.round(best));
        syncLevelFromGlory();
        refreshLevelUi();
        saveCloudBest();
      })
      .catch(() => {});
  }

  function saveCloudBest() {
    if (!db || !hasAccount()) return;
    syncLevelFromGlory();
    db.ref(`${USERS_PATH}/${authUser.uid}`).update({
      best: Math.round(best),
      glory: Math.round(glory),
      level,
      nick: String((nickEl && nickEl.value) || authUser.displayName || "Blob").slice(0, 16),
      t: Date.now(),
    }).catch(() => {});
  }

  function signInWithGoogle() {
    if (!auth) {
      setNetStatus("Auth unavailable", "bad");
      return;
    }
    if (googleBtn) googleBtn.disabled = true;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    auth
      .signInWithPopup(provider)
      .catch((err) => {
        const code = err && err.code ? String(err.code) : "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
        setNetStatus("Google sign-in failed", "bad");
      })
      .finally(() => {
        if (googleBtn) googleBtn.disabled = false;
      });
  }

  function signOutAuth() {
    if (!auth) return;
    auth.signOut().catch(() => {});
  }

  function bindAuthUi() {
    if (googleBtn) googleBtn.addEventListener("click", signInWithGoogle);
    if (authSignOutBtn) authSignOutBtn.addEventListener("click", signOutAuth);
  }

  function normalizeHall(list) {
    const rows = Array.isArray(list) ? list : list && typeof list === "object" ? Object.values(list) : [];
    const byUid = new Map();
    for (const r of rows) {
      if (!r || typeof r.n !== "string" || typeof r.s !== "number" || r.s < 0) continue;
      const uid = typeof r.u === "string" ? r.u.trim() : "";
      if (!uid) continue;
      const row = {
        n: String(r.n).slice(0, 16),
        s: Math.round(r.s),
        t: typeof r.t === "number" ? r.t : 0,
        u: uid.slice(0, 128),
      };
      const prev = byUid.get(row.u);
      if (!prev || row.s > prev.s || (row.s === prev.s && row.t < prev.t)) byUid.set(row.u, row);
    }
    return [...byUid.values()].sort((a, b) => b.s - a.s || a.t - b.t).slice(0, HALL_STORE);
  }

  function renderHall(list) {
    if (!hallListEl) return;
    const top = normalizeHall(list).slice(0, HALL_SHOW);
    if (!top.length) {
      hallListEl.innerHTML = `<li class="hall-empty">No records yet</li>`;
      return;
    }
    hallListEl.innerHTML = top
      .map(
        (row, i) =>
          `<li><span>${i + 1}. ${escapeHtml(row.n)}</span><span class="hall-score">${row.s}</span></li>`
      )
      .join("");
  }

  function submitHallScore(name, score) {
    if (!db || !netReady || !hasAccount()) return;
    const s = Math.round(Number(score) || 0);
    if (s <= 0) return;
    const n = String(name || "Blob").trim().slice(0, 16) || "Blob";
    const u = String(authUser.uid).slice(0, 128);
    db.ref(HALL_PATH)
      .transaction((current) => {
        const rows = normalizeHall(current);
        const mine = rows.find((row) => row.u === u);
        if (mine && s <= mine.s) return;
        if (!mine && rows.length >= HALL_STORE && s <= rows[rows.length - 1].s) return;
        rows.push({ n, s, t: Date.now(), u });
        return normalizeHall(rows);
      })
      .catch(() => {});
  }

  function chatEpoch(now = Date.now()) {
    return Math.floor(now / CHAT_TTL_MS);
  }

  function chatWindowStart(now = Date.now()) {
    return chatEpoch(now) * CHAT_TTL_MS;
  }

  function updateChatTtl() {
    if (!chatTtlEl) return;
    const left = Math.max(0, chatWindowStart() + CHAT_TTL_MS - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    chatTtlEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
  }

  function renderChat(list) {
    if (!chatListEl) return;
    chatRaw = list;
    const minT = chatWindowStart();
    const rows = (Array.isArray(list) ? list : list && typeof list === "object" ? Object.values(list) : [])
      .filter((r) => r && typeof r.n === "string" && typeof r.m === "string" && typeof r.t === "number" && r.t >= minT)
      .sort((a, b) => a.t - b.t || 0)
      .slice(-CHAT_MAX);
    if (!rows.length) {
      chatListEl.innerHTML = `<li class="chat-empty">Public chat · wipes every 10 min</li>`;
      return;
    }
    const nearBottom = chatListEl.scrollHeight - chatListEl.scrollTop - chatListEl.clientHeight < 48;
    chatListEl.innerHTML = rows
      .map((row) => {
        const safeColor = typeof row.c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(row.c) ? row.c : "";
        const color = safeColor ? ` style="color:${safeColor}"` : "";
        return `<li><span class="chat-name"${color}>${escapeHtml(String(row.n).slice(0, 16))}</span>${escapeHtml(String(row.m).slice(0, 80))}</li>`;
      })
      .join("");
    if (nearBottom) chatListEl.scrollTop = chatListEl.scrollHeight;
  }

  function maybeWipeChat() {
    if (!db || !netReady) return;
    const epoch = chatEpoch();
    db.ref(`${CHAT_PATH}/cleared`)
      .transaction((cur) => {
        const e = cur && typeof cur.e === "number" ? cur.e : -1;
        if (e >= epoch) return;
        return { e: epoch, t: Date.now() };
      })
      .then((res) => {
        if (res.committed) db.ref(`${CHAT_PATH}/messages`).remove().catch(() => {});
      })
      .catch(() => {});
  }

  function isTyping() {
    const el = document.activeElement;
    return el === nickEl || el === chatInputEl;
  }

  function sendChat(e) {
    if (e) e.preventDefault();
    if (!db || !netReady) return;
    const m = String(chatInputEl && chatInputEl.value ? chatInputEl.value : "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    if (!m) return;
    const now = Date.now();
    if (now - lastChatSent < 900) return;
    lastChatSent = now;
    const n = ((me && me.name) || (nickEl && nickEl.value) || "Blob").trim().slice(0, 16) || "Blob";
    db.ref(`${CHAT_PATH}/messages`)
      .push({
        n,
        m,
        t: now,
        c: selectedColor,
      })
      .catch(() => {});
    if (chatInputEl) chatInputEl.value = "";
    maybeWipeChat();
  }

  function bindChat() {
    if (chatFormEl) chatFormEl.addEventListener("submit", sendChat);
  }

  function connectFirebase() {
    if (!window.firebase || !window.BLOBIO_FIREBASE) {
      netError = "offline";
      setNetStatus("Offline · bots only", "bad");
      if (hallListEl) hallListEl.innerHTML = `<li class="hall-empty">Offline</li>`;
      if (chatListEl) chatListEl.innerHTML = `<li class="chat-empty">Offline</li>`;
      if (googleBtn) googleBtn.disabled = true;
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(window.BLOBIO_FIREBASE);
      db = firebase.database();
      auth = firebase.auth();
      auth.onAuthStateChanged((user) => {
        authUser = user;
        updateAuthUi();
        if (user && !user.isAnonymous) {
          if (nickEl && !nickEl.value && user.displayName) {
            nickEl.value = String(user.displayName).slice(0, 16);
          }
          loadCloudBest(user.uid);
        }
      });
      db.ref(".info/connected").on("value", (snap) => {
        if (snap.val()) {
          netReady = true;
          ensureNetPresence();
          setNetStatus("Online", "ok");
          maybeWipeChat();
        } else {
          netReady = false;
          setNetStatus("Reconnecting…");
        }
      });
      db.ref(`${NET_PATH}/players`).on(
        "child_added",
        (snap) => applyRemotePlayer(snap.key, snap.val()),
        () => {
          netReady = false;
          setNetStatus("Deploy Blobio Firebase rules", "bad");
        }
      );
      db.ref(`${NET_PATH}/players`).on("child_changed", (snap) => applyRemotePlayer(snap.key, snap.val()));
      db.ref(`${NET_PATH}/players`).on("child_removed", (snap) => applyRemotePlayer(snap.key, null));
      db.ref(`${NET_PATH}/eaten`).on("child_added", (snap) => {
        if (snap.key !== myNetId) applyRemoteEaten(snap.val());
      });
      db.ref(`${NET_PATH}/eaten`).on("child_changed", (snap) => {
        if (snap.key !== myNetId) applyRemoteEaten(snap.val());
      });
      db.ref(HALL_PATH).on(
        "value",
        (snap) => renderHall(snap.val()),
        () => {
          if (hallListEl) hallListEl.innerHTML = `<li class="hall-empty">Unavailable</li>`;
        }
      );
      db.ref(`${CHAT_PATH}/messages`)
        .limitToLast(CHAT_MAX)
        .on(
          "value",
          (snap) => renderChat(snap.val()),
          () => {
            if (chatListEl) chatListEl.innerHTML = `<li class="chat-empty">Unavailable</li>`;
          }
        );
    } catch (err) {
      netError = String(err && err.message ? err.message : err);
      setNetStatus("Offline · bots only", "bad");
      if (hallListEl) hallListEl.innerHTML = `<li class="hall-empty">Offline</li>`;
      if (chatListEl) chatListEl.innerHTML = `<li class="chat-empty">Offline</li>`;
    }
  }

  function startGame() {
    ensureAudio();
    if (audio && audio.state === "suspended") audio.resume();
    const name = (nickEl.value || "").trim() || "Blob";
    localStorage.setItem("blobio-nick", name);
    claimSession();
    spawnMe(name);
    mode = "play";
    menu.classList.add("hidden");
    death.classList.add("hidden");
    hud.classList.remove("hidden");
    syncMenuChrome();
    refreshHud();
    netJoin();
  }

  function toMenu() {
    mode = "menu";
    netLeave(true);
    releaseSession();
    if (me) {
      me.dead = true;
      me.cells.length = 0;
      me = null;
    }
    death.classList.add("hidden");
    hud.classList.add("hidden");
    menu.classList.remove("hidden");
    bestEl.textContent = String(Math.round(best));
    syncNpcPopulation();
    syncMenuChrome();
    refreshLevelUi();
  }

  function bindInput() {
    window.addEventListener("resize", resize);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.metaKey) e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener(
      "gesturestart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener(
      "gesturechange",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        const k = e.key;
        if (k === "+" || k === "-" || k === "=" || k === "_" || k === "0") e.preventDefault();
      },
      true
    );
    window.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("pointerdown", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.down = true;
    });
    window.addEventListener("pointerup", () => {
      mouse.down = false;
    });
    window.addEventListener("keydown", (e) => {
      if (isTyping()) {
        if (e.code === "Escape") {
          e.preventDefault();
          if (chatInputEl) chatInputEl.blur();
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (mode === "play" && me && !me.dead) splitPlayer(me);
      } else if (e.code === "KeyW") {
        e.preventDefault();
        if (mode === "play" && me && !me.dead) ejectPlayer(me);
      } else if (e.code === "Escape") {
        e.preventDefault();
        killSelf();
      } else if (e.code === "KeyD" && document.activeElement !== nickEl) {
        e.preventDefault();
        toggleTheme();
      } else if (e.code === "Enter") {
        e.preventDefault();
        if (mode === "menu") startGame();
        else if (mode === "play" && chatInputEl) chatInputEl.focus();
      }
    });
    document.getElementById("play").addEventListener("click", startGame);
    document.getElementById("again").addEventListener("click", () => {
      death.classList.add("hidden");
      myNetId = "p" + Math.random().toString(36).slice(2, 10);
      startGame();
    });
    document.getElementById("home").addEventListener("click", toMenu);
    document.getElementById("btn-split").addEventListener("click", (e) => {
      e.preventDefault();
      if (mode === "play" && me && !me.dead) splitPlayer(me);
    });
    document.getElementById("btn-eject").addEventListener("click", (e) => {
      e.preventDefault();
      if (mode === "play" && me && !me.dead) ejectPlayer(me);
    });
    document.getElementById("btn-exit").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      killSelf();
    });
    nickEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startGame();
    });
    themeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }

  function updateSkinUi() {
    const on = !!(skinImg && skinImg.complete && skinImg.naturalWidth);
    skinClearEl.classList.toggle("hidden", !on);
    skinPreviewEl.classList.toggle("hidden", !on);
    if (on) {
      const pctx = skinPreviewEl.getContext("2d");
      pctx.clearRect(0, 0, 40, 40);
      pctx.save();
      pctx.beginPath();
      pctx.arc(20, 20, 20, 0, Math.PI * 2);
      pctx.clip();
      const iw = skinImg.naturalWidth;
      const ih = skinImg.naturalHeight;
      const scale = Math.max(40 / iw, 40 / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      pctx.drawImage(skinImg, 20 - dw / 2, 20 - dh / 2, dw, dh);
      pctx.restore();
    }
  }

  function setSkinFromBlob(blob) {
    if (!blob) {
      skinImg = null;
      updateSkinUi();
      return;
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      if (skinImg && skinImg._objectUrl) URL.revokeObjectURL(skinImg._objectUrl);
      img._objectUrl = url;
      skinImg = img;
      updateSkinUi();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function saveSkinToCache(blob) {
    if (!window.caches) return;
    try {
      const cache = await caches.open(SKIN_CACHE);
      await cache.put(SKIN_CACHE_URL, new Response(blob, { headers: { "Content-Type": blob.type || "image/png" } }));
    } catch (_) {}
  }

  async function clearSkinCache() {
    if (!window.caches) return;
    try {
      const cache = await caches.open(SKIN_CACHE);
      await cache.delete(SKIN_CACHE_URL);
    } catch (_) {}
  }

  async function loadSkinFromCache() {
    if (!window.caches) return;
    try {
      const cache = await caches.open(SKIN_CACHE);
      const res = await cache.match(SKIN_CACHE_URL);
      if (!res) return;
      const blob = await res.blob();
      setSkinFromBlob(blob);
    } catch (_) {}
  }

  function compressSkinFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = 256;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const scale = Math.min(1, max / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        c.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("skin encode failed"));
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("skin load failed"));
      };
      img.src = url;
    });
  }

  function buildColors() {
    for (const c of PLAYER_COLORS) {
      const b = document.createElement("button");
      b.type = "button";
      b.style.background = `radial-gradient(circle at 32% 28%, ${shade(c, 24)} 0 14%, ${c} 52%, ${shade(c, -28)})`;
      b.setAttribute("aria-label", `Color ${c}`);
      if (c === selectedColor) b.classList.add("selected");
      b.addEventListener("click", () => {
        selectedColor = c;
        for (const el of colorsEl.children) el.classList.remove("selected");
        b.classList.add("selected");
      });
      colorsEl.appendChild(b);
    }
  }

  function bindSkinUi() {
    skinFileEl.addEventListener("change", async () => {
      const file = skinFileEl.files && skinFileEl.files[0];
      skinFileEl.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      try {
        const blob = await compressSkinFile(file);
        setSkinFromBlob(blob);
        await saveSkinToCache(blob);
      } catch (_) {}
    });
    skinClearEl.addEventListener("click", async () => {
      if (skinImg && skinImg._objectUrl) URL.revokeObjectURL(skinImg._objectUrl);
      skinImg = null;
      updateSkinUi();
      await clearSkinCache();
    });
  }

  nickEl.value = localStorage.getItem("blobio-nick") || "";
  bestEl.textContent = String(Math.round(best));
  refreshLevelUi();
  applyTheme();
  buildColors();
  bindSkinUi();
  bindAuthUi();
  loadSkinFromCache();
  bindSessionLock();
  bindInput();
  bindChat();
  updateChatTtl();
  setInterval(() => {
    const epoch = chatEpoch();
    updateChatTtl();
    if (epoch !== chatEpoch(Date.now() - 1100)) {
      renderChat(chatRaw);
      maybeWipeChat();
    }
  }, 1000);
  resize();
  initWorld();
  connectFirebase();
  updateAuthUi();
  syncMenuChrome();
  mouse.x = viewW / 2;
  mouse.y = viewH / 2;
  if (location.hash === "#play") {
    if (!nickEl.value) nickEl.value = "Blob";
    startGame();
  }
  requestAnimationFrame(loop);

  window.addEventListener("beforeunload", () => {
    netLeave(true);
    releaseSession();
  });
  window.addEventListener("pagehide", () => {
    netLeave(true);
    releaseSession();
  });
})();
