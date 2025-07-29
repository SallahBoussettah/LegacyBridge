# 🌉 LegacyBridge

**Transform your legacy systems into modern REST APIs with the power of AI and intelligent automation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-brightgreen.svg)](https://ai.google.dev/)

---

## 🎯 What is LegacyBridge?

LegacyBridge is a revolutionary platform that bridges the gap between legacy systems and modern applications. It offers two powerful approaches to API modernization:

1. **🤖 AI-Powered API Generator**: Describe your needs in plain English, and our AI creates production-ready REST APIs
2. **🗄️ Database Schema Auto-Generator**: Connect your legacy databases and automatically generate comprehensive CRUD APIs

Whether you're modernizing a decades-old mainframe system or rapidly prototyping new APIs, LegacyBridge accelerates your digital transformation journey.

---

## ✨ Key Features

### 🤖 AI-Powered API Generation
- **Natural Language Processing**: Describe APIs in conversational English
- **Intelligent Design**: AI understands business requirements and generates optimal API structures
- **Legacy Integration**: Automatic SQL query suggestions for existing systems
- **Real-time Preview**: See your API specification as it's being generated

### 🗄️ Automatic Database Integration
- **Multi-Database Support**: MySQL, PostgreSQL, SQLite, Oracle, SQL Server, and more
- **Schema Discovery**: Automatic table and relationship analysis
- **CRUD Generation**: Complete Create, Read, Update, Delete operations
- **Data Normalization**: Transform legacy formats to modern JSON standards

### 📊 Comprehensive Dashboard
- **Usage Analytics**: Track API calls, performance, and error rates
- **Visual Insights**: Interactive charts and real-time monitoring
- **Performance Metrics**: Latency tracking and optimization suggestions
- **Cost Analysis**: Estimate operational costs and ROI

### 🔧 Developer Experience
- **API Portal**: Centralized management for all generated endpoints
- **Auto-Documentation**: Swagger/OpenAPI specs generated automatically
- **Testing Interface**: Built-in API testing and validation tools
- **Phased Migration**: Plan and track your modernization journey

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SallahBoussettah/LegacyBridge.git
   cd LegacyBridge
   ```

2. **Install dependencies**
   ```bash
   cd Frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Add your Gemini API key
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see LegacyBridge in action!

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    LegacyBridge Platform                   │
├────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind CSS)              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Dashboard   │ │ AI Generator│ │ Database Connector  │   │
│  │ Analytics   │ │ Natural Lang│ │ Schema Discovery    │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│  API Layer (Node.js + Express) [Coming Soon]               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ AI Service  │ │ DB Service  │ │ API Management      │   │
│  │ Gemini AI   │ │ Multi-DB    │ │ Auth & Security     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Legacy DBs  │ │ Generated   │ │ Analytics Store     │   │
│  │ MySQL/PG/   │ │ APIs        │ │ Usage Metrics       │   │
│  │ Oracle/etc  │ │ Endpoints   │ │ Performance Data    │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Screenshots

