import { OrderStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  [OrderStatus.PENDING]:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  [OrderStatus.PAID]:      { label: 'Paid',       className: 'bg-blue-100 text-blue-800 border-blue-200' },
  [OrderStatus.SHIPPED]:   { label: 'Shipped',    className: 'bg-violet-100 text-violet-800 border-violet-200' },
  [OrderStatus.DELIVERED]: { label: 'Delivered',  className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled',  className: 'bg-red-100 text-red-800 border-red-200' },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold border rounded-full tracking-wide',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
