export default function Logo({ size = 40, showTagline = false, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
        <defs>
          <linearGradient id="dropletGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E6E8E" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>

        <path
          d="M50 8 C50 8 20 42 20 62 C20 79 33 90 50 90 C67 90 80 79 80 62 C80 42 50 8 50 8 Z"
          fill="none"
          stroke="url(#dropletGradient)"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <line x1="50" y1="52" x2="50" y2="72" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" />

        <path d="M50 58 C50 58 38 54 36 44 C48 44 50 58 50 58 Z" fill="var(--accent)" />
        <path d="M50 52 C50 52 62 48 64 38 C52 38 50 52 50 52 Z" fill="var(--accent)" />

        <g stroke="#7A5C42" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M50 72 L50 84" />
          <path d="M50 76 L40 84" />
          <path d="M50 76 L60 84" />
          <path d="M50 80 L34 90" />
          <path d="M50 80 L66 90" />
          <path d="M45 78 L38 88" />
          <path d="M55 78 L62 88" />
        </g>
      </svg>

      {showWordmark && (
        <div>
          <p
            className="text-2xl font-semibold lowercase text-[var(--text-primary)] leading-none"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            roots
          </p>
          {showTagline && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">smart irrigation, rooted in nature</p>
          )}
        </div>
      )}
    </div>
  );
}