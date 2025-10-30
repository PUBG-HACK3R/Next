// Debug script to check today's commission calculation
// Run this in browser console on the invite page

console.log('=== DEBUG TODAY COMMISSIONS ===');

// Get current date info
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

console.log('Today:', today.toDateString());
console.log('Today ISO:', today.toISOString());
console.log('Yesterday:', yesterday.toDateString());

// Check commission data from database
const checkCommissions = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('User ID:', user.id);
    
    // Get all commissions for this user
    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching commissions:', error);
      return;
    }
    
    console.log('Total commissions found:', commissions?.length || 0);
    
    if (commissions && commissions.length > 0) {
      console.log('\n=== COMMISSION DETAILS ===');
      commissions.forEach((commission, index) => {
        const commissionDate = new Date(commission.created_at);
        const isToday = commissionDate.toDateString() === today.toDateString();
        const isYesterday = commissionDate.toDateString() === yesterday.toDateString();
        
        console.log(`Commission ${index + 1}:`);
        console.log('  Amount:', commission.commission_amount);
        console.log('  Level:', commission.level);
        console.log('  Created:', commission.created_at);
        console.log('  Date object:', commissionDate);
        console.log('  Date string:', commissionDate.toDateString());
        console.log('  Is today?', isToday);
        console.log('  Is yesterday?', isYesterday);
        console.log('  ---');
      });
      
      // Calculate totals
      let todayTotal = 0;
      let yesterdayTotal = 0;
      let grandTotal = 0;
      
      commissions.forEach(commission => {
        const amount = commission.commission_amount;
        grandTotal += amount;
        
        const commissionDate = new Date(commission.created_at);
        if (commissionDate.toDateString() === today.toDateString()) {
          todayTotal += amount;
        } else if (commissionDate.toDateString() === yesterday.toDateString()) {
          yesterdayTotal += amount;
        }
      });
      
      console.log('\n=== TOTALS ===');
      console.log('Today total:', todayTotal);
      console.log('Yesterday total:', yesterdayTotal);
      console.log('Grand total:', grandTotal);
    } else {
      console.log('No commissions found');
    }
  } catch (error) {
    console.error('Error in debug script:', error);
  }
};

// Run the check
checkCommissions();
