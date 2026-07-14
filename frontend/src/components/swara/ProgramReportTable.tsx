import { useRef, useEffect } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { API_BASE_URL } from "../../api/axiosInstance";
import ExportButton from "./ExportButton";

DataTable.use(DT);

interface Props {
  batch: string;
}

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

const SENTIMENT_MAP: Record<string, { bg: string; text: string }> = {
  Positive: { bg: "#ECFDF5", text: "#059669" },
  Negative: { bg: "#FEF2F2", text: "#DC2626" },
  Neutral: { bg: "#FEFCE8", text: "#CA8A04" },
};

const KOLOM_URUTAN = [
  "submission_date",
  "internship_company",
  "feedback_text",
  "feedback_category",
  "root_cause",
  "severity_weight",
  "sentiment",
];

export default function ProgramReportTable({ batch }: Props) {
  const tableRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const batchRef = useRef("");

  useEffect(() => {
    batchRef.current = batch;
    tableRef.current?.dt()?.ajax.reload();
  }, [batch]);

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
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-brand-500 dark:text-white/90">
          Full Feedback Report {batch ? `- ${batch}` : "- All Batches"}
        </h3>
        <ExportButton batch={batch} formats={["csv", "excel"]} />
      </div>

      <div ref={wrapperRef} className="swara-datatable-wrapper">
        <DataTable
          ref={tableRef}
          ajax={(dtParams: any, callback: (res: any) => void) => {
            const params = new URLSearchParams();
            params.set("draw", String(dtParams.draw));
            params.set("start", String(dtParams.start));
            params.set("length", String(dtParams.length));
            params.set("search[value]", dtParams.search?.value ?? "");

            const order = dtParams.order?.[0];
            if (order) {
              params.set(
                "order_column",
                KOLOM_URUTAN[order.column] ?? "submission_date",
              );
              params.set("order[0][dir]", String(order.dir));
            }

            params.set("program_batch", batchRef.current);

            fetch(`${API_BASE_URL}/feedback/datatable?${params.toString()}`)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .then((json) => callback(json))
              .catch((err) =>
                console.error("Failed to load report table:", err),
              );
          }}
          columns={[
            { title: "Date", data: "submission_date", width: "100px" },
            { title: "Partner", data: "internship_company", width: "130px" },
            { title: "Feedback", data: "feedback_text", width: "400px" },
            { title: "Category", data: "feedback_category", width: "140px" },
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
                const info = SENTIMENT_MAP[data] ?? {
                  bg: "#F3F4F6",
                  text: "#6B7280",
                };
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
