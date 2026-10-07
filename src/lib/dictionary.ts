import type { L } from "@/lib/i18n";

/**
 * UI chrome — every string that lives in a component rather than in a data
 * module.
 *
 * THE SPLIT: content (roles, products, members, posts, partners) carries its own
 * translations inside `src/lib/*.ts`, next to the thing it describes. This file
 * is the furniture around it — labels, buttons, headings, form copy, empty
 * states. Editing a job description means opening `careers.ts`; editing the word
 * on a button means opening this.
 *
 * EVERY ENTRY IS `L<...>` SO BOTH LANGUAGES ARE REQUIRED. Adding a key without an
 * English value is a type error, not a page that quietly serves Vietnamese to an
 * English reader. That guarantee is the reason this is typed objects rather than
 * two JSON catalogues — see the long note in `i18n.ts`.
 *
 * ── THE ENGLISH IS A TRANSLATION, NOT APPROVED MARKETING COPY ────────────────
 * Vietnamese is the source of truth: it is what the company wrote. The English
 * below was written to match it in meaning and register, but nobody at VNZ has
 * signed off on it. Have a native speaker read the marketing lines (hero, story,
 * chapter headings) before launch — the form labels and UI verbs are mechanical
 * and safe, the brand voice is not.
 *
 * ── FONTS ───────────────────────────────────────────────────────────────────
 * Both languages render in the SAME faces. `font-pixel` (VT323) and `font-viet`
 * (Be Vietnam Pro) carry Vietnamese diacritics and handle ASCII fine, so English
 * could technically use `font-display` (Pixelify Sans) for a slightly crisper
 * look — DON'T. The two locales would stop looking like the same site, and the
 * first time a Vietnamese string appears in an English layout (a member's name, a
 * hometown) it would render as missing-glyph boxes.
 */

/* ── Navigation ─────────────────────────────────────────────────────────── */

export const NAV_LABELS = {
  home: { vi: "Trang chủ", en: "Home" },
  team: { vi: "Đội ngũ", en: "Team" },
  news: { vi: "Tin tức", en: "News" },
  careers: { vi: "Tuyển dụng", en: "Careers" },
  contact: { vi: "Liên hệ", en: "Contact" },
  apply: { vi: "Ứng tuyển", en: "Apply" },
} satisfies Record<string, L>;

export const NAV = {
  cta: { vi: "Liên hệ hợp tác", en: "Work with us" },
  openMenu: { vi: "Mở menu", en: "Open menu" },
  closeMenu: { vi: "Đóng menu", en: "Close menu" },
  primaryNav: { vi: "Điều hướng chính", en: "Main navigation" },
  homeAria: { vi: "VNZ — trang chủ", en: "VNZ — home" },
  switchLanguage: { vi: "Đổi ngôn ngữ", en: "Change language" },
} satisfies Record<string, L>;

export const FOOTER = {
  explore: { vi: "Khám phá", en: "Explore" },
  company: { vi: "Công ty", en: "Company" },
  contact: { vi: "Liên hệ", en: "Contact" },
  joinTeam: { vi: "Gia nhập đội ngũ", en: "Join the team" },
  rights: { vi: "Mọi quyền được bảo lưu.", en: "All rights reserved." },
  signoff: {
    vi: "Press START to build something great.",
    en: "Press START to build something great.",
  },
  /** Shown when `CONTACT` in `site.ts` is still empty. */
  noChannels: {
    vi: "Có một bài toán cần giải bằng công nghệ? Gửi lời nhắn qua trang liên hệ, hoặc theo dõi VNZ để biết khi nào chúng tôi mở cửa.",
    en: "Have a problem worth solving with technology? Send us a message through the contact page, or follow VNZ to hear when our channels open.",
  },
  recruitTag: { vi: " · tuyển dụng", en: " · recruitment" },
} satisfies Record<string, L>;

/* ── Hero ───────────────────────────────────────────────────────────────── */

export const HERO = {
  eyebrow: {
    vi: "Vietnam Z-DNA Technology",
    en: "Vietnam Z-DNA Technology",
  },
  headlineTop: { vi: "Dấu ấn công nghệ", en: "A mark in technology" },
  headlineBottom: {
    vi: "Khát vọng thế hệ mới",
    en: "Built by a new generation",
  },
  /**
   * The rule-flanked line under the headline. It was ALREADY English on the
   * Vietnamese page — it is the company's own bilingual lockup, not a
   * translation — so the Vietnamese entry keeps it and the English entry swaps
   * in Vietnamese to preserve the bilingual effect rather than printing the same
   * sentence twice.
   */
  subline: {
    vi: "Defining Tech, Driven by a New Generation",
    en: "Dấu ấn công nghệ — Khát vọng thế hệ mới",
  },
  thesisOpen: {
    vi: "“VNZ không được xây dựng để gia công — chúng tôi được xây dựng để ",
    en: "“VNZ was not built to do outsourced work — we were built to ",
  },
  thesisAccent: {
    vi: "kiến tạo dấu ấn công nghệ thế hệ mới.”",
    en: "create a new generation’s mark in technology.”",
  },
  ctaPrimary: { vi: "Khám phá VNZ", en: "Explore VNZ" },
  ctaSecondary: { vi: "Gia nhập đội ngũ", en: "Join the team" },
  audienceBusiness: { vi: "Doanh nghiệp", en: "Businesses" },
  audienceUsers: { vi: "Người dùng", en: "People" },
  audiencePublic: { vi: "Khu vực công", en: "Public sector" },
  scrollCue: { vi: "Cuộn để khám phá", en: "Scroll to explore" },
} satisfies Record<string, L>;

