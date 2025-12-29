
import { Flow, FlowStep } from '../types';

export interface ValidationError {
  msg: string;
  type: 'critical' | 'warning';
  stepId?: string;
}

/**
 * Helper function to recursively check for spam (email followed by another email without a wait/condition).
 * It traverses the flow steps, including linking to other flows.
 * Returns `true` if this path eventually leads to an email *without an intervening safe step*, `false` otherwise.
 * It also directly pushes errors if a spam sequence is detected.
 */
const checkSpamDownstreamRecursive = (
  currentStepId: string | undefined,
  currentFlow: Flow, // The flow we are currently traversing
  allFlows: Flow[],   // All flows in the system (for resolving linked flows)
  errors: ValidationError[],
  emailSourceStep: FlowStep, // The original 'action' step (email) that initiated this spam check
  flowPath: string[], // Stores the path of flow names to detect loops and show full trace
  visitedStepsInCurrentFlow: Set<string> // Tracks steps *within the current flow* to prevent intra-flow loops
): boolean => {
  if (!currentStepId) {
    return false;
  }

  // Detect internal loops within a flow (e.g., A -> B -> A)
  if (visitedStepsInCurrentFlow.has(currentStepId)) {
    return false; // Already visited this step in this flow path, break recursion
  }
  visitedStepsInCurrentFlow.add(currentStepId);

  const currentStep = currentFlow.steps.find(s => s.id === currentStepId);
  if (!currentStep) {
    return false;
  }

  // If we encounter another email action, it's spam!
  if (currentStep.type === 'action') {
    errors.push({
      msg: `RỦI RO SPAM: Email ("${emailSourceStep.label}") có thể dẫn trực tiếp đến Email ("${currentStep.label}") trong chuỗi flow: ${flowPath.join(' -> ')}. Cần bước Chờ.`,
      type: 'critical',
      stepId: emailSourceStep.id // Point to the initial email step
    });
    return true; // Found spam
  }

  // If we hit a 'wait' or 'condition', the path is safe
  if (currentStep.type === 'wait' || currentStep.type === 'condition') {
    return false;
  }

  // Continue checking through "instant" steps
  if (['update_tag', 'split_test', 'list_action'].includes(currentStep.type)) {
    let foundSpam = false;
    if (currentStep.type === 'split_test') {
      // Check both branches. If either leads to spam, return true.
      const pathASpam = checkSpamDownstreamRecursive(
        currentStep.pathAStepId, currentFlow, allFlows, errors, emailSourceStep,
        flowPath, new Set(visitedStepsInCurrentFlow) // Pass a new set for each branch
      );
      const pathBSpam = checkSpamDownstreamRecursive(
        currentStep.pathBStepId, currentFlow, allFlows, errors, emailSourceStep,
        flowPath, new Set(visitedStepsInCurrentFlow) // Pass a new set for each branch
      );
      foundSpam = pathASpam || pathBSpam;
    } else {
      // Check single next step
      foundSpam = checkSpamDownstreamRecursive(
        currentStep.nextStepId, currentFlow, allFlows, errors, emailSourceStep,
        flowPath, new Set(visitedStepsInCurrentFlow)
      );
    }
    return foundSpam;
  }

  // Handle `link_flow` step - recursive call into another flow
  if (currentStep.type === 'link_flow') {
    const linkedFlowId = currentStep.config.linkedFlowId;
    if (linkedFlowId) {
      // Detect inter-flow loops (e.g., Flow A -> Flow B -> Flow A)
      const newFlowPath = [...flowPath, currentStep.label]; // Add the current link_flow step label to path
      if (flowPath.includes(linkedFlowId)) { // Check if the target Flow ID is already in the path
          errors.push({
              msg: `LỖI LOGIC: Vòng lặp Flow được phát hiện: ${newFlowPath.join(' -> ')} -> ${allFlows.find(f => f.id === linkedFlowId)?.name || 'Linked Flow'}. Cần điều chỉnh để tránh vòng lặp vô hạn.`,
              type: 'critical',
              stepId: currentStep.id
          });
          return false; // Stop to prevent infinite recursion
      }

      const targetFlow = allFlows.find(f => f.id === linkedFlowId);
      if (targetFlow && targetFlow.status === 'active') { // Only active flows can be linked to for execution
        const targetTrigger = targetFlow.steps.find(s => s.type === 'trigger');
        if (targetTrigger && targetTrigger.nextStepId) {
            const updatedFlowPath = [...newFlowPath, targetFlow.name]; // Add target flow name to the path
            return checkSpamDownstreamRecursive(
                targetTrigger.nextStepId, targetFlow, allFlows, errors, emailSourceStep,
                updatedFlowPath, new Set() // Reset visited steps for the new flow (start fresh)
            );
        }
      }
    }
    return false; // No valid linked flow or trigger step, or target flow is not active
  }

  return false; // Default: this path is safe or dead-ends
};


