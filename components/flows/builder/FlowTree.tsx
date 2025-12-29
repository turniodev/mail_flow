
import React from 'react';
import { FlowStep, Flow, FormDefinition } from '../../../types';
import { AddBtn, ErrorConnector } from './FlowTools';
import { ActionNode, WaitNode, ConditionNode, TriggerNode, LinkNode, GhostNode, SplitTestNode, RemoveNode, ListActionNode } from '../nodes/FlowNodes';
import { StraightConnector, BranchConnector } from './FlowConnector';
import { Flag } from 'lucide-react';

interface FlowTreeProps {
  stepId?: string;
  parentId?: string;
  parentType?: string;
  branch?: 'yes' | 'no' | 'A' | 'B';
  flow: Flow;
  allFlows: Flow[];
  allForms?: FormDefinition[];
  isViewMode?: boolean;
  draggedStepId: string | null;
  onEditStep: (step: FlowStep) => void;
  onAddStep: (parentId: string, branch?: 'yes' | 'no' | 'A' | 'B', isInsert?: boolean) => void;
  onQuickAddWait: (parentId: string, branch?: 'yes' | 'no' | 'A' | 'B') => void;
  onSwapSteps: (sourceId: string, targetId: string) => void;
  setDraggedStepId: (id: string | null) => void;
  depth?: number;
}

