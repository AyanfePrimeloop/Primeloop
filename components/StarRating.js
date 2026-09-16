function Star() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5l1.98 4.13 4.52.62-3.28 3.19.8 4.56L8 11.77 3.98 14l.8-4.56L1.5 6.25l4.52-.62L8 1.5z" />
    </svg>
  );
}

export default function StarRating({ count = 5, color = '#8a6a1c' }) {
  return (
    <div className="stars" style={{ display: 'flex', gap: 2, color }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} />
      ))}
    </div>
  );
}
