export function SkeletonLoader({ rows = 3 }) {
  const widths = ['55%', '70%', '45%', '60%', '80%', '50%'];
  return (
    <div style={{ padding: '16px' }}>
      <div className="skeleton skeleton-title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}
