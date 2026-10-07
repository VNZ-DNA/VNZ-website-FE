import type { L, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Tin tức & bài viết — drives `/tin-tuc` and each `/tin-tuc/<slug>`.
 *
 * ── READ THIS BEFORE ADDING A POST ──────────────────────────────────────────
 *
 * TWO THINGS HERE NEED CONFIRMING BY A HUMAN, and they are the only invented
 * values in the file:
 *
 *   1. `date` on every post. A publish date is a factual claim and there was no
 *      editorial history in this repo to take one from. The dates below are
 *      PLACEHOLDERS — replace them with the real ones before the site goes
 *      public, or the archive says these were written on days nothing happened.
 *   2. Nothing else. Every sentence of body copy is drawn from material already
 *      in the repo (`story.ts`, the Câu chuyện act, `products.ts`, `careers.ts`)
 *      rather than written as new claims about VNZ, so no post asserts an event,
 *      a partnership, a milestone or a number that isn't already established
 *      somewhere in this codebase. Keep it that way: a company blog is the
 *      easiest place on a site to accidentally publish something untrue.
 *
 * `author` is the ORGANISATION, not a person. Inventing bylines would mean
 * putting real-sounding names on writing nobody wrote. Set a real name when a
 * real person writes one.
 *
 * ── CONTENT MODEL ───────────────────────────────────────────────────────────
 *
 * Bodies are an array of typed blocks rather than a Markdown or MDX string. That
 * is a deliberate trade: MDX would mean a build-time dependency (`@next/mdx`, a
 * remark/rehype chain) and arbitrary JSX inside content, for a blog that renders
 * five block types. Blocks keep the renderer total — every case is handled, and a
 * post cannot break the page layout. Swap to MDX when an author needs embedded
 * components, not before.
 *
 * NO COVER IMAGES. There is no art for these posts and a stock photo would be
 * the only thing on the site that isn't the company's own work; the cards use a
 * tinted pattern keyed off `tint` instead. Add a real `cover` field when there is
 * real art to put in it.
 *
 * Same conventions as the other data modules: `tint` is a palette token from the
 * `@theme` block in globals.css, and all copy is Vietnamese rendered in
 * `font-viet` / `font-pixel` — never `font-display` / `font-ui`, which ship no
 * diacritics.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "note"; text: string };

export type Post = {
  slug: string;
  title: L;
  /** Card + meta description. One or two sentences. */
  excerpt: L;
  category: L;
  /** ISO date. PLACEHOLDER — see the file header. */
  date: string;
  /** The organisation, not a person — see the file header. Same in both. */
  author: string;
  tint: string;
  /**
   * THE WHOLE BODY IS TRANSLATED AS A UNIT — `L<Block[]>`, not a per-block `L`.
   *
   * An article is not a table of interchangeable sentences. A translator needs
   * to be able to split one Vietnamese paragraph into two English ones, or fold
   * a heading into the paragraph under it, and a per-block `L` would force the
   * two languages to keep identical structure forever. This way each language
   * has its own block list and the only invariant is that both exist — which the
   * type still enforces.
   */
  body: L<Block[]>;
};

