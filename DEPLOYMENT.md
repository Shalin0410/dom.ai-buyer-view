# Deployment Architecture

## Overview

This application uses a **hybrid deployment** strategy:

| Component | Platform | Auto-Deploy |
|-----------|----------|-------------|
| **React Frontend** | Vercel | ✅ Yes (from GitHub) |
| **Chat API** | Vercel | ✅ Yes (server/index.js) |
| **Email APIs** | Vercel | ✅ Yes (server/index.js) |
| **ML Recommendation API** | Google Cloud Functions | ❌ Manual (gcloud CLI) |

---

## Why This Architecture?

- **Vercel**: Perfect for frontend + lightweight Node.js APIs (chat, email)
- **Google Cloud Functions**: Required for ML API (250MB+ dependencies exceed Vercel's limit)

---

## Deploying Frontend to Vercel

### Automatic Deployment
```bash
git add .
git commit -m "Update frontend"
git push origin main  # or your branch name
```

Vercel automatically deploys:
- ✅ React frontend
- ✅ Node.js APIs (chat, email)
- ❌ ML API (ignored via .vercelignore)

### What Gets Deployed to Vercel
- `src/` - React application
- `server/` - Express server (chat, email)
- `dist/` - Built frontend assets
- `.env` variables from Vercel dashboard

### What's Excluded from Vercel
- `api/` - Python ML API (too large)
- Test files, Python cache

---

## Deploying ML API to Google Cloud Functions

### Prerequisites
- gcloud CLI installed
- Logged in: `gcloud auth login`
- Project selected: `gcloud config set project YOUR_PROJECT_ID`

### Deploy Command
```bash
cd api

gcloud functions deploy recommend-full-ml \
  --gen2 \
  --runtime=python313 \
  --region=us-central1 \
  --source=. \
  --entry-point=recommend \
  --trigger-http \
  --allow-unauthenticated \
  --memory=2048MB \
  --timeout=540s \
  --max-instances=10 \
  --set-env-vars=OPENAI_API_KEY=xxx,SUPABASE_URL=xxx,SUPABASE_SERVICE_ROLE_KEY=xxx,GOOGLE_PLACES_API_KEY=xxx
```

### Get Function URL
```bash
gcloud functions describe recommend-full-ml \
  --region=us-central1 \
  --gen2 \
  --format="value(serviceConfig.uri)"
```

### Update Frontend
Add to `.env.local`:
```
VITE_RECOMMEND_API_URL=https://recommend-full-ml-xxxxx-uc.a.run.app
```

Update API calls in frontend:
```javascript
// Replace hardcoded '/api/recommend' with:
const API_URL = import.meta.env.VITE_RECOMMEND_API_URL || '/api/recommend'
fetch(API_URL, {...})
```

---

## ML API Versions

### Current: Full ML Version
- **File**: `api/recommend.py`
- **Scoring**: 50% LLM + 30% ML (Ridge) + 20% Rules
- **Size**: ~250MB
- **Dependencies**: numpy, pandas, scikit-learn, openai, supabase

### Backup: Lightweight Version
- **File**: `api/recommend_lightweight.py`
- **Scoring**: 70% LLM + 30% Rules
- **Size**: ~50MB
- **Dependencies**: openai, supabase only

---

## How to Revert to Lightweight Version

If you need to go back to the lightweight version:

### Option 1: Revert on GCP (Recommended)
```bash
cd api

# Backup current version
cp recommend.py recommend_full_ml.py

# Restore lightweight version
cp recommend_lightweight.py recommend.py

# Redeploy to GCP (same command as above)
gcloud functions deploy recommend-full-ml ...
```

### Option 2: Deploy Lightweight to Vercel
If you want to move back to Vercel entirely:

1. Replace `api/recommend.py` with `api/recommend_lightweight.py`
2. Update `api/requirements.txt` - comment out ML dependencies:
   ```
   openai>=1.0.0
   supabase>=2.0.0
   requests>=2.31.0
   # numpy>=1.24.0
   # pandas>=2.0.0
   # scikit-learn>=1.3.0
   ```
3. Remove `.vercelignore` file
4. Push to GitHub - Vercel will deploy
5. Update frontend to use `/api/recommend` instead of GCP URL

---

## Environment Variables

### Vercel Environment Variables
Set in Vercel Dashboard → Project → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for chat API)
- `GMAIL_APP_PASSWORD` (for email API)
- `VITE_RECOMMEND_API_URL` (GCP function URL)

### GCP Environment Variables
Set during deployment with `--set-env-vars`:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_PLACES_API_KEY`

---

## Monitoring & Logs

### Vercel Logs
- Dashboard → Project → Deployments → View Function Logs

### GCP Logs
```bash
# View recent logs
gcloud functions logs read recommend-full-ml \
  --region=us-central1 \
  --limit=50

# Stream logs in real-time
gcloud functions logs read recommend-full-ml \
  --region=us-central1 \
  --limit=50 \
  --follow
```

---

## Cost Estimate

### Vercel
- **Hobby Plan**: Free (frontend + Node.js APIs)
- **Pro Plan**: $20/month (if you need more)

### Google Cloud Functions
- **Free Tier**: 2 million invocations/month
- **After Free Tier**: ~$0.40 per million requests
- **Typical Cost**: $0-5/month for low-medium traffic

### Google Places API
- **Cost**: $17 per 1,000 property lookups
- **Optimization**: Results are cached in database (schools data)

---

## Troubleshooting

### Frontend not updating after deploy
- Clear Vercel build cache
- Check `.vercelignore` isn't excluding needed files

### ML API returns 500 error
- Check GCP logs: `gcloud functions logs read recommend-full-ml`
- Verify environment variables are set correctly
- Test locally first: `python api/test_full_ml_simple.py`

### CORS errors when calling GCP from frontend
- GCP function includes CORS headers in `main.py`
- Verify function is deployed with `--allow-unauthenticated`

---

## Quick Reference

### Deploy Frontend (Vercel - Automatic)
```bash
git push origin main
```

### Deploy ML API (GCP - Manual)
```bash
cd api
gcloud functions deploy recommend-full-ml [options]
```

### Switch Versions
```bash
# Full ML → Lightweight
cp recommend_lightweight.py recommend.py
gcloud functions deploy recommend-full-ml [options]

# Lightweight → Full ML
cp recommend_full_ml.py recommend.py  # if backed up
gcloud functions deploy recommend-full-ml [options]
```
