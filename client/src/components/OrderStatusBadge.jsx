import { STATUS_LABELS } from '../utils/statusLabels.js';

export default function OrderStatusBadge({ status }) {
  return <span className={`badge st-${status}`}>{STATUS_LABELS[status]}</span>;
}
