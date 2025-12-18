# 🚀 Quick Start: Deploy Filyx.ai to Production

## Choose Your Deployment Method

### Option A: Deploy with Vercel (Recommended - Easiest)

#### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

#### 2. Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects Next.js settings
4. Click **Deploy**

#### 3. Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
DATABASE_URL=[your-production-supabase-connection-string]
NEXT_PUBLIC_SUPABASE_URL=[your-production-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-production-service-key]
OPENAI_API_KEY=[your-openai-api-key]
NEXTAUTH_SECRET=[generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"]
NEXTAUTH_URL=https://[your-vercel-url].vercel.app
NODE_ENV=production
```

#### 4. Redeploy
After adding environment variables, redeploy from Vercel dashboard.

#### 5. Update Supabase Settings
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://[your-vercel-url].vercel.app`
- Redirect URLs: `https://[your-vercel-url].vercel.app/**`

---

### Option B: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Add environment variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... add all other variables

# Redeploy
vercel --prod
```

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Production Supabase project** created (not paused)
- [ ] **Database migrations** run on production database
- [ ] **Storage bucket** created (`filyx-documents`, public)
- [ ] **RLS policies** configured (run `docs/setup/supabase-rls-setup.sql`)
- [ ] **OpenAI API key** with billing enabled
- [ ] **Code pushed** to GitHub

---

## Post-Deployment Steps

1. **Test your app** at the Vercel URL
2. **Verify sign-up** works
3. **Test document upload** and classification
4. **Check search** functionality
5. **Monitor logs** in Vercel dashboard for errors

---

## Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `filyx.ai`)
3. Update DNS settings as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Update Supabase Auth URLs to your custom domain
6. Redeploy

---

## Need Help?

📖 **Full deployment guide**: [docs/PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md)

🔧 **Troubleshooting**:
- Build fails → Check Vercel build logs
- Auth issues → Verify NEXTAUTH_URL and Supabase redirect URLs
- Database errors → Check DATABASE_URL and Supabase project status

---

## What's Already Configured

✅ Vercel configuration file (`vercel.json`)  
✅ Build optimization in `next.config.ts`  
✅ Production-ready ignore file (`.vercelignore`)  
✅ Build and start scripts in `package.json`

**You're ready to deploy!** 🎉
