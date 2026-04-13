// ==================== Các hàm liên quan đến Kho kiến thức tĩnh ====================

// Đảm bảo các mục của Từ khóa gợi ý hệ thống (System Prompt) tồn tại
// ==================== Hệ thống quản lý Kho kiến thức ====================
// ✅ Đã di chuyển hoàn toàn sang knowledge-manager-full.js (10765-12591, khoảng 1826 dòng)
// Bao gồm:
// - ensureSystemPromptInKB - Quản lý System Prompt
// - debugSystemPrompt - Gỡ lỗi System Prompt
// - viewKnowledgeBase - Xem kho kiến thức tĩnh
// - filterKBList - Lọc kho kiến thức
// - showKBDetail - Hiển thị chi tiết
// - editKBItem - Chỉnh sửa mục
// - deleteKBItem - Xóa mục
// - addNewKBItem - Thêm mục mới
// - changeKBPriority - Thay đổi mức độ ưu tiên
// - testKBRetrieval - Kiểm tra truy xuất
// - Và tất cả các hàm UI liên quan đến kho kiến thức khác

async function ensureSystemPromptInKB() {
    if (!window.contextVectorManager) {
        console.error('[System Prompt] Trình quản lý Vector chưa được khởi tạo');
        return;
    }

    // Kiểm tra xem các mục System Prompt đã tồn tại chưa
    const hasGameSystemPrompt = window.contextVectorManager.staticKnowledgeBase.some(
        item => item.id === 'system_prompt_main'
    );
    const hasXiuxianRules = window.contextVectorManager.staticKnowledgeBase.some(
        item => item.id === 'xiuxian_rules_main'
    );

    if (hasGameSystemPrompt && hasXiuxianRules) {
        console.log('[System Prompt] ✅ Tất cả các mục System Prompt đã tồn tại trong kho kiến thức');
        
        // Đảm bảo quy tắc Tu tiên nằm ở trên cùng
        const xiuxianIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
            item => item.id === 'xiuxian_rules_main'
        );
        
        if (xiuxianIndex > 0) {
            // Chuyển quy tắc Tu tiên lên trên cùng
            const xiuxianItem = window.contextVectorManager.staticKnowledgeBase.splice(xiuxianIndex, 1)[0];
            window.contextVectorManager.staticKnowledgeBase.unshift(xiuxianItem);
            console.log('[System Prompt] 🔄 Đã chuyển quy tắc Tu tiên lên trên cùng');
        }
        return true;
    }

    console.log('[System Prompt] 📝 Đang tạo các mục System Prompt...');

    // 1. Trước tiên tạo quy tắc trò chơi Tu tiên (đặt ở trên cùng)
    if (!hasXiuxianRules) {
        const xiuxianPrompt = typeof defaultSystemPrompt !== 'undefined' ? defaultSystemPrompt :
            (typeof getSystemPrompt === 'function' ? getSystemPrompt() :
                (document.getElementById('systemPrompt')?.value || 'Bạn là một người dẫn truyện (GM) trong thế giới Tu tiên.'));

        console.log('[System Prompt] 📋 Độ dài gợi ý quy tắc Tu tiên:', xiuxianPrompt.length);

        // 🔧 Sửa lỗi: Tự động phát hiện loại trò chơi, sử dụng nguồn cấu hình chính xác
        const isBhzGame = typeof window.BHZ_CONFIG !== 'undefined' ||
            window.location.pathname.includes('game-bhz.html') ||
            document.title.includes('Bạch Hổ Tông');
        
        const promptSource = isBhzGame ? 'bhz-config.js defaultSystemPrompt' : 'xiuxian-config.js defaultSystemPrompt';
        const gameTitle = isBhzGame ? '🐅 Quy tắc trò chơi Bạch Hổ Tông (Tham khảo)' : '🧾 Quy tắc trò chơi (Tham khảo)';
        const gameDescription = isBhzGame ? 'Quy tắc chi tiết của trò chơi Bạch Hổ Tông, hiển thị độc lập trên cùng' : 'Quy tắc chi tiết của trò chơi Tu tiên, hiển thị độc lập trên cùng';
        const gameTags = isBhzGame ?
            ['Hệ thống', 'Prompt', 'Bạch Hổ Tông', 'Quy tắc JSON', 'Cập nhật biến', 'Tham khảo'] :
            ['Hệ thống', 'Prompt', 'Tu tiên', 'Quy tắc JSON', 'Cập nhật biến', 'Tham khảo'];

        const xiuxianRulesItem = {
            id: 'xiuxian_rules_main',
            title: gameTitle,
            content: xiuxianPrompt,
            category: 'Hệ thống',
            tags: gameTags,
            alwaysInclude: true, // 🔧 Đổi thành true để luôn luôn bao gồm trong ngữ cảnh
            priority: 'top',     // 🔧 Đặt mức ưu tiên cao nhất (Top)
            vector: null,
            vectorType: 'system',
            metadata: {
                description: gameDescription,
                source: promptSource,
                isEditable: true,
                isCore: true,    // 🔧 Đổi lại thành cốt lõi vì cần hiển thị ở trên cùng
                note: 'Quy tắc này hiển thị độc lập với ưu tiên hàng đầu, đảm bảo AI luôn tham chiếu'
            }
        };

        // Chèn vào vị trí trên cùng
        window.contextVectorManager.staticKnowledgeBase.unshift(xiuxianRulesItem);
        const gameTypeName = isBhzGame ? 'Bạch Hổ Tông' : 'Tu tiên';
        console.log(`[System Prompt] ✅ Đã tạo mục quy tắc trò chơi ${gameTypeName} (Vị trí trên cùng)`);
    }

    // 2. Sau đó tạo System Prompt cơ bản của trò chơi (đặt sau quy tắc Tu tiên)
    if (!hasGameSystemPrompt) {
        const gamePrompt = typeof getSystemPrompt === 'function' ? getSystemPrompt() :
            (document.getElementById('systemPrompt')?.value || 'Bạn là một người dẫn truyện trong thế giới Tu tiên.');

        console.log('[System Prompt] 📋 Độ dài Prompt cơ bản của trò chơi:', gamePrompt.length);

        const gameSystemPromptItem = {
            id: 'system_prompt_main',
            title: '🎮 System Prompt Trò chơi (Cơ bản)',
            content: gamePrompt,
            category: 'Hệ thống',
            tags: ['Hệ thống', 'Prompt', 'Cơ bản', 'Quy tắc trò chơi'],
            alwaysInclude: true,
            priority: 'high', // Ưu tiên cao
            vector: null,
            vectorType: 'system',
            metadata: {
                description: 'System Prompt cơ bản, bao gồm quy tắc dẫn truyện và tạo tùy chọn',
                source: 'getSystemPrompt() / textarea',
                isEditable: true,
                isCore: true
            }
        };

        // Chèn vào sau quy tắc Tu tiên (vị trí thứ hai)
        const insertIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
            item => item.id === 'xiuxian_rules_main'
        ) + 1;

        if (insertIndex > 0) {
            window.contextVectorManager.staticKnowledgeBase.splice(insertIndex, 0, gameSystemPromptItem);
        } else {
            window.contextVectorManager.staticKnowledgeBase.push(gameSystemPromptItem);
        }

        console.log('[System Prompt] ✅ Đã tạo mục System Prompt cơ bản (Vị trí thứ hai)');
    }

    // Lưu vào IndexedDB
    try {
        await window.contextVectorManager.saveStaticKBToIndexedDB();
        console.log('[System Prompt] ✅ Tất cả System Prompt đã được lưu vào kho kiến thức và IndexedDB');
        console.log('[System Prompt] 📋 Quy tắc Tu tiên ở trên cùng, quy tắc cơ bản ở vị trí thứ hai');
        return true;
    } catch (error) {
        console.error('[System Prompt] ❌ Lưu vào IndexedDB thất bại:', error);
        // Ngay cả khi lưu thất bại, vẫn giữ trong bộ nhớ
        return true;
    }
}

// 🔧 Hàm gỡ lỗi: Xác minh System Prompt có được tải chính xác không
async function debugSystemPrompt() {
    console.log('=== Thông tin gỡ lỗi System Prompt ===');

    // 1. Kiểm tra defaultSystemPrompt có tồn tại không
    if (typeof defaultSystemPrompt !== 'undefined') {
        console.log('✅ defaultSystemPrompt tồn tại');
        console.log('📏 Độ dài:', defaultSystemPrompt.length);
        console.log('📋 100 ký tự đầu:', defaultSystemPrompt.substring(0, 100));
    } else {
        console.log('❌ defaultSystemPrompt không tồn tại');
    }

    // 2. Kiểm tra hàm getSystemPrompt
    if (typeof getSystemPrompt === 'function') {
        const promptFromFunc = getSystemPrompt();
        console.log('✅ Hàm getSystemPrompt tồn tại');
        console.log('📏 Độ dài trả về:', promptFromFunc.length);
        console.log('📋 100 ký tự đầu:', promptFromFunc.substring(0, 100));
    } else {
        console.log('❌ Hàm getSystemPrompt không tồn tại');
    }

    // 3. Kiểm tra textarea
    const textareaEl = document.getElementById('systemPrompt');
    if (textareaEl) {
        console.log('✅ Phần tử textarea tồn tại');
        console.log('📏 Độ dài nội dung:', textareaEl.value.length);
        console.log('📋 100 ký tự đầu:', textareaEl.value.substring(0, 100));
    } else {
        console.log('❌ Phần tử textarea không tồn tại');
    }

    // 4. Kiểm tra System Prompt trong kho kiến thức
    if (window.contextVectorManager) {
        const xiuxianKbItem = window.contextVectorManager.staticKnowledgeBase.find(item => item.id === 'xiuxian_rules_main');
        const gameKbItem = window.contextVectorManager.staticKnowledgeBase.find(item => item.id === 'system_prompt_main');

        const xiuxianIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
            item => item.id === 'xiuxian_rules_main'
        );
        const gameIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
            item => item.id === 'system_prompt_main'
        );

        if (xiuxianKbItem) {
            console.log('✅ Tồn tại quy tắc Tu tiên trong kho kiến thức (Tham chiếu dự phòng)');
            console.log('📋 Tiêu đề:', xiuxianKbItem.title);
            console.log('📏 Độ dài:', xiuxianKbItem.content.length);
            console.log('🏷️ Ưu tiên:', xiuxianKbItem.priority);
            console.log('📌 Luôn bao gồm:', xiuxianKbItem.alwaysInclude);
            console.log('📍 Vị trí Index:', xiuxianIndex);
        } else {
            console.log('❌ Không tìm thấy quy tắc Tu tiên trong kho kiến thức');
        }

        if (gameKbItem) {
            console.log('✅ Tồn tại System Prompt cơ bản (Vị trí thứ hai)');
            console.log('📋 Tiêu đề:', gameKbItem.title);
            console.log('📏 Độ dài:', gameKbItem.content.length);
            console.log('📍 Vị trí Index:', gameIndex);
        } else {
            console.log('❌ Không tìm thấy System Prompt cơ bản trong kho kiến thức');
        }

        // Thống kê tổng số System Prompt ưu tiên cao
        const highPrioritySystemPrompts = window.contextVectorManager.staticKnowledgeBase.filter(
            item => item.category === 'Hệ thống' && item.priority === 'high'
        );
        console.log('📊 Tổng số System Prompt ưu tiên cao:', highPrioritySystemPrompts.length);
        console.log('📊 3 mục đầu tiên của kho kiến thức:', window.contextVectorManager.staticKnowledgeBase.slice(0, 3).map(item => item.title));
    } else {
        console.log('❌ Trình quản lý Vector chưa được khởi tạo');
    }

    console.log('=== Kết thúc gỡ lỗi ===');
}