/* ── Chương 01 · Câu chuyện (story-truth.tsx) ───────────────────────────── */

export const STORY = {
  chapter: { vi: "Câu chuyện VNZ", en: "The VNZ story" },
  truthLabel: {
    vi: "Một sự thật chúng tôi nhận ra",
    en: "A truth we came to see",
  },
  createLine1: { vi: "Tạo ra", en: "Building" },
  createLine2: { vi: "công nghệ", en: "technology" },
  ownLine1: { vi: "Sở hữu", en: "Owning" },
  ownLine2: { vi: "công nghệ", en: "technology" },
  truthBody: {
    vi: "Một quốc gia có thể sở hữu hàng triệu kỹ sư tài năng. Nhưng chỉ khi tạo ra những sản phẩm, nền tảng và giải pháp của riêng mình, quốc gia đó mới thực sự để lại dấu ấn trên bản đồ công nghệ thế giới.",
    en: "A country can have millions of talented engineers. But only when it builds products, platforms and solutions of its own does it truly leave a mark on the world’s technology map.",
  },
  questionLine1: {
    vi: "Nếu người Việt đủ năng lực",
    en: "If Vietnamese engineers are good enough",
  },
  questionLine2: {
    vi: "xây dựng công nghệ cho thế giới —",
    en: "to build technology for the world —",
  },
  questionAccentA: {
    vi: "tại sao chưa có dấu ấn",
    en: "why is there still no",
  },
  questionAccentB: { vi: "Việt Nam?", en: "Vietnamese mark?" },
  questionFooter: {
    vi: "Đó là điều đã thôi thúc VNZ ra đời",
    en: "That question is why VNZ exists",
  },
  nameLabel: {
    vi: "Đó cũng là ý nghĩa cái tên",
    en: "And that is what the name means",
  },
  nameBrand: { vi: "Vietnam Z-DNA", en: "Vietnam Z-DNA" },
  nameBodyLead: {
    vi: "Vietnam Z-DNA Technology",
    en: "Vietnam Z-DNA Technology",
  },
  nameBody: {
    vi: " — DNA của một thế hệ người Việt lớn lên trong thời đại số, mang trong mình khát vọng làm chủ công nghệ, tạo ra giá trị bằng công nghệ và ghi dấu ấn của riêng mình trên bản đồ công nghệ thế giới.",
    en: " — the DNA of a Vietnamese generation raised in the digital age, carrying the ambition to master technology, create value with it, and leave a mark of their own on the world’s technology map.",
  },
} satisfies Record<string, L>;

/* ── Chương 02 · Dấu ấn VNZ + Đội ngũ (products-act, team) ──────────────── */

export const PRODUCTS_UI = {
  chapter: { vi: "Dấu ấn VNZ", en: "What we’ve built" },
  teamChapter: { vi: "Đội ngũ", en: "The team" },
  logoAlt: { vi: "biểu tượng sản phẩm", en: "product icon" },
  tryProduct: { vi: "Trải nghiệm thử", en: "Try it out" },
  /** Screen-reader replacement for the blurred locked skeleton. */
  lockedSr: {
    vi: "Sản phẩm chưa ra mắt. Thông tin chi tiết sẽ được công bố vào ngày mở cửa.",
    en: "This product has not launched yet. Details will be published on release day.",
  },
  /**
   * MEANINGLESS FILLER, NOT REAL COPY — it exists only to give the blur
   * something text-shaped to blur. Never paste a real pitch in here.
   */
  lockedTagline: {
    vi: "Thông tin sẽ được công bố khi sản phẩm ra mắt",
    en: "Details will be announced when this product launches",
  },
  lockedDesc: {
    vi: "Nội dung chi tiết đang được hoàn thiện và sẽ được chia sẻ vào đúng ngày mở cửa cùng toàn bộ tính năng của sản phẩm.",
    en: "The full description is being finalised and will be shared on release day along with the complete feature set.",
  },
  lockedFeature: {
    vi: "Nội dung đang hoàn thiện",
    en: "Details being finalised",
  },
} satisfies Record<string, L>;

