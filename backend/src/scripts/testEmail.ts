import emailService from '../services/emailService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Test email service functionality
 */
async function testEmailService(): Promise<void> {
  console.log('Testing Email Service...');
  console.log('Using the following email configuration:');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`From: ${process.env.EMAIL_FROM}`);
  console.log(`To: ${process.env.HUB_EMAIL}`);
  
  try {
    // First test: send regular email
    console.log('\nTest 1: Sending a regular email...');
    const emailResult = await emailService.sendEmail({
      to: process.env.HUB_EMAIL || 'test@example.com',
      subject: 'Test Email from OffChain HubKey',
      text: 'This is a test email from the OffChain HubKey backend application.',
    });
    
    if (emailResult) {
      console.log('✅ Regular email sent successfully!');
    } else {
      console.error('❌ Failed to send regular email');
    }
    
    // Second test: send hub notification
    console.log('\nTest 2: Sending a hub notification email...');
    const notificationResult = await emailService.notifyHub(
      'Test Visitor',
      'visitor@example.com',
      '0.0.12345',
      undefined,
      'hub@example.com'
    );
    
    if (notificationResult) {
      console.log('✅ Hub notification email sent successfully!');
    } else {
      console.error('❌ Failed to send hub notification email');
    }
    
    console.log('\nEmail testing completed!');
    
    // Return values for potential programmatic use
    return Promise.resolve();
  } catch (error) {
    console.error('Error during email testing:', error);
    return Promise.reject(error);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  testEmailService()
    .then(() => {
      console.log('Email tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Email tests failed:', error);
      process.exit(1);
    });
}

export default testEmailService; 