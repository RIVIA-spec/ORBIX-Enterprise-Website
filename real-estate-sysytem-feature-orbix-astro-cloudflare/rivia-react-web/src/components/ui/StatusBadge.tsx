interface StatusBadgeProps {
  status: string;
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray' | 'amber' | 'success';
}

function normalizeTone(status: string, tone?: StatusBadgeProps['tone']) {
  if (tone === 'success') return 'green';
  if (tone) return tone;

  const value = status.toLowerCase();
  if (['approved', 'active', 'verified', 'مميز'].includes(value)) return 'green';
  if (['pending', 'waiting'].includes(value)) return 'amber';
  if (['rejected', 'blocked', 'inactive'].includes(value)) return 'red';
  return 'blue';
}

export function StatusBadge({ status, tone }: StatusBadgeProps) {
  return <span className={`badge badge-${normalizeTone(status, tone)}`}>{status}</span>;
}

