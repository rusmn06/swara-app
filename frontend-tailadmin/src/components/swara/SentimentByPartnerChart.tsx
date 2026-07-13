import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { SentimentStats } from "../../types/swara";

interface Props {
  partner: string;
}

export default function SentimentByPartnerChart({ partner }: Props) {
  const [data, setData] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<SentimentStats>("/stats/sentiment", { params: partner ? { company: partner } : {} })
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get sentiment data:", error);
        setLoading(false);
      });
  }, [partner]);

  const total = data ? data.Positif + data.Negatif + data.Netral : 0;
  const series = data && total > 0
    ? [
        Math.round((data.Positif / total) * 1000) / 10,
        Math.round((data.Netral / total) * 1000) / 10,
        Math.round((data.Negatif / total) * 1000) / 10,
      ]
    : [0, 0, 0];

  const options: ApexOptions = {
    labels: ["Positif", "Netral", "Negatif"],
    colors: ["#10B981", "#F59E0B", "#F43F5E"],
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    legend: { position: "bottom", fontFamily: "Outfit" },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: { colors: ["#fff"], fontSize: "12px", fontWeight: 600 },
      dropShadow: { enabled: true, top: 1, left: 1, blur: 1, opacity: 0.45 },
    },
    stroke: { width: 2, colors: ["#fff"] },
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-2">
        Sentiment {partner ? `- ${partner}` : ""}
      </h3>

      {!loading && total > 0 ? (
        <Chart key={partner} options={options} series={series} type="donut" height={280} />
      ) : (
        <p className="text-sm text-gray-400">{loading ? "Loading data..." : "No data available."}</p>
      )}
    </div>
  );
}