export const TEAM_UI = {
  introEyebrow: { vi: "Đội ngũ VNZ", en: "The VNZ team" },
  introTitle: { vi: "Chọn một thành viên", en: "Choose a member" },
  introBody: {
    vi: "Mỗi người là một mảnh ghép của VNZ. Chọn một thành viên để bước vào hồ sơ của họ.",
    en: "Every person is part of VNZ. Choose a member to enter their profile.",
  },
  introHint: { vi: "Chọn để khám phá", en: "Select to explore" },
  hometownLabel: { vi: "Quê quán", en: "Hometown" },
  hometownAlt: { vi: "Quê hương", en: "Hometown of" },
  seeAllLine1: { vi: "Xem toàn bộ", en: "Meet the whole" },
  seeAllLine2: { vi: "đội ngũ", en: "team" },
  moreMembers: { vi: "thành viên nữa", en: "more members" },
  fullName: { vi: "Họ và tên", en: "Full name" },
  role: { vi: "Chức vụ", en: "Role" },
  jobLevel: { vi: "Cấp bậc", en: "Level" },
  hometown: { vi: "Quê quán", en: "Hometown" },
  hobbies: { vi: "Sở thích", en: "Interests" },
  joinDate: { vi: "Ngày gia nhập công ty", en: "Joined VNZ" },
  motto: { vi: "Châm ngôn sống", en: "Personal motto" },
  detailLoading: { vi: "Đang tải hồ sơ...", en: "Loading profile..." },
  detailUnavailable: {
    vi: "Thành viên này hiện không còn hiển thị.",
    en: "This member is no longer available.",
  },
  detailLoadError: {
    vi: "Không thể tải hồ sơ. Vui lòng thử lại.",
    en: "Unable to load the profile. Please try again.",
  },
  retry: { vi: "Thử lại", en: "Retry" },
} satisfies Record<string, L>;

/* ── Đối tác ────────────────────────────────────────────────────────────── */

export const PARTNERS_UI = {
  chapter: { vi: "Đối tác", en: "Partners" },
  headingA: { vi: "thương hiệu đã", en: "brands have" },
  headingAccent: { vi: "đi cùng", en: "walked with" },
  headingB: { vi: "chúng tôi", en: "us" },
  invitation: {
    vi: "Bạn đang có một bài toán cần giải bằng công nghệ? Chúng tôi luôn mở cửa cho những hợp tác tạo ra giá trị thật.",
    en: "Have a problem that needs solving with technology? We are always open to partnerships that create real value.",
  },
  ctaProject: { vi: "Bắt đầu một dự án", en: "Start a project" },
  ctaJoin: { vi: "Gia nhập đội ngũ", en: "Join the team" },
} satisfies Record<string, L>;

/* ── Tuyển dụng ─────────────────────────────────────────────────────────── */

export const CAREERS_UI = {
  label: { vi: "Tuyển dụng", en: "Careers" },
  titleA: { vi: "Cùng viết", en: "Write the" },
  titleAccent: { vi: "chương đầu tiên", en: "first chapter" },
  titleB: { vi: "", en: " with us" },
  lead: {
    vi: "VNZ đang ở giai đoạn đầu. Chúng tôi tìm những người muốn làm sản phẩm thật, học nhanh và không ngại nhận việc khó — dưới đây là các vị trí đang mở.",
    en: "VNZ is at the very beginning. We are looking for people who want to build real products, learn fast and take on hard work — here is what is open.",
  },
  openRoles: { vi: "vị trí đang mở", en: "open roles" },
  headcount: { vi: "chỉ tiêu", en: "positions" },
  rolesInDept: { vi: "vị trí", en: "roles" },
  otherDepartment: { vi: "Khác", en: "Other" },
  emptyRoles: {
    vi: "Hiện chưa có vị trí tuyển dụng nào đang mở.",
    en: "There are no open roles right now.",
  },
  loadError: {
    vi: "Chưa thể tải danh sách tuyển dụng. Vui lòng thử lại.",
    en: "The open roles could not be loaded. Please try again.",
  },
  retry: { vi: "Thử lại", en: "Try again" },
  viewDetail: { vi: "Xem chi tiết", en: "View details" },
  apply: { vi: "Ứng tuyển", en: "Apply" },
  applyNow: { vi: "Ứng tuyển ngay", en: "Apply now" },
  benefits: { vi: "Quyền lợi", en: "What we offer" },
  process: { vi: "Quy trình ứng tuyển", en: "How hiring works" },
  noFitTitle: {
    vi: "Không thấy vị trí phù hợp?",
    en: "Nothing quite right?",
  },
  noFitBody: {
    vi: "Nếu bạn tin mình có thể đóng góp cho VNZ theo một cách chưa có trong danh sách trên, cứ gửi hồ sơ. Chúng tôi đọc tất cả, và một đội ngũ mới thì hiếm khi biết trước mình cần ai.",
    en: "If you think you could contribute in a way that isn’t listed above, send your CV anyway. We read everything, and a young team rarely knows in advance exactly who it needs.",
  },
  noFitCta: { vi: "Gửi hồ sơ tự do", en: "Send an open application" },
  allRoles: { vi: "Tất cả vị trí", en: "All roles" },
  breadcrumbNav: { vi: "Đường dẫn", en: "Breadcrumb" },
  jobDescription: { vi: "Mô tả công việc", en: "What you’ll do" },
  requirements: { vi: "Yêu cầu ứng viên", en: "What we’re looking for" },
  stackTitle: { vi: "Công nghệ & công cụ", en: "Tools & technology" },
  applyPanelTitle: { vi: "Ứng tuyển vị trí này", en: "Apply for this role" },
  applyPanelBody: {
    vi: "Biểu mẫu sẽ tự điền sẵn tên vị trí — bạn chỉ cần giới thiệu về mình và đính kèm CV.",
    en: "The form arrives with this role already selected — just tell us about yourself and link your CV.",
  },
  otherRoles: { vi: "Vị trí khác", en: "Other roles" },
  factDepartment: { vi: "Bộ phận", en: "Team" },
  factEmployment: { vi: "Loại hình", en: "Type" },
  factLevel: { vi: "Cấp bậc", en: "Level" },
  factHeadcount: { vi: "Chỉ tiêu", en: "Openings" },
  factWorkMode: { vi: "Hình thức", en: "Work mode" },
  factLocation: { vi: "Địa điểm", en: "Location" },
  factSalary: { vi: "Thu nhập", en: "Compensation" },
  factDeadline: { vi: "Hạn nộp", en: "Closes" },
  people: { vi: "người", en: "people" },
} satisfies Record<string, L>;

