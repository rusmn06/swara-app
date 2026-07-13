import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

interface KpiData {
  total_feedback: number;
  positive_percent: number;
  critical_partners_count: number;
  weeks_running: number;
}

export default function ExecutiveKPICards() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<KpiData>("/stats/executive-kpi")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get executive KPI:", error);
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: "Total Feedback", value: data?.total_feedback.toLocaleString("id-ID"), bg: "bg-brand-500" },
    { label: "Overall Positive Sentiment", value: data ? `${data.positive_percent}%` : "", bg: "bg-emerald-500" },
    { label: "Critical Partners", value: data?.critical_partners_count, bg: "bg-rose-500" },
    { label: "Weeks Running", value: data?.weeks_running, bg: "bg-sky-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-2xl p-6 text-white ${card.bg}`}>
          <span className="text-xs font-medium uppercase tracking-wide opacity-90">{card.label}</span>
          <h4 className="mt-2 text-3xl font-bold">{loading ? "..." : card.value}</h4>
        </div>
      ))}
    </div>
  );
}