export const POSTS: Post[] = [
  {
    slug: "tao-ra-cong-nghe-khong-phai-so-huu-cong-nghe",
    title: {
      vi: "Tạo ra công nghệ không đồng nghĩa với sở hữu công nghệ",
      en: "Building technology is not the same as owning it",
    },
    excerpt: {
      vi: "Việt Nam có hàng triệu kỹ sư giỏi và là nơi gia công cho nhiều sản phẩm lớn của thế giới. Nhưng gia công và sở hữu là hai chuyện khác nhau — và khoảng cách giữa chúng là lý do VNZ ra đời.",
      en: "Vietnam has millions of capable engineers and builds parts of many of the world's biggest products. But building for others and owning something are two different things — and the gap between them is why VNZ exists.",
    },
    category: { vi: "Góc nhìn", en: "Perspective" },
    date: "2026-03-12",
    author: "VNZ",
    tint: "var(--color-ember)",
    body: {
      vi: [
        {
          type: "p",
          text: "Một quốc gia có thể sở hữu hàng triệu kỹ sư tài năng. Nhưng chỉ khi tạo ra những sản phẩm, nền tảng và giải pháp của riêng mình, quốc gia đó mới thực sự để lại dấu ấn trên bản đồ công nghệ thế giới.",
        },
        {
          type: "p",
          text: "Đó là sự thật đầu tiên chúng tôi phải đối diện khi ngồi lại với nhau. Người Việt đã và đang xây dựng công nghệ cho thế giới — chỉ là dưới tên của người khác.",
        },
        { type: "h", text: "Câu hỏi ở giữa" },
        {
          type: "quote",
          text: "Nếu người Việt đủ năng lực xây dựng công nghệ cho thế giới, tại sao chưa có dấu ấn Việt Nam?",
        },
        {
          type: "p",
          text: "Câu hỏi này không có ý trách ai. Gia công là một con đường hợp lý và đã nuôi sống cả một thế hệ kỹ sư. Nhưng nó là con đường học nghề, không phải con đường ghi tên.",
        },
        { type: "h", text: "Những dấu ấn chúng tôi nhìn vào" },
        {
          type: "p",
          text: "Để biết một dấu ấn công nghệ thực sự trông như thế nào, chúng tôi nhìn sang những cái tên đã làm được:",
        },
        {
          type: "list",
          items: [
            "Google — cánh cửa dẫn tới tri thức của cả nhân loại, hàng tỷ lượt tra cứu mỗi ngày.",
            "Apple — khoảng hai mươi năm định hình cách con người chạm vào công nghệ.",
            "Samsung — công nghệ của một quốc gia hiện diện ở 74 quốc gia khác.",
            "WeChat — một nền tảng trở thành thứ không thể thiếu trong đời sống thường ngày.",
          ],
        },
        {
          type: "p",
          text: "Không phải để so sánh. Mà để biết còn bao xa, và để hiểu rằng khoảng cách đó được lấp bằng sản phẩm chứ không bằng khẩu hiệu.",
        },
        { type: "h", text: "Và cái tên" },
        {
          type: "p",
          text: "Vietnam Z-DNA Technology — DNA của một thế hệ người Việt lớn lên trong thời đại số, mang trong mình khát vọng làm chủ công nghệ, tạo ra giá trị bằng công nghệ và ghi dấu ấn của riêng mình trên bản đồ công nghệ thế giới.",
        },
        {
          type: "note",
          text: "Đây là bài mở đầu cho chuỗi bài về con đường VNZ chọn. Toàn bộ câu chuyện có trên trang chủ.",
        },
      ],
      en: [
        {
          type: "p",
          text: "A country can have millions of talented engineers. But only when it builds products, platforms and solutions of its own does it truly leave a mark on the world's technology map.",
        },
        {
          type: "p",
          text: "That was the first thing we had to face when we sat down together. Vietnamese engineers have been building technology for the world for years — just under someone else's name.",
        },
        { type: "h", text: "The question in the middle" },
        {
          type: "quote",
          text: "If Vietnamese engineers are good enough to build technology for the world, why is there still no Vietnamese mark?",
        },
        {
          type: "p",
          text: "The question is not an accusation. Outsourced work is a reasonable path and it has supported an entire generation of engineers. But it is the path of learning a trade, not the path of putting your name on something.",
        },
        { type: "h", text: "The marks we look up to" },
        {
          type: "p",
          text: "To understand what a real mark in technology looks like, we look at the names that have made one:",
        },
        {
          type: "list",
          items: [
            "Google — the door to humanity's knowledge, billions of searches a day.",
            "Apple — roughly two decades shaping how people touch technology.",
            "Samsung — one country's technology present in 74 others.",
            "WeChat — a platform that became inseparable from daily life.",
          ],
        },
        {
          type: "p",
          text: "Not to compare ourselves. To understand how far there is to go, and that the distance gets closed with products rather than slogans.",
        },
        { type: "h", text: "And the name" },
        {
          type: "p",
          text: "Vietnam Z-DNA Technology — the DNA of a Vietnamese generation raised in the digital age, carrying the ambition to master technology, create value with it, and leave a mark of their own on the world's technology map.",
        },
        {
          type: "note",
          text: "This is the first in a series about the road VNZ has chosen. The full story is on the homepage.",
        },
      ],
    },
  },
  {
    slug: "taskcoper-ban-chinh-thuc",
    title: {
      vi: "TaskCoper: biến mớ công việc hỗn độn thành một hành trình rõ ràng",
      en: "TaskCoper: turning a tangle of work into a clear path",
    },
    excerpt: {
      vi: "Sản phẩm quản lý công việc của VNZ đã có bản chính thức — lập kế hoạch, chia nhỏ nhiệm vụ và theo dõi tiến độ của cả nhóm trong cùng một không gian.",
      en: "VNZ's work-management product is generally available — plan the work, break it into tasks, and follow the whole team's progress in one space.",
    },
    category: { vi: "Sản phẩm", en: "Product" },
    date: "2026-05-20",
    author: "VNZ",
    tint: "var(--color-azure)",
    body: {
      vi: [
        {
          type: "p",
          text: "TaskCoper biến mớ công việc hỗn độn thành một hành trình rõ ràng — lập kế hoạch, chia nhỏ nhiệm vụ và theo dõi tiến độ của cả nhóm trong cùng một không gian duy nhất.",
        },
        { type: "h", text: "Những gì TaskCoper làm được" },
        {
          type: "list",
          items: [
            "Quản lý nhiệm vụ và dự án một cách trực quan.",
            "Cộng tác nhóm theo thời gian thực.",
            "Theo dõi tiến độ bằng bảng và biểu đồ.",
            "Nhắc việc thông minh, không bỏ lỡ deadline.",
          ],
        },
        { type: "h", text: "Vì sao chúng tôi làm sản phẩm này trước" },
        {
          type: "p",
          text: "Một đội ngũ mới cần chứng minh bằng thứ dùng được, không phải bằng bản kế hoạch. Công cụ quản lý công việc là bài toán chúng tôi hiểu rõ nhất, vì chính chúng tôi là người dùng đầu tiên của nó mỗi ngày.",
        },
        {
          type: "p",
          text: "Đó cũng là cách chúng tôi kiểm tra nguyên tắc của mình: không chạy theo công nghệ vì công nghệ, mà chọn công nghệ phù hợp để tạo ra giá trị thật.",
        },
        {
          type: "note",
          text: "TaskCoper đang ở bản chính thức và có thể dùng thử. StylaiBox — sản phẩm tiếp theo — vẫn đang được kiến tạo.",
        },
      ],
      en: [
        {
          type: "p",
          text: "TaskCoper turns a tangle of work into a clear path — plan it, break it into tasks, and follow the whole team's progress in a single space.",
        },
        { type: "h", text: "What TaskCoper does" },
        {
          type: "list",
          items: [
            "Visual task and project management.",
            "Real-time collaboration across the team.",
            "Progress tracked with boards and charts.",
            "Smart reminders, so deadlines don't slip.",
          ],
        },
        { type: "h", text: "Why we built this one first" },
        {
          type: "p",
          text: "A new team has to prove itself with something usable, not with a plan. Work management is the problem we understand best, because we are its first users every day.",
        },
        {
          type: "p",
          text: "It is also how we test our own principle: don't chase technology for its own sake — pick the technology that creates real value.",
        },
        {
          type: "note",
          text: "TaskCoper is generally available and open to try. StylaiBox — the next product — is still being built.",
        },
      ],
    },
  },
  {
    slug: "mo-5-chi-tieu-thuc-tap",
    title: {
      vi: "VNZ mở 5 chỉ tiêu thực tập cho ba vị trí đầu tiên",
      en: "VNZ opens 5 internship places across its first three roles",
    },
    excerpt: {
      vi: "Backend (.NET), Frontend (React) và PM/BA — ba vị trí, năm chỉ tiêu, làm trên sản phẩm đang chạy thật cùng mentor đồng hành.",
      en: "Backend (.NET), Frontend (React) and PM/BA — three roles, five places, working on live products with a mentor alongside you.",
    },
    category: { vi: "Tuyển dụng", en: "Careers" },
    date: "2026-07-08",
    author: "VNZ",
    tint: "var(--color-jade)",
    body: {
      vi: [
        {
          type: "p",
          text: "VNZ đang ở chương đầu tiên, và chúng tôi mở ba vị trí thực tập với tổng cộng năm chỉ tiêu. Đây là những vị trí làm việc trực tiếp trên sản phẩm đang chạy thật, không phải dự án mô phỏng để chấm điểm.",
        },
        { type: "h", text: "Ba vị trí" },
        {
          type: "list",
          items: [
            "Thực tập sinh Backend (.NET) — 2 chỉ tiêu. Xây dựng API và dịch vụ phía sau sản phẩm.",
            "Thực tập sinh Frontend (React) — 2 chỉ tiêu. Biến thiết kế thành giao diện chạy được trên mọi màn hình.",
            "Thực tập sinh PM / BA — 1 chỉ tiêu. Đứng giữa nhu cầu người dùng và đội phát triển.",
          ],
        },
        { type: "h", text: "Điều chúng tôi có thể hứa" },
        {
          type: "p",
          text: "Một đội ngũ không có tầng nấc, nơi bạn nói chuyện trực tiếp với người ra quyết định. Một mentor đồng hành và phản hồi định kỳ. Và công việc trên sản phẩm có người dùng thật — thứ mà một kỳ thực tập hiếm khi cho bạn.",
        },
        {
          type: "p",
          text: "Điều chúng tôi không hứa: một chức danh oách. Đây là thực tập, và thứ chúng tôi trao đi là kinh nghiệm thật cùng một đường đi tiếp sau kỳ thực tập.",
        },
        {
          type: "note",
          text: "Chi tiết từng vị trí, quyền lợi và quy trình ứng tuyển có trên trang Tuyển dụng.",
        },
      ],
      en: [
        {
          type: "p",
          text: "VNZ is in its first chapter, and we are opening three internship roles with five places in total. These are positions working directly on products that are already live, not simulated projects built to be graded.",
        },
        { type: "h", text: "The three roles" },
        {
          type: "list",
          items: [
            "Backend Engineering Intern (.NET) — 2 places. Build the APIs and services behind the products.",
            "Frontend Engineering Intern (React) — 2 places. Turn designs into interfaces that work on every screen.",
            "Product / Business Analyst Intern — 1 place. Stand between what users need and what the team builds.",
          ],
        },
        { type: "h", text: "What we can promise" },
        {
          type: "p",
          text: "A team with no layers, where you talk directly to the people making the decisions. A mentor alongside you and regular feedback. And work on a product with real users — something an internship rarely gives you.",
        },
        {
          type: "p",
          text: "What we don't promise: an impressive title. This is an internship, and what we are offering is real experience plus somewhere to go when it ends.",
        },
        {
          type: "note",
          text: "Details for each role, the benefits and the hiring process are on the Careers page.",
        },
      ],
    },
  },
];

