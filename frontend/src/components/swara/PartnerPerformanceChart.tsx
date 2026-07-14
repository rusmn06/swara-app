import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import axiosInstance from "../../api/axiosInstance";
import { CompanyStats } from "../../types/swara";

export default function PartnerPerformanceChart() {
  const [companyData, setCompanyData] = useState<CompanyStats[]>([]);

  useEffect(() => {
    axiosInstance
      .get<{ data: CompanyStats[] }>("/stats/company")
      .then((response) => {
        setCompanyData(response.data.data);
      })
      .catch((error) => console.error("Gagal ambil data company:", error));
  }, []);

  const namaCompany = companyData.map((item) => item.company);
  const nilaiIssueScore = companyData.map((item) => item.issue_score);

  const options: ApexOptions = {
    // Tidak diisi manual, biarkan ApexCharts pakai palet warna-warni bawaan
    labels: namaCompany,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "pie",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: {
        fontSize: "12px",
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
        formatter: (val: number) => `Issue Score: ${val}`,
      },
    },
  };

  const series = nilaiIssueScore;

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Partner Performance
      </h3>

      <div className="flex-1 flex items-center justify-center py-4">
        <Chart options={options} series={series} type="pie" height={300} />
      </div>
    </div>
  );
}