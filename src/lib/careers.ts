import type { L } from "@/lib/i18n";

/**
 * Recruitment data — drives `/tuyen-dung` and each `/tuyen-dung/<slug>` detail
 * page. Edit copy here, not in the components.
 *
 * THE JRPG FRAMING IS GONE. Every role used to be a playable "class": a `klass`
 * name ("Backend Guardian"), a `sigil` monogram drawn big on a card, and a
 * `stats` block of NES-style meters that the file itself admitted were "flavour,
 * not literal metrics". It read well as part of the homepage story and badly as
 * the thing a final-year student sends to their parents. A careers page has one
 * job — let someone decide whether to apply — and invented attribute bars next to
 * a real job title actively work against it. `klass`, `sigil` and `stats` are
 * deleted rather than kept: unlike `story.ts`, none of it was copy worth keeping.
 *
 * WHAT REPLACED THEM is what a job listing actually needs: `department`,
 * `employment`, `level`, `slots`, and the optional `location` / `salary` /
 * `deadline` below.
 *
 * `tint` STAYS. It is the site-wide theming hook (a palette token from the
 * `@theme` block in globals.css, consumed as `--tint`), not part of the game
 * framing — here it only tints a department badge and an accent rule.
 *
 * ── BILINGUAL ───────────────────────────────────────────────────────────────
 * Prose fields are `L`, so BOTH languages are required and a half-translated role
 * fails the build. `level`, `stack` and `tint` stay plain strings: they are ASCII
 * identifiers that read identically in either language, and duplicating "Intern"
 * into `{ vi: "Intern", en: "Intern" }` would be noise that still has to be kept
 * in sync.
 *
 * Vietnamese renders in `font-viet` / `font-pixel`, both of which ship the
 * Vietnamese subset. Never route it through `font-display` / `font-ui` — those
 * pixel faces have no diacritics.
 *
 * THE ENGLISH IS A TRANSLATION, not approved copy — Vietnamese is the source of
 * truth. Have someone read the English job ads before they go out; a mistranslated
 * requirement costs a candidate.
 */

export type Role = {
  slug: string;
  /** Real job title. */
  role: L;
  /** Team the role sits in — the list groups and labels by this. */
  department: L;
  /** Employment type, e.g. "Thực tập" / "Internship". */
  employment: L;
  /** Seniority, e.g. "Intern" / "Junior". ASCII, identical in both languages. */
  level: string;
  /** Open headcount. */
  slots: number;
  /** CSS palette-token reference, e.g. "var(--color-jade)". */
  tint: string;
  /** One-line pitch shown in the list. */
  summary: L;
  /** Longer intro shown at the top of the detail page. */
  about: L;
  /** Tech / tooling tags — ASCII brand names, identical in both languages. */
  stack: string[];
  /** "Mô tả công việc" / "What you'll do". */
  duties: L<string[]>;
  /** "Yêu cầu ứng viên" / "What we're looking for". */
  requirements: L<string[]>;
  /**
   * OPTIONAL AND EMPTY BY DEFAULT, same rule as `CONTACT` in `src/lib/site.ts`:
   * the repo has no confirmed office address, salary band or closing date, and
   * each of those ships as a fact the moment it is typed. Every row that renders
   * them is conditional, so filling one in is all it takes to make it appear.
   *   location: { vi: "Tầng 5, ..., TP. Hồ Chí Minh", en: "Floor 5, ..., HCMC" }
   *   workMode: { vi: "Tại văn phòng", en: "On-site" }
   *   salary:   { vi: "Hỗ trợ 4 – 6 triệu/tháng", en: "VND 4–6M/month stipend" }
   *   deadline: { vi: "31/12/2026", en: "31 Dec 2026" }
   */
  location?: L;
  workMode?: L;
  salary?: L;
  deadline?: L;
};

