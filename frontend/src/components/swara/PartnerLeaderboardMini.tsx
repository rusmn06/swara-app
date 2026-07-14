import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { LeaderboardItem } from "../../types/swara";

// Tentuin kategori risk dari rata-rata issue_score, sesuai skala asli 0-5
const getRiskInfo = (avgIssueScore: number): { label: string; className: string } => {
  if (avgIssueScore < 1) return { label: "Low", className: "text-success-600 bg-success-50" };
  if (avgIssueScore < 2) return { label: "Medium", className: "text-yellow-600 bg-yellow-50" };
  if (avgIssueScore < 4) return { label: "High", className: "text-orange-600 bg-orange-50" };
  return { label: "Critical", className: "text-error-600 bg-error-50" };
};

export default function PartnerLeaderboardMini() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: LeaderboardItem[] }>("/stats/leaderboard", {
        params: { limit: 5 },
      })
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data Leaderboard:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
        Partner Leaderboard
      </h3>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 text-xs font-medium uppercase text-gray-400">Partner Name</th>
              <th className="pb-3 text-xs font-medium uppercase text-gray-400">Total Issue</th>
              <th className="pb-3 text-xs font-medium uppercase text-gray-400">Issue Score</th>
              <th className="pb-3 text-xs font-medium uppercase text-gray-400">Dominant Issue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-gray-400">Memuat data...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-sm text-gray-400">Tidak ada data.</td>
              </tr>
            ) : (
              data.map((item) => {
                // Rata-rata issue_score per baris feedback, balik ke skala asli 0-5
                const avgIssueScore = item.total_feedback > 0 ? item.issue_score / item.total_feedback : 0;
                const risk = getRiskInfo(avgIssueScore);

                return (
                  <tr key={item.company} className="border-b border-gray-50 dark:border-gray-800/50">
                    <td className="py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.company}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10">
                        {Math.round(item.total_feedback)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${risk.className}`}>
                        {risk.label}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.dominant_issue}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}