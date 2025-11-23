"use client";

import React, { useState } from "react";
import { useAgentsContext } from "@/refresh-components/contexts/AgentsContext";
import { ProjectFile } from "@/app/chat/projects/projectsService";

interface Workflow {
  id: string;
  name: string;
  description: string;
  cost: number;
  tool_id: number;
}

interface WorkflowSelectorProps {
  workflows: Workflow[];
  userBalance: number;
  onSubmit?: (params: {
    message: string;
    currentMessageFiles: ProjectFile[];
    useAgentSearch: boolean;
  }) => Promise<void>;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  userBalance,
  onSubmit,
}) => {
  const { setForcedToolIds } = useAgentsContext();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async (workflow: Workflow) => {
    if (!onSubmit) {
      console.error("onSubmit is not available");
      return;
    }

    if (workflow.cost > userBalance) {
      alert(`Insufficient balance. You need ${workflow.cost} credits but have ${userBalance}.`);
      return;
    }

    setIsExecuting(true);
    
    try {
      // Establecer el tool_id que queremos forzar
      setForcedToolIds([workflow.tool_id]);
      
      // Enviar el mensaje con el workflow a ejecutar
      await onSubmit({
        message: `Execute workflow: ${workflow.id}`,
        currentMessageFiles: [],
        useAgentSearch: false,
      });
      
      // Limpiar forcedToolIds DESPUÉS del envío
      setForcedToolIds([]);
    } catch (error) {
      console.error("Error executing workflow:", error);
      setForcedToolIds([]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-background-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Available Workflows</h3>
        <div className="text-sm text-text-500">
          Balance: <span className="font-bold">{userBalance}</span> credits
        </div>
      </div>

      <div className="grid gap-3">
        {workflows.map((workflow) => {
          const canAfford = workflow.cost <= userBalance;
          
          return (
            <div
              key={workflow.id}
              className={`
                p-4 rounded-lg border
                ${canAfford ? 'border-border-300 hover:border-accent-600' : 'border-border-200 opacity-60'}
                transition-colors
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-text-800">{workflow.name}</h4>
                  <p className="text-sm text-text-600 mt-1">{workflow.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-accent-600">
                    {workflow.cost} credits
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleExecute(workflow)}
                disabled={!canAfford || isExecuting || !onSubmit}
                className={`
                  w-full mt-3 px-4 py-2 rounded-md font-medium
                  transition-colors
                  ${
                    canAfford && !isExecuting && onSubmit
                      ? 'bg-accent-600 hover:bg-accent-700 text-white'
                      : 'bg-background-300 text-text-400 cursor-not-allowed'
                  }
                `}
              >
                {isExecuting ? 'Executing...' : canAfford ? 'Execute' : 'Insufficient Balance'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};