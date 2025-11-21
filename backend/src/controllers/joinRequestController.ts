import { Request, Response } from 'express';
import JoinRequest from '../models/JoinRequest';
import User from '../models/User';
import emailService from '../services/emailService';
import mintService from '../services/mintService';
import topicService from '../services/topicService';
import mongoose from 'mongoose';
import { TopicId } from '@hashgraph/sdk';

/**
 * Controller for handling membership join requests
 * @module controllers/joinRequestController
 */

/**
 * Create a new join request
 * 
 * Handles the initial application to join the membership program.
 * Validates input, checks for duplicates, saves the request, and notifies admins.
 * 
 * @async
 * @function createJoinRequest
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const createJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, phone, email, walletAddress } = req.body;

    if (!fullName || !email || !walletAddress) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Check if a request already exists for this wallet or email
    const existingRequest = await JoinRequest.findOne({
      $or: [{ walletAddress }, { email }]
    });

    if (existingRequest) {
      res.status(409).json({
        success: false,
        message: 'A request already exists for this wallet or email',
      });
      return;
    }

    // Create new join request
    const newRequest = new JoinRequest({
      fullName,
      phone,
      email,
      walletAddress,
      status: 'pending',
    });

    await newRequest.save();

    // Create a topic for the user
    const topicResult = await topicService.createTopic({
      userId: newRequest._id?.toString() || newRequest.id,
      name: fullName,
      email: email,
      walletAddress: walletAddress,
    });

    // Submit a message to the topic
    await topicService.submitMessageToTopic(topicResult.topicId, JSON.stringify(newRequest));

    // add the topicId to the join request
    newRequest.topicId = topicResult.topicId.toString();
    await newRequest.save();

    // Notify admins of new request (in a real app)
    await emailService.notifyAdmins(fullName, email, walletAddress);

    res.status(201).json({
      success: true,
      requestId: newRequest._id,
      message: 'Join request submitted successfully',
    });
  } catch (error) {
    console.error('Error in createJoinRequest controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit join request',
      error: (error as Error).message,
    });
  }
};

/**
 * Get all join requests
 * 
 * Allows administrators to view all pending membership applications.
 * 
 * @async
 * @function getJoinRequests
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getJoinRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const joinRequests = await JoinRequest.find();
    res.status(200).json({ success: true, joinRequests });
  } catch (error) {
    console.error('Error in getJoinRequests controller:', error);
    res.status(500).json({ success: false, message: 'Failed to get join requests', error: (error as Error).message });
  }
};

/**
 * Approve a join request
 * 
 * Allows administrators to approve a pending membership application.
 * Updates the request status and notifies the applicant of their approval.
 * 
 * @async
 * @function approveJoinRequest
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const approveJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const joinRequest = await JoinRequest.findById(id);
    if (!joinRequest) {
      res.status(404).json({
        success: false,
        message: 'Join request not found',
      });
      return;
    }

    if (joinRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Request has already been ${joinRequest.status}`,
      });
      return;
    }

    // Update request status
    joinRequest.status = 'approved';
    joinRequest.approvedAt = new Date();
    
    // TEMPORARY: For testing, just set a dummy admin ID if req.user is not present
    if (req.user?.id) {
      joinRequest.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    } else {
      // Set to a dummy admin ID for testing
      joinRequest.approvedBy = new mongoose.Types.ObjectId('000000000000000000000001');
    }

    if (!joinRequest.topicId) {
      res.status(400).json({
        success: false,
        message: 'Topic ID is required to approve a join request',
      });
      return;
    }

    // Generate NFT for the approved user
    try {
      console.log('Minting NFT for approved user:', joinRequest.fullName);
      const nftResult = await mintService.mintIdentityNFT({
        userId: joinRequest._id?.toString() || joinRequest.id,
        name: joinRequest.fullName,
        email: joinRequest.email,
        walletAddress: joinRequest.walletAddress,
        metadata: joinRequest.topicId,
      });

      // Store NFT token ID and serial number in the join request
      joinRequest.nftTokenId = nftResult.tokenId;
      joinRequest.nftSerialNumber = nftResult.serialNumber;
      joinRequest.nftClaimed = false;

      // Submit a message to the topic
      await topicService.submitMessageToTopic(TopicId.fromString(joinRequest.topicId), JSON.stringify({
        event: `Topic associated to new member's NFT | ${nftResult.tokenId}:${nftResult.serialNumber}`,
        status: 'approved',
        walletAddress: joinRequest.walletAddress, 
        nftId: nftResult.tokenId.toString() + ':' + nftResult.serialNumber,
        timestamp: Date.now(),
      }));

      console.log('NFT minted successfully:', nftResult.tokenId, 'Serial:', nftResult.serialNumber);
    } catch (nftError) {
      console.error('NFT minting failed but request was approved:', nftError);
      // Continue with approval even if NFT minting fails
    }
    
    await joinRequest.save();

    // Notify user of approval
    try {
      await emailService.notifyApproval(
        joinRequest.email,
        joinRequest.fullName,
        joinRequest.walletAddress
      );
    } catch (emailError) {
      console.warn('Email notification failed but request was approved:', emailError);
      // Continue with success response even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Join request approved successfully',
    });
  } catch (error) {
    console.error('Error in approveJoinRequest controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve join request',
      error: (error as Error).message,
    });
  }
};

/**
 * Reject a join request
 * 
 * Allows administrators to reject a pending membership application.
 * Updates the request status, records the reason, and notifies the applicant.
 * 
 * @async
 * @function rejectJoinRequest
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const rejectJoinRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const joinRequest = await JoinRequest.findById(id);
    if (!joinRequest) {
      res.status(404).json({
        success: false,
        message: 'Join request not found',
      });
      return;
    }

    if (joinRequest.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Request has already been ${joinRequest.status}`,
      });
      return;
    }

    // Update request status
    joinRequest.status = 'rejected';
    joinRequest.rejectedAt = new Date();
    
    // TEMPORARY: For testing, just set a dummy admin ID if req.user is not present
    if (req.user?.id) {
      joinRequest.rejectedBy = new mongoose.Types.ObjectId(req.user.id);
    } else {
      // Set to a dummy admin ID for testing
      joinRequest.rejectedBy = new mongoose.Types.ObjectId('000000000000000000000001');
    }
    
    joinRequest.rejectionReason = reason;
    await joinRequest.save();

    // Submit a message to the topic
    await topicService.submitMessageToTopic(TopicId.fromString(joinRequest.topicId || ''), JSON.stringify({
      event: `Join Request Rejected for ${joinRequest.fullName} | ${reason}`,
      status: 'rejected',
      walletAddress: joinRequest.walletAddress, 
      timestamp: Date.now(),
    }));

    // Notify user of rejection
    try {
      await emailService.notifyRejection(
        joinRequest.email,
        joinRequest.fullName,
        reason
      );
    } catch (emailError) {
      console.warn('Email notification failed but request was rejected:', emailError);
      // Continue with success response even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Join request rejected successfully',
    });
  } catch (error) {
    console.error('Error in rejectJoinRequest controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject join request',
      error: (error as Error).message,
    });
  }
};

/**
 * Get join request status by wallet address
 * 
 * Allows users to check the status of their membership application.
 * Returns status and relevant timestamps based on the current state.
 * 
 * @async
 * @function getJoinRequestStatus
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getJoinRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
      return;
    }

    const joinRequest = await JoinRequest.findOne({ walletAddress: wallet });
    if (!joinRequest) {
      res.status(404).json({
        success: false,
        message: 'No join request found for this wallet',
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: joinRequest.status,
      requestedAt: joinRequest.createdAt,
      ...(joinRequest.status === 'approved' && { 
        approvedAt: joinRequest.approvedAt,
        nftTokenId: joinRequest.nftTokenId,
        nftSerialNumber: joinRequest.nftSerialNumber,
        nftClaimed: joinRequest.nftClaimed,
        nftClaimedAt: joinRequest.nftClaimedAt,
        canClaimNFT: joinRequest.nftTokenId && joinRequest.nftSerialNumber && !joinRequest.nftClaimed
      }),
      ...(joinRequest.status === 'rejected' && { 
        rejectedAt: joinRequest.rejectedAt,
        reason: joinRequest.rejectionReason
      }),
    });
  } catch (error) {
    console.error('Error in getJoinRequestStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve join request status',
      error: (error as Error).message,
    });
  }
};

/**
 * Claim (transfer) NFT to user's wallet
 * 
 * Allows approved users to claim their membership NFT by transferring it 
 * from the operator's wallet to their own wallet address.
 * 
 * @async
 * @function claimNFT
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const claimNFT = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
      return;
    }

    const joinRequest = await JoinRequest.findOne({ 
      walletAddress: wallet,
      status: 'approved',
      nftTokenId: { $exists: true },
      nftSerialNumber: { $exists: true },
      nftClaimed: false
    });

    if (!joinRequest) {
      res.status(404).json({
        success: false,
        message: 'No claimable NFT found for this wallet',
      });
      return;
    }

    if (!joinRequest.nftTokenId || !joinRequest.nftSerialNumber) {
      res.status(400).json({
        success: false,
        message: 'No NFT token ID or serial number associated with this request',
      });
      return;
    }

    // Transfer NFT to user's wallet
    try {
      console.log('Transferring NFT to user:', joinRequest.nftTokenId, 'Serial:', joinRequest.nftSerialNumber, '->', joinRequest.walletAddress);
      const transferResult = await mintService.transferNFT(
        joinRequest.nftTokenId,
        joinRequest.nftSerialNumber,
        joinRequest.walletAddress
      );

      // Update join request to mark NFT as claimed
      joinRequest.nftClaimed = true;
      joinRequest.nftClaimedAt = new Date();
      await joinRequest.save();

      console.log('NFT transfer successful:', transferResult.transactionId);

      res.status(200).json({
        success: true,
        message: 'NFT transferred successfully',
        transactionId: transferResult.transactionId,
        tokenId: joinRequest.nftTokenId,
        serialNumber: joinRequest.nftSerialNumber,
      });
    } catch (transferError) {
      console.error('NFT transfer failed:', transferError);
      res.status(500).json({
        success: false,
        message: 'Failed to transfer NFT',
        error: (transferError as Error).message,
      });
    }
  } catch (error) {
    console.error('Error in claimNFT controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim NFT',
      error: (error as Error).message,
    });
  }
};

/**
 * Get NFT claim status for a wallet
 * 
 * Allows users to check if they have an NFT available to claim.
 * 
 * @async
 * @function getNFTClaimStatus
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getNFTClaimStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
      return;
    }

    const joinRequest = await JoinRequest.findOne({ 
      walletAddress: wallet,
      status: 'approved'
    });

    if (!joinRequest) {
      res.status(404).json({
        success: false,
        message: 'No approved request found for this wallet',
      });
      return;
    }

    res.status(200).json({
      success: true,
      hasNFT: !!joinRequest.nftTokenId,
      nftClaimed: joinRequest.nftClaimed || false,
      nftTokenId: joinRequest.nftTokenId,
      nftSerialNumber: joinRequest.nftSerialNumber,
      claimedAt: joinRequest.nftClaimedAt,
      canClaim: !!joinRequest.nftTokenId && !!joinRequest.nftSerialNumber && !joinRequest.nftClaimed,
    });
  } catch (error) {
    console.error('Error in getNFTClaimStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get NFT claim status',
      error: (error as Error).message,
    });
  }
}; 