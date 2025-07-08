import { createMachine, assign } from "xstate";

export type WorkflowState = "step1" | "step2" | "step3" | "step4";

export type WorkflowEvent =
  | { type: "NEXT_STEP" }
  | { type: "GO_TO_STEP1" }
  | { type: "GO_TO_STEP2" }
  | { type: "GO_TO_STEP3" }
  | { type: "GO_TO_STEP4" }
  | { type: "RESET" };

export interface WorkflowMachineContext {
  completedSteps: Set<1 | 2 | 3 | 4>;
}

export const workflowMachine = createMachine({
  id: "workflow",
  initial: "step1",
  context: {
    completedSteps: new Set<1 | 2 | 3 | 4>(),
  } as WorkflowMachineContext,
  states: {
    step1: {
      on: {
        NEXT_STEP: {
          target: "step2",
          actions: assign({
            completedSteps: ({ context }) =>
              new Set([...context.completedSteps, 1 as const]),
          }),
        },
        GO_TO_STEP1: "step1",
        GO_TO_STEP2: "step2",
        GO_TO_STEP3: "step3",
        GO_TO_STEP4: "step4",
        RESET: {
          target: "step1",
          actions: assign({
            completedSteps: () => new Set<1 | 2 | 3 | 4>(),
          }),
        },
      },
    },
    step2: {
      on: {
        NEXT_STEP: {
          target: "step3",
          actions: assign({
            completedSteps: ({ context }) =>
              new Set([...context.completedSteps, 2 as const]),
          }),
        },
        GO_TO_STEP1: "step1",
        GO_TO_STEP2: "step2",
        GO_TO_STEP3: "step3",
        GO_TO_STEP4: "step4",
        RESET: {
          target: "step1",
          actions: assign({
            completedSteps: () => new Set<1 | 2 | 3 | 4>(),
          }),
        },
      },
    },
    step3: {
      on: {
        NEXT_STEP: {
          target: "step4",
          actions: assign({
            completedSteps: ({ context }) =>
              new Set([...context.completedSteps, 3 as const]),
          }),
        },
        GO_TO_STEP1: "step1",
        GO_TO_STEP2: "step2",
        GO_TO_STEP3: "step3",
        GO_TO_STEP4: "step4",
        RESET: {
          target: "step1",
          actions: assign({
            completedSteps: () => new Set<1 | 2 | 3 | 4>(),
          }),
        },
      },
    },
    step4: {
      on: {
        NEXT_STEP: {
          actions: assign({
            completedSteps: ({ context }) =>
              new Set([...context.completedSteps, 4 as const]),
          }),
        },
        GO_TO_STEP1: "step1",
        GO_TO_STEP2: "step2",
        GO_TO_STEP3: "step3",
        GO_TO_STEP4: "step4",
        RESET: {
          target: "step1",
          actions: assign({
            completedSteps: () => new Set<1 | 2 | 3 | 4>(),
          }),
        },
      },
    },
  },
});

// Helper functions for working with the machine state
export const getStepFromState = (state: WorkflowState): 1 | 2 | 3 | 4 => {
  switch (state) {
    case "step1":
      return 1;
    case "step2":
      return 2;
    case "step3":
      return 3;
    case "step4":
      return 4;
    default:
      return 1;
  }
};

export const canGoToStep = (
  step: 1 | 2 | 3 | 4,
  completedSteps: Set<1 | 2 | 3 | 4>,
): boolean => {
  if (step === 1) return true;
  if (step === 2) return completedSteps.has(1);
  if (step === 3) return completedSteps.has(2);
  if (step === 4) return completedSteps.has(3);
  return false;
};

export const getStepStatus = (
  step: 1 | 2 | 3 | 4,
  currentState: WorkflowState,
  completedSteps: Set<1 | 2 | 3 | 4>,
): "pending" | "active" | "completed" | "available" => {
  if (completedSteps.has(step)) return "completed";
  if (getStepFromState(currentState) === step) return "active";
  if (canGoToStep(step, completedSteps)) return "available";
  return "pending";
};
