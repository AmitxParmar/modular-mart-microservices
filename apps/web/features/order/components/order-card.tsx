'use client'

import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { Package, ExternalLink } from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function OrderCard({ order }: OrderCardProps) {
  const shortId = order.id.split('-')[0]?.toUpperCase();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Amazon-style Header Bar */}
      <div className="bg-muted/40 px-4 py-3 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-border">
        <div>
          <p className="text-muted-foreground uppercase font-bold tracking-wider mb-1">Order Placed</p>
          <p className="font-medium text-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase font-bold tracking-wider mb-1">Total</p>
          <p className="font-medium text-foreground">{formatCurrency(Number(order.totalAmount))}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-muted-foreground uppercase font-bold tracking-wider mb-1">Ship To</p>
          <p className="font-medium text-primary hover:underline cursor-pointer">
            User Account
          </p>
        </div>
        <div className="text-right ml-auto">
          <p className="text-muted-foreground uppercase font-bold tracking-wider mb-1">Order # {shortId}</p>
          <div className="flex items-center justify-end gap-2 text-primary hover:underline cursor-pointer">
            <span>View order details</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">
              {order.status === 'DELIVERED' ? 'Delivered' : 'Order Status:'}
            </h3>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded flex items-center justify-center shrink-0 border border-border">
                  <Package className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary hover:underline line-clamp-2 cursor-pointer">
                    Product ID: {item.productId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qty: {item.quantity}
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {formatCurrency(Number(item.unitPrice))}
                  </p>
                  <button className="mt-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 rounded-full font-medium transition-colors">
                    Buy it again
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sm:w-48 flex flex-col gap-2 shrink-0">
          <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            Track package
          </button>
          <button className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border shadow-sm">
            Return or replace items
          </button>
          <button className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border shadow-sm">
            Share gift receipt
          </button>
          <button className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border shadow-sm">
            Write a product review
          </button>
        </div>
      </div>

      {/* Footer / Status Timeline link */}
      <div className="px-4 py-3 sm:px-6 bg-muted/10 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Last updated {formatDate(order.updatedAt)}</span>
        </div>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          Problem with order? <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