/* ── Tin tức ────────────────────────────────────────────────────────────── */

export const NEWS_UI = {
  label: { vi: "Tin tức", en: "News" },
  titleA: { vi: "Những gì", en: "What’s" },
  titleAccent: { vi: "đang diễn ra", en: "happening" },
  lead: {
    vi: "Cập nhật về sản phẩm, đội ngũ và tuyển dụng của VNZ — cùng những góc nhìn về con đường chúng tôi đang đi.",
    en: "Updates on VNZ’s products, team and hiring — along with perspectives on the road we’re taking.",
  },
  empty: {
    vi: "Chưa có bài viết nào. Hãy quay lại sau nhé.",
    en: "No posts yet. Please check back soon.",
  },
  loadError: {
    vi: "Chưa thể tải danh sách tin tức. Vui lòng thử lại.",
    en: "The news list could not be loaded. Please try again.",
  },
  retry: { vi: "Thử lại", en: "Try again" },
  readMore: { vi: "Đọc tiếp", en: "Read more" },
  readingTime: { vi: "phút đọc", en: "min read" },
  allPosts: { vi: "Tất cả bài viết", en: "All posts" },
  readNext: { vi: "Đọc tiếp", en: "Read next" },
  previousPage: { vi: "Trước", en: "Previous" },
  nextPage: { vi: "Sau", en: "Next" },
  paginationNav: { vi: "Phân trang tin tức", en: "News pagination" },
  pageLabel: { vi: "Trang", en: "Page" },
} satisfies Record<string, L>;

/* ── Liên hệ ────────────────────────────────────────────────────────────── */

export const CONTACT_UI = {
  label: { vi: "Liên hệ", en: "Contact" },
  titleA: { vi: "Bắt đầu một", en: "Start a" },
  titleAccent: { vi: "cuộc trò chuyện", en: "conversation" },
  lead: {
    vi: "Một bài toán cần giải bằng công nghệ, một sản phẩm muốn cùng xây, hay chỉ là một câu hỏi về VNZ — điền vào biểu mẫu bên dưới và chúng tôi sẽ trả lời.",
    en: "A problem to solve with technology, a product to build together, or simply a question about VNZ — fill in the form below and we’ll reply.",
  },
  formTitle: { vi: "Gửi lời nhắn", en: "Send a message" },
  formLead: {
    vi: "Càng cụ thể, câu trả lời của chúng tôi càng hữu ích — kể cả khi câu trả lời là “việc này bạn chưa cần tới chúng tôi”.",
    en: "The more specific you are, the more useful our answer — even when the answer is “you don’t need us for this yet”.",
  },
  directChannels: { vi: "Kênh trực tiếp", en: "Direct channels" },
  noChannels: {
    vi: "Email và số điện thoại chính thức của VNZ đang được hoàn thiện. Trong lúc đó, biểu mẫu bên cạnh là cách nhanh nhất để tới được chúng tôi.",
    en: "VNZ’s official email and phone line are still being set up. In the meantime, the form is the fastest way to reach us.",
  },
  hours: { vi: "Giờ làm việc", en: "Office hours" },
  responseTime: { vi: "Thời gian phản hồi", en: "Response time" },
  responseBody: { vi: "Chúng tôi thường trả lời", en: "We usually reply" },
  follow: { vi: "Theo dõi VNZ", en: "Follow VNZ" },
  joinTitle: { vi: "Muốn gia nhập?", en: "Want to join us?" },
  joinBody: {
    vi: "Các vị trí đang mở đều nằm công khai trên trang tuyển dụng — kèm nhiệm vụ, yêu cầu và số suất còn lại.",
    en: "Every open role is listed publicly on the careers page — with responsibilities, requirements and how many places are left.",
  },
  joinCta: { vi: "Xem vị trí đang mở", en: "See open roles" },
  emailLabel: { vi: "Email chung", en: "General email" },
  recruitLabel: { vi: "Tuyển dụng", en: "Recruitment" },
  phoneLabel: { vi: "Điện thoại", en: "Phone" },
  addressLabel: { vi: "Văn phòng", en: "Office" },
} satisfies Record<string, L>;

