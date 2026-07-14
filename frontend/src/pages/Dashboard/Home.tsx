import OverallSentimentCard from "../../components/swara/OverallSentimentCard";
import PartnerPerformancePie from "../../components/swara/PartnerPerformancePie";
import WeeklyPopularTopics from "../../components/swara/WeeklyPopularTopics";
import PartnerLeaderboardMini from "../../components/swara/PartnerLeaderboardMini";

export default function Home() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 items-stretch">
      <h2 className="col-span-12 text-2xl font-semibold text-brand-500 dark:text-white/90">
        Overview Dashboard
      </h2>

      <div className="col-span-12 xl:col-span-8 h-full">
        <OverallSentimentCard />
      </div>
      <div className="col-span-12 xl:col-span-4 h-full">
        <PartnerPerformancePie />
      </div>

      <div className="col-span-12 xl:col-span-6">
        <WeeklyPopularTopics />
      </div>
      <div className="col-span-12 xl:col-span-6">
        <PartnerLeaderboardMini />
      </div>
    </div>
  );
}
