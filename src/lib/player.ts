const ID_KEY = "slope-player-id";
const NAME_KEY = "slope-player-name";

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  const name = window.localStorage.getItem(NAME_KEY);
  return name && name.trim().length >= 2 ? name : null;
}

export function setPlayerName(name: string) {
  window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 16));
}
