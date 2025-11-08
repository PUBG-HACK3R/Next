# Database Schema vs Code Analysis

## ✅ CRITICAL FINDINGS - ISSUES DETECTED

### 🔴 **CRITICAL ISSUES**

#### 1. **Missing Table: `daily_income_collections`**
**Location**: `src/app/dashboard/my-investments/page.tsx` (Line 131-134)
```typescript
const { data: incomeData, error } = await supabase
  .from('daily_income_collections')  // ❌ TABLE DOES NOT EXIST
  .select('amount, created_at')
  .eq('user_id', userId)
```
**Schema**: This table is NOT in your schema. Should use `income_transactions` instead.

**Impact**: 
- Today/Yesterday earnings will ALWAYS be 0
- Total expired earnings calculation is broken
- My Investments page earnings stats are incorrect

**Fix Required**: Replace `daily_income_collections` with `income_transactions`

---

#### 2. **Column Name Mismatch: `deposits.status`**
**Schema**: `status character varying DEFAULT 'pending'` (values: 'pending', 'approved', 'rejected')
**Code Usage**: Multiple files check for various status values:
- ✅ `'pending'`, `'approved'`, `'rejected'` (correct)
- ⚠️ `'Approved'`, `'Completed'`, `'completed'` (case mismatch)

**Locations**:
- `src/app/dashboard/page.tsx` (Line 172): `in('status', ['approved', 'Approved', 'completed', 'Completed'])`
- `src/app/dashboard/invite/page.tsx` (Line 311): `['Completed', 'completed', 'Approved', 'approved', 'Success', 'success']`

**Impact**: May miss deposits if status casing doesn't match

---

#### 3. **Column Name Mismatch: `withdrawals.status`**
**Schema**: `status text DEFAULT 'pending'`
**Code Usage**: Checking multiple variations:
- `'pending'`, `'approved'`, `'rejected'` ✅
- `'Approved'`, `'Completed'` ⚠️

**Locations**:
- `src/app/dashboard/page.tsx` (Line 176): `in('status', ['approved', 'Approved'])`
- `src/app/dashboard/invite/page.tsx` (Line 324): `['Completed', 'completed', 'Approved', 'approved', 'Success', 'success']`

---

#### 4. **Foreign Key Reference Issue: `deposits.approved_by`**
**Schema**: 
```sql
approved_by uuid,
CONSTRAINT deposits_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
```
**Issue**: References `auth.users(id)` but should reference `user_profiles(id)` for consistency

**Impact**: May cause issues when querying admin who approved deposits

---

#### 5. **Missing Column: `user_profiles.admin_id`**
**Code**: Several places reference admin operations but no `admin_id` or `is_admin` column exists
**Schema**: No admin identification column in `user_profiles`

**Impact**: Cannot distinguish admin users from regular users

---

### ⚠️ **POTENTIAL ISSUES**

#### 6. **Referral Commission Duplicate Columns**
**Schema**: `referral_commissions` table has:
- `level` (integer)
- `commission_level` (integer)

**Issue**: Two columns for the same purpose - redundant

---

#### 7. **Investment Status Values**
**Schema**: `investments.status text DEFAULT 'active'` (no constraint)
**Code Usage**: Uses `'active'`, `'completed'`, `'expired'`, `'cancelled'`

**Recommendation**: Add CHECK constraint:
```sql
CHECK (status IN ('active', 'completed', 'expired', 'cancelled'))
```

---

#### 8. **Agent Status Values**
**Schema**: `user_profiles.agent_status text DEFAULT 'not_eligible'` (no constraint)
**Code Usage**: Uses `'not_eligible'`, `'eligible'`, `'active'`

**Recommendation**: Add CHECK constraint:
```sql
CHECK (agent_status IN ('not_eligible', 'eligible', 'active', 'pending'))
```

---

### ✅ **WORKING CORRECTLY**

#### Tables Being Used Properly:
1. ✅ `admin_settings` - All queries correct
2. ✅ `user_profiles` - Mostly correct (except admin identification)
3. ✅ `plans` - All queries correct
4. ✅ `investments` - All queries correct
5. ✅ `referral_commissions` - All queries correct
6. ✅ `withdrawals` - Queries correct (status case issue noted)
7. ✅ `deposits` - Queries correct (status case issue noted)
8. ✅ `agent_eligibility_tracking` - All queries correct
9. ✅ `agent_rewards` - All queries correct
10. ✅ `bonus_transactions` - All queries correct
11. ✅ `income_transactions` - Exists but not being used where it should be

---

## 📊 **TABLE USAGE SUMMARY**

| Table | Used In Code | Issues |
|-------|-------------|--------|
| `admin_settings` | ✅ Yes | None |
| `agent_eligibility_tracking` | ✅ Yes | None |
| `agent_rewards` | ✅ Yes | None |
| `bonus_transactions` | ✅ Yes | None |
| `deposit_transactions` | ❓ Not found | Unused? |
| `deposits` | ✅ Yes | Status case mismatch |
| `income_transactions` | ⚠️ Partial | Should replace `daily_income_collections` |
| `investments` | ✅ Yes | None |
| `plans` | ✅ Yes | None |
| `referral_commissions` | ✅ Yes | Duplicate columns |
| `referral_transactions` | ❓ Not found | Unused? |
| `user_profiles` | ✅ Yes | Missing admin flag |
| `withdrawal_logs` | ❓ Not found | Unused? |
| `withdrawals` | ✅ Yes | Status case mismatch |

---

## 🔧 **REQUIRED FIXES**

### Priority 1 (Critical - Breaks Functionality):
1. **Replace `daily_income_collections` with `income_transactions`** in:
   - `src/app/dashboard/my-investments/page.tsx`
   - Any other files using this non-existent table

### Priority 2 (Important - Data Consistency):
2. **Standardize status values** - Make all status checks case-insensitive OR ensure database always uses lowercase
3. **Add missing admin identification** to `user_profiles` table

### Priority 3 (Nice to Have):
4. **Add CHECK constraints** for enum-like columns
5. **Remove duplicate columns** in `referral_commissions`
6. **Clean up unused tables** (`deposit_transactions`, `referral_transactions`, `withdrawal_logs`)

---

## 📝 **RECOMMENDATIONS**

1. **Use TypeScript types** that match your database schema exactly
2. **Add database migrations** for schema changes
3. **Use lowercase for all status values** consistently
4. **Add proper indexes** on frequently queried columns
5. **Consider using Supabase generated types** for type safety

---

## 🎯 **NEXT STEPS**

1. Fix the `daily_income_collections` → `income_transactions` issue FIRST
2. Standardize status value casing
3. Add admin identification to user_profiles
4. Test all database queries after fixes
5. Add proper error handling for database operations
