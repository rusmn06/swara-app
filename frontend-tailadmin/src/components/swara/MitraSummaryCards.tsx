import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

interface LeaderboardItem {
  rank: number;
  company: string;
  total_feedback: number;
  negative_feedback: number;
  issue_score: number;
  dominant_issue: string;
}

const getRiskLabel = (avgIssueScore: number): string => {
  if (avgIssueScore < 1) return "Low";
  if (avgIssueScore < 2) return "Medium";
  if (avgIssueScore < 4) return "High";
  return "Critical";
};

export default function MitraSummaryCards() {
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
        console.error("Failed to get leaderboard summary:", error);
        setLoading(false);
      });
  }, []);

  const totalPartners = data.length;
  const bestPerforming = data.length > 0 ? data[0].company : "-";

  const highRiskCount = data.filter((item) => {
    const avg = item.total_feedback > 0 ? item.issue_score / item.total_feedback : 0;
    const risk = getRiskLabel(avg);
    return risk === "High" || risk === "Critical";
  }).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      <div className="rounded-2xl p-5 md:p-6 text-white bg-brand-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total Partners</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : totalPartners}</h4>
      </div>

      <div className="rounded-2xl p-5 md:p-6 text-white bg-sky-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">Best Performing</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : bestPerforming}</h4>
      </div>

      <div className="rounded-2xl p-5 md:p-6 text-white bg-rose-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">High Risk Partners</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : highRiskCount}</h4>
      </div>
    </div>
  );
}