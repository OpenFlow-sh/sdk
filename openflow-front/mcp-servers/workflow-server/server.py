"""Workflow Management MCP Server for Onyx.

This server provides tools for managing and executing paid workflows through Onyx.
It exposes two main tools:
  - suggest_workflows: Returns available workflows with pricing
  - execute_workflow: Executes a specific workflow and deducts credits

Environment variables:
    - WORKFLOW_DB_URL: Database connection string for workflow data
    - WORKFLOW_API_KEY: API key for workflow service authentication
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Optional

from fastmcp import FastMCP

logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_USER_BALANCE = 100


@dataclass
class Workflow:
    """Represents a workflow definition."""
    id: str
    name: str
    description: str
    cost: int
    tool_id: int  # ID from Onyx's tool table
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "cost": self.cost,
            "tool_id": self.tool_id
        }


class WorkflowManager:
    """Manages workflow definitions and user balances."""
    
    def __init__(self, tool_id: int):
        self.tool_id = tool_id
        # In production, load from database
        self.workflows = [
            Workflow(
                id="data_processing",
                name="Data Processing Pipeline",
                description="Process and analyze large datasets with AI",
                cost=5,
                tool_id=tool_id
            ),
            Workflow(
                id="report_generation",
                name="Report Generation",
                description="Generate comprehensive reports from data",
                cost=3,
                tool_id=tool_id
            ),
            Workflow(
                id="code_review",
                name="Automated Code Review",
                description="AI-powered code review and suggestions",
                cost=2,
                tool_id=tool_id
            )
        ]
    
    def get_all_workflows(self) -> list[Workflow]:
        """Get all available workflows."""
        return self.workflows
    
    def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get a specific workflow by ID."""
        for wf in self.workflows:
            if wf.id == workflow_id:
                return wf
        return None
    
    def get_user_balance(self, user_id: str = "default") -> int:
        """Get user's credit balance."""
        # In production, fetch from database
        return DEFAULT_USER_BALANCE
    
    def deduct_credits(self, user_id: str, amount: int) -> bool:
        """Deduct credits from user balance."""
        # In production, update database
        balance = self.get_user_balance(user_id)
        if balance >= amount:
            logger.info(f"Deducted {amount} credits from user {user_id}")
            return True
        return False


def build_mcp_server(tool_id: int) -> FastMCP:
    """Build the MCP server with workflow tools."""
    workflow_manager = WorkflowManager(tool_id)
    mcp = FastMCP("Workflow Management Server")
    
    @mcp.tool(
        name="suggest_workflows",
        description=(
            "List all available paid workflows with their descriptions, costs, and current user balance. "
            "Use this tool when user asks about workflows, automation options, or available services."
        )
    )
    async def suggest_workflows() -> dict[str, Any]:
        """Return list of available workflows with user balance."""
        workflows = workflow_manager.get_all_workflows()
        user_balance = workflow_manager.get_user_balance()
        
        # Return in format expected by CustomToolRenderer
        return {
            "type": "workflow_list",
            "data": {
                "workflows": [wf.to_dict() for wf in workflows],
                "user_balance": user_balance
            }
        }
    
    @mcp.tool(
        name="execute_workflow",
        description=(
            "Execute a specific workflow by ID. This will deduct credits from user balance. "
            "Only call this tool when user explicitly confirms they want to execute a workflow."
        )
    )
    async def execute_workflow(workflow_id: str) -> dict[str, Any]:
        """Execute a workflow and return results."""
        workflow = workflow_manager.get_workflow(workflow_id)
        
        if not workflow:
            return {
                "success": False,
                "error": f"Workflow '{workflow_id}' not found"
            }
        
        # Check balance
        user_balance = workflow_manager.get_user_balance()
        if user_balance < workflow.cost:
            return {
                "success": False,
                "error": f"Insufficient balance. Need {workflow.cost} credits, have {user_balance}"
            }
        
        # Deduct credits
        if not workflow_manager.deduct_credits("default", workflow.cost):
            return {
                "success": False,
                "error": "Failed to deduct credits"
            }
        
        # Execute workflow (mock execution for now)
        logger.info(f"Executing workflow: {workflow.name}")
        
        # In production, this would:
        # 1. Queue the workflow job
        # 2. Monitor execution
        # 3. Return results
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "workflow_name": workflow.name,
            "message": f"Workflow '{workflow.name}' executed successfully",
            "credits_used": workflow.cost,
            "remaining_balance": user_balance - workflow.cost,
            "result": {
                "status": "completed",
                "execution_time": "2.5s",
                "output": f"Workflow {workflow.name} completed successfully"
            }
        }
    
    return mcp


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run the Workflow Management MCP server"
    )
    parser.add_argument(
        "--tool-id",
        type=int,
        default=int(os.environ.get("WORKFLOW_TOOL_ID", "0")),
        required=True,
        help="Tool ID from Onyx database for execute_workflow tool"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host interface for the MCP server"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8001,
        help="Port for the MCP server"
    )
    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    args = parse_args()
    
    if args.tool_id == 0:
        logger.error(
            "Tool ID is required. Set --tool-id or WORKFLOW_TOOL_ID environment variable."
        )
        return
    
    logger.info(f"Starting Workflow MCP server with tool_id={args.tool_id}")
    
    mcp = build_mcp_server(args.tool_id)
    mcp.run(transport="streamable-http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()