import Image from "next/image";
import PixelTransition from "@/components/bits/PixelTransition";
import { MEMBERS, departmentOf } from "@/lib/members";
import { TEAM_UI } from "@/lib/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";
import type {
  PublicFeaturedTeamMember,
  PublicFeaturedTeamMembersResponse,
} from "@/server/api/team-members";

const PREVIEW_COUNT = 6;
const PUBLIC_TINTS = [
  "var(--color-gold)",
  "var(--color-sunset)",
  "var(--color-lotus)",
  "var(--color-jade)",
  "var(--color-terracotta)",
  "var(--color-azure)",
];

function PublicMemberCard({
  member,
  index,
  locale,
}: {
  member: PublicFeaturedTeamMember;
  index: number;
  locale: Locale;
}) {
  const tint = PUBLIC_TINTS[index % PUBLIC_TINTS.length];
  const displayName = member.displayName?.trim() || member.fullName;
  const hasDisplayName = Boolean(member.displayName?.trim());

  return (
    <li
      style={{ ["--tint" as string]: tint }}
      className="group relative flex w-[15rem] shrink-0 flex-col overflow-hidden border border-ink/15 paper-card transition-colors duration-300 hover:border-[color:var(--tint)] sm:w-[17rem]"
    >
      <PixelTransition
        className="aspect-[3/4] w-full"
        aspectRatio="0%"
        gridSize={9}
        pixelColor={tint}
        animationStepDuration={0.32}
        firstContent={
          <>
            {member.backgroundUrl ? (
              // Public media can live on any configured backend/CDN, so do not
              // couple this API contract to Next Image remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.backgroundUrl}
                alt={`${t(TEAM_UI.hometownAlt, locale)} ${member.hometown ?? member.fullName}`}
                className="pixelated absolute inset-0 h-full w-full scale-105 object-cover opacity-40"
              />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-ink-navy" />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/25 to-ink-navy"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.22)_0_1px,transparent_1px_3px)]"
            />
            <div className="ground-shadow absolute inset-x-0 bottom-0 flex h-[86%] items-end justify-center">
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatarUrl}
                  alt={member.fullName}
                  className="pixelated h-full w-auto object-contain object-bottom"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-pixel text-4xl uppercase text-cream/25">
                  VNZ
                </div>
              )}
            </div>
            {member.jobLevel ? (
              <span className="absolute left-2 top-2 border border-cream/20 bg-ink/80 px-2 py-1 font-pixel text-xs uppercase leading-none tracking-[0.15em] text-[color:var(--tint)] backdrop-blur-sm">
                {member.jobLevel}
              </span>
            ) : null}
          </>
        }
        secondContent={
          <>
            {member.backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.backgroundUrl}
                alt=""
                className="pixelated absolute inset-0 h-full w-full scale-110 object-cover"
              />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-ink-navy" />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              <p className="font-ui text-[10px] uppercase tracking-[0.28em] text-gold">
                {t(TEAM_UI.hometownLabel, locale)}
              </p>
              <p className="mt-1 font-viet text-2xl font-semibold leading-none text-cream">
                {member.hometown ?? "—"}
              </p>
            </div>
          </>
        }
      />

      <div className="relative flex flex-1 flex-col gap-1 px-4 pb-5 pt-3">
        <h3 className={`${hasDisplayName ? "font-pixel uppercase" : "font-viet font-semibold"} text-2xl leading-none text-ink`}>
          {displayName}
        </h3>
        <p className="font-viet text-sm font-medium leading-snug tint-text">
          {member.position ?? "—"}
        </p>
        <p className="font-viet text-xs font-light leading-snug text-ink-soft">
          {member.fullName}
        </p>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-[color:var(--tint)] transition-[width] duration-500 group-hover:w-full [box-shadow:0_0_16px_var(--tint)]"
        />
      </div>
    </li>
  );
}

