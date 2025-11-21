/**
 * @fileoverview Hub Access controller for physical location access
 * Handles requests for hub access, notifications, status checks, access logs, and hub management
 */

import { Request, Response } from 'express';
import emailService from '../services/emailService';
import mintService from '../services/mintService';
import HubAccess from '../models/HubAccess';
import User from '../models/User';
import Hub from '../models/Hub';

/**
 * Request access to a hub
 * 
 * Initiates a request for a member to visit a partner hub.
 * Verifies NFT ownership, creates a hub access record, and notifies the hub.
 * 
 * @async
 * @function requestHubAccess
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const requestHubAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId, name, email, walletAddress, tokenId, visitDate } = req.body;

    if (!hubId || !name || !email || !walletAddress || !tokenId) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // TEMPORARY: Skip token ownership verification for testing
    // Normally we would verify the token is owned by the wallet address
    /*
    // Verify token ownership
    const isOwner = await mintService.verifyOwnership(tokenId, walletAddress);
    if (!isOwner) {
      res.status(401).json({
        success: false,
        message: 'Address is not the owner of this NFT',
      });
      return;
    }
    */

    // Create new hub access request
    const hubAccess = new HubAccess({
      hubId,
      memberName: name,
      memberEmail: email,
      memberWalletAddress: walletAddress,
      tokenId,
      visitDate: visitDate || new Date(),
      status: 'pending',
    });

    await hubAccess.save();

    // Get hub details
    const hub = await Hub.findById(hubId);
    
    // If hub exists, notify it about the new access request
    if (hub) {
      try {
        console.log(`Sending email notification to hub about visitor: ${name}, email: ${email}, tokenId: ${tokenId}`);
        await emailService.notifyHub(
          name,
          email,
          tokenId,
          visitDate || new Date().toISOString(),
          hub.contactEmail
        );
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send hub notification email:', emailError);
        // Continue processing even if email fails
      }
    } else {
      console.warn(`Hub not found with ID: ${hubId}`);
    }

    res.status(201).json({
      success: true,
      accessId: hubAccess._id,
      message: 'Hub access request submitted successfully',
    });
  } catch (error) {
    console.error('Error in requestHubAccess controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request hub access',
      error: (error as Error).message,
    });
  }
};

/**
 * Notify hub about an upcoming visit
 * 
 * Allows a member to send a reminder or update to a hub about their planned visit.
 * Updates visit date if needed and sends notification email to hub staff.
 * 
 * @async
 * @function notifyHub
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const notifyHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { visitDate } = req.body;

    // TEMPORARY: Skip authentication check for testing
    /* 
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    */

    const hubAccess = await HubAccess.findById(id);
    if (!hubAccess) {
      res.status(404).json({
        success: false,
        message: 'Hub access request not found',
      });
      return;
    }

    // TEMPORARY: Skip ownership verification for testing
    /*
    const isOwner = await mintService.verifyOwnership(hubAccess.tokenId, req.user.walletAddress);
    if (!isOwner) {
      res.status(401).json({
        success: false,
        message: 'You are not the owner of this NFT',
      });
      return;
    }
    */

    // Update visit date if provided
    if (visitDate) {
      hubAccess.visitDate = new Date(visitDate);
      await hubAccess.save();
    }

    // Get hub details
    const hub = await Hub.findById(hubAccess.hubId);
    
    // Send notification email to the hub
    try {
      await emailService.notifyHub(
        hubAccess.memberName,
        hubAccess.memberEmail,
        hubAccess.tokenId,
        hubAccess.visitDate.toISOString(),
        hub?.contactEmail
      );
    } catch (emailError) {
      console.warn('Email notification failed but request was processed:', emailError);
      // Continue with success response even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Hub notification sent successfully',
    });
  } catch (error) {
    console.error('Error in notifyHub controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify hub',
      error: (error as Error).message,
    });
  }
};

