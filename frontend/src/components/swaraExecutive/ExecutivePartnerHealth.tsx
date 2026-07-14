import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

interface LeaderboardItem {
  company: string;
  total_feedback: number;
  issue_score: number;
  dominant_issue: string;
}

const getRiskInfo = (avg: number) => {
  if (avg < 1) return { label: "Low", bg: "#ECFDF5", text: "#059669" };
  if (avg < 2) return { label: "Medium", bg: "#FEFCE8", text: "#CA8A04" };
  if (avg < 4) return { label: "High", bg: "#FFF7ED", text: "#EA580C" };
  return { label: "Critical", bg: "#FEF2F2", text: "#DC2626" };
};

export default function ExecutivePartnerHealth() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: LeaderboardItem[] }>("/stats/leaderboard", { params: { limit: 100 } })
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get partner health:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-4">
        Partner Health Status
      </h3>

      {loading ? (
        <p className="text-sm text-gray-400">Loading data...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => {
            const avg = item.total_feedback > 0 ? item.issue_score / item.total_feedback : 0;
            const info = getRiskInfo(avg);
            return (
              <div key={item.company} className="border border-gray-100 rounded-xl p-4 dark:border-gray-800">
                <p className="font-medium text-gray-800 dark:text-white/90">{item.company}</p>
                <p className="text-xs text-gray-400 mb-2">{item.dominant_issue}</p>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: info.bg, color: info.text }}
                >
                  {info.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}