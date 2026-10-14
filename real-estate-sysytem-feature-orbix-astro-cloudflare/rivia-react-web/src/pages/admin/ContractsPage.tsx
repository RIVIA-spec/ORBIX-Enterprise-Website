import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DetailsDrawer } from '../../components/ui/DetailsDrawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getFirebaseErrorMessage } from '../../lib/firebaseErrors';
import { formatDate } from '../../lib/formatters';
import { getAllContracts } from '../../services/contractService';
import type { Contract } from '../../types/models';

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAllContracts()
      .then((items) => {
        if (active) setContracts(items);
      })
      .catch((err) => {
        if (active) setError(getFirebaseErrorMessage(err, 'تعذر تحميل العقود.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contracts.filter((contract) =>
      !needle
        ? true
        : [contract.contractId, contract.dealId, contract.propertyId, contract.customerUserId, contract.ownerUserId, contract.status]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle),
    );
  }, [contracts, search]);

  if (loading) return <LoadingState label="جارٍ تحميل العقود" />;

  return (
    <div>
      <div className="page-heading compact">
        <span className="eyebrow">إدارة العقود</span>
        <h1>العقود</h1>
      </div>

      <div className="filter-bar">
        <Input label="بحث" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="stack-list">
        {filtered.map((contract) => (
          <Card key={contract.id} className="list-card">
            <div>
              <h3>{contract.contractId || contract.id}</h3>
              <p>{contract.dealId ? `صفقة: ${contract.dealId}` : 'عقد'}</p>
              <p className="muted">{formatDate(contract.createdAt || contract.created_at)}</p>
            </div>
            <StatusBadge status={contract.status || 'pending'} />
            <div className="inline-actions">
              <button type="button" className="btn btn-outline" onClick={() => setSelected(contract)}>
                التفاصيل
              </button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !error && <EmptyState title="لا توجد عقود" description="لم يتم العثور على عقود مطابقة." />}
      </div>

      <DetailsDrawer open={Boolean(selected)} title="تفاصيل العقد" onClose={() => setSelected(null)}>
        {selected && (
          <dl className="details-grid">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value ?? '')}</dd>
              </div>
            ))}
          </dl>
        )}
      </DetailsDrawer>
    </div>
  );
}
