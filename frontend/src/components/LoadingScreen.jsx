export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ fontSize: 12 }}>{label}</span>
    </div>
  )
}

/** Inline placeholder for cards whose data is still resolving. */
export function CardSkeleton({ height = 120 }) {
  return <div className="skeleton" style={{ height }} />
}
