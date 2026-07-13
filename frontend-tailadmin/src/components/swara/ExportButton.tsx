import { useState, useRef, useEffect } from "react";
import axiosInstance, { API_BASE_URL } from "../../api/axiosInstance";
import { exportSummaryToExcel, exportRawDataToExcel } from "../../utils/excelExport";

interface Props {
  batch: string;
  mode?: "summary" | "raw";
  formats?: ("csv" | "pdf" | "excel")[];
}

export default function ExportButton({ batch, mode = "raw", formats = ["csv", "pdf", "excel"] }: Props) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    setOpen(false);

    if (format === "csv" || format === "pdf") {
      const basePath = mode === "summary" ? "/report/summary/export" : "/feedback/export";
      const query = batch ? `?program_batch=${encodeURIComponent(batch)}` : "";
      window.location.href = `${API_BASE_URL}${basePath}/${format}${query}`;
      return;
    }

    // Excel di-generate di client pakai ExcelJS, butuh fetch data JSON dulu
    setExporting(true);
    try {
      if (mode === "summary") {
        const response = await axiosInstance.get("/report/summary", {
          params: batch ? { program_batch: batch } : {},
        });
        await exportSummaryToExcel(response.data, batch);
      } else {
        const response = await axiosInstance.get("/feedback/export/json", {
          params: batch ? { program_batch: batch } : {},
        });
        await exportRawDataToExcel(response.data.data, batch);
      }
    } catch (error) {
      console.error("Failed to export Excel:", error);
    } finally {
      setExporting(false);
    }
  };

  if (formats.length === 1) {
    return (
      <button
        type="button"
        onClick={() => handleExport(formats[0])}
        disabled={exporting}
        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "EXPORT"}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={exporting}
        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "EXPORT"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30 dark:bg-gray-900 dark:border-gray-700">
          {formats.includes("csv") && (
            <button type="button" onClick={() => handleExport("csv")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
              Export as CSV
            </button>
          )}
          {formats.includes("excel") && (
            <button type="button" onClick={() => handleExport("excel")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
              Export as Excel
            </button>
          )}
          {formats.includes("pdf") && (
            <button type="button" onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
              Export as PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}