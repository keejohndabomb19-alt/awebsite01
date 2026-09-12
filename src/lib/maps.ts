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
    curve: { a: 10, af: 0.017, b: 4.5, bf: 0.041 },
    slope: { a: -3.2, af: 0.013, b: -2.2, bf: 0.033, drop: 0.02 },
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
