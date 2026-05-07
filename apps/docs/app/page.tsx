import React from 'react';
import { 
  ShieldCheck, 
  RefreshCcw, 
  Lock, 
  Database, 
  MessageSquare,
  AlertCircle,
  Terminal,
  History,
  RotateCcw
} from 'lucide-react';

export default function ProjectDocsPage() {
  return (
    <div className="pb-20">
      <div className="mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Project Documentation
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          An in-depth look at the e-commerce microservices architecture, core flows, and the engineering principles that ensure reliability and scalability.
        </p>
      </div>

      {/* Architecture Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <Database className="text-blue-600 w-8 h-8" />
          System Architecture
        </h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            The system is built as a set of polyglot-ready microservices orchestrated via an <strong>API Gateway</strong>. Each service is autonomous, owning its own database (Postgres) and communicating via either synchronous REST/gRPC or asynchronous message queues (RabbitMQ).
          </p>

          {/* Visual Diagram */}
          <div className="my-12 p-8 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto">
            <div className="min-w-[600px] flex flex-col items-center gap-8">
              <div className="px-6 py-3 bg-white border-2 border-slate-900 rounded-lg font-bold shadow-sm">
                Client (Web/Mobile)
              </div>
              <div className="w-0.5 h-8 bg-slate-300"></div>
              <div className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex flex-col items-center gap-2">
                <span>API Gateway</span>
                <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Auth + Rate Limit + Proxy</span>
              </div>
              <div className="w-full flex justify-between items-start px-12">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-slate-300"></div>
                  <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold">User Service</div>
                  <div className="w-0.5 h-6 bg-slate-200"></div>
                  <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Postgres</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-slate-300"></div>
                  <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold">Catalog & Orders</div>
                  <div className="w-0.5 h-6 bg-slate-200"></div>
                  <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Postgres</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-0.5 w-24 bg-dashed border-t-2 border-dashed border-slate-300"></div>
                <div className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-bold flex items-center gap-2">
                  <RefreshCcw className="w-3 h-3" />
                  RabbitMQ (Event Bus)
                </div>
                <div className="h-0.5 w-24 bg-dashed border-t-2 border-dashed border-slate-300"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2">API Gateway</h3>
              <p className="text-sm text-slate-600">
                The single entry point for all clients. Handles <strong>JWT validation (Clerk)</strong>, rate limiting, and request proxying. It also injects <strong>Correlation IDs</strong> for distributed tracing.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Message Broker (RabbitMQ)</h3>
              <p className="text-sm text-slate-600">
                Facilitates decoupled communication. Used for the <strong>Saga Orchestration</strong> flow, ensuring that payment successes eventually update order statuses across service boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Deep-Dive: Request Lifecycle */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <Terminal className="text-blue-600 w-8 h-8" />
          The Engineering Deep-Dive: Request Lifecycle
        </h2>
        
        <div className="relative border border-slate-200 rounded-3xl p-8 lg:p-12 bg-white shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-100">
              Technical Map v1.0
            </span>
          </div>

          <div className="space-y-16 relative">
            {/* Connection Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-20 hidden sm:block"></div>

            {/* Step 1: Edge */}
            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-blue-200 font-bold">1</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Ingress & Security (Gateway)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">JWT AUTH</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">CORRELATION ID</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Request enters via <strong>Next.js UI</strong>. The <strong>API Gateway</strong> intercepts the call, validates the <strong>Clerk JWT</strong>, and injects a <code>x-request-id</code>. 
                </p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono text-slate-500 leading-relaxed">
                  {"// Traceability implementation"}<br/>
                  {"req.headers['x-request-id'] = uuid();"}<br/>
                  {"logger.info({ msg: \"Request started\", correlationId });"}
                </div>
              </div>
            </div>

            {/* Step 2: Resiliency */}
            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-purple-200 font-bold">2</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Downstream Routing & Resiliency</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100">CIRCUIT BREAKER</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">RATE LIMITING</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  The Gateway proxies the request. A <strong>Circuit Breaker</strong> monitors the health of the <strong>Catalog-Order service</strong>. If failures spike, it &quot;trips,&quot; returning a cached fallback to protect the system from cascading failure.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-green-500"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Service Health: 98%</span>
                </div>
              </div>
            </div>

            {/* Step 3: Concurrency */}
            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-indigo-200 font-bold">3</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Atomic Fulfillment (Catalog-Order)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">PESSIMISTIC LOCKING</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">ACID TRANSACTION</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  The service begins a <strong>TypeORM Transaction</strong>. It applies a <code>pessimistic_write</code> lock on the Product row. This blocks other transactions until stock is decremented and the Order is saved, ensuring <strong>Strict Consistency</strong> for inventory.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Stock Guard</p>
                    <p className="text-[11px] text-indigo-900 font-medium tracking-tight">Prevents &quot;Overselling&quot; during flash sales.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Idempotency</p>
                    <p className="text-[11px] text-slate-700 font-medium tracking-tight">Ignores duplicate order submissions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Eventual Consistency */}
            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-green-200 font-bold">4</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Saga Choreography (RabbitMQ)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">EVENT BUS</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">EVENTUAL CONSISTENCY</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Payment is processed externally (Stripe). The <strong>Payment Module</strong> publishes a <code>PAYMENT_SUCCEEDED</code> event. <strong>RabbitMQ</strong> ensures delivery. The Order Module eventually consumes this to transition status from <code>PENDING</code> to <code>PAID</code>.
                </p>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="h-1 w-full bg-slate-200 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-green-500 animate-[move_2s_infinite_linear]"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-green-700 font-bold">RMQ: order.paid</span>
                </div>
              </div>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes move {
              from { transform: translateX(-100%); }
              to { transform: translateX(300%); }
            }
          ` }} />

          {/* Background Tech Mesh */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
      </section>

      {/* Engineering Concepts */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <ShieldCheck className="text-green-600 w-8 h-8" />
          Engineering Concepts
        </h2>
        <div className="grid grid-cols-1 gap-8">
          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-700">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Pessimistic Locking</h4>
              <p className="text-slate-600 text-sm">
                We use TypeORM&apos;s <code>pessimistic_write</code> lock during checkout. This prevents &quot;double-spend&quot; of inventory where two users buy the last item at the exact same millisecond.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Distributed Tracing (Correlation IDs)</h4>
              <p className="text-slate-600 text-sm">
                Every request entering the Gateway gets a unique <code>x-request-id</code>. This header is propagated through every microservice call and RMQ message, allowing us to reconstruct the full journey of a single request in the logs.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-700">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Compensating Transactions</h4>
              <p className="text-slate-600 text-sm">
                Since we operate across distributed databases, we use the <strong>Saga Pattern</strong>. If a payment fails after an order is created, the system triggers a &quot;compensating transaction&quot; to automatically restore inventory and mark the order as failed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction & Rollback Strategies */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <History className="text-indigo-600 w-8 h-8" />
          Transaction & Rollback Strategies
        </h2>
        <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <History size={160} />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ACID Local Transactions
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                For operations within a single microservice, we leverage the underlying database&apos;s ACID properties. Every order creation, inventory update, and status change is wrapped in a <code>DB Transaction</code>.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">All-or-Nothing</p>
                    <p className="text-[11px] text-slate-400">If any part of the query fails, the entire database state is reverted to its previous valid state.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Distributed Saga Rollbacks
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                In multi-service flows (Order &rarr; Payment &rarr; Shipping), we use <strong>Choreography-based Sagas</strong>. Each service emits events that trigger the next step or a rollback.
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between text-[10px] font-mono mb-4 text-slate-500 uppercase tracking-widest">
                  <span>Failure Scenario</span>
                  <span className="text-red-400">Recovery Path</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="px-2 py-1 bg-white/10 rounded text-[10px]">Payment Rejected</div>
                    <div className="flex-1 h-px bg-dashed border-t border-white/20"></div>
                    <div className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[10px]">Cancel_Order_Event</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-2 py-1 bg-white/10 rounded text-[10px]">Stock Out</div>
                    <div className="flex-1 h-px bg-dashed border-t border-white/20"></div>
                    <div className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[10px]">Refund_User_Event</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edge Cases */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <AlertCircle className="text-red-500 w-8 h-8" />
          Edge Cases Handled
        </h2>
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Scenario</th>
                <th className="px-6 py-4 font-bold text-slate-700">Handling Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Inventory Race</td>
                <td className="px-6 py-4 text-slate-600">Pessimistic database locks on product rows during order transaction.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">RabbitMQ Down</td>
                <td className="px-6 py-4 text-slate-600">Services use persistent queues and acknowledgments. Events are retried once the broker recovers.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Clerk Webhook Delay</td>
                <td className="px-6 py-4 text-slate-600">User profile fetches return a 404 until sync is complete, prompting the UI to show a &quot;Setting up your account&quot; state.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-900">Partial Failure (Zombie Orders)</td>
                <td className="px-6 py-4 text-slate-600">A background cleanup worker identifies &quot;Pending&quot; orders older than 15 minutes and triggers a saga-rollback to release reserved stock.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-20 pt-10 border-t border-slate-200">
        <p className="text-sm text-slate-400 text-center italic">
          Documentation generated with focus on technical flow and reliability patterns.
        </p>
      </div>
    </div>
  );
}
