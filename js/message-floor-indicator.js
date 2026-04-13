/**
 * Mô-đun chỉ báo tầng tin nhắn
 * Dùng để hiển thị số tầng của tin nhắn trong header tin nhắn
 * Tác giả: Hệ thống tạo
 * Phiên bản: 1.0.0
 */

(function() {
    'use strict';
    
    /**
     * Thêm chỉ báo tầng cho header tin nhắn
     * @param {HTMLElement} headerDiv - Phần tử DOM header của tin nhắn
     * @param {number} floorNumber - Số tầng (tương ứng với giá trị data-message-index)
     * @param {string} position - Vị trí hiển thị 'left'(bên trái) hoặc 'right'(bên phải), mặc định là 'left'
     */
    function addFloorIndicator(headerDiv, floorNumber, position = 'left') {
        if (!headerDiv || typeof floorNumber !== 'number') {
            console.warn('[Chỉ báo tầng] Tham số không hợp lệ:', { headerDiv, floorNumber });
            return;
        }
        
        // Tạo phần tử chỉ báo tầng
        const floorIndicator = document.createElement('span');
        floorIndicator.className = 'message-floor-indicator';
        floorIndicator.textContent = `#${floorNumber}`;
        floorIndicator.title = `Tầng thứ ${floorNumber}`;
        
        // Thiết lập kiểu dáng
        floorIndicator.style.cssText = `
            font-size: 12px;
            color: #6c757d;
            background: rgba(108, 117, 125, 0.1);
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: normal;
            user-select: none;
            margin: 0 8px;
        `;
        
        // Chèn dựa trên vị trí
        if (position === 'right') {
            headerDiv.appendChild(floorIndicator);
        } else {
            // Tìm span tiêu đề và chèn vào bên trong nó
            const titleSpan = headerDiv.querySelector('span:not(.message-floor-indicator)');
            if (titleSpan) {
                // Thêm chỉ báo tầng vào bên trong span tiêu đề (tránh sử dụng innerHTML)
                const spaceNode = document.createTextNode(' ');
                titleSpan.appendChild(spaceNode);
                titleSpan.appendChild(floorIndicator);
            } else {
                // Nếu không tìm thấy span tiêu đề, thì thêm vào cuối header
                headerDiv.appendChild(floorIndicator);
            }
        }
    }
    
    /**
     * Cập nhật hàng loạt chỉ báo tầng cho tất cả tin nhắn
     * Dùng để đánh số lại sau khi tải trang hoặc xóa tin nhắn
     */
    function updateAllFloorIndicators() {
        const historyDiv = document.getElementById('gameHistory');
        if (!historyDiv) {
            console.warn('[Chỉ báo tầng] Không tìm thấy phần tử gameHistory');
            return;
        }
        
        const messages = historyDiv.querySelectorAll('.message');
        messages.forEach((messageDiv, index) => {
            // Cập nhật thuộc tính data-message-index
            messageDiv.setAttribute('data-message-index', index);
            
            // Tìm hoặc tạo chỉ báo tầng
            const headerDiv = messageDiv.querySelector('.message-header');
            if (!headerDiv) return;
            
            // Gỡ bỏ chỉ báo tầng cũ (nếu tồn tại)
            const oldIndicator = headerDiv.querySelector('.message-floor-indicator');
            if (oldIndicator) {
                oldIndicator.remove();
            }
            
            // Thêm chỉ báo tầng mới
            addFloorIndicator(headerDiv, index);
        });
        
        console.log(`[Chỉ báo tầng] Đã cập nhật số tầng của ${messages.length} tin nhắn`);
    }
    
    /**
     * Lắng nghe thay đổi DOM, tự động thêm chỉ báo tầng cho tin nhắn mới
     */
    function observeMessageChanges() {
        const historyDiv = document.getElementById('gameHistory');
        if (!historyDiv) {
            console.warn('[Chỉ báo tầng] Không tìm thấy phần tử gameHistory, trì hoãn khởi tạo');
            setTimeout(observeMessageChanges, 1000);
            return;
        }
        
        // Sử dụng MutationObserver để lắng nghe thay đổi tin nhắn
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // Chỉ xử lý các phần tử tin nhắn mới thêm vào, và khi không ở chế độ xóa
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        node.classList.contains('message') &&
                        !historyDiv.classList.contains('delete-mode-active')) {
                        
                        const headerDiv = node.querySelector('.message-header');
                        const messageIndex = parseInt(node.getAttribute('data-message-index'));
                        
                        if (headerDiv && !isNaN(messageIndex)) {
                            // Kiểm tra xem đã có chỉ báo tầng chưa
                            if (!headerDiv.querySelector('.message-floor-indicator')) {
                                addFloorIndicator(headerDiv, messageIndex);
                            }
                        }
                    }
                });
            });
        });
        
        // Bắt đầu quan sát
        observer.observe(historyDiv, {
            childList: true,
            subtree: false
        });
        
        console.log('[Chỉ báo tầng] Đã khởi động lắng nghe thay đổi tin nhắn');
        
        // Khởi tạo các tin nhắn hiện có
        updateAllFloorIndicators();
    }
    
    /**
     * Khởi tạo hệ thống chỉ báo tầng
     */
    function initFloorIndicator() {
        // Chờ tải xong DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeMessageChanges);
        } else {
            observeMessageChanges();
        }
    }
    
    // Xuất ra đối tượng toàn cục
    window.MessageFloorIndicator = {
        addFloorIndicator,
        updateAllFloorIndicators,
        init: initFloorIndicator
    };
    
    // Tự động khởi tạo
    initFloorIndicator();
    
    console.log('[Chỉ báo tầng] Tải mô-đun hoàn tất');
})();
