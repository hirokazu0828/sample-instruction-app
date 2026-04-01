import { useState } from 'react';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step4 from './components/Step4';
import { initialSpecData } from './types';
import type { SpecData } from './types';
import './index.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [specData, setSpecData] = useState<SpecData>(initialSpecData);

  const steps = [
    { id: 1, name: 'STEP1: 企画流し込み' },
    { id: 2, name: 'STEP2: 組み合わせ提案' },
    { id: 3, name: 'STEP3: サンプル指示書' },
  ];

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const resetData = () => {
    setSpecData(initialSpecData);
    setCurrentStep(1);
  };

  const updateData = (updates: Partial<SpecData>) => {
    setSpecData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Tabs - Hidden when printing */}
      <div className="bg-white shadow print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-b border-gray-200">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                  currentStep === step.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0">
          {currentStep === 1 && (
            <Step1 data={specData} updateData={updateData} onNext={handleNext} />
          )}
          {currentStep === 2 && (
            <Step2
              data={specData}
              updateData={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <Step4 data={specData} updateData={updateData} onReset={resetData} onBack={handleBack} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