function StaticMemberCards({ locale }: { locale: Locale }) {
  return MEMBERS.slice(0, PREVIEW_COUNT).map((m) => (
    <li
      key={m.slug}
      style={{ ["--tint" as string]: m.tint }}
      className="group relative flex w-[15rem] shrink-0 flex-col overflow-hidden border border-ink/15 paper-card transition-colors duration-300 hover:border-[color:var(--tint)] sm:w-[17rem]"
    >
      <PixelTransition
        className="aspect-[3/4] w-full"
        aspectRatio="0%"
        gridSize={9}
        pixelColor={m.tint}
        animationStepDuration={0.32}
        firstContent={
          <>
            <Image
              src={m.hometownImg}
              alt={`${t(TEAM_UI.hometownAlt, locale)} ${m.hometown}`}
              fill
              unoptimized
              sizes="17rem"
              className="pixelated scale-105 object-cover opacity-40"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/25 to-ink-navy"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 mix-blend-multiply [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.22)_0_1px,transparent_1px_3px)]"
            />
            <div className="ground-shadow absolute inset-x-0 bottom-0 flex h-[86%] items-end justify-center">
              <Image
                src={m.img}
                alt={m.fullName}
                unoptimized
                className="pixelated h-full w-auto object-contain object-bottom"
              />
            </div>
            {m.seniority ? (
              <span className="absolute left-2 top-2 border border-cream/20 bg-ink/80 px-2 py-1 font-pixel text-xs uppercase leading-none tracking-[0.15em] text-[color:var(--tint)] backdrop-blur-sm">
                {m.seniority}
              </span>
            ) : null}
            <span className="absolute right-2 top-2 font-pixel text-xs uppercase tracking-[0.15em] text-cream/60">
              {t(departmentOf(m.title), locale)}
            </span>
          </>
        }
        secondContent={
          <>
            <Image
              src={m.hometownImg}
              alt=""
              fill
              unoptimized
              sizes="17rem"
              className="pixelated scale-110 object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 text-left">
              <p className="font-ui text-[10px] uppercase tracking-[0.28em] text-gold">
                {t(TEAM_UI.hometownLabel, locale)}
              </p>
              <p className="mt-1 font-pixel text-2xl uppercase leading-none text-cream">
                {m.hometown}
              </p>
            </div>
          </>
        }
      />

      <div className="relative flex flex-1 flex-col gap-1 px-4 pb-5 pt-3">
        <h3 className="font-pixel text-2xl uppercase leading-none text-ink">{m.name}</h3>
        <p className="font-viet text-sm font-medium leading-snug tint-text">
          {t(m.title, locale)}
        </p>
        <p className="font-viet text-xs font-light leading-snug text-ink-soft">
          {m.fullName}
        </p>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] w-0 bg-[color:var(--tint)] transition-[width] duration-500 group-hover:w-full [box-shadow:0_0_16px_var(--tint)]"
        />
      </div>
    </li>
  ));
}

export function TeamStrip({
  locale,
  featuredTeam,
}: {
  locale: Locale;
  /** undefined keeps the existing static bilingual roster (English/fallback). */
  featuredTeam?: PublicFeaturedTeamMembersResponse;
}) {
  const isPublicMode = featuredTeam !== undefined;
  const publicMembers = featuredTeam?.items ?? [];
  const staticRemaining = Math.max(MEMBERS.length - PREVIEW_COUNT, 0);
  const remaining = isPublicMode
    ? Math.max((featuredTeam?.total ?? 0) - publicMembers.length, 0)
    : staticRemaining;

  return (
    <ul className="hstrip mx-auto max-w-[100rem] list-none pb-4">
      {isPublicMode
        ? publicMembers.map((member, index) => (
            <PublicMemberCard key={member.id} member={member} index={index} locale={locale} />
          ))
        : <StaticMemberCards locale={locale} />}

      <li className="shrink-0">
        <a
          href={localePath("/doi-ngu", locale)}
          className="group flex h-full w-[15rem] flex-col items-center justify-center gap-3 border border-dashed border-ink/25 paper-card px-6 text-center transition-colors duration-300 hover:border-ember sm:w-[17rem]"
        >
          <span className="font-pixel text-5xl leading-none text-ink-soft/50 transition-colors duration-300 group-hover:text-ember">
            +{remaining}
          </span>
          <span className="font-pixel text-xl uppercase leading-tight text-ink-soft transition-colors duration-300 group-hover:text-ink">
            {t(TEAM_UI.seeAllLine1, locale)}
            <br />
            {t(TEAM_UI.seeAllLine2, locale)}
          </span>
          <span className="font-viet text-xs font-light text-ink-soft/70">
            {remaining} {t(TEAM_UI.moreMembers, locale)}
          </span>
          <span
            aria-hidden
            className="font-pixel text-lg text-ember opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            ▸
          </span>
        </a>
      </li>
    </ul>
  );
}
