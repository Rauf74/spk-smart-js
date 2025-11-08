document.addEventListener('DOMContentLoaded', function() {

    // Logika Overlay
    const setupOverlayLogic = () => {
        const pageWrapper = document.getElementById('main-wrapper');
        const overlay = document.querySelector('.sidebar-overlay');
        const sidebarToggler = document.querySelector('.sidebartoggler'); // Tombol menu yang kita tunggu

        // Dobel cek sekali lagi untuk keamanan
        if (!pageWrapper || !overlay || !sidebarToggler) {
            console.error('Gagal menginisialisasi overlay: salah satu elemen penting tidak ditemukan.');
            return;
        }

        const handleOverlay = () => {
            if (pageWrapper.classList.contains('show-sidebar')) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        };

        overlay.addEventListener('click', function() {
            sidebarToggler.click();
        });

        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    handleOverlay();
                }
            });
        });

        observer.observe(pageWrapper, {
            attributes: true
        });

        handleOverlay();
        console.log('Logika overlay berhasil diinisialisasi.'); // Pesan sukses
    };

    // Kita buat fungsi "penunggu" atau "checker"
    const waitForElement = () => {
        // Cek apakah elemen .sidebartoggler sudah ada
        if (document.querySelector('.sidebartoggler')) {
            // Jika sudah ada, jalankan logika utama kita
            setupOverlayLogic();
        } else {
            // Jika belum, tunggu 100 milidetik lalu cek lagi
            setTimeout(waitForElement, 100);
        }
    };

    // Mulai proses menunggu
    waitForElement();
});