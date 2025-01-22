# AISTM7 Development Guide

## Project Overview

AISTM7 is an advanced AI-powered risk analysis platform that integrates with Interactive Brokers, leveraging the Solana blockchain for access control. The system provides real-time portfolio analysis, risk metrics, and AI-driven recommendations.

## Technology Stack

### Backend
- Node.js & Python
- FastAPI/Flask for Python services
- PostgreSQL with Prisma ORM
- WebSocket for real-time updates
- TensorFlow/PyTorch for AI models

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Query
- WebSocket for real-time updates

### Infrastructure
- Docker & Docker Compose
- AWS for deployment
- GitHub Actions for CI/CD

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- PostgreSQL 14+
- Solana CLI tools
- Interactive Brokers Workstation (TWS) or IB Gateway

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AISTM7.git
cd AISTM7
```

2. Install dependencies:
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
pip install -r requirements.txt
```

3. Set up environment variables:

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

Backend (.env):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/aistm7
IBKR_HOST=localhost
IBKR_PORT=7496
IBKR_CLIENT_ID=1
SOLANA_RPC_URL=https://api.devnet.solana.com
JWT_SECRET=your-jwt-secret
```

4. Initialize the database:
```bash
cd frontend
npx prisma migrate dev
```

5. Start the development servers:
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Python services
cd backend
python -m uvicorn main:app --reload
```

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Main development branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation

### Commit Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(risk-analysis): implement Monte Carlo simulation

- Add simulation service
- Integrate with portfolio data
- Add unit tests

Closes #123
```

### Code Style

#### TypeScript/JavaScript
- Use ESLint with provided configuration
- Follow Prettier formatting
- Use TypeScript strict mode
- Prefer functional components in React
- Use React Query for API state management

Example:
```typescript
interface Props {
  data: Portfolio;
  onUpdate: (portfolio: Portfolio) => void;
}

const PortfolioView: React.FC<Props> = ({ data, onUpdate }) => {
  // Implementation
};
```

#### Python
- Follow PEP 8 guidelines
- Use type hints
- Use Black for formatting
- Document functions with docstrings

Example:
```python
from typing import List, Optional

def calculate_risk_metrics(
    portfolio_data: List[dict],
    confidence_level: float = 0.95
) -> Optional[dict]:
    """
    Calculate portfolio risk metrics.

    Args:
        portfolio_data: List of portfolio positions
        confidence_level: Confidence level for VaR calculation

    Returns:
        Dictionary containing risk metrics or None if calculation fails
    """
    # Implementation
```

### Testing

#### Frontend Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/components/RiskChart.test.tsx
```

#### Backend Tests
```bash
# Node.js tests
npm test

# Python tests
pytest
```

### Documentation

- Document all public APIs
- Include JSDoc comments for TypeScript/JavaScript
- Use Python docstrings
- Update API documentation when endpoints change
- Document complex algorithms and business logic

### Performance Considerations

1. Frontend
   - Implement code splitting
   - Use React.memo for expensive components
   - Optimize images and assets
   - Use WebSocket for real-time data

2. Backend
   - Cache expensive calculations
   - Use database indexes appropriately
   - Implement rate limiting
   - Use connection pooling

### Security Guidelines

1. Authentication
   - Use JWT tokens
   - Implement refresh token rotation
   - Enable 2FA where possible

2. Data Protection
   - Encrypt sensitive data
   - Use HTTPS only
   - Implement rate limiting
   - Validate all inputs

3. API Security
   - Use CORS appropriately
   - Implement request signing
   - Rate limit by IP and user

### Deployment

1. Build Docker images:
```bash
docker-compose build
```

2. Run locally:
```bash
docker-compose up
```

3. Deploy to staging:
```bash
./deploy.sh staging
```

4. Deploy to production:
```bash
./deploy.sh production
```

### Monitoring

1. Application Metrics
   - Response times
   - Error rates
   - Active users
   - System resources

2. Business Metrics
   - Portfolio calculations
   - Risk analysis performance
   - AI model accuracy
   - Token requirement status

### Troubleshooting

1. Frontend Issues
   - Check browser console
   - Verify API responses
   - Check WebSocket connection
   - Validate environment variables

2. Backend Issues
   - Check application logs
   - Verify database connection
   - Check IBKR connectivity
   - Monitor Solana RPC status

3. Common Problems
   - IBKR connection timeout: Verify TWS/Gateway is running
   - Database connection: Check PostgreSQL service
   - WebSocket disconnection: Check network stability
   - Solana RPC errors: Verify network status

## Additional Resources

- [API Documentation](./api.md)
- [System Architecture](./architecture.md)
- [Monitoring Guide](./monitoring.md)
- [Token System](./tasks/dynamic-fee-adjustment.md)

## Support

For development support:
- Create an issue in GitHub
- Contact the development team
- Check the internal documentation
- Review existing solutions in closed issues