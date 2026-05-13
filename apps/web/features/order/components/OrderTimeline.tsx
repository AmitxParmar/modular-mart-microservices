import React from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { OrderStatusHistory } from '../services/api';

interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  PENDING: { icon: <Clock className="w-5 h-5" />, color: 'text-yellow-500', label: 'Order Placed' },
  PAID: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-500', label: 'Payment Confirmed' },
  APPROVED: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-blue-500', label: 'Order Approved' },
  REJECTED: { icon: <XCircle className="w-5 h-5" />, color: 'text-red-500', label: 'Order Rejected' },
  PROCESSING: { icon: <Package className="w-5 h-5" />, color: 'text-blue-500', label: 'Processing' },
  SHIPPED: { icon: <Truck className="w-5 h-5" />, color: 'text-purple-500', label: 'Shipped' },
  DELIVERED: { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', label: 'Delivered' },
  CANCELLED: { icon: <AlertCircle className="w-5 h-5" />, color: 'text-gray-500', label: 'Cancelled' },
};

export function OrderTimeline({ history }: Readonly<OrderTimelineProps>) {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:left-2.5 before:h-full before:w-0.5 before:bg-slate-200 before:content-[''] ml-4">
      {history.map((item, _) => {
        const config = statusConfig[item.status] || {
          icon: <Circle className="w-5 h-5" />,
          color: 'text-slate-400',
          label: item.status,
        };

        return (
          <div key={item.id} className="relative pl-8">
            <div
              className={cn(
                'absolute left-0 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-white ring-4 ring-white',
                config.color
              )}
            >
              {config.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                {config.label}
              </span>
              <span className="text-xs text-slate-500">
                {format(new Date(item.createdAt), 'PPp')}
              </span>
              {item.reason && (
                <p className="mt-1 text-sm text-slate-600 italic">
                  &ldquo;{item.reason}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
