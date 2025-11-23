# Workflow Management MCP Server

MCP server for managing and executing paid workflows in Onyx.

## Features

- **suggest_workflows**: List available workflows with pricing and user balance
- **execute_workflow**: Execute a specific workflow and manage credits

## Installation

```bash
cd mcp-servers/workflow-server
pip install -r requirements.txt
```

## Configuration

The server requires a tool ID from Onyx's database. This ID must be provided when starting the server.

### Getting the Tool ID

After registering the MCP server in Onyx's Admin Panel:

1. Go to Onyx Admin Panel → MCP Servers
2. Register this server (stdio transport)
3. Query the database to get the tool ID:

```sql
SELECT id, name FROM tool WHERE name = 'execute_workflow';
```

Or use the API:

```bash
curl http://localhost:3000/api/admin/tool?mcp_server_id=<your_server_id>
```

## Usage

### Running the Server

```bash
# Set the tool ID from database
export WORKFLOW_TOOL_ID=42

# Run the server
python server.py --tool-id $WORKFLOW_TOOL_ID
```

### Registering in Onyx

1. Open Onyx Admin Panel: `http://localhost:3000/admin/mcp-servers`
2. Click "Add MCP Server"
3. Configure:
   - **Name**: `workflow-server`
   - **Type**: `stdio`
   - **Command**: `python /path/to/mcp-servers/workflow-server/server.py --tool-id <TOOL_ID>`
4. Save

The server will automatically register its tools in Onyx's database.

## Tools

### suggest_workflows

Returns a list of available workflows with their details and user balance.

**Response Format:**
```json
{
  "type": "workflow_list",
  "data": {
    "workflows": [
      {
        "id": "data_processing",
        "name": "Data Processing Pipeline",
        "description": "Process and analyze large datasets with AI",
        "cost": 5,
        "tool_id": 42
      }
    ],
    "user_balance": 100
  }
}
```

### execute_workflow

Executes a specific workflow by ID.

**Parameters:**
- `workflow_id` (string): ID of the workflow to execute

**Response Format:**
```json
{
  "success": true,
  "workflow_id": "data_processing",
  "workflow_name": "Data Processing Pipeline",
  "message": "Workflow 'Data Processing Pipeline' executed successfully",
  "credits_used": 5,
  "remaining_balance": 95,
  "result": {
    "status": "completed",
    "execution_time": "2.5s",
    "output": "Workflow Data Processing Pipeline completed successfully"
  }
}
```

## Development

### Adding New Workflows

Edit the `WorkflowManager` class in [`server.py`](server.py:65):

```python
self.workflows = [
    Workflow(
        id="your_workflow_id",
        name="Your Workflow Name",
        description="Workflow description",
        cost=10,
        tool_id=tool_id
    ),
    # ... more workflows
]
```

### Database Integration

For production, replace the mock data with actual database queries:

```python
def get_user_balance(self, user_id: str) -> int:
    # TODO: Query actual database
    return db.query("SELECT balance FROM users WHERE id = ?", user_id)
```

## Architecture

The server follows Onyx's MCP integration pattern:

1. **Frontend**: User sees workflows → clicks "Execute"
2. **WorkflowSelector**: Sets `forcedToolIds` → calls `onSubmit`
3. **Backend**: Receives `forced_tool_ids` → executes ONLY `execute_workflow`
4. **MCP Server**: Processes workflow → returns result
5. **Frontend**: Displays result → clears `forcedToolIds`

## Troubleshooting

### Tool ID not found

**Error**: `Tool ID is required`

**Solution**: Make sure to provide the tool ID when starting the server:
```bash
python server.py --tool-id 42
```

### Server not registered in Onyx

**Error**: Tools not appearing in Onyx

**Solution**: 
1. Check Admin Panel → MCP Servers
2. Verify the server is registered and active
3. Check Onyx backend logs for registration errors

### Workflow execution fails

**Error**: `Insufficient balance` or `Workflow not found`

**Solution**:
- Verify the workflow ID matches those defined in server
- Check user balance is sufficient
- Review server logs for detailed errors

## License

Same as Onyx project