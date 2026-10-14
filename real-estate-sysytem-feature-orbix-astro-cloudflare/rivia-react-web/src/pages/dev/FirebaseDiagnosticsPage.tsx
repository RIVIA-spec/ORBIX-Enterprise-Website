import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { auth, db } from '../../services/firebase';

type Diagnostics = {
  projectId?: string;
  env: Record<string, boolean>;
  user: {
    uid?: string;
    email?: string | null;
  };
  propertiesCount: number;
  propertyIds: string[];
  firstPropertyKeys: string[];
  propertyRequestsCount: number;
  latestError?: string;
};

export function FirebaseDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(import.meta.env.DEV);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;

    async function loadDiagnostics() {
      const env = {
        VITE_FIREBASE_API_KEY: Boolean(import.meta.env.VITE_FIREBASE_API_KEY),
        VITE_FIREBASE_AUTH_DOMAIN: Boolean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
        VITE_FIREBASE_PROJECT_ID: Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
        VITE_FIREBASE_STORAGE_BUCKET: Boolean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
        VITE_FIREBASE_MESSAGING_SENDER_ID: Boolean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        VITE_FIREBASE_APP_ID: Boolean(import.meta.env.VITE_FIREBASE_APP_ID),
      };

      const next: Diagnostics = {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        env,
        user: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
        },
        propertiesCount: 0,
        propertyIds: [],
        firstPropertyKeys: [],
        propertyRequestsCount: 0,
      };

      try {
        const propertiesSnap = await getDocs(query(collection(db, 'properties'), limit(5)));
        next.propertiesCount = propertiesSnap.size;
        next.propertyIds = propertiesSnap.docs.map((item) => item.id);
        next.firstPropertyKeys = propertiesSnap.docs[0] ? Object.keys(propertiesSnap.docs[0].data()) : [];
      } catch (error) {
        next.latestError = error instanceof Error ? error.message : String(error);
      }

      try {
        const requestsSnap = await getDocs(query(collection(db, 'property_requests'), limit(20)));
        next.propertyRequestsCount = requestsSnap.size;
      } catch (error) {
        next.latestError = [next.latestError, error instanceof Error ? error.message : String(error)].filter(Boolean).join(' | ');
      }

      if (active) {
        setDiagnostics(next);
        setLoading(false);
      }
    }

    void loadDiagnostics();
    return () => {
      active = false;
    };
  }, []);

  if (!import.meta.env.DEV) {
    return <EmptyState title="غير متاح في الإنتاج" />;
  }

  if (loading || !diagnostics) return <LoadingState label="جاري فحص Firebase" />;

  return (
    <section className="container section">
      <div className="page-heading compact">
        <span className="eyebrow">DEV</span>
        <h1>Firebase Diagnostics</h1>
        <p>لا يتم عرض مفاتيح أو أسرار، فقط حالة الإعدادات والقراءات.</p>
      </div>

      <div className="details-content">
        <dl className="details-grid">
          <div>
            <dt>projectId</dt>
            <dd>{diagnostics.projectId || 'غير محدد'}</dd>
          </div>
          <div>
            <dt>env vars exist</dt>
            <dd>{Object.entries(diagnostics.env).map(([key, exists]) => `${key}: ${exists ? 'yes' : 'no'}`).join('، ')}</dd>
          </div>
          <div>
            <dt>current user</dt>
            <dd>{diagnostics.user.uid ? `${diagnostics.user.uid} / ${diagnostics.user.email || ''}` : 'غير مسجل'}</dd>
          </div>
          <div>
            <dt>properties count</dt>
            <dd>{diagnostics.propertiesCount}</dd>
          </div>
          <div>
            <dt>first 5 property IDs</dt>
            <dd>{diagnostics.propertyIds.join('، ') || 'لا يوجد'}</dd>
          </div>
          <div>
            <dt>first property keys</dt>
            <dd>{diagnostics.firstPropertyKeys.join('، ') || 'لا يوجد'}</dd>
          </div>
          <div>
            <dt>property_requests count</dt>
            <dd>{diagnostics.propertyRequestsCount}</dd>
          </div>
          <div>
            <dt>latest Firestore error</dt>
            <dd>{diagnostics.latestError || 'لا يوجد'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
