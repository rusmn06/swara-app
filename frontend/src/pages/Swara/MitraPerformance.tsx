import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import MitraSummaryCards from "../../components/swara/MitraSummaryCards";
import MitraLeaderboardTable from "../../components/swara/MitraLeaderboardTable";
import CategoryByPartnerChart from "../../components/swara/CategoryByPartnerChart";
import SentimentByPartnerChart from "../../components/swara/SentimentByPartnerChart";
import IssueScoreTrendChart from "../../components/swara/IssueScoreTrendChart";
import { CompanyStats } from "../../types/swara";

export default function MitraPerformance() {
  const [partnerList, setPartnerList] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState("");

  useEffect(() => {
    axiosInstance
      .get<{ data: CompanyStats[] }>("/stats/company")
      .then((response) =>
        setPartnerList(response.data.data.map((item) => item.company)),
      )
      .catch((error) => console.error("Failed to get partner list:", error));
  }, []);

  return (
    <>
      <PageMeta title="Mitra Performance - Swara" description="" />

      <h2 className="text-2xl font-semibold text-brand-500 mb-6">
        Mitra Performance Monitoring
      </h2>

      <div className="flex flex-col gap-4 md:gap-6">
        <MitraSummaryCards />
        <MitraLeaderboardTable />

        <div className="flex items-center justify-end">
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 dark:bg-white/[0.03] dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">All Partners</option>
            {partnerList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12 items-stretch">
          <div className="xl:col-span-8 h-full">
            <CategoryByPartnerChart partner={selectedPartner} />
          </div>
          <div className="xl:col-span-4 h-full">
            <SentimentByPartnerChart partner={selectedPartner} />
          </div>
        </div>

        <IssueScoreTrendChart partner={selectedPartner} />
      </div>
    </>
  );
}
