# Hotfix Workflow - POS Next.js Project

## Overview

Proses cepat untuk menangani bug critical yang membutuhkan fix immediate di production. Fokus pada kecepatan dan stabilitas.

## Severity Classification

### P0 - Critical (Fix dalam 1-2 jam)

- App tidak bisa diakses
- Data loss atau corruption
- Security vulnerability
- Payment processing gagal
- Authentication tidak berfungsi

### P1 - High (Fix dalam 4-8 jam)

- Fitur utama tidak berfungsi
- Performance sangat lambat
- Transaksi tidak tersimpan
- Stock update tidak berfungsi

### P2 - Medium (Fix dalam 1-2 hari)

- UI/UX issues
- Feature sekunder bermasalah
- Minor data inconsistency

## Hotfix Process

### Phase 1: Immediate Response (0-15 menit)

#### 1.1 Assess Severity

```bash
# Check application status
curl -f https://your-pos-app.com/health || echo "App is down"

# Check database connectivity
npx supabase status --project-ref production-project-id

# Check recent deployments
git log --oneline -10

# Check error logs
npx supabase logs --project-ref production-project-id | tail -100
```

#### 1.2 Initial Communication

```markdown
**INCIDENT ALERT**

- Severity: [P0/P1/P2]
- Issue: [Brief description]
- Impact: [Affected users/features]
- ETA: [Expected fix time]
- Status: Investigating

**Affected Systems:**

- [ ] Authentication
- [ ] Transactions
- [ ] Products
- [ ] Reports
- [ ] Overall App

**Immediate Actions Taken:**

- [ ] Issue identified
- [ ] Hotfix branch created
- [ ] Fix in progress
```

#### 1.3 Create Hotfix Branch

```bash
# Switch to main branch
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-bug-description

# Start tracking time
echo "Hotfix started: $(date)" > hotfix.log
```

### Phase 2: Investigation (15-30 menit)

#### 2.1 Reproduce Issue

```typescript
// Create minimal test case
// src/scripts/reproduce-bug.ts
async function reproduceBug() {
  console.log('Testing bug scenario...');

  try {
    // Replicate the exact steps that cause the bug
    const result = await problemFunction();
    console.log('Result:', result);
  } catch (error) {
    console.error('Bug reproduced:', error);
    return error;
  }
}

// Run reproduction script
npx tsx src/scripts/reproduce-bug.ts
```

#### 2.2 Identify Root Cause

```bash
# Check recent changes
git log --since="24 hours ago" --oneline

# Look for related error patterns
grep -r "error_pattern" src/ --include="*.tsx" --include="*.ts"

# Check database issues
npx supabase logs --project-ref production-project-id | grep ERROR

# Check browser console logs (if UI issue)
# Ask users for console errors via support
```

#### 2.3 Impact Analysis

```typescript
// Quick impact assessment
const impactAssessment = {
  affectedUsers: "All users | Owner only | Cashier only | Specific stores",
  affectedFeatures: ["authentication", "transactions", "products"],
  dataIntegrity: "Safe | At risk | Compromised",
  workaround: "Available | Not available",
  estimatedDowntime: "< 1 hour | 1-4 hours | > 4 hours",
};
```

### Phase 3: Quick Fix (30-60 menit)

#### 3.1 Minimal Code Changes

```typescript
// Focus on minimal, surgical changes
// Avoid refactoring or improvements

// Example: Fix authentication bug
// Before (causing error)
export async function getUser() {
  const session = supabase.auth.session; // Deprecated method
  return session?.user;
}

// After (hotfix)
export async function getUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user;
}

// Add error boundary for immediate safety
try {
  const result = await riskyFunction();
  return result;
} catch (error) {
  console.error("Hotfix: Caught error in riskyFunction:", error);
  // Return safe fallback
  return defaultValue;
}
```

#### 3.2 Hotfix Patterns

##### Database Hotfixes

```sql
-- Quick data fix (if needed)
-- BACKUP FIRST!
UPDATE products
SET stock_quantity = GREATEST(stock_quantity, 0)
WHERE stock_quantity < 0;

-- Add missing index for performance
CREATE INDEX CONCURRENTLY idx_transactions_store_created
ON transactions(store_id, created_at);

-- Fix RLS policy (if too restrictive)
DROP POLICY IF EXISTS "problematic_policy" ON table_name;
CREATE POLICY "fixed_policy" ON table_name FOR ALL USING (
  -- More permissive condition
  store_id IN (SELECT store_id FROM users WHERE id = auth.uid())
);
```

##### Frontend Hotfixes

```typescript
// Add null checks
const user = userData?.profile?.user; // Safe access

// Add loading states
if (!data) {
  return <div>Loading...</div>;
}

// Add error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <ProblematicComponent />
</ErrorBoundary>;

// Disable problematic feature temporarily
const FEATURE_ENABLED = false; // Quick feature flag

if (FEATURE_ENABLED) {
  return <ProblematicFeature />;
}
return <div>Feature temporarily unavailable</div>;
```

##### Server Action Hotfixes

```typescript
// Add input validation
export async function hotfixAction(input: unknown) {
  // Quick validation
  if (!input || typeof input !== "object") {
    return { success: false, error: "Invalid input" };
  }

  try {
    // Original logic with error handling
    const result = await originalFunction(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Hotfix: Action failed:", error);
    return {
      success: false,
      error: "Service temporarily unavailable. Please try again.",
    };
  }
}
```

### Phase 4: Testing (10-15 menit)

#### 4.1 Rapid Testing

```bash
# Quick local test
npm run dev
# Manual test of critical path

# Quick build test
npm run build

# Type check
npx tsc --noEmit

# Quick unit test of fixed function
npm test -- --testNamePattern="fixed-function" --verbose
```

