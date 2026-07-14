import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { SentimentStats } from "../../types/swara";

export default function SwaraMetrics() {
  const [sentimentData, setSentimentData] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axiosInstance
      .get<SentimentStats>("/stats/sentiment")
      .then((response) => {
        setSentimentData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data sentiment:", error);
        setLoading(false);
      });
  }, []);

  let totalFeedback = "...";
  let positifPersen = "...";
  let negatifPersen = "...";

  if (sentimentData) {
    const total = sentimentData.Positif + sentimentData.Negatif + sentimentData.Netral;
    totalFeedback = total.toLocaleString("id-ID");

    const persenPositif = ((sentimentData.Positif / total) * 100).toFixed(0);
    const persenNegatif = ((sentimentData.Negatif / total) * 100).toFixed(0);

    positifPersen = `${persenPositif}% Positive`;
    negatifPersen = `${persenNegatif}% Negative`;
  }

  const metrics = [
    { label: "Total Feedback", value: loading ? "..." : totalFeedback },
    { label: "Positive Feedback", value: loading ? "..." : positifPersen },
    { label: "Negative Feedback", value: loading ? "..." : negatifPersen },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {metric.label}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {metric.value}
            </h4>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-xl dark:bg-brand-500/10 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
          </div>
        </div>
      ))}
    </div>
  );
}