const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAction } = require('../utils/logger');

// Token helpers
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'super_secret_access_token_key_12345',
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_67890',
    { expiresIn: '7d' }
  );
};

/**
 * Register User
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check existing
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Set role carefully (default to user unless admin creates or explicitly requested, but for QA we can accept it or limit)
    // In a production app, we would restrict setting 'admin' or 'manager' via registration,
    // but since this is a local project for testing, we can allow passing role or default to 'user'.
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'user',
    });

    await newUser.save();

    // Create tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Logging
    await logAction(
      newUser._id,
      'REGISTER',
      'User',
      { name: newUser.name, email: newUser.email, role: newUser.role },
      req.ip
    );

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
        },
        accessToken,
        refreshToken,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Login User
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials',
      });
    }

    // Create tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Logging
    await logAction(user._id, 'LOGIN', 'User', { email: user.email }, req.ip);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      },
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate user',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Token Refresh Endpoint
 */
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_67890');
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token user session',
        });
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
};

/**
 * Google OAuth Login Mock/Endpoint
 * Decodes or verifies Google credentials and registers/logs in the user.
 */
const googleLogin = async (req, res) => {
  try {
    const { token, email, name, googleId, avatar } = req.body;

    // In a fully production app, we would verify the google ID token using google-auth-library.
    // For this dashboard project, we allow direct submission of decoded Google OAuth payload.
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Google login payload must contain email and name',
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if they don't exist
      user = new User({
        name,
        email,
        googleId: googleId || `google_${Date.now()}`,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        role: 'user', // Defaults to standard user
      });
      await user.save();
      await logAction(user._id, 'GOOGLE_REGISTER', 'User', { email: user.email }, req.ip);
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId || `google_${Date.now()}`;
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
      await logAction(user._id, 'GOOGLE_LOGIN', 'User', { email: user.email }, req.ip);
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      },
      message: 'Logged in via Google successfully',
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google Authentication failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Get current user profile details
 */
const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
      },
    },
    message: 'User profile fetched successfully',
  });
};

/**
 * List active team members for task assignment (all authenticated users)
 */
const getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({ isActive: true })
      .select('_id name email role avatar')
      .sort({ name: 1 });

    return res.json({
      success: true,
      data: members,
      message: 'Team members retrieved successfully',
    });
  } catch (error) {
    console.error('getTeamMembers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  googleLogin,
  getMe,
  getTeamMembers,
};
