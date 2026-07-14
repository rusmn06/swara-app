import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { CategoryStats } from "../../types/swara";

const PALET_WARNA = ["#5B2EFF", "#12B76A", "#F04438", "#F79009", "#0BA5EC", "#EE46BC"];

interface Props {
  batch: string;
}

export default function ProportionOfProblemChart({ batch }: Props) {
  const [data, setData] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get<{ data: CategoryStats[] }>("/stats/category", { params: { program_batch: batch } })
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get proportion data:", error);
        setLoading(false);
      });
  }, [batch]);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const namaKategori = data.map((item) => item.category);
  const persenKategori = data.map((item) => (total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0));

  const options: ApexOptions = {
    colors: PALET_WARNA,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
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
    yaxis: {
      labels: { formatter: (val: number) => `${val}%` },
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val}%` } },
  };

  const series = [{ name: "Percentage", data: persenKategori }];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 pb-5 sm:pb-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-4">
        Feedback Category Distribution
      </h3>

      {!loading && (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[400px] pl-2">
            <Chart key={namaKategori.join(",")} options={options} series={series} type="bar" height={320} />
          </div>
        </div>
      )}
    </div>
  );
}