import { useNavigate } from 'react-router-dom';

export function AdminAppHeader({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <header className="admin-app-header">
      <button type="button" onClick={() => navigate(-1)} aria-label="رجوع">‹</button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  );
}
