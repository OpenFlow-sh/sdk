import { OpenFlow } from "../src/index.js";

/**
 * Basic example of using OpenFlow SDK
 */
async function main() {
  console.log("🚀 OpenFlow SDK Example\n");

  // Example 1: With private key (automatic payment signing)
  console.log("Example 1: Using private key for automatic payment signing");
  const openFlowWithKey = new OpenFlow({
    privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    baseUrl: "http://localhost:3000",
    pollInterval: 2000, // Poll every 2 seconds
    maxPollAttempts: 150, // 5 minutes max
  });

  try {
    const result = await openFlowWithKey.run("top-5-cities-workflow", {
      input: {
        country: "USA",
        criteria: "population",
      },
    });

    console.log("✅ Workflow completed!");
    console.log("Execution ID:", result.executionId);
    console.log("Output:", result.output);
    console.log("IPFS CID:", result.ipfsCid);
    console.log("Filecoin Piece CID:", result.pieceCid);
    console.log("Provider:", result.provider);
    console.log();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  // Example 2: Without private key (manual payment header)
  console.log("\nExample 2: Using manual X-Payment header");
  const openFlowManual = new OpenFlow({
    baseUrl: "http://localhost:3000",
  });

  try {
    const result = await openFlowManual.run("top-5-cities-workflow", {
      input: {
        country: "USA",
        criteria: "population",
      },
      xPayment: "your-x-payment-header-here",
    });

    console.log("✅ Workflow completed!");
    console.log("Output:", result.output);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  // Example 3: Get workflow state
  console.log("\nExample 3: Getting workflow state");
  try {
    const state = await openFlowWithKey.getState("some-execution-id");
    console.log("Current state:", state.status);
    console.log("Data:", state.data);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
