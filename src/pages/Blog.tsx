import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWordPressPosts } from "@/hooks/useWordPressPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { sanitizeHTML } from "@/lib/sanitize";

const Blog = () => {
  const { data: posts, isLoading, error } = useWordPressPosts(1, 12);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4">
          <h1 className="text-4xl font-bold mb-8">Blog</h1>
          
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Unable to Load Blog Posts</h2>
              <p className="text-muted-foreground">
                Please check your WordPress configuration in src/lib/wordpress.ts
              </p>
            </div>
          )}

          {posts && posts.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {post._embedded?.["wp:featuredmedia"]?.[0] && (
                      <img 
                        src={post._embedded["wp:featuredmedia"][0].source_url} 
                        alt={post._embedded["wp:featuredmedia"][0].alt_text || "Post thumbnail"}
                        className="w-full h-48 object-cover" 
                      />
                    )}
                    <CardHeader>
                      <CardTitle dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.title.rendered) }} />
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-muted-foreground line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.excerpt.rendered) }}
                      />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
