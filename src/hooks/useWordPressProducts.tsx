import { useQuery } from "@tanstack/react-query";
import { fetchWordPressProducts } from "@/lib/wordpress";

export const useWordPressProducts = (page = 1, perPage = 12, category?: string) => {
  return useQuery({
    queryKey: ["wordpress-products", page, perPage, category],
    queryFn: () => fetchWordPressProducts(page, perPage, category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
