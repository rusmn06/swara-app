import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { CategoryStats } from "../../types/swara";
import CategoryBarChart from "../../components/swara/CategoryBarChart";
import FeedbackCategoryTable from "../../components/swara/FeedbackCategoryTable";

export default function FeedbackCategory() {
  const [categoryData, setCategoryData] = useState<CategoryStats[]>([]);

  useEffect(() => {
    axiosInstance
      .get<{ data: CategoryStats[] }>("/stats/category")
      .then((response) => setCategoryData(response.data.data))
      .catch((error) => console.error("Gagal ambil data category:", error));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <h2 className="text-2xl font-semibold text-brand-500 dark:text-white/90">
        Feedback Category Distribution
      </h2>

      <CategoryBarChart />
      <FeedbackCategoryTable categoryOptions={categoryData} />
    </div>
  );
}