import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

interface TrendingIssueItem {
  category: string;
  jumlah_minggu_ini: number;
  jumlah_minggu_lalu: number;
  persen_perubahan: number;
  is_trending: boolean;
}

export default function TrendingIssuesList() {
  const [data, setData] = useState<TrendingIssueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: TrendingIssueItem[] }>("/stats/trending-issues")
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get trending issues:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-1">
        Trending Issues
      </h3>
      <p className="text-sm text-gray-400 mb-4">This week vs last week</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading data...</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-400">No data available.</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((item) => {
            const naik = item.persen_perubahan >= 0;
            return (
              <div key={item.category} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  {item.is_trending && (
                    <span className="text-xs" title="Trending">🔥</span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.category}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.jumlah_minggu_ini} this week · {item.jumlah_minggu_lalu} last week
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                    naik
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {naik ? "↑" : "↓"} {Math.abs(item.persen_perubahan)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}