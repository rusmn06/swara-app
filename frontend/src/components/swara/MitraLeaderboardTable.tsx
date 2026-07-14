import { useEffect, useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import axiosInstance from "../../api/axiosInstance";

DataTable.use(DT);

interface LeaderboardFull {
  rank: number;
  company: string;
  total_feedback: number;
  negative_feedback: number;
  issue_score: number;
  dominant_issue: string;
}

const getRiskInfo = (
  avgIssueScore: number,
): { label: string; bg: string; text: string } => {
  if (avgIssueScore < 1)
    return { label: "Low", bg: "#ECFDF5", text: "#059669" };
  if (avgIssueScore < 2)
    return { label: "Medium", bg: "#FEFCE8", text: "#CA8A04" };
  if (avgIssueScore < 4)
    return { label: "High", bg: "#FFF7ED", text: "#EA580C" };
  return { label: "Critical", bg: "#FEF2F2", text: "#DC2626" };
};

export default function MitraLeaderboardTable() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<any>(null);
  const [data, setData] = useState<LeaderboardFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: LeaderboardFull[] }>("/stats/leaderboard", {
        params: { limit: 10 },
      })
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to get leaderboard data:", error);
        setLoading(false);
      });
  }, []);

  // Pantau perubahan ukuran container (misal sidebar toggle), suruh DataTables
  // hitung ulang lebar kolomnya -- BUKAN remount total, cukup panggil method bawaannya
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        tableRef.current?.dt()?.columns.adjust();
      }, 350);
    });

    observer.observe(el);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [loading]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90 mb-4">
        Leaderboard Mitra
      </h3>

      <div ref={wrapperRef} className="swara-datatable-wrapper">
        {loading ? (
          <p className="text-sm text-gray-400">Loading data...</p>
        ) : (
          <DataTable
            ref={tableRef}
            data={data}
            columns={[
              {
                title: "Rank",
                data: "rank",
                render: (val: number) => `#${val}`,
                className: "text-left",
              },
              { title: "Partner", data: "company", className: "text-left" },
              {
                title: "Total Feedback",
                data: "total_feedback",
                className: "text-left",
              },
              {
                title: "Negative",
                data: "negative_feedback",
                className: "text-left",
              },
              {
                title: "Issue Score",
                data: null,
                className: "text-left",
                render: (row: LeaderboardFull) => {
                  const avg =
                    row.total_feedback > 0
                      ? row.issue_score / row.total_feedback
                      : 0;
                  const info = getRiskInfo(avg);
                  return `<span style="background-color:${info.bg};color:${info.text};padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;white-space:nowrap;">${info.label}</span>`;
                },
              },
              {
                title: "Dominant Issue",
                data: "dominant_issue",
                className: "text-left",
              },
            ]}
            options={{
              paging: true,
              pageLength: 10,
              searching: false,
              order: [[0, "asc"]],
              scrollX: true,
              autoWidth: false,
            }}
            className="display w-full text-sm"
          />
        )}
      </div>
    </div>
  );
}
