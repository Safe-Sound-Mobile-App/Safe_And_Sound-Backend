/**
 * User Controller
 * Handles user management (caregivers and elders)
 */

const dataStore = require('../services/dataStore');
const User = require('../models/User');

/**
 * Create a new user (elder or caregiver)
 * POST /api/users
 */
exports.createUser = (req, res) => {
    try {
        const userData = req.body;
        const user = new User(userData);
        dataStore.saveUser(user);

        console.log(`\n✅ Created ${user.role}: ${user.name} (${user.uid})`);

        res.status(201).json({
            success: true,
            message: `${user.role} created successfully`,
            data: user.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            message: error.message,
        });
    }
};

/**
 * Get user by UID
 * GET /api/users/:uid
 */
exports.getUser = (req, res) => {
    try {
        const { uid } = req.params;
        const user = dataStore.getUser(uid);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            data: user.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error getting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
};

/**
 * Get all users
 * GET /api/users
 */
exports.getAllUsers = (req, res) => {
    try {
        const { role } = req.query;
        
        let users;
        if (role === 'ELDER') {
            users = dataStore.getAllElders();
        } else if (role === 'CAREGIVER') {
            users = dataStore.getAllCaregivers();
        } else {
            users = dataStore.getAllUsers();
        }

        res.json({
            success: true,
            count: users.length,
            data: users.map(u => u.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error getting users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
        });
    }
};

/**
 * Get all elders
 * GET /api/users/elders
 */
exports.getAllElders = (req, res) => {
    try {
        const elders = dataStore.getAllElders();
        res.json({
            success: true,
            count: elders.length,
            data: elders.map(e => e.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error getting elders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get elders',
        });
    }
};

/**
 * Get all caregivers
 * GET /api/users/caregivers
 */
exports.getAllCaregivers = (req, res) => {
    try {
        const caregivers = dataStore.getAllCaregivers();
        res.json({
            success: true,
            count: caregivers.length,
            data: caregivers.map(c => c.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error getting caregivers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get caregivers',
        });
    }
};

/**
 * Update user
 * PUT /api/users/:uid
 */
exports.updateUser = (req, res) => {
    try {
        const { uid } = req.params;
        const user = dataStore.getUser(uid);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Update fields
        Object.assign(user, req.body);
        user.updatedAt = new Date().toISOString();
        dataStore.saveUser(user);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user.toJSON(),
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
};

/**
 * Delete user
 * DELETE /api/users/:uid
 */
exports.deleteUser = (req, res) => {
    try {
        const { uid } = req.params;
        const user = dataStore.getUser(uid);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        dataStore.deleteUser(uid);

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
        });
    }
};

/**
 * Assign caregiver to elder
 * POST /api/users/elder/:elderUID/assign-caregiver
 */
exports.assignCaregiver = (req, res) => {
    try {
        const { elderUID } = req.params;
        const { caregiverUID } = req.body;

        const elder = dataStore.getUser(elderUID);
        const caregiver = dataStore.getUser(caregiverUID);

        if (!elder || !elder.isElder()) {
            return res.status(404).json({
                success: false,
                error: 'Elder not found',
            });
        }

        if (!caregiver || !caregiver.isCaregiver()) {
            return res.status(404).json({
                success: false,
                error: 'Caregiver not found',
            });
        }

        elder.addCaregiver(caregiverUID);
        caregiver.addElder(elderUID);

        dataStore.saveUser(elder);
        dataStore.saveUser(caregiver);

        console.log(`\n👥 Assigned caregiver ${caregiver.name} to elder ${elder.name}`);

        res.json({
            success: true,
            message: 'Caregiver assigned successfully',
            data: {
                elder: elder.toJSON(),
                caregiver: caregiver.toJSON(),
            },
        });
    } catch (error) {
        console.error('❌ Error assigning caregiver:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign caregiver',
        });
    }
};

/**
 * Get elders for a caregiver
 * GET /api/users/caregiver/:caregiverUID/elders
 */
exports.getEldersForCaregiver = (req, res) => {
    try {
        const { caregiverUID } = req.params;
        const elders = dataStore.getEldersForCaregiver(caregiverUID);

        res.json({
            success: true,
            count: elders.length,
            data: elders.map(e => e.toJSON()),
        });
    } catch (error) {
        console.error('❌ Error getting elders for caregiver:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get elders',
        });
    }
};

module.exports = exports;
