document.addEventListener('DOMContentLoaded', function () {

    // Logika Overlay
    const setupOverlayLogic = () => {
        const pageWrapper = document.getElementById('main-wrapper');
        const overlay = document.querySelector('.sidebar-overlay');

        // Kita tidak perlu menunggu sidebartoggler di sini jika kita trigger click secara manual
        // atau kita bisa cari saat event click terjadi.

        if (!pageWrapper || !overlay) {
            console.error('Gagal menginisialisasi overlay: elemen wrapper atau overlay tidak ditemukan.');
            return;
        }

        const handleOverlay = () => {
            if (pageWrapper.classList.contains('show-sidebar')) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        };

        // Event listener untuk menutup sidebar saat overlay diklik
        overlay.addEventListener('click', function () {
            if (!pageWrapper.classList.contains('show-sidebar')) return;

            // Cari tombol toggler saat klik terjadi (karena mungkin dirender dinamis)
            const sidebarToggler = document.querySelector('.sidebartoggler');
            if (sidebarToggler) {
                // Trigger click supaya state lain (checkbox/atribut) ikut sinkron
                sidebarToggler.click();
            } else {
                // Fallback manual
                pageWrapper.classList.remove('show-sidebar');
                handleOverlay();
            }
        });

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class') {
                    handleOverlay();
                }
            });
        });

        observer.observe(pageWrapper, {
            attributes: true
        });

        handleOverlay();
    };

    // Jalankan langsung karena overlay dan wrapper biasanya statis di index.html
    setupOverlayLogic();
});
