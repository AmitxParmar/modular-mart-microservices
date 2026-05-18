import { TransactionFlow } from '../components/transaction-flow/TransactionFlow';

export default function DataFlowPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        Distributed Transaction Flow
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Visualizing the step-by-step execution and state changes of a distributed transaction.
      </p>

      <TransactionFlow />
    </div>
  );
}