// Xem kho kiến thức tĩnh
function viewKnowledgeBase() {
    if (!window.contextVectorManager) {
        alert('Trình quản lý Vector chưa được khởi tạo!');
        return;
    }

    const kb = window.contextVectorManager.staticKnowledgeBase;

    if (kb.length === 0) {
        alert('Kho kiến thức tĩnh đang trống!\n\nBạn có thể:\n1. Nhấp vào "Nhập tệp kho kiến thức" để tải dữ liệu có sẵn\n2. Nhấp vào "Tạo mẫu" để tạo khung kho kiến thức');
        return;
    }

    // Xây dựng nội dung HTML
    let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📚 Trình xem kho kiến thức tĩnh</h2>
                    <button onclick="document.getElementById('knowledgeBaseModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Đóng</button>
                </div>
                
                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${kb.length}</div>
                            <div style="font-size: 12px; color: #666;">Tổng số mục</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${window.contextVectorManager.embeddingMethod}</div>
                            <div style="font-size: 12px; color: #666;">Phương pháp Vector hóa</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ff6b6b;">${kb.filter(item => item.category === 'dlc').length}</div>
                            <div style="font-size: 12px; color: #666;">📦 Mục DLC</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #ff6b6b;">${kb.filter(item => item.alwaysInclude === true).length}</div>
                            <div style="font-size: 11px; color: #666;">Kiến thức thường trú</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #764ba2;">${kb.filter(item => item.priority === 'top').length}</div>
                            <div style="font-size: 10px; color: #666;">👑Trên cùng</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #ff4444;">${kb.filter(item => item.priority === 'high').length}</div>
                            <div style="font-size: 10px; color: #666;">⭐Trọng điểm</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #ffa500;">${kb.filter(item => item.priority === 'medium').length}</div>
                            <div style="font-size: 10px; color: #666;">📌Thứ yếu</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #999;">${kb.filter(item => item.priority === 'low' || (item.alwaysInclude && !item.priority)).length}</div>
                            <div style="font-size: 10px; color: #666;">📋Không trọng điểm</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #28a745;">${kb.filter(item => item.vector && Array.isArray(item.vector)).length}</div>
                            <div style="font-size: 11px; color: #666;">Vector dày đặc</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #17a2b8;">${kb.filter(item => item.vector && !Array.isArray(item.vector)).length}</div>
                            <div style="font-size: 11px; color: #666;">Vector thưa thớt</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; text-align: center;">
                        <div style="font-size: 12px; color: #666;">
                            💾 Vị trí lưu trữ: IndexedDB (xiuxian_vector_db → staticKB)
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <button onclick="addNewKBItem()" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.6)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.4)'">
                        ➕ Thêm mục mới
                    </button>
                    
                    <input type="text" id="kbSearchInput" placeholder="🔍 Nhập từ khóa để tìm kiếm kiến thức..." 
                        style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterKBList(this.value)">
                </div>

                <div id="kbListContainer" style="max-height: 500px; overflow-y: auto;">
            `;

    kb.forEach((item, index) => {
        const tagsHtml = item.tags.length > 0
            ? item.tags.map(tag => `<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 3px;">${tag}</span>`).join('')
            : '<span style="color: #999; font-size: 11px;">Không có thẻ</span>';

        let typeBadge = '';
        let priorityBadge = ''; 
        let vectorBadge = '';
        let vectorInfo = '';
        let itemStyle = '';

        if (item.id === 'system_prompt_main') {
            typeBadge = '<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🎮 Hệ thống</span>';
            itemStyle = 'border: 3px solid #667eea !important;';
        } else if (item.category === 'dlc') {
            typeBadge = '<span style="background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📦 DLC</span>';
            itemStyle = 'border: 2px solid #ff6b6b !important; background: linear-gradient(135deg, #fff5f5 0%, #fffbf0 100%) !important;';
        } else if (item.alwaysInclude === true) {
            if (item.priority === 'top') {
                priorityBadge = '<span style="background: linear-gradient(45deg, #ff6b6b, #764ba2); color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">👑 Trên cùng</span>';
                itemStyle = 'border: 3px solid #764ba2 !important; box-shadow: 0 0 10px rgba(118, 75, 162, 0.3) !important;';
            } else if (item.priority === 'high') {
                priorityBadge = '<span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">⭐ Trọng điểm</span>';
                itemStyle = 'border: 2px solid #ff4444 !important;';
            } else if (item.priority === 'medium') {
                priorityBadge = '<span style="background: #ffa500; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📌 Thứ yếu</span>';
                itemStyle = 'border: 2px solid #ffa500 !important;';
            } else {
                priorityBadge = '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📋 Không trọng điểm</span>';
            }
            typeBadge = '<span style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">Thường trú</span>';
        }

        if (item.vector) {
            if (Array.isArray(item.vector)) {
                vectorBadge = '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🔢 Vector dày đặc</span>';
                vectorInfo = `Chiều: ${item.vector.length}`;
            } else {
                const keyCount = Object.keys(item.vector).length;
                vectorBadge = '<span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📊 Vector thưa thớt</span>';
                vectorInfo = `Từ khóa: ${keyCount}`;
            }
        } else if (item.alwaysInclude === true) {
            vectorBadge = '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🚫 Không cần Vector</span>';
            vectorInfo = 'Luôn có hiệu lực';
        } else {
            vectorBadge = '<span style="background: #ffc107; color: #333; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">⏳ Tạo sau</span>';
            vectorInfo = 'Tạo thời gian thực khi tìm kiếm';
        }

        htmlContent += `
                    <div class="kb-item" data-index="${index}" style="
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        border: 2px solid ${item.id === 'system_prompt_main' ? '#667eea' : '#e0e0e0'};
                        cursor: pointer;
                        transition: all 0.3s;
                        ${itemStyle}
                    " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f8f9ff';"
                       onmouseout="this.style.borderColor='${item.id === 'system_prompt_main' ? '#667eea' : '#e0e0e0'}'; this.style.background='white';"
                       onclick="showKBDetail(${index})">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">
                                ${priorityBadge}${typeBadge}
                                <span style="background: #764ba2; color: white; padding: 3px 10px; border-radius: 5px; font-size: 11px; margin-right: 5px;">${item.category}</span>
                                <span style="font-weight: bold; color: #667eea; font-size: 15px;">${item.title}</span>
                            </div>
                            ${item.id === 'system_prompt_main' ? '' : `<button onclick="event.stopPropagation(); deleteKBItem(${index})" style="
                                padding: 4px 10px;
                                background: #dc3545;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 11px;
                            ">Xóa</button>`}
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 13px; color: #333; line-height: 1.6;">
                                ${(() => {
                let contentText = item.content;
                if (typeof item.content === 'object' && item.content !== null) {
                    contentText = JSON.stringify(item.content, null, 2);
                }
                return contentText.length > 150 ? contentText.substring(0, 150) + '...' : contentText;
            })()}
                            </div>
                        </div>
                        
                        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>${tagsHtml}</div>
                            <div style="text-align: right;">
                                ${vectorBadge}
                                <span style="font-size: 10px; color: #999;">${vectorInfo}</span>
                            </div>
                        </div>
                    </div>
                `;
    });

    htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="testKBRetrieval()" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 Kiểm tra tìm kiếm</button>
                </div>
            `;

    // Tạo modal
    const modal = document.createElement('div');
    modal.id = 'knowledgeBaseModal';
    modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;

    const content = document.createElement('div');
    content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 1000px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
    content.innerHTML = htmlContent;

    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Lọc danh sách kho kiến thức
