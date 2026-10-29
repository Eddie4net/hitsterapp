/* TIJDELIJK: genereert de houten tafel- en tapijttexturen in de browser en stuurt ze naar /api/dev-save. */
(() => {
  const hash = (x, y, s) => {
    let h =
      Math.imul(x | 0, 374761393) ^
      Math.imul(y | 0, 668265263) ^
      Math.imul(s | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const sm = (t) => t * t * (3 - 2 * t);
  const vn = (x, y, s) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = sm(x - xi);
    const yf = sm(y - yi);
    const a = hash(xi, yi, s);
    const b = hash(xi + 1, yi, s);
    const c = hash(xi, yi + 1, s);
    const d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  const fbm = (x, y, o, s) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < o; i++) {
      sum += amp * vn(x * f, y * f, s + i * 17);
      amp *= 0.5;
      f *= 2;
    }
    return sum;
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  const smoothstep = (a, b, x) => sm(clamp((x - a) / (b - a)));

  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function save(name, canvas, quality) {
    const blob = await new Promise((r) =>
      canvas.toBlob(r, "image/jpeg", quality),
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const res = await fetch("/api/dev-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, data: btoa(bin) }),
    });
    return { name, kb: Math.round(bytes.length / 1024), ok: res.ok };
  }

  // ---------------------------------------------------------------- Tafelblad
  const LIGHT = [236, 176, 98];
  const MID = [206, 130, 58];
  const DARK = [146, 78, 34];
  const DEEP = [98, 48, 20];

  async function wood(W = 2000, H = 1000) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    const px = img.data;
    const rnd = mulberry(7);

    // Vijf gelijmde planken, licht schuin, elk met eigen kleur en nerf.
    const edges = [0, 1].map((f) => ({ y: f * H, slope: 0 }));
    const boards = [0].map((i) => ({
      seed: 40 + i * 13,
      tone: 1,
      redness: rnd(),
      rings: 13,
      arch: 0,
      cycles: 0,
      phase: rnd() * 6.28,
      seam: -1,
    }));
    const knots = [
      { x: W * 0.27, y: H * 0.47, rx: 70, ry: 30 },
      { x: W * 0.74, y: H * 0.11, rx: 44, ry: 18 },
      { x: W * 0.52, y: H * 0.9, rx: 56, ry: 24 },
    ];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        // Welke plank?
        let b = 0;
        for (let i = 1; i < boards.length; i++)
          if (y >= edges[i].y + edges[i].slope * (x - W / 2)) b = i;
        const top = edges[b].y + edges[b].slope * (x - W / 2);
        const bottom = edges[b + 1].y + edges[b + 1].slope * (x - W / 2);
        const bh = bottom - top;
        const board = boards[b];
        const seg = board.seam > 0 && x > board.seam ? 1 : 0;
        const s = board.seed + seg * 100;
        const v = (y - top) / bh;
        const u = x / W;

        // Groeiringen: bogen (kathedraalnerf) plus rustige kronkel.
        const swirl = (fbm(x * 0.0016, y * 0.005, 3, s) - 0.47) * 1.15;
        const fineWarp = (fbm(x * 0.01, y * 0.04, 2, s + 5) - 0.47) * 0.14;
        // Langgerekte ellipsen rond twee kernen (de boom): zo ontstaan de kathedraalbogen.
        const kx = 0.62;
        const d1 = Math.hypot(v + 0.55, kx * (u - 0.4));
        const d2 = Math.hypot(v - 1.7, kx * (u - 0.82));
        let r = Math.min(d1, d2 * 0.98 + 0.06) * board.rings + swirl + fineWarp;

        // Hout buigt om knoesten heen.
        let knot = 0;
        let knotRing = 0;
        for (const k of knots) {
          const dx = (x - k.x) / k.rx;
          const dy = (y - k.y) / k.ry;
          const d2 = dx * dx + dy * dy;
          if (d2 < 36)
            r +=
              2.6 *
              Math.exp(-d2 * 0.22) *
              (dy > 0 ? 1 : -1) *
              (1 - Math.exp(-d2 * 0.4));
          if (d2 < 1.3) {
            const d = Math.sqrt(d2);
            knot = Math.max(knot, smoothstep(1.15, 0.2, d));
            knotRing = Math.max(
              knotRing,
              (0.5 + 0.5 * Math.sin(d * 24)) * smoothstep(1.2, 0.3, d),
            );
          }
        }

        const t = r - Math.floor(r);
        const tri = 1 - Math.abs(2 * t - 1);
        const late = smoothstep(0.18, 0.92, tri);
        const wave =
          0.5 +
          0.5 * Math.sin(r * 6.283 + fbm(x * 0.05, y * 0.2, 2, s + 2) * 3);
        const pattern = 0.78 * late + 0.22 * wave;

        const low = fbm(x * 0.0018, y * 0.0045, 3, s + 9);
        let val = 0.2 + 0.52 * pattern + (low - 0.45) * 0.8;
        // Lange, vloeiende nerflijnen over de hele plank
        val +=
          (fbm(x * 0.0028 + swirl * 0.02, y * 0.2, 3, s + 55) - 0.47) * 0.42;
        // Fijne vezels
        val += (vn(x * 0.03, y * 0.55, s + 21) - 0.5) * 0.1;
        // Zachte glans die over de nerf heen golft
        val += 0.05 * Math.sin(u * 7 + swirl * 0.7 + board.phase);
        val = clamp(val);

        let col =
          val < 0.5
            ? mix3(DARK, MID, val * 2)
            : mix3(MID, LIGHT, (val - 0.5) * 2);
        // Roodachtige banen, typisch voor mangohout
        const red =
          smoothstep(0.55, 0.75, fbm(x * 0.0022, y * 0.006, 3, s + 31)) *
          (0.4 + board.redness * 0.6);
        col = mix3(col, [190, 88, 44], red * 0.4);
        // Donkere mineraalstrepen
        const streak = smoothstep(
          0.6,
          0.74,
          fbm(x * 0.012, y * 0.34, 3, s + 9),
        );
        col = mix3(col, DEEP, streak * 0.3);
        // Poriën
        const pore = vn(x * 0.11, y * 1.9, s + 3);
        const poreDark = smoothstep(0.86, 0.96, pore) * 0.1;
        // Knoest
        if (knot > 0) {
          col = mix3(col, DEEP, knot * (0.55 + knotRing * 0.35));
          col = mix3(col, [58, 30, 14], smoothstep(0.55, 1, knot) * 0.8);
        }

        let m =
          board.tone *
          (1 - poreDark) *
          (0.94 + 0.13 * fbm(x * 0.0011, y * 0.0013, 2, 4));
        // Naden tussen de planken: donkere lijn met een lichte rand
        const dTop = y - top;
        if (b > 0 && dTop < 2.4) m *= 0.36;
        else if (b > 0 && dTop < 5) m *= 1.07;
        if (bottom - y < 2.2 && b < boards.length - 1) m *= 0.8;
        // Kopse naad
        if (board.seam > 0 && Math.abs(x - board.seam) < 1.6) m *= 0.4;
        else if (board.seam > 0 && x - board.seam > 0 && x - board.seam < 4)
          m *= 1.05;
        // Verschil tussen de twee stukken van een plank
        if (seg) m *= 0.97;

        // Twee heel zachte naden (gelijmd blad): fijne lijn, lichte kleurstap, nerf loopt door
        const seamYs = [H * 0.335, H * 0.675];
        for (const sy of seamYs) {
          const wob = (fbm(x * 0.002, sy, 2, 88) - 0.47) * 7;
          const dd = y - (sy + wob);
          if (Math.abs(dd) < 0.9) m *= 0.9;
          else if (dd >= 0.9 && dd < 2.2) m *= 1.025;
        }
        m *= y < seamYs[0] ? 0.985 : y < seamYs[1] ? 1.015 : 0.995;
        const noise = (hash(x, y, 5) - 0.5) * 8;
        const i = (y * W + x) * 4;
        px[i] = clamp(col[0] * m + noise, 0, 255);
        px[i + 1] = clamp(col[1] * m + noise, 0, 255);
        px[i + 2] = clamp(col[2] * m + noise * 0.8, 0, 255);
        px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  // ---------------------------------------------------------------- Tafelblad v2 (mangohout)
  const PAL = [
    [0.0, [112, 60, 28]],
    [0.3, [158, 90, 42]],
    [0.55, [192, 122, 60]],
    [0.78, [214, 152, 88]],
    [1.0, [232, 180, 116]],
  ];
  function palette(L) {
    for (let i = 1; i < PAL.length; i++) {
      if (L <= PAL[i][0]) {
        const t = (L - PAL[i - 1][0]) / (PAL[i][0] - PAL[i - 1][0]);
        return mix3(PAL[i - 1][1], PAL[i][1], t);
      }
    }
    return PAL[PAL.length - 1][1];
  }

  async function woodV2(W = 2000, H = 1000) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    const px = img.data;
    const rnd = mulberry(23);

    // Vier planken, nauwelijks zichtbare naden, elk met een eigen tint en een iets andere nerfrichting.
    const seams = [0.255, 0.515, 0.77].map((f) => ({
      y: f * H,
      slope: (rnd() - 0.5) * 0.03,
    }));
    const boards = [0, 1, 2, 3].map((i) => ({
      seed: 100 + i * 37,
      angle: (rnd() - 0.5) * 0.045,
      tone: (rnd() - 0.5) * 0.1,
      warm: rnd() - 0.5,
      phase: rnd() * 90,
    }));
    const k = W / 2000;
    const knots = [
      { x: W * 0.31, y: H * 0.44, r: 15 * k, board: 1 },
      { x: W * 0.74, y: H * 0.16, r: 10 * k, board: 0 },
      { x: W * 0.55, y: H * 0.9, r: 12 * k, board: 3 },
    ];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let b = 0;
        for (let i = 0; i < seams.length; i++)
          if (y >= seams[i].y + seams[i].slope * (x - W / 2)) b = i + 1;
        const bd = boards[b];
        const cs = Math.cos(bd.angle);
        const sn = Math.sin(bd.angle);
        const xr = x * cs + y * sn + bd.phase * 10;
        const yr = -x * sn + y * cs;

        // De nerf golft rustig mee en buigt om knoesten heen.
        let yw = yr + (fbm(xr * 0.0022, yr * 0.004, 3, bd.seed) - 0.47) * 70;
        let knotDark = 0;
        let knotCore = 0;
        for (const kn of knots) {
          const dx = x - kn.x;
          const dy = y - kn.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < kn.r * 7) {
            yw +=
              (dy >= 0 ? 1 : -1) *
              20 *
              Math.exp(-((d / (kn.r * 2.4)) ** 2)) *
              (1 - Math.exp(-((d / kn.r) ** 2)));
          }
          const dd =
            d +
            (vn(x * 0.22, y * 0.22, 9) - 0.5) * kn.r * 0.9 +
            (vn(x * 0.06, y * 0.06, 19) - 0.5) * kn.r * 0.8;
          if (dd < kn.r * 2.3)
            knotDark = Math.max(
              knotDark,
              smoothstep(kn.r * 2.3, kn.r * 0.45, dd),
            );
          if (dd < kn.r * 0.55)
            knotCore = Math.max(
              knotCore,
              smoothstep(kn.r * 0.55, kn.r * 0.15, dd),
            );
        }

        // Lagen van groot naar klein
        const cloud = fbm(xr * 0.0014, yw * 0.0042, 5, bd.seed + 1);
        const streak = fbm(xr * 0.009, yw * 0.1, 4, bd.seed + 2);
        const hair = fbm(xr * 0.035, yw * 0.7, 4, bd.seed + 3);
        const crinkle = fbm(xr * 0.05, yw * 0.15, 3, bd.seed + 4);
        const ridge =
          1 -
          Math.abs(
            2 *
              vn(
                xr * 0.045,
                yw * 0.5 + fbm(xr * 0.01, yw * 0.02, 2, bd.seed + 13) * 14,
                bd.seed + 12,
              ) -
              1,
          );
        const ridge2 =
          1 - Math.abs(2 * vn(xr * 0.11, yw * 0.22, bd.seed + 14) - 1);
        const micro = fbm(xr * 0.09, yw * 0.9, 3, bd.seed + 15);
        const ripple =
          0.5 +
          0.5 *
            Math.sin(
              yw * 0.42 + fbm(xr * 0.006, yw * 0.01, 2, bd.seed + 5) * 9,
            );
        const rings =
          0.5 +
          0.5 *
            Math.sin(
              (yw * 0.018 + fbm(xr * 0.002, yw * 0.003, 2, bd.seed + 6) * 5) *
                6.283,
            );

        let L = 0.52 + bd.tone;
        L += (cloud - 0.47) * 0.72;
        L += (streak - 0.47) * 0.34;
        L += (hair - 0.47) * 0.22;
        L += (crinkle - 0.47) * 0.2;
        L += (ripple - 0.5) * 0.05;
        L += (ridge - 0.55) * 0.12;
        L += (ridge2 - 0.55) * 0.07;
        L += (micro - 0.47) * 0.1;
        L += (rings - 0.5) * 0.09;
        L -=
          smoothstep(0.64, 0.8, fbm(xr * 0.004, yw * 0.06, 4, bd.seed + 7)) *
          0.16;
        const pore = vn(xr * 0.17, yw * 2.4, bd.seed + 8);
        if (pore > 0.86) L -= (pore - 0.86) * 0.9;
        L = clamp(L - knotDark * 0.2);

        let col = palette(L);
        // Roodachtige en gelere zones
        const red = smoothstep(
          0.52,
          0.74,
          fbm(xr * 0.0012, yw * 0.004, 3, bd.seed + 9),
        );
        col = [
          col[0] * (1 + 0.05 * red + 0.03 * bd.warm),
          col[1] * (1 - 0.05 * red),
          col[2] * (1 - 0.09 * red - 0.04 * bd.warm),
        ];
        col = mix3(col, [146, 72, 32], knotDark * 0.55);
        col = mix3(col, [70, 34, 16], knotCore * 0.85);

        // Naden: een haarlijn met een lichte rand
        let m = 1;
        for (let i = 0; i < seams.length; i++) {
          const d = y - (seams[i].y + seams[i].slope * (x - W / 2));
          if (Math.abs(d) < 0.8) m *= 0.93;
          else if (d >= 0.8 && d < 1.9) m *= 1.025;
        }
        const noise = (hash(x, y, 5) - 0.5) * 6;
        const i = (y * W + x) * 4;
        px[i] = clamp(col[0] * m + noise, 0, 255);
        px[i + 1] = clamp(col[1] * m + noise, 0, 255);
        px[i + 2] = clamp(col[2] * m + noise * 0.8, 0, 255);
        px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  // ---------------------------------------------------------------- Rand (eindhout, blokjes)
  async function edge(W = 2000, H = 60) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const warp = fbm(x * 0.0028, y * 0.06, 3, 71) * 7;
        const line =
          0.5 +
          0.5 * Math.sin(y * 0.55 + warp + fbm(x * 0.002, y * 0.4, 2, 72) * 5);
        const streak = fbm(x * 0.0035, y * 0.45, 3, 73);
        let val = 0.3 + 0.38 * line + (streak - 0.45) * 0.7;
        val += (vn(x * 0.04, y * 0.9, 74) - 0.5) * 0.1;
        val = clamp(val);
        const col = palette(clamp(val * 0.95));
        const m = 0.9 * (0.96 + 0.1 * fbm(x * 0.0015, y * 0.05, 2, 75));
        const n = (hash(x, y, 9) - 0.5) * 7;
        const i = (y * W + x) * 4;
        img.data[i] = clamp(col[0] * m + n, 0, 255);
        img.data[i + 1] = clamp(col[1] * m + n, 0, 255);
        img.data[i + 2] = clamp(col[2] * m + n * 0.8, 0, 255);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Licht boven (afgeschuinde rand), schaduw onder
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,235,190,0.34)");
    g.addColorStop(0.16, "rgba(255,235,190,0)");
    g.addColorStop(0.7, "rgba(40,18,6,0.1)");
    g.addColorStop(1, "rgba(30,12,4,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return canvas;
  }

  // ---------------------------------------------------------------- Pluizig tapijt
  async function rug(W = 2000, H = 1250) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const rnd = mulberry(99);

    // Basis met rustige tonale wolken
    const small = document.createElement("canvas");
    small.width = 250;
    small.height = 156;
    const sctx = small.getContext("2d");
    const simg = sctx.createImageData(250, 156);
    for (let y = 0; y < 156; y++) {
      for (let x = 0; x < 250; x++) {
        const n = fbm(x * 0.05, y * 0.05, 4, 5);
        const v = 0.84 + (n - 0.45) * 0.34;
        const i = (y * 250 + x) * 4;
        simg.data[i] = 226 * v;
        simg.data[i + 1] = 218 * v;
        simg.data[i + 2] = 203 * v;
        simg.data[i + 3] = 255;
      }
    }
    sctx.putImageData(simg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, W, H);

    const draw = (count, lenMin, lenMax, width, palette, alpha) => {
      ctx.lineCap = "round";
      ctx.lineWidth = width;
      for (let i = 0; i < count; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const a = rnd() * 6.283;
        const len = lenMin + rnd() * (lenMax - lenMin);
        const curl = (rnd() - 0.5) * len * 0.9;
        const c = palette[(rnd() * palette.length) | 0];
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * (0.7 + rnd() * 0.3)})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * len * 0.5 - Math.sin(a) * curl,
          y + Math.sin(a) * len * 0.5 + Math.cos(a) * curl,
          x + Math.cos(a) * len,
          y + Math.sin(a) * len,
        );
        ctx.stroke();
      }
    };
    // Diepte: eerst schaduw tussen de vezels, dan de vezels zelf, dan lichte toppen
    draw(
      90000,
      9,
      20,
      2.4,
      [
        [142, 130, 112],
        [156, 144, 126],
        [128, 116, 100],
      ],
      0.5,
    );
    draw(
      150000,
      8,
      18,
      1.9,
      [
        [216, 207, 190],
        [224, 215, 198],
        [208, 198, 180],
        [230, 221, 205],
      ],
      0.85,
    );
    draw(
      90000,
      7,
      15,
      1.4,
      [
        [250, 246, 236],
        [244, 238, 224],
        [255, 252, 245],
      ],
      0.8,
    );
    draw(
      30000,
      6,
      12,
      1.2,
      [
        [200, 188, 168],
        [188, 176, 156],
      ],
      0.5,
    );
    return canvas;
  }

  window.hitsterGen = {
    async all() {
      const out = [];
      out.push(await save("wood-top.jpg", await wood(2000, 1000), 0.86));
      out.push(await save("wood-edge.jpg", await edge(2000, 60), 0.9));
      out.push(await save("rug.jpg", await rug(2000, 1250), 0.86));
      return out;
    },
    wood: async () => save("wood-top.jpg", await woodV2(2000, 1000), 0.88),
    woodPreview: async () =>
      save("wood-preview.jpg", await woodV2(1500, 750), 0.88),
    edge: async () => save("wood-edge.jpg", await edge(2000, 60), 0.9),
    rug: async () => save("rug.jpg", await rug(2000, 1250), 0.86),
  };
})();
