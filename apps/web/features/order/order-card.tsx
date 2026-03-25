import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shortId = order.id.split('-')[0].toUpperCase();

  return (
    <div className="bg-card border border-border overflow-hidden transition-all duration-200 hover:border-primary/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 flex items-center justify-center bg-muted rounded-full shrink-0">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground font-mono">#{shortId}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <OrderStatusBadge status={order.status} />
          <span className="text-base font-bold text-foreground">
            {formatCurrency(Number(order.totalAmount))}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={expanded ? 'Collapse items' : 'Expand items'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable line items */}
      {expanded && order.items.length > 0 && (
        <div className="border-t border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-xs font-mono text-muted-foreground truncate max-w-[140px]">
                    {item.productId.split('-')[0]}…
                  </td>
                  <td className="px-4 py-2 text-center text-xs">{item.quantity}</td>
                  <td className="px-4 py-2 text-right text-xs">{formatCurrency(Number(item.unitPrice))}</td>
                  <td className="px-4 py-2 text-right text-xs font-medium">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                  Total
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold text-foreground">
                  {formatCurrency(Number(order.totalAmount))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
