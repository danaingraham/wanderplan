# 🔧 QA Test Failure Troubleshooting Guide

## When Tests Fail - DO NOT PANIC!

### 🚨 GOLDEN RULE: Never deploy if critical tests are failing

---

## 1. Supabase Client Initialization Failure

### ❌ Symptom: "Failed to initialize: [error]"
**Solutions:**
1. Check environment variables are set correctly
2. Verify API keys match in `.env` and Netlify
3. Check Supabase dashboard for service status
4. Try clearing browser cache

**Emergency Fix:**
```javascript
// In src/lib/supabase.ts, use minimal config:
auth: {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false
}
```

---

## 2. getSession Timeout/Hanging

### ❌ Symptom: "getSession timeout - not responding"
**This is CRITICAL - caused most of our issues!**

**Solutions:**
1. **Immediate:** Disable session persistence
   ```javascript
   // src/lib/supabase.ts
   persistSession: false
   ```

2. **Check for problematic settings:**
   - Remove `detectSessionInUrl: true` (causes hanging)
   - Remove `autoRefreshToken: true` (can cause hanging)
   - Remove custom storage adapters

3. **Test with minimal client:**
   ```javascript
   const supabase = createClient(url, key, {
     auth: {} // Minimal config
   })
   ```

**If still hanging:**
- Clear ALL localStorage/cookies
- Try incognito mode
- Check for browser extensions blocking

---

## 3. API Health Check Failures

### ❌ Symptom: "API responding with unexpected status"
**Solutions:**
1. **401 Unauthorized** = GOOD! API is working
2. **Network error** = Check internet/firewall
3. **CORS error** = Check Netlify headers configuration
4. **500 error** = Supabase service issue (check status page)

**Debug steps:**
```bash
# Test from command line
curl -H "apikey: YOUR_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

---

## 4. Authentication Failures

### ❌ Symptom: "Invalid API key" 
**Most common issue!**

**Solutions:**
1. **Re-copy API key to Netlify:**
   - Go to Supabase Dashboard > Settings > API
   - Copy the `anon` key (NOT service_role!)
   - Paste in Netlify > Site Configuration > Environment Variables
   - NO SPACES before/after!
   - Deploy with "Clear cache and deploy"

2. **Verify key length:**
   - Should be exactly 208 characters
   - Check in console: `SUPABASE_ANON_KEY.length`

3. **Wrong password vs wrong API key:**
   - "Invalid credentials" = wrong password
   - "Invalid API key" = environment variable issue

---

## 5. Login Works Then Immediately Logs Out

### ❌ Symptom: "Auth state corruption detected"
**Solutions:**
1. Check `isUsingSupabase` flag in UserContext
2. Ensure validation is skipped for Supabase:
   ```javascript
   // UserContext.tsx
   if (isUsingSupabase) return; // Skip validation
   ```
3. Add to dependency array: `[isInitialized, user, isUsingSupabase]`

---

## 6. Mobile-Specific Failures

### ❌ Symptom: Works on desktop, fails on mobile
**Solutions:**
1. **Clear mobile browser cache completely:**
   - iOS: Settings > Safari > Clear History and Website Data
   - Android: Chrome > Settings > Privacy > Clear browsing data

2. **Test in incognito/private mode first**

3. **Check mobile console:**
   - iOS: Settings > Safari > Advanced > Web Inspector ON
   - Connect to Mac > Safari > Develop menu

4. **Common mobile issues:**
   - localStorage quota exceeded
   - Aggressive battery optimization
   - Third-party cookie blocking

---

## 7. Build/TypeScript Failures

### ❌ Symptom: "TypeScript build failed"
**Solutions:**
```bash
# See specific errors:
npm run build

# Common fixes:
npm install          # Missing dependencies
npm update          # Outdated types
rm -rf node_modules && npm install  # Clean install
```

---

## 8. Performance Test Failures

### ❌ Symptom: "Bundle size > 1MB" or "Load time > 3s"
**Solutions:**
1. **Check for accidental imports:**
   ```bash
   # Find large dependencies
   npm run build -- --analyze
   ```

2. **Common culprits:**
   - Importing entire libraries instead of specific functions
   - Development code in production
   - Uncompressed images

3. **Quick fixes:**
   - Dynamic imports for large components
   - Remove unused dependencies
   - Enable compression in Netlify

---

## 🔥 EMERGENCY PROCEDURES

### If Production is Broken:

#### Option 1: Quick Rollback (Netlify)
1. Go to Netlify > Deploys
2. Find last working deployment
3. Click "Publish deploy"
4. Site reverts immediately

#### Option 2: Git Rollback
```bash
# Revert last commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard COMMIT_HASH
git push --force
```

#### Option 3: Emergency Disable Supabase
```javascript
// Force localStorage auth in UserContext.tsx
const isUsingSupabase = false; // Emergency override
```

---

## 📊 Test Failure Decision Tree

```
Test Failed?
├─ Is it blocking login?
│  ├─ YES → DO NOT DEPLOY
│  └─ NO → Continue ↓
├─ Is it affecting core functionality?
│  ├─ YES → Fix before deploy
│  └─ NO → Continue ↓
├─ Is it a performance warning?
│  ├─ YES → Can deploy, fix soon
│  └─ NO → Safe to deploy
```

---

## 🔍 Debug Commands Cheatsheet

```bash
# Check what's in localStorage (browser console)
Object.keys(localStorage).forEach(k => console.log(k, localStorage[k]))

# Clear everything (browser console)
localStorage.clear(); sessionStorage.clear();

# Test Supabase connection (browser console)
fetch('https://zhusodnwzmbpvvkxjtvn.supabase.co/rest/v1/', {
  headers: { 'apikey': 'YOUR_KEY' }
}).then(r => console.log('Status:', r.status))

# Force logout (browser console)
localStorage.removeItem('sb-wanderplan-auth-token')
location.reload()
```

---

## 📝 Failure Log Template

When a test fails, document it:

```markdown
Date: [DATE]
Test: [Which test failed]
Error: [Exact error message]
Environment: [Local/Production, Browser, OS]
Fix Applied: [What you did]
Result: [Did it work?]
Prevention: [How to prevent in future]
```

---

## 🆘 Still Stuck?

1. Check browser console for errors
2. Try the minimal test pages:
   - `/test.html` - Basic JavaScript test
   - `/mobile-login.html` - Direct Supabase test
   - `/clear-auth.html` - Clear all auth tokens

3. Test in this order:
   - Incognito/Private mode
   - Different browser
   - Different device
   - Different network (cellular vs WiFi)

4. Last resort:
   - Disable Supabase temporarily
   - Use localStorage auth
   - Fix and re-enable later

Remember: **It's better to have a working app with reduced features than a broken app with all features!**