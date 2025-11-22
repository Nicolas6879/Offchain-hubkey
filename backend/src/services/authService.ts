import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import config from '../config/env';
import emailService from './emailService';
import walletService from './walletService';

interface SignupParams {
  email: string;
  password: string;
  name?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    walletAddress: string;
    name?: string;
  };
  wallet?: {
    accountId: string;
    publicKey: string;
    privateKey: string; // Only returned on signup for QR display
  };
}

class AuthService {
  /**
   * Register a new user
   */
  async signup(userData: SignupParams): Promise<AuthResponse> {
    try {
      // Check if user already exists by email
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Generate Hedera wallet for the user
      console.log('🔐 Generating wallet for new user...');
      const walletData = await walletService.generateWallet();

      // Create a new user with generated wallet
      const user = new User({
        email: userData.email,
        walletAddress: walletData.accountId,
        password: userData.password,
        name: userData.name,
        privateKey: walletData.encryptedPrivateKey,
        publicKey: walletData.publicKey,
        accountCreatedAt: new Date(),
        hasParticipatedInEvent: false,
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Send welcome email
      await this.sendWelcomeEmail(user);

      console.log(`✅ User registered successfully with wallet: ${walletData.accountId}`);

      return {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          walletAddress: user.walletAddress,
          name: user.name,
        },
        wallet: {
          accountId: walletData.accountId,
          publicKey: walletData.publicKey,
          privateKey: walletData.privateKey, // Unencrypted for QR display
        },
      };
    } catch (error) {
      console.error('Error in signup service:', error);
      throw new Error('Failed to register user');
    }
  }

  /**
   * Login a user
   */
  async login({ email, password }: LoginParams): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          walletAddress: user.walletAddress,
          name: user.name,
        },
      };
    } catch (error) {
      console.error('Error in login service:', error);
      throw new Error('Failed to login');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        walletAddress: user.walletAddress,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Send welcome email to new users
   */
  private async sendWelcomeEmail(user: IUser): Promise<boolean> {
    const subject = 'Welcome to OffChain HubKey';
    const text = `
      Hello ${user.name || 'there'},
      
      Welcome to OffChain HubKey! Your account has been created successfully.
      
      You can now access your account using your email and password.
      
      Your wallet address: ${user.walletAddress}
      
      Thank you for joining us!
      
      Best regards,
      The OffChain HubKey Team
    `;

    try {
      return await emailService.sendEmail({
        to: user.email,
        subject,
        text,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Register a user with an existing wallet (from WalletConnect)
   */
  async walletRegister(userData: {
    email: string;
    password: string;
    name?: string;
    walletAddress: string;
  }): Promise<AuthResponse> {
    try {
      // Check if user already exists by email
      const existingUserByEmail = await User.findOne({ email: userData.email });
      if (existingUserByEmail) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Check if wallet is already registered
      const existingUserByWallet = await User.findOne({
        walletAddress: userData.walletAddress.toLowerCase(),
      });
      if (existingUserByWallet) {
        return {
          success: false,
          message: 'This wallet is already registered',
        };
      }

      // Create user with provided wallet (no private key since it's external)
      const user = new User({
        email: userData.email,
        walletAddress: userData.walletAddress.toLowerCase(),
        password: userData.password,
        name: userData.name,
        hasParticipatedInEvent: false,
        // No privateKey or publicKey - user manages their own wallet
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Send welcome email
      await this.sendWelcomeEmail(user);

      console.log(`✅ User registered with external wallet: ${userData.walletAddress}`);

      return {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          walletAddress: user.walletAddress,
          name: user.name,
        },
      };
    } catch (error) {
      console.error('Error in wallet registration:', error);
      throw new Error('Failed to register user with wallet');
    }
  }

  /**
   * Check if a wallet address is already registered
   */
  async checkWallet(walletAddress: string): Promise<{
    success: boolean;
    exists: boolean;
    user?: {
      id: string;
      email: string;
      walletAddress: string;
      name?: string;
    };
    token?: string;
  }> {
    try {
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

      if (user) {
        // Wallet exists - generate token for auto-login
        const token = this.generateToken(user);

        return {
          success: true,
          exists: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            walletAddress: user.walletAddress,
            name: user.name,
          },
          token,
        };
      }

      // Wallet doesn't exist - needs registration
      return {
        success: true,
        exists: false,
      };
    } catch (error) {
      console.error('Error checking wallet:', error);
      throw new Error('Failed to check wallet');
    }
  }
}

export default new AuthService(); 