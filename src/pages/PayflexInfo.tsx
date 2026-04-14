import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PayflexInfo() {
  const faqs = [
    {
      question: "What is Payflex?",
      answer: "Payflex is South Africa's leading Buy Now Pay Later (BNPL) service. It lets you split your purchase into 4 equal, interest-free instalments over 6 weeks."
    },
    {
      question: "Are there any fees or interest?",
      answer: "No. Payflex charges zero interest and zero fees when you pay on time. You only pay the purchase price, split into 4 equal parts."
    },
    {
      question: "What are the minimum and maximum order amounts?",
      answer: "Payflex is available for orders between R100 and R24,000."
    },
    {
      question: "How does approval work?",
      answer: "Payflex performs an instant credit check when you select it at checkout. Approval is typically instant and based on your credit profile."
    },
    {
      question: "When do I make my payments?",
      answer: "Your first payment (25%) is due at checkout. The remaining 3 payments are automatically deducted every 2 weeks over 6 weeks."
    },
    {
      question: "What happens if I miss a payment?",
      answer: "Late fees may apply if you miss a payment. Payflex will notify you before each payment is due. Contact Payflex directly for payment support."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto py-16 max-w-2xl px-4">
          <h1 className="font-serif text-4xl mb-4">Shop Now, Pay Later with Payflex</h1>
          <p className="text-muted-foreground mb-8">
            Lujo Lifestyle Hub has partnered with Payflex to give you flexible payment options on every purchase.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              'Choose Payflex at checkout',
              'Get instant approval',
              'Pay 25% today',
              'Pay the rest over 6 weeks'
            ].map((step, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-muted">
                <div className="w-10 h-10 rounded-full bg-[#00B8D9] text-white font-bold text-lg flex items-center justify-center mx-auto mb-2">
                  {i + 1}
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#00B8D9]/10 border border-[#00B8D9]/20 p-6 mb-12">
            <h3 className="text-lg font-semibold text-[#00B8D9] mb-2">Example: R2,000 purchase</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[0, 2, 4, 6].map((weeks, i) => (
                <div key={i} className="bg-white dark:bg-background rounded-lg p-3 border border-[#00B8D9]/20">
                  <p className="text-xs text-muted-foreground">{i === 0 ? 'Today' : `Week ${weeks}`}</p>
                  <p className="font-bold text-lg">R500</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              No interest - No fees - Subject to Payflex approval
            </p>
          </div>

          <h2 className="font-serif text-2xl mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
