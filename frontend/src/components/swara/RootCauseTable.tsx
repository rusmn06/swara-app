import { useRef, useState, useEffect } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { RootCauseStats } from "../../types/swara";
import { API_BASE_URL } from "../../api/axiosInstance";

DataTable.use(DT);

interface Props {
  rootCauseOptions: RootCauseStats[];
}

// Label + warna badge severity, sesuai skala 1-5
const SEVERITY_MAP: Record<
  number,
  { label: string; bg: string; text: string }
> = {
  1: { label: "Very Low", bg: "#ECFDF5", text: "#059669" },
  2: { label: "Low", bg: "#EFF6FF", text: "#2563EB" },
  3: { label: "Medium", bg: "#FEFCE8", text: "#CA8A04" },
  4: { label: "High", bg: "#FFF7ED", text: "#EA580C" },
  5: { label: "Critical", bg: "#FEF2F2", text: "#DC2626" },
};

export default function RootCauseTable({ rootCauseOptions }: Props) {
  const tableRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rootCause, setRootCause] = useState("");
  const [severity, setSeverity] = useState("");
  const [period, setPeriod] = useState("");

  const rootCauseRef = useRef("");
  const severityRef = useRef("");
  const periodRef = useRef("");

  const getDateRange = (
    selectedPeriod: string,
  ): { start_date: string; end_date: string } => {
    if (!selectedPeriod) return { start_date: "", end_date: "" };
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (selectedPeriod === "week") start.setDate(now.getDate() - 7);
    if (selectedPeriod === "month") start.setMonth(now.getMonth() - 1);
    if (selectedPeriod === "year") start.setFullYear(now.getFullYear() - 1);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { start_date: fmt(start), end_date: fmt(end) };
  };

  const reloadTable = () => {
    tableRef.current?.dt()?.ajax.reload();
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const initialTimeout = setTimeout(() => {
      tableRef.current?.dt()?.columns.adjust();
    }, 100);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        tableRef.current?.dt()?.columns.adjust();
      }, 350);
    });
    observer.observe(el);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Root Cause Feedback Table
        </h3>

        <div className="flex flex-wrap gap-3">
          <select
            value={rootCause}
            onChange={(e) => {
              const val = e.target.value;
              setRootCause(val);
              rootCauseRef.current = val;
              reloadTable();
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Root Cause</option>
            {rootCauseOptions.map((r) => (
              <option key={r.root_cause} value={r.root_cause}>
                {r.root_cause}
              </option>
            ))}
          </select>

          <select
            value={severity}
            onChange={(e) => {
              const val = e.target.value;
              setSeverity(val);
              severityRef.current = val;
              reloadTable();
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Severity</option>
            {Object.entries(SEVERITY_MAP).map(([val, info]) => (
              <option key={val} value={val}>
                {info.label}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => {
              const val = e.target.value;
              setPeriod(val);
              periodRef.current = val;
              reloadTable();
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div ref={wrapperRef} className="swara-datatable-wrapper">
        <DataTable
          ref={tableRef}
          ajax={(dtParams: any, callback: (res: any) => void) => {
            const { start_date, end_date } = getDateRange(periodRef.current);

            const params = new URLSearchParams();
            params.set("draw", String(dtParams.draw));
            params.set("start", String(dtParams.start));
            params.set("length", String(dtParams.length));
            params.set("search[value]", dtParams.search?.value ?? "");

            const KOLOM_URUTAN = [
              "submission_date",
              "internship_company",
              "feedback_text",
              "root_cause",
              "severity_weight",
              "sentiment",
            ];

            const order = dtParams.order?.[0];
            if (order) {
              params.set(
                "order_column",
                KOLOM_URUTAN[order.column] ?? "submission_date",
              );
              params.set("order[0][dir]", String(order.dir));
            }

            params.set("root_cause", rootCauseRef.current);
            params.set("severity_weight", severityRef.current);
            params.set("start_date", start_date);
            params.set("end_date", end_date);

            fetch(`${API_BASE_URL}/feedback/datatable?${params.toString()}`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .then((json) => callback(json))
              .catch((err) =>
                console.error("Gagal ambil data DataTable:", err),
              );
          }}
          columns={[
            { title: "Date", data: "submission_date", width: "100px" },
            { title: "Partner", data: "internship_company", width: "130px" },
            { title: "Feedback", data: "feedback_text", width: "350px" },
            { title: "Root Cause", data: "root_cause", width: "120px" },
            {
              title: "Severity",
              data: "severity_weight",
              width: "110px",
              render: (data: number) => {
                const info = SEVERITY_MAP[data] ?? {
                  label: "-",
                  bg: "#F3F4F6",
                  text: "#6B7280",
                };
                return `<span style="background-color:${info.bg};color:${info.text};padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;white-space:nowrap;">${info.label}</span>`;
              },
            },
            {
              title: "Sentiment",
              data: "sentiment",
              width: "110px",
              render: (data: string) => {
                const map: Record<string, { bg: string; text: string }> = {
                  Positive: { bg: "#ECFDF5", text: "#059669" },
                  Negative: { bg: "#FEF2F2", text: "#DC2626" },
                  Neutral: { bg: "#FEFCE8", text: "#CA8A04" },
                };
                const info = map[data] ?? { bg: "#F3F4F6", text: "#6B7280" };
                return `<span style="background-color:${info.bg};color:${info.text};padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;white-space:nowrap;">${data}</span>`;
              },
            },
          ]}
          options={{
            serverSide: true,
            processing: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            order: [[0, "desc"]],
            searching: true,
            scrollX: true,
            autoWidth: false,
          }}
          className="display w-full text-sm"
        />
      </div>
    </div>
  );
}
