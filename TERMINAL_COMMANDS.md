# 🚀 Complete Terminal Commands for GitHub

Run these commands in order:

## Step 1: Authenticate with GitHub (Choose ONE option)

### Option A: GitHub CLI Authentication
```bash
gh auth login
# Follow the prompts:
# 1. Choose "GitHub.com"
# 2. Choose "HTTPS" 
# 3. Choose "Yes" for authentication
# 4. Choose "Login with a web browser"
# 5. Copy the code and open the URL in browser
```

### Option B: Manual Setup (if CLI auth fails)
```bash
# You'll add the remote manually after creating repo on web
```

## Step 2: Create Repository with GitHub CLI

```bash
cd "/Users/andytran/Dropbox/code/claudecode/News Alert for Stocks"

# Create the repository
gh repo create stock-news-aggregator \
  --description "🏦 Intelligent stock analysis platform with real-time news classification and market correlation - Hedge fund ready" \
  --public \
  --source=. \
  --remote=origin \
  --push
```

## Step 3: If GitHub CLI Doesn't Work - Manual Method

```bash
# 1. Go to https://github.com/new
# 2. Create repository named: stock-news-aggregator
# 3. Then run these commands:

cd "/Users/andytran/Dropbox/code/claudecode/News Alert for Stocks"

# Add your GitHub repo as remote (REPLACE with your actual username)
git remote add origin https://github.com/YOUR_USERNAME/stock-news-aggregator.git

# Push your code
git branch -M main
git push -u origin main
```

## Step 4: Verify Success

```bash
# Check if remote was added
git remote -v

# Check repository status
git status

# View your repo online
gh browse  # (if GitHub CLI worked)
# OR manually go to: https://github.com/YOUR_USERNAME/stock-news-aggregator
```

## 🎉 Success Indicators

After running these commands, you should see:
- ✅ Repository created on GitHub
- ✅ All your code uploaded
- ✅ Professional README displayed
- ✅ .env files NOT uploaded (secure)
- ✅ Clean commit history

## 🔧 Troubleshooting

If you get authentication errors:
1. Try: `gh auth logout` then `gh auth login` again
2. Or use the manual method (Step 3)
3. Make sure you have GitHub account access

---

**Your professional stock analysis platform will be live on GitHub! 🚀**