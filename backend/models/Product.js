const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: { type: String, unique: true },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: { type: Number, min: 0 },
  images: [{
    public_id: String,
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  video: {
    public_id: String,
    url: String,
    thumbnail: String,
    duration: Number
  },
  hasVideo: { type: Boolean, default: false },
  quantity: { type: Number, default: 1, min: 0 },
  condition: {
    type: String,
    enum: ['new', 'used-like-new', 'used-good', 'used-fair'],
    default: 'new'
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: String,
    state: {
      type: String,
      enum: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Other']
    }
  },
  shipping: {
    isFreeShipping: { type: Boolean, default: false },
    shippingCost: { type: Number, default: 0 }
  },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'active', 'sold', 'inactive'],
    default: 'active'
  },
  isNegotiable: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true }) + '-' + Date.now().toString(36);
  }
  this.hasVideo = !!this.video?.url;
  next();
});

module.exports = mongoose.model('Product', productSchema);
