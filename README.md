# OpenFlow SDK

Execute AI agent workflows on demand with x402 micropayments, powered by Filecoin, IPNS and IPFS with Coinbase APIs.

## Features

- **Simple API**: Execute workflows with a single `run()` call
- **Automatic Payment**: Optional private key for seamless x402 payment signing
- **Async Execution**: Automatically polls workflow state until completion
- **IPFS/Filecoin**: Verifiable, permanent storage of workflow states
- **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install @openflow/sdk
```

## Quick Start

### With Automatic Payment Signing

```javascript
import { OpenFlow } from "@openflow/sdk";

const openFlow = new OpenFlow({
  privateKey: "0x1234567890abcdef...", // Your private key for x402 payments
  baseUrl: "http://localhost:3000", // OpenFlow server URL
});

const result = await openFlow.run("top-5-cities-workflow", {
  input: {
    country: "USA",
    criteria: "population",
  },
});

console.log(result.output);
// [{name: 'New York'}, {name: 'Los Angeles'}, ...]
```

### With Manual Payment Header

If you prefer to handle x402 payment signing yourself:

```javascript
const openFlow = new OpenFlow({
  baseUrl: "http://localhost:3000",
});

const result = await openFlow.run("top-5-cities-workflow", {
  input: {
    country: "USA",
  },
  xPayment: "your-x-payment-header",
});

console.log(result.output);
```

## API Reference

### `new OpenFlow(options)`

Create a new OpenFlow client.

**Options:**

| Option            | Type     | Default                   | Description                                    |
| ----------------- | -------- | ------------------------- | ---------------------------------------------- |
| `privateKey`      | `string` | `null`                    | Private key for automatic x402 payment signing |
| `baseUrl`         | `string` | `"http://localhost:3000"` | OpenFlow server URL                            |
| `pollInterval`    | `number` | `2000`                    | Polling interval in ms for workflow status     |
| `maxPollAttempts` | `number` | `150`                     | Maximum polling attempts (~5 min timeout)      |

**Example:**

```javascript
const openFlow = new OpenFlow({
  privateKey: "0x...",
  baseUrl: "https://workflow-api.openflow.sh",
  pollInterval: 3000, // Poll every 3 seconds
  maxPollAttempts: 100, // ~5 minute timeout
});
```

### `openFlow.run(slug, config)`

Execute a workflow and wait for completion.

**Parameters:**

| Parameter         | Type      | Required      | Description                     |
| ----------------- | --------- | ------------- | ------------------------------- |
| `slug`            | `string`  | Yes           | Workflow slug identifier        |
| `config`          | `object`  | No            | Workflow configuration          |
| `config.input`    | `object`  | No            | Input data for the workflow     |
| `config.xPayment` | `string`  | Conditional\* | Manual x402 payment header      |
| `config.testMode` | `boolean` | No            | Use test mode (default: `true`) |

\*Required if no `privateKey` was provided in constructor

**Returns:** `Promise<WorkflowResult>`

```typescript
{
  executionId: string; // Unique execution ID
  workflowId: string; // Workflow identifier
  status: "completed"; // Final status
  output: any; // Workflow output data
  ipfsCid: string; // IPFS CID for final state
  pieceCid: string; // Filecoin piece CID
  provider: string; // Filecoin provider URL
  completedTime: string; // ISO timestamp
}
```

**Example:**

```javascript
const result = await openFlow.run("sentiment-analysis", {
  input: {
    text: "OpenFlow is amazing!",
  },
  testMode: true,
});

console.log(result.output);
// { sentiment: "positive", score: 0.95 }
```

### `openFlow.getState(executionId)`

Get current workflow state without polling.

**Parameters:**

| Parameter     | Type     | Required | Description           |
| ------------- | -------- | -------- | --------------------- |
| `executionId` | `string` | Yes      | Execution ID to query |

**Returns:** `Promise<WorkflowState>`

```typescript
{
  executionId: string;
  workflowId: string;
  ipfsCid: string;
  status: "processing" | "completed" | "failed";
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
```

**Example:**

```javascript
const state = await openFlow.getState("f47ac10b-58cc-4372-a567-0e02b2c3d479");

if (state.status === "completed") {
  console.log("Output:", state.data.output);
} else {
  console.log("Still processing...");
}
```

## How It Works

### 1. Workflow Execution

When you call `run()`, the SDK:

1. Sends a POST request to the OpenFlow server with your workflow slug and input
2. Automatically signs the request with x402 payment (if `privateKey` provided)
3. Receives an `executionId` for tracking

### 2. Automatic Polling

The SDK automatically polls the workflow state:

1. Checks workflow status every `pollInterval` milliseconds
2. Continues until status is `"completed"` or `"failed"`
3. Returns final result with output data

### 3. IPFS/Filecoin Storage

All workflow states are stored on:

- **IPFS**: Fast, mutable access via IPNS registry
- **Filecoin**: Permanent, verifiable storage

Each execution gets:

- Unique `executionId` (UUID v4)
- IPFS CID for current state
- Filecoin piece CID for permanent record
- IPNS name for dynamic updates

## Error Handling

The SDK throws errors for:

- Missing payment method (no `privateKey` or `xPayment`)
- Workflow execution failures
- Network errors
- Timeouts (exceeding `maxPollAttempts`)

**Example:**

```javascript
try {
  const result = await openFlow.run("my-workflow", { input: {} });
  console.log(result.output);
} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Workflow took too long");
  } else if (error.message.includes("failed")) {
    console.error("Workflow execution failed");
  } else {
    console.error("Unknown error:", error.message);
  }
}
```

## Advanced Usage

### Custom Polling Configuration

For long-running workflows:

```javascript
const openFlow = new OpenFlow({
  privateKey: "0x...",
  pollInterval: 5000, // Poll every 5 seconds
  maxPollAttempts: 300, // 25 minute timeout
});
```

### Production vs Test Mode

```javascript
// Test mode (default) - uses /test-workflow endpoint
const testResult = await openFlow.run("my-workflow", {
  input: {},
  testMode: true,
});

