// Responsive stock photo with explicit dimensions (no layout shift).
// `name` is the file stem in /public/images, e.g. "client-owner".
export default function Photo({ name, alt, width, height, priority = false, position = '50% 35%', sizes = '(max-width: 860px) 100vw, 480px', style, className }) {
  return (
    <img
      className={className}
      src={`/images/${name}-1200.jpg`}
      srcSet={`/images/${name}-640.jpg 640w, /images/${name}-1200.jpg 1200w`}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={priority ? 'high' : undefined}
      style={{ objectPosition: position, ...style }}
    />
  );
}
