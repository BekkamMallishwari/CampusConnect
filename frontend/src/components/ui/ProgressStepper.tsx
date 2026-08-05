import { Check, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export type StepItem = {
  label: string;
  completed: boolean;
  current?: boolean;
};

type ProgressStepperProps = {
  steps: StepItem[];
  className?: string;
};

export function ProgressStepper({ steps, className = '' }: ProgressStepperProps) {
  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center min-w-max space-x-2 px-2">
        {steps.map((step, idx) => {
          const isCompleted = step.completed;
          const isCurrent = step.current;

          return (
            <div key={idx} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[var(--primary)] text-white shadow-xs ring-4 ring-blue-500/20'
                      : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--secondary)]'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : isCurrent ? idx + 1 : <Circle size={10} />}
                </motion.div>

                <span
                  className={`text-xs whitespace-nowrap font-medium ${
                    isCompleted
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                      ? 'font-bold text-[var(--text)]'
                      : 'text-[var(--secondary)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 w-6 rounded-full transition-all ${
                    steps[idx]?.completed && steps[idx + 1]?.completed
                      ? 'bg-emerald-500'
                      : steps[idx]?.completed
                      ? 'bg-gradient-to-r from-emerald-500 to-[var(--border)]'
                      : 'bg-[var(--border)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