/* ── Forms — shared verbs and states ────────────────────────────────────── */

export const FORM = {
  optional: { vi: "— Không bắt buộc —", en: "— Optional —" },
  requiredNote: { vi: "là thông tin bắt buộc.", en: "marks a required field." },
  requiredNoteLead: { vi: "Dấu", en: "Fields marked" },
  sending: { vi: "Đang gửi…", en: "Sending…" },
  sent: { vi: "Đã gửi", en: "Sent" },
  notSent: { vi: "Chưa gửi được", en: "Not sent" },
  fixErrors: {
    vi: "Vui lòng kiểm tra lại các mục được đánh dấu bên dưới.",
    en: "Please check the fields marked below.",
  },
  orEmail: { vi: "Hoặc gửi thẳng tới", en: "Or write directly to" },
} satisfies Record<string, L>;

export const CONTACT_FORM_UI = {
  submit: { vi: "Gửi lời nhắn", en: "Send message" },
  topic: { vi: "Bạn liên hệ về việc gì", en: "What is this about" },
  topicPlaceholder: { vi: "— Chọn nội dung —", en: "— Choose a topic —" },
  name: { vi: "Họ và tên", en: "Full name" },
  namePlaceholder: { vi: "Nguyễn Văn A", en: "Jane Doe" },
  email: { vi: "Email", en: "Email" },
  emailPlaceholder: { vi: "ban@congty.com", en: "you@company.com" },
  phone: { vi: "Điện thoại / Zalo", en: "Phone / Zalo" },
  phonePlaceholder: { vi: "09xx xxx xxx", en: "+84 9xx xxx xxx" },
  company: { vi: "Công ty / Tổ chức", en: "Company / Organisation" },
  companyPlaceholder: { vi: "Tên tổ chức của bạn", en: "Your organisation" },
  budget: { vi: "Ngân sách dự kiến", en: "Estimated budget" },
  timeline: { vi: "Mong muốn bắt đầu", en: "Preferred start" },
  message: { vi: "Nội dung", en: "Message" },
  messagePlaceholder: {
    vi: "Bối cảnh, điều bạn muốn đạt được, và mốc thời gian nếu có. Càng cụ thể, câu trả lời của chúng tôi càng hữu ích.",
    en: "The context, what you want to achieve, and any timeline. The more specific, the more useful our answer.",
  },
  source: { vi: "Bạn biết VNZ qua đâu", en: "How you heard about VNZ" },
  consent: {
    vi: "Tôi đồng ý để VNZ dùng thông tin trên nhằm liên hệ lại về nội dung này.",
    en: "I agree that VNZ may use the information above to reply about this enquiry.",
  },
} satisfies Record<string, L>;