/**
 * Where applications go: `/ung-tuyen`, a form of its own.
 *
 * IT IS NOT THE CONTACT FORM. `/lien-he` briefly took applications via a
 * `?vi-tri=` prefill, and the two never fitted in one set of fields — an
 * application needs a CV link, trường/chuyên ngành and a start date, while the
 * enquiry form asks for a budget band that has no business being in front of a
 * candidate. See `src/lib/application-form.ts`.
 *
 * `?vi-tri=<slug>` preselects the role so nobody has to pick it twice. The page
 * resolves that slug against `ROLES` and ignores anything it doesn't recognise,
 * so an arbitrary string can never be reflected into the form.
 *
 * THE PATH IS LOCALE-FREE. Callers wrap it in `localePath()`, so the English
 * careers page sends applicants to `/en/ung-tuyen` rather than dropping them back
 * into Vietnamese mid-application.
 */
export const APPLY_PATH = "/ung-tuyen";

export function applyPath(slug?: string) {
  return slug ? `${APPLY_PATH}?vi-tri=${encodeURIComponent(slug)}` : APPLY_PATH;
}

export const ROLES: Role[] = [
  {
    slug: "backend-dotnet",
    role: {
      vi: "Thực tập sinh Backend (.NET)",
      en: "Backend Engineering Intern (.NET)",
    },
    department: { vi: "Kỹ thuật", en: "Engineering" },
    employment: { vi: "Thực tập", en: "Internship" },
    level: "Intern",
    slots: 2,
    tint: "var(--color-jade)",
    summary: {
      vi: "Xây dựng API và dịch vụ phía sau sản phẩm của VNZ — nơi dữ liệu được lưu, xử lý và bảo vệ.",
      en: "Build the APIs and services behind VNZ's products — where the data is stored, processed and protected.",
    },
    about: {
      vi: "Bạn sẽ làm việc trực tiếp trên hệ thống backend của các sản phẩm đang chạy thật, dưới hướng dẫn của một mentor. Công việc xoay quanh việc thiết kế API, làm việc với cơ sở dữ liệu và giữ cho dịch vụ chạy ổn định — không phải bài tập mô phỏng.",
      en: "You will work directly on the backend of products that are already live, with a mentor alongside you. The work is designing APIs, working with databases, and keeping services stable — not a simulated exercise.",
    },
    stack: [".NET", "C#", "ASP.NET Core", "SQL Server", "EF Core", "Docker"],
    duties: {
      vi: [
        "Cùng team xây dựng API & service bằng .NET",
        "Tham gia mô hình hóa và tối ưu truy vấn dữ liệu",
        "Học cách đảm bảo hiệu năng và độ ổn định hệ thống",
        "Viết test và đọc, review code cùng mentor",
      ],
      en: [
        "Build APIs and services in .NET alongside the team",
        "Help model the data and tune the queries against it",
        "Learn how performance and reliability are actually held up",
        "Write tests, and read and review code with your mentor",
      ],
    },
    requirements: {
      vi: [
        "Sinh viên năm cuối hoặc mới tốt nghiệp CNTT",
        "Có kiến thức nền tảng về C# / .NET và OOP",
        "Hiểu cơ bản về cơ sở dữ liệu và API",
        "Ham học hỏi, chủ động và có trách nhiệm",
      ],
      en: [
        "Final-year student or recent graduate in computing",
        "Working knowledge of C# / .NET and object-oriented design",
        "A basic understanding of databases and APIs",
        "Eager to learn, self-directed and dependable",
      ],
    },
  },
  {
    slug: "frontend-react",
    role: {
      vi: "Thực tập sinh Frontend (React)",
      en: "Frontend Engineering Intern (React)",
    },
    department: { vi: "Kỹ thuật", en: "Engineering" },
    employment: { vi: "Thực tập", en: "Internship" },
    level: "Intern",
    slots: 2,
    tint: "var(--color-lotus)",
    summary: {
      vi: "Biến thiết kế thành giao diện chạy được trên mọi màn hình — phần sản phẩm mà người dùng thực sự chạm vào.",
      en: "Turn designs into interfaces that work on every screen — the part of the product people actually touch.",
    },
    about: {
      vi: "Bạn sẽ hiện thực giao diện cho các sản phẩm của VNZ bằng React và Next.js, từ thiết kế tới sản phẩm chạy thật. Công việc chú trọng chi tiết: bố cục đúng, responsive đúng, và đủ nhanh trên máy yếu lẫn mạng chậm.",
      en: "You will build the interfaces for VNZ's products in React and Next.js, from design file to shipped page. The work rewards care: the layout right, the responsive behaviour right, and fast enough on a modest device and a slow connection.",
    },
    stack: ["React", "Next.js", "TypeScript", "Tailwind", "Zustand", "REST API"],
    duties: {
      vi: [
        "Cùng team xây dựng giao diện bằng React / Next.js",
        "Hiện thực thiết kế thành UI responsive, pixel-perfect",
        "Tham gia tối ưu hiệu năng & trải nghiệm người dùng",
        "Kết nối API và quản lý trạng thái ứng dụng",
      ],
      en: [
        "Build interfaces in React / Next.js alongside the team",
        "Turn designs into responsive, pixel-accurate UI",
        "Help tune performance and the experience around it",
        "Wire up APIs and manage application state",
      ],
    },
    requirements: {
      vi: [
        "Sinh viên năm cuối hoặc mới tốt nghiệp CNTT",
        "Có kiến thức nền tảng về React và JavaScript",
        "Yêu thích lập trình giao diện, chú trọng chi tiết",
        "Ham học hỏi và biết dùng Git là một lợi thế",
      ],
      en: [
        "Final-year student or recent graduate in computing",
        "Working knowledge of React and JavaScript",
        "Enjoys interface work and cares about the details",
        "Eager to learn; familiarity with Git is a plus",
      ],
    },
  },
  {
    slug: "pm-ba-intern",
    role: {
      vi: "Thực tập sinh PM / BA",
      en: "Product / Business Analyst Intern",
    },
    department: { vi: "Sản phẩm", en: "Product" },
    employment: { vi: "Thực tập", en: "Internship" },
    level: "Intern",
    slots: 1,
    tint: "var(--color-gold)",
    summary: {
      vi: "Đứng giữa nhu cầu người dùng và đội phát triển — biến bài toán mơ hồ thành kế hoạch rõ ràng.",
      en: "Stand between what users need and what the team builds — turning a vague problem into a clear plan.",
    },
    about: {
      vi: "Bạn sẽ tham gia từ khâu thu thập yêu cầu tới khi tính năng lên sản phẩm: nói chuyện với các bên liên quan, viết tài liệu, và theo tiến độ cùng đội phát triển. Đây là vị trí phù hợp nếu bạn thích gỡ rối vấn đề hơn là viết code.",
      en: "You will be involved from gathering requirements through to a feature going live: talking to stakeholders, writing the documentation, and tracking progress with the engineers. This is the role for you if you would rather untangle a problem than write the code.",
    },
    stack: ["Agile", "Scrum", "User Story", "Figma", "Jira", "Notion"],
    duties: {
      vi: [
        "Thu thập và phân tích yêu cầu nghiệp vụ",
        "Viết tài liệu, user story và đặc tả tính năng",
        "Phối hợp giữa đội phát triển và các bên liên quan",
        "Theo dõi tiến độ và hỗ trợ quản lý dự án",
      ],
      en: [
        "Gather and analyse business requirements",
        "Write documentation, user stories and feature specs",
        "Coordinate between the engineering team and stakeholders",
        "Track progress and support project management",
      ],
    },
    requirements: {
      vi: [
        "Sinh viên năm cuối hoặc mới tốt nghiệp",
        "Tư duy logic, giao tiếp và trình bày tốt",
        "Ham học hỏi, chủ động và cẩn thận",
        "Đọc hiểu tài liệu tiếng Anh là một lợi thế",
      ],
      en: [
        "Final-year student or recent graduate",
        "Structured thinking, and clear speaking and writing",
        "Eager to learn, self-directed and careful",
        "Reading technical English comfortably is a plus",
      ],
    },
  },
];

