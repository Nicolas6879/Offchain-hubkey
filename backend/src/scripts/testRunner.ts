import runApiTests from './testApi';

// Import the runAllTests function dynamically to avoid circular dependencies
async function importAndRunUnitTests() {
  try {
    // Colors for console output
    const colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
    };

    console.log(`\n${colors.magenta}======================================${colors.reset}`);
    console.log(`${colors.magenta}=== OFFCHAIN-HUBKEY TEST RUNNER ===${colors.reset}`);
    console.log(`${colors.magenta}======================================${colors.reset}\n`);

    // Run unit tests first
    console.log(`${colors.blue}RUNNING UNIT TESTS...${colors.reset}\n`);
    
    // Load and run unit tests
    const testAllModule = await import('./testAll');
    const runAllTests = testAllModule.default || testAllModule.runAllTests;
    
    if (typeof runAllTests === 'function') {
      await runAllTests();
    } else {
      console.error(`${colors.red}Could not find runAllTests function in testAll.ts${colors.reset}`);
    }
    
    // Add separator
    console.log(`\n${colors.magenta}-------------------------------------${colors.reset}\n`);
    
    // Run API tests
    console.log(`${colors.blue}RUNNING API TESTS...${colors.reset}\n`);
    await runApiTests();
    
    console.log(`\n${colors.magenta}======================================${colors.reset}`);
    console.log(`${colors.green}ALL TESTS COMPLETED${colors.reset}`);
    console.log(`${colors.magenta}======================================${colors.reset}\n`);
    
    // Note about starting the server for API tests
    console.log(`${colors.yellow}NOTE: API tests require the server to be running.${colors.reset}`);
    console.log(`${colors.yellow}If API tests failed, start the server with 'npm run dev' in another terminal and try again.${colors.reset}\n`);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  importAndRunUnitTests().catch(console.error);
}

export default importAndRunUnitTests; 