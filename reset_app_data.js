// Run this in your browser console to clear all app data
console.log('🔧 Clearing all Wanderplan data...');

// Clear all localStorage data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('wanderplan_')) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log('Removing:', key);
  localStorage.removeItem(key);
});

console.log('✅ All app data cleared! You can now register a new account.');
console.log('Refresh the page and you should be redirected to the login screen.');