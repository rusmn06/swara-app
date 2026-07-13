export interface SentimentStats {
  Positif: number;
  Negatif: number;
  Netral: number;
}

export interface CompanyStats {
  company: string;
  total_feedback: number;
  negative_feedback: number;
  issue_score: number;
  dominant_issue: string;
}

export interface FeedbackItem {
  feedback_id: string;
  participant_id: string;
  internship_company: string;
  submission_date: string;
  feedback_text: string;
  feedback_category: string;
  sentiment: string;
  root_cause: string;
  issue_score: number;
  program_batch: string;
}

export interface RootCauseStats {
  root_cause: string;
  count: number;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface CategoryStats {
  category: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  Positif: number;
  Negatif: number;
  Netral: number;
}

export interface KeywordStats {
  keyword: string;
  count: number;
}