#### 4.2 Production Testing Checklist

- [ ] Bug is fixed
- [ ] No new errors introduced
- [ ] Critical user flows work
- [ ] Database operations successful
- [ ] Authentication works
- [ ] Performance acceptable

### Phase 5: Deployment (10-15 menit)

#### 5.1 Pre-deployment

```bash
# Ensure clean commit
git add .
git commit -m "hotfix: fix critical bug in [component]

- Issue: [brief description]
- Impact: [user impact]
- Fix: [what was changed]
- Tested: [how it was tested]

Fixes #[issue-number]"

# Push hotfix branch
git push origin hotfix/critical-bug-description
```

#### 5.2 Fast-track Deployment

```bash
# Skip normal review process for P0 issues
# Merge directly to main (only for critical hotfixes)
git checkout main
git merge hotfix/critical-bug-description

# Deploy immediately
npm run build
npm run deploy

# Or use platform-specific commands
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod
```

#### 5.3 Database Changes (if needed)

```bash
# Apply database hotfix
npx supabase db push --project-ref production-project-id

# Verify database health
npx supabase sql --project-ref production-project-id \
  --query "SELECT 'Database healthy' as status"
```

### Phase 6: Verification (5-10 menit)

#### 6.1 Post-deployment Checks

```bash
# Verify app is accessible
curl -f https://your-pos-app.com/ || echo "App still down"

# Check critical endpoints
curl -f https://your-pos-app.com/dashboard
curl -f https://your-pos-app.com/login

# Monitor logs for new errors
npx supabase logs --follow --project-ref production-project-id | head -20

# Check database connectivity
npx supabase status --project-ref production-project-id
```

#### 6.2 User Verification

```markdown
**VERIFICATION CHECKLIST**

- [ ] Login/logout works
- [ ] Product management works
- [ ] Transaction creation works
- [ ] Reports accessible
- [ ] Mobile interface responsive
- [ ] No console errors
- [ ] Performance acceptable

**Test with different user roles:**

- [ ] Owner account
- [ ] Cashier account
```

### Phase 7: Communication & Follow-up

#### 7.1 Resolution Communication

```markdown
**INCIDENT RESOLVED**

- Issue: [Description]
- Resolution: [What was fixed]
- Duration: [Total downtime]
- Prevention: [How to prevent recurrence]

**Timeline:**

- [Time] Issue reported
- [Time] Investigation started
- [Time] Root cause identified
- [Time] Fix deployed
- [Time] Issue resolved

**Next Steps:**

- [ ] Root cause analysis
- [ ] Preventive measures
- [ ] Process improvements
```

#### 7.2 Post-mortem Planning

```markdown
**POST-MORTEM REQUIRED**

- Schedule: Within 24-48 hours
- Attendees: Dev team, stakeholders
- Agenda:
  - Timeline review
  - Root cause analysis
  - Process evaluation
  - Prevention measures
  - Action items
```

## Hotfix Templates

### Quick Bug Fix Template

```typescript
// File: src/lib/hotfix-[issue-id].ts
/**
 * HOTFIX: [Brief description]
 * Date: [YYYY-MM-DD]
 * Issue: [Link to issue]
 * Impact: [User impact]
 */

// Backup original function (comment out)
/*
export async function originalFunction(data: any) {
  // Original problematic code
}
*/

// Hotfix implementation
export async function originalFunction(data: any) {
  try {
    // Add validation
    if (!data) {
      throw new Error("Data is required");
    }

    // Fixed logic
    const result = await saferImplementation(data);
    return result;
  } catch (error) {
    console.error("Hotfix: Function failed:", error);
    // Return safe fallback
    return fallbackResponse;
  }
}
```

### Database Hotfix Template

```sql
-- HOTFIX: [Issue description]
-- Date: [YYYY-MM-DD]
-- Impact: [What this fixes]
-- Risk: [Low/Medium/High]

BEGIN;

-- Backup affected data (if modifying)
-- CREATE TABLE backup_table_name AS SELECT * FROM original_table;

-- Apply fix
[SQL COMMANDS HERE]

-- Verify fix
SELECT COUNT(*) as affected_rows FROM [table_name] WHERE [condition];

COMMIT;
```

## Emergency Rollback

### Quick Rollback Process

```bash
# If hotfix makes things worse
git revert HEAD --no-edit
git push origin main

# Deploy rollback
npm run deploy

# Or revert to previous deployment
# Platform-specific commands
```

### Database Rollback

```sql
-- If database changes need rollback
BEGIN;

-- Restore from backup
-- TRUNCATE problematic_table;
-- INSERT INTO problematic_table SELECT * FROM backup_table_name;

-- Or revert specific changes
UPDATE table_name
SET column_name = old_value
WHERE condition;

COMMIT;
```

## Hotfix Command Cheat Sheet

```bash
# Emergency response commands
npm run build                    # Quick build check
npm test -- --bail              # Stop on first test failure
npx tsc --noEmit                # Type check only
git log --oneline -10           # Recent changes
npx supabase logs | tail -50    # Recent error logs
curl -f https://app.com/health  # Health check

# Quick deployment
git add . && git commit -m "hotfix: critical fix"
git push origin hotfix-branch
npm run deploy

# Emergency rollback
git revert HEAD --no-edit
git push origin main
npm run deploy
```

## Prevention Measures

### Monitoring Alerts

- Set up error rate alerts
- Monitor critical user flows
- Database performance monitoring
- Real-time user feedback

### Testing Improvements

- Add tests for bug scenarios
- Improve integration testing
- Add performance regression tests
- Implement canary deployments

### Process Improvements

- Code review checklist
- Deployment staging process
- Rollback procedures
- Incident response training