export const APPLY_UI = {
  label: { vi: "Ứng tuyển", en: "Apply" },
  titleA: { vi: "Gửi hồ sơ", en: "Send your" },
  titleAccent: { vi: "tới VNZ", en: "application" },
  leadWithRole: {
    vi: "Vị trí đã được chọn từ tin tuyển dụng. Nếu muốn ứng tuyển vị trí khác, hãy quay lại danh sách tuyển dụng và chọn lại.",
    en: "This role was selected from the job post. To apply for another role, return to the careers list and choose it there.",
  },
  leadNoRole: {
    vi: "Chọn vị trí bạn quan tâm, giới thiệu đôi dòng về bản thân và gửi kèm liên kết tới CV.",
    en: "Pick the role you’re interested in, tell us about yourself, and link your CV.",
  },
  backToJd: {
    vi: "Quay lại mô tả công việc",
    en: "Back to the job description",
  },
  openRoles: { vi: "vị trí đang mở", en: "open roles" },
  afterSubmit: { vi: "Sau khi gửi", en: "What happens next" },
  seeFullJd: { vi: "Xem mô tả đầy đủ", en: "Read the full description" },
  submit: { vi: "Gửi hồ sơ", en: "Send application" },
  received: { vi: "Đã nhận hồ sơ", en: "Application received" },

  groupRole: { vi: "Vị trí ứng tuyển", en: "Role" },
  groupPersonal: { vi: "Thông tin cá nhân", en: "About you" },
  groupProfile: { vi: "Hồ sơ", en: "Your work" },
  groupTiming: { vi: "Thời gian", en: "Availability" },

  role: { vi: "Vị trí", en: "Role" },
  rolePlaceholder: { vi: "— Chọn vị trí —", en: "— Choose a role —" },
  name: { vi: "Họ và tên", en: "Full name" },
  namePlaceholder: { vi: "Nguyễn Văn A", en: "Jane Doe" },
  email: { vi: "Email", en: "Email" },
  emailPlaceholder: { vi: "ban@email.com", en: "you@email.com" },
  phone: { vi: "Điện thoại / Zalo", en: "Phone / Zalo" },
  phonePlaceholder: { vi: "09xx xxx xxx", en: "+84 9xx xxx xxx" },
  gradYear: { vi: "Năm tốt nghiệp", en: "Graduation year" },
  school: { vi: "Trường", en: "University" },
  schoolPlaceholder: { vi: "Đại học ...", en: "University of ..." },
  major: { vi: "Chuyên ngành", en: "Field of study" },
  majorPlaceholder: { vi: "Công nghệ thông tin", en: "Computer science" },
  cvUrl: { vi: "Liên kết CV", en: "Link to your CV" },
  cvHint: {
    vi: "Dán liên kết Google Drive, OneDrive hoặc Dropbox — nhớ mở quyền xem cho người có liên kết.",
    en: "Paste a Google Drive, OneDrive or Dropbox link — make sure anyone with the link can view it.",
  },
  portfolio: {
    vi: "Portfolio / GitHub / LinkedIn",
    en: "Portfolio / GitHub / LinkedIn",
  },
  intro: { vi: "Giới thiệu về bạn", en: "About you" },
  introPlaceholder: {
    vi: "Bạn đã học và làm gì, dự án nào bạn tâm đắc nhất, và vì sao bạn muốn tham gia VNZ.",
    en: "What you’ve studied and built, the project you’re proudest of, and why you want to join VNZ.",
  },
  availability: { vi: "Thời gian có thể tham gia", en: "Time you can commit" },
  startDate: { vi: "Có thể bắt đầu", en: "Earliest start" },
  source: {
    vi: "Bạn biết tin tuyển dụng qua đâu",
    en: "How you found this role",
  },
  consent: {
    vi: "Tôi đồng ý để VNZ lưu trữ và xử lý thông tin trên nhằm phục vụ việc xét tuyển vị trí này.",
    en: "I agree that VNZ may store and process the information above to assess my application for this role.",
  },
} satisfies Record<string, L>;

/* ── Form validation + submission results ──────────────────────────────────
 *
 * THESE ARE READ BY A HUMAN WHO JUST FAILED AT SOMETHING, so they come back in
 * the language that person was reading. The server action has no access to the
 * request URL and cannot infer the locale, so the form posts it as a hidden
 * field and the action looks the message up here. See `FIELDS.locale`.
 *
 * The two entries that interpolate a number are functions rather than strings:
 * "tối thiểu 10 ký tự" and "at least 10 characters" put the number in different
 * places, and a `${}` template in the action would have to pick one word order
 * for both languages.
 */

export const ERRORS = {
  nameRequired: {
    vi: "Vui lòng cho chúng tôi biết tên bạn.",
    en: "Please tell us your name.",
  },
  nameTooLong: {
    vi: "Tên quá dài.",
    en: "That name is too long.",
  },
  emailRequired: {
    vi: "Cần một email để chúng tôi trả lời bạn.",
    en: "We need an email address to reply to.",
  },
  emailRequiredApply: {
    vi: "Cần một email để chúng tôi phản hồi.",
    en: "We need an email address to reply to.",
  },
  emailInvalid: {
    vi: "Email chưa đúng định dạng.",
    en: "That doesn’t look like a valid email address.",
  },
  phoneRequired: {
    vi: "Cần số điện thoại để hẹn lịch phỏng vấn.",
    en: "We need a phone number to arrange an interview.",
  },
  phoneTooLong: {
    vi: "Số điện thoại quá dài.",
    en: "That phone number is too long.",
  },
  phoneInvalid: {
    vi: "Số điện thoại chưa đúng định dạng Việt Nam.",
    en: "That phone number is not a valid Vietnamese number.",
  },
  fieldInvalid: {
    vi: "Thông tin này chưa hợp lệ.",
    en: "This value is not valid.",
  },
  tooLong: { vi: "Nội dung quá dài.", en: "That’s too long." },
  companyTooLong: {
    vi: "Tên tổ chức quá dài.",
    en: "That organisation name is too long.",
  },
  messageRequired: {
    vi: "Hãy cho chúng tôi biết nội dung.",
    en: "Please tell us what this is about.",
  },
  messageTooLong: {
    vi: "Nội dung quá dài.",
    en: "That message is too long.",
  },
  topicRequired: {
    vi: "Chọn một nội dung liên hệ.",
    en: "Please choose what this is about.",
  },
  consentRequired: {
    vi: "Cần bạn đồng ý để chúng tôi được liên hệ lại.",
    en: "We need your agreement before we can reply.",
  },
  consentRequiredApply: {
    vi: "Cần bạn đồng ý để chúng tôi được xử lý hồ sơ này.",
    en: "We need your agreement before we can process this application.",
  },
  roleRequired: {
    vi: "Chọn vị trí bạn muốn ứng tuyển.",
    en: "Please choose the role you’re applying for.",
  },
  gradYearInvalid: {
    vi: "Năm tốt nghiệp không hợp lệ.",
    en: "That graduation year isn’t valid.",
  },
  cvRequired: {
    vi: "Gửi kèm liên kết tới CV của bạn.",
    en: "Please include a link to your CV.",
  },
  linkTooLong: { vi: "Liên kết quá dài.", en: "That link is too long." },
  linkInvalid: {
    vi: "Liên kết chưa hợp lệ — hãy dán đường dẫn đầy đủ, bắt đầu bằng https://",
    en: "That link isn’t valid — paste the full URL, starting with https://",
  },
  introRequired: {
    vi: "Hãy giới thiệu đôi dòng về bạn.",
    en: "Please tell us a little about yourself.",
  },
  introTooLong: {
    vi: "Phần giới thiệu quá dài.",
    en: "That introduction is too long.",
  },
} satisfies Record<string, L>;

