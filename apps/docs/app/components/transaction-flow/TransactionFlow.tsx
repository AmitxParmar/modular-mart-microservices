'use client';

import React, { useState } from 'react';
import { TransactionStepCard } from './TransactionStepCard';
import { transactionScenarios } from './scenarios';

export function TransactionFlow() {
  const [currentScenario, setCurrentScenario] = useState<keyof typeof transactionScenarios>('success');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const scenario = transactionScenarios[currentScenario];
  const currentStep = scenario.steps[currentStepIndex];

  const goToNextStep = () => {
    if (currentStepIndex < scenario.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const resetFlow = () => {
    setCurrentStepIndex(0);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentScenario(e.target.value as keyof typeof transactionScenarios);
    resetFlow();
  };

  return (
    <div className="bg-slate-900 text-white rounded-lg shadow-2xl font-mono border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-200">Transaction Scenario: {scenario.name}</h2>
        <div className="flex items-center space-x-4">
          <label htmlFor="scenario-select" className="text-slate-400">Select Scenario:</label>
          <select
            id="scenario-select"
            className="bg-slate-700 border border-slate-600 rounded-md py-1 px-3 text-sm text-white"
            value={currentScenario}
            onChange={handleScenarioChange}
          >
            {Object.keys(transactionScenarios).map((key) => (
              <option key={key} value={key}>
                {transactionScenarios[key as keyof typeof transactionScenarios].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-600 pl-6 py-4 space-y-8">
        {scenario.steps.map((step, index) => (
          <TransactionStepCard
            key={index}
            step={step}
            isActive={index === currentStepIndex}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8 space-x-4">
        <button
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
        >
          Previous Step
        </button>
        <button
          onClick={goToNextStep}
          disabled={currentStepIndex === scenario.steps.length - 1}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
        >
          Next Step
        </button>
        <button
          onClick={resetFlow}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
