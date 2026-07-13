import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";

const PALET_WARNA = [
  "#5B2EFF",
  "#12B76A",
  "#F04438",
  "#F79009",
  "#0BA5EC",
  "#EE46BC",
];

interface Props {
  period: string;
  startDate: string;
  endDate: string;
}

interface CategoryTrendPoint {
  date: string;
  [category: string]: string | number;
}

interface CategoryTrendResponse {
  data: CategoryTrendPoint[];
  categories: string[];
}

export default function CategoryTrendChart({
  period,
  startDate,
  endDate,
}: Props) {
  const [trendData, setTrendData] = useState<CategoryTrendPoint[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { period };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axiosInstance
      .get<CategoryTrendResponse>("/stats/category-trend", { params })
      .then((response) => {
        const data =
          period === "daily" && !startDate && !endDate
            ? response.data.data.slice(-14)
            : response.data.data;
        setTrendData(data);
        setCategoryList(response.data.categories);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get category trend:", error);
        setLoading(false);
      });
  }, [period, startDate, endDate]);

  const label = trendData.map((item) => item.date);

  const options: ApexOptions = {
    colors: PALET_WARNA,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.05 },
    },
    xaxis: {
      categories: label,
      tickAmount: 6,
      labels: { style: { fontSize: "10px" }, rotate: 0 },
      axisBorder: { show: false },
      axisTicks: { show: true },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (val: number) => `${val} feedback` } },
  };

  const series = categoryList.map((kategori) => ({
    name: kategori,
    data: trendData.map((item) => Number(item[kategori] ?? 0)),
  }));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
        Category Time Trend
      </h3>

      <div className="w-full overflow-hidden mt-2">
        {loading ? (
          <p className="text-sm text-gray-400 pb-6">Loading data...</p>
        ) : trendData.length > 0 ? (
          <Chart
            key={period + label.join(",")}
            options={options}
            series={series}
            type="area"
            height={350}
            width="100%"
          />
        ) : (
          <p className="text-sm text-gray-400 pb-6">
            No data available for the selected date range.
          </p>
        )}
      </div>
    </div>
  );
}
