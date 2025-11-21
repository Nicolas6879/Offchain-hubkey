import nodemailer from 'nodemailer';
import config from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });
  }

  async sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async notifyAdmins(fullName: string, email: string, walletAddress: string): Promise<boolean> {
    const subject = `New Join Request: ${fullName}`;
    const text = `
      A new user has requested to join the Offchain Membership.
  
      Name: ${fullName}
      Email: ${email}
      Wallet Address: ${walletAddress}
  
      Please review and approve/reject this request in the admin dashboard.
    `;
  
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #4a90e2; margin-top: 0;">New Join Request 🎫</h2>
          <p style="font-size: 16px; color: #333;">
            A new user has requested to join the Offchain Membership. Please review the details below:
          </p>
          <ul style="font-size: 16px; color: #555; line-height: 1.6;">
            <li><strong>Name:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Wallet Address:</strong> ${walletAddress}</li>
          </ul>
          <p style="font-size: 15px; color: #444; margin-top: 20px;">
            <strong>Next Steps:</strong><br/>
            Please review this request and approve or reject it in the admin dashboard.
          </p>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${config.frontendUrl}/admin/join-requests" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Request</a>
          </div>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">
            This is an automated message from the Offchain Membership system.
          </p>
        </div>
      </div>
    `;
  
    return this.sendEmail({
      to: config.email.adminEmail,
      subject,
      text,
      html,
    });
  }

  async notifyApproval(userEmail: string, userName: string, walletAddress: string): Promise<boolean> {
    const subject = `Welcome to Offchain Membership!`;
    const text = `
      Dear ${userName},
  
      We're pleased to inform you that your request to join the Offchain Membership has been approved!
  
      Your wallet address (${walletAddress}) is now associated with your membership.
  
      Next Steps:
      1. You can now mint your membership NFT through our platform
      2. Use your NFT to access partner hubs and events
      3. Enjoy all member benefits!
  
      Welcome aboard!
    `;
  
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #4a90e2; margin-top: 0;">Welcome to Offchain Membership! 🎉</h2>
          <p style="font-size: 16px; color: #333;">
            Dear ${userName},
          </p>
          <p style="font-size: 16px; color: #333;">
            We're pleased to inform you that your request to join the Offchain Membership has been approved!
          </p>
          <p style="font-size: 16px; color: #555;">
            Your wallet address (${walletAddress}) is now associated with your membership.
          </p>
          <h3 style="color: #4a90e2; margin-top: 25px;">Next Steps</h3>
          <ol style="font-size: 16px; color: #555; line-height: 1.6;">
            <li>You can now mint your membership NFT through our platform</li>
            <li>Use your NFT to access partner hubs and events</li>
            <li>Enjoy all member benefits!</li>
          </ol>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${config.frontendUrl}/mint-nft" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mint Your Membership NFT</a>
          </div>
          <p style="font-size: 16px; color: #333; margin-top: 30px;">
            Welcome aboard!
          </p>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">
            This is an automated message from the Offchain Membership system.
          </p>
        </div>
      </div>
    `;
  
    return this.sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
  }

  async notifyRejection(userEmail: string, userName: string, reason?: string): Promise<boolean> {
    const subject = `Regarding Your Offchain Membership Application`;
    const reasonText = reason 
      ? `Reason: ${reason}`
      : 'If you believe there has been an error, please contact our support team.';
  
    const text = `
      Dear ${userName},
  
      Thank you for your interest in joining the Offchain Membership.
  
      We've reviewed your application and unfortunately, we are unable to approve it at this time.
  
      ${reasonText}
  
      You may submit a new application in the future if your circumstances change.
  
      Best regards,
      The Offchain Team
    `;
  
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #4a90e2; margin-top: 0;">Regarding Your Membership Application</h2>
          <p style="font-size: 16px; color: #333;">
            Dear ${userName},
          </p>
          <p style="font-size: 16px; color: #333;">
            Thank you for your interest in joining the Offchain Membership.
          </p>
          <p style="font-size: 16px; color: #555;">
            We've reviewed your application and unfortunately, we are unable to approve it at this time.
          </p>
          <p style="font-size: 16px; color: #555; margin-top: 20px;">
            <strong>${reason ? 'Reason:' : ''}</strong> ${reasonText}
          </p>
          <p style="font-size: 16px; color: #555; margin-top: 20px;">
            You may submit a new application in the future if your circumstances change.
          </p>
          <p style="font-size: 16px; color: #333; margin-top: 30px;">
            Best regards,<br>
            The Offchain Team
          </p>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">
            This is an automated message from the Offchain Membership system.
          </p>
        </div>
      </div>
    `;
  
    return this.sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
  }

  async notifyRevocation(userEmail: string, userName: string, reason?: string): Promise<boolean> {
    const subject = `Important: Regarding Your Offchain Membership`;
    const reasonText = reason 
      ? `Reason: ${reason}`
      : 'For more information, please contact our support team.';
  
    const text = `
      Dear ${userName},
  
      We regret to inform you that your Offchain Membership has been revoked.
  
      ${reasonText}
  
      If you believe this decision was made in error, please contact our support team.
  
      Regards,
      The Offchain Team
    `;
  
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #4a90e2; margin-top: 0;">Regarding Your Membership</h2>
          <p style="font-size: 16px; color: #333;">
            Dear ${userName},
          </p>
          <p style="font-size: 16px; color: #333;">
            We regret to inform you that your Offchain Membership has been revoked.
          </p>
          <p style="font-size: 16px; color: #555; margin-top: 20px;">
            <strong>${reason ? 'Reason:' : ''}</strong> ${reasonText}
          </p>
          <p style="font-size: 16px; color: #555; margin-top: 20px;">
            If you believe this decision was made in error, please contact our support team.
          </p>
          <p style="font-size: 16px; color: #333; margin-top: 30px;">
            Regards,<br>
            The Offchain Team
          </p>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">
            This is an automated message from the Offchain Membership system.
          </p>
        </div>
      </div>
    `;
  
    return this.sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
  }

  /**
   * Notify a hub about an upcoming visitor
   * @param visitorName - Name of the visitor
   * @param visitorEmail - Email of the visitor
   * @param visitorNftId - NFT ID proving membership
   * @param visitDate - Expected visit date
   * @param hubEmail - Specific hub email address (falls back to config)
   */
  async notifyHub(
    visitorName: string,
    visitorEmail: string,
    visitorNftId: string,
    visitDate?: string,
    hubEmail?: string
  ): Promise<boolean> {
    const dateInfo = visitDate ? `Expected Visit Date: ${visitDate}` : 'Visit date not specified';
    
    // Generate a verification link that will trigger the signature request
    // Use API URL instead of frontend URL for direct access to the verification endpoint
    const apiBaseUrl = process.env.API_URL || `http://localhost:${config.port || 3333}`;
    const verificationLink = `${apiBaseUrl}/api/verify-access?accessId=${visitorNftId}&email=${encodeURIComponent(visitorEmail)}&name=${encodeURIComponent(visitorName)}`;
    
    const subject = `Visitor Access Request: ${visitorName}`;
    const text = `
      A new visitor has requested access to your hub.
  
      Name: ${visitorName}
      Email: ${visitorEmail}
      NFT ID: ${visitorNftId}
      ${dateInfo}
  
      Please register this visitor in your system.
  
      When the visitor arrives, click the verification link below to request a digital signature:
      ${verificationLink}
      
      This will send a real-time signature request to the visitor's connected device.
      Once verified, you can grant access to the hub.
    `;
  
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #4a90e2; margin-top: 0;">Visitor Access Request 🚪</h2>
          <p style="font-size: 16px; color: #333;">
            A new visitor has requested access to your hub. Please register them in your system:
          </p>
          <ul style="font-size: 16px; color: #555; line-height: 1.6;">
            <li><strong>Name:</strong> ${visitorName}</li>
            <li><strong>Email:</strong> ${visitorEmail}</li>
            <li><strong>NFT ID:</strong> ${visitorNftId}</li>
            <li><strong>${visitDate ? 'Expected Visit Date:' : ''}</strong> ${visitDate || ''}</li>
          </ul>
          <p style="font-size: 15px; color: #444; margin-top: 20px;">
            <strong>Instructions for Reception:</strong><br/>
            When this visitor arrives, click the verification button below to request a digital signature:
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${verificationLink}" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Request Signature Verification</a>
          </div>
          <p style="font-size: 15px; color: #444;">
            This will send a real-time signature request to the visitor's connected device.
            The visitor will need to sign the message with their wallet to prove ownership of their NFT.
            Once verified, you can grant access to the hub.
          </p>
          <p style="font-size: 13px; color: #888; margin-top: 30px;">
            This is an automated message from the OffChain Project.
          </p>
        </div>
      </div>
    `;
  
    return this.sendEmail({
      to: hubEmail || config.email.hubEmail,
      subject,
      text,
      html,
    });
  }
}

export default new EmailService(); 