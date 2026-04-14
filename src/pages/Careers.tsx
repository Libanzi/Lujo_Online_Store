import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

const Careers = () => {
  const positions = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "New York, NY",
      type: "Full-time"
    },
    {
      title: "Customer Success Manager",
      department: "Support",
      location: "Remote",
      type: "Full-time"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--luxury-gold))]" />
            <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
            <p className="text-lg text-muted-foreground">
              Be part of a team that's redefining affordable luxury
            </p>
          </div>
          
          <div className="space-y-6">
            {positions.map((position, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{position.title}</CardTitle>
                      <p className="text-muted-foreground">{position.department}</p>
                    </div>
                    <Button className="bg-[hsl(var(--luxury-gold))] hover:bg-[hsl(var(--luxury-champagne))] text-primary">
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{position.location}</span>
                    <span>•</span>
                    <span>{position.type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
