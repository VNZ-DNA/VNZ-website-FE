import type { Block } from "@/lib/posts";

/**
 * Renders a post body — the block array from `src/lib/posts.ts`.
 *
 * WHY A SWITCH AND NOT MARKDOWN. The content model is a small closed union, so
 * this function is TOTAL: every block type has a case, TypeScript fails the build
 * if a new one is added without a branch here, and no post can inject markup that
 * breaks the page. A Markdown pipeline would buy arbitrary formatting nobody has
 * asked for at the cost of a dependency and a sanitiser. See the note at the top
 * of `posts.ts`.
 *
 * TYPE SIZES ARE SET FOR READING, not for the pixel-poster look the rest of the
 * site uses: `font-viet` at 1.0625–1.125rem with generous leading, and a measure
 * capped by the article column. Headings keep `font-pixel` so an article still
 * reads as this site — that is the only place the display face appears in body
 * content, and it should stay that way. A paragraph in VT323 is a paragraph
 * nobody finishes.
 */
export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h":
            return (
              <h2
                key={i}
                className="mt-10 font-pixel text-[clamp(1.3rem,2.6vw,1.85rem)] uppercase leading-tight text-ink first:mt-0"
              >
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p
                key={i}
                className="mt-5 font-viet text-[1.0625rem] font-light leading-[1.85] text-ink-soft first:mt-0 sm:text-lg"
              >
                {block.text}
              </p>
            );

          case "list":
            return (
              <ul key={i} className="mt-5 flex flex-col gap-3">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 font-viet text-[1.0625rem] font-light leading-[1.75] text-ink-soft sm:text-lg"
                  >
                    <span aria-hidden className="mt-[6px] shrink-0 tint-text">
                      ▸
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            );

          case "quote":
            return (
              <blockquote
                key={i}
                className="mt-8 border-l-[3px] border-[color:var(--tint)] pl-5 sm:pl-6"
              >
                <p className="font-pixel text-[clamp(1.15rem,2.4vw,1.65rem)] uppercase leading-snug text-ink">
                  {block.text}
                </p>
              </blockquote>
            );

          case "note":
            /* An editor's aside, not part of the argument — smaller, boxed, and
               visually outside the prose so it can't be mistaken for the next
               paragraph. */
            return (
              <aside
                key={i}
                className="mt-8 border border-ink/15 paper-card p-4 font-viet text-sm font-light leading-relaxed text-ink-soft"
              >
                {block.text}
              </aside>
            );
        }
      })}
    </div>
  );
}
