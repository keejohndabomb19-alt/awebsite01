import { useEffect, useState } from "react";
import { SKINS, getOwnedSkins, getSelectedSkinId, ownSkin, saveSkinId } from "@/lib/skins";
import { SkinPreview } from "./SkinPreview";

export function SkinShop({
  coins,
  onClose,
  onChange,
}: {
  coins: number;
  onClose: () => void;
  /** Called after a purchase or equip so the game can sync coins + skin. */
  onChange: (skinId: string, coins: number) => void;
}) {
  const [owned, setOwned] = useState<string[]>(() => getOwnedSkins());
  const [selected, setSelected] = useState<string>(() => getSelectedSkinId());
  const [balance, setBalance] = useState(coins);
  const [note, setNote] = useState("");

  useEffect(() => {
    setBalance(coins);
  }, [coins]);

  function equip(id: string) {
    saveSkinId(id);
    setSelected(id);
    setNote("");
    onChange(id, balance);
  }

  function buy(skin: (typeof SKINS)[number]) {
    if (owned.includes(skin.id)) {
      equip(skin.id);
      return;
    }
    if (balance < skin.price) {
      setNote("Not enough coins — collect more gold coins on the slope.");
      return;
    }

    const next = balance - skin.price;
    setBalance(next);
    setOwned(ownSkin(skin.id));
    saveSkinId(skin.id);
    setSelected(skin.id);
    setNote("");
    onChange(skin.id, next);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skin-shop-title"
      className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-8 backdrop-blur-sm"
    >
      <div className="w-full max-w-3xl text-center">
        <h2
          id="skin-shop-title"
          className="mb-2 bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-5xl font-black tracking-tighter text-transparent"
        >
          SKIN SHOP
        </h2>
        <p className="mb-6 font-mono text-yellow-300">You have {balance.toLocaleString()} coins</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {SKINS.map((s) => {
            const isOwned = owned.includes(s.id);
            const isOn = selected === s.id;
            return (
              <div
                key={s.id}
                style={{ borderColor: s.swatch }}
                className={`overflow-hidden rounded-xl border bg-black/50 p-5 text-left ${
                  isOn ? "ring-2 ring-white/70" : ""
                }`}
              >
                <div className="mb-3 rounded-lg bg-white/5">
                  <SkinPreview skin={s} />
                </div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: s.swatch }}>
                    {s.name}
                  </span>
                </div>
                <p className="mb-4 text-sm text-white/70">{s.description}</p>
                <p className="mb-4 font-mono text-sm font-bold text-yellow-300">
                  {s.coinMultiplier}× coin multiplier
                </p>
                {isOn ? (
                  <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold text-white">
                    Equipped
                  </span>
                ) : isOwned ? (
                  <button
                    onClick={() => equip(s.id)}
                    className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-black transition hover:bg-white"
                  >
                    Use this skin
                  </button>
                ) : (
                  <button
                    onClick={() => buy(s)}
                    disabled={balance < s.price}
                    className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Buy — {s.price.toLocaleString()} coins
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {note && <p className="mt-4 text-sm text-red-300">{note}</p>}

        <button
          onClick={onClose}
          className="mt-8 rounded-full bg-cyan-500 px-8 py-3 font-bold text-black transition hover:bg-cyan-400"
        >
          Back to game
        </button>
      </div>
    </div>
  );
}
