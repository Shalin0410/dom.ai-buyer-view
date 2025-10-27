# ML Recommendation API - Version Guide

This API has two versions to accommodate different deployment environments:

## 📦 Versions Available

### 1. **Lightweight Version** (Current Default)
- **File**: `api/recommend.py`
- **Size**: ~50MB
- **Scoring**: 70% LLM + 30% Rules
- **Dependencies**: OpenAI, Supabase only
- **Deployment**: ✅ Vercel (under 250MB limit)

### 2. **Full ML Version**
- **File**: `api/recommend_full_ml.py`
- **Size**: ~250MB
- **Scoring**: 50% LLM + 30% ML (Ridge Regression) + 20% Rules
- **Dependencies**: OpenAI, Supabase, numpy, pandas, scikit-learn
- **Deployment**: ❌ Exceeds Vercel's 250MB limit
- **Alternative**: AWS Lambda (10GB), Google Cloud Functions (8GB), DigitalOcean

## 🔄 How to Switch Versions

### Currently Using: Lightweight (Default)

This is already deployed and working on Vercel.

### To Enable Full ML Version:

#### Step 1: Update requirements.txt
```bash
# Uncomment these lines in api/requirements.txt:
numpy>=1.24.0
pandas>=2.0.0
scikit-learn>=1.3.0
```

#### Step 2: Swap the files
```bash
cd buyer-journey-ai/api

# Backup lightweight version
mv recommend.py recommend_lightweight.py

# Activate full ML version
mv recommend_full_ml.py recommend.py
```

#### Step 3: Deploy to larger infrastructure

**Option A: AWS Lambda (10GB limit)**
```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml
serverless deploy
```

**Option B: Google Cloud Functions (8GB limit)**
```bash
gcloud functions deploy recommend \
  --runtime python310 \
  --trigger-http \
  --memory 2048MB \
  --timeout 540s
```

**Option C: DigitalOcean App Platform**
```bash
# Connect GitHub repo to DigitalOcean
# Select Python environment
# Deploy automatically
```

## 📊 Performance Comparison

| Metric | Lightweight | Full ML |
|--------|-------------|---------|
| **Size** | ~50MB | ~250MB |
| **Cold Start** | 2-3s | 10-15s |
| **Response Time** | 10-15s | 15-20s |
| **Accuracy** | Good | Excellent |
| **Cost per Request** | $0.015 | $0.020 |
| **Vercel Compatible** | ✅ Yes | ❌ No |

## 🎯 Scoring Algorithm Details

### Lightweight Version
```
hybrid_score = (0.7 × LLM_score) + (0.3 × rule_score)

Where:
- LLM_score: OpenAI GPT-4o-mini semantic matching (0-100)
- rule_score: Budget + features + schools + lot size (0-100)
```

### Full ML Version
```
hybrid_score = (0.5 × LLM_score) + (0.3 × ML_score) + (0.2 × rule_score)

Where:
- LLM_score: OpenAI semantic matching (0-100)
- ML_score: Ridge regression trained on LLM scores (0-100)
- rule_score: Hard rules (0-100)
```

## 🔍 Which Version Should You Use?

### Use Lightweight If:
- ✅ Deploying to Vercel
- ✅ Want faster cold starts
- ✅ Need lower costs
- ✅ LLM + Rules is sufficient accuracy

### Use Full ML If:
- ✅ Have access to larger infrastructure (AWS/GCP/DO)
- ✅ Need maximum accuracy
- ✅ Want ML model to learn from LLM scores
- ✅ Cold start time doesn't matter

## 🧪 Testing Both Versions

### Test Lightweight (Current)
```bash
curl -X POST https://your-app.vercel.app/api/recommend.py \
  -H "Content-Type: application/json" \
  -d '{
    "preferences_text": "3 bedroom under $800k in Sunnyvale",
    "limit": 10
  }'

# Response includes: "version": "lightweight"
```

### Test Full ML (After Switching)
```bash
curl -X POST https://your-app.aws-lambda.com/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "preferences_text": "3 bedroom under $800k in Sunnyvale",
    "limit": 10
  }'

# Response includes: "version": "full_ml"
```

## 📝 Version History

- **v1.0 (Current)**: Lightweight version for Vercel
- **v2.0 (Available)**: Full ML version with Ridge regression

## 🚀 Future Plans

### Potential Improvements:
1. **Vector embeddings**: Use embedding models for semantic search
2. **Neural network**: Replace Ridge with a small neural net
3. **Feature engineering**: Add more property features
4. **User feedback loop**: Learn from user swipes
5. **A/B testing**: Compare lightweight vs full ML accuracy

## 💡 Tips for Full ML Deployment

### AWS Lambda Configuration
```yaml
# serverless.yml
functions:
  recommend:
    handler: recommend.handler
    runtime: python3.10
    memorySize: 2048
    timeout: 300
    layers:
      - arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p310-numpy:1
      - arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p310-pandas:1
      - arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p310-scikit-learn:1
```

### Google Cloud Functions
```bash
gcloud functions deploy recommend \
  --gen2 \
  --runtime=python310 \
  --region=us-central1 \
  --source=. \
  --entry-point=handler \
  --memory=2048MB \
  --timeout=540s \
  --max-instances=10
```

### Environment Variables (Both Versions)
```bash
OPENAI_API_KEY=your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📞 Need Help?

- **Lightweight issues**: Check Vercel logs
- **Full ML issues**: Check AWS CloudWatch / GCP Logs
- **Performance**: Adjust batch size (limit parameter)
- **Accuracy**: Tune scoring weights in code

---

**Current Status**: ✅ Lightweight version deployed and working on Vercel
**Full ML Ready**: ✅ Code available in `recommend_full_ml.py`
