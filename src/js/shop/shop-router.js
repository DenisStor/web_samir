/**
 * Shop Router Module
 * Роутинг магазина
 * @module ShopRouter
 */
var ShopRouter = (function () {
    'use strict';

    /**
     * Обработка текущего маршрута
     */
    function handleRoute() {
        var hash = window.location.hash;

        if (hash.indexOf('#product-') === 0) {
            var productId = hash.replace('#product-', '');
            showProductPage(productId);
        } else {
            showCatalogView();
        }
    }

    /**
     * Переход в каталог
     */
    function showCatalog() {
        window.location.hash = '';
    }

    /**
     * Показать вид каталога
     */
    function showCatalogView() {
        var elements = ShopState.getElements();
        elements.catalog.style.display = 'block';
        elements.productPage.style.display = 'none';
        document.title = "Магазин | Say's Barbers";
        window.scrollTo(0, 0);
    }

    /**
     * Показать страницу товара
     * @param {string} productId - ID товара
     */
    function showProductPage(productId) {
        var products = ShopState.getProducts();
        var product = null;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === productId) {
                product = products[i];
                break;
            }
        }

        if (!product) {
            fetchProduct(productId);
            return;
        }

        var elements = ShopState.getElements();
        elements.catalog.style.display = 'none';
        elements.productPage.style.display = 'block';

        ShopRenderer.renderProductDetail(product);
        document.title = product.name + " | Say's Barbers";
        window.scrollTo(0, 0);
    }

    /**
     * Загрузка товара по ID
     * @param {string} productId - ID товара
     */
    function fetchProduct(productId) {
        fetch(ShopState.API_BASE + '/products/' + productId)
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Product not found');
            })
            .then(function (product) {
                var elements = ShopState.getElements();
                elements.catalog.style.display = 'none';
                elements.productPage.style.display = 'block';
                ShopRenderer.renderProductDetail(product);
                document.title = product.name + " | Say's Barbers";
                window.scrollTo(0, 0);
            })
            .catch(function (error) {
                console.error('Error fetching product:', error);
                showCatalog();
            });
    }

    return {
        handleRoute: handleRoute,
        showCatalog: showCatalog,
        showCatalogView: showCatalogView,
        showProductPage: showProductPage,
        fetchProduct: fetchProduct
    };
})();
