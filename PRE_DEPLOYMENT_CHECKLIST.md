# 🚀 Wanderplan Pre-Deployment Checklist

## ⚠️ CRITICAL: Run this checklist before EVERY deployment

### 1. 🧪 Automated Tests
- [ ] Run QA Test Suite: Open `/qa-test-suite.html` in browser
  - [ ] All critical tests pass (Supabase init, health check, session, localStorage)
  - [ ] No getSession timeouts
  - [ ] API health check returns 200 or 401

### 2. 🔐 Authentication Tests (Manual)
- [ ] **Desktop Login Test**
  - [ ] Clear all browser data/cache
  - [ ] Navigate to site
  - [ ] Login with valid credentials
  - [ ] Verify navigation to dashboard
  - [ ] Refresh page - should return to login (session persistence disabled)
  
- [ ] **Mobile Login Test** 
  - [ ] Clear Safari/Chrome cache
  - [ ] Navigate to site on mobile
  - [ ] Login with valid credentials  
  - [ ] Verify navigation to dashboard
  - [ ] No hanging or blank pages

### 3. 🏗️ Build Verification
```bash
# Run these commands locally before pushing
npm run build
# Should complete without errors
# Check for warnings about bundle size
```

### 4. 🔍 Code Review Checklist
- [ ] No hardcoded API keys or secrets
- [ ] No console.log with sensitive data
- [ ] No test/debug code in production files
- [ ] Environment variables used correctly

### 5. 🌐 Environment Variables (Netlify)
Verify these are set in Netlify dashboard:
- [ ] `VITE_SUPABASE_URL` - Starts with `https://`
- [ ] `VITE_SUPABASE_ANON_KEY` - Exactly 208 characters, no spaces

### 6. 📱 Cross-Platform Testing
Test on:
- [ ] Chrome Desktop
- [ ] Safari Desktop  
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

### 7. 🔧 Core Functionality Tests
- [ ] Create new trip
- [ ] Add places to trip
- [ ] Edit trip details
- [ ] Delete trip
- [ ] Logout works

### 8. ⚡ Performance Checks
- [ ] Page loads in < 3 seconds
- [ ] No JavaScript errors in console
- [ ] No failed network requests (check Network tab)

### 9. 🐛 Known Issues to Check
- [ ] getSession doesn't hang (timeout after 3s is ok)
- [ ] No "auth state corruption" errors after login
- [ ] Login doesn't clear and stay on login page

### 10. 📋 Final Steps
- [ ] Commit message describes changes clearly
- [ ] No breaking changes to API contracts
- [ ] Version number updated if major release

## 🚨 If Any Test Fails:
1. **DO NOT DEPLOY**
2. Fix the issue
3. Re-run entire checklist
4. Only deploy when ALL items pass

## 📝 Deployment Log Template
```
Date: [DATE]
Version: [VERSION]
Deployed by: [NAME]
Tests passed: ✅ All / ⚠️ Partial (list failures)
Notes: [Any special considerations]
```

## 🔄 Post-Deployment Verification
After deployment to Netlify:
1. Wait for build to complete
2. Test login on production site
3. Verify core functionality
4. Monitor for errors in first 10 minutes

## 🆘 Rollback Procedure
If critical issues after deployment:
1. Revert commit: `git revert HEAD && git push`
2. Or use Netlify's deploy rollback feature
3. Notify team of rollback
4. Investigate issue before re-deploying