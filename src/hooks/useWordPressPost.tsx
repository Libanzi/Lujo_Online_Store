import { useQuery } from "@tanstack/react-query";
import { fetchWordPressPost } from "@/lib/wordpress";

export const useWordPressPost = (slug: string) => {
  return useQuery({
    queryKey: ["wordpress-post", slug],
    queryFn: () => fetchWordPressPost(slug),
    enabled: !!slug,
  });
};
