import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { CompanyStats } from "../../types/swara";

const PALET_WARNA = ["#5B2EFF", "#12B76A", "#F04438", "#F79009", "#7A5AF8", "#0BA5EC", "#EE46BC"];

interface Props {
  batch?: string; // opsional -- kalau kosong, tampilkan semua batch (dipakai di Overview Dashboard)
}

export default function PartnerPerformancePie({ batch }: Props) {
  const [data, setData] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<{ data: CompanyStats[] }>("/stats/company", { params: batch ? { program_batch: batch } : {} })
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal ambil data Partner Performance:", error);
        setLoading(false);
      });
  }, [batch]);

  const labels = data.map((item) => item.company);
  const series = data.map((item) =>
    item.total_feedback > 0 ? Math.round((item.negative_feedback / item.total_feedback) * 1000) / 10 : 0
  );

  const options: ApexOptions = {
    labels,
    colors: PALET_WARNA,
    chart: { fontFamily: "Outfit, sans-serif", type: "pie" },
    legend: { position: "bottom", fontFamily: "Outfit" },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { fontSize: "12px", fontWeight: 600, colors: ["#fff"] },
      dropShadow: { enabled: true, top: 1, left: 1, blur: 1, opacity: 0.45 },
    },
    tooltip: { y: { formatter: (val: number) => `${val}% feedback negatif` } },
    stroke: { width: 2, colors: ["#fff"] },
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
        Negative Sentiment by Partner
      </h3>

      <div className="mt-4 w-full overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400">Memuat data...</p>
        ) : data.length > 0 ? (
          <Chart key={`${labels.join(",")}-${batch}`} options={options} series={series} type="pie" height={300} />
        ) : (
          <p className="text-sm text-gray-400">Tidak ada data mitra.</p>
        )}
      </div>
    </div>
  );
}