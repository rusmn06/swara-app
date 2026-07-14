import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { CategoryStats } from "../../types/swara";

const PALET_WARNA = ["#5B2EFF", "#12B76A", "#F04438", "#F79009", "#0BA5EC", "#EE46BC"];

interface Props {
  partner: string;
}

interface CategoryResponse {
  data: CategoryStats[];
  latest_date: string | null;
}

export default function CategoryByPartnerChart({ partner }: Props) {
  const [data, setData] = useState<CategoryStats[]>([]);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<CategoryResponse>("/stats/category", { params: partner ? { company: partner } : {} })
      .then((response) => {
        setData(response.data.data);
        setLatestDate(response.data.latest_date);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get category data:", error);
        setLoading(false);
      });
  }, [partner]);

  const namaKategori = data.map((item) => item.category);
  const jumlahFeedback = data.map((item) => item.count);

  const options: ApexOptions = {
    colors: PALET_WARNA,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: { columnWidth: "50%", borderRadius: 6, borderRadiusApplication: "end", distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories: namaKategori,
      labels: { style: { fontSize: "9px" }, rotate: 0, trim: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val: number) => `${val} feedback` } },
  };

  const series = [{ name: "Feedback", data: jumlahFeedback }];

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-2">
        Feedback Category {partner ? `- ${partner}` : ""}
      </h3>

      {loading ? (
        <p className="text-sm text-gray-400 pb-6">Loading data...</p>
      ) : namaKategori.length === 0 ? (
        <p className="text-sm text-gray-400 pb-6">
          No data available.{latestDate && ` Latest data available: ${latestDate}.`}
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[400px] pl-2">
            <Chart key={partner + namaKategori.join(",")} options={options} series={series} type="bar" height={320} />
          </div>
        </div>
      )}
    </div>
  );
}