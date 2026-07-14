import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import DatePicker from "../form/date-picker";
import { TrendPoint } from "../../types/swara";

type Period = "daily" | "weekly" | "monthly";

interface TrendResponse {
  data: TrendPoint[];
  latest_date: string | null;
}

export default function HistoricalSentimentTrend() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { period };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axiosInstance
      .get<TrendResponse>("/stats/trend", { params })
      .then((response) => {
        const data =
          startDate || endDate
            ? response.data.data
            : response.data.data.slice(-5);
        setTrendData(data);
        setLatestDate(response.data.latest_date);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data trend:", error);
        setLoading(false);
      });
  }, [period, startDate, endDate]);

  const label = trendData.map((item) => item.date);

  const options: ApexOptions = {
    colors: ["#10B981", "#F59E0B", "#F43F5E"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      stacked: true,
      stackType: "100%",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: { columnWidth: "40%", borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: label,
      labels: { style: { fontSize: "11px" } },
      axisBorder: { show: false },
    },
    legend: { position: "bottom", fontFamily: "Outfit" },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val} feedback` } },
  };

  const series = [
    { name: "Positive", data: trendData.map((d) => d.Positif) },
    { name: "Neutral", data: trendData.map((d) => d.Netral) },
    { name: "Negative", data: trendData.map((d) => d.Negatif) },
  ];

  const periodOptions: { value: Period; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Historical Sentiment Trend
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-64">
            <DatePicker
              id="historical-trend-date-range"
              mode="range"
              placeholder="Select a Date Range"
              onChange={(selectedDates) => {
                if (selectedDates.length === 2) {
                  const formatTanggal = (date: Date) =>
                    date.toISOString().split("T")[0];
                  setStartDate(formatTanggal(selectedDates[0]));
                  setEndDate(formatTanggal(selectedDates[1]));
                } else if (selectedDates.length === 0) {
                  setStartDate("");
                  setEndDate("");
                }
              }}
            />
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 w-full overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400">Loading data...</p>
        ) : trendData.length > 0 ? (
          <Chart
            key={period + label.join(",")}
            options={options}
            series={series}
            type="bar"
            height={320}
          />
        ) : (
          <p className="text-sm text-gray-400">
            No data available for the selected date range.
            {latestDate && ` Latest data available: ${latestDate}.`}
          </p>
        )}
      </div>
    </div>
  );
}