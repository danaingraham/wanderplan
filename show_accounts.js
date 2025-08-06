// Run this in your browser console to see existing accounts
console.log('🔍 Checking for existing Wanderplan accounts...');

try {
  const users = JSON.parse(localStorage.getItem('wanderplan_users') || '[]');
  console.log('📱 Found accounts:');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}, Name: ${user.full_name}, ID: ${user.id}`);
  });
  
  if (users.length === 0) {
    console.log('No accounts found. You can create a new one by going to the signup page.');
  } else {
    console.log('\n💡 You can use any of these email addresses to log in.');
    console.log('If you forgot the password, use the reset script to clear data and create a new account.');
  }
} catch (error) {
  console.error('Error reading user data:', error);
}