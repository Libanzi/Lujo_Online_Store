import { useQuery } from "@tanstack/react-query";
import { fetchWordPressProduct } from "@/lib/wordpress";

export const useWordPressProduct = (slug: string) => {
  return useQuery({
    queryKey: ["wordpress-product", slug],
    queryFn: () => fetchWordPressProduct(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
