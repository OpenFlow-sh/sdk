# OpenFlow

<p align="center">
  <strong>AI-Powered Workflow Automation Platform with x402 Payments & CDP Integration</strong>
</p>

## 🌊 About OpenFlow

OpenFlow is an innovative workflow automation platform built for ETHGlobal Argentina. It combines the power of AI-driven workflows with seamless cryptocurrency payments and Coinbase CDP integration.

### Key Features

- **🤖 AI-Powered Workflows**: Create and execute complex workflows using AI agents
- **💰 x402 Payment Integration**: Monetize your workflows with micropayments
- **🔐 Coinbase CDP**: Secure wallet integration via Coinbase Developer Platform
- **🔄 MCP Server**: Model Context Protocol server for workflow execution
- **📊 Workflow Marketplace**: Discover and share workflows with the community
- **⚡ Real-time Execution**: Fast and reliable workflow processing

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd openflow-front
```

2. Configure environment variables:
```bash
cp deployment/docker_compose/env.template deployment/docker_compose/.env
# Edit .env with your configuration
```

3. Start the services:
```bash
cd deployment/docker_compose
# Development 
docker-compose up -d

# Production (MCP server code built into image)
docker-compose -f docker-compose.yml -f docker-compose.mcp-prod.yml up -d
```

4. Access OpenFlow at `http://localhost:3000`
5. MCP Workflow server runs on `http://localhost:8000`

### Development vs Production

**Development Mode** (default):
- MCP server code is mounted as volume → Changes reflect immediately without rebuild
- Faster iteration and testing
- Run: `docker-compose up -d`

**Production Mode**:
- MCP server code built into Docker image → Requires rebuild for changes
- Better security and performance
- Run: `docker-compose -f docker-compose.yml -f docker-compose.mcp-prod.yml up -d`
- To update MCP: `docker-compose build workflow_mcp_server && docker-compose up -d workflow_mcp_server`

## 🏗️ Architecture

OpenFlow consists of three main components:

- **Frontend (Next.js)**: Modern React-based UI for workflow management
- **Backend (Python/FastAPI)**: Core API and workflow execution engine
- **MCP Server**: Workflow execution server with x402 payment integration

## 📁 Project Structure

```
openflow-front/
├── web/                    # Next.js frontend
├── backend/               # Python backend
├── mcp-servers/           # MCP workflow server
├── deployment/            # Docker & deployment configs
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `COINBASE_CLIENT_ID`: Coinbase CDP client ID
- `COINBASE_CLIENT_SECRET`: Coinbase CDP client secret
- `X402_ENABLED`: Enable/disable x402 payments

### Coinbase CDP Setup

1. Create a Coinbase Developer account
2. Register your application
3. Add OAuth redirect URIs
4. Configure client ID and secret in `.env`

## 🛠️ Development

### Running Locally

```bash
# Frontend
cd web
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# MCP Server
cd mcp-servers/workflow-server
pip install -r requirements.txt
python server.py
```

## 📚 Documentation

- [Workflow Creation Guide](docs/workflows-concept/README-IMPLEMENTATION.md)
- [x402 Payment Integration](docs/workflows-concept/09-FINAL-PAYMENT-FLOW.md)
- [CDP Integration](docs/workflows-concept/50-COINBASE-CDP-COMPLETE-IMPLEMENTATION.md)
- [Deployment Guide](docs/workflows-concept/47-PRODUCTION-DEPLOYMENT-GUIDE.md)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

## 📄 License

MIT License - Based on Onyx Open Source Platform

## 🏆 ETHGlobal Argentina

This project was built for ETHGlobal Argentina hackathon, focusing on:
- Decentralized workflow automation
- Micropayment integration for AI services
- Seamless crypto wallet integration

## 🔗 Links

- [Onyx Documentation](https://docs.onyx.app/)
- [Coinbase CDP Docs](https://docs.cdp.coinbase.com/)
- [x402 Protocol](https://github.com/x402-protocol)

## 💬 Support

For questions and support:
- Open an issue on GitHub
- Join our Discord community
