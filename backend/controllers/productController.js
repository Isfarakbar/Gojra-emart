const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const PRODUCT_PAGE_SIZE = 20;

const buildProductQuery = (req, includeInactive = false) => {
    const keyword = req.query.keyword ? { $text: { $search: req.query.keyword } } : {};
    const category = req.query.category ? { category: req.query.category } : {};
    const active = includeInactive ? {} : { isActive: true };
    return { ...keyword, ...category, ...active };
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const query = buildProductQuery(req);

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
    const { name, price, oldPrice, description, image, imageUrl, category, stock, variants, isFeatured } = req.body;

    try {
        const product = new Product({
            name,
            price,
            oldPrice,
            description,
            imageUrl: image ?? imageUrl,
            category,
            stock,
            variants,
            isFeatured
        });

        const createdProduct = await product.save();
        const initialMovements = [];
        if (createdProduct.stock > 0) {
            initialMovements.push({
                product: createdProduct._id,
                type: 'Restock',
                quantityChange: createdProduct.stock,
                previousStock: 0,
                newStock: createdProduct.stock,
                reason: 'Initial product stock',
                performedBy: req.user._id,
            });
        }
        for (const variant of createdProduct.variants || []) {
            if (variant.stock > 0) {
                initialMovements.push({
                    product: createdProduct._id,
                    variant: variant.unit,
                    type: 'Restock',
                    quantityChange: variant.stock,
                    previousStock: 0,
                    newStock: variant.stock,
                    reason: 'Initial variant stock',
                    performedBy: req.user._id,
                });
            }
        }
        if (initialMovements.length > 0) await InventoryMovement.insertMany(initialMovements);
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const { name, price, oldPrice, description, image, imageUrl, category, stock, variants, isFeatured, isActive } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const previousStock = product.stock;
            const previousVariantStock = new Map(
                (product.variants || []).map(variant => [variant.unit, variant.stock])
            );
            product.name = name ?? product.name;
            product.price = price ?? product.price;
            product.oldPrice = oldPrice ?? product.oldPrice;
            product.description = description ?? product.description;
            product.imageUrl = image ?? imageUrl ?? product.imageUrl;
            product.category = category ?? product.category;
            product.stock = stock ?? product.stock;
            product.variants = variants ?? product.variants;
            product.isFeatured = isFeatured ?? product.isFeatured;
            product.isActive = isActive ?? product.isActive;

            const updatedProduct = await product.save();
            const stockMovements = [];
            if (updatedProduct.stock !== previousStock) {
                stockMovements.push({
                    product: updatedProduct._id,
                    type: 'Correction',
                    quantityChange: updatedProduct.stock - previousStock,
                    previousStock,
                    newStock: updatedProduct.stock,
                    reason: 'Stock changed from product editor',
                    performedBy: req.user._id,
                });
            }
            for (const variant of updatedProduct.variants || []) {
                const oldStock = previousVariantStock.get(variant.unit) ?? 0;
                if (variant.stock !== oldStock) {
                    stockMovements.push({
                        product: updatedProduct._id,
                        variant: variant.unit,
                        type: 'Correction',
                        quantityChange: variant.stock - oldStock,
                        previousStock: oldStock,
                        newStock: variant.stock,
                        reason: 'Variant stock changed from product editor',
                        performedBy: req.user._id,
                    });
                }
            }
            if (stockMovements.length > 0) await InventoryMovement.insertMany(stockMovements);
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all products for admin, including hidden products
// @route   GET /api/products/admin
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const query = buildProductQuery(req, true);

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

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product && product.isActive) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search products with live suggestions
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length < 2) {
            return res.json([]);
        }

        const products = await Product.find(
            { $text: { $search: query }, isActive: true },
            { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(6)
        .select('_id name imageUrl variants category price')
        .populate('category', 'name')
        .lean();

        const formattedProducts = products.map(product => {
            return {
                _id: product._id,
                name: product.name,
                images: product.imageUrl ? [product.imageUrl] : [],
                variants: product.variants && product.variants.length > 0 
                    ? [{ price: product.variants[0].price }] 
                    : [{ price: product.price }],
                category: product.category
            };
        });

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get low-stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res) => {
    try {
        const threshold = Math.max(Number(req.query.threshold) || 5, 0);
        const products = await Product.find({
            isActive: true,
            $or: [
                { stock: { $lte: threshold } },
                { variants: { $elemMatch: { stock: { $lte: threshold } } } }
            ]
        })
            .populate('category', 'name')
            .sort({ stock: 1, name: 1 })
            .limit(50)
            .lean();

        const formattedProducts = products.map(product => ({
            ...product,
            lowStockVariants: (product.variants || []).filter(variant => variant.stock <= threshold)
        }));

        res.json({ products: formattedProducts, threshold });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getAdminProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getLowStockProducts
};