### AI-Powered API Generator
![AI Generator](https://via.placeholder.com/800x400/1976D2/FFFFFF?text=AI+API+Generator+Interface)
*Describe your API needs in natural language and watch as AI creates the perfect specification*

### Database Schema Discovery
![Schema Discovery](https://via.placeholder.com/800x400/4CAF50/FFFFFF?text=Database+Schema+Auto-Discovery)
*Connect to your legacy database and automatically generate REST APIs from existing tables*

### Analytics Dashboard
![Dashboard](https://via.placeholder.com/800x400/FF9800/FFFFFF?text=Comprehensive+Analytics+Dashboard)
*Monitor API usage, performance, and track your modernization progress*

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | Modern, type-safe user interface |
| **Styling** | Tailwind CSS | Responsive, utility-first styling |
| **Build Tool** | Vite | Fast development and optimized builds |
| **AI Integration** | Google Gemini AI | Natural language API generation |
| **Charts** | Recharts | Interactive data visualization |
| **Backend** | Node.js + Express | RESTful API server (planned) |
| **Database** | Multi-DB Support | MySQL, PostgreSQL, SQLite, Oracle |
| **Authentication** | JWT | Secure API access control |
| **Documentation** | OpenAPI/Swagger | Automatic API documentation |

---

## 📖 Documentation

### Core Concepts
- **[AI-Powered API Generator](./AI-Powered-API-Generator.md)** - Complete guide to AI-driven API creation
- **[Database Schema Auto-Generator](./Database-Schema-Auto-Generator.md)** - Automatic database-to-API transformation
- **[Project Architecture](./ProjectIdea.md)** - Original vision and technical specifications

### Getting Started Guides
- **Quick Start Tutorial** - Get up and running in 5 minutes
- **AI API Generation Guide** - Master natural language API design
- **Database Connection Setup** - Connect your legacy systems
- **Deployment Guide** - Deploy to production environments

### API Reference
- **Generated API Standards** - REST conventions and patterns
- **Authentication Methods** - JWT, OAuth, and API keys
- **Error Handling** - Standardized error responses
- **Rate Limiting** - Usage quotas and throttling

---

## 🎯 Use Cases

### Enterprise Legacy Modernization
- **Mainframe Integration**: Expose COBOL/AS400 data via REST APIs
- **Database Modernization**: Transform old SQL systems into modern interfaces
- **Gradual Migration**: Phase-by-phase system modernization
- **System Integration**: Connect disparate legacy applications

### Rapid Development
- **MVP Creation**: Generate APIs for proof-of-concepts in minutes
- **Prototyping**: Quick API creation for testing business ideas
- **Developer Productivity**: Accelerate development cycles by 10x
- **Standardization**: Enforce consistent API patterns across teams

### Business Intelligence
- **Data Accessibility**: Make legacy data available to modern analytics tools
- **Real-time Insights**: Transform batch processes into real-time APIs
- **Integration Platforms**: Enable seamless data flow between systems
- **Digital Transformation**: Accelerate organizational modernization

---

## 🚧 Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] React frontend with TypeScript
- [x] AI-powered API generation with Gemini
- [x] Interactive dashboard with analytics
- [x] API portal and management interface
- [x] Responsive design and mobile support

### 🔄 Phase 2: Backend Integration (In Progress)
- [ ] Node.js backend API server
- [ ] Database connection management
- [ ] Schema introspection engine
- [ ] CRUD API generation
- [ ] Authentication and authorization

### 📋 Phase 3: Advanced Features (Planned)
- [ ] Multi-database support (Oracle, SQL Server)
- [ ] Advanced AI features and context awareness
- [ ] Team collaboration and workspaces
- [ ] CI/CD pipeline integration
- [ ] Enterprise security features

### 🎯 Phase 4: Enterprise Scale (Future)
- [ ] High availability and clustering
- [ ] Advanced analytics and monitoring
- [ ] Custom AI model training
- [ ] White-label solutions
- [ ] Marketplace and ecosystem

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes LegacyBridge better for everyone.

### How to Contribute

1. **Fork the repository**
   ```bash
   git fork https://github.com/SallahBoussettah/LegacyBridge.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow our coding standards
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include screenshots for UI changes

### Development Guidelines
- **Code Style**: We use ESLint and Prettier for consistent formatting
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update relevant documentation for changes
- **Commit Messages**: Use conventional commit format

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Sallah Boussettah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **Google AI** for providing the powerful Gemini AI model
- **React Team** for the amazing React framework
- **Vite Team** for the lightning-fast build tool
- **Tailwind CSS** for the utility-first CSS framework
- **Open Source Community** for inspiration and contributions

---

## 📞 Support & Contact

### Get Help
- **📚 Documentation**: Comprehensive guides and API references
- **💬 Community**: Join our Discord server for discussions
- **🐛 Issues**: Report bugs on GitHub Issues
- **💡 Feature Requests**: Suggest new features and improvements

### Connect with the Creator
- **GitHub**: [@SallahBoussettah](https://github.com/SallahBoussettah)
- **LinkedIn**: [Sallah Boussettah](https://linkedin.com/in/sallahboussettah)
- **Twitter**: [@SallahBoussettah](https://twitter.com/SallahBoussettah)
- **Email**: sallah@legacybridge.dev

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SallahBoussettah/LegacyBridge&type=Date)](https://star-history.com/#SallahBoussettah/LegacyBridge&Date)

---

<div align="center">

**Made with ❤️ by [Sallah Boussettah](https://github.com/SallahBoussettah)**

*Transforming legacy systems, one API at a time.*

[⭐ Star this repo](https://github.com/SallahBoussettah/LegacyBridge) • [🐛 Report Bug](https://github.com/SallahBoussettah/LegacyBridge/issues) • [✨ Request Feature](https://github.com/SallahBoussettah/LegacyBridge/issues)

</div>