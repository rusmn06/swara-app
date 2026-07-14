import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import DatePicker from "../form/date-picker";
import { RootCauseStats } from "../../types/swara";

const PALET_WARNA = [
  "#5B2EFF", "#12B76A", "#F04438", "#F79009", "#0BA5EC",
  "#EE46BC", "#7A5AF8", "#F97316", "#06B6D4",
];

type Period = "" | "week" | "month" | "year";

const getDateRange = (selectedPeriod: Period): { start_date: string; end_date: string } => {
  if (!selectedPeriod) return { start_date: "", end_date: "" };
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (selectedPeriod === "week") start.setDate(now.getDate() - 7);
  if (selectedPeriod === "month") start.setMonth(now.getMonth() - 1);
  if (selectedPeriod === "year") start.setFullYear(now.getFullYear() - 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start_date: fmt(start), end_date: fmt(end) };
};

interface RootCauseResponse {
  data: RootCauseStats[];
  latest_date: string | null;
}

export default function RootCauseBarChart() {
  const [period, setPeriod] = useState<Period>("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [data, setData] = useState<RootCauseStats[]>([]);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { start_date, end_date } = customStartDate && customEndDate
      ? { start_date: customStartDate, end_date: customEndDate }
      : getDateRange(period);

    axiosInstance
      .get<RootCauseResponse>("/stats/root-cause", {
        params: { start_date, end_date },
      })
      .then((response) => {
        setData(response.data.data);
        setLatestDate(response.data.latest_date);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get root cause data:", error);
        setLoading(false);
      });
  }, [period, customStartDate, customEndDate]);

  const totalFeedback = data.reduce((total, item) => total + item.count, 0);
  const namaRootCause = data.map((item) => item.root_cause);
  const persenFeedback = data.map((item) =>
    totalFeedback > 0 ? Number(((item.count / totalFeedback) * 100).toFixed(1)) : 0
  );

  const options: ApexOptions = {
    colors: PALET_WARNA,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        borderRadiusApplication: "end",
        barHeight: "50%",
        distributed: true,
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: namaRootCause,
      labels: {
        formatter: (val: string) => `${val}%`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      xaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val}%` },
    },
  };

  const series = [
    {
      name: "Percentage",
      data: persenFeedback,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2 relative z-20">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Root Cause Distribution
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-64">
            <DatePicker
              key={datePickerKey}
              id="root-cause-date-range"
              mode="range"
              placeholder="Select a Date Range"
              onChange={(selectedDates) => {
                if (selectedDates.length === 2) {
                  const fmt = (d: Date) => d.toISOString().split("T")[0];
                  setCustomStartDate(fmt(selectedDates[0]));
                  setCustomEndDate(fmt(selectedDates[1]));
                  setPeriod("");
                } else if (selectedDates.length === 0) {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
              }}
            />
          </div>

          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as Period);
              setCustomStartDate("");
              setCustomEndDate("");
              setDatePickerKey((prev) => prev + 1);
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 pb-6">Loading data...</p>
      ) : namaRootCause.length === 0 ? (
        <p className="text-sm text-gray-400 pb-6">
          No data available for this period.
          {latestDate && ` Latest data available: ${latestDate}.`}
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[500px] xl:min-w-full pl-2">
            <Chart key={period + customStartDate + namaRootCause.join(",")} options={options} series={series} type="bar" height={350} />
          </div>
        </div>
      )}
    </div>
  );
}