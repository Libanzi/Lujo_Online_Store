import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 py-16">
        <div className="container px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long does shipping take?</AccordionTrigger>
              <AccordionContent>
                Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business days, and overnight shipping delivers the next business day.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                We accept returns within 30 days of delivery. Items must be unused and in original packaging. Returns are free and refunds are processed within 5-7 business days.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                Yes, we ship to most countries worldwide. International shipping times vary by destination, typically 7-14 business days.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>How can I track my order?</AccordionTrigger>
              <AccordionContent>
                Once your order ships, you'll receive a tracking number via email. You can also track your order by visiting the Track Order page and entering your order number.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Is my personal information secure?</AccordionTrigger>
              <AccordionContent>
                Yes, we use industry-standard SSL encryption to protect your personal and payment information. We never store your credit card details on our servers.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
