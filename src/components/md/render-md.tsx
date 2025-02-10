import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css"; // 添加样式导入

const MarkdownRenderer = ({ md }: { md: string }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
