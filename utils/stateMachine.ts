// AFIP Workflow State Machine - Simplified

export type WorkflowState = "step1" | "step2" | "step3";

export type WorkflowEvent = 
  | "NEXT_STEP"     // Move to next step
  | "GO_TO_STEP1"   // Direct navigation to step 1
  | "GO_TO_STEP2"   // Direct navigation to step 2  
  | "GO_TO_STEP3"   // Direct navigation to step 3
  | "RESET";        // Reset to step 1

export interface WorkflowContext {
  currentState: WorkflowState;
  currentStep: 1 | 2 | 3;
  canGoToStep: (step: 1 | 2 | 3) => boolean;
  goToStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  reset: () => void;
  isStepCompleted: (step: 1 | 2 | 3) => boolean;
  getCompletedSteps: () => Set<1 | 2 | 3>;
}

export class WorkflowStateMachine implements WorkflowContext {
  private state: WorkflowState;
  private completedSteps: Set<1 | 2 | 3> = new Set();

  constructor(initialState: WorkflowState = "step1") {
    this.state = initialState;
  }

  get currentState(): WorkflowState {
    return this.state;
  }

  get currentStep(): 1 | 2 | 3 {
    switch (this.state) {
      case "step1": return 1;
      case "step2": return 2;
      case "step3": return 3;
      default: return 1;
    }
  }

  canGoToStep(step: 1 | 2 | 3): boolean {
    // Can always go to step 1
    if (step === 1) return true;
    // Can go to step 2 if step 1 is completed
    if (step === 2) return this.completedSteps.has(1);
    // Can go to step 3 if step 2 is completed
    if (step === 3) return this.completedSteps.has(2);
    return false;
  }

  goToStep(step: 1 | 2 | 3): void {
    if (this.canGoToStep(step)) {
      this.state = `step${step}` as WorkflowState;
    }
  }

  nextStep(): void {
    // Mark current step as completed
    this.completedSteps.add(this.currentStep);
    
    // Move to next step if possible
    const nextStepNum = (this.currentStep + 1) as 1 | 2 | 3;
    if (nextStepNum <= 3) {
      this.goToStep(nextStepNum);
    }
  }

  reset(): void {
    this.state = "step1";
    this.completedSteps.clear();
  }

  isStepCompleted(step: 1 | 2 | 3): boolean {
    return this.completedSteps.has(step);
  }

  getCompletedSteps(): Set<1 | 2 | 3> {
    return new Set(this.completedSteps);
  }

  // Simple collapse logic: step is collapsed if it's not the current step
  isStepCollapsed(step: 1 | 2 | 3): boolean {
    return this.currentStep !== step;
  }

  getStepStatus(step: 1 | 2 | 3): "pending" | "active" | "completed" | "available" {
    if (this.isStepCompleted(step)) return "completed";
    if (this.currentStep === step) return "active";
    if (this.canGoToStep(step)) return "available";
    return "pending";
  }

  // Serialization for persistence
  serialize(): { state: WorkflowState; completed: number[] } {
    return {
      state: this.state,
      completed: Array.from(this.completedSteps)
    };
  }

  // Deserialization from persistence
  static deserialize(data: { 
    state: WorkflowState; 
    completed?: number[] 
  }): WorkflowStateMachine {
    const machine = new WorkflowStateMachine(data.state);
    if (data.completed) {
      machine.completedSteps = new Set(data.completed as (1 | 2 | 3)[]);
    }
    return machine;
  }
}

// Helper function to create a new state machine
export function createWorkflowStateMachine(
  initialState?: WorkflowState,
): WorkflowStateMachine {
  return new WorkflowStateMachine(initialState);
}

