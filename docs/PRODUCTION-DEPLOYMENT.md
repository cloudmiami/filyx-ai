# Production Deployment Guide - Filyx.ai

## Prerequisites

Before deploying to production, ensure you have:

1. **Supabase Production Project**
   - Create a new Supabase project for production (separate from development)
   - Set up the same database schema using your migration files
   - Configure Row Level Security (RLS) policies
   - Create the `filyx-documents` storage bucket with public access

2. **OpenAI API Account**
   - Active OpenAI account with billing enabled
   - Production API key (separate from development key recommended)

3. **Vercel Account**
   - Sign up at https://vercel.com
   - Install Vercel CLI: `npm i -g vercel`

---

## Step 1: Prepare Supabase Production Database

### 1.1 Create Production Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it: "filyx-ai-production"
4. Choose a strong database password
5. Select a region close to your users

### 1.2 Run Database Migrations
```bash
# Update your .env.local with production DATABASE_URL temporarily
# Get it from: Supabase Dashboard → Settings → Database → Connection string → Nodejs

# Run migrations
npm run db:migrate

# Seed initial categories (optional)
npm run db:seed
```

### 1.3 Set Up Storage Bucket
1. Go to Storage in your Supabase dashboard
2. Create a new bucket: `filyx-documents`
3. Make it **public** (check the box)
4. Save the bucket name

### 1.4 Configure RLS Policies
Run the SQL from `docs/setup/supabase-rls-setup.sql` in the SQL Editor of your production Supabase project.

---

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository (Recommended)
1. Push your code to GitHub if not already done:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repository: `filyx-ai`
4. Vercel will auto-detect Next.js configuration

### 2.2 Configure Environment Variables

In Vercel dashboard, add these environment variables:

#### Database Configuration
```
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

#### Supabase Configuration
Get from: Supabase Dashboard → Settings → API
```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

#### OpenAI Configuration
```
OPENAI_API_KEY=sk-proj-[your-production-key]
```

#### Auth Configuration
Generate a new secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```
NEXTAUTH_SECRET=[generated-secret]
NEXTAUTH_URL=https://[your-app].vercel.app
```

#### Environment
```
NODE_ENV=production
```

### 2.3 Deploy
1. Click **Deploy** in Vercel dashboard
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide you with a production URL: `https://filyx-ai.vercel.app`

---

## Step 3: Post-Deployment Configuration

### 3.1 Update Supabase Auth Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://[your-app].vercel.app`
   - **Redirect URLs**: `https://[your-app].vercel.app/**`

### 3.2 Update NEXTAUTH_URL
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` with your actual Vercel URL
3. Redeploy: Deployments → Latest → Redeploy

### 3.3 Test Production App
1. Visit your production URL
2. Test sign-up flow
3. Test document upload
4. Test search functionality
5. Test authentication and authorization

---

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain: `filyx.ai` or `app.filyx.ai`
3. Follow DNS configuration instructions

### 4.2 Update Environment Variables
After custom domain is configured:
1. Update `NEXTAUTH_URL` to your custom domain
2. Update Supabase Auth URLs to your custom domain
3. Redeploy

---

## Alternative: Deploy via Vercel CLI

If you prefer command line deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to:
# - Link to existing project or create new
# - Set project name
# - Configure build settings
```

Then add environment variables via CLI:
```bash
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... add all other env vars
```

---

## Environment Variables Checklist

Make sure ALL of these are set in Vercel:

- [ ] DATABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] OPENAI_API_KEY
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] NODE_ENV=production

---

## Monitoring & Maintenance

### Check Deployment Status
- Vercel Dashboard → Your Project → Deployments
- View build logs if deployment fails
- Check runtime logs for errors

### Monitor Costs
- **Supabase**: Dashboard → Settings → Billing
- **OpenAI**: https://platform.openai.com/usage
- **Vercel**: Dashboard → Usage

### Database Backups
- Supabase automatically backs up your database daily
- Download manual backups: Dashboard → Database → Backups

---

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in package.json
3. Run `npm run build` locally to test

### "Failed to fetch" errors
1. Verify all environment variables are set correctly
2. Check Supabase URL configuration
3. Ensure Supabase project is not paused

### Authentication issues
1. Verify NEXTAUTH_URL matches your deployment URL
2. Check Supabase Auth redirect URLs include your domain
3. Ensure NEXTAUTH_SECRET is set and unique

### Database connection errors
1. Verify DATABASE_URL is correct (use pooler connection string)
2. Check Supabase project is active
3. Ensure RLS policies are configured correctly

---

## Security Recommendations for Production

1. **Never commit .env.local** to git (already in .gitignore)
2. **Use separate API keys** for production vs development
3. **Enable 2FA** on Supabase, Vercel, and OpenAI accounts
4. **Rotate secrets regularly** (every 90 days recommended)
5. **Monitor API usage** to detect unusual activity
6. **Set up alerts** in Vercel and Supabase for errors
7. **Use strong database password** in production
8. **Review RLS policies** before going live

---

## Quick Deployment Checklist

- [ ] Production Supabase project created
- [ ] Database migrations run on production
- [ ] Storage bucket created in production Supabase
- [ ] RLS policies configured
- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked to GitHub
- [ ] All environment variables configured in Vercel
- [ ] Initial deployment successful
- [ ] Supabase Auth URLs updated with Vercel URL
- [ ] NEXTAUTH_URL updated in Vercel
- [ ] App redeployed after URL updates
- [ ] Sign-up tested in production
- [ ] Document upload tested in production
- [ ] Search tested in production
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up

---

## Support

If you encounter issues during deployment:

1. Check Vercel deployment logs
2. Check browser console for client-side errors
3. Review Supabase logs for database/auth errors
4. Verify all environment variables are set correctly
5. Ensure Supabase project is not paused

For Next.js specific issues: https://nextjs.org/docs
For Vercel deployment: https://vercel.com/docs
For Supabase setup: https://supabase.com/docs
