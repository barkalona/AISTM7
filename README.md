# AISTM7 - AI-Powered Risk Analysis Platform

AISTM7 is an advanced risk analysis and portfolio management platform that combines artificial intelligence, real-time market data, and blockchain technology to provide sophisticated risk metrics and portfolio optimization strategies.

## Features

### Risk Analysis
- Real-time portfolio risk assessment
- Monte Carlo simulations
- VaR calculations
- Stress testing
- Correlation analysis
- Custom risk metrics

### AI-Powered Recommendations
- Portfolio optimization strategies
- Risk-adjusted trading suggestions
- Market sentiment analysis
- Anomaly detection
- Automated rebalancing recommendations

### Interactive Brokers Integration
- Real-time portfolio data
- Historical market data
- Order execution capabilities
- Account management
- Position tracking

### Blockchain Integration
- Solana-based access control
- Dynamic token requirements
- Automated fee adjustments
- Grace period management
- Token balance verification

### Advanced Visualization
- Interactive charts
- Risk heatmaps
- Correlation matrices
- Technical indicators
- Portfolio analytics

### Security Features
- Two-factor authentication
- Email verification
- Backup codes
- Role-based access control
- Encrypted data storage

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Docker & Docker Compose
- Solana CLI tools
- Interactive Brokers Workstation/Gateway

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AISTM7.git
cd AISTM7
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your settings

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

4. Initialize the database:
```bash
cd frontend
npx prisma migrate dev
```

5. Start the development servers:
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Python services
cd backend
python -m uvicorn main:app --reload
```

## Documentation

- [API Documentation](docs/api.md)
- [Development Guide](docs/development.md)
- [Monitoring Guide](docs/monitoring.md)
- [Token System](docs/tasks/dynamic-fee-adjustment.md)

## Architecture

### Frontend
- Next.js 14 for server-side rendering
- TypeScript for type safety
- Tailwind CSS for styling
- React Query for data fetching
- WebSocket for real-time updates

### Backend
- Node.js for API services
- Python for AI/ML processing
- PostgreSQL for data storage
- Redis for caching
- WebSocket for real-time communication

### Infrastructure
- Docker containers
- AWS deployment
- GitHub Actions CI/CD
- Prometheus & Grafana monitoring

## Development

### Code Style

- TypeScript/JavaScript: ESLint & Prettier
- Python: Black & isort
- Git commit messages: Conventional Commits

### Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend Node.js tests
cd backend
npm test

# Backend Python tests
cd backend
pytest
```

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build service-name
```

## Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
# Deploy to AWS
./deploy.sh production
```

## Monitoring

- System health dashboard: https://monitor.aistm7.com
- API status: https://status.aistm7.com
- Log analytics: https://logs.aistm7.com

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

For security issues, please email security@aistm7.com instead of using the issue tracker.

## License

This project is proprietary software. All rights reserved.

## Support

- Documentation: https://docs.aistm7.com
- Email: support@aistm7.com
- Status: https://status.aistm7.com

## Team

- Backend Team: backend@aistm7.com
- Frontend Team: frontend@aistm7.com
- DevOps Team: devops@aistm7.com
- Security Team: security@aistm7.com

## Acknowledgments

- Interactive Brokers API
- Solana Blockchain
- TensorFlow/PyTorch
- AWS Infrastructure