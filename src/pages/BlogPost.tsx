import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useWordPressPost } from "@/hooks/useWordPressPost";
import { WordPressContent } from "@/components/WordPressContent";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHTML } from "@/lib/sanitize";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useWordPressPost(slug || "");

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <Link to="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
              <p className="text-muted-foreground">
                The blog post you're looking for doesn't exist.
              </p>
            </div>
          )}

          {post && (
            <article>
              <header className="mb-8">
                <h1 
                  className="text-4xl font-bold mb-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.title.rendered) }}
                />
                <p className="text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </header>

              {post._embedded?.["wp:featuredmedia"]?.[0] && (
                <img
                  src={post._embedded["wp:featuredmedia"][0].source_url}
                  alt={post._embedded["wp:featuredmedia"][0].alt_text || "Featured image"}
                  className="w-full h-96 object-cover rounded-lg mb-8"
                />
              )}

              <WordPressContent content={post.content.rendered} />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
