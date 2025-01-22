# AISTM7 Setup Steps

## 1. GitHub Repository Setup

The repository is already created at: https://github.com/barkalona/AISTM7

To connect your local project:

```powershell
# Initialize git and connect to remote
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/barkalona/AISTM7.git
git push -u origin main
```

## 2. Database Setup

1. **Local PostgreSQL Setup**:
   ```sql
   -- Connect to PostgreSQL
   psql -U postgres

   -- Create database and user
   CREATE DATABASE aistm7;
   \c aistm7
   ```

2. **Supabase Setup for Production**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: "AISTM7"
   - Database Password: Create a secure password
   - Region: Choose closest to your users
   - Click "Create project"
   - Go to Project Settings > Database
   - Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`)

3. **Run Migrations**:
   ```powershell
   # For local development
   cd frontend
   npx prisma migrate dev

   # For production (after setting up Supabase)
   $env:DATABASE_URL="your-supabase-connection-string"
   npx prisma migrate deploy
   ```

## 3. Netlify Setup

1. **Connect Repository**:
   - Go to [app.netlify.com/start](https://app.netlify.com/start)
   - Click "Import from Git"
   - Select GitHub and authorize Netlify
   - Choose the AISTM7 repository
   - Select the `main` branch

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Show advanced" and set Node version to 18.x

3. **Environment Variables**:
   Go to Site settings > Environment variables and add:
   ```
   NEXTAUTH_URL=https://your-netlify-site.netlify.app
   NEXTAUTH_SECRET=<from your .env.local>
   DATABASE_URL=<your-supabase-connection-string>
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

## 4. Run Setup Script

```powershell
# Make sure you're in the project root
cd C:\Users\almaw\OneDrive\AISTM7

# Run the setup script
.\scripts\setup-project.ps1
```

This will:
- Set up environment variables
- Install dependencies
- Build the project
- Push to GitHub

## 5. Verify Deployment

1. **Check Build**:
   - Go to Netlify dashboard
   - Click on your site
   - Check "Deploys" tab
   - Verify build succeeded

2. **Test Site**:
   - Click the generated URL (or your custom domain)
   - Verify the site loads
   - Test authentication
   - Check database connection

## 6. Common Issues

1. **Build Fails**:
   - Check Netlify build logs
   - Verify Node version is 18.x
   - Ensure all environment variables are set

2. **Database Connection Fails**:
   - Verify Supabase connection string
   - Check IP allowlist in Supabase
   - Confirm migrations ran successfully

3. **Authentication Issues**:
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Confirm IBKR credentials are correct

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up SSL certificate
4. Implement CI/CD pipeline

## Support

If you encounter any issues:
1. Check Netlify deploy logs
2. Verify environment variables
3. Check Supabase database logs
4. Review GitHub Actions logs (if configured)