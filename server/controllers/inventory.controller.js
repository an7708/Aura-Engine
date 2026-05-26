const Product = require('../models/Product.model');
const AppError = require('../utils/AppError');
const { productSchema, validateBusinessRules } = require('../validators/inventory.validator');

const getInventory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const category = req.query.category?.trim();
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const maxStock = parseInt(req.query.maxStock);
    const sortField = req.query.sortBy || 'productName';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      query.price = {};
      if (!isNaN(minPrice)) query.price.$gte = minPrice;
      if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
    }

    if (!isNaN(maxStock)) {
      query.stockQuantity = { $lte: maxStock };
    }

    const [totalRecords, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
      products,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [categoryStats, lowStockProducts, summaryData] = await Promise.all([

      Product.aggregate([
        {
          $group: {
            _id: '$category',
            totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
            productCount: { $sum: 1 },
            totalStock: { $sum: '$stockQuantity' },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalValue: { $round: ['$totalValue', 2] },
            productCount: 1,
            totalStock: 1,
          },
        },
        { $sort: { totalValue: -1 } },
      ]),

      Product.aggregate([
        { $match: { stockQuantity: { $gt: 0 } } },
        { $sort: { stockQuantity: 1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            productName: 1,
            sku: 1,
            stockQuantity: 1,
            reorderLevel: 1,
            category: 1,
            isCritical: { $lte: ['$stockQuantity', '$reorderLevel'] },
          },
        },
      ]),

      Product.aggregate([
        {
          $group: {
            _id: null,
            totalSKUs: { $sum: 1 },
            totalInventoryValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
            outOfStockItems: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
            lowStockItems: { $sum: { $cond: [{ $lte: ['$stockQuantity', '$reorderLevel'] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            totalSKUs: 1,
            totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
            outOfStockItems: 1,
            lowStockItems: 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        summary: summaryData[0] || {},
        categoryDistribution: categoryStats,
        lowStockAlert: lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
    }

    const businessErrors = validateBusinessRules(value);
    if (businessErrors.length > 0) {
      return res.status(400).json({ success: false, message: businessErrors.join(' ') });
    }

    const product = await Product.create(value);
    res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError(`SKU already exists. SKU must be unique.`, 400));
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(', ') });
    }

    const businessErrors = validateBusinessRules(value);
    if (businessErrors.length > 0) {
      return res.status(400).json({ success: false, message: businessErrors.join(' ') });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...value, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) return next(new AppError('Product not found', 404));

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(new AppError('Product not found', 404));
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, getAnalytics, createProduct, updateProduct, deleteProduct, getProductById };