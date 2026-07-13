import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import RootCauseBarChart from "../../components/swara/RootCauseBarChart";
import RootCauseTable from "../../components/swara/RootCauseTable";
import { RootCauseStats } from "../../types/swara";

export default function RootCause() {
  const [rootCauseData, setRootCauseData] = useState<RootCauseStats[]>([]);

  // Chart tetap fixed, tidak terpengaruh filter tabel
  useEffect(() => {
    axiosInstance
      .get<{ data: RootCauseStats[] }>("/stats/root-cause")
      .then((response) => setRootCauseData(response.data.data))
      .catch((error) => console.error("Gagal ambil data root cause:", error));
  }, []);

  return (
    <>
      <PageMeta title="Root Cause Analysis - Swara" description="" />

      <h2 className="text-2xl font-semibold text-brand-500 mb-6">
        Root Cause Analysis
      </h2>

      <div className="mb-6">
        <RootCauseBarChart />
      </div>

      <RootCauseTable rootCauseOptions={rootCauseData} />
    </>
  );
}