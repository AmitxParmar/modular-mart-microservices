import React from 'react';
import { 
  ShieldCheck, 
  RefreshCcw, 
  Lock, 
  Database, 
  Terminal,
  Activity,
  Server,
  Monitor
} from 'lucide-react';

export default function ProjectDocsPage() {
  return (
    <div className="pb-20">
      <div className="mb-16 border-b border-slate-200 pb-10">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
          E-Commerce Microservices
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-4xl">
          A production-grade architecture leveraging <strong>Choreographed Sagas</strong>, the <strong>Transactional Outbox</strong> pattern, and a comprehensive <strong>LGTM Observability</strong> stack to ensure distributed consistency and high reliability.
        </p>
      </div>

      {/* Enhanced Architecture Section */}
      <section className="mb-24">
        <div className="flex items-center gap-3 mb-8">
          <Server className="text-blue-600 w-8 h-8" />
          <h2 className="text-3xl font-bold text-slate-900">System Architecture</h2>
        </div>
        
        <p className="text-slate-600 mb-10 text-lg max-w-3xl">
          The system is decoupled into bounded contexts. Each microservice manages its own isolated PostgreSQL database, strictly communicating via the API Gateway or asynchronous RabbitMQ events.
        </p>

        {/* Enhanced Visual Diagram */}
        <div className="p-8 md:p-12 bg-slate-900 rounded-3xl shadow-2xl overflow-x-auto border border-slate-800">
          <div className="min-w-[800px] max-w-5xl mx-auto flex flex-col gap-10">
            
            {/* Client & Edge Tier */}
            <div className="flex justify-center relative">
              <div className="w-64 text-center z-10">
                <div className="px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  Next.js Storefront
                </div>
                <div className="h-10 w-0.5 bg-blue-500/50 mx-auto"></div>
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 border border-blue-400/30">
                  <div className="text-lg mb-1">API Gateway (NestJS)</div>
                  <div className="flex justify-center gap-2 mt-3">
                    <span className="px-2 py-1 bg-black/20 rounded text-[10px] uppercase tracking-wider">Clerk Auth</span>
                    <span className="px-2 py-1 bg-black/20 rounded text-[10px] uppercase tracking-wider">Rate Limit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Tier */}
            <div className="relative">
              {/* Connecting lines from Gateway */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-10 border-t-2 border-l-2 border-r-2 border-blue-500/30 rounded-t-xl"></div>
              
              <div className="grid grid-cols-4 gap-6 relative z-10">
                {/* User Service */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg text-center hover:border-blue-500 transition-colors">
                    <h3 className="text-white font-bold mb-3">User Service</h3>
                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700">
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-mono text-slate-300">Users DB</span>
                    </div>
                  </div>
                </div>

                {/* Catalog Service */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg text-center hover:border-purple-500 transition-colors relative">
                    <h3 className="text-white font-bold mb-3">Catalog Service</h3>
                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700 mb-2">
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-mono text-slate-300">Catalog DB</span>
                    </div>
                    <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">SAGA</span>
                  </div>
                </div>

                {/* Order Service */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg text-center hover:border-purple-500 transition-colors relative">
                    <h3 className="text-white font-bold mb-3">Order Service</h3>
                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700 mb-2">
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-mono text-slate-300">Orders DB</span>
                    </div>
                    <div className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-mono mt-2">
                      + Outbox Table
                    </div>
                  </div>
                </div>

                {/* Payment Service */}
                <div className="flex flex-col items-center">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg text-center hover:border-purple-500 transition-colors relative">
                    <h3 className="text-white font-bold mb-3">Payment Service</h3>
                    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700 mb-2">
                      <Database className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs font-mono text-slate-300">Payments DB</span>
                    </div>
                    <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow">SAGA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Bus Tier */}
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              <div className="relative z-10 flex justify-center">
                <div className="px-10 py-4 bg-purple-900/40 border border-purple-500/50 backdrop-blur-sm rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <RefreshCcw className="w-5 h-5 text-purple-400 animate-spin-slow" />
                  <span className="text-purple-100 font-bold tracking-widest uppercase text-sm">RabbitMQ Event Bus</span>
                  <div className="flex gap-2 ml-4 border-l border-purple-500/30 pl-4">
                    <span className="px-2 py-1 bg-purple-950 rounded text-[10px] text-purple-300 font-mono border border-purple-800">STOCK_RESERVED</span>
                    <span className="px-2 py-1 bg-purple-950 rounded text-[10px] text-purple-300 font-mono border border-purple-800">PAYMENT_SUCCEEDED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observability Tier */}
            <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h4 className="text-emerald-400 font-bold tracking-wider uppercase text-sm">LGTM Observability Stack</h4>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-white font-bold text-sm mb-1">Loki</div>
                  <div className="text-slate-400 text-[10px] uppercase">Centralized Logs</div>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-white font-bold text-sm mb-1">Grafana</div>
                  <div className="text-slate-400 text-[10px] uppercase">Unified Dashboards</div>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-white font-bold text-sm mb-1">Prometheus</div>
                  <div className="text-slate-400 text-[10px] uppercase">Metrics & Alerts</div>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="text-white font-bold text-sm mb-1">Jaeger</div>
                  <div className="text-slate-400 text-[10px] uppercase">Distributed Tracing</div>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-slate-400 font-mono border-t border-slate-700 pt-4">
                correlationId and traceId propagate through Gateway &rarr; Services &rarr; RMQ &rarr; Services
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Engineering Deep-Dive: Request Lifecycle */}
      <section className="mb-24">
        <div className="flex items-center gap-3 mb-8">
          <Terminal className="text-blue-600 w-8 h-8" />
          <h2 className="text-3xl font-bold text-slate-900">Lifecycle of a Distributed Transaction</h2>
        </div>
        
        <div className="relative border border-slate-200 rounded-3xl p-8 md:p-12 bg-white shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-slate-200">
              Checkout Saga
            </span>
          </div>

          <div className="space-y-16 relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-20 hidden sm:block"></div>

            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-blue-200 font-bold">1</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Ingress & Telemetry Init (Gateway)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">JAEGER</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Request enters. API Gateway validates auth and initiates the OpenTelemetry trace, attaching a <code>traceId</code> that follows the request across network boundaries.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-indigo-200 font-bold">2</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Transactional Outbox (Order Service)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">ACID</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  The Order Service opens a Postgres transaction. It saves the Order as <code>PENDING_STOCK</code> and inserts a <code>STOCK_RESERVE_REQUESTED</code> event into the <code>outbox_events</code> table. Both succeed or fail together, eliminating the dual-write problem.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-purple-200 font-bold">3</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Pessimistic Reservation (Catalog Service)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100">FOR UPDATE</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  A background worker relays the event via RabbitMQ. The Catalog Service consumes it and executes <code>SELECT ... FOR UPDATE</code>. This locks the specific product rows, preventing overselling during flash sales, decrements stock, and publishes <code>STOCK_RESERVED</code>.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white z-10 shadow-lg shadow-green-200 font-bold">4</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Idempotent Finalization (Payment & Order)</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100">EXACTLY ONCE</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  After Stripe processing, Payment Service emits <code>PAYMENT_SUCCEEDED</code>. Order Service consumes it. To handle RabbitMQ&apos;s at-least-once delivery, it checks and inserts the message ID into a <code>processed_messages</code> table within the same transaction that marks the order <code>PAID</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Concepts Grid */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="text-green-600 w-8 h-8" />
          <h2 className="text-3xl font-bold text-slate-900">Core Engineering Principles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
            <Lock className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Database-per-Service</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Domain boundaries are strictly enforced at the data layer. Order Service cannot query the Catalog database directly. All cross-domain data needs are fulfilled via synchronous RPC (for reads) or asynchronous events (for state mutations), preventing schema coupling.
            </p>
          </div>

          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
            <RefreshCcw className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">Compensating Transactions</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              In a distributed saga, there is no global rollback. If a later step fails (e.g., payment is declined after stock is reserved), the system emits failure events (<code>PAYMENT_FAILED</code>). Upstream services consume these to execute compensating logic (e.g., restoring inventory).
            </p>
          </div>

          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow md:col-span-2">
            <Activity className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-3">The Microservice Chassis</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
              Consistency is maintained across the Turborepo monorepo via shared chassis packages (<code>@mart/common</code>, <code>@mart/contracts</code>). This ensures all services use identical Pino logging formats, OpenTelemetry auto-instrumentation, and exact TypeScript definitions for event payloads, eliminating drift between publishers and consumers.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-24 pt-10 border-t border-slate-200">
        <p className="text-sm text-slate-500 text-center">
          Built with NestJS, Next.js, PostgreSQL, RabbitMQ, and the LGTM stack.
        </p>
      </div>
    </div>
  );
}
