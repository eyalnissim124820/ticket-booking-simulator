import type { SVGProps } from 'react'

/** One line-drawn icon set, used everywhere in place of emoji.
 *  Every glyph inherits currentColor and sits on a 24×24 grid. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconPlane = (p: IconProps) => (
  <Icon {...p}><path d="M3 13.5 21 5l-4.2 8.6.9 5.9-2.6-1.4-2.8 2.6-.7-4.4-6-1.2Z" /></Icon>
)
export const IconBed = (p: IconProps) => (
  <Icon {...p}><path d="M3 18v-8m0 4h18m0 4v-6a2 2 0 0 0-2-2H9v4M6.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /></Icon>
)
export const IconChart = (p: IconProps) => (
  <Icon {...p}><path d="M4 19V6m0 13h16M7.5 15l3.2-4 3 2.4L20 7" /></Icon>
)
export const IconSearch = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></Icon>
)
export const IconFilter = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Icon>
)
export const IconStar = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7 1 5.3-4.7-2.6-4.7 2.6 1-5.3L4.5 9.6l5.2-.7L12 4Z" />
  </Icon>
)
export const IconHeart = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-9a3.9 3.9 0 0 1 7-2.4A3.9 3.9 0 0 1 19 11c0 4.6-7 9-7 9Z" />
  </Icon>
)
export const IconCheck = (p: IconProps) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Icon>
)
export const IconClose = (p: IconProps) => (
  <Icon {...p}><path d="m6 6 12 12M18 6 6 18" /></Icon>
)
export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
)
export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}><path d="m14 6-6 6 6 6" /></Icon>
)
export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}><path d="m10 6 6 6-6 6" /></Icon>
)
export const IconCalendar = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></Icon>
)
export const IconUsers = (p: IconProps) => (
  <Icon {...p}><path d="M15.5 20v-1.5a3.5 3.5 0 0 0-3.5-3.5H7a3.5 3.5 0 0 0-3.5 3.5V20M9.5 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20.5 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 5.2a3.25 3.25 0 0 1 0 6.1" /></Icon>
)
export const IconWallet = (p: IconProps) => (
  <Icon {...p}><path d="M19 8V6.5A1.5 1.5 0 0 0 17.5 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19h12a1.5 1.5 0 0 0 1.5-1.5V16M20 8h-4a2 2 0 0 0 0 4h4V8Z" /></Icon>
)
export const IconGlobe = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2 2.4 3 5 3 8s-1 5.6-3 8c-2-2.4-3-5-3-8s1-5.6 3-8Z" /></Icon>
)
export const IconPlus = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const IconMinus = (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>
export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}><path d="M4 12h15m-5.5-5.5L19 12l-5.5 5.5" /></Icon>
)
export const IconArrowUp = (p: IconProps) => (
  <Icon {...p}><path d="M12 19V5m-5.5 5.5L12 5l5.5 5.5" /></Icon>
)
export const IconArrowDown = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14m5.5-5.5L12 19l-5.5-5.5" /></Icon>
)
export const IconClock = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 1.8" /></Icon>
)
export const IconLuggage = (p: IconProps) => (
  <Icon {...p}><rect x="5" y="7.5" width="14" height="12.5" rx="2" /><path d="M9 7.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2.5M9.5 11v5.5M14.5 11v5.5" /></Icon>
)
export const IconBackpack = (p: IconProps) => (
  <Icon {...p}><path d="M6 20V11a6 6 0 0 1 12 0v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" /><path d="M9.5 8V6a2.5 2.5 0 0 1 5 0v2M9 15h6" /></Icon>
)
export const IconLeaf = (p: IconProps) => (
  <Icon {...p}><path d="M5 19c0-8 5-12 14-12 0 9-4.5 13-14 12Zm3-3 6.5-6.5" /></Icon>
)
export const IconPause = (p: IconProps) => (
  <Icon {...p}><path d="M9.5 5.5v13M14.5 5.5v13" /></Icon>
)
export const IconPlay = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none"><path d="M8 5.5 19 12 8 18.5v-13Z" /></Icon>
)
export const IconTicket = (p: IconProps) => (
  <Icon {...p}><path d="M4 9V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a2.5 2.5 0 0 0 0 5v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2.5 2.5 0 0 0 0-5ZM13 6v12" strokeDasharray="0 0" /></Icon>
)
export const IconBell = (p: IconProps) => (
  <Icon {...p}><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10ZM10.2 19a2 2 0 0 0 3.6 0" /></Icon>
)
export const IconInfo = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></Icon>
)
export const IconAlert = (p: IconProps) => (
  <Icon {...p}><path d="M12 4.5 21 19.5H3L12 4.5ZM12 10v4M12 17h.01" /></Icon>
)
export const IconTarget = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></Icon>
)
export const IconMapPin = (p: IconProps) => (
  <Icon {...p}><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.4" /></Icon>
)

/* -- amenity glyphs ------------------------------------------------------- */
export const IconWifi = (p: IconProps) => (
  <Icon {...p}><path d="M3.5 9.5a13 13 0 0 1 17 0M6.5 13a8.5 8.5 0 0 1 11 0M9.5 16.4a4 4 0 0 1 5 0M12 19.5h.01" /></Icon>
)
export const IconCoffee = (p: IconProps) => (
  <Icon {...p}><path d="M4 9h13v5.5A4.5 4.5 0 0 1 12.5 19h-4A4.5 4.5 0 0 1 4 14.5V9ZM17 10.5h1.5a2.25 2.25 0 0 1 0 4.5H17M7 5.5V3.5M11 5.5V3.5" /></Icon>
)
export const IconPool = (p: IconProps) => (
  <Icon {...p}><path d="M3 17.5c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2M8 16V6.5a2 2 0 0 1 4 0M16 16V6.5a2 2 0 0 0-4 0M8 10h8" /></Icon>
)
export const IconGym = (p: IconProps) => (
  <Icon {...p}><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" /></Icon>
)
export const IconSpa = (p: IconProps) => (
  <Icon {...p}><path d="M12 21c0-5 2.6-9 8-11-1 6-4 9-8 11Zm0 0c0-5-2.6-9-8-11 1 6 4 9 8 11Zm0-11c1.6-1.6 1.6-4.4 0-6-1.6 1.6-1.6 4.4 0 6Z" /></Icon>
)
export const IconParking = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M10 16.5v-9h3a2.75 2.75 0 0 1 0 5.5h-3" /></Icon>
)
export const IconKitchen = (p: IconProps) => (
  <Icon {...p}><path d="M4.5 11h15M6 11a6 6 0 0 1 12 0M8 15h8M9.5 19h5" /></Icon>
)
export const IconSnow = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /></Icon>
)
export const IconPet = (p: IconProps) => (
  <Icon {...p}><path d="M12 20c-2.8 0-4.6-1.7-4.6-3.6 0-2 2-2.6 2.9-4 .8-1.2 1-2.1 1.7-2.1s.9.9 1.7 2.1c.9 1.4 2.9 2 2.9 4C16.6 18.3 14.8 20 12 20Z" /><circle cx="6.2" cy="9.6" r="1.7" /><circle cx="17.8" cy="9.6" r="1.7" /><circle cx="9.6" cy="5.6" r="1.7" /><circle cx="14.4" cy="5.6" r="1.7" /></Icon>
)
export const IconDesk = (p: IconProps) => (
  <Icon {...p}><rect x="3.5" y="5.5" width="17" height="10.5" rx="1.5" /><path d="M8 20h8" /></Icon>
)
export const IconBar = (p: IconProps) => (
  <Icon {...p}><path d="M5 5h14l-7 7.5V19M9 19h6M14.5 8.5 19 5" /></Icon>
)
export const IconBeach = (p: IconProps) => (
  <Icon {...p}><path d="M3 19.5h18M12 19.5V9M12 9C9 5.5 5.5 6.5 4 9c2.5-.8 5.5-.5 8 0Zm0 0c3-3.5 6.5-2.5 8 0-2.5-.8-5.5-.5-8 0Z" /></Icon>
)

export const AMENITY_ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  wifi: IconWifi,
  breakfast: IconCoffee,
  pool: IconPool,
  gym: IconGym,
  spa: IconSpa,
  parking: IconParking,
  kitchen: IconKitchen,
  ac: IconSnow,
  pets: IconPet,
  workspace: IconDesk,
  bar: IconBar,
  beach: IconBeach,
}
