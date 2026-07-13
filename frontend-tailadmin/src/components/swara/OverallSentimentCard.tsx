import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { TrendPoint } from "../../types/swara";

export default function OverallSentimentCard() {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: TrendPoint[] }>("/stats/trend", { params: { period: "daily" } })
      .then((response) => {
        setTrendData(response.data.data.slice(-7));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Unable to retrieve Overall Sentiment data:", error);
        setLoading(false);
      });
  }, []);

  // Hitung total & persentase dari 7 hari terakhir aja (bukan keseluruhan dataset)
  const totalPositif = trendData.reduce((sum, d) => sum + d.Positif, 0);
  const totalNegatif = trendData.reduce((sum, d) => sum + d.Negatif, 0);
  const totalNetral = trendData.reduce((sum, d) => sum + d.Netral, 0);
  const total = totalPositif + totalNegatif + totalNetral;

  const persenPositif = total > 0 ? Math.round((totalPositif / total) * 100) : 0;
  const persenNetral = total > 0 ? Math.round((totalNetral / total) * 100) : 0;
  const persenNegatif = total > 0 ? Math.round((totalNegatif / total) * 100) : 0;

  const tanggal = trendData.map((item) => item.date);
  const chartOptions: ApexOptions = {
    colors: ['#16A34A', '#F97316', '#DC2626'], // Hijau (Positif), Oranye (Netral), Merah (Negatif)
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 250,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: {
  categories: tanggal,
  tickAmount: tanggal.length - 1, // paksa tampilin semua 7 label, jangan di-skip otomatis
  tickPlacement: "on",            // label pas di bawah titik datanya, bukan di antara
  labels: {
    style: { fontSize: "10px" },
    rotate: 0,
    hideOverlappingLabels: false,
  },
  axisBorder: { show: false },
  tooltip: { enabled: false },
},
    legend: { show: false },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val} feedback` } },
  };

  const chartSeries = [
    { name: "Positive", data: trendData.map((d) => d.Positif) },
    { name: "Negative", data: trendData.map((d) => d.Negatif) },
    { name: "Neutral", data: trendData.map((d) => d.Netral) },
  ];

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
        Overall Sentiment
      </h3>
      <p className="text-sm text-gray-400 dark:text-gray-400">
        Last 7 days ({total.toLocaleString("id-ID")} feedback)
      </p>

      <div className="mt-4 flex flex-wrap gap-8">
        <div>
          <span className="text-title-sm font-bold text-success-600">{loading ? "..." : `${persenPositif}%`}</span>{" "}
          <span className="text-sm text-gray-500 dark:text-gray-400">POSITIVE</span>
        </div>
        <div>
          <span className="text-title-sm font-bold text-orange-500">{loading ? "..." : `${persenNetral}%`}</span>{" "}
          <span className="text-sm text-gray-500 dark:text-gray-400">NEUTRAL</span>
        </div>
        <div>
          <span className="text-title-sm font-bold text-error-600">{loading ? "..." : `${persenNegatif}%`}</span>{" "}
          <span className="text-sm text-gray-500 dark:text-gray-400">NEGATIVE</span>
        </div>
      </div>

      <div className="mt-6 w-full overflow-hidden">
        {!loading && trendData.length > 0 && (
          <Chart
            key={tanggal.join(",")}
            options={chartOptions}
            series={chartSeries}
            type="area"
            height={250}
            width="100%"
          />
        )}
      </div>
    </div>
  );
}