/** Length errors that have to name a number — see the note above. */
export const ERRORS_N = {
  messageTooShort: {
    vi: (n: number) =>
      `Nội dung hơi ngắn — hãy viết thêm một chút (tối thiểu ${n} ký tự).`,
    en: (n: number) =>
      `That's a little short — could you add some more? (at least ${n} characters)`,
  },
  introTooShort: {
    vi: (n: number) =>
      `Phần giới thiệu hơi ngắn — hãy viết thêm một chút (tối thiểu ${n} ký tự).`,
    en: (n: number) =>
      `That introduction is a little short — could you add some more? (at least ${n} characters)`,
  },
} satisfies Record<string, L<(n: number) => string>>;

export const RESULTS = {
  contactOk: {
    vi: "Chúng tôi đã nhận được lời nhắn của bạn.",
    en: "We’ve received your message.",
  },
  /** Kept in step with `STEPS[1]` in `careers.ts` — the promise made on the JD. */
  applyOk: {
    vi: "Chúng tôi đã nhận được hồ sơ của bạn và sẽ phản hồi trong khoảng 3–5 ngày làm việc.",
    en: "We’ve received your application and will reply within about 3–5 working days.",
  },
  contactUnconfigured: {
    vi: "Kênh nhận liên hệ của VNZ chưa được kết nối, nên lời nhắn này chưa gửi đi được. Rất xin lỗi bạn — vui lòng thử lại sau ít hôm.",
    en: "VNZ’s enquiry channel isn’t connected yet, so this message could not be sent. We’re sorry — please try again in a few days.",
  },
  applyUnconfigured: {
    vi: "Kênh nhận hồ sơ của VNZ chưa được kết nối, nên hồ sơ này chưa gửi đi được. Rất xin lỗi bạn — vui lòng thử lại sau ít hôm.",
    en: "VNZ’s application channel isn’t connected yet, so this application could not be sent. We’re sorry — please try again in a few days.",
  },
  contactFailed: {
    vi: "Có lỗi khi gửi lời nhắn. Bạn thử lại giúp chúng tôi, hoặc liên hệ trực tiếp qua các kênh bên cạnh.",
    en: "Something went wrong sending your message. Please try again, or use one of the direct channels alongside.",
  },
  contactRateLimited: {
    vi: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau",
    en: "You’ve sent too many requests. Please try again in",
  },
  contactTooLarge: {
    vi: "Nội dung yêu cầu vượt giới hạn của hệ thống. Vui lòng rút gọn và gửi lại.",
    en: "This request is too large. Please shorten it and try again.",
  },
  contactUnsupported: {
    vi: "Định dạng gửi liên hệ không được hỗ trợ. Vui lòng tải lại trang và thử lại.",
    en: "This contact request format is not supported. Please reload the page and try again.",
  },
  applyFailed: {
    vi: "Có lỗi khi gửi hồ sơ. Bạn thử lại giúp chúng tôi, hoặc liên hệ trực tiếp qua trang Liên hệ.",
    en: "Something went wrong sending your application. Please try again, or reach us through the contact page.",
  },
  applyJobNotFound: {
    vi: "Vị trí tuyển dụng này không còn tồn tại. Vui lòng quay lại danh sách tuyển dụng và chọn vị trí khác.",
    en: "This role no longer exists. Please return to the careers list and choose another role.",
  },
  applyJobUnavailable: {
    vi: "Vị trí tuyển dụng này không còn nhận hồ sơ. Vui lòng quay lại danh sách tuyển dụng và chọn vị trí còn mở.",
    en: "This role is no longer accepting applications. Please return to the careers list and choose an open role.",
  },
  applyTooLarge: {
    vi: "Nội dung hồ sơ vượt giới hạn của hệ thống. Vui lòng rút gọn nội dung và gửi lại.",
    en: "This application is too large. Please shorten the content and submit again.",
  },
  applyUnsupported: {
    vi: "Định dạng gửi hồ sơ không được hỗ trợ. Vui lòng tải lại trang và thử lại.",
    en: "This application request format is not supported. Please reload the page and try again.",
  },
  applyUncertain: {
    vi: "Hệ thống chưa xác nhận được trạng thái hồ sơ. Vui lòng không gửi lại ngay; hãy liên hệ VNZ nếu bạn cần kiểm tra trước khi gửi lại.",
    en: "The system could not confirm the application status. Please do not submit it again immediately; contact VNZ if you need confirmation first.",
  },
  checkFields: {
    vi: "Vui lòng kiểm tra lại các mục được đánh dấu bên dưới.",
    en: "Please check the fields marked below.",
  },
} satisfies Record<string, L>;

