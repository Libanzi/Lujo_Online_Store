import { sanitizeHTML } from "@/lib/sanitize";

interface WordPressContentProps {
  content: string;
}

export const WordPressContent = ({ content }: WordPressContentProps) => {
  const sanitizedContent = sanitizeHTML(content);
  
  return (
    <div 
      className="prose prose-lg max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
