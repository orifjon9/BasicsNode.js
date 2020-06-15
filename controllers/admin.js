const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator/check');
const file = require('../util/file');

const Product = require('../models/mongodb/product');

exports.getProducts = (req, res, next) => {
    Product
        .find()
        .then(products => {
            res.render('admin/products/list', {
                prods: products,
                pageTitle: 'Admin Products',
                path: 'admin-products'
            });
        });
};

exports.getAddProduct = (req, res, next) => {
    res.render('admin/products/add', {
        pageTitle: 'Add Product',
        path: 'add-product',
        hasError: false,
        validationErrors: []
    });
};

exports.getEditProduct = (req, res, next) => {
    const productId = req.params.productId;
    if (productId) {
        Product.findById(productId)
            .then(product => {
                res.render('admin/products/edit', {
                    pageTitle: 'Update Product',
                    path: 'add-product',
                    product: product,
                    hasError: false,
                    validationErrors: []
                });
            }).catch(err => {
                redirectToPageNotFound(res);
            });
    } else {
        redirectToPageNotFound(res);
    }
};

exports.postProduct = (req, res, next) => {
    const { title, price, description } = req.body;
    const image = req.file;
    
    const product = new Product(
        {
            title: title,
            description: description,
            price: price,
            imageUrl: !image ? '' : image.path,
            userId: req.session.user
        }
    );

    const errors = validationResult(req);
    if (!image || !errors.isEmpty()) {
        return res.status(422).render('admin/products/add', {
            pageTitle: 'Add Product',
            path: 'add-product',
            hasError: true,
            product: product,
            validationErrors: !image ? [{ msg: 'Attached file is not an image' }] : errors.array()
        });
    }

    product
        .save()
        .then(() => {
            res.redirect('/');
        }).catch(err => {
            console.log(err);
            res.redirect('/500');
        });
};

exports.putProduct = (req, res, next) => {
    const { title, price, description } = req.body;
    const image = req.file;
    console.log(image);
    const productId = req.params.productId;

    Product.findOne({ _id: new ObjectId(productId), userId: req.session.user._id })
        .then(product => {
            if (product) {
                product.title = title;
                product.description = description;
                product.price = price;
                if (image) {
                    file.delete(product.imageUrl).then();
                    product.imageUrl =  '/' + image.path.replace('\\', '/');
                }
                return product.save();
            }
        }
        ).then(() => {
            res.redirect(`/admin/products`);
        }).catch(err => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findOne({ _id: new ObjectId(productId), userId: req.session.user._id })
        .then(product => {
            if (product) {
                return file.delete(product.imageUrl).then(() => product.remove());
            }
        })
        .then(() => {
            res.redirect(`/admin/products`);
        })
        .catch(err => console.log(err));
};

const redirectToPageNotFound = (res) => res.redirect('/404');