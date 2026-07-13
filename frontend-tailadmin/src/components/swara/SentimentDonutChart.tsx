import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { SentimentStats } from "../../types/swara";

interface Props {
  data: SentimentStats | null;
}

export default function SentimentDonutChart({ data }: Props) {
  const series = data ? [data.Positif, data.Netral, data.Negatif] : [0, 0, 0];

  const options: ApexOptions = {
    colors: ["#5b2eff", "#9ca3af", "#ef4444"],
    labels: ["Positif", "Netral", "Negatif"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: {
        fontSize: "13px",
        fontWeight: 600,
        colors: ["#fff"],
      },
      dropShadow: {
        enabled: false,
      },
    },
    legend: {
      position: "bottom",
      fontFamily: "Outfit",
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} feedback`,
      },
    },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Participant Sentiment
      </h3>

      <div className="flex-1 flex items-center justify-center py-4">
        <Chart options={options} series={series} type="donut" height={280} />
      </div>
    </div>
  );
}