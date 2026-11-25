import { formatPrice } from '../utils/formatPrice.js';

export default function PriceText({ value, className = '' }) {
  return <span className={`num nowrap ${className}`}>{formatPrice(value)}</span>;
}
