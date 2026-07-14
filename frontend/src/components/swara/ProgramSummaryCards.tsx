import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { SentimentStats } from "../../types/swara";

interface Props {
  batch: string;
}

export default function ProgramSummaryCards({ batch }: Props) {
  const [data, setData] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<SentimentStats>("/stats/sentiment", { params: { program_batch: batch } })
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data summary:", error);
        setLoading(false);
      });
  }, [batch]);

  const total = data ? data.Positif + data.Negatif + data.Netral : 0;
  const persenPositif = data && total > 0 ? Math.round((data.Positif / total) * 100) : 0;
  const persenNegatif = data && total > 0 ? Math.round((data.Negatif / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      <div className="rounded-2xl p-5 md:p-6 text-white bg-brand-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total Feedback</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : total.toLocaleString("id-ID")}</h4>
      </div>

      <div className="rounded-2xl p-5 md:p-6 text-white bg-emerald-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">Positif Sentiment</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : `${persenPositif}%`}</h4>
      </div>

      <div className="rounded-2xl p-5 md:p-6 text-white bg-rose-500">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">Negative Sentiment</span>
        <h4 className="mt-2 text-title-sm font-bold">{loading ? "..." : `${persenNegatif}%`}</h4>
      </div>
    </div>
  );
}