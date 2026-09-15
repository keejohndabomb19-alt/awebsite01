import type { DailyProgress, WeeklyProgress } from "@/lib/progression";
import { CHEST_COST, DAILY_REWARD, WEEKLY_REWARD } from "@/lib/progression";

export function ProgressionPanel({
  daily,
  weekly,
  coins,
  onClaimDailyChest,
  onClaimWeekly,
  onOpenChest,
}: {
  daily: DailyProgress;
  weekly: WeeklyProgress;
  coins: number;
  onClaimDailyChest: () => void;
  onClaimWeekly: () => void;
  onOpenChest: () => void;
}) {
  const dailyComplete =
    daily.distance >= 5000 && daily.survivalSeconds >= 120 && daily.coinsCollected >= 50;
  const weeklyComplete = weekly.distance >= 10000;
  const progress = (value: number, target: number) => Math.min(100, (value / target) * 100);

  return (
    <div className="mx-auto mb-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
      <section className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-4">
        <h3 className="mb-3 font-bold text-cyan-200">Daily Missions</h3>
        <Mission
          label="Travel 5,000m"
          value={daily.distance}
          target={5000}
          reward="+100 coins"
          progress={progress(daily.distance, 5000)}
        />
        <Mission
          label="Survive for 2 minutes"
          value={daily.survivalSeconds}
          target={120}
          reward="+150 coins"
          suffix="s"
          progress={progress(daily.survivalSeconds, 120)}
        />
        <Mission
          label="Collect 50 coins"
          value={daily.coinsCollected}
          target={50}
          reward="+75 coins"
          progress={progress(daily.coinsCollected, 50)}
        />
        <button
          onClick={onClaimDailyChest}
          disabled={!dailyComplete || daily.chestClaimed}
          className="mt-3 w-full rounded-lg bg-yellow-400/20 px-3 py-2 text-sm font-bold text-yellow-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {daily.chestClaimed
            ? "Daily Bonus Chest claimed"
            : `Daily Bonus Chest — +${DAILY_REWARD} coins`}
        </button>
      </section>
      <section className="rounded-xl border border-purple-400/30 bg-purple-950/20 p-4">
        <h3 className="mb-2 font-bold text-purple-200">Weekly Mission</h3>
        <p className="text-sm text-white/80">Travel 10,000m</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-purple-400"
            style={{ width: `${progress(weekly.distance, 10000)}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-xs text-white/60">
          {Math.floor(weekly.distance).toLocaleString()} / 10,000m · 🪙{" "}
          {WEEKLY_REWARD.toLocaleString()}
        </p>
        <button
          onClick={onClaimWeekly}
          disabled={!weeklyComplete || weekly.claimed}
          className="mt-3 w-full rounded-lg bg-purple-400/20 px-3 py-2 text-sm font-bold text-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {weekly.claimed ? "Weekly reward claimed" : "Claim 1,000 coins"}
        </button>
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="font-bold text-yellow-200">🎁 Basic Mystery Chest — {CHEST_COST} coins</p>
          <p className="mt-1 text-xs text-white/60">
            Contains coins, a 60-second 2× boost, or a small chance of an unowned skin.
          </p>
          <button
            onClick={onOpenChest}
            disabled={coins < CHEST_COST}
            className="mt-3 w-full rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Open chest
          </button>
        </div>
      </section>
    </div>
  );
}

function Mission({
  label,
  value,
  target,
  reward,
  suffix = "m",
  progress,
}: {
  label: string;
  value: number;
  target: number;
  reward: string;
  suffix?: string;
  progress: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between gap-2 text-xs text-white/80">
        <span>{label}</span>
        <span className="text-yellow-200">{reward}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 font-mono text-[11px] text-white/55">
        {Math.floor(value).toLocaleString()} / {target.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}
