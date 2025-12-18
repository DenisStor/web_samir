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
            totalViews: document.getElementById('statTotalViews'),
            todayViews: document.getElementById('statTodayViews'),
            weekViews: document.getElementById('statWeekViews'),
            uniqueVisitors: document.getElementById('statUniqueVisitors'),
            topSections: document.getElementById('pagesStatsList'),
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
            'location': 'Контакты',
            'social': 'Соцсети'
        };

        var sortedSections = Object.entries(sections)
            .sort(function(a, b) { return b[1] - a[1]; })
            .slice(0, 6);

        if (sortedSections.length === 0) {
            elements.topSections.innerHTML = '<p class="empty-message">Нет данных</p>';
            return;
        }

        var maxViews = sortedSections[0][1];

        var html = sortedSections.map(function(item, index) {
            var key = item[0];
            var views = item[1];
            var name = sectionNames[key] || key;
            var percent = maxViews > 0 ? Math.round((views / maxViews) * 100) : 0;

            return '<div class="page-stat-row">' +
                '<span class="page-stat-name">' + escapeHtml(name) + '</span>' +
                '<div class="page-stat-bar-wrap">' +
                    '<div class="page-stat-bar" style="width: ' + percent + '%"></div>' +
                '</div>' +
                '<span class="page-stat-count">' + views + '</span>' +
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

        // Устанавливаем размеры canvas на основе родительского контейнера
        var wrapper = canvas.parentElement;
        if (wrapper) {
            var rect = wrapper.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }

        var ctx = canvas.getContext('2d');
        var dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);

        var width = canvas.width / dpr;
        var height = canvas.height / dpr;
        var padding = 50;
        var paddingBottom = 30;

        // Очистка
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!chartData || chartData.length === 0) {
            // Показываем сообщение если нет данных
            ctx.fillStyle = '#666';
            ctx.font = '14px Manrope, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных для отображения', width / 2, height / 2);
            return;
        }

        // Находим максимальное значение (с защитой от пустого массива)
        var views = chartData.map(function(d) { return d.views || 0; });
        var maxViews = views.length > 0 ? Math.max.apply(null, views) : 0;
        if (maxViews === 0) maxViews = 1;

        var chartWidth = width - padding - 20;
        var chartHeight = height - padding - paddingBottom;
        var barWidth = chartWidth / chartData.length;
        var barGap = 4;

        // Рисуем линии сетки
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (var i = 0; i <= 4; i++) {
            var y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
        }

        // Подписи оси Y
        ctx.fillStyle = '#666';
        ctx.font = '11px Manrope, sans-serif';
        ctx.textAlign = 'right';
        for (var i = 0; i <= 4; i++) {
            var value = Math.round(maxViews * (4 - i) / 4);
            var y = padding + (chartHeight / 4) * i;
            ctx.fillText(formatNumber(value), padding - 10, y + 4);
        }

        // Рисуем бары с градиентом
        chartData.forEach(function(data, index) {
            var barHeight = Math.max(2, (data.views / maxViews) * chartHeight);
            var x = padding + index * barWidth + barGap;
            var y = height - paddingBottom - barHeight;
            var w = barWidth - barGap * 2;

            // Градиент для бара
            var gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0.4)');
            ctx.fillStyle = gradient;

            // Скругленные углы сверху
            var radius = Math.min(4, w / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + barHeight);
            ctx.lineTo(x, y + barHeight);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.fill();

            // Значение над баром
            if (data.views > 0) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px Manrope, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(data.views, x + w / 2, y - 6);
            }
        });

        // Подписи дат
        ctx.fillStyle = '#888';
        ctx.font = '10px Manrope, sans-serif';
        ctx.textAlign = 'center';

        chartData.forEach(function(data, index) {
            var x = padding + index * barWidth + barWidth / 2;
            var date = new Date(data.date);
            var label = date.getDate() + '/' + (date.getMonth() + 1);

            // Показываем каждую дату или через одну если много баров
            if (chartData.length <= 7 || index % 2 === 0) {
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
