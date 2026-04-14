import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string;
}

export const CategoryShowcase = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .limit(4);
    
    if (data) setCategories(data);
  };

  return (
    <section className="py-20 px-4">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
          <p className="text-muted-foreground text-lg">Discover our curated collections</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="group relative overflow-hidden cursor-pointer border-0 shadow-[var(--shadow-luxury)] hover:shadow-[var(--shadow-gold-glow)] transition-all duration-500"
              onClick={() => navigate(`/category/${category.slug}`)}
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img 
                  src={category.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8"} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                  <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-primary-foreground/80">{category.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
