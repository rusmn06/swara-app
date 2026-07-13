import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { SentimentStats } from "../../types/swara";

interface Props {
  batch: string;
}

export default function SentimentDonutReport({ batch }: Props) {
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
        console.error("Gagal ambil data donut:", error);
        setLoading(false);
      });
  }, [batch]);

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 mb-4">
        Sentiment Distribution
      </h3>

      {!loading && (
        <Chart key={batch} options={options} series={series} type="donut" height={300} />
      )}
    </div>
  );
}