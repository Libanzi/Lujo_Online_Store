import { useQuery } from "@tanstack/react-query";
import { fetchWordPressPosts } from "@/lib/wordpress";

export const useWordPressPosts = (page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ["wordpress-posts", page, perPage],
    queryFn: () => fetchWordPressPosts(page, perPage),
  });
};
