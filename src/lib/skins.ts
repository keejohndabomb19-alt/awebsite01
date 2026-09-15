export type SkinShape = "sphere" | "torus" | "icosa" | "box" | "dodeca" | "capsule";

export interface SkinConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Coins awarded for each coin collected while this skin is equipped. */
  coinMultiplier: number;
  shape: SkinShape;
  color: number;
  emissive: number;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  swatch: string;
}

export const SKINS: SkinConfig[] = [
  {
    id: "classic",
    name: "Neon Orb",
    description: "The original glowing cyan ball.",
    price: 0,
    coinMultiplier: 1,
    shape: "sphere",
    color: 0x00ffff,
    emissive: 0x0088aa,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
    swatch: "#00ffff",
  },
  {
    id: "donut",
    name: "Donut",
    description: "A pink-frosted donut that rolls on its side.",
    price: 30,
    coinMultiplier: 2,
    shape: "torus",
    color: 0xff77bb,
    emissive: 0x883355,
    emissiveIntensity: 0.35,
    roughness: 0.7,
    metalness: 0.1,
    swatch: "#ff77bb",
  },
  {
    id: "lava",
    name: "Lava Core",
    description: "Molten rock, glowing from the inside out.",
    price: 45,
    coinMultiplier: 3,
    shape: "icosa",
    color: 0xff4400,
    emissive: 0xff2200,
    emissiveIntensity: 1.1,
    roughness: 0.6,
    metalness: 0.2,
    swatch: "#ff4400",
  },
  {
    id: "dice",
    name: "Lucky Dice",
    description: "A tumbling ivory cube. Roll the odds.",
    price: 60,
    coinMultiplier: 4,
    shape: "box",
    color: 0xfff4e0,
    emissive: 0x554433,
    emissiveIntensity: 0.2,
    roughness: 0.4,
    metalness: 0.1,
    swatch: "#fff4e0",
  },
  {
    id: "emerald",
    name: "Emerald Gem",
    description: "A faceted green jewel with a deep shine.",
    price: 80,
    coinMultiplier: 5,
    shape: "dodeca",
    color: 0x18e07a,
    emissive: 0x0a6b3a,
    emissiveIntensity: 0.7,
    roughness: 0.1,
    metalness: 0.9,
    swatch: "#18e07a",
  },
  {
    id: "chrome",
    name: "Chrome Pill",
    description: "A mirror-polished capsule built for speed.",
    price: 120,
    coinMultiplier: 6,
    shape: "capsule",
    color: 0xdfe7ff,
    emissive: 0x223344,
    emissiveIntensity: 0.3,
    roughness: 0.05,
    metalness: 1,
    swatch: "#dfe7ff",
  },
  {
    id: "liverpool",
    name: "Liverpool FC",
    description:
      "A detailed red-and-gold Liverpool crest ball with a Liver Bird and twin-torch accents.",
    price: 250,
    coinMultiplier: 7,
    shape: "sphere",
    color: 0xdc0714,
    emissive: 0x5b0008,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.7,
    swatch: "#dc0714",
  },
];

export const DEFAULT_SKIN_ID = "classic";
const OWNED_KEY = "slope-skins-owned";
const SELECTED_KEY = "slope-skin";

export function getSkin(id: string | null | undefined): SkinConfig {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]!;
}

export function getOwnedSkins(): string[] {
  if (typeof window === "undefined") return [DEFAULT_SKIN_ID];
  try {
    const raw = window.localStorage.getItem(OWNED_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    const owned = Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
    return Array.from(new Set([DEFAULT_SKIN_ID, ...owned]));
  } catch {
    return [DEFAULT_SKIN_ID];
  }
}

export function ownSkin(id: string): string[] {
  const owned = Array.from(new Set([...getOwnedSkins(), id]));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
  }
  return owned;
}

export function getSelectedSkinId(): string {
  if (typeof window === "undefined") return DEFAULT_SKIN_ID;
  const id = window.localStorage.getItem(SELECTED_KEY);
  return id && SKINS.some((s) => s.id === id) ? id : DEFAULT_SKIN_ID;
}

export function saveSkinId(id: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(SELECTED_KEY, id);
}

export function getCoins(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("slope-coins") ?? "0") || 0;
}

export function setCoins(value: number) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("slope-coins", String(Math.max(0, Math.floor(value))));
  }
}
