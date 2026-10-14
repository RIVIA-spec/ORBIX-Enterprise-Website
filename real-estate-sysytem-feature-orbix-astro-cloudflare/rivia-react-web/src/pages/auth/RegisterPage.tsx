import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { registerWithEmail } from '../../services/authService';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerWithEmail({ email, password, username });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'تعذر إنشاء الحساب'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <Card className="auth-card">
        <span className="eyebrow">حساب جديد</span>
        <h1>أنشئ حسابك</h1>
        <p className="muted">أنشئ حسابك لتتمكن من حفظ العقارات ومتابعة طلباتك.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <Input
            label="الاسم"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="name"
            required
          />
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
            autoComplete="new-password"
            minLength={6}
            required
          />
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </form>

        <p className="auth-switch">
          لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
        </p>
      </Card>
    </section>
  );
}
