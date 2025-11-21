import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import config from '../config/env';
import emailService from './emailService';

interface SignupParams {
  email: string;
  walletAddress: string;
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
}

class AuthService {
  /**
   * Register a new user
   */
  async signup(userData: SignupParams): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { walletAddress: userData.walletAddress }],
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or wallet address already exists',
        };
      }

      // Create a new user
      const user = new User({
        email: userData.email,
        walletAddress: userData.walletAddress,
        password: userData.password,
        name: userData.name,
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Send welcome email
      await this.sendWelcomeEmail(user);

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
}

export default new AuthService(); 