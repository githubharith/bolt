import express from 'express';
import User from '../models/User.js';
import File from '../models/File.js';
import Link from '../models/Link.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (superuser only)
router.get('/', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const fileCount = await File.countDocuments({ 
          uploadedBy: user._id, 
          isActive: true 
        });
        const linkCount = await Link.countDocuments({ 
          createdBy: user._id, 
          isActive: true 
        });
        
        return {
          ...user.toJSON(),
          stats: {
            fileCount,
            linkCount,
            lastActivity: user.activityLogs?.[user.activityLogs.length - 1]?.timestamp || user.lastLogin
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Get user details (superuser only)
router.get('/:id', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's files and links
    const files = await File.find({ 
      uploadedBy: user._id, 
      isActive: true 
    }).select('customFilename originalFilename size createdAt');

    const links = await Link.find({ 
      createdBy: user._id 
    }).populate('file', 'customFilename').select('customName isActive createdAt currentAccessCount');

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        files,
        links
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user details'
    });
  }
});

// Delete user and all associated data (superuser only)
router.delete('/:id', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete user's files and links
    await File.updateMany(
      { uploadedBy: userId },
      { isActive: false }
    );

    await Link.updateMany(
      { createdBy: userId },
      { isActive: false }
    );

    // Deactivate user account
    user.isActive = false;
    await user.save();

    await req.user.addActivityLog('user_delete', `Deleted user: ${user.username}`, req);

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// Update user role (superuser only)
router.patch('/:id/role', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'superuser'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await req.user.addActivityLog('user_role_update', `Changed ${user.username} role to ${role}`, req);

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

// Activate or deactivate a user (superuser only)
router.patch('/:id/status', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const action = isActive ? 'user_activated' : 'user_deactivated';
    const message = `User ${user.username} has been ${isActive ? 'activated' : 'deactivated'}`;
    await req.user.addActivityLog(action, message, req);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// Get user activity logs (superuser only)
router.get('/:id/activity', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const user = await User.findById(req.params.id).select('activityLogs username');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Paginate activity logs
    const totalLogs = user.activityLogs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedLogs = user.activityLogs
      .slice()
      .reverse() // Most recent first
      .slice(startIndex, endIndex);

    res.json({
      success: true,
      username: user.username,
      activityLogs: paginatedLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalLogs / limit),
        total: totalLogs,
        hasNext: endIndex < totalLogs,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity logs'
    });
  }
});

// Search users for link access control
router.get('/search/for-links', authenticate, async (req, res) => {
  try {
    const { q = '' } = req.query;
    
    if (q.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username email')
    .limit(10);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

export default router;