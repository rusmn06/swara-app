import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const WARNA_HEADER = "5B2EFF";

// Styling standar buat header tiap sheet
function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${WARNA_HEADER}` } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
  row.height = 22;
}

interface SummaryReportData {
  total_feedback: number;
  positive_percent: number;
  neutral_percent: number;
  negative_percent: number;
  category_breakdown: { category: string; count: number; percent: number }[];
  top_issues: { root_cause: string; count: number }[];
  partner_breakdown: { company: string; negative_percent: number }[];
}

export async function exportSummaryToExcel(data: SummaryReportData, batch: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Swara";
  workbook.created = new Date();

  // Sheet 1: Summary
  const sheetSummary = workbook.addWorksheet("Summary");
  sheetSummary.columns = [{ width: 30 }, { width: 20 }];
  sheetSummary.addRow(["Swara Program Report"]).font = { bold: true, size: 14 };
  sheetSummary.addRow([`Batch: ${batch || "All Batches"}`]);
  sheetSummary.addRow([]);
  const headerSummary = sheetSummary.addRow(["Metric", "Value"]);
  styleHeaderRow(headerSummary);
  sheetSummary.addRow(["Total Feedback", data.total_feedback]);
  sheetSummary.addRow(["Positive Sentiment (%)", data.positive_percent]);
  sheetSummary.addRow(["Neutral Sentiment (%)", data.neutral_percent]);
  sheetSummary.addRow(["Negative Sentiment (%)", data.negative_percent]);

  // Sheet 2: Category Breakdown
  const sheetCategory = workbook.addWorksheet("Category Breakdown");
  sheetCategory.columns = [{ width: 30 }, { width: 15 }, { width: 15 }];
  const headerCategory = sheetCategory.addRow(["Category", "Count", "Percent (%)"]);
  styleHeaderRow(headerCategory);
  data.category_breakdown.forEach((item) => {
    sheetCategory.addRow([item.category, item.count, item.percent]);
  });

  // Sheet 3: Top Issues
  const sheetIssues = workbook.addWorksheet("Top Trending Topics");
  sheetIssues.columns = [{ width: 30 }, { width: 15 }];
  const headerIssues = sheetIssues.addRow(["Root Cause", "Count"]);
  styleHeaderRow(headerIssues);
  data.top_issues.forEach((item) => {
    sheetIssues.addRow([item.root_cause, item.count]);
  });

  // Sheet 4: Partner Breakdown
  const sheetPartner = workbook.addWorksheet("Negative Sentiment by Partner");
  sheetPartner.columns = [{ width: 30 }, { width: 20 }];
  const headerPartner = sheetPartner.addRow(["Partner", "Negative (%)"]);
  styleHeaderRow(headerPartner);
  data.partner_breakdown.forEach((item) => {
    sheetPartner.addRow([item.company, item.negative_percent]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, `swara_summary_${batch || "all_batch"}.xlsx`);
}

interface RawFeedbackRow {
  feedback_id: string;
  submission_date: string;
  internship_company: string;
  program_batch: string;
  feedback_text: string;
  feedback_category: string;
  root_cause: string;
  severity_weight: number;
  sentiment: string;
  issue_score: number;
}

export async function exportRawDataToExcel(rows: RawFeedbackRow[], batch: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Swara";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Feedback Data");
  sheet.columns = [
    { header: "Feedback ID", key: "feedback_id", width: 15 },
    { header: "Date", key: "submission_date", width: 15 },
    { header: "Partner", key: "internship_company", width: 18 },
    { header: "Batch", key: "program_batch", width: 15 },
    { header: "Feedback Text", key: "feedback_text", width: 60 },
    { header: "Category", key: "feedback_category", width: 20 },
    { header: "Root Cause", key: "root_cause", width: 18 },
    { header: "Severity", key: "severity_weight", width: 12 },
    { header: "Sentiment", key: "sentiment", width: 14 },
    { header: "Issue Score", key: "issue_score", width: 14 },
  ];

  styleHeaderRow(sheet.getRow(1));
  sheet.autoFilter = { from: "A1", to: "J1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }]; // freeze header row

  rows.forEach((row) => {
    const dataRow = sheet.addRow(row);
    dataRow.alignment = { wrapText: true, vertical: "top" };
  });

  // Warna badge sentiment biar cepat kebaca (kolom I = sentiment)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cellSentiment = row.getCell("sentiment");
    const warnaMap: Record<string, string> = {
      Positive: "FFD1FAE5",
      Negative: "FFFEE2E2",
      Neutral: "FFFEF3C7",
    };
    const warna = warnaMap[cellSentiment.value as string];
    if (warna) {
      cellSentiment.fill = { type: "pattern", pattern: "solid", fgColor: { argb: warna } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, `swara_report_${batch || "all_batch"}.xlsx`);
}