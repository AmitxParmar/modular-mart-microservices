import { TransactionFlow } from '../components/transaction-flow/TransactionFlow';

export default function DataFlowPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Distributed Transaction Flow
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl">
          Visualizing the high-concurrency, choreographed saga that powers the Modular Mart checkout process.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Choreographed Saga</h3>
          <p className="text-sm text-slate-600">
            Unlike a centralized orchestrator, our services react to domain events. This maximizes decoupling and allows the system to scale horizontally without a single point of failure.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Transactional Outbox</h3>
          <p className="text-sm text-slate-600">
            Guarantees "at-least-once" delivery by saving events in the same ACID transaction as the domain data. A background worker ensures these events eventually reach RabbitMQ.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Deep Observability</h3>
          <p className="text-sm text-slate-600">
            Every step is tracked via distributed tracing (Jaeger) and structured logging (Loki). Correlation IDs allow us to trace a request across service and queue boundaries.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Interactive Execution Trace</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Event-Driven</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">ACID Guaranteed</span>
          </div>
        </div>
        <TransactionFlow />
      </div>

      <div className="prose prose-slate max-w-none border-t border-slate-200 pt-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Technical Deep Dive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Pessimistic Locking (Inventory)</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              When the <code>Catalog Service</code> receives a reservation request, it immediately applies a <code>FOR UPDATE</code> lock on the product rows. This prevents race conditions during high-traffic checkout windows, ensuring that we never oversell stock even if multiple Sagas are competing for the same items.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-2">Idempotent Consumers</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Since RabbitMQ may redeliver messages during network flickers, every consumer checks the <code>processed_messages</code> table before executing logic. This ensures "exactly-once" semantics for critical operations like payment recording and order finalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