// Production mode - uses /workflow/:slug endpoint
const prodResult = await openFlow.run("my-workflow", {
  input: {},
  testMode: false,
});
```

### Multiple Concurrent Executions

Execute the same workflow multiple times concurrently:

```javascript
const [result1, result2, result3] = await Promise.all([
  openFlow.run("my-workflow", { input: { id: 1 } }),
  openFlow.run("my-workflow", { input: { id: 2 } }),
  openFlow.run("my-workflow", { input: { id: 3 } }),
]);

console.log("All executions completed!");
```

### Manual State Tracking

Track workflow progress manually:

```javascript
const execution = await openFlow.run("long-workflow", {
  input: {},
});

// Later, check status
const state = await openFlow.getState(execution.executionId);

if (state.status === "processing") {
  console.log("Still running...");
} else if (state.status === "completed") {
  console.log("Done!", state.data.output);
}
```

## x402 Payment Integration

OpenFlow uses [x402](https://github.com/yourusername/x402) for cryptocurrency micropayments.

### Automatic Signing (Recommended)

Provide your private key to the SDK:

```javascript
const openFlow = new OpenFlow({
  privateKey: process.env.PRIVATE_KEY, // Store securely!
});

// SDK automatically signs all requests
const result = await openFlow.run("my-workflow", { input: {} });
```

### Manual Signing

Generate x402 payment header yourself:

```javascript
import { generateX402Header } from "x402-fetch";

const xPayment = generateX402Header({
  privateKey: "0x...",
  amount: "0.001",
  // ... other x402 params
});

const openFlow = new OpenFlow(); // No privateKey

const result = await openFlow.run("my-workflow", {
  input: {},
  xPayment,
});
```

## Examples

See the `examples/` directory for complete examples:

- `basic.js` - Basic usage with automatic and manual payment
- `advanced.js` - Advanced patterns and error handling
- `concurrent.js` - Multiple concurrent workflow executions

## Development

### Run Examples

```bash
npm install
npm test
```

### Build

```bash
npm run build
```

## TypeScript

Full TypeScript definitions are included:

```typescript
import { OpenFlow, WorkflowResult, WorkflowState } from "@openflow/sdk";

const openFlow = new OpenFlow({
  privateKey: "0x...",
});

const result: WorkflowResult = await openFlow.run("my-workflow", {
  input: {
    text: "Hello world",
  },
});
```

## Requirements

- Node.js >= 18.0.0
- x402-fetch (automatically installed)

## Architecture

```
┌─────────────┐
│   Your App  │
└──────┬──────┘
       │ openFlow.run()
       ▼
┌─────────────────┐
│  OpenFlow SDK   │
│                 │
│ - x402 signing  │
│ - State polling │
│ - Error handling│
└────────┬────────┘
         │ HTTP + X-Payment
         ▼
┌─────────────────────┐
│  OpenFlow Server    │
│                     │
│ - Workflow executor │
│ - n8n integration   │
│ - IPNS registry     │
└──────┬─────┬────────┘
       │     │
       │     │ IPFS/Filecoin
       │     ▼
       │ ┌─────────────┐
       │ │   Storage   │
       │ │             │
       │ │ - IPFS CIDs │
       │ │ - IPNS names│
       │ │ - Filecoin  │
       │ └─────────────┘
       │
       │ Execute
       ▼
┌─────────────┐
│     n8n     │
│  Workflows  │
└─────────────┘
```

## License

MIT

## Support

For issues and questions:

- GitHub Issues: https://github.com/yourusername/openflow-sdk/issues
- Documentation: https://docs.openflow.sh

---

Made with ❤️ by the OpenFlow team
