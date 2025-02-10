# Integration with SUI and ElizaOS

This document explains how Cyper integrates with the SUI blockchain and ElizaOS framework to create an AI-native social experience.

## SUI Integration

### 1. ZK Login for Authentication
- Reference Code: [AuthController.ts](https://github.com/CyperAI/cyper-sui/blob/main/src/controllers/AuthController.ts)
- Implements SUI's ZK-login for secure and privacy-preserving authentication
- Uses Google OAuth as the identity provider
- Generates ephemeral key pairs for session management
- Stores user session data with SUI addresses

### 2. WALRUS Storage Integration
- Reference Code: [WalrusService.ts](https://github.com/CyperAI/cyper-sui/blob/main/src/storage/WalrusService.ts),[UserService.ts](https://github.com/CyperAI/cyper-sui/blob/main/src/services/UserService.ts)
- Utilizes SUI's WALRUS (Web3-Aware Large Reliable Upload Service) for:
  - Storing agent personalities and configurations
  - Persisting agent memory and conversation history
  - Managing user profile data
- Benefits of using WALRUS:
  - Decentralized storage with blockchain-level security
  - Content-addressed storage for data integrity
  - Efficient retrieval and updates

### 3. Transactions
- Integrates SUI JS SDK for blockchain interactions
- Integrates "@elizaos/plugin-sui" for in agent interactions for swap and send tokens

## ElizaOS Integration

ElizaOS provides the foundation for our AI agent system, enabling intelligent interactions and autonomous decision-making capabilities. Here's how we integrate with ElizaOS:

### 1. Runtime Environment

The ElizaOS runtime environment serves as the execution context for our AI agents.

### 2. Agent Framework

Our agents are built using ElizaOS's agent framework, which provides:Natural language understanding, Context-aware responses, Memory persistence, and Action execution.

### 3. Plugin Integration

We utilize several ElizaOS plugins to extend functionality, for example:@elizaos/plugin-sui for suiblockchain interaction and @elizaos/plugin-twitter for twitter connections.

### 4. Memory System

ElizaOS's memory system is crucial for maintaining agent state and user context.

### 5. Reference Code
[AgentService.ts](https://github.com/CyperAI/cyper-sui/blob/main/src/services/AgentService.ts)
[ContentService.ts](https://github.com/CyperAI/cyper-sui/blob/main/src/services/ContentService.ts)
[Actions](https://github.com/CyperAI/cyper-sui/blob/main/src/services/actions)



## Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   User Interface |     |  ElizaOS Agents  |     |   SUI Blockchain |
|   (Web)          |<--->|  & Core Runtime  |<--->|   & WALRUS      |
+------------------+     +------------------+     +------------------+
         ^                       ^                        ^
         |                       |                        |
         v                       v                        v
+----------------------------------------------------------+
|                     Integration Layer                    |
|  - Auth Controller (ZK-login + OAuth)                    |
|  - Agent Service (ElizaOS + SUI)                         |
|  - Storage Service (WALRUS)                              |
|  - Other services                                        |
+----------------------------------------------------------+
```