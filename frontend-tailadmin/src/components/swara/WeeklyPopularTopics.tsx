import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { RootCauseStats } from "../../types/swara";

const PALET_WARNA = ["#5B2EFF", "#12B76A", "#F04438", "#F79009", "#0BA5EC"];

export default function WeeklyPopularTopics() {
  const [rootCauseData, setRootCauseData] = useState<RootCauseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: RootCauseStats[] }>("/stats/root-cause", { params: { last_days: 7 } })
      .then((response) => {
        setRootCauseData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data root cause:", error);
        setLoading(false);
      });
  }, []);

  const maxCount = rootCauseData.length > 0 ? rootCauseData[0].count : 1;
  const topLima = rootCauseData.slice(0, 5);

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 pb-5 sm:pb-6">
      <h3 className="text-lg font-semibold text-brand-500 mb-6 mt-1">
        Weekly Popular Topics
      </h3>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat data...</p>
      ) : topLima.length === 0 ? (
        <p className="text-sm text-gray-400">Tidak ada data.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {topLima.map((item, index) => {
            const persenLebar = (item.count / maxCount) * 100;
            const warna = PALET_WARNA[index % PALET_WARNA.length];

            return (
              <div key={item.root_cause}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item.root_cause}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: warna }}>
                    {item.count} cases
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${persenLebar}%`, backgroundColor: warna }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}