function filterKBList(keyword) {
    const items = document.querySelectorAll('.kb-item');
    const lowerKeyword = keyword.toLowerCase();

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(lowerKeyword)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Hiển thị chi tiết mục kho kiến thức
function showKBDetail(index) {
    const item = window.contextVectorManager.staticKnowledgeBase[index];
    if (!item) return;

    let alwaysIncludeBadge = '';
    if (item.id === 'system_prompt_main') {
        alwaysIncludeBadge = `
                    <div style="background: #e7f0ff; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">🎮 System Prompt (Cốt lõi)</div>
                        <div style="font-size: 13px; line-height: 1.8; color: #666;">
                            ✅ Đây là quy tắc hành vi cốt lõi của AI, sẽ được gửi đi đầu tiên trong mỗi yêu cầu<br>
                            🔧 Điều khiển định dạng phản hồi, phong cách cốt truyện, quy tắc trò chơi, v.v.<br>
                            💡 Bạn có thể chỉnh sửa trực tiếp tại đây mà không cần vào Cài đặt<br>
                            ⚠️ Thay đổi sẽ có hiệu lực ngay lập tức (sử dụng trong cuộc đối thoại tiếp theo)<br>
                            🚫 Mục này không thể xóa, nhưng có thể chỉnh sửa nội dung
                        </div>
                    </div>
                `;
    } else if (item.alwaysInclude === true) {
        let priorityInfo = {
            top: {
                icon: '👑',
                title: 'Kiến thức thường trú 【Trên cùng】',
                color: '#764ba2',
                bg: '#f3e8ff',
                desc: '👑 Độc chiếm vị trí cao nhất, nằm ở P0.5 (Vượt qua mọi nội dung khác)<br>🚀 Có mức ưu tiên tuyệt đối, hiển thị độc lập<br>💡 Áp dụng cho: Quy tắc cốt lõi, Quy tắc trò chơi Tu tiên<br>⚠️ Tiêu tốn Token mức trung bình nhưng hiệu quả tốt nhất'
            },
            high: {
                icon: '⭐',
                title: 'Kiến thức thường trú 【Trọng điểm】',
                color: '#ff4444',
                bg: '#ffe6e6',
                desc: '✅ Tự động đưa vào mỗi khi gửi yêu cầu, nằm ở P2.5 (Chỉ sau phản hồi gần nhất của AI)<br>🔥 Được AI cực kỳ chú trọng<br>💡 Áp dụng cho: Thiết lập quan trọng hiện tại, Quy tắc trọng yếu<br>⚠️ Tiêu tốn khá nhiều Token'
            },
            medium: {
                icon: '📌',
                title: 'Kiến thức thường trú 【Thứ yếu】',
                color: '#ffa500',
                bg: '#fff4e6',
                desc: '✅ Tự động đưa vào mỗi khi gửi yêu cầu, nằm ở P3.5 (Chỉ sau lịch sử tìm kiếm Vector)<br>📊 AI chú trọng mức trung bình<br>💡 Áp dụng cho: Thế giới quan quan trọng, Bối cảnh cốt lõi<br>⚠️ Tiêu tốn Token mức vừa phải'
            },
            low: {
                icon: '📋',
                title: 'Kiến thức thường trú 【Không trọng điểm】',
                color: '#999',
                bg: '#f5f5f5',
                desc: '✅ Tự động đưa vào mỗi khi gửi yêu cầu, nằm ở P5 (Vị trí phía sau)<br>📄 AI chú trọng mức thấp<br>💡 Áp dụng cho: Thiết lập chung, Thông tin tham khảo<br>👍 Tiêu tốn ít Token'
            }
        };

        const p = item.priority || 'low';
        const info = priorityInfo[p];

        alwaysIncludeBadge = `
                    <div style="background: ${info.bg}; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid ${info.color};">
                        <div style="font-weight: bold; color: ${info.color}; margin-bottom: 8px;">${info.icon} ${info.title}</div>
                        <div style="font-size: 13px; line-height: 1.8; color: #666;">
                            ${info.desc}
                        </div>
                    </div>
                `;
    }

    let vectorStatusHtml = '';
    if (item.vector) {
        if (Array.isArray(item.vector)) {
            const preview = item.vector.slice(0, 5).map(v => v.toFixed(4)).join(', ');
            vectorStatusHtml = `
                        <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">🔢 Thông tin Vector dày đặc</div>
                            <div style="font-size: 13px; line-height: 1.8;">
                                📏 Số chiều: ${item.vector.length}<br>
                                🎯 Loại Vector: Dense (Mảng)<br>
                                💾 Đã lưu vào: IndexedDB<br>
                                📊 Xem trước: [${preview}, ...]<br>
                                ${item.alwaysInclude ? '⚠️ Kiến thức thường trú không cần Vector, dữ liệu này sẽ không được dùng' : '✅ Sử dụng Vector này khi tìm kiếm (Khớp chính xác)'}
                            </div>
                        </div>
                    `;
        } else {
            const keywords = Object.keys(item.vector);
            const topKeywords = Object.entries(item.vector)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([k, v]) => `${k}(${v.toFixed(2)})`)
                .join(', ');
            vectorStatusHtml = `
                        <div style="background: #e7f5ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">📊 Thông tin Vector thưa thớt</div>
                            <div style="font-size: 13px; line-height: 1.8;">
                                📏 Số lượng từ khóa: ${keywords.length}<br>
                                🎯 Loại Vector: Sparse (Đối tượng)<br>
                                💾 Đã lưu vào: IndexedDB<br>
                                🔑 Từ khóa hàng đầu: ${topKeywords}<br>
                                ${item.alwaysInclude ? '⚠️ Kiến thức thường trú không cần Vector, dữ liệu này sẽ không được dùng' : '✅ Sử dụng Vector này khi tìm kiếm (Khớp từ khóa)'}
                            </div>
                        </div>
                    `;
        }
    } else if (!item.alwaysInclude) {
        vectorStatusHtml = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">⏳ Vector hóa trễ</div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            📏 Trạng thái Vector: Chưa tạo sẵn<br>
                            🎯 Chiến lược: Tạo Vector từ khóa thời gian thực khi tìm kiếm<br>
                            💡 Giải thích: Kho kiến thức lớn (100+ mục) dùng chiến lược này để tiết kiệm bộ nhớ<br>
                            ⚡ Hiệu năng: Tạo ở lần tìm đầu tiên, sau đó lưu vào bộ nhớ đệm
                        </div>
                    </div>
                `;
    }

    const detailHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📋 Chi tiết kiến thức</h2>
                    <button onclick="document.getElementById('kbDetailModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Đóng</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 Thông tin cơ bản</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        🏷️ ID：${item.id}<br>
                        📂 Phân loại：${item.category}<br>
                        🏷️ Thẻ：${item.tags.length > 0 ? item.tags.join(', ') : 'Không có'}
                    </div>
                </div>

                ${alwaysIncludeBadge}
                ${vectorStatusHtml}

                <div style="background: #e7f5ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px; font-size: 18px;">${item.title}</div>
                </div>

                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">📄 Nội dung</div>
                    <div id="kbContent-${index}" style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">
                        ${(() => {
            let contentText = item.content;
            if (typeof item.content === 'object' && item.content !== null) {
                contentText = JSON.stringify(item.content, null, 2);
            }
            return contentText;
        })()}
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    ${!item.alwaysInclude && item.id !== 'system_prompt_main' ? `<button onclick="testKBItemRetrieval(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 Thử độ tương đồng</button>` : ''}
                    
                    <button onclick="editKBItem(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">✏️ Sửa ${item.id === 'system_prompt_main' ? 'System Prompt' : 'Nội dung'}</button>
                    
                    ${item.id === 'system_prompt_main' ? '' : `<button onclick="changeKBPriority(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🎯 Đổi ưu tiên</button>`}
                </div>
            `;

    const modal = document.createElement('div');
    modal.id = 'kbDetailModal';
    modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;

    const content = document.createElement('div');
    content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
    content.innerHTML = detailHtml;

    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Xóa mục kho kiến thức
async function deleteKBItem(index) {
    const item = window.contextVectorManager.staticKnowledgeBase[index];

    if (item.id === 'system_prompt_main') {
        alert('❌ Không thể xóa System Prompt!\n\nĐây là quy tắc cốt lõi của AI. Bạn chỉ có thể sửa nội dung của nó.');
        return;
    }

    if (!confirm(`Bạn có chắc muốn xóa "${item.title}" không?\n\nMục này sẽ bị xóa khỏi bộ nhớ và IndexedDB.`)) return;

    window.contextVectorManager.staticKnowledgeBase.splice(index, 1);
    await window.contextVectorManager.saveStaticKBToIndexedDB();

    alert('✅ Đã xóa và cập nhật IndexedDB');

    document.getElementById('knowledgeBaseModal')?.remove();
    viewKnowledgeBase();
}

// Xóa sạch kho kiến thức
async function clearKnowledgeBase() {
    if (!confirm('⚠️ Bạn có chắc muốn xóa toàn bộ kho kiến thức tĩnh không?\n\nToàn bộ kiến thức sẽ bị xóa. System Prompt sẽ tự động được tạo lại khi khởi động lần sau.\n\nHành động này không thể hoàn tác!')) {
        return;
    }

    window.contextVectorManager.clearStaticKB();
    await window.contextVectorManager.saveStaticKBToIndexedDB();

    await ensureSystemPromptInKB();

    alert('✅ Kho kiến thức tĩnh đã được dọn sạch!\n\nDữ liệu trong bộ nhớ và IndexedDB đã bị xóa. System Prompt đã được tạo lại tự động.');
}

// Kiểm tra tìm kiếm trong kho kiến thức
async function testKBRetrieval() {
    const keyword = prompt('Nhập nội dung cần tìm (ví dụ: Thanh Vân Tông, Pháp bảo, Trúc Cơ...):');
    if (!keyword) return;

    const results = await window.contextVectorManager.retrieveFromStaticKB(keyword, 5);

    if (results.length === 0) {
        alert('❌ Không tìm thấy kiến thức liên quan\n\nGợi ý:\n- Điều chỉnh ngưỡng tương đồng\n- Kiểm tra lại từ khóa\n- Đảm bảo kho kiến thức có nội dung tương ứng');
        return;
    }

    let resultText = `🔍 Kết quả tìm kiếm (Tìm thấy ${results.length} mục)\n\n`;

    results.forEach((item, index) => {
        resultText += `━━━━━━━━━━━━━━━━━━━━\n`;
        resultText += `${index + 1}. [${item.category}] ${item.title}\n`;
        resultText += `   Độ tương đồng: ${(item.similarity * 100).toFixed(2)}%\n`;
        resultText += `   Nội dung: ${item.content.substring(0, 100)}...\n\n`;
    });

    alert(resultText);
    console.log('[Test tìm kiếm KB] Từ khóa:', keyword);
    console.log('[Test tìm kiếm KB] Kết quả:', results);
}

// Kiểm tra độ tương đồng Vector của một mục duy nhất
async function testKBItemRetrieval(itemIndex) {
    const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
    if (!item) return;

    const keyword = prompt(`Nhập từ khóa test (để tính độ tương đồng với "${item.title}"):`, item.tags[0] || '');
    if (!keyword) return;

    const queryVector = window.contextVectorManager.createKeywordVector(keyword);

    let itemVector;
    if (item.vector) {
        itemVector = item.vector;
    } else {
        itemVector = window.contextVectorManager.createKeywordVector(item.content);
    }

    const similarity = window.contextVectorManager.calculateCosineSimilarity(queryVector, itemVector);

    let commonKeywords = '';
    if (!Array.isArray(queryVector) && !Array.isArray(itemVector)) {
        const queryKeys = Object.keys(queryVector);
        const itemKeys = Object.keys(itemVector);
        const common = queryKeys.filter(k => itemKeys.includes(k));
        commonKeywords = common.length > 0 ? `\n\n🔑 Từ khóa chung (${common.length}):\n${common.slice(0, 15).join('、')}` : '\n\n⚠️ Không có từ khóa chung';
    }

    const threshold = window.contextVectorManager.minSimilarityThreshold * 0.5;
    const wouldMatch = similarity >= threshold;

    alert(`🧪 Kết quả thử nghiệm độ tương đồng Vector\n\n` +
        `📋 Kiến thức: ${item.title}\n` +
        `🔍 Từ khóa: "${keyword}"\n\n` +
        `📊 Độ tương đồng: ${(similarity * 100).toFixed(2)}%\n` +
        `🎯 Ngưỡng: ${(threshold * 100).toFixed(2)}%\n\n` +
        `${wouldMatch ? '✅ Cao hơn ngưỡng, sẽ được khớp khi tìm kiếm' : '❌ Thấp hơn ngưỡng, sẽ không hiện ra'}` +
        commonKeywords +
        `\n\n💡 Loại Vector: ${Array.isArray(itemVector) ? 'Dense(Dày đặc)' : 'Sparse(Thưa thớt)'}`);
}

// Thêm mục kiến thức mới
async function addNewKBItem() {
    const formHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">➕ Thêm mục kiến thức mới</h2>
                    <button onclick="document.getElementById('addKBModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Đóng</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📝 Tiêu đề (Bắt buộc)</label>
                        <input type="text" id="newKBTitle" placeholder="Ví dụ: Lý Thanh Vân, Thanh Vân Tông, Trúc Cơ Kỳ..." 
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📂 Phân loại (Bắt buộc)</label>
                        <select id="newKBCategory" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                            <option value="Nhân vật">Nhân vật</option>
                            <option value="Tông môn">Tông môn</option>
                            <option value="Cảnh giới">Cảnh giới</option>
                            <option value="Đan dược">Đan dược</option>
                            <option value="Công pháp">Công pháp</option>
                            <option value="Pháp bảo">Pháp bảo</option>
                            <option value="Địa điểm">Địa điểm</option>
                            <option value="Thiết lập">Thiết lập thế giới</option>
                            <option value="Quy tắc">Quy tắc trò chơi</option>
                            <option value="Chung">Chung</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📄 Nội dung (Bắt buộc, nên từ 100-500 chữ)</label>
                        <textarea id="newKBContent" placeholder="Nhập nội dung chi tiết..." 
                            style="width: 100%; min-height: 200px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">
                            Số chữ hiện tại: <span id="contentCharCount">0</span> chữ
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">🏷️ Thẻ (Tùy chọn, cách nhau bằng dấu phẩy hoặc khoảng trắng)</label>
                        <input type="text" id="newKBTags" placeholder="Ví dụ: Lý Thanh Vân, Thanh Vân Tông, Kim Đan Kỳ" 
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">
                            💡 Thẻ dùng để tìm kiếm, ngăn cách nhiều thẻ bằng dấu phẩy hoặc khoảng trắng
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #667eea;">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">🎯 Loại kiến thức và Mức ưu tiên</div>
                        <select id="newKBPriority" style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #667eea;
                            border-radius: 5px;
                            font-size: 14px;
                            cursor: pointer;
                            background: white;
                        " onchange="updatePriorityDescription(this.value)">
                            <option value="">🔍 Kiến thức tìm kiếm Vector (Mặc định)</option>
                            <option value="top">👑 Thường trú 【Trên cùng】- P0.5 Cao nhất</option>
                            <option value="high">⭐ Thường trú 【Trọng điểm】- P2.5 Cao</option>
                            <option value="medium">📌 Thường trú 【Thứ yếu】- P3.5 Trung bình</option>
                            <option value="low">📋 Thường trú 【Không trọng điểm】- P5 Thấp</option>
                        </select>
                        <div id="priorityDescription" style="font-size: 12px; color: #666; margin-top: 10px; line-height: 1.6;">
                            🔍 Chỉ xuất hiện khi khớp Vector tương ứng<br>
                            💡 Áp dụng cho: Lượng lớn thông tin bổ trợ, nội dung tùy chọn
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="saveNewKBItem()" style="
                            flex: 1;
                            padding: 15px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
                        ">💾 Lưu và tạo Vector</button>
                        
                        <button onclick="document.getElementById('addKBModal').remove()" style="
                            flex: 0 0 120px;
                            padding: 15px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">Hủy</button>
                    </div>
                </div>
            `;

    const modal = document.createElement('div');
    modal.id = 'addKBModal';
    modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;

    const content = document.createElement('div');
    content.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
    content.innerHTML = formHtml;

    modal.appendChild(content);
    document.body.appendChild(modal);

    const textarea = document.getElementById('newKBContent');
    textarea.addEventListener('input', function () {
        document.getElementById('contentCharCount').textContent = this.value.length;
    });

    modal.onclick = function (e) {
        if (e.target === modal) {
            if (confirm('Bạn có chắc muốn đóng? Nội dung chưa lưu sẽ bị mất.')) {
                modal.remove();
            }
        }
    };
}

// Cập nhật mô tả mức độ ưu tiên
function updatePriorityDescription(priority) {
    const descEl = document.getElementById('priorityDescription');
    if (!descEl) return;

    const descriptions = {
        '': '🔍 Chỉ xuất hiện khi khớp Vector tương ứng<br>💡 Áp dụng cho: Lượng lớn thông tin bổ trợ, nội dung tùy chọn',
        'top': '👑 Độc chiếm vị trí cao nhất (P0.5)<br>🚀 Ưu tiên tuyệt đối, hiển thị riêng biệt<br>💡 Áp dụng cho: Quy tắc cốt lõi<br>⚠️ Hiệu quả tốt nhất nhưng cần cân nhắc Token',
        'high': '⭐ Luôn tự động đưa vào (P2.5)<br>🔥 Được AI chú trọng nhất trong các mục thường trú<br>💡 Áp dụng cho: Thiết lập/Quy tắc quan trọng',
        'medium': '📌 Luôn tự động đưa vào (P3.5)<br>📊 AI chú trọng mức vừa phải<br>💡 Áp dụng cho: Thế giới quan, bối cảnh cốt lõi',
        'low': '📋 Luôn tự động đưa vào (P5)<br>📄 Vị trí ở phía cuối ngữ cảnh<br>💡 Áp dụng cho: Thông tin tham khảo chung'
    };

    descEl.innerHTML = descriptions[priority] || descriptions[''];
}

// Lưu mục kho kiến thức mới
async function saveNewKBItem() {
    const title = document.getElementById('newKBTitle').value.trim();
    const category = document.getElementById('newKBCategory').value;
    const content = document.getElementById('newKBContent').value.trim();
    const tagsInput = document.getElementById('newKBTags').value.trim();
    const priority = document.getElementById('newKBPriority').value; // 'high'/'medium'/'low'/''

    // Kiểm tra các mục bắt buộc
    if (!title) {
        alert('Vui lòng nhập tiêu đề!');
        return;
    }
    if (!content) {
        alert('Vui lòng nhập nội dung!');
        return;
    }
    if (content.length < 20) {
        alert('Nội dung quá ngắn! Đề nghị ít nhất 20 chữ.');
        return;
    }

    // Phân tích thẻ (tags)
    const tags = tagsInput
        ? tagsInput.split(/[,，\s]+/).map(t => t.trim()).filter(t => t)
        : [];

    // Tạo ID duy nhất
    const id = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Tạo mục mới
    const alwaysInclude = priority !== ''; // Chỉ cần có priority là mục thường trú
    const newItem = {
        id: id,
        title: title,
        content: content,
        category: category,
        tags: tags,
        alwaysInclude: alwaysInclude,
        priority: priority || undefined, // high/medium/low, nếu trống là undefined
        metadata: {
            createdAt: new Date().toISOString(),
            source: 'manual'
        }
    };

    // Hiển thị thông báo đang tải
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'kbItemSaving';
    loadingMsg.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10002;
                text-align: center;
            `;
    loadingMsg.innerHTML = `
                <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                    💾 Đang lưu và tạo vector...
                </div>
                <div class="loading" style="margin: 20px auto;"></div>
                <div style="font-size: 13px; color: #666; margin-top: 10px;">
                    ${alwaysInclude ? '⭐ Kiến thức thường trú' : '🔍 Cần tìm kiếm khớp lệnh'}
                </div>
            `;
    document.body.appendChild(loadingMsg);

    try {
        // Tạo vector dựa trên cài đặt
        const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';

        if (alwaysInclude) {
            // Kiến thức thường trú không cần vector
            newItem.vector = null;
            newItem.vectorType = 'always';
            loadingMsg.querySelector('div:nth-child(1)').innerHTML = '💾 Đang lưu kiến thức thường trú...';
        } else if (vectorMethod === 'transformers') {
            // Sử dụng mô hình trình duyệt tạo vector dày đặc (dense)
            loadingMsg.querySelector('div:nth-child(1)').innerHTML = '🤖 Đang tạo vector dày đặc...';
            const denseVector = await window.contextVectorManager.getEmbeddingFromTransformers(content);
            newItem.vector = denseVector;
            newItem.vectorType = 'dense';
        } else if (vectorMethod === 'api') {
            // Sử dụng API tạo vector dày đặc
            loadingMsg.querySelector('div:nth-child(1)').innerHTML = '🌐 Đang gọi API tạo vector...';
            const apiVector = await window.contextVectorManager.getEmbeddingFromAPI(content);
            newItem.vector = apiVector;
            newItem.vectorType = 'dense';
        } else {
            // Sử dụng phương pháp từ khóa tạo vector thưa thớt (sparse)
            loadingMsg.querySelector('div:nth-child(1)').innerHTML = '📊 Đang tạo vector từ khóa...';
            const keywordVector = window.contextVectorManager.createKeywordVector(content);
            newItem.vector = keywordVector;
            newItem.vectorType = 'sparse';
        }

        // Thêm vào kho kiến thức
        window.contextVectorManager.staticKnowledgeBase.push(newItem);

        // Lưu vào IndexedDB
        await window.contextVectorManager.saveStaticKBToIndexedDB();

        loadingMsg.remove();

        // Xây dựng thông báo thành công
        let successMsg = `✅ Mục kiến thức đã được lưu!\n\n📋 Tiêu đề：${title}\n📂 Phân loại：${category}\n📝 Nội dung：${content.length} chữ\n🏷️ Thẻ：${tags.length} cái`;

        if (alwaysInclude) {
            successMsg += `\n\n⭐ Kiến thức thường trú: Luôn tự động đưa vào ngữ cảnh`;
        } else if (newItem.vector) {
            if (Array.isArray(newItem.vector)) {
                successMsg += `\n\n🔢 Vector dày đặc: Chiều ${newItem.vector.length}`;
            } else {
                successMsg += `\n\n📊 Vector thưa thớt: ${Object.keys(newItem.vector).length} từ khóa`;
            }
            successMsg += `\n💡 Sẽ tìm kiếm khớp dựa trên độ tương đồng`;
        }

        successMsg += `\n\n💾 Đã lưu vào: IndexedDB`;

        alert(successMsg);

        // Đóng form
        document.getElementById('addKBModal')?.remove();

        // Làm mới hiển thị kho kiến thức
        document.getElementById('knowledgeBaseModal')?.remove();
        viewKnowledgeBase();

    } catch (error) {
        loadingMsg.remove();
        alert(`❌ Lưu thất bại：${error.message}\n\nNguyên nhân khả nghi：\n- Tạo vector thất bại\n- Lỗi IndexedDB\n\nGợi ý: Kiểm tra console (F12) để biết chi tiết`);
        console.error('[Thêm mục kho kiến thức] Thất bại:', error);
    }
}

// Chỉnh sửa mục kho kiến thức (WYSIWYG)
async function editKBItem(itemIndex) {
    const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
    if (!item) return;

    const isSystemPrompt = item.id === 'system_prompt_main';

    // Tìm khu vực hiển thị nội dung
    const contentDiv = document.getElementById(`kbContent-${itemIndex}`);
    if (!contentDiv) {
        alert('Không tìm thấy khu vực nội dung!');
        return;
    }

    // Lưu nội dung gốc
    const originalContent = item.content;

    // Tạo textarea
    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
                width: 100%;
                min-height: 300px;
                padding: 12px;
                border: 3px solid #667eea;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.6;
                resize: vertical;
                font-family: inherit;
                box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
            `;
    textarea.value = originalContent;

    // Thống kê chữ thời gian thực
    const charCounter = document.createElement('div');
    charCounter.style.cssText = 'font-size: 12px; color: #666; margin-top: 8px;';
    charCounter.innerHTML = `Số chữ hiện tại：<span id="editCharCount">${originalContent.length}</span> chữ`;

    textarea.addEventListener('input', function () {
        document.getElementById('editCharCount').textContent = this.value.length;
    });

    // Tạo container chứa nút
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';

    // Nút Lưu
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-success';
    saveBtn.style.cssText = 'flex: 1; padding: 12px; font-size: 14px;';
    saveBtn.innerHTML = '💾 Lưu và tạo vector';
    saveBtn.onclick = async () => {
        const newContent = textarea.value.trim();

        if (!newContent) {
            alert('Nội dung không được để trống!');
            return;
        }

        if (newContent === originalContent) {
            alert('Nội dung không có thay đổi!');
            return;
        }

        // Cập nhật nội dung
        item.content = newContent;

        // System prompt không cần tạo vector
        if (isSystemPrompt) {
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            alert('✅ System prompt đã cập nhật!\n\nThay đổi sẽ có hiệu lực từ cuộc đối thoại tới.\nĐã lưu vào IndexedDB.');

            // Làm mới hiển thị
            document.getElementById('kbDetailModal')?.remove();
            viewKnowledgeBase();
            return;
        }

        // Kiến thức thông thường: Tạo vector dựa trên phương pháp
        const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';

        // Hiển thị thông báo đang tải
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'vectorGenerating';
        loadingMsg.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10003;
                    text-align: center;
                `;

        try {
            if (vectorMethod === 'transformers') {
                // Tạo vector dày đặc
                loadingMsg.innerHTML = `
                            <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                                🤖 Đang tạo vector dày đặc...
                            </div>
                            <div class="loading" style="margin: 20px auto;"></div>
                        `;
                document.body.appendChild(loadingMsg);

                const denseVector = await window.contextVectorManager.getEmbeddingFromTransformers(newContent);
                item.vector = denseVector;
                item.vectorType = 'dense';

                loadingMsg.remove();

                await window.contextVectorManager.saveStaticKBToIndexedDB();
                alert(`✅ Nội dung đã cập nhật và tạo vector dày đặc!\n\nChiều：${denseVector.length}\nĐã lưu vào IndexedDB`);
            } else if (vectorMethod === 'api') {
                // Tạo vector qua API
                loadingMsg.innerHTML = `
                            <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                                🌐 Đang gọi API tạo vector...
                            </div>
                            <div class="loading" style="margin: 20px auto;"></div>
                        `;
                document.body.appendChild(loadingMsg);

                const apiVector = await window.contextVectorManager.getEmbeddingFromAPI(newContent);
                item.vector = apiVector;
                item.vectorType = 'dense';

                loadingMsg.remove();

                await window.contextVectorManager.saveStaticKBToIndexedDB();
                alert(`✅ Nội dung đã cập nhật và tạo vector qua API!\n\nChiều：${apiVector.length}\nĐã lưu vào IndexedDB`);
            } else {
                // Tạo vector từ khóa
                item.vector = window.contextVectorManager.createKeywordVector(newContent);
                item.vectorType = 'sparse';

                await window.contextVectorManager.saveStaticKBToIndexedDB();
                alert(`✅ Nội dung đã cập nhật và tạo vector từ khóa!\n\nTừ khóa：${Object.keys(item.vector).length} cái\nĐã lưu vào IndexedDB`);
            }

            // Làm mới hiển thị
            document.getElementById('kbDetailModal')?.remove();
            viewKnowledgeBase();

        } catch (error) {
            if (loadingMsg.parentNode) loadingMsg.remove();
            alert(`❌ Lưu thất bại：${error.message}`);
            console.error('[Chỉnh sửa kho kiến thức] Thất bại:', error);
        }
    };

    // Nút Hủy
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.cssText = 'flex: 0 0 120px; padding: 12px; font-size: 14px;';
    cancelBtn.innerHTML = '❌ Hủy';
    cancelBtn.onclick = () => {
        // Khôi phục hiển thị gốc
        contentDiv.innerHTML = originalContent;
        contentDiv.style.whiteSpace = 'pre-wrap';
        // Gỡ bỏ các yếu tố chỉnh sửa
        textarea.remove();
        charCounter.remove();
        buttonContainer.remove();
    };

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);

    // Thay thế nội dung bằng trạng thái chỉnh sửa
    const parentDiv = contentDiv.parentElement;
    contentDiv.style.display = 'none';

    // Chèn các yếu tố chỉnh sửa
    parentDiv.appendChild(textarea);
    parentDiv.appendChild(charCounter);
    parentDiv.appendChild(buttonContainer);

    // Tập trung vào textarea
    textarea.focus();
    textarea.setSelectionRange(0, 0); // Di chuyển con trỏ lên đầu
}

// 🎯 Thay đổi mức độ ưu tiên của mục kho kiến thức
async function changeKBPriority(itemIndex) {
    const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
    if (!item) {
        alert('❌ Không tìm thấy mục kho kiến thức!');
        return;
    }

    // Ngăn chỉnh sửa system prompt
    if (item.id === 'system_prompt_main') {
        alert('❌ Không thể sửa mức ưu tiên của system prompt!');
        return;
    }

    // Lấy ưu tiên hiện tại
    const currentPriority = item.alwaysInclude ? (item.priority || 'low') : '';

    // Tạo hộp thoại chọn ưu tiên
    const modal = document.createElement('div');
    modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10002;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;

    modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 100%;">
                    <div style="font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 20px;">
                        🎯 Sửa ưu tiên：${item.title}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Chọn mức ưu tiên mới：</div>
                        <select id="newPrioritySelect" style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px;">
                            <option value="" ${currentPriority === '' ? 'selected' : ''}>🔍 Kiến thức tìm kiếm vector (Mặc định)</option>
                            <option value="top" ${currentPriority === 'top' ? 'selected' : ''}>👑 Độc chiếm【Trên cùng】- P0 Ưu tiên cao nhất</option>
                            <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>⭐ Thường trú【Trọng điểm】- P2.5 Ưu tiên cao</option>
                            <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>📌 Thường trú【Thứ yếu】- P3.5 Ưu tiên trung bình</option>
                            <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>📋 Thường trú【Không trọng điểm】- P5 Ưu tiên thấp</option>
                        </select>
                    </div>
                    
                    <div id="priorityDesc" style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="confirmPriorityBtn" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ✅ Xác nhận
                        </button>
                        <button id="cancelPriorityBtn" style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ❌ Hủy
                        </button>
                    </div>
                </div>
            `;

    document.body.appendChild(modal);

    const selectEl = document.getElementById('newPrioritySelect');
    const descEl = document.getElementById('priorityDesc');
    const confirmBtn = document.getElementById('confirmPriorityBtn');
    const cancelBtn = document.getElementById('cancelPriorityBtn');

    const descriptions = {
        '': '🔍 Chỉ xuất hiện trong ngữ cảnh khi khớp vector<br>💡 Áp dụng cho: Lượng lớn thông tin bổ trợ, nội dung tùy chọn<br>👍 Hầu như không tiêu tốn thêm token',
        'top': '👑 Chiếm lĩnh vị trí trên cùng, tại P0 (Vượt qua tất cả nội dung khác)<br>🚀 Có mức ưu tiên tuyệt đối, hiển thị độc lập<br>💡 Áp dụng cho: Quy tắc cốt lõi, quy tắc trò chơi Tu tiên<br>⚠️ Tiêu tốn token mức trung bình, nhưng hiệu quả tốt nhất',
        'high': '⭐ Tự động đưa vào mỗi lần, tại P2.5 (Chỉ sau phản hồi AI gần nhất)<br>🔥 Được AI cực kỳ chú trọng<br>💡 Áp dụng cho: Thiết lập then chốt hiện tại, quy tắc quan trọng<br>⚠️ Tiêu tốn nhiều token',
        'medium': '📌 Tự động đưa vào mỗi lần, tại P3.5 (Chỉ sau lịch sử tìm kiếm vector)<br>📊 AI chú trọng mức vừa phải<br>💡 Áp dụng cho: Thế giới quan quan trọng, bối cảnh cốt lõi<br>⚠️ Tiêu tốn token mức vừa',
        'low': '📋 Tự động đưa vào mỗi lần, tại P5 (Vị trí phía sau)<br>📄 AI chú trọng mức thấp<br>💡 Áp dụng cho: Thiết lập chung, thông tin tham khảo<br>👍 Tiêu tốn ít token'
    };

    function updateDesc() {
        descEl.innerHTML = descriptions[selectEl.value] || descriptions[''];
    }

    updateDesc();
    selectEl.onchange = updateDesc;

    confirmBtn.onclick = async () => {
        const newPriority = selectEl.value;

        // Cập nhật thuộc tính item
        if (newPriority === '') {
            // Đặt thành kiến thức tìm kiếm vector
            item.alwaysInclude = false;
            delete item.priority;
        } else {
            // Đặt thành kiến thức thường trú
            item.alwaysInclude = true;
            item.priority = newPriority;
        }

        // Lưu vào IndexedDB
        await window.contextVectorManager.saveStaticKBToIndexedDB();

        const priorityNames = {
            '': 'Kiến thức tìm kiếm vector',
            'top': 'Độc chiếm【Trên cùng】',
            'high': 'Thường trú【Trọng điểm】',
            'medium': 'Thường trú【Thứ yếu】',
            'low': 'Thường trú【Không trọng điểm】'
        };

        alert(`✅ Ưu tiên đã cập nhật!\n\n"${item.title}"\nƯu tiên：${priorityNames[newPriority]}\n\nĐã lưu vào IndexedDB`);

        modal.remove();
        document.getElementById('kbDetailModal')?.remove();
        viewKnowledgeBase();
    };

    cancelBtn.onclick = () => {
        modal.remove();
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Xem trạng thái vector của kho kiến thức (Bản tóm tắt)
function viewKBVectorStatus() {
    if (!window.contextVectorManager) {
        alert('Trình quản lý vector chưa được khởi tạo!');
        return;
    }

    const kb = window.contextVectorManager.staticKnowledgeBase;

    if (kb.length === 0) {
        alert('Kho kiến thức tĩnh đang trống!');
        return;
    }

    // Thống kê loại vector
    const alwaysCount = kb.filter(item => item.alwaysInclude === true).length;
    const denseCount = kb.filter(item => item.vector && Array.isArray(item.vector)).length;
    const sparseCount = kb.filter(item => item.vector && !Array.isArray(item.vector)).length;
    const lazyCount = kb.filter(item => !item.vector && !item.alwaysInclude).length;

    let statusReport = `╔════════════════════════════════════════╗\n`;
    statusReport += `║   📚 Báo cáo trạng thái Vector Kho kiến thức     ║\n`;
    statusReport += `╠════════════════════════════════════════╣\n`;
    statusReport += `║  Tổng số mục：${kb.length.toString().padEnd(28)}║\n`;
    statusReport += `║  ⭐Kiến thức thường trú：${alwaysCount.toString().padEnd(24)}║\n`;
    statusReport += `║  🔢Vector dày đặc(Dense)：${denseCount.toString().padEnd(18)}║\n`;
    statusReport += `║  📊Vector thưa thớt(Sparse)：${sparseCount.toString().padEnd(17)}║\n`;
    statusReport += `║  ⏳Tạo sau(Lazy)：${lazyCount.toString().padEnd(18)}║\n`;
    statusReport += `╠════════════════════════════════════════╣\n`;
    statusReport += `║  💾 Vị trí lưu trữ：                        ║\n`;
    statusReport += `║     IndexedDB → xiuxian_vector_db      ║\n`;
    statusReport += `║     → staticKB Object Store            ║\n`;
    statusReport += `╠════════════════════════════════════════╣\n`;
    statusReport += `║  🎯 Phương pháp vector hóa：             ║\n`;
    statusReport += `║     ${window.contextVectorManager.embeddingMethod.padEnd(32)}║\n`;
    statusReport += `╠════════════════════════════════════════╣\n`;
    statusReport += `║  📋 Danh sách chi tiết：                   ║\n`;
    statusReport += `╚════════════════════════════════════════╝\n\n`;

    kb.forEach((item, idx) => {
        let prefix = '';
        let vectorType = '';
        let vectorSize = '';

        if (item.alwaysInclude === true) {
            prefix = '⭐';
            vectorType = 'Thường trú';
            vectorSize = 'Không cần vector';
        } else if (item.vector) {
            if (Array.isArray(item.vector)) {
                vectorType = '🔢Dense';
                vectorSize = `Chiều:${item.vector.length}`;
            } else {
                vectorType = '📊Sparse';
                vectorSize = `Từ khóa:${Object.keys(item.vector).length} cái`;
            }
        } else {
            vectorType = '⏳Lazy';
            vectorSize = 'Tạo sau';
        }

        statusReport += `${(idx + 1).toString().padStart(3)}. ${prefix}[${item.category}] ${item.title}\n`;
        statusReport += `     ${vectorType} | ${vectorSize}\n`;
        statusReport += `     Thẻ: ${item.tags.join(', ') || 'Không'}\n\n`;
    });

    statusReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    statusReport += `💡 Gợi ý：\n`;
    statusReport += `- ⭐Kiến thức thường trú: Luôn đưa vào ngữ cảnh, không cần tìm kiếm\n`;
    statusReport += `- 🔢Vector dày đặc: Tạo bởi mô hình trình duyệt, chính xác nhưng tốn không gian\n`;
    statusReport += `- 📊Vector thưa thớt: Tạo bởi phương pháp từ khóa, nhanh và tương thích tốt\n`;
    statusReport += `- ⏳Tạo sau: Chiến lược cho kho lớn (100+ mục), tiết kiệm không gian\n`;
    statusReport += `- Toàn bộ dữ liệu đã được lưu trong IndexedDB\n`;

    console.log(statusReport);
    alert('✅ Báo cáo trạng thái Vector đã được xuất ra console!\n\nNhấn F12 để xem chi tiết.\n\n' +
        `Tổng cộng：${kb.length} mục\n` +
        `⭐Thường trú：${alwaysCount} mục\n` +
        `Dày đặc：${denseCount} mục\n` +
        `Thưa thớt：${sparseCount} mục\n` +
        `Tạo sau：${lazyCount} mục`);
}

// Tạo mẫu kho kiến thức
function createKnowledgeTemplate() {
    const template = {
        "version": "1.0",
        "description": "Mẫu kho kiến thức tĩnh cho trò chơi Tu tiên",
        "knowledge": [
            {
                "id": "worldview_basic_001",
                "title": "Thiết lập cơ bản thế giới Tu tiên",
                "content": "Thế giới này là thế giới Tu tiên, tu sĩ tu luyện bằng cách hấp thụ linh khí của trời đất, có thể kéo dài tuổi thọ, ngự không, hô mưa gọi gió. Cảnh giới từ thấp đến cao gồm: Luyện Khí Kỳ, Trúc Cơ Kỳ, Kim Đan Kỳ, Nguyên Anh Kỳ, Hóa Thần Kỳ, Hợp Thể Kỳ, Đại Thừa Kỳ, Độ Kiếp Kỳ, Chân Tiên. Linh thạch là tiền tệ phổ biến, chia làm bốn cấp: Hạ phẩm, Trung phẩm, Thượng phẩm, Cực phẩm.",
                "category": "Thiết lập",
                "tags": ["Thế giới quan", "Cảnh giới", "Linh thạch", "Tu tiên"],
                "alwaysInclude": true,
                "priority": "high",
                "metadata": {
                    "type": "core"
                }
            },
            {
                "id": "sect_qingyun_001",
                "title": "Thông tin cơ bản Thanh Vân Tông",
                "content": "Thanh Vân Tông, đứng đầu bảy đại môn phái chính đạo trong giới tu chân, tọa lạc tại dãy núi Thanh Vân vùng Đông Vực. Tông môn có tổng cộng mười hai đỉnh núi, lần lượt là đỉnh chính Thông Thiên Phong, Đại Trúc Phong, Long Thủ Phong, Triều Dương Phong, v.v. Tông chủ tên là Đạo Huyền Chân Nhân, tu vi đã đạt Đại Thừa Kỳ. Đệ tử chia làm ba cấp: Ngoại môn, Nội môn, Truyền thừa, tổng cộng hơn ba nghìn người. Thanh Vân Tông lấy 'Thái Cực Huyền Thanh Đạo' làm tâm pháp căn bản, sở trường về thuật ngự kiếm.",
                "category": "Tông môn",
                "tags": ["Thanh Vân Tông", "Chính đạo", "Môn phái", "Đông Vực"],
                "alwaysInclude": true,
                "priority": "medium",
                "metadata": {
                    "region": "Đông Vực",
                    "alignment": "Chính đạo",
                    "strength": "Mạnh mẽ"
                }
            },
            {
                "id": "realm_foundation_001",
                "title": "Giải thích cảnh giới Trúc Cơ Kỳ",
                "content": "Trúc Cơ Kỳ là cảnh giới quan trọng sau Luyện Khí Kỳ. Tu sĩ ở giai đoạn này cần cô đọng chân khí, xây dựng đạo cơ, ngưng tụ linh khí rời rạc thành chân nguyên dạng lỏng. Trúc Cơ chia làm ba tiểu cảnh giới: Tiền, Trung, Hậu. Để đột phá Trúc Cơ cần thỏa mãn: 1. Tiến độ tu luyện đạt chuẩn 2. Chuẩn bị Trúc Cơ Đan hoặc có trưởng bối hộ pháp 3. Tìm nơi linh khí dồi dào để bế quan. Sau khi Trúc Cơ thành công, thọ nguyên tăng lên 200 tuổi, có thể ngự khí phi hành, pháp lực tăng gấp mười lần.",
                "category": "Cảnh giới",
                "tags": ["Trúc Cơ Kỳ", "Cảnh giới", "Đột phá"],
                "metadata": {
                    "realm": "Trúc Cơ Kỳ",
                    "difficulty": "Trung bình"
                }
            },
            {
                "id": "item_foundation_pill_001",
                "title": "Giới thiệu Trúc Cơ Đan",
                "content": "Trúc Cơ Đan, linh đan tam phẩm, nguyên liệu chính là Linh chi trăm năm, Tử huyết sâm, Thiên tâm thảo, v.v. Uống vào giúp tăng 30% tỷ lệ Trúc Cơ thành công, cô đọng chân nguyên, củng cố căn cơ. Giá thị trường khoảng 500 linh thạch. Cần luyện đan sư tam phẩm để luyện chế, tỷ lệ thành đan khoảng 50%. Tác dụng phụ: Uống liên tục quá ba viên sẽ sinh ra kháng dược.",
                "category": "Đan dược",
                "tags": ["Trúc Cơ Đan", "Đan dược", "Đột phá", "Bổ trợ"],
                "metadata": {
                    "grade": "Tam phẩm",
                    "price": 500
                }
            },
            {
                "id": "npc_elder_li_001",
                "title": "Bối cảnh nhân vật Lý trưởng lão",
                "content": "Lý trưởng lão, tên thật Lý Thanh Sơn, là Trưởng lão Chấp pháp Thanh Vân Tông, tu vi Kim Đan hậu kỳ, 156 tuổi. Tính cách cương trực, ghét ác như thù, cực kỳ coi trọng môn quy. Từng một mình chiến đấu với ba ma tu Kim Đan khi ma đạo vây đánh, trọng thương nhưng bảo toàn được truyền thừa tông môn. Rất chiếu cố đệ tử trẻ tài hoa, nhưng tuyệt không dung thứ kẻ vi phạm môn quy.",
                "category": "Nhân vật",
                "tags": ["Lý trưởng lão", "Thanh Vân Tông", "Chấp pháp", "Kim Đan Kỳ"],
                "metadata": {
                    "realm": "Kim Đan hậu kỳ",
                    "affiliation": "Thanh Vân Tông"
                }
            },
            {
                "id": "location_market_001",
                "title": "Phường thị trấn Vọng Tiên",
                "content": "Phường thị trấn Vọng Tiên, nằm dưới chân dãy núi Thanh Vân, là chợ giao dịch tu sĩ tự do lớn nhất Đông Vực. Nơi đây quy tụ tu sĩ tự do, thương nhân, kẻ tìm bảo vật từ khắp nơi. Phường thị chia làm bốn khu: Đông (Linh khí pháp bảo), Tây (Đan dược nguyên liệu), Nam (Công pháp bí tịch), Bắc (Tạp hóa khách sạn). Phường thị do Liên minh Tu sĩ Tự do quản lý, cấm tư đấu, kẻ vi phạm bị phạt nặng. Mỗi ngày rằm hàng tháng có buổi đấu giá lớn.",
                "category": "Địa điểm",
                "tags": ["Vọng Tiên", "Phường thị", "Giao dịch", "Đông Vực"],
                "metadata": {
                    "region": "Đông Vực",
                    "type": "Chợ"
                }
            }
        ],
        "instructions": "📖 Hướng dẫn sử dụng：\n\n1. Mỗi mục kiến thức gồm：\n   - id: Mã định danh duy nhất (Nếu trùng sẽ tự động ghi đè)\n   - title: Tiêu đề\n   - content: Nội dung chi tiết (Nên từ 100-500 chữ)\n   - category: Phân loại (Tông môn/Cảnh giới/Đan dược/Nhân vật/Địa điểm/Công pháp/Pháp bảo, v.v.)\n   - tags: Mảng các thẻ (Dùng để tìm kiếm)\n   - alwaysInclude: Đặt thành true để làm kiến thức thường trú (Luôn đưa vào ngữ cảnh, không cần tìm kiếm)\n   - priority: Mức ưu tiên (Chỉ có tác dụng với kiến thức thường trú)\n   - metadata: Dữ liệu bổ sung (Tùy chọn)\n\n2. Nếu không chứa trường vector, hệ thống sẽ tự động tạo khi nhập\n\n3. Có thể thêm nội dung đã được vector hóa (chứa trường vector) để tăng tốc độ tải\n\n4. Nên tổ chức nội dung theo phân loại để dễ quản lý\n\n5. Cài đặt ưu tiên kiến thức thường trú：\n   - Kiến thức có \"alwaysInclude\": true sẽ tự động được đưa vào khi xây dựng ngữ cảnh\n   - Không cần khớp vector hay tìm kiếm từ khóa\n   - Trường priority：\n     * \"high\" - Trọng điểm (P2.5, sau phản hồi AI gần nhất) ⭐ Tốn nhiều token\n     * \"medium\" - Thứ yếu (P3.5, sau lịch sử tìm kiếm vector) 📌 Tốn token vừa\n     * \"low\" - Không trọng điểm (P5, vị trí sau cùng) 📋 Tốn ít token\n     * Không đặt hoặc trống - Tương đương low\n   - Áp dụng cho: Thiết lập thế giới, quy tắc cốt lõi, bối cảnh quan trọng, v.v.\n   - Lưu ý: Sẽ tiêu tốn nhiều token hơn, chỉ nên dùng cho kiến thức cốt lõi\n\n6. Hướng dẫn nhập：\n   - Nếu trùng id (như system_prompt_main), sẽ tự động ghi đè thay vì thêm mới\n   - Sau khi nhập, tất cả cài đặt (alwaysInclude, priority, v.v.) đều được giữ nguyên"
    };

    const dataStr = JSON.stringify(template, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Kho_Kien_Thuc.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Mẫu đã được tải xuống!\n\nVui lòng chỉnh sửa tệp mẫu, thêm thiết lập trò chơi của bạn, sau đó tải lên qua mục "Nhập tệp kho kiến thức".\n\n💡 Gợi ý：\n- Thiết lập tông môn\n- Bối cảnh nhân vật\n- Thông tin bản đồ\n- Giải thích cảnh giới\n- Giới thiệu đan dược\n- Công pháp pháp thuật\nv.v...');
}

// Lưu cấu hình đường dẫn tệp kho kiến thức
async function saveKBFilePaths() {
    const textarea = document.getElementById('kbFilePaths');
    const paths = textarea.value.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Hỗ trợ chú thích bằng dấu #

    if (paths.length === 0) {
        alert('Vui lòng nhập ít nhất một đường dẫn tệp!');
        return;
    }

    // Lưu cấu hình
    window.contextVectorManager.saveKBFileConfig(paths);

    // Hiển thị thông báo đang tải
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'kbLoadingMsg';
    loadingMsg.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10001;
                text-align: center;
                min-width: 300px;
            `;
    loadingMsg.innerHTML = `
                <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                    📚 Đang tải kho kiến thức...
                </div>
                <div class="loading" style="margin: 20px auto;"></div>
                <div id="kbLoadingProgress" style="font-size: 12px; color: #666; margin-top: 15px;">
                    Đang chuẩn bị...
                </div>
            `;
    document.body.appendChild(loadingMsg);

    try {
        // Tải ngay lập tức
        const result = await window.contextVectorManager.loadMultipleKnowledgeFiles(paths);

        loadingMsg.remove();

        // Thống kê loại vector
        const kb = window.contextVectorManager.staticKnowledgeBase;
        const denseCount = kb.filter(item => item.vector && Array.isArray(item.vector)).length;
        const sparseCount = kb.filter(item => item.vector && !Array.isArray(item.vector)).length;
        const lazyCount = kb.filter(item => !item.vector).length;

        if (result.errors.length > 0) {
            const errorDetails = result.errors.map(e => `   - ${e.file}\n    ${e.error}`).join('\n');
            alert(`⚠️ Nhập thành công một phần\n\n` +
                `📊 Thống kê：\n` +
                `- Thành công：${result.totalLoaded} mục\n` +
                `- Thất bại：${result.errors.length} tệp\n\n` +
                `🔢 Trạng thái vector：\n` +
                `- Vector dày đặc：${denseCount} mục\n` +
                `- Vector thưa thớt：${sparseCount} mục\n` +
                `- Tạo sau：${lazyCount} mục\n\n` +
                `Chi tiết thất bại：\n${errorDetails}\n\n` +
                `Gợi ý：\n1. Kiểm tra đường dẫn tệp chính xác chưa\n2. Đảm bảo tệp nằm trong thư mục trò chơi\n3. Xem console (F12) để biết chi tiết`);
        } else {
            alert(`✅ Nhập kho kiến thức thành công!\n\n` +
                `📊 Thống kê：\n` +
                `- Số lượng tệp：${result.totalFiles} cái\n` +
                `- Tổng số kiến thức：${result.totalLoaded} mục\n\n` +
                `🔢 Loại vector：\n` +
                `- Vector dày đặc (Dense)：${denseCount} mục\n` +
                `- Vector thưa thớt (Sparse)：${sparseCount} mục\n` +
                `- Tạo sau (Lazy)：${lazyCount} mục\n\n` +
                `💾 Vị trí lưu trữ：IndexedDB (xiuxian_vector_db → staticKB)\n\n` +
                `💡 Gợi ý：\n` +
                `- Lần tới khởi động sẽ tự động tải từ IndexedDB\n` +
                `- Tệp lớn (100+ mục) sẽ kích hoạt vector hóa thời gian thực\n` +
                `- Nhấp "Xem trạng thái vector" để biết chi tiết`);
        }

        console.log('[Cấu hình kho kiến thức] ✅ Lưu và tải hoàn tất');

    } catch (error) {
        loadingMsg.remove();
        alert('❌ Tải thất bại：' + error.message + '\n\nVui lòng kiểm tra：\n1. Đường dẫn tệp chính xác chưa\n2. Định dạng tệp đúng chưa\n3. Console (F12) để xem lỗi chi tiết');
        console.error('[Cấu hình kho kiến thức] Tải thất bại:', error);
    }
}

// Tải cấu hình đường dẫn tệp kho kiến thức lên UI
function loadKBFilePathsToUI() {
    const paths = window.contextVectorManager.loadKBFileConfig();
    const textarea = document.getElementById('kbFilePaths');
    if (textarea && paths.length > 0) {
        textarea.value = paths.join('\n');
    }
}

// 🔐 Xuất bản sao lưu đầy đủ
async function exportCompleteBackup() {
    try {
        console.log('[Sao lưu đầy đủ] Bắt đầu xuất...');

        // Lấy tất cả bản lưu (saves)
        const allSaves = await getAllSaves();
        console.log('[Sao lưu đầy đủ] Lấy được', allSaves.length, 'bản lưu');

        const backupData = {
            version: '2.1',
            type: 'complete_backup',
            timestamp: Date.now(),
            exportDate: new Date().toLocaleString('vi-VN'),

            // 1. Cấu hình API và cài đặt trò chơi (từ localStorage)
            config: JSON.parse(localStorage.getItem('gameConfig') || '{}'),

            // 2. Cấu hình API bổ sung
            extraConfig: JSON.parse(localStorage.getItem('extraApiConfig') || '{}'),

            // 3. Toàn bộ dữ liệu bản lưu (từ IndexedDB)
            allSaves: allSaves,

            // 4. Trạng thái trò chơi hiện tại (tương thích bản cũ)
            gameState: {
                variables: JSON.parse(JSON.stringify(gameState.variables)),
                conversationHistory: JSON.parse(JSON.stringify(gameState.conversationHistory)),
                variableSnapshots: JSON.parse(JSON.stringify(gameState.variableSnapshots)),
                isGameStarted: gameState.isGameStarted,
                characterInfo: gameState.characterInfo,
                dynamicWorld: JSON.parse(JSON.stringify(gameState.dynamicWorld))
            },

            // 5. Kho kiến thức tĩnh
            knowledgeBase: window.contextVectorManager ?
                window.contextVectorManager.exportStaticKB() : null,

            // 6. Thư viện vector hội thoại
            conversationVectors: window.contextVectorManager ?
                window.contextVectorManager.exportConversationVectors() : null,

            // 7. Cấu hình sinh ảnh NovelAI
            novelAIConfig: {
                apiKey: localStorage.getItem('novelai_api_key') || '',
                enabled: localStorage.getItem('novelai_enabled') === 'true',
                imagePromptTemplate: localStorage.getItem('novelai_image_prompt_template') || '',
                positivePromptPrefix: localStorage.getItem('novelai_positive_prompt_prefix') || '',
                imageConfig: JSON.parse(localStorage.getItem('novelai_image_config') || '{}')
            },

            // 8. Dữ liệu và cấu hình đồ thị nhân vật
            characterGraph: window.characterGraphManager ?
                window.characterGraphManager.exportData() : null,

            // 9. Dữ liệu trò chơi thẻ bài ACJT (Nhân vật, bộ bài, tầng, trạng thái, v.v.)
            acjtGameData: {
                playerState: JSON.parse(localStorage.getItem('acjt_player_state') || 'null'),
                cardDeck: JSON.parse(localStorage.getItem('acjt_card_deck') || 'null'),
                specialStatus: JSON.parse(localStorage.getItem('acjt_special_status') || 'null'),
                bodyMods: JSON.parse(localStorage.getItem('acjt_body_mods') || 'null')
            },

            // 10. Dữ liệu mạng ngữ nghĩa GraphRAG
            graphRAGData: window.graphRAGLite ? window.graphRAGLite.exportData() : null
        };

        // Tạo tên tệp
        const filename = `Sao_luu_day_du_Tu_Tien_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}_${Date.now()}.json`;

        // Xuất thành tệp JSON
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Thông tin thống kê
        const stats = {
            apiConfigured: !!backupData.config.endpoint,
            gameStarted: backupData.gameState.isGameStarted,
            savesCount: backupData.allSaves.length,
            conversationCount: backupData.gameState.conversationHistory.length,
            knowledgeCount: backupData.knowledgeBase?.knowledge?.length || 0,
            vectorCount: backupData.conversationVectors?.embeddings?.length || 0,
            novelAIEnabled: backupData.novelAIConfig?.enabled || false,
            characterGraphCount: backupData.characterGraph?.characters?.length || 0,
            acjtHasData: backupData.acjtGameData && (
                backupData.acjtGameData.playerState ||
                backupData.acjtGameData.cardDeck ||
                backupData.acjtGameData.specialStatus ||
                backupData.acjtGameData.bodyMods
            )
        };

        alert(`✅ Xuất bản sao lưu đầy đủ thành công!\n\n📦 Nội dung sao lưu：\n` +
            `- Cấu hình API：${stats.apiConfigured ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'}\n` +
            `- Trạng thái trò chơi：${stats.gameStarted ? '✓ Đã bắt đầu' : '✗ Chưa bắt đầu'}\n` +
            `- Tất cả bản lưu：${stats.savesCount} cái\n` +
            `- Đối thoại hiện tại：${stats.conversationCount} câu\n` +
            `- Kho kiến thức tĩnh：${stats.knowledgeCount} mục\n` +
            `- Vector hội thoại：${stats.vectorCount} cái\n` +
            `- Sinh ảnh NovelAI：${stats.novelAIEnabled ? '✓ Đã bật' : '✗ Chưa bật'}\n` +
            `- Đồ thị nhân vật：${stats.characterGraphCount} nhân vật\n` +
            `- 🎮 Bộ bài ACJT：${stats.acjtHasData ? '✓ Đã sao lưu' : '✗ Không có dữ liệu'}\n\n` +
            `💾 Tên tệp：${filename}\n\n` +
            `💡 Gợi ý: Hãy lưu trữ tệp ở nơi an toàn!`);

        console.log('[Sao lưu đầy đủ] Xuất thành công:', stats);

    } catch (error) {
        console.error('[Sao lưu đầy đủ] Xuất thất bại:', error);
        alert(`❌ Xuất thất bại：${error.message}\n\nVui lòng xem console để biết chi tiết`);
    }
}

// 🔐 Nhập bản sao lưu đầy đủ
async function importCompleteBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Hiển thị thông báo đang tải
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'backupImporting';
        loadingMsg.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10002;
                    text-align: center;
                    min-width: 300px;
                `;
        loadingMsg.innerHTML = `
                    <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                        📦 Đang nhập bản sao lưu đầy đủ...
                    </div>
                    <div class="loading" style="margin: 20px auto;"></div>
                    <div id="importProgress" style="font-size: 12px; color: #666; margin-top: 15px;">
                        Đang đọc tệp sao lưu...
                    </div>
                `;
        document.body.appendChild(loadingMsg);

        const updateProgress = (msg) => {
            const progressEl = document.getElementById('importProgress');
            if (progressEl) progressEl.textContent = msg;
        };

        try {
            // Đọc tệp
            const text = await file.text();
            const backupData = JSON.parse(text);

            // Xác minh tệp sao lưu
            if (backupData.type !== 'complete_backup') {
                throw new Error('Đây không phải là tệp sao lưu đầy đủ hợp lệ');
            }

            console.log('[Sao lưu đầy đủ] Bắt đầu nhập...', backupData);

            // Xác nhận nhập
            loadingMsg.remove();
            const confirmMsg = `Bạn có chắc muốn nhập bản sao lưu này không?\n\n` +
                `📅 Ngày sao lưu：${backupData.exportDate || 'Không rõ'}\n` +
                `📦 Phiên bản：${backupData.version || '1.0'}\n\n` +
                `⚠️ Cảnh báo：\n` +
                `- Sẽ ghi đè toàn bộ cài đặt và dữ liệu hiện tại\n` +
                `- Cấu hình API, bản lưu trò chơi, kho kiến thức, v.v. đều bị thay thế\n` +
                `- Gợi ý nên xuất dữ liệu hiện tại để dự phòng trước\n\n` +
                `Tiếp tục chứ?`;

            if (!confirm(confirmMsg)) {
                console.log('[Sao lưu đầy đủ] Người dùng đã hủy nhập');
                return;
            }

            // Hiển thị lại thông báo đang tải
            document.body.appendChild(loadingMsg);

            let importedItems = {
                config: false,
                extraConfig: false,
                allSaves: false,
                gameState: false,
                knowledgeBase: false,
                conversationVectors: false,
                novelAIConfig: false,
                characterGraph: false,
                acjtGameData: false
            };

            // 1. Nhập cấu hình API và cài đặt trò chơi
            if (backupData.config) {
                updateProgress('Đang khôi phục cấu hình API...');
                localStorage.setItem('gameConfig', JSON.stringify(backupData.config));
                loadConfig(); // Tải lại cấu hình lên UI
                importedItems.config = true;
                console.log('[Sao lưu đầy đủ] ✓ Cấu hình API đã khôi phục');
            }

            // 2. Nhập cấu hình API bổ sung
            if (backupData.extraConfig) {
                updateProgress('Đang khôi phục cấu hình API bổ sung...');
                localStorage.setItem('extraApiConfig', JSON.stringify(backupData.extraConfig));
                importedItems.extraConfig = true;
                console.log('[Sao lưu đầy đủ] ✓ Cấu hình API bổ sung đã khôi phục');
            }

            // 3. Nhập tất cả bản lưu vào IndexedDB
            if (backupData.allSaves && Array.isArray(backupData.allSaves)) {
                updateProgress(`Đang khôi phục ${backupData.allSaves.length} bản lưu...`);
                try {
                    if (!db) {
                        await initDB();
                    }

                    let restoredCount = 0;
                    for (const saveData of backupData.allSaves) {
                        if (saveData.saveName && saveData.timestamp) {
                            if (!saveData.conversationHistory || !Array.isArray(saveData.conversationHistory)) {
                                console.warn('[Sao lưu đầy đủ] Bỏ qua bản lưu không hợp lệ:', saveData.saveName, '- Thiếu conversationHistory');
                                continue;
                            }
                            console.log(`[Sao lưu đầy đủ] Khôi phục bản lưu: ${saveData.saveName}, số câu đối thoại: ${saveData.conversationHistory?.length || 0}`);
                            await saveGameToSlot(saveData.saveName, saveData);
                            restoredCount++;
                        }
                    }

                    importedItems.allSaves = true;
                    console.log(`[Sao lưu đầy đủ] ✓ Đã khôi phục ${restoredCount} bản lưu vào IndexedDB`);
                } catch (error) {
                    console.error('[Sao lưu đầy đủ] Khôi phục bản lưu thất bại:', error);
                    throw new Error(`Khôi phục bản lưu thất bại: ${error.message}`);
                }
            }

            // 4. Nhập trạng thái trò chơi hiện tại
            if (backupData.gameState) {
                updateProgress('Đang khôi phục trạng thái trò chơi...');
                await loadSaveData(backupData.gameState);
                // Đồng thời cập nhật bản lưu tự động
                await saveGameHistory();
                importedItems.gameState = true;
                console.log('[Sao lưu đầy đủ] ✓ Trạng thái trò chơi đã khôi phục');
                console.log('[Sao lưu đầy đủ] ✓ Bản lưu tự động đã cập nhật');
            }

            // 5. Nhập kho kiến thức tĩnh
            if (backupData.knowledgeBase && window.contextVectorManager) {
                updateProgress('Đang khôi phục kho kiến thức tĩnh...');
                const result = await window.contextVectorManager.importStaticKnowledge(
                    backupData.knowledgeBase,
                    true  // replace = true, thay thế kho kiến thức hiện tại
                );
                importedItems.knowledgeBase = true;
                console.log('[Sao lưu đầy đủ] ✓ Kho kiến thức tĩnh đã khôi phục:', result.count, 'mục');
            }

            // 6. Nhập thư viện vector hội thoại
            if (backupData.conversationVectors && window.contextVectorManager) {
                updateProgress('Đang khôi phục thư viện vector hội thoại...');
                const result = await window.contextVectorManager.importConversationVectors(
                    backupData.conversationVectors
                );
                importedItems.conversationVectors = true;
                console.log('[Sao lưu đầy đủ] ✓ Thư viện vector hội thoại đã khôi phục:', result.count, 'cái');
            }

            // 7. Nhập cấu hình sinh ảnh NovelAI
            if (backupData.novelAIConfig) {
                updateProgress('Đang khôi phục cấu hình sinh ảnh NovelAI...');

                if (backupData.novelAIConfig.apiKey) {
                    localStorage.setItem('novelai_api_key', backupData.novelAIConfig.apiKey);
                }
                localStorage.setItem('novelai_enabled', backupData.novelAIConfig.enabled ? 'true' : 'false');
                if (backupData.novelAIConfig.imagePromptTemplate) {
                    localStorage.setItem('novelai_image_prompt_template', backupData.novelAIConfig.imagePromptTemplate);
                }
                if (backupData.novelAIConfig.positivePromptPrefix !== undefined) {
                    localStorage.setItem('novelai_positive_prompt_prefix', backupData.novelAIConfig.positivePromptPrefix);
                }
                if (backupData.novelAIConfig.imageConfig && Object.keys(backupData.novelAIConfig.imageConfig).length > 0) {
                    localStorage.setItem('novelai_image_config', JSON.stringify(backupData.novelAIConfig.imageConfig));
                }

                if (window.novelAIGenerator && typeof window.novelAIGenerator.loadConfig === 'function') {
                    window.novelAIGenerator.loadConfig();
                }

                importedItems.novelAIConfig = true;
                console.log('[Sao lưu đầy đủ] ✓ Cấu hình sinh ảnh NovelAI đã khôi phục');
            }

            // 8. Nhập dữ liệu đồ thị nhân vật
            if (backupData.characterGraph && window.characterGraphManager) {
                updateProgress('Đang khôi phục đồ thị nhân vật...');
                await window.characterGraphManager.importData(backupData.characterGraph);
                importedItems.characterGraph = true;
                const charCount = backupData.characterGraph.characters?.length || 0;
                console.log('[Sao lưu đầy đủ] ✓ Đồ thị nhân vật đã khôi phục:', charCount, 'nhân vật');
            }

            // 9. Nhập dữ liệu trò chơi thẻ bài ACJT
            if (backupData.acjtGameData) {
                updateProgress('Đang khôi phục dữ liệu trò chơi thẻ bài...');

                if (backupData.acjtGameData.playerState) {
                    localStorage.setItem('acjt_player_state', JSON.stringify(backupData.acjtGameData.playerState));
                    console.log('[Sao lưu đầy đủ] ✓ Trạng thái người chơi ACJT đã khôi phục, tầng:', backupData.acjtGameData.playerState.floor);
                }
                if (backupData.acjtGameData.cardDeck) {
                    localStorage.setItem('acjt_card_deck', JSON.stringify(backupData.acjtGameData.cardDeck));
                    console.log('[Sao lưu đầy đủ] ✓ Bộ bài ACJT đã khôi phục, số lá bài:', backupData.acjtGameData.cardDeck.length);
                }
                if (backupData.acjtGameData.specialStatus) {
                    localStorage.setItem('acjt_special_status', JSON.stringify(backupData.acjtGameData.specialStatus));
                    console.log('[Sao lưu đầy đủ] ✓ Trạng thái đặc biệt ACJT đã khôi phục');
                }
                if (backupData.acjtGameData.bodyMods) {
                    localStorage.setItem('acjt_body_mods', JSON.stringify(backupData.acjtGameData.bodyMods));
                    console.log('[Sao lưu đầy đủ] ✓ Cải tạo cơ thể ACJT đã khôi phục');
                }

                importedItems.acjtGameData = true;
            }

            // 10. Nhập dữ liệu mạng ngữ nghĩa GraphRAG
            if (backupData.graphRAGData && window.graphRAGLite) {
                updateProgress('Đang khôi phục mạng ngữ nghĩa GraphRAG...');
                await window.graphRAGLite.importData(backupData.graphRAGData);
                importedItems.graphRAGData = true;
                const entityCount = backupData.graphRAGData.entities?.length || 0;
                console.log('[Sao lưu đầy đủ] ✓ Mạng ngữ nghĩa GraphRAG đã khôi phục:', entityCount, 'thực thể');
            }

            loadingMsg.remove();

            // Hiển thị kết quả nhập
            const stats = {
                savesCount: backupData.allSaves?.length || 0,
                conversationCount: backupData.gameState?.conversationHistory?.length || 0,
                knowledgeCount: backupData.knowledgeBase?.knowledge?.length || 0,
                vectorCount: backupData.conversationVectors?.embeddings?.length || 0,
                novelAIEnabled: backupData.novelAIConfig?.enabled || false,
                characterGraphCount: backupData.characterGraph?.characters?.length || 0,
                acjtFloor: backupData.acjtGameData?.playerState?.floor || 0
            };

            alert(`✅ Nhập bản sao lưu đầy đủ thành công!\n\n` +
                `📦 Nội dung đã khôi phục：\n` +
                `${importedItems.config ? '✓' : '✗'} Cấu hình API\n` +
                `${importedItems.extraConfig ? '✓' : '✗'} Cấu hình API bổ sung\n` +
                `${importedItems.allSaves ? '✓' : '✗'} Toàn bộ bản lưu (${stats.savesCount} cái)\n` +
                `${importedItems.gameState ? '✓' : '✗'} Trạng thái hiện tại (${stats.conversationCount} câu hội thoại)\n` +
                `${importedItems.knowledgeBase ? '✓' : '✗'} Kho kiến thức tĩnh (${stats.knowledgeCount} mục)\n` +
                `${importedItems.conversationVectors ? '✓' : '✗'} Thư viện vector hội thoại (${stats.vectorCount} cái)\n` +
                `${importedItems.novelAIConfig ? '✓' : '✗'} Cấu hình sinh ảnh NovelAI\n` +
                `${importedItems.characterGraph ? '✓' : '✗'} Đồ thị nhân vật (${stats.characterGraphCount} nhân vật)\n` +
                `${importedItems.acjtGameData ? '✓' : '✗'} 🎮 Dữ liệu thẻ bài ACJT (${stats.acjtFloor ? 'Tầng ' + stats.acjtFloor : 'Không có dữ liệu'})\n\n` +
                `💡 Tất cả bản lưu đã vào IndexedDB, có thể xem qua mục "Tải bản lưu"\n\n` +
                `🎉 Khuyên bạn nên làm mới (F5) trang ngay để các cài đặt có hiệu lực hoàn toàn`);

            console.log('[Sao lưu đầy đủ] Nhập thành công');

        } catch (error) {
            loadingMsg.remove();
            console.error('[Sao lưu đầy đủ] Nhập thất bại:', error);
            alert(`❌ Nhập thất bại：${error.message}\n\nNguyên nhân khả thi：\n` +
                `1. Định dạng tệp không chính xác\n` +
                `2. Tệp sao lưu bị hỏng\n` +
                `3. Phiên bản không tương thích\n\n` +
                `Vui lòng xem console để biết chi tiết`);
        }
    };

    input.click();
}

// Khôi phục cấu hình khi trang tải xong
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        loadKBFilePathsToUI();
    }, 500);
});