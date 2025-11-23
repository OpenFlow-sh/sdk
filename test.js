import { OpenFlow } from "./src/index.js";

async function test() {
  console.log("🧪 Testing OpenFlow SDK\n");

  const openFlow = new OpenFlow({
    privateKey: "0x6e33c4b2889465237da5941e833902d2db086acb691b2e536e728f491cc2c757",
    baseUrl: "http://localhost:3000",
    pollInterval: 3000,
    maxPollAttempts: 100,
  });

  try {
    console.log("▶ Running workflow...");
    const result = await openFlow.run("universal-executor", {
      input: {
        test: "data"
      },
    });

    console.log("\n✅ Success!");
    console.log("Execution ID:", result.executionId);
    console.log("Status:", result.status);
    console.log("Output:", result.output);
    console.log("IPFS CID:", result.ipfsCid);
    console.log("Provider:", result.provider);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

test();