export function postBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first. Derived, so the data file can stay in any order. */
export function sortedPosts() {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Reading time, DERIVED from the body rather than typed into the data — a
 * hand-written "5 phút đọc" goes stale the moment a paragraph is edited, and
 * nobody remembers to update it.
 *
 * IT IS MEASURED PER LANGUAGE. English and Vietnamese renderings of the same
 * article do not have the same word count, and the two bodies are allowed to
 * differ in structure entirely (see the `body` note above) — so a figure computed
 * from one and shown on the other would simply be wrong.
 *
 * 200 wpm suits both languages closely enough for a rounded estimate; the result
 * is rounded up so a short post reads "1 phút" rather than "0 phút".
 */
export function readingMinutes(post: Post, locale: Locale) {
  const words = t(post.body, locale).reduce((n, b) => {
    const text =
      b.type === "list" ? b.items.join(" ") : (b as { text: string }).text;
    return n + text.trim().split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Localized date. Formatting lives here so the list and the article can never
 * disagree about how a date looks.
 *
 * THE TWO LOCALES USE DIFFERENT FORMATS ON PURPOSE, not just different month
 * names: `08/03/2026` is the 8th of March to a Vietnamese reader and the 3rd of
 * August to an American one. The English form spells the month out so it cannot
 * be misread — an ambiguous date on a news article is worse than a long one.
 */
export function formatDate(iso: string, locale: Locale) {
  const date = new Date(`${iso}T00:00:00Z`);
  return locale === "vi"
    ? date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
}
