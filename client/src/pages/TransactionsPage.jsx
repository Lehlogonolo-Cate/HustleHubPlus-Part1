import { useEffect, useState } from 'react';

import { api } from '../api/client';
import { Alert, EmptyState, Loading, PageHeader, StatusBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listTransactions()
      .then(({ transactions: data }) => setTransactions(data))
      .catch(setError);
  }, []);

  const showEarnings = user.role !== 'client';

  return (
    <>
      <PageHeader
        title={user.role === 'client' ? 'Payments' : 'Transactions'}
        subtitle="Every booking creates a transaction record. Payments are simulated."
      />

      <Alert requestId={error?.requestId}>{error?.message}</Alert>
      {!transactions && !error && <Loading />}
      {transactions && transactions.length === 0 && <EmptyState title="No transactions yet" />}

      {transactions && transactions.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Gig</th>
                <th scope="col">Date</th>
                <th scope="col" className="num">Amount</th>
                {showEarnings && <th scope="col" className="num">Platform fee</th>}
                {showEarnings && <th scope="col" className="num">Freelancer earnings</th>}
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="mono">{transaction.reference}</td>
                  <td>{transaction.gigTitle}</td>
                  <td>{formatDate(transaction.paidAt)}</td>
                  <td className="num">{formatCurrency(transaction.amount)}</td>
                  {showEarnings && <td className="num">{formatCurrency(transaction.platformFee)}</td>}
                  {showEarnings && <td className="num">{formatCurrency(transaction.freelancerEarnings)}</td>}
                  <td>
                    <StatusBadge status={transaction.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
