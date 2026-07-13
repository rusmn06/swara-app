import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import ProgramSummaryCards from "../../components/swara/ProgramSummaryCards";
import ProportionOfProblemChart from "../../components/swara/ProportionOfProblemChart";
import SentimentDonutReport from "../../components/swara/SentimentDonutReport";
import TopTrendingTopic from "../../components/swara/TopTrendingTopic";
import PartnerPerformancePie from "../../components/swara/PartnerPerformancePie";
import ProgramReportTable from "../../components/swara/ProgramReportTable";
import ExportButton from "../../components/swara/ExportButton";

export default function ProgramReport() {
  const [batchList, setBatchList] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState(""); // "" = All Batch

  useEffect(() => {
    axiosInstance
      .get<{ data: string[] }>("/stats/batches")
      .then((response) => setBatchList(response.data.data))
      .catch((error) => console.error("Gagal ambil data batch:", error));
  }, []);

  return (
    <>
      <PageMeta title="Program Report - Swara" description="" />

      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-brand-500 mb-6">
          Program Report
        </h2>

        <div className="flex items-center justify-end gap-3">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 dark:bg-white/[0.03] dark:border-gray-700 dark:text-gray-300"
          >
            <option value="">All Batch</option>
            {batchList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <ExportButton
            batch={selectedBatch}
            mode="summary"
            formats={["csv", "excel", "pdf"]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <ProgramSummaryCards batch={selectedBatch} />

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ProportionOfProblemChart batch={selectedBatch} />
          </div>
          <SentimentDonutReport batch={selectedBatch} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
          <TopTrendingTopic batch={selectedBatch} />
          <PartnerPerformancePie batch={selectedBatch} />
        </div>

        <ProgramReportTable batch={selectedBatch} />
      </div>
    </>
  );
}
