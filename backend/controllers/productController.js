const Product = require('../models/Product');
const PRODUCT_PAGE_SIZE = 20;

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const keyword = req.query.keyword ? { $text: { $search: req.query.keyword } } : {};
        const category = req.query.category ? { category: req.query.category } : {};
        const query = { ...keyword, ...category };

        const products = await Product.find(query)
            .populate('category', 'name image')
            .sort(req.query.keyword ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip((page - 1) * PRODUCT_PAGE_SIZE)
            .limit(PRODUCT_PAGE_SIZE);
        const total = await Product.countDocuments(query);

        res.json({ products, page, limit: PRODUCT_PAGE_SIZE, total, pages: Math.ceil(total / PRODUCT_PAGE_SIZE) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    const { name, price, description, image, category, stock, variants } = req.body;

    try {
        const product = new Product({
            name,
            price,
            description,
            imageUrl: image,
            category,
            stock,
            variants
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const { name, price, description, image, category, stock, variants } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name ?? product.name;
            product.price = price ?? product.price;
            product.description = description ?? product.description;
            product.imageUrl = image ?? product.imageUrl;
            product.category = category ?? product.category;
            product.stock = stock ?? product.stock;
            product.variants = variants ?? product.variants;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
