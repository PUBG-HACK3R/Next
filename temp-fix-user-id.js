// Temporary fix: Get user ID directly from Supabase auth
// Add this to the USDT deposit function

// Replace this line:
// user_id: user.id,

// With this:
const { data: { user: currentUser } } = await supabase.auth.getUser()
if (!currentUser) {
  throw new Error('User not authenticated')
}

// Then use:
// user_id: currentUser.id,

// This ensures we're using the actual authenticated user ID
// instead of relying on the frontend state
