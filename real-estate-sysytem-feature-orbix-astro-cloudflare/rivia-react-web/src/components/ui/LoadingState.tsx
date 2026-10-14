export function LoadingState({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <div className="state state-loading">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

