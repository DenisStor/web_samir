/**
 * Product Form
 * Форма добавления/редактирования товара
 */

var AdminProductForm = (function() {
    'use strict';

    var uploadedImages = [];

    function show(product) {
        AdminState.editingItem = product || null;
        uploadedImages = product && product.images ? product.images.slice() : [];

        var title = product ? 'Редактировать товар' : 'Добавить товар';

        var categoriesOptions = AdminState.shopCategories.map(function(cat) {
            var selected = product && product.categoryId === cat.id ? ' selected' : '';
            return '<option value="' + window.escapeHtml(cat.id) + '"' + selected + '>' +
                window.escapeHtml(cat.name) + '</option>';
        }).join('');

        var html = '<form id="productForm" class="admin-form">' +
            '<div class="form-group">' +
                '<label class="form-label">Изображения</label>' +
                '<div class="images-upload-area" id="imagesUploadArea">' +
                    '<div class="images-grid" id="imagesGrid"></div>' +
                    '<label class="image-upload-btn">' +
                        '<input type="file" accept="image/*" multiple id="productImagesInput">' +
                        SharedIcons.get('plus') +
                        '<span>Добавить</span>' +
                    '</label>' +
                '</div>' +
                '<p class="form-hint">Первое изображение будет главным. Перетащите для изменения порядка.</p>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Название *</label>' +
                '<input type="text" class="form-input" id="productName" ' +
                    'value="' + window.escapeHtml(product && product.name || '') + '" ' +
                    'placeholder="Помада для укладки" required>' +
            '</div>' +
            '<div class="form-row form-row-2">' +
                '<div class="form-group">' +
                    '<label class="form-label">Категория *</label>' +
                    '<select class="form-select" id="productCategory" required>' +
                        '<option value="">Выберите категорию</option>' +
                        categoriesOptions +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Цена (₽) *</label>' +
                    '<input type="number" class="form-input" id="productPrice" ' +
                        'value="' + (product && product.price || '') + '" ' +
                        'placeholder="1500" min="0" required>' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Описание</label>' +
                '<textarea class="form-textarea" id="productDescription" rows="5" ' +
                    'placeholder="Подробное описание товара...">' +
                    window.escapeHtml(product && product.description || '') +
                '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Статус</label>' +
                '<select class="form-select" id="productStatus">' +
                    '<option value="active"' + (product && product.status === 'active' ? ' selected' : '') + '>Активен</option>' +
                    '<option value="draft"' + (product && product.status === 'draft' ? ' selected' : '') + '>Черновик</option>' +
                    '<option value="archived"' + (product && product.status === 'archived' ? ' selected' : '') + '>В архиве</option>' +
                '</select>' +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        document.getElementById('modalBody').innerHTML = html;
        AdminModals.open('modal');

        renderImagesGrid();
        initImageUpload();
    }

    function renderImagesGrid() {
        var grid = document.getElementById('imagesGrid');
        if (!grid) return;

        if (uploadedImages.length === 0) {
            grid.innerHTML = '';
            return;
        }

        var html = uploadedImages.map(function(img, i) {
            return '<div class="image-preview" data-index="' + i + '" draggable="true">' +
                '<img src="' + window.escapeHtml(img.url) + '" alt="">' +
                (i === 0 ? '<span class="main-badge">Главное</span>' : '') +
                '<button type="button" class="remove-image-btn" data-index="' + i + '">' +
                    SharedIcons.get('close') +
                '</button>' +
            '</div>';
        }).join('');

        grid.innerHTML = html;
        initDragAndDrop();
    }

    function initImageUpload() {
        var input = document.getElementById('productImagesInput');
        var grid = document.getElementById('imagesGrid');
        if (!input || !grid) return;

        input.addEventListener('change', async function(e) {
            var files = Array.from(e.target.files);

            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                try {
                    showToast('Загрузка изображения...', 'info');
                    var result = await AdminImageUpload.uploadFile(file);
                    if (result && result.url) {
                        uploadedImages.push({
                            url: result.url,
                            isMain: uploadedImages.length === 0,
                            order: uploadedImages.length + 1
                        });
                        renderImagesGrid();
                    }
                } catch (error) {
                    showToast('Ошибка загрузки: ' + error.message, 'error');
                }
            }

            input.value = '';
        });

        // Remove image handler
        grid.addEventListener('click', function(e) {
            var removeBtn = e.target.closest('.remove-image-btn');
            if (removeBtn) {
                var index = parseInt(removeBtn.dataset.index, 10);
                uploadedImages.splice(index, 1);
                // Update isMain
                if (uploadedImages.length > 0) {
                    uploadedImages.forEach(function(img, i) {
                        img.isMain = i === 0;
                        img.order = i + 1;
                    });
                }
                renderImagesGrid();
            }
        });
    }

    function initDragAndDrop() {
        var grid = document.getElementById('imagesGrid');
        if (!grid) return;

        var draggedItem = null;
        var draggedIndex = null;

        grid.querySelectorAll('.image-preview').forEach(function(preview) {
            preview.addEventListener('dragstart', function(e) {
                draggedItem = this;
                draggedIndex = parseInt(this.dataset.index, 10);
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            preview.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                draggedItem = null;
                draggedIndex = null;
            });

            preview.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            preview.addEventListener('drop', function(e) {
                e.preventDefault();
                if (!draggedItem || draggedItem === this) return;

                var targetIndex = parseInt(this.dataset.index, 10);

                // Reorder array
                var item = uploadedImages.splice(draggedIndex, 1)[0];
                uploadedImages.splice(targetIndex, 0, item);

                // Update isMain and order
                uploadedImages.forEach(function(img, i) {
                    img.isMain = i === 0;
                    img.order = i + 1;
                });

                renderImagesGrid();
            });
        });
    }

    async function save() {
        var name = document.getElementById('productName').value.trim();
        var categoryId = document.getElementById('productCategory').value;
        var price = parseInt(document.getElementById('productPrice').value, 10);
        var description = document.getElementById('productDescription').value.trim();
        var status = document.getElementById('productStatus').value;

        if (!name) {
            showToast('Введите название товара', 'error');
            return;
        }
        if (!categoryId) {
            showToast('Выберите категорию', 'error');
            return;
        }
        if (isNaN(price) || price < 0) {
            showToast('Введите корректную цену', 'error');
            return;
        }

        var now = new Date().toISOString();

        var productData = {
            id: AdminState.editingItem ? AdminState.editingItem.id : SharedHelpers.generateId('product'),
            name: name,
            slug: generateSlug(name),
            description: description,
            price: price,
            categoryId: categoryId,
            images: uploadedImages,
            status: status,
            order: AdminState.editingItem ? AdminState.editingItem.order : AdminState.products.length + 1,
            createdAt: AdminState.editingItem ? AdminState.editingItem.createdAt : now,
            updatedAt: now
        };

        var products = AdminState.products.slice();

        if (AdminState.editingItem) {
            var index = products.findIndex(function(p) {
                return p.id === AdminState.editingItem.id;
            });
            if (index !== -1) products[index] = productData;
        } else {
            products.push(productData);
        }

        try {
            await AdminAPI.save('shop/products', { products: products });
            AdminState.setProducts(products);
            showToast('Товар сохранён', 'success');
            AdminModals.close('modal');
            AdminShopProductsRenderer.render();
        } catch (error) {
            showToast('Ошибка: ' + error.message, 'error');
        }
    }

    async function remove(id) {
        var product = AdminState.findProduct(id);
        if (!product) return;

        if (!confirm('Удалить товар "' + product.name + '"?')) {
            return;
        }

        var products = AdminState.products.filter(function(p) {
            return p.id !== id;
        });

        try {
            await AdminAPI.save('shop/products', { products: products });
            AdminState.setProducts(products);
            showToast('Товар удалён', 'success');
            AdminShopProductsRenderer.render();
        } catch (error) {
            showToast('Ошибка: ' + error.message, 'error');
        }
    }

    // generateSlug теперь используется из SharedHelpers (helpers.js)

    return {
        show: show,
        save: save,
        remove: remove
    };
})();

window.AdminProductForm = AdminProductForm;
