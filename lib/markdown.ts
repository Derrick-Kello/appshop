/**
 * A deliberately small Markdown subset for release notes and app descriptions.
 *
 * Both are publisher-supplied, so the input is escaped before any rule runs and
 * no raw HTML ever survives. That rules out a general-purpose renderer, which
 * is the point: the store needs headings, lists, links, code and emphasis, and
 * nothing that can carry script.
 */

function escapeHtml(input: string): string {
  return input
    // Stripped first so the code-span sentinel below can never collide with
    // anything that came in from the publisher.
    .replace(/[\u0000-\u0008\u000b-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(trimmed)) return trimmed;
  return null;
}

/**
 * Code spans are lifted out before the emphasis and link rules run, then put
 * back afterwards, so backticked text is never reinterpreted. The sentinel uses
 * characters the escape pass has already removed from the input.
 */
const CODE_OPEN = "\u0000";
const CODE_CLOSE = "\u0001";

function inline(text: string): string {
  const spans: string[] = [];

  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code: string) => {
    spans.push(code);
    return `${CODE_OPEN}${spans.length - 1}${CODE_CLOSE}`;
  });

  out = out
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, alt: string, url: string) => {
      const href = safeUrl(url);
      return href
        ? `<img src="${href}" alt="${alt}" loading="lazy" class="my-6 max-w-full rounded-xl border border-line" />`
        : alt;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, url: string) => {
      const href = safeUrl(url);
      return href
        ? `<a href="${href}" rel="nofollow noopener noreferrer" target="_blank" class="text-brand underline decoration-brand-line underline-offset-2 transition-colors hover:decoration-brand">${label}</a>`
        : label;
    })
    // Bare URLs, once the bracketed forms above have had their turn. Release
    // notes are full of them.
    .replace(
      /(^|[\s(])(https?:\/\/[^\s<>"')\]]+)/g,
      (_match, lead: string, url: string) =>
        `${lead}<a href="${url}" rel="nofollow noopener noreferrer" target="_blank" class="break-all text-brand underline decoration-brand-line underline-offset-2 transition-colors hover:decoration-brand">${url.replace(/^https?:\/\//, "")}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, '<del class="text-faint">$1</del>');

  return out.replace(
    new RegExp(`${CODE_OPEN}(\\d+)${CODE_CLOSE}`, "g"),
    (_match, index: string) =>
      `<code class="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.86em] text-ink-2">${spans[Number(index)]}</code>`,
  );
}

export function renderMarkdown(source: string): string {
  if (!source) return "";

  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let inCode = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p class="my-5 text-[16px] leading-8">${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      flushParagraph();
      closeList();
      out.push(
        inCode
          ? "</code></pre>"
          : '<pre class="my-6 overflow-x-auto rounded-xl bg-surface p-5 text-[14px]"><code class="font-mono text-ink-2">',
      );
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      out.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const depth = heading[1].length;
      const level = Math.min(depth + 1, 6);
      const size = ["text-[24px]", "text-[20px]", "text-[17px]", "text-[17px]"][depth - 1];
      out.push(
        `<h${level} class="mt-10 mb-3 ${size} font-semibold tracking-tight text-ink">${inline(heading[2])}</h${level}>`,
      );
      continue;
    }

    if (/^\s*([-*+])\s+/.test(line)) {
      flushParagraph();
      if (list !== "ul") {
        closeList();
        out.push('<ul class="my-5 list-disc space-y-2 pl-5 marker:text-ghost">');
        list = "ul";
      }
      out.push(`<li class="text-[16px] leading-8">${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushParagraph();
      if (list !== "ol") {
        closeList();
        out.push('<ol class="my-5 list-decimal space-y-2 pl-5 marker:text-ghost">');
        list = "ol";
      }
      out.push(`<li class="text-[16px] leading-8">${inline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      closeList();
      out.push(
        `<blockquote class="my-6 border-l-2 border-brand-line pl-5 text-[16px] leading-8 text-muted">${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`,
      );
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      closeList();
      out.push('<hr class="my-10 border-line" />');
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  if (inCode) out.push("</code></pre>");

  return out.join("");
}

/** Plain-text opening of a description, for cards and meta descriptions. */
export function excerpt(source: string, limit = 180): string {
  const plain = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > limit ? `${plain.slice(0, limit).trimEnd()}…` : plain;
}
