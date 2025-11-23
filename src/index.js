import { wrapFetchWithPayment } from "x402-fetch";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

/**
 * OpenFlow SDK for executing AI agent workflows with x402 micropayments
 */
export class OpenFlow {
  /**
   * Create a new OpenFlow client
   * @param {Object} options - Configuration options
   * @param {string} [options.privateKey] - Private key for automatic x402 payment signing
   * @param {string} [options.baseUrl] - Base URL of the OpenFlow server (default: https://workflow-api.openflow.sh)
   * @param {number} [options.pollInterval] - Polling interval in ms for workflow status (default: 2000)
   * @param {number} [options.maxPollAttempts] - Maximum polling attempts before timeout (default: 150, ~5 minutes)
   */
  constructor(options = {}) {
    this.privateKey = options.privateKey || null;
    this.baseUrl = options.baseUrl || "https://workflow-api.openflow.sh";
    this.pollInterval = options.pollInterval || 2000; // 2 seconds
    this.maxPollAttempts = options.maxPollAttempts || 150; // ~5 minutes max

    // Initialize x402-fetch if private key is provided
    if (this.privateKey) {
      const account = privateKeyToAccount(this.privateKey);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(),
      });
      this.x402Fetch = wrapFetchWithPayment(fetch, walletClient);
    } else {
      this.x402Fetch = null;
    }
  }

  /**
   * Execute a workflow and wait for completion
   * @param {string} slug - Workflow slug identifier
   * @param {Object} config - Workflow configuration
   * @param {Object} [config.input] - Input data for the workflow
   * @param {string} [config.xPayment] - Manual x402 payment header (required if no privateKey)
   * @param {boolean} [config.testMode] - Use test mode (default: true)
   * @returns {Promise<Object>} Workflow result with output data
   */
  async run(slug, config = {}) {
    const { input = {}, xPayment, testMode = true } = config;

    // Validate payment method
    if (!this.privateKey && !xPayment) {
      throw new Error(
        "Either privateKey must be provided in OpenFlow constructor or xPayment header must be provided in config"
      );
    }

    // Execute workflow
    const execution = await this._executeWorkflow(
      slug,
      input,
      xPayment,
      testMode
    );

    // Poll for completion
    const result = await this._pollForCompletion(execution.executionId);

    return {
      executionId: execution.executionId,
      workflowId: execution.workflowId,
      status: result.status,
      output: result.data.output,
      ipfsCid: result.ipfsCid,
      pieceCid: execution.pieceCid,
      provider: execution.provider,
      completedTime: result.data.completedTime,
    };
  }

  /**
   * Execute workflow and get initial response
   * @private
   */
  async _executeWorkflow(slug, input, xPayment, testMode) {
    const endpoint = testMode ? "/test-workflow" : "/workflow/:slug";
    const url = `${this.baseUrl}${endpoint}`;

    const body = {
      slug,
      input,
    };

    let response;

    if (this.x402Fetch) {
      // Use x402-fetch for automatic payment signing
      response = await this.x402Fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } else {
      // Manual fetch with provided xPayment header
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPayment,
        },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Workflow execution failed: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `Workflow execution failed: ${data.error || "Unknown error"}`
      );
    }

    return {
      executionId: data.executionId,
      workflowId: data.workflowId,
      ipfsCid: data.ipfsCid,
      pieceCid: data.pieceCid,
      provider: data.provider,
      status: data.status,
    };
  }

  /**
   * Poll workflow state until completion
   * @private
   */
  async _pollForCompletion(executionId) {
    let attempts = 0;

    while (attempts < this.maxPollAttempts) {
      attempts++;

      const state = await this._getWorkflowState(executionId);

      if (state.status === "completed") {
        return state;
      }

      if (state.status === "failed") {
        throw new Error(
          `Workflow execution failed: ${state.data.error || "Unknown error"}`
        );
      }

      // Wait before next poll
      await this._sleep(this.pollInterval);
    }

    throw new Error(
      `Workflow execution timeout after ${this.maxPollAttempts} attempts`
    );
  }

  /**
   * Get current workflow state
   * @private
   */
  async _getWorkflowState(executionId) {
    const url = `${this.baseUrl}/workflow-state/${executionId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get workflow state: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        `Failed to get workflow state: ${data.error || "Unknown error"}`
      );
    }

    return {
      executionId: data.executionId,
      workflowId: data.workflowId,
      ipfsCid: data.ipfsCid,
      status: data.status,
      data: data.data,
    };
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get workflow state without polling
   * @param {string} executionId - Execution ID to query
   * @returns {Promise<Object>} Current workflow state
   */
  async getState(executionId) {
    return await this._getWorkflowState(executionId);
  }
}

export default OpenFlow;