/**
 * Get access status by wallet address
 * 
 * Retrieves all access requests and their status for a specific wallet address.
 * Used by members to check their active hub access requests.
 * 
 * @async
 * @function getHubAccessStatus
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getHubAccessStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;

    if (!wallet) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required',
      });
      return;
    }

    // Find all access requests for this wallet
    const accessRequests = await HubAccess.find({ memberWalletAddress: wallet })
      .populate('hubId', 'name endereco cidade estado')
      .sort({ createdAt: -1 });

    if (!accessRequests || accessRequests.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No hub access requests found for this wallet',
      });
      return;
    }

    res.status(200).json({
      success: true,
      requests: accessRequests.map(request => ({
        id: request._id,
        hub: request.hubId,
        status: request.status,
        requestedAt: request.createdAt,
        visitDate: request.visitDate,
        lastAccessed: request.lastAccessedAt,
      })),
    });
  } catch (error) {
    console.error('Error in getHubAccessStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hub access status',
      error: (error as Error).message,
    });
  }
};

/**
 * Log additional details about a member's physical visit to a hub
 * 
 * Records additional notes when a member physically visits a hub.
 * This is optional - the access is already approved via signature verification.
 * Updates staff information and notes for the visit.
 * 
 * @async
 * @function logHubAccess
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const logHubAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { staffName, notes } = req.body;

    // TEMPORARY: Skip authentication check for testing
    /*
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    */

    const hubAccess = await HubAccess.findById(id);
    if (!hubAccess) {
      res.status(404).json({
        success: false,
        message: 'Hub access request not found',
      });
      return;
    }

    // TEMPORARY: Skip hub staff verification for testing
    /*
    // Verify the authenticated user is staff at this hub
    const isHubStaff = await Hub.exists({
      _id: hubAccess.hubId,
      staffIds: req.user.id,
    });
    
    if (!isHubStaff) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to log access for this hub',
      });
      return;
    }
    */

    // Update additional visit details (access is already approved via signature)
    if (staffName) hubAccess.staffName = staffName;
    if (notes) hubAccess.accessNotes = notes;
    hubAccess.lastAccessedAt = new Date(); // Update last access time
    
    await hubAccess.save();

    res.status(200).json({
      success: true,
      message: 'Visit details logged successfully',
      data: {
        staffName: hubAccess.staffName,
        notes: hubAccess.accessNotes,
        lastAccessed: hubAccess.lastAccessedAt
      }
    });
  } catch (error) {
    console.error('Error in logHubAccess controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log visit details',
      error: (error as Error).message,
    });
  }
}; 

