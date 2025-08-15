# 🚨 QA Required Indicators

## Changes that ALWAYS require QA testing:

### HIGH RISK - Test immediately:
- [ ] Any changes to `src/lib/supabase.ts`
- [ ] Any changes to `src/contexts/UserContext.tsx`
- [ ] Any changes to authentication flow
- [ ] Any changes to `netlify.toml` or `_redirects`
- [ ] Environment variable changes
- [ ] Package.json dependency updates

### MEDIUM RISK - Test before next deploy:
- [ ] Changes to routing/navigation
- [ ] Database schema changes
- [ ] API endpoint modifications
- [ ] State management changes

### LOW RISK - Basic build check sufficient:
- [ ] UI/styling changes
- [ ] Text content updates
- [ ] Adding console.logs for debugging
- [ ] Documentation updates

## Quick Check Commands:
```bash
# I (Claude) will run this automatically:
npm run build

# You need to run these for HIGH RISK changes:
./run-qa-tests.sh
# Open https://wanderplanning.netlify.app/qa-test-suite.html
# Test login on mobile
```