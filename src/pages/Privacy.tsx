import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including your name, email address, 
                shipping address, and payment information when you make a purchase.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send you order confirmations and shipping updates</li>
                <li>Respond to your questions and provide customer service</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Improve our products and services</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share your information with service 
                providers who help us operate our business, such as payment processors and shipping companies.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. Contact us 
                at privacy@lujo.com to exercise these rights.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at privacy@lujo.com
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
