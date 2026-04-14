import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />

      {/* Decorative gold line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-4 py-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left: Copy */}
        <div className="space-y-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium animate-fade-in">
            South Africa's Luxury Destination
          </p>
          <h1 className="font-serif text-6xl md:text-8xl font-light leading-[1.05] animate-slide-up">
            Live<br />
            <em className="gold-shimmer not-italic">Differently</em>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed animate-fade-in">
            Curated luxury for those who know. Beauty, fashion, tech, and home — delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-10 h-14 text-sm tracking-widest uppercase"
              onClick={() => navigate("/products")}
            >
              Explore Collection
            </Button>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-[#00B8D9] font-semibold">Payflex available</span>
              <span>— pay in 4 instalments</span>
            </div>
          </div>
        </div>

        {/* Right: Hero image */}
        <div className="relative hidden lg:block">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
              alt="Lujo Lifestyle"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Floating stat card */}
          <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-xl">
            <p className="text-2xl font-serif font-semibold">2,400+</p>
            <p className="text-xs text-muted-foreground">Happy customers</p>
          </div>
        </div>
      </div>
    </section>
  );
};
