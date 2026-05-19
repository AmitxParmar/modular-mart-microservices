import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, MessageSquare, Code, AlertTriangle } from 'lucide-react';

export interface TransactionStep {
  title: string;
  description: string;
  type: string;
  details?: Record<string, any>;
}

interface TransactionStepCardProps {
  step: TransactionStep;
  isActive: boolean;
}

export function TransactionStepCard({ step, isActive }: Readonly<TransactionStepCardProps>) {
  const [isExpanded, setIsExpanded] = useState(isActive);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const getIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database size={16} className="text-cyan-400" />;
      case 'event':
        return <MessageSquare size={16} className="text-purple-400" />;
      case 'code':
        return <Code size={16} className="text-blue-400" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative mb-8 ${isActive ? 'bg-slate-800 border-blue-500' : 'bg-slate-800/50 border-slate-700'} p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out`}>
      <div className={`absolute -left-3 top-0 bottom-0 w-1 ${isActive ? 'bg-blue-500' : 'bg-slate-500'} rounded-full`} />
      <div className="flex items-start gap-3 cursor-pointer" onClick={toggleExpanded}>
        <div className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-600'}`}>
          {getIcon(step.type)}
        </div>
        <div className="flex-grow">
          <h3 className={`text-lg font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
            {step.title}
          </h3>
          <p className={`${isActive ? 'text-slate-300' : 'text-slate-400'} text-sm`}>
            {step.description}
          </p>
        </div>
        <button className="flex-shrink-0 text-slate-400 hover:text-white transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && step.details && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
          {Object.entries(step.details).map(([key, value], index) => (
            <div key={index}>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</h4>
              <pre className="bg-slate-900 p-3 rounded-md text-xs overflow-x-auto text-slate-200">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
