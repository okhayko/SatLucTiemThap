// Các hàm liên quan đến xây dựng tin nhắn AI

// Xây dựng Prompt tăng cường (Enhanced Prompt)
function buildEnhancedPrompt(userMessage, options = {}) {
    // Lấy cấu hình
    const saved = localStorage.getItem('gameConfig');
    const config = saved ? JSON.parse(saved) : {};

    // 🎨 Nếu kích hoạt NovelAI tạo ảnh, chèn mẫu prompt hình ảnh trước
    let novelAIPrompt = '';
    if (window.novelAIGenerator && window.novelAIGenerator.enabled) {
        novelAIPrompt = window.novelAIGenerator.getInjectionPrompt();
    }

    // 🆕 Xác định rõ đây là yêu cầu của người dùng (Prompt hình ảnh nằm trước nội dung người dùng nhập)
    let enhancedPrompt = novelAIPrompt + `\n\n【Diễn biến tiếp theo】${userMessage}`;

    // 1. Thêm gợi ý dựa trên giá trị Cơ Duyên và Thiên Khiển
    if (gameState.variables.karmaFortune >= 80) {
        enhancedPrompt += '\n\n[Cơ duyên cao→Cốt truyện tốt]';
    } else if (gameState.variables.karmaPunishment >= 80) {
        enhancedPrompt += '\n\n[Thiên khiển cao→Cốt truyện xấu]';
    }

    // 2. Lấy yêu cầu số chữ tối thiểu
    const minWordCount = config.minWordCount || 0;

    // 3. Nếu là chế độ lựa chọn, thêm kết quả kiểm tra thuộc tính
    if (options.attributeCheck) {
        const { requirement, checkResult } = options.attributeCheck;
        if (requirement.hasRequirement) {
            if (checkResult.met) {
                enhancedPrompt += `\n\n[Kiểm tra đạt: ${checkResult.attributeName}${checkResult.currentValue}${requirement.operator}${checkResult.requiredValue}→Cốt truyện thành công]`;
            } else {
                enhancedPrompt += `\n\n[Kiểm tra thất bại: ${checkResult.attributeName}${checkResult.currentValue} không đủ ${checkResult.requiredValue}→Cốt truyện thất bại]`;
            }
        }
    }

    // 4. Cường chế yêu cầu cập nhật biến và tạo các lựa chọn
    enhancedPrompt += '\n\n[Bắt buộc trả về 4 lựa chọn (bao gồm kiểm tra thuộc tính), thứ tự: 1. Đối thoại 2. Rời đi 3. Hành động 4. R18]';

    // 5. Thêm yêu cầu số chữ tối thiểu
    if (minWordCount > 0) {
        enhancedPrompt += `\n\n[story≥${minWordCount} chữ]`;
    }

    // 6. Yêu cầu miêu tả cảnh sắc dục (R18)
    enhancedPrompt += '\n\n[Cảnh R18 viết chi tiết quá trình, miêu tả đa diện về ngôn ngữ, hành động, biểu cảm; không được tự ý kết thúc cảnh sắc dục, cần người chơi chủ động kết thúc]';

    // 8. Nhắc nhở về quan hệ nhân tế (Định dạng v3.1)
    enhancedPrompt += '\n\n[Tương tác NPC cập nhật trong variableUpdate: relationships.TênNPC={favor: giá trị, opinion: "đánh giá", history: ["sự kiện"]}. R18 bắt buộc cập nhật: isVirgin/firstSex/lastSex/sexualPreference/appearance]';

    // 9. Hướng dẫn cập nhật biến (Định dạng v3.1)
    enhancedPrompt += '\n\n[Sử dụng trường variableUpdate, định dạng: {"Đường dẫn thuộc tính": giá trị}. Ví dụ: {"hp": 100, "items.Linh Thạch": 50, "relationships.Liễu Như Yên.favor": 80}]';

    // 10. Yêu cầu về lịch sử (history)
    enhancedPrompt += '\n\n[history trả về 1 mục ≥ 40 chữ.]';

    // 12. Gợi ý cấp độ Luyện Đan, Luyện Khí
    const alchemyLevel = gameState.variables.alchemyLevel || "Chưa nhập môn";
    const craftingLevel = gameState.variables.craftingLevel || "Chưa nhập môn";

    // Gợi ý cấp độ luyện đan
    if (alchemyLevel !== "Chưa nhập môn") {
        enhancedPrompt += `\n\n[Cấp độ Luyện Đan hiện tại: ${alchemyLevel}, phán đoán tỷ lệ thành công và phẩm chất đan dược dựa theo cấp độ]`;
    }

    // Gợi ý cấp độ luyện khí
    if (craftingLevel !== "Chưa nhập môn") {
        enhancedPrompt += `\n\n[Cấp độ Luyện Khí hiện tại: ${craftingLevel}, phán đoán tỷ lệ thành công và phẩm chất pháp bảo dựa theo cấp độ]`;
    }

    // 13. Thêm tóm tắt thao tác tại địa phương (nếu có)
    const hasLocalOps = gameState.localOps && (
        (gameState.localOps.items && gameState.localOps.items.length > 0) ||
        (gameState.localOps.attrs && gameState.localOps.attrs.length > 0) ||
        (gameState.localOps.equip && gameState.localOps.equip.length > 0)
    );
    
    if (hasLocalOps) {
        const localOpsSummary = {
            items: gameState.localOps.items || [],
            attrs: gameState.localOps.attrs || [],
            equip: gameState.localOps.equip || []
        };
        enhancedPrompt += '\n\n[Ghi chép thao tác cục bộ]' + JSON.stringify(localOpsSummary);
    }

    return enhancedPrompt;
}

