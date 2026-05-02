import Link from 'next/link';
import { Book, Cpu, Users, GitBranch } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-8">
          <Book className="w-6 h-6 text-blue-600" />
          <span>Dev Docs</span>
        </Link>
        
        <nav className="space-y-8">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <GitBranch className="w-4 h-4 text-blue-500" />
              Guides
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded">
                  Project Overview
                </Link>
              </li>
              <li>
                <Link href="/api-reference" className="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Users className="w-4 h-4" />
              User Service
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/api-reference#get-users-me" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /users/me
                </Link>
              </li>
              <li>
                <Link href="/api-reference#post-users-webhooks-clerk" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-blue-600 uppercase">POST</span>
                  /webhooks/clerk
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Cpu className="w-4 h-4" />
              Catalog & Orders
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/api-reference#get-catalog-products" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /catalog/products
                </Link>
              </li>
              <li>
                <Link href="/api-reference#get-catalog-products-slug" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /catalog/products/:slug
                </Link>
              </li>
              <li>
                <Link href="/api-reference#get-catalog-categories" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /catalog/categories
                </Link>
              </li>
              <li>
                <Link href="/api-reference#post-catalog-products" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-blue-600 uppercase">POST</span>
                  /catalog/products
                </Link>
              </li>
              <li>
                <Link href="/api-reference#post-orders" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-blue-600 uppercase">POST</span>
                  /orders
                </Link>
              </li>
              <li>
                <Link href="/api-reference#get-orders" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /orders
                </Link>
              </li>
              <li>
                <Link href="/api-reference#get-orders-id" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-green-600 uppercase">GET</span>
                  /orders/:id
                </Link>
              </li>
              <li>
                <Link href="/api-reference#post-payments-stripe-webhook" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                  <span className="inline-block w-12 text-xs font-bold text-blue-600 uppercase">POST</span>
                  /payments/stripe-webhook
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}
