import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, ExternalLink } from 'lucide-react';

const YUNXIA_SHARE_PREFIX = 'https://yxq.lovable.app/share/';

/**
 * 将文本中的链接转换为特殊格式：
 * - yxq.lovable.app/share/ 开头的链接变成"云霞区文件"按钮
 * - 其他链接变成蓝色可点击链接
 */
export function transformLinks(content: string): React.ReactNode[] {
  // 匹配所有 URL
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = urlRegex.exec(content)) !== null) {
    // 添加链接前的文本
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const url = match[0];
    
    if (url.startsWith(YUNXIA_SHARE_PREFIX)) {
      // 云霞区文件链接 - 转为按钮
      parts.push(
        <a
          key={`yunxia-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg no-underline"
        >
          <FileDown className="w-4 h-4" />
          云霞区文件
        </a>
      );
    } else {
      // 普通链接 - 蓝色可点击
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + url.length;
  }

  // 添加最后剩余的文本
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

/**
 * 用于在评论中渲染带链接转换的内容
 */
export function CommentContent({ content }: { content: string }) {
  const transformedContent = transformLinks(content);
  
  return (
    <span className="whitespace-pre-wrap break-words">
      {transformedContent}
    </span>
  );
}

/**
 * 处理 HTML 内容中的链接（用于文章内容）
 * 返回处理后的 HTML 字符串
 */
export function transformHtmlLinks(html: string): string {
  // 匹配不在已有 <a> 标签内的 URL
  // 首先找出所有链接，然后处理
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  
  // 创建一个临时 DOM 来解析 HTML
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // 获取所有文本节点
  const walker = document.createTreeWalker(
    div,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    // 跳过已经在 <a> 标签内的文本
    if (!isInsideAnchor(node)) {
      textNodes.push(node);
    }
  }
  
  // 替换文本节点中的链接
  textNodes.forEach(textNode => {
    const text = textNode.textContent || '';
    if (!urlRegex.test(text)) return;
    
    // 重置 regex
    urlRegex.lastIndex = 0;
    
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = urlRegex.exec(text)) !== null) {
      // 添加链接前的文本
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      
      const url = match[0];
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      
      if (url.startsWith(YUNXIA_SHARE_PREFIX)) {
        // 云霞区文件按钮样式
        anchor.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg no-underline';
        anchor.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>云霞区文件`;
      } else {
        // 普通链接蓝色样式
        anchor.className = 'text-blue-500 hover:text-blue-600 hover:underline transition-colors';
        anchor.textContent = url;
      }
      
      fragment.appendChild(anchor);
      lastIndex = match.index + url.length;
    }
    
    // 添加剩余文本
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
    if (parent.nodeName.toLowerCase() === 'a') {
      return true;
    }
    parent = parent.parentNode;
  }
  return false;
}
