import { useState, useEffect } from "react";
import { Link } from "react-router";
import axiosInstance from "../../api/axiosInstance";
import { FeedbackItem } from "../../types/swara";

const SENTIMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Positive: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  Negative: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Neutral: { bg: "#FEFCE8", text: "#CA8A04", border: "#FDE68A" },
};

export default function RecentFeedbackList() {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: FeedbackItem[] }>("/feedback?limit=5")
      .then((response) => {
        setFeedbackData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data recent feedback:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Recent Feedback Sentiment
        </h3>
        <Link to="/feedback-category" className="text-sm text-brand-500 hover:underline">
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : feedbackData.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada feedback.</p>
        ) : (
          feedbackData.map((item) => {
            const sentimentInfo = SENTIMENT_COLOR[item.sentiment] ?? {
              bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB",
            };

            return (
              <div
                key={item.feedback_id}
                className="border-2 rounded-xl p-4"
                style={{ borderColor: sentimentInfo.border }}
              >
                <p className="text-sm text-gray-700 mb-2 dark:text-gray-300">
                  "{item.feedback_text}"
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    [{item.feedback_category}] · {item.submission_date}
                  </p>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: sentimentInfo.bg, color: sentimentInfo.text }}
                  >
                    {item.sentiment}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}