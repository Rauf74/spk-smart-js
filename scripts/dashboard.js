// File: dashboard-scripts.js
// Berisi semua JavaScript untuk dashboard

// Fungsi untuk inisialisasi grafik kriteria
function initKriteriaChart(kriteriaJenisData) {
    if (document.getElementById('kriteriaChart')) {
        var kriteriaOptions = {
            series: kriteriaJenisData.map(item => parseInt(item.jumlah)),
            chart: {
                type: 'donut',
                height: 300
            },
            labels: kriteriaJenisData.map(item => item.jenis),
            colors: ['#5D87FF', '#49BEFF', '#13DEB9', '#FFAE1F'],
            legend: {
                show: true,
                position: 'bottom'
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: function (w) {
                                    return w.globals.seriesTotals.reduce((a, b) => {
                                        return a + b
                                    }, 0)
                                }
                            }
                        }
                    }
                }
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };
        var kriteriaChart = new ApexCharts(document.querySelector("#kriteriaChart"), kriteriaOptions);
        kriteriaChart.render();
    }
}

// Fungsi untuk inisialisasi grafik bobot
function initBobotChart(bobotKriteriaData) {
    if (document.getElementById('bobotChart')) {
        var bobotOptions = {
            series: [{
                name: 'Bobot',
                data: bobotKriteriaData.map(item => parseFloat(item.bobot))
            }],
            chart: {
                type: 'bar',
                height: 300
            },
            xaxis: {
                categories: bobotKriteriaData.map(item => item.nama_kriteria),
                labels: {
                    rotate: -45,
                    style: {
                        fontSize: '10px'
                    },
                    maxHeight: 80
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val + "%";
                }
            },
            colors: ['#5D87FF'],
            grid: {
                yaxis: {
                    lines: {
                        show: true,
                    }
                },
            },
            yaxis: {
                title: {
                    text: 'Bobot (%)'
                },
                min: 0,
                max: 100
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val + "%"
                    }
                }
            }
        };
        var bobotChart = new ApexCharts(document.querySelector("#bobotChart"), bobotOptions);
        bobotChart.render();
    }
}

// Fungsi untuk inisialisasi grafik breakup (circular)
function initBreakupChart(totalUsers) {
    if (document.getElementById('breakup')) {
        var breakupOptions = {
            color: "#adb5bd",
            series: [totalUsers],
            labels: ["Users"],
            chart: {
                width: 180,
                type: "donut",
                fontFamily: "Plus Jakarta Sans', sans-serif",
                foreColor: "#adb0bb"
            },
            plotOptions: {
                pie: {
                    startAngle: 0,
                    endAngle: 360,
                    donut: {
                        size: '75%'
                    }
                }
            },
            stroke: {
                show: false
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                show: false
            },
            colors: ["#5D87FF"],
            responsive: [
                {
                    breakpoint: 991,
                    options: {
                        chart: {
                            width: 150
                        }
                    }
                }
            ],
            tooltip: {
                theme: "dark",
                fillSeriesColor: false
            }
        };
        var breakupChart = new ApexCharts(document.querySelector("#breakup"), breakupOptions);
        breakupChart.render();
    }
}

// Fungsi untuk inisialisasi semua grafik
function initAllCharts(kriteriaJenisData, bobotKriteriaData, totalUsers) {
    initKriteriaChart(kriteriaJenisData);
    initBobotChart(bobotKriteriaData);
    initBreakupChart(totalUsers);
}

// Fungsi untuk inisialisasi event handlers
function initEventHandlers() {
    // Initialize tooltips if needed
    $('[data-bs-toggle="tooltip"]').tooltip();

    // Add hover effects to quick action buttons
    $('.btn').hover(
        function () { $(this).addClass('shadow-sm'); },
        function () { $(this).removeClass('shadow-sm'); }
    );
}

// Fungsi untuk auto refresh (opsional)
function enableAutoRefresh(intervalMinutes = 5) {
    setInterval(function () {
        location.reload();
    }, intervalMinutes * 60000);
}

// Fungsi utama yang dipanggil saat document ready
function runInit(kriteriaJenisData, bobotKriteriaData, totalUsers) {
    initAllCharts(kriteriaJenisData, bobotKriteriaData, totalUsers);
    initEventHandlers();
    // enableAutoRefresh(5);
}

function initDashboard(kriteriaJenisData, bobotKriteriaData, totalUsers) {
    if (typeof $ !== "undefined" && $.fn && $.fn.ready) {
        $(document).ready(function () {
            runInit(kriteriaJenisData, bobotKriteriaData, totalUsers);
        });
    } else if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function onReady() {
            document.removeEventListener("DOMContentLoaded", onReady);
            runInit(kriteriaJenisData, bobotKriteriaData, totalUsers);
        });
    } else {
        runInit(kriteriaJenisData, bobotKriteriaData, totalUsers);
    }
}

export { initDashboard };

if (typeof window !== "undefined") {
    window.Dashboard = Object.freeze({
        initDashboard,
    });
}
