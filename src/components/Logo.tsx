export default function Logo({
  size = 32,
  gradientId,
}: {
  size?: number;
  gradientId: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ flex: "none", display: "block" }}
      aria-label="LipaHuru"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="4"
          y1="4"
          x2="44"
          y2="44"
        >
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="17.5" y="3" width="13" height="13" rx="3.6" fill={`url(#${gradientId})`} />
      <rect x="3" y="17.5" width="13" height="13" rx="3.6" fill="#fbbf24" opacity=".42" />
      <rect x="32" y="17.5" width="13" height="13" rx="3.6" fill="#f97316" opacity=".62" />
      <rect x="17.5" y="32" width="13" height="13" rx="3.6" fill="#fbbf24" opacity=".28" />
    </svg>
  );
}
