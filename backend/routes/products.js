const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, state, hasVideo, search } = req.query;
    
    let query = { status: 'active' };
    
    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (hasVideo === 'true') query.hasVideo = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    const products = await Product.find(query)
      .populate('seller', 'firstName lastName storeName rating isSellerVerified')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
       products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('seller', 'firstName lastName storeName avatar rating isSellerVerified location');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.views += 1;
    await product.save();
    
    res.json({
      success: true,
       product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product (Seller only)
router.post('/', protect, restrictTo('seller', 'both'), upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, quantity, condition, location, isNegotiable } = req.body;
    
    const images = req.files?.map(file => ({
      public_id: file.public_id,
      url: file.secure_url,
      isPrimary: false
    })) || [];
    
    if (images.length > 0) {
      images[0].isPrimary = true;
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      category,
      quantity,
      condition,
      seller: req.user._id,
      location: {
        city: location?.city || req.user.location,
        state: location?.state || 'Lagos'
      },
      isNegotiable: isNegotiable === 'true',
      images,
      status: 'active'
    });
    
    await product.populate('seller', 'firstName lastName storeName');
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
       product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.patch('/:id', protect, restrictTo('seller', 'both'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete('/:id', protect, restrictTo('seller', 'both'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