// Xây dựng và gửi tin nhắn tới AI
async function buildAndSendAIMessage(materialsDesc, craftingType) {
    const userMessage = `Tôi lấy ${materialsDesc}${craftingType}`;

    // Xóa lựa chọn
    baiyiState.selectedMaterials = {};
    updateBaiyiMaterialsList();

    // Chuyển sang bảng trò chơi (Mobile)
    if (window.innerWidth <= 992) {
        switchMobileTab('game');
    }

    // Thêm tin nhắn người dùng vào lịch sử
    gameState.conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    // Hiển thị tin nhắn người dùng
    const historyDiv = document.getElementById('gameHistory');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.innerHTML = `
        <div class="message-header">
            <span>🧙 Bạn</span>
        </div>
        <div class="message-content">${userMessage}</div>
    `;
    historyDiv.appendChild(userMessageDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // Hiển thị thông báo đang tải
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
    loadingDiv.id = 'loading-message';
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        // 🎯 Sử dụng hàm thống nhất để xây dựng Prompt tăng cường
        const enhancedInput = buildEnhancedPrompt(userMessage);

        // 🆕 Hiển thị Prompt tăng cường đầy đủ trong console
        console.log('📤 [Bách Nghệ - Tin nhắn người dùng gốc]', userMessage);
        console.log('🤖 [Bách Nghệ - Prompt đầy đủ gửi tới AI]', enhancedInput);

        // 🔧 Truyền vào nội dung người dùng nhập gốc (dùng cho truy xuất vector)
        const response = await callAI(enhancedInput, false, userMessage);

        // Loại bỏ thông báo đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        handleAIResponse(response);

        // Kích hoạt tạo thế giới động (bất đồng bộ, không chặn luồng chính)
        generateDynamicWorld().catch(err => console.error('[Thế giới động] Lỗi tạo thế giới:', err));

        // 📨 Kích hoạt tin nhắn tự động từ bạn bè (bất đồng bộ, không chặn luồng chính)
        if (typeof window.generateAutoFriendMessage === 'function') {
            window.generateAutoFriendMessage().catch(err => console.error('[📨 Tin nhắn tự động bạn bè] Lỗi tạo tin nhắn:', err));
        }

    } catch (error) {
        // Loại bỏ thông báo đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        console.error('Thao tác Bách Nghệ thất bại:', error);
        alert('Thao tác Bách Nghệ thất bại: ' + error.message);
    }
}

// 🆕 Tạo văn bản tóm tắt cho bộ nhớ đệm thao tác
function getPendingActionsSummary() {
    const parts = [];

    // Xử lý việc sử dụng đan dược
    const pillNames = Object.keys(gameState.pendingActions.pills);
    if (pillNames.length > 0) {
        const pillParts = pillNames.map(name => {
            const count = gameState.pendingActions.pills[name];
            return count > 1 ? `${name} × ${count}` : name;
        });
        parts.push(`Tôi đã uống ${pillParts.join(', ')}`);
    }

    // Xử lý thay đổi trang bị
    if (gameState.pendingActions.equipment) {
        parts.push(`Tôi đã trang bị ${gameState.pendingActions.equipment}`);
    }

    return parts.length > 0 ? parts.join(', ') + '.' : '';
}

// 🆕 Xóa bộ nhớ đệm thao tác
function clearPendingActions() {
    gameState.pendingActions.pills = {};
    gameState.pendingActions.equipment = null;
}
