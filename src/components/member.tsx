"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { fetchPublicTeamMemberDetail } from "@/actions/team-members";
import { MemberSprite } from "@/components/member-sprite";
import { Meteors, Motes } from "@/components/story-kit";
import styles from "./member.module.css";
import { MEMBERS, COMPANY_NAME, type Member } from "@/lib/members";
import { TEAM_UI } from "@/lib/dictionary";
import { t, type Locale } from "@/lib/i18n";
import type {
  PublicTeamMemberDetail,
  PublicTeamMemberListItem,
} from "@/server/api/team-members";

const PUBLIC_SELECTOR_TINTS = [
  "var(--color-gold)",
  "var(--color-sunset)",
  "var(--color-lotus)",
  "var(--color-jade)",
  "var(--color-terracotta)",
  "var(--color-azure)",
];

const MIN_MEMBER_LOADING_MS = 1500;

function PublicMemberSelector({
  locale,
  members,
}: {
  locale: Locale;
  members: PublicTeamMemberListItem[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicTeamMemberDetail | null>(null);
  const [previousDetail, setPreviousDetail] = useState<PublicTeamMemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"not-found" | "load" | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedIndex = members.findIndex((member) => member.id === selectedId);
  const selectedSummary = selectedIndex >= 0 ? members[selectedIndex] : null;
  const tint = selectedIndex >= 0
    ? PUBLIC_SELECTOR_TINTS[selectedIndex % PUBLIC_SELECTOR_TINTS.length]
    : "var(--color-gold)";

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    gsap.killTweensOf(audio);
    audio.pause();
    audio.currentTime = 0;
    audioRef.current = null;
  }, []);

  const playAudio = useCallback((url: string | null) => {
    stopAudio();
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    void audio.play().then(() => {
      if (audioRef.current !== audio) return;
      gsap.to(audio, {
        volume: 0.42,
        duration: 1.1,
        ease: "power2.out",
      });
    }).catch(() => {
      // Browser autoplay/media failures must not hide an otherwise valid profile.
      if (audioRef.current === audio) audioRef.current = null;
    });
  }, [stopAudio]);

  const loadDetail = useCallback(async (id: string) => {
    const requestId = ++requestRef.current;
    const loadingStartedAt = Date.now();
    selectedIdRef.current = id;
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setDetail(null);
    stopAudio();

    const result = await fetchPublicTeamMemberDetail(id);

    const remaining = Math.max(
      0,
      MIN_MEMBER_LOADING_MS - (Date.now() - loadingStartedAt),
    );
    if (remaining > 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, remaining);
      });
    }

    // A slower response for member A must never overwrite member B after the
    // visitor has already changed selection.
    if (requestId !== requestRef.current || selectedIdRef.current !== id) return;

    setLoading(false);

    if (!result.ok) {
      setDetail(null);
      if (result.status === 404) setPreviousDetail(null);
      setError(result.status === 404 ? "not-found" : "load");
      return;
    }

    if (result.data.id !== id) {
      setDetail(null);
      setPreviousDetail(null);
      setError("load");
      return;
    }

    setDetail(result.data);
    playAudio(result.data.audioUrl);
  }, [playAudio, stopAudio]);

  const choose = useCallback((id: string) => {
    if (id === selectedIdRef.current && (loading || detail)) return;
    if (detail) setPreviousDetail(detail);
    void loadDetail(id);
  }, [detail, loadDetail, loading]);

  useEffect(() => {
    if (!previousDetail) return;
    const timeout = window.setTimeout(() => setPreviousDetail(null), 480);
    return () => window.clearTimeout(timeout);
  }, [previousDetail]);

  useEffect(() => {
    const content = contentRef.current;
    const profile = profileRef.current;
    if (!content || !profile) return;

    const updateOffset = () => {
      content.style.setProperty("--member-profile-height", `${profile.offsetHeight}px`);
    };
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(content);
    observer.observe(profile);
    return () => observer.disconnect();
  }, [detail?.id]);

  useEffect(() => {
    rosterRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
      block: "nearest", inline: "nearest", behavior: "smooth",
    });
  }, [selectedId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey || members.length === 0) return;

      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) return;

      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportMid = window.innerHeight / 2;
      if (rect.top > viewportMid || rect.bottom < viewportMid) return;

      const currentId = selectedIdRef.current;
      const currentIndex = members.findIndex((member) => member.id === currentId);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = currentIndex < 0
        ? (direction === 1 ? 0 : members.length - 1)
        : (currentIndex + direction + members.length) % members.length;

      event.preventDefault();
      choose(members[nextIndex].id);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, members]);

  useEffect(() => () => {
    requestRef.current += 1;
    stopAudio();
  }, [stopAudio]);

  const formatJoinedDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  };

  const rows: [string, string][] = detail
    ? [
        [t(TEAM_UI.fullName, locale), detail.fullName],
        [t(TEAM_UI.role, locale), detail.position ?? "—"],
        [t(TEAM_UI.jobLevel, locale), detail.jobLevel ?? "—"],
        [t(TEAM_UI.hometown, locale), detail.hometown ?? "—"],
        [t(TEAM_UI.hobbies, locale), detail.hobbies ?? "—"],
        [t(TEAM_UI.joinDate, locale), formatJoinedDate(detail.joinedDate)],
      ]
    : [];

  const centerMessage = loading
    ? t(TEAM_UI.detailLoading, locale)
    : error === "not-found"
      ? t(TEAM_UI.detailUnavailable, locale)
      : error === "load"
        ? t(TEAM_UI.detailLoadError, locale)
        : t(TEAM_UI.introBody, locale);

  return (
    <section
      ref={sectionRef}
      id="members"
      style={{ ["--tint" as string]: tint }}
      className={`${styles.stage} relative isolate w-full overflow-hidden bg-ink`}
    >
      {previousDetail?.backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previousDetail.backgroundUrl}
          alt=""
          aria-hidden
          className="pixelated absolute inset-0 -z-30 h-full w-full object-cover"
        />
      ) : null}
      {detail?.backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`bg-${detail.id}`}
          src={detail.backgroundUrl}
          alt={`${detail.hometown ?? ""} — ${t(TEAM_UI.hometownAlt, locale)} ${detail.fullName}`}
          className="pixelated absolute inset-0 -z-30 h-full w-full animate-layer-in object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-30 bg-ink [background:radial-gradient(circle_at_50%_42%,rgba(232,84,31,0.11),transparent_26%),radial-gradient(circle_at_18%_72%,rgba(251,196,92,0.07),transparent_24%)]"
        />
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-ink/40" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-l from-ink/90 via-ink/30 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-t from-ink via-ink/35 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_3px)]"
      />
      {!detail ? (
        <>
          <Meteors />
          <Motes />
        </>
      ) : null}

      <div ref={contentRef} className={styles.content}>
        {detail ? (
          <>
            <div className={styles.character}>
              <div
                aria-hidden
                className="absolute inset-0 blur-[90px]"
                style={{ background: `radial-gradient(ellipse at center, color-mix(in srgb, ${tint} 28%, transparent), transparent 70%)` }}
              />
              <div aria-hidden className="absolute bottom-0 left-1/2 h-8 w-2/5 -translate-x-1/2 rounded-[50%] bg-black/55 blur-2xl" />
              {previousDetail?.avatarUrl ? (
                <MemberSprite
                  key={`previous-${previousDetail.id}`}
                  animationUrl={null}
                  avatarUrl={previousDetail.avatarUrl}
                  alt=""
                  trimTransparent
                  className={`${styles.sprite} animate-layer-out`}
                />
              ) : null}
              <MemberSprite
                key={`ch-${detail.id}`}
                animationUrl={detail.animationUrl}
                avatarUrl={detail.avatarUrl}
                alt={`${detail.fullName}${detail.position ? ` — ${detail.position}` : ""}`}
                trimTransparent
                className={`${styles.sprite} animate-layer-in drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)]`}
              />
            </div>
            <div ref={profileRef} className={styles.profile}>
              <div
                key={`info-${detail.id}`}
                className={`${styles.card} animate-layer-in`}
              >
                <div className="relative border border-cream/10 bg-ink/35 px-7 py-6 text-right font-pixel backdrop-blur-md [box-shadow:0_24px_70px_-24px_rgba(0,0,0,0.85)]">
                  <span
                    aria-hidden
                    className="absolute inset-y-0 right-0 w-[3px]"
                    style={{ background: tint, boxShadow: `0 0 16px ${tint}` }}
                  />
                  <span
                    aria-hidden
                    className="absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2"
                    style={{ borderColor: tint }}
                  />
                  <span
                    aria-hidden
                    className="absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2"
                    style={{ borderColor: tint }}
                  />

                  <div className="mb-5 flex items-center justify-end gap-2">
                    <span className="h-px flex-1 bg-cream/15" />
                    <span className="text-xs" style={{ color: tint }}>❖</span>
                  </div>

                  <div className="space-y-3 text-base sm:text-[17px]">
                    {rows.map(([label, value]) => (
                      <p key={label} className="leading-snug">
                        <span className="text-cream/65">{label}: </span>
                        <span className="font-medium text-cream">{value}</span>
                      </p>
                    ))}
                  </div>

                  {detail.personalQuote ? (
                    <div className="mt-5 border-t border-cream/10 pt-4">
                      <p className="text-sm text-cream/65">{t(TEAM_UI.motto, locale)}</p>
                      <p className="mt-1 text-base italic leading-snug text-cream sm:text-[17px]">
                        <span style={{ color: tint }}>“</span>
                        {detail.personalQuote}
                        <span style={{ color: tint }}>”</span>
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className={`${styles.brand} animate-hero-rise`}
                style={{ animationDelay: "0.12s" }}
              >
                <div
                  aria-hidden
                  className="ml-auto mb-4 h-[3px] w-20 transition-[background,box-shadow] duration-500 lg:w-28"
                  style={{ background: tint, boxShadow: `0 0 16px ${tint}` }}
                />
                <h1 className={`${styles.brandTitle} font-pixel font-light uppercase leading-[0.95] tracking-[0.04em] text-cream [text-shadow:0_3px_30px_rgba(0,0,0,0.8)]`}>
                  {COMPANY_NAME}
                </h1>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.intro}>
            <div className="pointer-events-auto relative w-full max-w-3xl animate-hero-rise">
              <div
                aria-hidden
                className="mx-auto mb-7 flex max-w-xs items-center gap-3 text-gold/75"
              >
                <span className="h-px flex-1 bg-current/50" />
                <span className="font-pixel text-sm uppercase tracking-[0.36em]">
                  {t(TEAM_UI.introEyebrow, locale)}
                </span>
                <span className="h-px flex-1 bg-current/50" />
              </div>

              <p
                aria-hidden
                className="absolute inset-x-0 -top-24 -z-10 select-none font-pixel text-[clamp(6rem,18vw,14rem)] uppercase leading-none tracking-[0.08em] text-cream/[0.025]"
              >
                VNZ
              </p>

              <h1 className="font-pixel text-[clamp(2.5rem,6vw,5.7rem)] uppercase leading-[0.9] tracking-[0.03em] text-cream [text-shadow:0_8px_35px_rgba(0,0,0,0.7)]">
                {selectedSummary?.fullName ?? t(TEAM_UI.introTitle, locale)}
              </h1>
              <p className="mx-auto mt-6 max-w-xl font-viet text-sm font-light leading-relaxed text-cream/60 sm:text-base">
                {centerMessage}
              </p>
              {error === "load" && selectedId ? (
                <button
                  type="button"
                  onClick={() => void loadDetail(selectedId)}
                  className="btn-pixel pointer-events-auto mt-6 px-5 py-2 font-pixel text-sm uppercase tracking-wider"
                >
                  {t(TEAM_UI.retry, locale)}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div
        className={`${styles.dock} animate-hero-rise`}
        style={{ animationDelay: "0.24s" }}
      >
        <p className="mb-3 flex flex-wrap items-center justify-center gap-x-2 text-center font-pixel text-sm text-cream/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
          {detail ? (
            <>
              <span className="font-semibold text-cream">{detail.fullName}</span>
              {detail.position ? (
                <>
                  <span className="text-cream/30">·</span>
                  <span style={{ color: tint }}>{detail.position}</span>
                </>
              ) : null}
              <span
                aria-hidden
                className="ml-1 inline-flex items-center gap-1 border border-cream/25 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-cream/65"
              >
                <kbd className="font-pixel">◄</kbd>
                <kbd className="font-pixel">►</kbd>
                <span>chuyển</span>
              </span>
            </>
          ) : (
            <span className="uppercase tracking-[0.16em] text-cream/55">
              {selectedSummary?.fullName ?? t(TEAM_UI.introHint, locale)}
            </span>
          )}
        </p>

        <div ref={rosterRef} className={`${styles.roster} border border-cream/10 bg-ink/45 backdrop-blur-md`}>
          {members.map((member, index) => {
            const isSelected = member.id === selectedId;
            const memberTint = PUBLIC_SELECTOR_TINTS[index % PUBLIC_SELECTOR_TINTS.length];

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => choose(member.id)}
                aria-pressed={isSelected}
                aria-label={`${member.fullName}${member.position ? ` — ${member.position}` : ""}`}
                style={{ ["--tint" as string]: memberTint }}
                className={`group relative h-14 w-14 shrink-0 overflow-hidden bg-[#0e1119] outline-none transition-all duration-150 ease-out focus-visible:-translate-y-1 sm:h-16 sm:w-16 ${
                  isSelected
                    ? "-translate-y-1.5 scale-105 shadow-[0_0_22px_3px_color-mix(in_srgb,var(--tint)_65%,transparent)]"
                    : "opacity-60 hover:-translate-y-1 hover:opacity-100"
                }`}
              >
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt=""
                    aria-hidden
                    className="pixelated h-full w-full object-cover object-top transition-transform duration-150 group-hover:scale-110"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-pixel text-xs uppercase text-cream/35">
                    VNZ
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                />
                <span
                  aria-hidden
                  className={`absolute inset-0 ${
                    isSelected
                      ? "shadow-[inset_0_0_0_2px_var(--color-cream),inset_0_0_0_4px_var(--tint)]"
                      : "shadow-[inset_0_0_0_1.5px_rgba(251,244,226,0.35)] group-hover:shadow-[inset_0_0_0_2px_rgba(251,244,226,0.75)]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Member({
  locale,
  members,
}: {
  locale: Locale;
  /** undefined = keep the current static bilingual roster/fallback. */
  members?: PublicTeamMemberListItem[];
}) {
  return members !== undefined
    ? <PublicMemberSelector locale={locale} members={members} />
    : <StaticMember locale={locale} />;
}

function StaticMember({ locale }: { locale: Locale }) {

  // The page opens in a neutral team-intro state. A member only becomes active
  // after an explicit click/keyboard action, which also gives us a legitimate
  // browser user gesture before starting that member's optional soundtrack.
  const [selected, setSelected] = useState<Member | null>(null);

  // Keep the outgoing member mounted for one crossfade so the hometown +
  // character dissolve between people instead of hard-cutting.
  const [previous, setPrevious] = useState<Member | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const choose = useCallback((m: Member) => {
    if (m.slug === selected?.slug) return;
    setPrevious(selected);
    setSelected(m);

    // Member audio is opt-in by selection only. Start playback at zero volume
    // inside the user gesture, then let the visual transition reveal it.
    const outgoing = audioRef.current;
    if (outgoing) {
      gsap.killTweensOf(outgoing);
      gsap.to(outgoing, {
        volume: 0,
        duration: 0.35,
        ease: "power2.out",
        onComplete: () => {
          outgoing.pause();
          if (audioRef.current === outgoing) audioRef.current = null;
        },
      });
    }

    if (!m.audioUrl) return;

    const incoming = new Audio(m.audioUrl);
    incoming.loop = true;
    incoming.volume = 0;
    audioRef.current = incoming;
    void incoming.play().then(() => {
      if (audioRef.current !== incoming) return;
      gsap.to(incoming, {
        volume: 0.42,
        duration: 1.1,
        delay: 0.55,
        ease: "power2.out",
      });
    }).catch(() => {
      if (audioRef.current === incoming) audioRef.current = null;
    });
  }, [selected]);

  // Drop the outgoing layer once its fade-out finishes.
  useEffect(() => {
    if (!previous) return;
    const t = window.setTimeout(() => setPrevious(null), 480);
    return () => window.clearTimeout(t);
  }, [previous]);

  // ───────── Keyboard navigation (← / →) ─────────
  // The stage section + a live mirror of the current selection. The keydown
  // listener is bound once (empty deps), so it must read the latest selection
  // from a ref rather than the stale `selected` captured at bind time.
  const sectionRef = useRef<HTMLElement>(null);
  const selectedRef = useRef<Member | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    // Step `dir` (+1 next / -1 prev) through the roster, wrapping around.
    const step = (dir: 1 | -1) => {
      const cur = selectedRef.current;
      if (!cur) {
        choose(dir === 1 ? MEMBERS[0] : MEMBERS[MEMBERS.length - 1]);
        return;
      }
      const i = MEMBERS.findIndex((m) => m.slug === cur.slug);
      const next = MEMBERS[(i + dir + MEMBERS.length) % MEMBERS.length];
      if (next.slug === cur.slug) return;
      choose(next);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Don't hijack arrows while typing in a field.
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      // Only drive the roster while the stage owns the viewport — otherwise the
      // user is up on the hero and arrows should behave normally.
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      if (r.top > mid || r.bottom < mid) return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      gsap.killTweensOf(audio);
      audio.pause();
    };
  }, []);

  // Warm the image cache in idle time so the first hover of each avatar
  // crossfades instantly instead of waiting on a multi-MB hometown PNG.
  useEffect(() => {
    const warm = () => {
      for (const m of MEMBERS) {
        new window.Image().src = m.hometownImg.src;
        new window.Image().src = m.img.src;
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(warm, 800);
    return () => window.clearTimeout(t);
  }, []);

  const tint = selected?.tint ?? "var(--color-gold)";

  // The profile reads as a "dossier" — six labeled lines + a motto footer.
  const rows: [string, string][] = selected
    ? [
        [t(TEAM_UI.fullName, locale), selected.fullName],
        [t(TEAM_UI.role, locale), t(selected.title, locale)],
        [t(TEAM_UI.hometown, locale), selected.hometown],
        [t(TEAM_UI.hobbies, locale), t(selected.hobbies, locale)],
        [t(TEAM_UI.joinDate, locale), selected.joinDate],
      ]
    : [];

  return (
    <section
      ref={sectionRef}
      id="members"
      style={{ ["--tint" as string]: tint }}
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-ink"
    >
      {/* ───────── Hometown backdrop (crossfades on select) ───────── */}
      {previous && (
        <Image
          key={`bg-${previous.slug}`}
          src={previous.hometownImg}
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="100vw"
          className="pixelated -z-30 object-cover"
        />
      )}
      {selected ? (
        <Image
          key={`bg-${selected.slug}`}
          src={selected.hometownImg}
          alt={`${selected.hometown} — ${t(TEAM_UI.hometownAlt, locale)} ${selected.fullName}`}
          fill
          unoptimized
          sizes="100vw"
          className="pixelated -z-30 animate-layer-in object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-30 bg-ink [background:radial-gradient(circle_at_50%_42%,rgba(232,84,31,0.11),transparent_26%),radial-gradient(circle_at_18%_72%,rgba(251,196,92,0.07),transparent_24%)]"
        />
      )}

      {/* ───────── Atmosphere: scrims · color-grade · vignette · scanlines ───────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-ink/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-l from-ink/90 via-ink/30 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-t from-ink via-ink/35 to-transparent"
      />
      {/* Ink crown — the stage opens in the same `ink` the hero dusk-fades to,
          so the section seam is one continuous dark band; it then dissolves to
          reveal the sky/tower as you scroll in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[34vh] bg-gradient-to-b from-ink via-ink/45 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_32%,transparent_44%,rgba(6,8,15,0.62)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_3px)]"
      />
      {!selected ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background:linear-gradient(rgba(251,244,226,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(251,244,226,0.14)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_50%_45%,#000_10%,transparent_72%)]"
        />
      ) : null}

      {/* ───────── Character (left): tint aura + soft ground shadow ─────────
          pointer-events-none so hovers pass through to the avatar dock. */}
      {selected ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {/* Spotlight aura — soft per-member colored halo the character stands in. */}
          <div
            aria-hidden
            className="absolute bottom-[6%] left-1/2 h-[62vh] w-[80vw] max-w-[34rem] -translate-x-1/2 blur-[90px] transition-[left,background] duration-500 lg:left-[25%]"
            style={{
              background: `radial-gradient(ellipse 50% 55% at 50% 50%, color-mix(in srgb, ${tint} 42%, transparent), transparent 72%)`,
            }}
          />
          {/* Soft elliptical ground shadow (replaces the hard offset shadow). */}
          <div
            aria-hidden
            className="absolute bottom-[2.5%] left-1/2 h-12 w-[19rem] max-w-[68vw] -translate-x-1/2 rounded-[50%] bg-black/55 blur-2xl lg:left-[25%] lg:bottom-[-16vh]"
          />
          {previous && (
            <Image
              key={`ch-${previous.slug}`}
              src={previous.img}
              alt=""
              aria-hidden
              unoptimized
              className="pixelated absolute bottom-0 left-1/2 h-[52vh] w-auto -translate-x-1/2 animate-layer-out drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:h-[60vh] lg:left-[25%] lg:h-[132vh] lg:bottom-[-44vh]"
            />
          )}
          <Image
            key={`ch-${selected.slug}`}
            src={selected.img}
            alt={`${selected.fullName} — ${t(selected.title, locale)}`}
            unoptimized
            className="pixelated absolute bottom-0 left-1/2 h-[52vh] w-auto -translate-x-1/2 animate-layer-in drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:h-[60vh] lg:left-[25%] lg:h-[132vh] lg:bottom-[-44vh]"
          />
        </div>
      ) : null}

      {/* ───────── Profile dossier (top-right) + brand (mid-right) ─────────
          Full-bleed wrapper is pointer-events-none so it never blocks the dock. */}
      <div className="pointer-events-none relative z-30 mx-auto min-h-[100svh] max-w-[1600px] px-6 sm:px-10">
        {selected ? (
          <>
            {/* Dossier panel — frosted glass, tint spine + corner ticks. */}
            <div
              key={`info-${selected.slug}`}
              className="pointer-events-auto ml-auto mt-20 w-full max-w-[25rem] animate-layer-in sm:mt-24 lg:absolute lg:right-[4%] lg:top-[15%] lg:mt-0"
            >
              <div className="relative border border-cream/10 bg-ink/35 px-7 py-6 text-right font-pixel backdrop-blur-md [box-shadow:0_24px_70px_-24px_rgba(0,0,0,0.85)]">
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-0 w-[3px]"
                  style={{ background: tint, boxShadow: `0 0 16px ${tint}` }}
                />
                <span
                  aria-hidden
                  className="absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2"
                  style={{ borderColor: tint }}
                />
                <span
                  aria-hidden
                  className="absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2"
                  style={{ borderColor: tint }}
                />

                <div className="mb-5 flex items-center justify-end gap-2">
                  <span className="h-px flex-1 bg-cream/15" />
                  <span className="text-xs" style={{ color: tint }}>
                    ❖
                  </span>
                </div>

                <div className="space-y-3 text-base sm:text-[17px]">
                  {rows.map(([label, value]) => (
                    <p key={label} className="leading-snug">
                      <span className="text-cream/65">{label}: </span>
                      <span className="font-medium text-cream">{value}</span>
                    </p>
                  ))}
                </div>

                <div className="mt-5 border-t border-cream/10 pt-4">
                  <p className="text-sm text-cream/65">{t(TEAM_UI.motto, locale)}</p>
                  <p className="mt-1 text-base italic leading-snug text-cream sm:text-[17px]">
                    <span style={{ color: tint }}>“</span>
                    {t(selected.motto, locale)}
                    <span style={{ color: tint }}>”</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Brand — mid-right, constant copy, tint accent follows the member. */}
            <div
              className="ml-auto mt-12 max-w-3xl animate-hero-rise pb-44 text-right sm:mt-16 lg:absolute lg:right-[4%] lg:top-[63%] lg:mt-0 lg:max-w-none lg:pb-0"
              style={{ animationDelay: "0.12s" }}
            >
              <div
                aria-hidden
                className="ml-auto mb-4 h-[3px] w-20 transition-[background,box-shadow] duration-500 lg:w-28"
                style={{ background: tint, boxShadow: `0 0 16px ${tint}` }}
              />
              <h1 className="font-pixel text-4xl font-light uppercase leading-[0.95] tracking-[0.04em] text-cream [text-shadow:0_3px_30px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-[4.2rem] lg:whitespace-nowrap">
                {COMPANY_NAME}
              </h1>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 pb-36 pt-24 text-center sm:pb-40">
            <div className="pointer-events-auto relative w-full max-w-3xl animate-hero-rise">
              <div
                aria-hidden
                className="mx-auto mb-7 flex max-w-xs items-center gap-3 text-gold/75"
              >
                <span className="h-px flex-1 bg-current/50" />
                <span className="font-pixel text-sm uppercase tracking-[0.36em]">
                  {t(TEAM_UI.introEyebrow, locale)}
                </span>
                <span className="h-px flex-1 bg-current/50" />
              </div>

              <p
                aria-hidden
                className="absolute inset-x-0 -top-24 -z-10 select-none font-pixel text-[clamp(6rem,18vw,14rem)] uppercase leading-none tracking-[0.08em] text-cream/[0.025]"
              >
                VNZ
              </p>

              <h1 className="font-pixel text-[clamp(2.5rem,6vw,5.7rem)] uppercase leading-[0.9] tracking-[0.03em] text-cream [text-shadow:0_8px_35px_rgba(0,0,0,0.7)]">
                {t(TEAM_UI.introTitle, locale)}
              </h1>
              <p className="mx-auto mt-6 max-w-xl font-viet text-sm font-light leading-relaxed text-cream/60 sm:text-base">
                {t(TEAM_UI.introBody, locale)}
              </p>

              <div className="mt-8 inline-flex items-center gap-3 border border-cream/15 bg-ink/35 px-4 py-2 font-pixel text-sm uppercase tracking-[0.18em] text-cream/65 backdrop-blur-sm">
                <span aria-hidden className="text-gold">◆</span>
                {t(TEAM_UI.introHint, locale)}
                <span aria-hidden className="text-gold">↓</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───────── Avatar dock (bottom, centered) ───────── */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 animate-hero-rise px-4 pb-25 pt-8 sm:px-8"
        style={{ animationDelay: "0.24s" }}
      >
        {/* Caption naming the on-stage member. */}
        <p className="mb-3 flex flex-wrap items-center justify-center gap-x-2 text-center font-pixel text-sm text-cream/70 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]">
          {selected ? (
            <>
              <span className="font-semibold text-cream">{selected.fullName}</span>
              <span className="text-cream/30">·</span>
              <span style={{ color: tint }}>{t(selected.title, locale)}</span>
              <span
                aria-hidden
                className="ml-1 inline-flex items-center gap-1 border border-cream/25 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-cream/65"
              >
                <kbd className="font-pixel">◄</kbd>
                <kbd className="font-pixel">►</kbd>
                <span>chuyển</span>
              </span>
            </>
          ) : (
            <span className="uppercase tracking-[0.16em] text-cream/55">
              {t(TEAM_UI.introHint, locale)}
            </span>
          )}
        </p>
        {/* Frosted dock holding the roster. */}
        <div className="mx-auto flex w-fit max-w-full flex-wrap items-end justify-center gap-2.5 border border-cream/10 bg-ink/45 px-3 py-3 backdrop-blur-md sm:gap-3 sm:px-4">
          {MEMBERS.map((m) => {
            const isSel = m.slug === selected?.slug;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => choose(m)}
                aria-pressed={isSel}
                aria-label={`${m.fullName} — ${t(m.title, locale)}`}
                style={{ ["--tint" as string]: m.tint }}
                className={`group relative h-14 w-14 shrink-0 overflow-hidden bg-[#0e1119] outline-none transition-all duration-150 ease-out focus-visible:-translate-y-1 sm:h-16 sm:w-16 ${
                  isSel
                    ? "-translate-y-1.5 scale-105 shadow-[0_0_22px_3px_color-mix(in_srgb,var(--tint)_65%,transparent)]"
                    : "opacity-60 hover:-translate-y-1 hover:opacity-100"
                }`}
              >
                <Image
                  src={m.img}
                  alt=""
                  aria-hidden
                  fill
                  unoptimized
                  sizes="64px"
                  style={{ objectPosition: "center top" }}
                  className="pixelated object-cover transition-transform duration-150 group-hover:scale-110"
                />
                {/* Subtle bottom shade so dark clothing doesn't merge into the dock. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                />
                {/* Pixel frame — faint cream default, bright cream+tint when selected. */}
                <span
                  aria-hidden
                  className={`absolute inset-0 ${
                    isSel
                      ? "shadow-[inset_0_0_0_2px_var(--color-cream),inset_0_0_0_4px_var(--tint)]"
                      : "shadow-[inset_0_0_0_1.5px_rgba(251,244,226,0.35)] group-hover:shadow-[inset_0_0_0_2px_rgba(251,244,226,0.75)]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
