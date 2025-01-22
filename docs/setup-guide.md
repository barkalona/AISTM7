# AISTM7 Setup Guide

## 1. GitHub Repository Setup

1. **Create New Repository**
   ```bash
   # Initialize git in current directory
   git init

   # Add all files
   git add .

   # Initial commit
   git commit -m "Initial commit: AISTM7 platform"
   ```

2. **Create GitHub Repository**
   - Go to GitHub.com
   - Click "New repository"
   - Name: "AISTM7"
   - Make it Private
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/AISTM7.git
   git branch -M main
   git push -u origin main
   ```

## 2. PostgreSQL Production Setup

1. **Create Supabase Database** (Recommended for Netlify deployments)
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login
   - Create new project "aistm7"
   - Choose region closest to your users
   - Get connection string from Dashboard:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```

2. **Database Migration**
   ```bash
   # Apply migrations to production database
   DATABASE_URL="your-supabase-connection-string" npx prisma migrate deploy
   ```

3. **Update Environment Variables**
   - In Netlify Dashboard:
     - Go to Site settings > Environment variables
     - Add `DATABASE_URL` with Supabase connection string
   
   - Local Development:
     ```env
     # frontend/.env.local
     DATABASE_URL="postgresql://postgres:aistm7@localhost:5432/aistm7"

     # backend/.env
     DATABASE_URL="postgresql://postgres:aistm7@localhost:5432/aistm7"
     ```

## 3. Netlify Deployment

1. **Connect to GitHub**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Choose GitHub
   - Select your AISTM7 repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Set environment variables:
     ```env
     NEXTAUTH_URL=https://your-site-name.netlify.app
     NEXTAUTH_SECRET=<generated-by-setup-script>
     DATABASE_URL=<your-supabase-connection-string>
     NEXT_PUBLIC_SOLANA_NETWORK=devnet
     NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
     IBKR_USERNAME=<your-ibkr-username>
     IBKR_PASSWORD=<your-ibkr-password>
     ```

3. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy when you push to GitHub

## 4. Solana Configuration

1. **Development Environment**
   ```env
   # Already set in .env files
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

2. **Token Setup**
   - Token will be deployed on Solana devnet
   - Initial supply: 700,000 AISTM7 tokens
   - Automatic price adjustment mechanism enabled

## 5. Verify Setup

1. **Local Development**
   ```bash
   # Start local PostgreSQL
   # Your existing local database is already configured

   # Start development server
   npm run dev
   ```

2. **Production Checks**
   - Visit your Netlify URL
   - Verify database connection
   - Test IBKR authentication
   - Confirm Solana devnet connection

## Environment Variables Summary

1. **Local Development**
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:aistm7@localhost:5432/aistm7"
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

2. **Production (Netlify)**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   NEXTAUTH_URL="https://your-site-name.netlify.app"
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

## Next Steps

1. Push your code to GitHub
2. Set up Supabase database
3. Configure Netlify deployment
4. Run database migrations
5. Test the deployment

Would you like me to help you with any of these steps?