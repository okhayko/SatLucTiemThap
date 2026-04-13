/**
 * Module UI cho thiết bị di động
 * Xử lý thống nhất các tương tác UI như chuyển đổi Tab trên thiết bị di động
 * * @author Tái cấu trúc từ mã lặp lại của game.html và game-bhz.html
 * @version 1.0.0
 */

/**
 * Chuyển đổi Tab trên thiết bị di động
 * @param {string} tabName - Tên Tab: 'game' hoặc 'status'
 */
window.switchMobileTab = function(tabName) {
    console.log('[Tab di động] Chuyển đến:', tabName);
    
    try {
        // Loại bỏ class 'active' khỏi tất cả các nút Tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Lấy các phần tử bảng điều khiển (panel)
        const gamePanel = document.querySelector('.game-panel');
        const statusPanel = document.querySelector('.status-panel');
        
        if (!gamePanel || !statusPanel) {
            console.warn('[Tab di động] Không tìm thấy phần tử bảng điều khiển');
            return;
        }
        
        // Loại bỏ class 'active' khỏi tất cả các panel
        gamePanel.classList.remove('active');
        statusPanel.classList.remove('active');

        // Kích hoạt nút Tab mục tiêu
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        } else {
            console.warn(`[Tab di động] Không tìm thấy nút Tab: ${tabName}`);
        }
        
        // Kích hoạt panel mục tiêu
        if (tabName === 'game') {
            gamePanel.classList.add('active');
            console.log('[Tab di động] ✅ Bảng trò chơi đã được kích hoạt');
            
            // Khi chuyển về bảng trò chơi, tự động cuộn xuống đáy tin nhắn
            // Thử cuộn nhiều lần để đảm bảo cuộn có hiệu lực sau khi hoạt ảnh panel hoàn tất
            const scrollToBottom = () => {
                const historyDiv = document.getElementById('gameHistory');
                if (historyDiv) {
                    historyDiv.scrollTop = historyDiv.scrollHeight;
                    console.log('[Tab di động] Cuộn xuống đáy, scrollTop:', historyDiv.scrollTop, 'scrollHeight:', historyDiv.scrollHeight);
                }
            };
            // Thử ngay lập tức
            requestAnimationFrame(scrollToBottom);
            // Thử lại sau 100ms
            setTimeout(scrollToBottom, 100);
            // Đảm bảo cuối cùng sau 300ms
            setTimeout(scrollToBottom, 300);
        } else if (tabName === 'status') {
            statusPanel.classList.add('active');
            console.log('[Tab di động] ✅ Bảng trạng thái đã được kích hoạt');
        } else {
            console.warn(`[Tab di động] Tên Tab không xác định: ${tabName}`);
        }
    } catch (error) {
        console.error('[Tab di động] Chuyển đổi thất bại:', error);
        console.error('Stack lỗi:', error.stack);
    }
};

/**
 * Kiểm tra xem có phải thiết bị di động không
 * @returns {boolean}
 */
window.isMobileDevice = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Tự động điều chỉnh bố cục di động
 * @param {boolean} isInitial - Có phải là lần gọi khởi tạo đầu tiên không
 */
window.autoAdjustMobileLayout = function(isInitial = false) {
    if (isMobileDevice()) {
        console.log('[UI di động] Phát hiện thiết bị di động, áp dụng kiểu di động');
        document.body.classList.add('mobile-device');
        
        // Chỉ mặc định chuyển sang bảng trò chơi khi khởi tạo lần đầu, không bắt buộc khi thay đổi kích thước (resize)
        if (isInitial) {
            switchMobileTab('game');
        }
    } else {
        console.log('[UI di động] Phát hiện thiết bị máy tính');
        document.body.classList.add('desktop-device');
    }
};

/**
 * Khởi tạo UI di động
 */
window.initMobileUI = function() {
    console.log('[UI di động] Khởi tạo');
    
    // Tự động điều chỉnh bố cục và thiết lập bảng mặc định khi khởi tạo lần đầu
    autoAdjustMobileLayout(true);
    
    // Gán sự kiện click cho các nút Tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchMobileTab(tabName);
            }
        });
    });
    
    // Theo dõi sự thay đổi kích thước cửa sổ
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            autoAdjustMobileLayout();
        }, 250);
    });
    
    console.log('[UI di động] ✅ Khởi tạo hoàn tất');
};

// Tự động khởi tạo khi DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileUI);
} else {
    initMobileUI();
}

console.log('📦 [Module Load] mobile-ui.js đã được tải');
