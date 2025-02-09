# CyperSUI Demo

This project was developed as part of the SUI Hackathon, emonstrating the integration of social interactions with SUI blockchain capabilities(fast transactions, ZK login, walrus, etc). This project showcases how traditional social media features can be enhanced with AI and blockchain technology building upon the excellent foundation provided by [elizaOS](https://github.com/elizaos).

## Features

- **Secure Authentication**
  - Google OAuth 2.0 integration
  - SUI blockchain ZK-login implementation
  - JWT-based session management

- **Social Features**
  - Real-time messaging system
  - Post creation and interaction
  - Comment system with AI-powered responses
  - Like and share functionality

- **Blockchain Integration**
  - SUI testnet integration
  - Cryptocurrency transaction support
  - Secure wallet interactions
  - Zero-knowledge proof authentication

## Why SUI Blockchain?

SUI blockchain was chosen for this hackathon project because of its:
- High performance and scalability
- ZK-login to bring secure, frictionless user onboarding
- Secure and efficient decentralized storage by WALRUS
- Active community and comprehensive documentation

## Tech Stack

- **Frontend**
  - HTML5/EJS Templates
  - TailwindCSS for styling
  - Vanilla JavaScript with modern ES6+ features

- **Backend**
  - Node.js with TypeScript
  - elizaOS core components
  - SUI JS SDK for interacting with the SUI blockchain
  - JWT for authentication and authorization
  - WebSocket for real-time communication
  - SQLite for storing user data and session information


- **Blockchain**
  - SUI Testnet
  - @mysten/sui SDK
  - ZK-login protocol

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Google OAuth credentials
- SUI testnet access

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd Cyper
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Add your Google OAuth credentials
- Configure SUI testnet endpoints

4. Start the development server:
```bash
pnpm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── controllers/       # Request handlers
├── services/         # Business logic
├── types/           # TypeScript type definitions
├── routes/          # API routes
└── views/           # EJS templates
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [elizaOS](https://github.com/elizaos) team for their excellent open-source foundation
- SUI blockchain team for providing the SDK and hosting the hackathon
- Google OAuth team for authentication support
- All contributors who have helped with the project

## Hackathon Details

This project was developed as part of the SUI Hackathon, aiming to demonstrate the potential of blockchain technology in social media applications. Our goal was to create a seamless user experience that combines the familiarity of traditional social platforms with the security and transparency of blockchain technology.