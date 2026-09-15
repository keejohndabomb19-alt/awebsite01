import { getOwnedSkins, ownSkin, SKINS } from "./skins";

export interface DailyProgress {
  date: string;
  distance: number;
  survivalSeconds: number;
  coinsCollected: number;
  distanceRewardClaimed: boolean;
  survivalRewardClaimed: boolean;
  coinsRewardClaimed: boolean;
  chestClaimed: boolean;
}

export interface WeeklyProgress {
  week: string;
  distance: number;
  claimed: boolean;
}

export const DAILY_REWARD = 300;
export const WEEKLY_REWARD = 1000;
export const CHEST_COST = 500;
export const CHEST_BOOST_DURATION = 60_000;

const DAILY_KEY = "slope-daily-progress";
const WEEKLY_KEY = "slope-weekly-progress";
const CHEST_BOOST_KEY = "slope-chest-boost-until";

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mondayKey(date = new Date()) {
  const monday = new Date(date);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  return localDateKey(monday);
}

export function getDailyProgress(): DailyProgress {
  const fallback: DailyProgress = {
    date: localDateKey(),
    distance: 0,
    survivalSeconds: 0,
    coinsCollected: 0,
    distanceRewardClaimed: false,
    survivalRewardClaimed: false,
    coinsRewardClaimed: false,
    chestClaimed: false,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(DAILY_KEY) ?? "null",
    ) as DailyProgress | null;
    return saved?.date === fallback.date ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

export function saveDailyProgress(progress: DailyProgress) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(DAILY_KEY, JSON.stringify(progress));
}

export function getWeeklyProgress(): WeeklyProgress {
  const fallback: WeeklyProgress = { week: mondayKey(), distance: 0, claimed: false };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(WEEKLY_KEY) ?? "null",
    ) as WeeklyProgress | null;
    return saved?.week === fallback.week ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

export function saveWeeklyProgress(progress: WeeklyProgress) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(WEEKLY_KEY, JSON.stringify(progress));
}

export function getChestBoostMultiplier() {
  if (typeof window === "undefined") return 1;
  return Number(window.localStorage.getItem(CHEST_BOOST_KEY) ?? "0") > Date.now() ? 2 : 1;
}

export function activateChestBoost() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CHEST_BOOST_KEY, String(Date.now() + CHEST_BOOST_DURATION));
  }
}

export type ChestPrize =
  | { type: "coins"; coins: number }
  | { type: "boost"; durationSeconds: number }
  | { type: "skin"; skinName: string };

export function openBasicChest(): ChestPrize {
  const unowned = SKINS.filter((skin) => !getOwnedSkins().includes(skin.id));
  const roll = Math.random();
  if (roll < 0.08 && unowned.length > 0) {
    const skin = unowned[Math.floor(Math.random() * unowned.length)]!;
    ownSkin(skin.id);
    return { type: "skin", skinName: skin.name };
  }
  if (roll < 0.3) {
    activateChestBoost();
    return { type: "boost", durationSeconds: CHEST_BOOST_DURATION / 1000 };
  }
  return { type: "coins", coins: 200 + Math.floor(Math.random() * 401) };
}
