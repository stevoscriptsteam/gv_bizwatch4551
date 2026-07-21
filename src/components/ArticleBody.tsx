import ReactMarkdown from "react-markdown";

export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-prose">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
