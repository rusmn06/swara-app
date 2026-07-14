import { useState, useEffect } from "react";
import axiosInstance, { API_BASE_URL } from "../../api/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import ExecutiveKPICards from "../../components/swaraExecutive/ExecutiveKPICards";
import ExecutivePartnerHealth from "../../components/swaraExecutive/ExecutivePartnerHealth";
import TrendLineChart from "../../components/swara/TrendLineChart";
import TopTrendingTopic from "../../components/swara/TopTrendingTopic";
import { TrendPoint } from "../../types/swara";

export default function ExecutiveOverview() {
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    axiosInstance
      .get<{ data: TrendPoint[] }>("/stats/trend", { params: { period: "weekly" } })
      .then((response) => setTrendData(response.data.data.slice(-8)))
      .catch((error) => console.error("Failed to get trend:", error));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <PageMeta title="Executive Overview - Swara" description="" />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h2 className="text-2xl font-semibold text-brand-500">Executive Overview</h2>
        <button
          type="button"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/report/executive-summary/export/pdf`;
          }}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700"
        >
          EXPORT PDF
        </button>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <ExecutiveKPICards />
        <TrendLineChart data={trendData} />

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
          <TopTrendingTopic batch="" />
          <ExecutivePartnerHealth />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes before presenting this report..."
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          />
          <p className="text-xs text-gray-400 mt-2">Notes are local to this session only and not saved or included in the exported PDF.</p>
        </div>
      </div>
    </div>
  );
}