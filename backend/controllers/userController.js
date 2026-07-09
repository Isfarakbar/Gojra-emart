const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const USER_PAGE_SIZE = 20;

const normalizeAddressPayload = (body) => ({
    label: (body.label || 'Home').trim(),
    street: (body.street || '').trim(),
    area: (body.area || '').trim(),
    city: (body.city || '').trim(),
    phone: (body.phone || '').trim(),
    isDefault: Boolean(body.isDefault),
});

const validateAddressPayload = (address) => {
    return address.street && address.area && address.city && address.phone;
};

const syncDefaultAddressString = (user) => {
    const defaultAddress = user.addresses.find(address => address.isDefault) || user.addresses[0];
    if (defaultAddress) {
        user.address = `${defaultAddress.street}, ${defaultAddress.area}, ${defaultAddress.city}`;
    }
};

// @desc    Get user profile (including wishlist)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('wishlist');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;

            if (req.body.password) {
                if (req.body.password.length < 6) {
                    return res.status(400).json({ message: 'Password must be at least 6 characters' });
                }
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                addresses: updatedUser.addresses,
                wishlist: updatedUser.wishlist,
                role: updatedUser.role,
                token: req.token // Preserve token if needed, or client handles it
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add user address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = normalizeAddressPayload(req.body);
        if (!validateAddressPayload(address)) {
            return res.status(400).json({ message: 'Street, area, city, and phone are required.' });
        }

        if (address.isDefault || user.addresses.length === 0) {
            user.addresses.forEach(existing => { existing.isDefault = false; });
            address.isDefault = true;
        }

        user.addresses.push(address);
        syncDefaultAddressString(user);
        await user.save();

        res.status(201).json({ addresses: user.addresses, address: user.address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const payload = normalizeAddressPayload({ ...address.toObject(), ...req.body });
        if (!validateAddressPayload(payload)) {
            return res.status(400).json({ message: 'Street, area, city, and phone are required.' });
        }

        if (payload.isDefault) {
            user.addresses.forEach(existing => { existing.isDefault = false; });
        }

        address.set(payload);
        if (!user.addresses.some(existing => existing.isDefault)) {
            address.isDefault = true;
        }
        syncDefaultAddressString(user);
        await user.save();

        res.json({ addresses: user.addresses, address: user.address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        const wasDefault = address.isDefault;
        address.deleteOne();
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }
        syncDefaultAddressString(user);
        await user.save();

        res.json({ addresses: user.addresses, address: user.address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set default user address
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = user.addresses.id(req.params.addressId);
        if (!address) return res.status(404).json({ message: 'Address not found' });

        user.addresses.forEach(existing => { existing.isDefault = false; });
        address.isDefault = true;
        syncDefaultAddressString(user);
        await user.save();

        res.json({ addresses: user.addresses, address: user.address });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle wishlist item
// @route   POST /api/users/wishlist/:id
// @access  Private
const toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isWishlisted = user.wishlist.includes(productId);

        if (isWishlisted) {
            // Remove
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
        } else {
            // Add
            user.wishlist.push(productId);
            await user.save();
            res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const search = String(req.query.search || '').trim();
        const role = ['user', 'admin'].includes(req.query.role) ? req.query.role : null;
        const status = ['Active', 'Suspended'].includes(req.query.status) ? req.query.status : null;
        const filter = {};

        if (role) filter.role = role;
        if (status) filter.accountStatus = status;
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { phone: { $regex: escaped, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-password -wishlist')
            .sort({ createdAt: -1 })
            .skip((page - 1) * USER_PAGE_SIZE)
            .limit(USER_PAGE_SIZE)
            .lean();
        const total = await User.countDocuments(filter);

        const userIds = users.map(user => user._id);
        const orderStats = await Order.aggregate([
            { $match: { user: { $in: userIds } } },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
                    },
                    totalSpent: {
                        $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalPrice', 0] },
                    },
                    lastOrderAt: { $max: '$createdAt' },
                },
            },
        ]);
        const statsByUser = new Map(orderStats.map(item => [item._id.toString(), item]));
        const usersWithStats = users.map(user => ({
            ...user,
            orderStats: statsByUser.get(user._id.toString()) || {
                totalOrders: 0,
                deliveredOrders: 0,
                totalSpent: 0,
                lastOrderAt: null,
            },
        }));

        res.json({ users: usersWithStats, page, limit: USER_PAGE_SIZE, total, pages: Math.ceil(total / USER_PAGE_SIZE) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAccountStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        if (!['Active', 'Suspended'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Active or Suspended.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts cannot be suspended here.' });
        }
        if (status === 'Suspended' && !String(reason || '').trim()) {
            return res.status(400).json({ message: 'A suspension reason is required.' });
        }

        user.accountStatus = status;
        user.suspendedReason = status === 'Suspended' ? String(reason).trim().slice(0, 300) : '';
        user.suspendedAt = status === 'Suspended' ? new Date() : undefined;
        if (status === 'Suspended') user.fcmToken = null;
        await user.save();

        res.json({
            message: status === 'Suspended' ? 'Customer suspended.' : 'Customer reactivated.',
            user: {
                _id: user._id,
                accountStatus: user.accountStatus,
                suspendedReason: user.suspendedReason,
                suspendedAt: user.suspendedAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update FCM Token
// @route   PUT /api/users/fcm-token
// @access  Private
const updateFCMToken = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.fcmToken = req.body.fcmToken;
            await user.save();
            res.json({ message: 'FCM Token updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    toggleWishlist,
    getAllUsers,
    updateFCMToken,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    updateAccountStatus
};