const FlowTree: React.FC<FlowTreeProps> = ({ 
    stepId, parentId, parentType, branch, 
    flow, allFlows, allForms = [], isViewMode = false, draggedStepId,
    onEditStep, onAddStep, onQuickAddWait, onSwapSteps, setDraggedStepId,
    depth = 0
}) => {
  if (!stepId) return null;
  const steps = flow.steps || [];
  const step = steps.find(s => s.id === stepId);
  if (!step) return null;

  const isCondition = step.type === 'condition';
  const isSplitTest = step.type === 'split_test';
  const isLink = step.type === 'link_flow';
  const isRemove = step.type === 'remove_action';
  
  // Logic: Only show red error connector if Email (Action) follows Email (Action). 
  // Update List, Tag, etc. are considered non-spam triggers in visual tree.
  const hasSpamError = parentType === 'action' && step.type === 'action';

  const commonProps = {
    step,
    isDraggable: step.type !== 'trigger' && !isViewMode, 
    isDragTarget: draggedStepId !== step.id && draggedStepId !== null && !isViewMode, 
    hasError: hasSpamError,
    isViewMode,
    allForms,
    onClick: () => onEditStep(step),
    onDragStart: (e: React.DragEvent) => {
         if (step.type === 'trigger' || isViewMode) return;
         setDraggedStepId(step.id);
         e.dataTransfer.setData('text/plain', step.id);
         e.dataTransfer.effectAllowed = 'move';
         e.stopPropagation();
    },
    onDragOver: (e: React.DragEvent) => {
         if (draggedStepId && draggedStepId !== step.id && !isViewMode) {
             e.preventDefault(); 
             e.dataTransfer.dropEffect = 'move';
         }
    },
    onDrop: (e: React.DragEvent) => {
         if (isViewMode) return;
         e.preventDefault();
         e.stopPropagation();
         const sourceId = e.dataTransfer.getData('text/plain');
         if (sourceId && sourceId !== step.id) {
             onSwapSteps(sourceId, step.id);
             setDraggedStepId(null);
         }
    }
  };

  const nextProps = { flow, allFlows, allForms, isViewMode, draggedStepId, onEditStep, onAddStep, onQuickAddWait, onSwapSteps, setDraggedStepId, depth: depth + 1 };
  const CONNECTOR_HEIGHT = 100; 

  const handleDropOnAdd = (e: React.DragEvent, pId: string, br?: any) => {
      if (isViewMode) return;
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== pId) {
          onSwapSteps(sourceId, pId);
          setDraggedStepId(null);
      }
  };

  return (
    <div className="flex flex-col items-center relative animate-in fade-in duration-500 w-max min-w-full">
      
      {parentId && !hasSpamError && !branch && !isViewMode && (
        <AddBtn 
            onClick={() => onAddStep(parentId, undefined, true)}
            onQuickWait={() => onQuickAddWait(parentId)} 
            isDropTarget={!!draggedStepId} 
            onDrop={(e) => handleDropOnAdd(e, parentId)} 
        />
      )}

      {hasSpamError && parentId && !isViewMode && (
        <ErrorConnector parentId={parentId} branch={branch as any} onQuickFix={onQuickAddWait} />
      )}

      {parentId && hasSpamError && isViewMode && (
         <StraightConnector height={40} isError={true} />
      )}

      {!parentId && !isViewMode && <div className="h-6" />}
      {parentId && !hasSpamError && isViewMode && !branch && <StraightConnector height={40} />}
      
      <div className="z-10 relative" id={`step-node-${step.id}`}>
          {(() => {
            switch (step.type) {
                case 'trigger': return <TriggerNode {...commonProps} />;
                case 'wait': return <WaitNode {...commonProps} />;
                case 'condition': return <ConditionNode {...commonProps} />;
                case 'split_test': return <SplitTestNode {...commonProps} />;
                case 'link_flow': return <LinkNode {...commonProps} allFlows={allFlows} hasError={!step.config.linkedFlowId} />;
                case 'remove_action': return <RemoveNode {...commonProps} />;
                case 'list_action': return <ListActionNode {...commonProps} />;
                default: return <ActionNode {...commonProps} />;
            }
          })()}
      </div>

      <div className="w-full flex flex-col items-center">
        {/* Terminate flow if remove action (delete or unsubscribe usually stops the flow) */}
        {isRemove ? (
            <div className="mt-2 flex flex-col items-center opacity-30">
                <Flag className="w-5 h-5 text-rose-400" />
                <span className="text-[9px] font-black text-rose-400 uppercase mt-0.5">Terminated</span>
            </div>
        ) : isLink ? (
           step.config.linkedFlowId && (
              <div className="flex flex-col items-center">
                  <StraightConnector height={40} />
                  <GhostNode label={`Kịch bản: ${allFlows.find(f => f.id === step.config.linkedFlowId)?.name || '...'}`} />
              </div>
           )
        ) : (isCondition || isSplitTest) ? (
            <div className="flex flex-col items-center w-full relative">
                <div className="relative flex flex-nowrap w-max" style={{ paddingTop: CONNECTOR_HEIGHT }}>
                    <BranchConnector 
                        height={CONNECTOR_HEIGHT} 
                        dashed={true}
                        leftColor={isCondition ? "#10b981" : "#8b5cf6"}
                        rightColor={isCondition ? "#f43f5e" : "#8b5cf6"}
                    />

                    <div className="flex-1 flex flex-col items-center relative px-20 min-w-[300px]">
                        <div className={`absolute top-[-50px] z-20 px-4 py-1.5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-widest border transform -translate-y-1/2 ring-4 ${isCondition ? 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-emerald-50/50' : 'bg-white border-violet-200 text-violet-500 ring-violet-50/50'}`}>
                            {isCondition ? 'Đúng' : `NHÁNH A`}
                        </div>
                        {isCondition ? (
                            step.yesStepId ? <FlowTree stepId={step.yesStepId} parentId={step.id} parentType={step.type} branch="yes" {...nextProps} /> : 
                            !isViewMode && (
                              <div className="flex flex-col items-center mt-4">
                                  <AddBtn isDropTarget={!!draggedStepId} onDrop={(e) => handleDropOnAdd(e, step.id, 'yes')} onClick={() => onAddStep(step.id, 'yes')} onQuickWait={() => onQuickAddWait(step.id, 'yes')} branch="yes" />
                                  <div className="flex flex-col items-center mt-4 opacity-30">
                                      <Flag className="w-5 h-5 text-slate-300" />
                                      <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">End</span>
                                  </div>
                              </div>
                            )
                        ) : (
                            step.pathAStepId ? <FlowTree stepId={step.pathAStepId} parentId={step.id} parentType={step.type} branch="A" {...nextProps} /> : 
                            !isViewMode && (
                              <div className="flex flex-col items-center mt-4">
                                  <AddBtn isDropTarget={!!draggedStepId} onDrop={(e) => handleDropOnAdd(e, step.id, 'A')} onClick={() => onAddStep(step.id, 'A')} onQuickWait={() => onQuickAddWait(step.id, 'A')} branch="A" />
                                  <div className="flex flex-col items-center mt-4 opacity-30">
                                      <Flag className="w-5 h-5 text-slate-300" />
                                      <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">End</span>
                                  </div>
                              </div>
                            )
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-center relative px-20 min-w-[300px]">
                        <div className={`absolute top-[-50px] z-20 px-4 py-1.5 rounded-full shadow-lg text-[10px] font-bold uppercase tracking-widest border transform -translate-y-1/2 ring-4 ${isCondition ? 'bg-rose-50 border-rose-200 text-rose-500 ring-rose-50/50' : 'bg-white border-slate-200 text-slate-400 ring-slate-50/50'}`}>
                            {isCondition ? 'Sai' : `NHÁNH B`}
                        </div>
                        {isCondition ? (
                            step.noStepId ? <FlowTree stepId={step.noStepId} parentId={step.id} parentType={step.type} branch="no" {...nextProps} /> : 
                            !isViewMode && (
                              <div className="flex flex-col items-center mt-4">
                                  <AddBtn isDropTarget={!!draggedStepId} onDrop={(e) => handleDropOnAdd(e, step.id, 'no')} onClick={() => onAddStep(step.id, 'no')} onQuickWait={() => onQuickAddWait(step.id, 'no')} branch="no" />
                                  <div className="flex flex-col items-center mt-4 opacity-30">
                                      <Flag className="w-5 h-5 text-slate-300" />
                                      <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">End</span>
                                  </div>
                              </div>
                            )
                        ) : (
                            step.pathBStepId ? <FlowTree stepId={step.pathBStepId} parentId={step.id} parentType={step.type} branch="B" {...nextProps} /> : 
                            !isViewMode && (
                              <div className="flex flex-col items-center mt-4">
                                  <AddBtn isDropTarget={!!draggedStepId} onDrop={(e) => handleDropOnAdd(e, step.id, 'B')} onClick={() => onAddStep(step.id, 'B')} onQuickWait={() => onQuickAddWait(step.id, 'B')} branch="B" />
                                  <div className="flex flex-col items-center mt-4 opacity-30">
                                      <Flag className="w-5 h-5 text-slate-300" />
                                      <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">End</span>
                                  </div>
                              </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center w-full">
                {step.nextStepId ? (
                    <FlowTree stepId={step.nextStepId} parentId={step.id} parentType={step.type} {...nextProps} />
                ) : (
                    !isViewMode && (
                      <>
                          <AddBtn 
                              isDropTarget={!!draggedStepId} 
                              onDrop={(e) => handleDropOnAdd(e, step.id)} 
                              onClick={() => onAddStep(step.id)} 
                              onQuickWait={() => onQuickAddWait(step.id)}
                          />
                          <div className="mt-2 flex flex-col items-center opacity-20">
                              <Flag className="w-5 h-5 text-slate-400" />
                              <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5">End</span>
                          </div>
                      </>
                    )
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default FlowTree;
