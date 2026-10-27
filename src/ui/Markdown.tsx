import { Marked } from 'marked';
import { useMemo } from 'preact/hooks';

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Raw HTML in drill text is shown as text, so drills shared by others can't inject markup.
const md = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escape(text),
    link({ href, tokens }) {
      const safe = /^https?:/i.test(href) ? href : '#';
      return `<a href="${escape(safe)}" target="_blank" rel="noopener">${this.parser.parseInline(tokens)}</a>`;
    },
    table(token) {
      const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
      const body = token.rows
        .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`)
        .join('');
      return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    },
  },
});

export function Markdown({ text }: { text: string }) {
  const html = useMemo(() => md.parse(text, { async: false }) as string, [text]);
  return <div class="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
