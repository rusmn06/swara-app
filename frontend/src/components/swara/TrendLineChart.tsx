import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { TrendPoint } from "../../types/swara";

interface Props {
  data: TrendPoint[];
}

export default function TrendLineChart({ data }: Props) {
  const tanggal = data.map((item) => item.date);
  const dataPositif = data.map((item) => item.Positif);
  const dataNetral = data.map((item) => item.Netral);
  const dataNegatif = data.map((item) => item.Negatif);

  const options: ApexOptions = {
    colors: ["#16A34A", "#F97316", "#DC2626"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.05 },
    },
    xaxis: {
      categories: tanggal,
      tickAmount: 6,
      labels: {
        style: { fontSize: "10px" },
        rotate: 0,
      },
      axisBorder: { show: false },
      axisTicks: { show: true },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      y: { formatter: (val: number) => `${val} feedback` },
    },
  };

  const series = [
    { name: "Positive", data: dataPositif },
    { name: "Neutral", data: dataNetral },
    { name: "Negative", data: dataNegatif },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
        Sentiment Time Trend
      </h3>

      <div className="w-full overflow-hidden">
        <Chart
          key={tanggal.join(",")}
          options={options}
          series={series}
          type="area"
          height={350}
          width="100%"
        />
      </div>
    </div>
  );
}