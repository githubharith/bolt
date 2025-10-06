import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  userAgent: String,
  accessedAt: {
    type: Date,
    default: Date.now
  }
});

const linkSchema = new mongoose.Schema({
  linkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customName: {
    type: String,
    required: [true, 'Custom name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Custom name cannot exceed 100 characters']
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Expiration configuration
  expirationType: {
    type: String,
    enum: ['none', 'duration', 'date'],
    default: 'none'
  },
  expirationValue: {
    type: Number, // seconds for duration, timestamp for date
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Access limits
  accessLimit: {
    type: Number,
    default: null // null means unlimited
  },
  currentAccessCount: {
    type: Number,
    default: 0
  },
  
  // Verification settings
  verificationType: {
    type: String,
    enum: ['none', 'password', 'username'],
    default: 'none'
  },
  verificationValue: {
    type: String,
    default: null
  },
  
  // Access scope
  accessScope: {
    type: String,
    enum: ['public', 'users', 'selected'],
    default: 'public'
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Access Type
  accessType: {
    type: String,
    enum: ['info', 'view', 'download'],
    default: 'info'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Access logs
  accessLogs: [accessLogSchema],
  
  // Metadata
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  favorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
linkSchema.index({ createdBy: 1, createdAt: -1 });
linkSchema.index({ file: 1 });
linkSchema.index({ expiresAt: 1 });
linkSchema.index({ isActive: 1 });

// Pre-save middleware to calculate expiration
linkSchema.pre('save', function(next) {
  if (this.expirationType === 'duration' && this.expirationValue) {
    this.expiresAt = new Date(Date.now() + (this.expirationValue * 1000));
  } else if (this.expirationType === 'date' && this.expirationValue) {
    this.expiresAt = new Date(this.expirationValue);
  } else if (this.expirationType === 'none') {
    this.expiresAt = null;
  }
  next();
});

// Method to check if link is expired
linkSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if access limit reached
linkSchema.methods.isAccessLimitReached = function() {
  if (!this.accessLimit) return false;
  return this.currentAccessCount >= this.accessLimit;
};

// Method to add access log
linkSchema.methods.addAccessLog = function(user = null, req = null) {
  const logEntry = {
    user: user?._id,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get('User-Agent')
  };
  
  this.accessLogs.push(logEntry);
  this.currentAccessCount += 1;
  
  // Keep only last 1000 access logs
  if (this.accessLogs.length > 1000) {
    this.accessLogs = this.accessLogs.slice(-1000);
  }
  
  return this.save();
};

export default mongoose.model('Link', linkSchema);