export default function Logo({ size = 32, light = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="44" fill={light ? 'rgba(255,255,255,0.12)' : '#1c2340'} />
      <circle cx="100" cy="100" r="56" fill="none" stroke={light ? 'rgba(255,255,255,0.25)' : '#2a335c'} strokeWidth="16" />
      <circle
        cx="100" cy="100" r="56" fill="none" stroke="#e0632b" strokeWidth="16"
        strokeLinecap="round" strokeDasharray="263 352" transform="rotate(-90 100 100)"
      />
      <polygon points="38,86 38,114 18,100" fill="#e0632b" />
    </svg>
  );
}
