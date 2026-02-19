/**
 * User Model
 * Defines user structure with roles (CAREGIVER, ELDER)
 */

class User {
    constructor(data = {}) {
        this.uid = data.uid || this.generateUID();
        this.role = data.role || 'ELDER'; // ELDER or CAREGIVER
        this.name = data.name || `User ${this.uid.substring(0, 6)}`;
        this.email = data.email || null;
        this.phone = data.phone || null;
        this.dateOfBirth = data.dateOfBirth || null;
        this.gender = data.gender || null;
        
        // For ELDER role
        this.caregiverUIDs = data.caregiverUIDs || []; // Array of caregiver UIDs assigned to this elder
        
        // For CAREGIVER role
        this.elderUIDs = data.elderUIDs || []; // Array of elder UIDs this caregiver monitors
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
    }

    /**
     * Generate unique user ID
     */
    generateUID() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `user_${timestamp}${random}`;
    }

    /**
     * Check if user is an elder
     */
    isElder() {
        return this.role === 'ELDER';
    }

    /**
     * Check if user is a caregiver
     */
    isCaregiver() {
        return this.role === 'CAREGIVER';
    }

    /**
     * Add caregiver to elder
     */
    addCaregiver(caregiverUID) {
        if (this.isElder() && !this.caregiverUIDs.includes(caregiverUID)) {
            this.caregiverUIDs.push(caregiverUID);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Add elder to caregiver's monitoring list
     */
    addElder(elderUID) {
        if (this.isCaregiver() && !this.elderUIDs.includes(elderUID)) {
            this.elderUIDs.push(elderUID);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            uid: this.uid,
            role: this.role,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            gender: this.gender,
            caregiverUIDs: this.caregiverUIDs,
            elderUIDs: this.elderUIDs,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive,
        };
    }
}

module.exports = User;