export const validateFlow = (flowToCheck: Flow, allFlows: Flow[] = []): ValidationError[] => {
  const errors: ValidationError[] = [];
  const steps = flowToCheck.steps || [];

  if (steps.length === 0) {
    errors.push({ msg: 'Quy trình chưa có bước nào', type: 'critical' });
    return errors;
  }

  // Find all steps that are inside a Split Test branch
  const splitTestDescendants = new Set<string>();
  steps.filter(s => s.type === 'split_test').forEach(splitStep => {
    const getAllDescendantStepIds = (startStepId: string | undefined, flowSteps: FlowStep[], collectedIds = new Set<string>()): Set<string> => {
        if (!startStepId || collectedIds.has(startStepId)) {
            return collectedIds;
        }
        collectedIds.add(startStepId);
        const step = flowSteps.find(s => s.id === startStepId);
        if (!step) return collectedIds;

        if (step.nextStepId) {
            getAllDescendantStepIds(step.nextStepId, flowSteps, collectedIds);
        }
        if (step.yesStepId) {
            getAllDescendantStepIds(step.yesStepId, flowSteps, collectedIds);
        }
        if (step.noStepId) {
            getAllDescendantStepIds(step.noStepId, flowSteps, collectedIds);
        }
        if (step.pathAStepId) {
            getAllDescendantStepIds(step.pathAStepId, flowSteps, collectedIds);
        }
        if (step.pathBStepId) {
            getAllDescendantStepIds(step.pathBStepId, flowSteps, collectedIds);
        }
        return collectedIds;
    };
    
    // Gather all children from Branch A
    const branchA = getAllDescendantStepIds(splitStep.pathAStepId, steps);
    // Gather all children from Branch B
    const branchB = getAllDescendantStepIds(splitStep.pathBStepId, steps);
    
    branchA.forEach(id => splitTestDescendants.add(id));
    branchB.forEach(id => splitTestDescendants.add(id));
  });

  // Check Trigger
  const trigger = steps.find(s => s.type === 'trigger');
  if (!trigger) {
    errors.push({ msg: 'Thiếu điểm bắt đầu (Trigger)', type: 'critical' });
  } else {
    if ((trigger.config.type === 'segment' || trigger.config.type === 'form' || trigger.config.type === 'purchase' || trigger.config.type === 'custom_event' || trigger.config.type === 'tag' || trigger.config.type === 'campaign') && !trigger.config.targetId) {
        errors.push({ msg: `Chưa chọn nguồn kích hoạt cho Trigger (${trigger.config.type})`, type: 'critical', stepId: trigger.id });
    }
    
    // Campaign Trigger Constraint: MUST have a 'wait' step immediately after it.
    if (trigger.config.type === 'campaign') {
      const nextStep = steps.find(n => n.id === trigger.nextStepId);
      if (!nextStep || nextStep.type !== 'wait') {
        errors.push({ msg: 'BẮT BUỘC có bước "Chờ" sau Trigger Campaign để tránh lỗi xử lý đồng thời (Spam).', type: 'critical', stepId: trigger.id });
      }
    }
  }

  steps.forEach(s => {
    // 1. Config Validation
    if (s.type === 'action') {
      if (!s.config.subject) errors.push({ msg: `Bước "${s.label}": Thiếu tiêu đề Email`, type: 'critical', stepId: s.id });
      if (!s.config.templateId && !s.config.customHtml) errors.push({ msg: `Bước "${s.label}": Thiếu nội dung Email`, type: 'critical', stepId: s.id });
      if (!s.config.senderEmail) errors.push({ msg: `Bước "${s.label}": Thiếu email người gửi`, type: 'warning', stepId: s.id });
    }

    if (s.type === 'wait') {
      if (!s.config.duration || !s.config.unit) {
        errors.push({ msg: `Bước "${s.label}": Chưa đặt thời gian chờ`, type: 'critical', stepId: s.id });
      }
      // Consecutive Wait Check
      const nextStep = steps.find(n => n.id === s.nextStepId);
      if (nextStep && nextStep.type === 'wait') {
        errors.push({ msg: `CẢNH BÁO: Hai bước chờ liên tiếp ("${s.label}" -> "${nextStep.label}"). Thời gian sẽ cộng dồn.`, type: 'warning', stepId: s.id });
      }
    }

    if (s.type === 'link_flow') {
      if (!s.config.linkedFlowId) {
        errors.push({ msg: `Bước "${s.label}": Chưa chọn Flow đích`, type: 'critical', stepId: s.id });
      } else {
        const target = allFlows.find(f => f.id === s.config.linkedFlowId);
        if (!target || target.status === 'archived') {
          errors.push({ msg: `Bước "${s.label}": Flow đích không tồn tại hoặc đã bị xóa`, type: 'critical', stepId: s.id });
        } else {
          if (s.config.linkedFlowId === flowToCheck.id) {
            errors.push({ msg: `Bước "${s.label}": Không thể link về chính nó (vòng lặp)`, type: 'critical', stepId: s.id });
          }
          if (target.status !== 'active') {
            errors.push({ msg: `Bước "${s.label}": Flow đích "${target.name}" chưa được kích hoạt (Active).`, type: 'warning', stepId: s.id });
          }
          // Check if target flow is triggered by a campaign (Link Flow should not link to Campaign-triggered flows)
          const targetTrigger = target.steps?.find(step => step.type === 'trigger');
          if (targetTrigger && targetTrigger.config.type === 'campaign') {
              errors.push({ msg: `Bước "${s.label}": Không thể link đến Flow "${target.name}" vì nó phụ thuộc vào Chiến dịch.`, type: 'critical', stepId: s.id });
          }
        }
      }
    }

    if (s.type === 'condition') {
      if (!s.yesStepId && !s.noStepId) {
        errors.push({ msg: `Bước "${s.label}": Cần ít nhất một nhánh tiếp theo`, type: 'warning', stepId: s.id });
      }
      if (!s.config.conditionType) {
          errors.push({ msg: `Bước "${s.label}": Chưa chọn loại điều kiện`, type: 'critical', stepId: s.id });
      }
      if (!s.config.waitDuration || !s.config.waitUnit) {
          errors.push({ msg: `Bước "${s.label}": Chưa đặt thời gian chờ của điều kiện`, type: 'critical', stepId: s.id });
      }
      if (s.config.conditionType === 'clicked' && (s.config.linkTargets === undefined || s.config.linkTargets === null)) {
          errors.push({ msg: `Bước "${s.label}": Chưa chọn link cần theo dõi`, type: 'warning', stepId: s.id });
      }
    }

    if (s.type === 'update_tag') {
        if (!s.config.tags || s.config.tags.length === 0) {
            errors.push({ msg: `Bước "${s.label}": Chưa chọn nhãn cần cập nhật`, type: 'critical', stepId: s.id });
        }
        // Logic: Update Tag cannot be inside Split Test (best practice)
        if (splitTestDescendants.has(s.id)) {
            errors.push({ 
                msg: `LOGIC SAI: Không nên đặt "Cập nhật Tag" bên trong nhánh "A/B Test". Hãy đưa nó ra ngoài luồng thử nghiệm.`, 
                type: 'warning', 
                stepId: s.id 
            });
        }
    }
    
    if (s.type === 'list_action') {
        if (!s.config.listId) {
            errors.push({ msg: `Bước "${s.label}": Chưa chọn danh sách cần cập nhật`, type: 'critical', stepId: s.id });
        }
    }

    if (s.type === 'remove_action') {
        if (!s.config.actionType) {
            errors.push({ msg: `Bước "${s.label}": Chưa chọn hành động xóa/hủy đăng ký`, type: 'critical', stepId: s.id });
        }
        // Warning if Remove Action is not preceded by a Condition (for safety)
        // This check requires parent information, which is not easily available in this flat loop.
        // The AddStepModal already prevents this, so this is a 'data integrity' check more than 'builder UX' check.
        // We can add a simple warning if it's not the *first* step after a trigger or a condition's direct "no" path.
    }
  });


  // 3. SPAM Rules: Email -> [0 or more rapid steps] -> Email without Wait/Condition
  // This check is initiated for each 'action' step.
  steps.forEach(s => {
    if (s.type === 'action') {
        const initialFlowPath = [flowToCheck.name]; // Start tracking the flow path
        
        // Start the recursive check from the step immediately following this action email
        checkSpamDownstreamRecursive(
            s.nextStepId,
            flowToCheck,
            allFlows, // Pass all available flows for linked flow resolution
            errors,
            s, // Pass the current action step as the source of the email
            initialFlowPath,
            new Set() // Initialize visited steps for the current flow segment
        );
    }
  });


  return errors;
};
