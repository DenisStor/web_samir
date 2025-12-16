/**
 * Admin Stats Renderer
 * Рендеринг статистики посещений
 */

var AdminStatsRenderer = (function() {
    'use strict';

    var elements = {};

    /**
     * Инициализация элементов
     */
    function init() {
        elements = {
            totalViews: document.getElementById('totalViews'),
            todayViews: document.getElementById('todayViews'),
            weekViews: document.getElementById('weekViews'),
            monthViews: document.getElementById('monthViews'),
            uniqueVisitors: document.getElementById('uniqueVisitors'),
            topSections: document.getElementById('topSections'),
            chartCanvas: document.getElementById('statsChart')
        };
    }

    /**
     * Рендеринг статистики
     */
    function render(stats) {
        if (!stats) return;

        // Основные метрики
        if (elements.totalViews) {
            elements.totalViews.textContent = formatNumber(stats.total_views || 0);
        }
        if (elements.todayViews) {
            elements.todayViews.textContent = formatNumber(stats.today_views || 0);
        }
        if (elements.weekViews) {
            elements.weekViews.textContent = formatNumber(stats.week_views || 0);
        }
        if (elements.monthViews) {
            elements.monthViews.textContent = formatNumber(stats.month_views || 0);
        }
        if (elements.uniqueVisitors) {
            elements.uniqueVisitors.textContent = formatNumber(stats.unique_visitors || 0);
        }

        // Топ секций
        if (elements.topSections && stats.sections) {
            renderTopSections(stats.sections);
        }

        // График
        if (elements.chartCanvas && stats.chart_data) {
            renderChart(stats.chart_data);
        }
    }

    /**
     * Рендеринг топ секций
     */
    function renderTopSections(sections) {
        var sectionNames = {
            'hero': 'Главная',
            'services': 'Услуги',
            'masters': 'Мастера',
            'quality': 'Качество',
            'blog': 'Блог',
            'faq': 'FAQ',
            'booking': 'Запись',
            'podology': 'Подология',
            'location': 'Контакты'
        };

        // Сортировка по просмотрам
        var sortedSections = Object.entries(sections)
            .sort(function(a, b) { return b[1] - a[1]; })
            .slice(0, 5);

        if (sortedSections.length === 0) {
            elements.topSections.innerHTML = '<p class="empty-message">Нет данных о просмотрах секций</p>';
            return;
        }

        var maxViews = sortedSections[0][1];

        var html = sortedSections.map(function(item) {
            var key = item[0];
            var views = item[1];
            var name = sectionNames[key] || key;
            var percent = maxViews > 0 ? Math.round((views / maxViews) * 100) : 0;

            return '<div class="section-stat-item">' +
                '<div class="section-stat-info">' +
                    '<span class="section-name">' + escapeHtml(name) + '</span>' +
                    '<span class="section-views">' + formatNumber(views) + '</span>' +
                '</div>' +
                '<div class="section-stat-bar">' +
                    '<div class="section-stat-fill" style="width: ' + percent + '%"></div>' +
                '</div>' +
            '</div>';
        }).join('');

        elements.topSections.innerHTML = html;
    }

    /**
     * Рендеринг графика (простая реализация без библиотек)
     */
    function renderChart(chartData) {
        var canvas = elements.chartCanvas;
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        var padding = 40;

        // Очистка
        ctx.clearRect(0, 0, width, height);

        if (!chartData || chartData.length === 0) return;

        // Находим максимальное значение
        var maxViews = Math.max.apply(null, chartData.map(function(d) { return d.views; }));
        if (maxViews === 0) maxViews = 1;

        var chartWidth = width - padding * 2;
        var chartHeight = height - padding * 2;
        var barWidth = chartWidth / chartData.length;

        // Рисуем бары
        ctx.fillStyle = '#00ff88';

        chartData.forEach(function(data, index) {
            var barHeight = (data.views / maxViews) * chartHeight;
            var x = padding + index * barWidth + barWidth * 0.1;
            var y = height - padding - barHeight;
            var w = barWidth * 0.8;

            ctx.fillRect(x, y, w, barHeight);
        });

        // Подписи дат
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px Manrope';
        ctx.textAlign = 'center';

        chartData.forEach(function(data, index) {
            if (index % 2 === 0) { // Каждая вторая дата
                var x = padding + index * barWidth + barWidth / 2;
                var date = new Date(data.date);
                var label = date.getDate() + '.' + (date.getMonth() + 1);
                ctx.fillText(label, x, height - 10);
            }
        });
    }

    /**
     * Форматирование числа
     */
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return String(num);
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (typeof window.escapeHtml === 'function') {
            return window.escapeHtml(text);
        }
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Публичный API
    return {
        init: init,
        render: render
    };
})();

// Экспорт
window.AdminStatsRenderer = AdminStatsRenderer;
