/**
 * Shop Category Form
 * Форма добавления/редактирования категории товаров
 */

var AdminCategoryForm = (function() {
    'use strict';

    // Группы иконок для выбора
    var iconGroups = [
        {
            name: 'Барбершоп',
            icons: ['scissors', 'razor', 'comb', 'beard', 'brush', 'wave']
        },
        {
            name: 'Косметика',
            icons: ['droplet', 'spray', 'bottle', 'jar', 'tube']
        },
        {
            name: 'Свойства',
            icons: ['star', 'heart', 'sparkles', 'shield', 'zap', 'award', 'crown']
        },
        {
            name: 'Природа',
            icons: ['leaf', 'flame', 'snowflake', 'sun', 'moon']
        },
        {
            name: 'Разное',
            icons: ['folder', 'box', 'tag', 'gift', 'coffee', 'tool', 'package', 'percent']
        }
    ];

    function show(category) {
        AdminState.editingItem = category || null;
        var title = category ? 'Редактировать категорию' : 'Добавить категорию';
        var currentIcon = category && category.icon || 'scissors';

        var html = '<form id="categoryForm" class="admin-form">' +
            '<div class="form-row">' +
                '<div class="form-group form-group-flex">' +
                    '<label class="form-label">Название *</label>' +
                    '<input type="text" class="form-input" id="categoryName" ' +
                        'value="' + window.escapeHtml(category && category.name || '') + '" ' +
                        'placeholder="Средства для волос" required>' +
                '</div>' +
                '<div class="form-group form-group-small">' +
                    '<label class="form-label">URL (slug)</label>' +
                    '<input type="text" class="form-input" id="categorySlug" ' +
                        'value="' + window.escapeHtml(category && category.slug || '') + '" ' +
                        'placeholder="hair-care">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Описание</label>' +
                '<textarea class="form-textarea" id="categoryDescription" rows="2" ' +
                    'placeholder="Краткое описание категории...">' +
                    window.escapeHtml(category && category.description || '') +
                '</textarea>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-checkbox">' +
                    '<input type="checkbox" id="categoryActive" ' + (category && category.active === false ? '' : 'checked') + '>' +
                    '<span class="checkbox-mark"></span>' +
                    '<span class="checkbox-label">Активная категория</span>' +
                '</label>' +
                '<p class="form-hint">Неактивные категории не отображаются на сайте</p>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Иконка</label>' +
                '<div class="icon-selector-grouped" id="iconSelector">' +
                    iconGroups.map(function(group) {
                        return '<div class="icon-group">' +
                            '<span class="icon-group-label">' + group.name + '</span>' +
                            '<div class="icon-group-icons">' +
                                group.icons.map(function(icon) {
                                    var activeClass = currentIcon === icon ? ' active' : '';
                                    return '<button type="button" class="icon-option' + activeClass + '" data-icon="' + icon + '" title="' + icon + '">' +
                                        SharedIcons.get(icon) +
                                    '</button>';
                                }).join('') +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' +
                '<input type="hidden" id="categoryIcon" value="' + window.escapeHtml(currentIcon) + '">' +
            '</div>' +
        '</form>';

        AdminModals.setTitle('modal', title);
        document.getElementById('modalBody').innerHTML = html;
        AdminModals.open('modal');

        initForm(category);
    }

    function initForm(category) {
        // Auto-generate slug from name
        var nameInput = document.getElementById('categoryName');
        var slugInput = document.getElementById('categorySlug');

        if (nameInput && slugInput) {
            nameInput.addEventListener('input', function() {
                if (!category) {
                    slugInput.value = generateSlug(nameInput.value);
                }
            });
        }

        // Icon selector
        var iconSelector = document.getElementById('iconSelector');
        var iconInput = document.getElementById('categoryIcon');

        if (iconSelector) {
            iconSelector.addEventListener('click', function(e) {
                var option = e.target.closest('.icon-option');
                if (option) {
                    iconSelector.querySelectorAll('.icon-option').forEach(function(o) {
                        o.classList.remove('active');
                    });
                    option.classList.add('active');
                    iconInput.value = option.dataset.icon;
                }
            });
        }
    }

    async function save() {
        var name = document.getElementById('categoryName').value.trim();
        if (!name) {
            showToast('Введите название категории', 'error');
            return;
        }

        var slug = document.getElementById('categorySlug').value.trim() || generateSlug(name);
        var description = document.getElementById('categoryDescription').value.trim();
        var icon = document.getElementById('categoryIcon').value || 'scissors';
        var active = document.getElementById('categoryActive').checked;

        var categoryData = {
            id: AdminState.editingItem ? AdminState.editingItem.id : 'category_' + Date.now(),
            name: name,
            slug: slug,
            description: description,
            icon: icon,
            order: AdminState.editingItem ? AdminState.editingItem.order : AdminState.shopCategories.length + 1,
            active: active
        };

        var categories = AdminState.shopCategories.slice();

        if (AdminState.editingItem) {
            var index = categories.findIndex(function(c) {
                return c.id === AdminState.editingItem.id;
            });
            if (index !== -1) categories[index] = categoryData;
        } else {
            categories.push(categoryData);
        }

        try {
            await AdminAPI.save('shop/categories', { categories: categories });
            AdminState.setShopCategories(categories);
            showToast('Категория сохранена', 'success');
            AdminModals.close('modal');
            AdminShopCategoriesRenderer.render();
        } catch (error) {
            showToast('Ошибка: ' + error.message, 'error');
        }
    }

    async function remove(id) {
        // Check if category has products
        var productsInCategory = AdminState.products.filter(function(p) {
            return p.categoryId === id;
        });

        if (productsInCategory.length > 0) {
            showToast('Нельзя удалить категорию с товарами (' + productsInCategory.length + ' шт.)', 'error');
            return;
        }

        var category = AdminState.findShopCategory(id);
        if (!category) return;

        var message = 'Удалить категорию "' + window.escapeHtml(category.name) + '"?';
        document.getElementById('deleteMessage').textContent = message;

        AdminModals.open('deleteModal');

        // Set up confirmation handler
        var confirmBtn = document.getElementById('deleteConfirm');
        var newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', async function() {
            var categories = AdminState.shopCategories.filter(function(c) {
                return c.id !== id;
            });

            try {
                await AdminAPI.save('shop/categories', { categories: categories });
                AdminState.setShopCategories(categories);
                showToast('Категория удалена', 'success');
                AdminModals.close('deleteModal');
                AdminShopCategoriesRenderer.render();
            } catch (error) {
                showToast('Ошибка: ' + error.message, 'error');
            }
        });
    }

    function generateSlug(text) {
        var translit = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
            'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        return text.toLowerCase()
            .split('')
            .map(function(char) { return translit[char] || char; })
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    return {
        show: show,
        save: save,
        remove: remove
    };
})();

window.AdminCategoryForm = AdminCategoryForm;
