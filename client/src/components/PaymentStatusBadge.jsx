import { PAYMENT_LABELS } from '../utils/statusLabels.js';

export default function PaymentStatusBadge({ status }) {
  return <span className={`badge pay-${status}`}>{status === 'PAID' ? '✓ ' : ''}{PAYMENT_LABELS[status]}</span>;
}
