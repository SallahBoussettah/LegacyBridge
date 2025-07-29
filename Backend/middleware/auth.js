import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const user = await User.findActiveById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

// Middleware to check if user has required role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Middleware to check if user owns the resource
export const requireOwnership = (Model, resourceIdParam = "id") => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      if (resource.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied - you do not own this resource",
        });
      }

      // Add resource to request object for use in the route handler
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization error",
      });
    }
  };
};
