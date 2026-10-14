import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { loginWithEmail } from '../../services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/profile';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <Card className="auth-card">
        <span className="eyebrow">تسجيل الدخول</span>
        <h1>مرحباً بعودتك</h1>
        <p className="muted">سجّل الدخول للوصول إلى حسابك ومتابعة طلباتك.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </form>

        <p className="auth-switch">
          ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link>
        </p>
      </Card>
    </section>
  );
}
