import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { WordPressContent } from "@/components/WordPressContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { sanitizeHTML } from "@/lib/sanitize";
import { useQuery } from "@tanstack/react-query";
import { fetchWordPressPage } from "@/lib/wordpress";

const WordPressPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, error } = useQuery({
    queryKey: ["wordpress-page", slug],
    queryFn: () => fetchWordPressPage(slug || ""),
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <Button 
            variant="ghost" 
            className="mb-8"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist.
              </p>
            </div>
          )}

          {page && (
            <article>
              <header className="mb-8">
                <h1 
                  className="text-4xl font-bold mb-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(page.title.rendered) }}
                />
              </header>

              <WordPressContent content={page.content.rendered} />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WordPressPage;
