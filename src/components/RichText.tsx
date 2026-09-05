import { Fragment } from "react";

/**
 * 内容模块里用 `**…**` 标记需要强调的事实（名次、奖项、否定性边界）。
 * 这里只支持这一种标记，避免为了排版引入 Markdown 依赖。
 */
export function RichText({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {segments.map((segment, index) =>
        segment.startsWith("**") && segment.endsWith("**") ? (
          <strong key={index}>{segment.slice(2, -2)}</strong>
        ) : (
          <Fragment key={index}>{segment}</Fragment>
        ),
      )}
    </>
  );
}
