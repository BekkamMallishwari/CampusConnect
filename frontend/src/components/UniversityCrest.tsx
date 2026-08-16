interface UniversityCrestProps {
  size?: number;
  className?: string;
}

export default function UniversityCrest({ size = 44, className = '' }: UniversityCrestProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer concentric decorative dashed/dotted border */}
      <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Main outer ring */}
      <circle cx="50" cy="50" r="43" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="34" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      
      {/* Curved text effect or decorative ring ticks */}
      <circle cx="50" cy="50" r="38.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="1.5 2" />

      {/* Central Shield */}
      <path
        d="M50 20 L68 28 V50 C68 64 50 78 50 78 C50 78 32 64 32 50 V28 L50 20 Z"
        fill="rgba(8, 33, 77, 0.7)"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Shield Accent */}
      <path
        d="M50 24 L64 30.5 V49 C64 60 50 72 50 72 C50 72 36 60 36 49 V30.5 L50 24 Z"
        stroke="rgba(56, 189, 248, 0.6)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* 4-Point Star / Compass in Center */}
      {/* Vertical needle */}
      <polygon points="50,28 53,49 50,70 47,49" fill="#38BDF8" opacity="0.9" />
      <polygon points="50,28 50,70 47,49" fill="#0284C7" />
      {/* Horizontal needle */}
      <polygon points="29,49 49,46 69,49 49,52" fill="#E0F2FE" opacity="0.9" />
      <polygon points="29,49 69,49 49,52" fill="#BAE6FD" />
      
      {/* Diagonal subtle rays */}
      <polygon points="38,37 50,47 62,57" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="62,37 50,47 38,57" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      {/* Center Pivot Circle */}
      <circle cx="50" cy="49" r="3.5" fill="#FFFFFF" />
      <circle cx="50" cy="49" r="1.5" fill="#0369A1" />
      
      {/* Small Stars / Crest Details */}
      <circle cx="50" cy="14" r="1.5" fill="rgba(255,255,255,0.8)" />
      <circle cx="24" cy="50" r="1.5" fill="rgba(255,255,255,0.8)" />
      <circle cx="76" cy="50" r="1.5" fill="rgba(255,255,255,0.8)" />
      <circle cx="50" cy="85" r="1.5" fill="rgba(255,255,255,0.8)" />
    </svg>
  );
}