/* ── 404 ────────────────────────────────────────────────────────────────── */

export const NOT_FOUND = {
  eyebrow: { vi: "Error 404", en: "Error 404" },
  titleA: { vi: "Không tìm thấy", en: "We couldn’t find" },
  titleAccent: { vi: "trang này", en: "this page" },
  body: {
    vi: "Đường dẫn bạn vừa mở không tồn tại, hoặc đã được đổi tên hay gỡ bỏ. Bạn có thể quay lại trang chủ, hoặc chọn một trang bên dưới.",
    en: "The link you opened doesn’t exist, or it was renamed or removed. You can head back to the homepage, or reach us directly.",
  },
  ctaHome: { vi: "Về trang chủ", en: "Back to home" },
  ctaReport: { vi: "Báo lỗi cho chúng tôi", en: "Report this to us" },
} satisfies Record<string, L>;

/* ── Page metadata ──────────────────────────────────────────────────────── */

export const META = {
  homeTitle: {
    vi: "VNZ — Vietnam Z-DNA Technology",
    en: "VNZ — Vietnam Z-DNA Technology",
  },
  homeDescription: {
    vi: "VNZ — Vietnam Z-DNA Technology. Một thế hệ người Việt làm chủ công nghệ, tạo ra giá trị và ghi dấu ấn trên bản đồ công nghệ thế giới.",
    en: "VNZ — Vietnam Z-DNA Technology. A Vietnamese generation mastering technology, creating real value and leaving its mark on the world’s technology map.",
  },
  teamTitle: { vi: "Đội ngũ — VNZ", en: "Team — VNZ" },
  teamDescription: {
    vi: "11 thành viên từ 11 vùng quê Việt Nam — những người bắt đầu VNZ, Vietnam Z-DNA Technology.",
    en: "Eleven people from eleven corners of Vietnam — the team that started VNZ, Vietnam Z-DNA Technology.",
  },
  newsTitle: { vi: "Tin tức — VNZ", en: "News — VNZ" },
  newsDescription: {
    vi: "Tin tức, sản phẩm và góc nhìn từ VNZ — Vietnam Z-DNA Technology.",
    en: "News, products and perspectives from VNZ — Vietnam Z-DNA Technology.",
  },
  careersTitle: { vi: "Tuyển dụng — VNZ", en: "Careers — VNZ" },
  careersDescription: {
    vi: "Các vị trí đang mở tại VNZ — Vietnam Z-DNA Technology. Làm sản phẩm thật, học nhanh, và cùng viết chương đầu tiên.",
    en: "Open roles at VNZ — Vietnam Z-DNA Technology. Build real products, learn fast, and help write the first chapter.",
  },
  applyTitle: { vi: "Ứng tuyển — VNZ", en: "Apply — VNZ" },
  applyDescription: {
    vi: "Gửi hồ sơ ứng tuyển tới VNZ — Vietnam Z-DNA Technology. Chọn vị trí, giới thiệu về bạn và đính kèm CV.",
    en: "Apply to VNZ — Vietnam Z-DNA Technology. Choose a role, tell us about yourself and link your CV.",
  },
  contactTitle: { vi: "Liên hệ — VNZ", en: "Contact — VNZ" },
  contactDescription: {
    vi: "Liên hệ hợp tác cùng VNZ — Vietnam Z-DNA Technology. Một bài toán cần giải bằng công nghệ, hay một câu hỏi về chúng tôi.",
    en: "Get in touch with VNZ — Vietnam Z-DNA Technology. A problem to solve with technology, or a question about us.",
  },
  notFoundTitle: {
    vi: "Không tìm thấy trang — VNZ",
    en: "Page not found — VNZ",
  },
  roleNotFound: {
    vi: "Không tìm thấy vị trí — VNZ",
    en: "Role not found — VNZ",
  },
  postNotFound: {
    vi: "Không tìm thấy bài viết — VNZ",
    en: "Post not found — VNZ",
  },
} satisfies Record<string, L>;