export function roleBySlug(slug: string) {
  return ROLES.find((r) => r.slug === slug);
}

/**
 * "Quyền lợi" — what VNZ offers, shown on the list page and in each JD.
 *
 * NO GLYPHS ANY MORE. These used to be `{ glyph: "❖", label }` chips in the
 * character-select strip. The wording is unchanged; only the framing is, because
 * a benefits list is the part of a job ad people read most carefully and it
 * should look like a benefits list.
 *
 * DELIBERATELY NOT A LIST OF NUMBERS. There is no confirmed stipend, leave
 * policy or equipment budget in this repo, so nothing here claims one — see the
 * note on `Role.salary`. Add the concrete items once they are agreed; they will
 * do more work than any of these four lines.
 */
export const PERKS: { title: L; desc: L }[] = [
  {
    title: { vi: "Môi trường trẻ, năng động", en: "A young, fast-moving team" },
    desc: {
      vi: "Đội ngũ ở chương đầu tiên, không có tầng nấc — bạn nói chuyện trực tiếp với người ra quyết định.",
      en: "A team still in its first chapter, with no layers in between — you talk directly to the people making the decisions.",
    },
  },
  {
    title: { vi: "Học từ sản phẩm thật", en: "Learn on real products" },
    desc: {
      vi: "Bạn làm trên sản phẩm đang chạy và có người dùng thật, không phải dự án mô phỏng để chấm điểm.",
      en: "You work on products that are live and have real users, not a mock project built to be graded.",
    },
  },
  {
    title: { vi: "Lộ trình phát triển rõ ràng", en: "A clear path forward" },
    desc: {
      vi: "Mỗi vị trí có mentor đồng hành, có phản hồi định kỳ và có đường đi tiếp sau kỳ thực tập.",
      en: "Every role comes with a mentor, regular feedback, and somewhere to go after the internship ends.",
    },
  },
  {
    title: { vi: "Văn hóa cởi mở, sáng tạo", en: "An open, curious culture" },
    desc: {
      vi: "Ý tưởng được lắng nghe bất kể đến từ ai, và câu hỏi “tại sao” luôn được hoan nghênh.",
      en: "Ideas get heard regardless of who they came from, and “why?” is always a welcome question.",
    },
  },
];

/** Quy trình ứng tuyển — four plain steps, no quest framing. */
export const STEPS: { title: L; desc: L }[] = [
  {
    title: { vi: "Nộp hồ sơ", en: "Apply" },
    desc: {
      vi: "Gửi CV cùng đôi dòng giới thiệu về bạn qua biểu mẫu liên hệ.",
      en: "Send your CV and a few lines about yourself through the form.",
    },
  },
  {
    title: { vi: "Sàng lọc hồ sơ", en: "Screening" },
    desc: {
      vi: "Đội ngũ VNZ xem xét và phản hồi trong khoảng 3–5 ngày làm việc.",
      en: "The VNZ team reviews it and replies within about 3–5 working days.",
    },
  },
  {
    title: { vi: "Phỏng vấn", en: "Interview" },
    desc: {
      vi: "Một buổi trao đổi về kỹ năng, kinh nghiệm và định hướng của bạn.",
      en: "One conversation about your skills, your experience and where you want to go.",
    },
  },
  {
    title: { vi: "Nhận việc", en: "Offer and start" },
    desc: {
      vi: "Thống nhất thời gian bắt đầu, onboard và nhận công việc đầu tiên.",
      en: "Agree a start date, get onboarded, and pick up your first piece of work.",
    },
  },
];
