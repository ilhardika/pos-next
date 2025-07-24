# Debugging Mode - POS Next.js Project

## Context

Anda sedang dalam mode debugging untuk menyelesaikan bug atau issue pada aplikasi POS. Fokus pada identifikasi root cause dan solusi yang sustainable.

## Common Issues & Solutions

### Authentication Issues

```bash
# Check auth state
console.log("Auth user:", user);
console.log("User profile:", profile);

# Verify session
const { data: session } = await supabase.auth.getSession();
console.log("Session:", session);
```

### RLS Issues

```typescript
// Check if RLS policies are blocking
// Use admin client for debugging (NEVER in production)
const { data, error } = await supabaseAdmin.from("table_name").select("*");
```

### Store Access Issues

```typescript
// Verify user's store_id
const { data: userProfile } = await supabase
  .from("users")
  .select("store_id, role")
  .eq("id", user.id)
  .single();
```

### Transaction Issues

```bash
# Check transaction logs
# Look for these patterns in browser console:
- "🚀 SERVER ACTION CALLED"
- "📊 Input data:"
- "✅ Transaction created successfully"
- "❌ Transaction failed"
```

## Debugging Tools

### Browser DevTools

- **Network Tab**: Check Supabase API calls
- **Console**: Look for error messages and logs
- **Application Tab**: Check localStorage for auth tokens
- **Sources Tab**: Set breakpoints in Server Actions

### Supabase Dashboard

- **Table Editor**: Verify data is being inserted correctly
- **Authentication**: Check user accounts and verification status
- **Logs**: Review real-time logs for database errors

### VS Code Extensions

- **Thunder Client**: Test API endpoints
- **Supabase**: Direct database connection
- **Error Lens**: Inline TypeScript errors

## Debug Commands

```bash
# Verbose logging
NEXT_PUBLIC_SUPABASE_DEBUG=true npm run dev

# Check database connection
npx supabase status

# View recent logs
npx supabase logs --follow
```

## Common Error Patterns

### "relation does not exist"

- Database migration belum dijalankan
- Typo pada table name
- RLS policy mengblokir access

### "permission denied"

- User tidak memiliki access ke table
- RLS policy terlalu restrictive
- User belum authenticated

### "foreign key constraint"

- Data reference tidak valid (store_id, user_id)
- Data dihapus dari parent table

### "function does not exist"

- Database function belum dibuat
- Typo pada function name

## Performance Issues

```typescript
// Check slow queries
console.time('query');
const result = await supabase.from('products').select('*');
console.timeEnd('query');

// Monitor bundle size
npx @next/bundle-analyzer
```

## Security Debugging

- Never log sensitive data (passwords, tokens)
- Use admin client only for debugging, never in production
- Verify RLS policies with different user roles
- Check CORS settings for production deployment
