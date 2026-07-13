import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import TrendLineChart from "../../components/swara/TrendLineChart";
import CategoryTrendChart from "../../components/swara/CategoryTrendChart";
import DatePicker from "../../components/form/date-picker";
import { TrendPoint } from "../../types/swara";
import TrendingIssuesList from "../../components/swara/TrendingIssuesList";

export default function TrendingParticipant() {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const params: Record<string, string> = { period: selectedPeriode };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axiosInstance
      .get<{ data: TrendPoint[] }>("/stats/trend", { params })
      .then((response) => {
        // Mode daily tanpa filter tanggal custom -> batasi 14 hari terakhir biar nggak padet
        const data =
          selectedPeriode === "daily" && !startDate && !endDate
            ? response.data.data.slice(-14)
            : response.data.data;
        setTrendData(data);
      })
      .catch((error) => console.error("Failed to retrieve trend data:", error));
  }, [selectedPeriode, startDate, endDate]);

  return (
    <>
      <PageMeta title="Trending Participant Issues - Swara" description="" />

      <h2 className="text-2xl font-semibold text-brand-500 mb-6">
        Trending Participant Issues
      </h2>

      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <select
          value={selectedPeriode}
          onChange={(e) => setSelectedPeriode(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 dark:bg-white/[0.03] dark:border-gray-700 dark:text-gray-300"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <div className="w-72">
          <DatePicker
            id="trend-date-range"
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
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <TrendLineChart data={trendData} />
        <CategoryTrendChart
          period={selectedPeriode}
          startDate={startDate}
          endDate={endDate}
        />
        <TrendingIssuesList />
      </div>
    </>
  );
}
