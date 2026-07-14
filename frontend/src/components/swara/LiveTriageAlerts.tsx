import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { FeedbackItem } from "../../types/swara";

export default function LiveTriageAlerts() {
  const [alertsData, setAlertsData] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    axiosInstance
      .get<{ data: FeedbackItem[] }>("/feedback?sentiment=Negative&limit=5")
      .then((response) => {
        setAlertsData(response.data.data);
      })
      .catch((error) => {
        console.error("Gagal ambil data alerts:", error);
      });
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 pb-5 sm:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-error-500"></span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Live Triage Alerts
          </h3>
        </div>
        <span className="text-sm text-brand-500 cursor-pointer">View All</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: "320px" }}>
        {alertsData.map((item) => (
          <div
            key={item.feedback_id}
            className="bg-error-50 border border-error-100 rounded-xl p-4 dark:bg-error-500/10 dark:border-error-500/20"
          >
            <p className="text-xs text-gray-400 mb-1 dark:text-gray-500">
              {item.submission_date}
            </p>
            <p className="text-sm text-gray-700 mb-2 dark:text-gray-300">
              "{item.feedback_text}"
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.program_batch} -{" "}
              {item.root_cause !== "Tidak Relevan"
                ? item.root_cause
                : item.feedback_category}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}