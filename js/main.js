// Service Tabs - Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Service tabs initializing...');
    const tabButtons = document.querySelectorAll('.service-tab');
    console.log('Found tab buttons:', tabButtons.length);

    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Tab clicked');

            const targetTab = this.getAttribute('data-tab-target');
            console.log('Target tab:', targetTab);

            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.service-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected tab content
            const targetContent = document.querySelector(`.service-tab-content[data-tab="${targetTab}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
                console.log('Content shown for:', targetTab);
            } else {
                console.log('Content not found for:', targetTab);
            }
        });
    });
});
