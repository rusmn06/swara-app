import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import DatePicker from "../form/date-picker";

interface Props {
  partner: string;
}

interface IssueTrendPoint {
  date: string;
  avg_issue_score: number;
}

interface IssueTrendResponse {
  data: IssueTrendPoint[];
  latest_date: string | null;
}

type Period = "daily" | "weekly" | "monthly";

export default function IssueScoreTrendChart({ partner }: Props) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendData, setTrendData] = useState<IssueTrendPoint[]>([]);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { period };
    if (partner) params.company = partner;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axiosInstance
      .get<IssueTrendResponse>("/stats/issue-trend", { params })
      .then((response) => {
        setTrendData(response.data.data);
        setLatestDate(response.data.latest_date);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get issue score trend:", error);
        setLoading(false);
      });
  }, [partner, period, startDate, endDate]);

  const label = trendData.map((item) => item.date);

  const options: ApexOptions = {
    colors: ["#5B2EFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: {
      categories: label,
      labels: { style: { fontSize: "10px" }, rotate: 0 },
      axisBorder: { show: false },
    },
    yaxis: {
      title: { text: "Avg Issue Score" },
      min: 0,
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val} avg issue score` } },
  };

  const series = [{ name: "Avg Issue Score", data: trendData.map((d) => d.avg_issue_score) }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Issue Score Trend {partner ? `- ${partner}` : ""}
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-64">
            <DatePicker
              id="issue-trend-date-range"
              mode="range"
              placeholder="Select a Date Range"
              onChange={(selectedDates) => {
                if (selectedDates.length === 2) {
                  const fmt = (d: Date) => d.toISOString().split("T")[0];
                  setStartDate(fmt(selectedDates[0]));
                  setEndDate(fmt(selectedDates[1]));
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
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="mt-2 w-full overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400">Loading data...</p>
        ) : trendData.length > 0 ? (
          <Chart key={partner + period + label.join(",")} options={options} series={series} type="area" height={320} />
        ) : (
          <p className="text-sm text-gray-400">
            No data available.{latestDate && ` Latest data available: ${latestDate}.`}
          </p>
        )}
      </div>
    </div>
  );
}