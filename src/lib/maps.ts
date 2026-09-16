export interface MapConfig {
  id: string;
  name: string;
  tagline: string;
  swatch: string;
  bg: number;
  fog: [number, number];
  ambient: number;
  dirLight: number;
  accent: number;
  track: number;
  baseSpeed: number;
  difficulty: "Relaxed" | "Balanced" | "Tricky" | "Hard" | "Extreme";
  curve: { a: number; af: number; b: number; bf: number };
  slope: { a: number; af: number; b: number; bf: number; drop: number };
}

export const MAPS: MapConfig[] = [
  {
    id: "neon",
    name: "Neon Circuit",
    tagline: "The classic dark track with flowing curves.",
    swatch: "#00ffff",
    bg: 0x0a0a0f,
    fog: [25, 130],
    ambient: 0x404080,
    dirLight: 0xaaccff,
    accent: 0x00ffff,
    track: 0x111116,
    baseSpeed: 15,
    difficulty: "Balanced",
    curve: { a: 7, af: 0.011, b: 3.2, bf: 0.029 },
    slope: { a: -2.6, af: 0.008, b: -1.4, bf: 0.021, drop: 0.012 },
  },
  {
    id: "canyon",
    name: "Sunset Canyon",
    tagline: "Warm, wide bends and a gentle descent.",
    swatch: "#ff8a3d",
    bg: 0x2a1206,
    fog: [30, 150],
    ambient: 0x804433,
    dirLight: 0xffc08a,
    accent: 0xff8a3d,
    track: 0x1d1008,
    baseSpeed: 13,
    difficulty: "Relaxed",
    curve: { a: 9, af: 0.007, b: 2, bf: 0.019 },
    slope: { a: -2, af: 0.006, b: -0.9, bf: 0.017, drop: 0.009 },
  },
  {
    id: "ice",
    name: "Ice Peaks",
    tagline: "Fast, steep drops over a frozen ridge.",
    swatch: "#bfe9ff",
    bg: 0x081826,
    fog: [22, 120],
    ambient: 0x88aacc,
    dirLight: 0xe8f6ff,
    accent: 0xbfe9ff,
    track: 0x16323f,
    baseSpeed: 18,
    difficulty: "Tricky",
    curve: { a: 5, af: 0.013, b: 2.4, bf: 0.031 },
    slope: { a: -3.6, af: 0.011, b: -2, bf: 0.026, drop: 0.018 },
  },
  {
    id: "void",
    name: "Void Spiral",
    tagline: "Wild swerves at breakneck speed. Experts only.",
    swatch: "#c04dff",
    bg: 0x120620,
    fog: [18, 110],
    ambient: 0x5a2a80,
    dirLight: 0xd8a8ff,
    accent: 0xc04dff,
    track: 0x1b0d2b,
    baseSpeed: 20,
    difficulty: "Hard",
    curve: { a: 10, af: 0.017, b: 4.5, bf: 0.041 },
    slope: { a: -3.2, af: 0.013, b: -2.2, bf: 0.033, drop: 0.02 },
  },
  {
    id: "aurora",
    name: "Aurora Run",
    tagline: "Glide beneath electric northern lights and sweeping turns.",
    swatch: "#5dffcb",
    bg: 0x061b22,
    fog: [28, 145],
    ambient: 0x28656d,
    dirLight: 0xb8ffe9,
    accent: 0x5dffcb,
    track: 0x092a31,
    baseSpeed: 16,
    difficulty: "Balanced",
    curve: { a: 8, af: 0.009, b: 3.8, bf: 0.024 },
    slope: { a: -2.8, af: 0.008, b: -1.6, bf: 0.022, drop: 0.013 },
  },
  {
    id: "volcano",
    name: "Magma Rush",
    tagline: "Thread through volcanic heat on a fast, narrow descent.",
    swatch: "#ff5438",
    bg: 0x260807,
    fog: [20, 118],
    ambient: 0x7a2319,
    dirLight: 0xff8957,
    accent: 0xff5438,
    track: 0x260c0a,
    baseSpeed: 19,
    difficulty: "Hard",
    curve: { a: 9.5, af: 0.015, b: 4, bf: 0.036 },
    slope: { a: -3.8, af: 0.012, b: -2.1, bf: 0.03, drop: 0.019 },
  },
  {
    id: "skyline",
    name: "Skyline Sprint",
    tagline: "Race above a midnight city through clean, quick corners.",
    swatch: "#50a7ff",
    bg: 0x07122e,
    fog: [30, 155],
    ambient: 0x263f7a,
    dirLight: 0x9ac9ff,
    accent: 0x50a7ff,
    track: 0x0b1734,
    baseSpeed: 17,
    difficulty: "Tricky",
    curve: { a: 7.5, af: 0.012, b: 4.1, bf: 0.028 },
    slope: { a: -3, af: 0.01, b: -1.7, bf: 0.024, drop: 0.015 },
  },
  {
    id: "monsoon",
    name: "Monsoon Drift",
    tagline: "A stormy blue course with relentless, rolling drops.",
    swatch: "#7d8cff",
    bg: 0x0b1025,
    fog: [17, 105],
    ambient: 0x333a76,
    dirLight: 0xb3bdff,
    accent: 0x7d8cff,
    track: 0x111638,
    baseSpeed: 21,
    difficulty: "Extreme",
    curve: { a: 11, af: 0.018, b: 5, bf: 0.044 },
    slope: { a: -4.1, af: 0.014, b: -2.5, bf: 0.035, drop: 0.022 },
  },
];

export const DEFAULT_MAP_ID = "neon";
const STORAGE_KEY = "slope-map";

export function getMap(id: string): MapConfig {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

export function getSavedMapId(): string | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(STORAGE_KEY);
  return id && MAPS.some((m) => m.id === id) ? id : null;
}

export function saveMapId(id: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
}
