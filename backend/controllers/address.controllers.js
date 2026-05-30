// backend\controllers\address.controllers.js

import Address from "../models/address.model.js";
import User from "../models/user.model.js";

// Add new address
export const addAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            label,
            customLabel,
            fullAddress,
            landmark,
            city,
            state,
            pincode,
            country,
            latitude,
            longitude,
            placeId,
            isDefault,
            phoneNumber,
            receiverName,
            instructions
        } = req.body;

        // Validation
        if (!fullAddress || !city || !state || !pincode) {
            return res.status(400).json({ error: "Full address, city, state, and pincode are required" });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Location coordinates are required" });
        }

        if (!receiverName) {
            return res.status(400).json({ error: "Receiver name is required" });
        }

        if (!phoneNumber) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        if (!/^\d{10,13}$/.test(phoneNumber)) {
            return res.status(400).json({ error: "Phone number must be 10-13 digits" });
        }

        if (!/^\d{5,6}$/.test(pincode)) {
            return res.status(400).json({ error: "Pincode must be 5 or 6 digits" });
        }

        // Important: If this address is default, remove default from all other addresses
        if (isDefault) {
            await Address.updateMany(
                { user: userId },
                { isDefault: false }
            );
        }

        // Create address
        const address = await Address.create({
            user: userId,
            label: label || "Home",
            customLabel: label === "Other" ? customLabel : null,
            fullAddress,
            landmark: landmark || "",
            city,
            state,
            pincode,
            country: country || "Pakistan",
            latitude,
            longitude,
            placeId: placeId || null,
            isDefault: isDefault || false,
            phoneNumber,
            receiverName,
            instructions: instructions || ""
        });

        // If this is the first address, make it default
        const userAddresses = await Address.find({ user: userId });
        if (userAddresses.length === 1) {
            address.isDefault = true;
            await address.save();
        }

        // Add address to user's addresses array
        await User.findByIdAndUpdate(userId, {
            $push: { addresses: address._id }
        });

        // Populate user info for response
        const populatedAddress = await Address.findById(address._id)
            .populate('user', 'fullName email');

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: populatedAddress
        });

    } catch (error) {
        console.error("Add address error:", error);
        return res.status(500).json({
            error: "Failed to add address",
            details: error.message
        });
    }
};

// Get all addresses for logged-in user
export const getAddresses = async (req, res) => {
    try {
        const userId = req.userId;

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            addresses,
            count: addresses.length
        });

    } catch (error) {
        console.error("Get addresses error:", error);
        return res.status(500).json({
            error: "Failed to fetch addresses",
            details: error.message
        });
    }
};

// Get single address by ID
export const getAddressById = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const address = await Address.findOne({ _id: id, user: userId });

        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        return res.status(200).json({
            success: true,
            address
        });

    } catch (error) {
        console.error("Get address error:", error);
        return res.status(500).json({
            error: "Failed to fetch address",
            details: error.message
        });
    }
};

// Update address
export const updateAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const {
            label,
            customLabel,
            fullAddress,
            landmark,
            city,
            state,
            pincode,
            country,
            latitude,
            longitude,
            placeId,
            isDefault,
            phoneNumber,
            receiverName,
            instructions
        } = req.body;

        const address = await Address.findOne({ _id: id, user: userId });

        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        if (isDefault === true) {
            await Address.updateMany(
                { user: userId, _id: { $ne: address._id } },
                { isDefault: false }
            );
        }

        if (label) address.label = label;
        if (label === "Other" && customLabel) address.customLabel = customLabel;
        if (fullAddress) address.fullAddress = fullAddress;
        if (landmark !== undefined) address.landmark = landmark;
        if (city) address.city = city;
        if (state) address.state = state;
        
        if (pincode) {
            if (!/^\d{5,6}$/.test(pincode)) {
                return res.status(400).json({ error: "Pincode must be 5 or 6 digits" });
            }
            address.pincode = pincode;
        }
        
        if (country) address.country = country;
        if (latitude) address.latitude = latitude;
        if (longitude) address.longitude = longitude;
        if (placeId !== undefined) address.placeId = placeId;
        
        if (phoneNumber !== undefined) {
            if (phoneNumber && !/^\d{10,13}$/.test(phoneNumber)) {
                return res.status(400).json({ error: "Phone number must be 10-13 digits" });
            }
            address.phoneNumber = phoneNumber;
        }
        
        if (receiverName !== undefined) address.receiverName = receiverName;
        if (instructions !== undefined) address.instructions = instructions;
        
        if (isDefault !== undefined) {
            address.isDefault = isDefault;
        }

        await address.save();

        const updatedAddress = await Address.findById(address._id)
            .populate('user', 'fullName email');

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress
        });

    } catch (error) {
        console.error("Update address error:", error);
        return res.status(500).json({
            error: "Failed to update address",
            details: error.message
        });
    }
};

// Delete address
export const deleteAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const address = await Address.findOne({ _id: id, user: userId });

        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        const wasDefault = address.isDefault;

        // Delete address
        await Address.deleteOne({ _id: id });

        // Remove address reference from user
        await User.findByIdAndUpdate(userId, {
            $pull: { addresses: id }
        });

        // If deleted address was default and there are other addresses, make another one default
        if (wasDefault) {
            const nextAddress = await Address.findOne({ user: userId });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error("Delete address error:", error);
        return res.status(500).json({
            error: "Failed to delete address",
            details: error.message
        });
    }
};

// Set default address
export const setDefaultAddress = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const address = await Address.findOne({ _id: id, user: userId });

        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Set all addresses to false
        await Address.updateMany({ user: userId }, { isDefault: false });

        // Set this address as default
        address.isDefault = true;
        await address.save();

        return res.status(200).json({
            success: true,
            message: "Default address set successfully",
            address
        });

    } catch (error) {
        console.error("Set default address error:", error);
        return res.status(500).json({
            error: "Failed to set default address",
            details: error.message
        });
    }
};