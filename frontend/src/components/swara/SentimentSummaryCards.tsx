import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { TrendPoint } from "../../types/swara";

const WINDOW = 7; // jumlah titik data yang dibandingkan (terakhir vs sebelumnya)

export default function SentimentSummaryCards() {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: TrendPoint[] }>("/stats/trend", {
        params: { period: "daily" },
      })
      .then((response) => {
        setTrendData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data sentiment summary:", error);
        setLoading(false);
      });
  }, []);

  const jumlahkan = (
    points: TrendPoint[],
    key: "Positif" | "Negatif" | "Netral",
  ) => points.reduce((sum, p) => sum + p[key], 0);

  const current = trendData.slice(-WINDOW);
  const previous = trendData.slice(-WINDOW * 2, -WINDOW);

  const totalCurrent = current.length
    ? jumlahkan(current, "Positif") +
      jumlahkan(current, "Negatif") +
      jumlahkan(current, "Netral")
    : 0;

  const hitungPersen = (key: "Positif" | "Negatif" | "Netral") =>
    totalCurrent > 0
      ? Math.round((jumlahkan(current, key) / totalCurrent) * 1000) / 10
      : 0;

  const hitungTrend = (
    key: "Positif" | "Negatif" | "Netral",
  ): number | null => {
    const totalPrev = previous.length
      ? jumlahkan(previous, "Positif") +
        jumlahkan(previous, "Negatif") +
        jumlahkan(previous, "Netral")
      : 0;
    if (totalPrev === 0 || previous.length === 0) return null;

    const persenSekarang = hitungPersen(key);
    const persenLalu =
      Math.round((jumlahkan(previous, key) / totalPrev) * 1000) / 10;
    return Math.round((persenSekarang - persenLalu) * 10) / 10;
  };

  const cards = [
    {
      label: "POSITIVE SENTIMENT",
      key: "Positif" as const,
      bg: "bg-emerald-500",
    },
    { label: "NEUTRAL SENTIMENT", key: "Netral" as const, bg: "bg-amber-400" },
    { label: "NEGATIVE SENTIMENT", key: "Negatif" as const, bg: "bg-rose-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {cards.map((card) => {
        const persen = hitungPersen(card.key);
        const trend = hitungTrend(card.key);

        return (
          <div
            key={card.key}
            className={`rounded-2xl p-5 md:p-6 text-white ${card.bg}`}
          >
            <span className="text-xs font-medium uppercase tracking-wide opacity-90">
              {card.label}
            </span>
            <h4 className="mt-2 text-title-sm font-bold">
              {loading ? "..." : `${persen}%`}
            </h4>
            <div className="mt-2 text-xs opacity-90">
              {loading || trend === null
                ? "-"
                : `${trend >= 0 ? "↗" : "↘"} ${Math.abs(trend)}% vs last week`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
