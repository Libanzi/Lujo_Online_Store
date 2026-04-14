import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using this website, you accept and agree to be bound by the terms and 
                provision of this agreement.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials on LUJO's website 
                for personal, non-commercial transitory viewing only.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
              <p>
                The materials on LUJO's website are provided on an 'as is' basis. LUJO makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including, 
                without limitation, implied warranties or conditions of merchantability, fitness for a 
                particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
              <p>
                In no event shall LUJO or its suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit, or due to business interruption) arising 
                out of the use or inability to use the materials on LUJO's website.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Accuracy of Materials</h2>
              <p>
                The materials appearing on LUJO's website could include technical, typographical, or 
                photographic errors. LUJO does not warrant that any of the materials on its website are 
                accurate, complete or current.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws and 
                you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
