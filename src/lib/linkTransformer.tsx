import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * 处理 HTML 内容中的链接（用于文章内容）
 * 所有链接都变成"点击前往外部网站"按钮
 */
export function transformHtmlLinks(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  // Find all <a> tags and style them as buttons
  const anchors = div.querySelectorAll('a[href]');
  anchors.forEach(anchor => {
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;

    anchor.className = 'inline-flex items-center gap-1.5 px-4 py-2 my-1 rounded-lg bg-gradient-to-r from-primary/90 to-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-md no-underline cursor-pointer';
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
    anchor.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>点击前往外部网站`;
  });

  // Also convert plain-text URLs not inside <a> tags
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null);

  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    if (!isInsideAnchor(node)) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(textNode => {
    const text = textNode.textContent || '';
    if (!urlRegex.test(text)) return;
    urlRegex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const url = match[0];
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'inline-flex items-center gap-1.5 px-4 py-2 my-1 rounded-lg bg-gradient-to-r from-primary/90 to-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm hover:shadow-md no-underline cursor-pointer';
      a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>点击前往外部网站`;

      fragment.appendChild(a);
      lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  return div.innerHTML;
}

function isInsideAnchor(node: Node): boolean {
  let parent = node.parentNode;
  while (parent) {
    if (parent.nodeName.toLowerCase() === 'a') return true;
    parent = parent.parentNode;
  }
  return false;
}

/**
 * 用于在评论中渲染带链接转换的内容
 */
export function CommentContent({ content }: { content: string }) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = urlRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const url = match[0];
    parts.push(
      <a
        key={`link-${keyIndex++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1 my-0.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all no-underline"
      >
        <ExternalLink className="w-3 h-3" />
        点击前往外部网站
      </a>
    );

    lastIndex = match.index + url.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.length > 0 ? parts : content}
    </span>
  );
}
