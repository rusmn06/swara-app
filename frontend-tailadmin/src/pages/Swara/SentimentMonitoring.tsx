import SentimentSummaryCards from "../../components/swara/SentimentSummaryCards";
import HistoricalSentimentTrend from "../../components/swara/HistoricalSentimentTrend";
import RecentFeedbackList from "../../components/swara/RecentFeedbackList";

export default function SentimentMonitoring() {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <h2 className="text-2xl font-semibold text-brand-500 dark:text-white/90">
        Participant Sentiment Monitoring
      </h2>

      <SentimentSummaryCards />
      <HistoricalSentimentTrend />
      <RecentFeedbackList />
    </div>
  );
}