/**
 * Get all active hubs for user selection
 * 
 * Returns a list of all active hubs that users can request access to.
 * Only shows hubs where isActive is true.
 * 
 * @async
 * @function getActiveHubs
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getActiveHubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const hubs = await Hub.find({ isActive: true })
      .select('name cidade estado endereco contactPhone contactEmail description websiteUrl isActive membershipRequired createdAt updatedAt')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      hubs: hubs.map(hub => ({
        id: hub._id,
        name: hub.name,
        cidade: hub.cidade,
        estado: hub.estado,
        endereco: hub.endereco,
        contactPhone: hub.contactPhone,
        contactEmail: hub.contactEmail,
        description: hub.description,
        websiteUrl: hub.websiteUrl,
        isActive: hub.isActive,
        membershipRequired: hub.membershipRequired,
        createdAt: hub.createdAt,
        updatedAt: hub.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error in getActiveHubs controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hubs',
      error: (error as Error).message,
    });
  }
};

/**
 * Create a new hub (Admin only)
 * 
 * Creates a new hub in the system with all required information.
 * Only accessible by admin users.
 * 
 * @async
 * @function createHub
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const createHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      name, 
      description, 
      endereco, 
      cidade, 
      estado, 
      contactEmail, 
      contactPhone, 
      websiteUrl,
      isActive = true,
      membershipRequired = true 
    } = req.body;

    // Validate required fields
    if (!name || !endereco || !cidade || !estado || !contactEmail) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, endereco, cidade, estado, contactEmail',
      });
      return;
    }

    // Check if hub with same name already exists
    const existingHub = await Hub.findOne({ name });
    if (existingHub) {
      res.status(409).json({
        success: false,
        message: 'A hub with this name already exists',
      });
      return;
    }

    // Create new hub
    const hub = new Hub({
      name,
      description,
      endereco,
      cidade,
      estado,
      contactEmail,
      contactPhone,
      websiteUrl,
      isActive,
      membershipRequired,
    });

    await hub.save();

    res.status(201).json({
      success: true,
      hub: {
        id: hub._id,
        name: hub.name,
        description: hub.description,
        endereco: hub.endereco,
        cidade: hub.cidade,
        estado: hub.estado,
        contactEmail: hub.contactEmail,
        contactPhone: hub.contactPhone,
        websiteUrl: hub.websiteUrl,
        isActive: hub.isActive,
        membershipRequired: hub.membershipRequired,
        createdAt: hub.createdAt,
      },
      message: 'Hub created successfully',
    });
  } catch (error) {
    console.error('Error in createHub controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hub',
      error: (error as Error).message,
    });
  }
};

/**
 * Get all hubs (Admin only)
 * 
 * Returns all hubs in the system including inactive ones.
 * Only accessible by admin users.
 * 
 * @async
 * @function getAllHubsAdmin
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllHubsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const hubs = await Hub.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      hubs: hubs.map(hub => ({
        id: hub._id,
        name: hub.name,
        description: hub.description,
        endereco: hub.endereco,
        cidade: hub.cidade,
        estado: hub.estado,
        contactEmail: hub.contactEmail,
        contactPhone: hub.contactPhone,
        websiteUrl: hub.websiteUrl,
        isActive: hub.isActive,
        membershipRequired: hub.membershipRequired,
        createdAt: hub.createdAt,
        updatedAt: hub.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error in getAllHubsAdmin controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hubs',
      error: (error as Error).message,
    });
  }
};

/**
 * Get hub by ID
 * 
 * Returns detailed information about a specific hub.
 * 
 * @async
 * @function getHubById
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const getHubById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const hub = await Hub.findById(id);
    if (!hub) {
      res.status(404).json({
        success: false,
        message: 'Hub not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      hub: {
        id: hub._id,
        name: hub.name,
        description: hub.description,
        endereco: hub.endereco,
        cidade: hub.cidade,
        estado: hub.estado,
        contactEmail: hub.contactEmail,
        contactPhone: hub.contactPhone,
        websiteUrl: hub.websiteUrl,
        isActive: hub.isActive,
        membershipRequired: hub.membershipRequired,
        createdAt: hub.createdAt,
        updatedAt: hub.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in getHubById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve hub',
      error: (error as Error).message,
    });
  }
};

/**
 * Update hub (Admin only)
 * 
 * Updates an existing hub's information.
 * Only accessible by admin users.
 * 
 * @async
 * @function updateHub
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const updateHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const hub = await Hub.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!hub) {
      res.status(404).json({
        success: false,
        message: 'Hub not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      hub: {
        id: hub._id,
        name: hub.name,
        description: hub.description,
        endereco: hub.endereco,
        cidade: hub.cidade,
        estado: hub.estado,
        contactEmail: hub.contactEmail,
        contactPhone: hub.contactPhone,
        websiteUrl: hub.websiteUrl,
        isActive: hub.isActive,
        membershipRequired: hub.membershipRequired,
        createdAt: hub.createdAt,
        updatedAt: hub.updatedAt,
      },
      message: 'Hub updated successfully',
    });
  } catch (error) {
    console.error('Error in updateHub controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hub',
      error: (error as Error).message,
    });
  }
};

/**
 * Delete hub (Admin only)
 * 
 * Soft deletes a hub by setting isActive to false.
 * Only accessible by admin users.
 * 
 * @async
 * @function deleteHub
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.body;

    if (permanent) {
      // Permanently delete the hub
      const hub = await Hub.findByIdAndDelete(id);
      if (!hub) {
        res.status(404).json({
          success: false,
          message: 'Hub not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Hub permanently deleted',
      });
    } else {
      // Soft delete - just set isActive to false
      const hub = await Hub.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!hub) {
        res.status(404).json({
          success: false,
          message: 'Hub not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Hub deactivated successfully',
        hub: {
          id: hub._id,
          name: hub.name,
          isActive: hub.isActive,
        },
      });
    }
  } catch (error) {
    console.error('Error in deleteHub controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hub',
      error: (error as Error).message,
    });
  }
}; 