// Node.js script to find instances of Promise.withResolvers in the codebase
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Run grep to find all instances
exec('grep -r "Promise.withResolvers" --include="*.js" --include="*.ts" --include="*.tsx" src/', (error, stdout, stderr) => {
  if (error) {
    console.log('No instances found or error running grep:', error.message);
    return;
  }
  if (stderr) {
    console.error('Error:', stderr);
    return;
  }
  
  console.log('Found instances of Promise.withResolvers:');
  console.log(stdout);
  
  console.log('\nTo fix these manually, replace:');
  console.log('const { resolve, reject, promise } = Promise.withResolvers();');
  console.log('\nWith:');
  console.log('let resolve, reject;');
  console.log('const promise = new Promise((res, rej) => {');
  console.log('  resolve = res;');
  console.log('  reject = rej;');
  console.log('});');
}); 