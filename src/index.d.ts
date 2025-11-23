/**
 * OpenFlow SDK for executing AI agent workflows with x402 micropayments
 */

export interface OpenFlowOptions {
  /**
   * Private key for automatic x402 payment signing
   */
  privateKey?: string;

  /**
   * Base URL of the OpenFlow server
   * @default "http://localhost:3000"
   */
  baseUrl?: string;

  /**
   * Polling interval in milliseconds for workflow status
   * @default 2000
   */
  pollInterval?: number;

  /**
   * Maximum polling attempts before timeout
   * @default 150
   */
  maxPollAttempts?: number;
}

export interface WorkflowConfig {
  /**
   * Input data for the workflow
   */
  input?: Record<string, any>;

  /**
   * Manual x402 payment header (required if no privateKey)
   */
  xPayment?: string;

  /**
   * Use test mode
   * @default true
   */
  testMode?: boolean;
}

export interface WorkflowResult {
  /**
   * Unique execution ID for this workflow run
   */
  executionId: string;

  /**
   * Workflow identifier
   */
  workflowId: string;

  /**
   * Execution status
   */
  status: "completed" | "failed";

  /**
   * Workflow output data
   */
  output: any;

  /**
   * IPFS CID for the final state
   */
  ipfsCid: string;

  /**
   * Filecoin piece CID
   */
  pieceCid: string;

  /**
   * Filecoin provider URL
   */
  provider: string;

  /**
   * Completion timestamp
   */
  completedTime: string;
}

export interface WorkflowState {
  /**
   * Unique execution ID
   */
  executionId: string;

  /**
   * Workflow identifier
   */
  workflowId: string;

  /**
   * IPFS CID for current state
   */
  ipfsCid: string;

  /**
   * Current execution status
   */
  status: "processing" | "completed" | "failed";

  /**
   * Full state data
   */
  data: {
    status: string;
    workflowId: string;
    executionId: string;
    input: any;
    output?: any;
    startTime?: string;
    completedTime?: string;
    error?: string;
  };
}

export class OpenFlow {
  /**
   * Create a new OpenFlow client
   */
  constructor(options?: OpenFlowOptions);

  /**
   * Execute a workflow and wait for completion
   * @param slug - Workflow slug identifier
   * @param config - Workflow configuration
   * @returns Workflow result with output data
   */
  run(slug: string, config?: WorkflowConfig): Promise<WorkflowResult>;

  /**
   * Get workflow state without polling
   * @param executionId - Execution ID to query
   * @returns Current workflow state
   */
  getState(executionId: string): Promise<WorkflowState>;
}

export default OpenFlow;
