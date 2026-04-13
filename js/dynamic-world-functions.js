/**
 * Module chức năng Thế giới động (Dynamic World)
 * Bao gồm: Tạo, hiển thị, quản lý cấu hình, hợp nhất biến, v.v. cho Thế giới động
 * Được trích xuất từ các chức năng liên quan đến Thế giới động trong game.html
 */

// ==================== Các hàm liên quan đến Thế giới động ====================

// Chuyển đổi Tab
function switchTab(tabName) {
    // Loại bỏ tất cả các class 'active'
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Thêm class 'active' vào tab được chọn
    if (tabName === 'status') {
        document.querySelector('[onclick*="switchTab(\'status\')"]').classList.add('active');
        document.getElementById('statusTab').classList.add('active');
    } else if (tabName === 'baiyi') {
        document.querySelector('[onclick*="switchTab(\'baiyi\')"]').classList.add('active');
        document.getElementById('baiyiTab').classList.add('active');
        // Cập nhật danh sách nguyên liệu Bách Nghệ (Baiyi)
        updateBaiyiMaterialsList();
    } else if (tabName === 'dynamicWorld') {
        document.querySelector('[onclick*="switchTab(\'dynamicWorld\')"]').classList.add('active');
        document.getElementById('dynamicWorldTab').classList.add('active');
        // Cập nhật hiển thị Thế giới động
        displayDynamicWorldHistory();
    }
}

// Bật/tắt các trường cấu hình Thế giới động
function toggleDynamicWorldFields() {
    const enabled = document.getElementById('enableDynamicWorld').checked;
    const fieldsDiv = document.getElementById('dynamicWorldFields');
    
    if (enabled) {
        fieldsDiv.style.display = 'block';
        gameState.dynamicWorld.enabled = true;
    } else {
        fieldsDiv.style.display = 'none';
        gameState.dynamicWorld.enabled = false;
    }
}

// Lưu cài đặt Thế giới động
function saveDynamicWorldSettings() {
    const enabled = document.getElementById('enableDynamicWorld').checked;
    const historyDepth = document.getElementById('dynamicWorldHistoryDepth').value;
    const minWords = document.getElementById('dynamicWorldMinWords').value;
    const messageInterval = document.getElementById('dynamicWorldInterval').value;
    const showReasoning = document.getElementById('dynamicWorldShowReasoning').checked;
    const enableKnowledge = document.getElementById('dynamicWorldEnableKnowledge').checked;
    const prompt = document.getElementById('dynamicWorldPrompt').value;

    // Lấy cấu hình hiện tại
    const saved = localStorage.getItem('gameConfig');
    const config = saved ? JSON.parse(saved) : {};

    // Cập nhật cấu hình Thế giới động
    config.dynamicWorld = {
        enabled: enabled,
        historyDepth: parseInt(historyDepth),
        minWords: parseInt(minWords),
        messageInterval: parseInt(messageInterval),
        showReasoning: showReasoning,
        enableKnowledge: enableKnowledge,
        prompt: prompt
    };

    // Lưu vào localStorage
    localStorage.setItem('gameConfig', JSON.stringify(config));

    // Cập nhật gameState
    gameState.dynamicWorld.enabled = enabled;
    gameState.dynamicWorld.messageInterval = parseInt(messageInterval);

    // Cập nhật hiển thị ngay lập tức
    displayDynamicWorldHistory();

    alert('Cài đặt Thế giới động đã được lưu!\nTrạng thái: ' + (enabled ? 'Đã bật' : 'Chưa bật') + 
          '\nSố tầng lịch sử: ' + historyDepth + '\nSố chữ tối thiểu: ' + minWords + 
          '\nKhoảng cách tạo: Mỗi ' + messageInterval + ' tin nhắn người dùng');
}

// 🔧 Kiểm tra tính tương thích: Lấy extraApiConfig (tương thích biến toàn cục và cục bộ)
function getExtraApiConfig() {
    // Nếu trong môi trường BHZ, sử dụng biến toàn cục
    if (window.extraApiConfig) {
        return window.extraApiConfig;
    }
    // Nếu trong môi trường gốc, sử dụng biến cục bộ (cần truyền qua window)
    if (typeof extraApiConfig !== 'undefined') {
        return extraApiConfig;
    }
    // Nếu cả hai không tồn tại, trả về đối tượng trống
    return { enabled: false, key: '' };
}

// Hiển thị lịch sử Thế giới động
function displayDynamicWorldHistory() {
    const container = document.getElementById('dynamicWorldContainer');

    // Nếu container không tồn tại (bảng trạng thái chưa tải), bỏ qua
    if (!container) {
        console.warn('[Thế giới động] Phần tử dynamicWorldContainer không tồn tại, bỏ qua hiển thị');
        return;
    }

    // 🔧 Gỡ lỗi: Kiểm tra giá trị thực tế của extraApiConfig
    const extraApiConfig = getExtraApiConfig();
    console.log('[Thế giới động] 🔧 Thông tin gỡ lỗi:');
    console.log('- extraApiConfig tồn tại:', !!extraApiConfig);
    console.log('- Giá trị extraApiConfig:', extraApiConfig);
    console.log('- Đã bật:', extraApiConfig?.enabled);
    console.log('- Có Key:', !!extraApiConfig?.key);
    console.log('- Độ dài Key:', extraApiConfig?.key?.length || 0);

    if (!gameState.dynamicWorld.enabled) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                <div style="font-size: 16px; margin-bottom: 10px;">Thế giới động chưa bật</div>
                <div style="font-size: 12px; margin-bottom: 15px;">Vui lòng bật chức năng Thế giới động trong phần cài đặt</div>
                <button onclick="openConfigModal(); setTimeout(() => { toggleSection('dynamicWorldSettings'); document.getElementById('dynamicWorldSettings').scrollIntoView(); }, 100);" 
                    style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Đi tới Cài đặt
                </button>
            </div>
        `;
        return;
    }

    // Kiểm tra cấu hình API bổ sung
    if (!extraApiConfig.enabled || !extraApiConfig.key) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <div style="font-size: 16px; margin-bottom: 10px; color: #e67e22;">API bổ sung chưa được cấu hình</div>
                <div style="font-size: 12px; margin-bottom: 15px;">Thế giới động cần sử dụng API thứ hai<br>Vui lòng cấu hình và lưu API bổ sung trước</div>
                <button onclick="openConfigModal(); setTimeout(() => { toggleSection('extraApiSection'); document.getElementById('extraApiSection').scrollIntoView(); }, 100);" 
                    style="padding: 10px 20px; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Cấu hình API bổ sung
                </button>
            </div>
        `;
        return;
    }

    if (gameState.dynamicWorld.history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                <div style="font-size: 16px; margin-bottom: 10px;">Chưa có nội dung Thế giới động</div>
                <div style="font-size: 12px;">✅ Thế giới động đã bật<br>✅ API bổ sung đã cấu hình<br><br>Nội dung sẽ tự động tạo sau khi bắt đầu game</div>
            </div>
        `;
        return;
    }

    // Hiển thị tất cả lịch sử Thế giới động (thứ tự ngược, mới nhất ở trên)
    let html = '';
    for (let i = gameState.dynamicWorld.history.length - 1; i >= 0; i--) {
        const entry = gameState.dynamicWorld.history[i];
        const floor = i + 1;
        
        html += `
            <div class="dynamic-world-entry">
                <div class="dynamic-world-header">
                    <span class="dynamic-world-floor">🏛️ Tầng ${floor}</span>
                    <span class="dynamic-world-time">${new Date(entry.timestamp).toLocaleString('vi-VN')}</span>
                </div>
                ${entry.reasoning && entry.showReasoning ? createDynamicWorldReasoningDisplay(entry.reasoning) : ''}
                <div class="dynamic-world-content">${entry.story}</div>
                <div class="dynamic-world-controls">
                    <button class="regenerate-btn" onclick="regenerateDynamicWorld(${i})">Thử lại</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Tạo hiển thị chuỗi tư duy (reasoning chain) cho Thế giới động
function createDynamicWorldReasoningDisplay(reasoning) {
    let html = `
        <div class="reasoning-container" style="margin-bottom: 10px;">
            <div class="reasoning-header" style="cursor: pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                <span>🧠 Chuỗi tư duy Thế giới động</span>
                <span class="reasoning-toggle">Nhấp để mở/đóng</span>
            </div>
            <div class="reasoning-content" style="display: none;">
    `;

    if (reasoning.worldState) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">🌐 Phân tích trạng thái thế giới</div>
                <div class="reasoning-text">${reasoning.worldState}</div>
            </div>
        `;
    }

    if (reasoning.timeframe) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">⏰ Phạm vi thời gian</div>
                <div class="reasoning-text">${reasoning.timeframe}</div>
            </div>
        `;
    }

    if (reasoning.keyEvents && Array.isArray(reasoning.keyEvents)) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">📌 Sự kiện chính</div>
                <ul class="reasoning-chain">
                    ${reasoning.keyEvents.map(event => `<li>${event}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (reasoning.npcActions) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">👥 Hành động NPC</div>
                <div class="reasoning-text">${reasoning.npcActions}</div>
            </div>
        `;
    }

    if (reasoning.impact) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">💫 Ảnh hưởng tiềm tàng</div>
                <div class="reasoning-text">${reasoning.impact}</div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Tạo nội dung Thế giới động
async function generateDynamicWorld() {
    console.log('[Thế giới động] Kích hoạt hàm tạo');
    console.log('[Thế giới động] Trạng thái bật:', gameState.dynamicWorld.enabled);
    
    const extraApiConfig = getExtraApiConfig();
    console.log('[Thế giới động] Cấu hình API bổ sung:', {
        enabled: extraApiConfig.enabled,
        hasKey: !!extraApiConfig.key,
        hasEndpoint: !!extraApiConfig.endpoint,
        hasModel: !!extraApiConfig.model
    });

    // Kiểm tra xem Thế giới động có được bật không
    if (!gameState.dynamicWorld.enabled) {
        console.log('[Thế giới động] Chưa bật, bỏ qua bước tạo');
        return;
    }

    // 🆕 Tăng bộ đếm tin nhắn và kiểm tra xem đã đạt khoảng cách tạo chưa
    gameState.dynamicWorld.messageCounter = (gameState.dynamicWorld.messageCounter || 0) + 1;
    const interval = gameState.dynamicWorld.messageInterval || 5;
    
    if (gameState.dynamicWorld.messageCounter < interval) {
        console.log(`[Thế giới động] Chưa đạt khoảng cách tạo (${gameState.dynamicWorld.messageCounter}/${interval}), bỏ qua lần này`);
        return;
    }
    
    // Đạt khoảng cách, đặt lại bộ đếm
    console.log('[Thế giới động] Đã đạt khoảng cách tạo, đặt lại bộ đếm và bắt đầu tạo');
    gameState.dynamicWorld.messageCounter = 0;

    // Kiểm tra API bổ sung đã cấu hình chưa
    if (!extraApiConfig.enabled || !extraApiConfig.key) {
        console.warn('[Thế giới động] API bổ sung chưa được cấu hình!');
        console.warn('[Thế giới động] Vui lòng cấu hình và lưu API thứ hai trong 【Cài đặt → Cài đặt API bổ sung】');
        return;
    }

    // Tránh yêu cầu trùng lặp
    if (gameState.dynamicWorld.isProcessing) {
        console.warn('[Thế giới động] Đang xử lý, bỏ qua lượt tạo này');
        console.warn('[Thế giới động] Nếu bị kẹt, hãy thực thi trong console: gameState.dynamicWorld.isProcessing = false');
        return;
    }

    console.log('[Thế giới động] Bắt đầu tạo...');
    gameState.dynamicWorld.isProcessing = true;

    // Hiển thị thông báo đang tải
    const historyDiv = document.getElementById('gameHistory');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = 'dynamic-world-loading';
    loadingDiv.innerHTML = `
        <div class="message-header">
            <span>🌍 Thế giới động</span>
        </div>
        <div class="message-content">
            <span class="loading"></span> AI đang tạo nội dung Thế giới động...
        </div>
    `;
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        // Lấy cấu hình Thế giới động
        const saved = localStorage.getItem('gameConfig');
        const config = saved ? JSON.parse(saved) : {};
        const dwConfig = config.dynamicWorld || {};

        const historyDepth = dwConfig.historyDepth || 5;
        const minWords = dwConfig.minWords || 300;
        const showReasoning = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;

        // 🔧 Ưu tiên xử lý Prompt của Thế giới động (điều chỉnh mức độ ưu tiên)
        let systemPrompt;
        console.log('[Thế giới động-Gỡ lỗi] 🔍 Kiểm tra nguồn Prompt...');
        console.log('[Thế giới động-Gỡ lỗi] 🔍 Đối tượng window:', window);
        console.log('[Thế giới động-Gỡ lỗi] 🔍 window.BaihuSectGameConfig:', window.BaihuSectGameConfig);
        console.log('[Thế giới động-Gỡ lỗi] 🔍 window.XiuxianGameConfig:', window.XiuxianGameConfig);
        console.log('[Thế giới động-Gỡ lỗi] 🔍 dwConfig.prompt tồn tại?', !!(dwConfig && dwConfig.prompt && dwConfig.prompt.trim()));
        console.log('[Thế giới động-Gỡ lỗi] 🔍 window.BaihuSectGameConfig tồn tại?', !!(typeof window.BaihuSectGameConfig !== 'undefined'));
        
        if (window.BaihuSectGameConfig) {
            console.log('[Thế giới động-Gỡ lỗi] 🔍 Độ dài BaihuSectGameConfig.defaultDynamicWorldPrompt:', window.BaihuSectGameConfig.defaultDynamicWorldPrompt?.length);
        }
        
        // 🔧 Tạm thời vô hiệu hóa prompt tùy chỉnh của người dùng, ép buộc sử dụng cấu hình Bạch Hổ Tông
        if (false && dwConfig.prompt && dwConfig.prompt.trim()) {
            systemPrompt = dwConfig.prompt;
            console.log('[Thế giới động] 📝 Sử dụng Prompt thế giới động tùy chỉnh của người dùng');
        } else if (typeof window.BaihuSectGameConfig !== 'undefined' && window.BaihuSectGameConfig.defaultDynamicWorldPrompt) {
            // 🐅 Nâng mức ưu tiên cấu hình Bạch Hổ Tông lên vị trí thứ hai
            systemPrompt = window.BaihuSectGameConfig.defaultDynamicWorldPrompt;
            console.log('[Thế giới động] 🐅 Sử dụng Prompt thế giới động mặc định của Bạch Hổ Tông');
        } else if (document.getElementById('dynamicWorldPrompt') && document.getElementById('dynamicWorldPrompt').value.trim()) {
            systemPrompt = document.getElementById('dynamicWorldPrompt').value;
            console.log('[Thế giới động] 📝 Sử dụng Prompt thế giới động từ HTML');
        } else {
            systemPrompt = 'Bạn là bộ tạo thế giới động cho thế giới Tu tiên Bạch Hổ Tông. Dựa trên trạng thái và vị trí hiện tại của nhân vật chính, hãy tạo các thông tin bối cảnh như sự kiện phương xa, biến động thế lực, thay đổi môi trường. Các sự kiện thế giới được tạo ra phải phù hợp với thiết lập thế giới quan của Bạch Hổ Tông, thể hiện đặc sắc của thế giới tu tiên và văn hóa độc đáo của Bạch Hổ Tông, bao gồm các yếu tố tu tiên thích hợp: đột phá cảnh giới, tranh đoạt pháp bảo, tông môn tranh đấu, v.v. Kể chuyện theo ngôi thứ ba, phong cách ngôn ngữ cổ điển nhã nhặn, mỗi đoạn khoảng 50-100 chữ, tạo ra 3-5 sự kiện bối cảnh khác nhau.';
            console.log('[Thế giới động] 🐅 Sử dụng Prompt thế giới động Bạch Hổ Tông được viết cứng (hardcoded)');
        }

        // 🆕 Lấy trạng thái biến hiện tại trước
        const currentLocation = gameState.variables.location || 'Không rõ';
        const currentNPCs = gameState.variables.relationships.map(r => r.name).join('、') || 'Không có';
        const currentTime = gameState.variables.currentDateTime || 'Không rõ';

        // Xây dựng tin nhắn
        let messages = [];

        // 🆕 Tích hợp chức năng truy xuất kho kiến thức
        let knowledgeContext = '';
        const enableKnowledge = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;
        if (window.contextVectorManager && 
            document.getElementById('enableVectorRetrieval')?.checked && 
            enableKnowledge) {
            try {
                console.log('[Thế giới động] Bắt đầu truy xuất kho kiến thức...');
                
                // Xây dựng truy vấn (dựa trên trạng thái game hiện tại)
                const queryText = `tạo thế giới động ${currentLocation} ${currentTime} sự kiện phương xa biến động thế lực`;
                
                // 🔧 Sửa đổi: Sử dụng prompt chung để truy xuất kiến thức, tránh ghi đè prompt Bạch Hổ Tông
                const genericPrompt = 'Bạn là bộ tạo thế giới động cho thế giới tu tiên. Dựa trên trạng thái và vị trí hiện tại của nhân vật chính, hãy tạo thông tin bối cảnh như sự kiện phương xa, biến động thế lực, thay đổi môi trường.';
                const optimizedMessages = await window.contextVectorManager.buildOptimizedMessages(
                    genericPrompt, // Dùng prompt chung để truy xuất
                    gameState.variables,
                    queryText,
                    0, // Không cần lịch sử đối thoại
                    [], // Lịch sử đối thoại trống
                    queryText // Truyền vào truy vấn tìm kiếm
                );
                
                // Trích xuất các tin nhắn hệ thống liên quan đến kho kiến thức
                const knowledgeMessages = optimizedMessages.filter(msg => 
                    msg.role === 'system' && (
                        msg.content.includes('【相关历史回忆】') ||
                        msg.content.includes('【相关知识库】') ||
                        msg.content.includes('【⭐ 重点常驻知识】') ||
                        msg.content.includes('【📌 次重点常驻知识】') ||
                        msg.content.includes('【常驻知识库】')
                    )
                );
                
                if (knowledgeMessages.length > 0) {
                    // 🆕 Tối ưu định dạng nội dung kho kiến thức, thêm nhãn đánh dấu
                    knowledgeContext = '\n\n【🌍 Tham khảo Kho kiến thức Thế giới động - Có thể tắt trong cài đặt】\n' + 
                        knowledgeMessages.map((msg, index) => {
                            let content = msg.content;
                            if (content.includes('【相关历史回忆】')) content = '📜 [Ký ức lịch sử] ' + content;
                            else if (content.includes('【相关知识库】')) content = '📚 [Kiến thức liên quan] ' + content;
                            else if (content.includes('【⭐ 重点常驻知识】')) content = '⭐ [Kiến thức trọng điểm] ' + content;
                            else if (content.includes('【📌 次重点常驻知识】')) content = '📌 [Kiến thức phụ] ' + content;
                            else if (content.includes('【常驻知识库】')) content = '📖 [Kiến thức thường trực] ' + content;
                            return content;
                        }).join('\n\n');
                    console.log(`[Thế giới động] Đã tích hợp ${knowledgeMessages.length} mục nội dung kho kiến thức`);
                }
                
            } catch (error) {
                console.warn('[Thế giới động] Truy xuất kho kiến thức thất bại:', error);
            }
        } else if (!enableKnowledge) {
            console.log('[Thế giới động] Truy xuất kho kiến thức đã bị tắt trong cài đặt');
        }

        // Thêm Prompt hệ thống (bao gồm nội dung kho kiến thức)
        const finalSystemPrompt = systemPrompt + knowledgeContext;
        
        // 🔍 Log gỡ lỗi: Hiển thị prompt thực tế được sử dụng
        console.log('[Thế giới động-Gỡ lỗi] 📝 Độ dài finalSystemPrompt:', finalSystemPrompt.length);
        console.log('[Thế giới động-Gỡ lỗi] 📝 Có chứa từ khóa Bạch Hổ Tông không:', finalSystemPrompt.includes('白虎宗'));
        
        messages.push({
            role: 'system',
            content: finalSystemPrompt
        });

        // Thêm trạng thái biến hiện tại và thông tin hạn chế
        const variableContext = `
【Trạng thái nhân vật chính hiện tại】（Chỉ dùng tham khảo, cấm sửa đổi）
- Thời gian hiện tại: ${currentTime}
- Vị trí hiện tại: ${currentLocation}
- NPC bên cạnh: ${currentNPCs}

【Yêu cầu nghiêm ngặt】
- Cấm thúc đẩy thời gian! Chỉ mô tả những gì đang xảy ra ở nơi khác tại "thời điểm này" (${currentTime})
- Cấm liên quan đến bất kỳ sự kiện nào tại vị trí hiện tại "${currentLocation}" của nhân vật chính!
- Cấm liên quan đến các NPC sau: ${currentNPCs} (họ đang ở cạnh nhân vật chính)
- Cấm mô tả nhân vật chính đang làm gì!
- Cách làm đúng: Mô tả tin đồn phương xa, động thái của các thế lực tại những địa điểm hoàn toàn khác biệt
- Có thể thêm các NPC phương xa mới vào variables.relationships (nhưng phải là NPC không ở cạnh nhân vật chính)
- Yêu cầu số chữ: Ít nhất ${minWords} chữ
- Phong cách tự sự: Sử dung các góc nhìn xa xăm như "nghe nói", "có tin đồn", "có tu sĩ chứng kiến", v.v.
        `.trim();

        messages.push({
            role: 'user',
            content: variableContext
        });

        // Thêm lịch sử Thế giới động
        if (historyDepth > 0 && gameState.dynamicWorld.history.length > 0) {
            const recentHistory = gameState.dynamicWorld.history.slice(-historyDepth);
            for (const entry of recentHistory) {
                messages.push({
                    role: 'assistant',
                    content: JSON.stringify({ story: entry.story, reasoning: entry.reasoning })
                });
            }
        }

        // Thêm yêu cầu tạo
        messages.push({
            role: 'user',
            content: 'Hãy tạo nội dung thế giới động mới.\n\n【Cực kỳ quan trọng】Phải xuất ra cấu trúc JSON hoàn chỉnh, tất cả các trường phải đầy đủ, không được cắt ngang giữa chừng! Đảm bảo tất cả các dấu ngoặc nhọn, ngoặc vuông, dấu ngoặc kép đều được đóng đúng cách!'
        });

        // Gọi API
        const response = await callExtraAPI(messages);

        // 🔍 Log gỡ lỗi (giúp chẩn đoán vấn đề API bên thứ ba bị cắt ngắn nội dung)
        console.log('[Thế giới động-Tạo] Độ dài phản hồi gốc của API:', response.length, 'ký tự');
        if (response.length < 500) {
            console.warn('[Thế giới động-Tạo] ⚠️ Phản hồi quá ngắn, có thể đã bị cắt bớt! Nội dung đầy đủ:', response);
        }

        // Phân tích phản hồi
        const data = parseAIResponse(response);

        // 🔍 Log gỡ lỗi: Hiển thị dữ liệu đầy đủ của Thế giới động
        if (debugMode || document.getElementById('debugMode')?.checked) {
            console.log('[Thế giới động-Gỡ lỗi] 📦 Dữ liệu phản hồi AI đầy đủ:');
            console.log('[Thế giới động-Gỡ lỗi] - Độ dài phản hồi gốc:', response.length);
            console.log('[Thế giới động-Gỡ lỗi] - story sau khi phân tích:', data.story?.substring(0, 200));
            console.log('[Thế giới động-Gỡ lỗi] - Trường variables:', data.variables);
            console.log('[Thế giới động-Gỡ lỗi] - Trường variableUpdate:', data.variableUpdate);
            console.log('[Thế giới động-Gỡ lỗi] - relationships:', data.variables?.relationships);
            
// Hiển thị nội dung đầy đủ trên bảng gỡ lỗi (debug panel)
            const debugContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Thế giới động - Đầu ra đầy đủ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【Phản hồi AI gốc】(${response.length} ký tự)
${response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Dữ liệu sau khi phân tích】
${JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Biểu mẫu biến (variables)】
${data.variables ? JSON.stringify(data.variables, null, 2) : 'Không có'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Chỉ thị cập nhật biến (variableUpdate)】
${data.variableUpdate || 'Không có'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Quan hệ nhân tế (Trích xuất từ variables)】
${data.variables?.relationships ? JSON.stringify(data.variables.relationships, null, 2) : 'Không có'}
`;
            showDebugOutput(debugContent);
        }

        // Lưu vào lịch sử Thế giới động
        const entry = {
            floor: gameState.dynamicWorld.floor + 1,
            timestamp: Date.now(),
            story: data.story,
            reasoning: data.reasoning,
            variables: data.variables || {},
            variableUpdate: data.variableUpdate || null, // 🆕 Lưu chỉ thị định dạng v3.1
            showReasoning: showReasoning
        };

        gameState.dynamicWorld.history.push(entry);
        gameState.dynamicWorld.floor++;

        // Hợp nhất biến (hỗ trợ cả hai định dạng)
        console.log('[Thế giới động] Chuẩn bị hợp nhất biến...');
        console.log('[Thế giới động] - data.variables:', data.variables);
        console.log('[Thế giới động] - data.variableUpdate:', data.variableUpdate);
        
        if (data.variableUpdate) {
            // Định dạng chỉ thị v3.1
            console.log('[Thế giới động] 🎯 Phát hiện định dạng variableUpdate (chỉ thị v3.1)');
            try {
                // Khởi tạo bộ phân tích v3.1
                if (!window.v31Parser) {
                    console.log('[Thế giới động] Khởi tạo bộ phân tích v3.1...');
                    window.v31Parser = new VariableInstructionParserV31(gameState, {
                        debug: true,
                        enableRollback: false
                    });
                }
                
                // Phân tích và thực thi cập nhật biến
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[Thế giới động] ✅ Kết quả cập nhật biến v3.1:', result);
                console.log('[Thế giới động] Số lượng relationships sau khi cập nhật:', gameState.variables.relationships?.length);
                
                // Cập nhật UI
                updateStatusPanel();
            } catch (error) {
                console.error('[Thế giới động] ❌ Cập nhật biến v3.1 thất bại:', error);
                console.error('[Thế giới động] Chi tiết lỗi:', error.message);
            }
        } else if (data.variables) {
            // Định dạng biểu mẫu biến đầy đủ
            console.log('[Thế giới động] 📋 Phát hiện định dạng variables (biểu mẫu đầy đủ)');
            console.log('[Thế giới động] Bắt đầu hợp nhất biến vào biểu mẫu chính...');
            mergeDynamicWorldVariables(data.variables);
            console.log('[Thế giới động] ✅ Hợp nhất biến hoàn tất');
            console.log('[Thế giới động] Số lượng relationships sau khi hợp nhất:', gameState.variables.relationships?.length);
        } else {
            console.warn('[Thế giới động] ⚠️ Phản hồi AI không có trường variables lẫn variableUpdate!');
            console.warn('[Thế giới động] Đối tượng data đầy đủ:', data);
        }

        // Thêm vào kho lưu trữ vector (dùng để truy xuất sau này)
        if (window.contextVectorManager && document.getElementById('enableVectorRetrieval')?.checked) {
            // Sử dụng số âm làm turnIndex cho Thế giới động để tránh xung đột với hội thoại chính
            // Hội thoại chính dùng số dương (1, 2, 3...), Thế giới động dùng số âm (-1, -2, -3...)
            const dynamicWorldTurnIndex = -gameState.dynamicWorld.floor;
            
            await window.contextVectorManager.addConversation(
                '[Thế giới động] ' + data.story.substring(0, 100),
                data.story,
                dynamicWorldTurnIndex,
                data.story
            );
            // Lưu kho vector vào IndexedDB
            await window.contextVectorManager.saveToIndexedDB();
            console.log(`[Thế giới động] Đã lưu kho vector vào IndexedDB (turnIndex: ${dynamicWorldTurnIndex})`);
        }

        // Loại bỏ thông báo đang tải
        const loading = document.getElementById('dynamic-world-loading');
        if (loading) loading.remove();

        // Cập nhật hiển thị
        displayDynamicWorldHistory();

        console.log('[Thế giới động] Tạo thành công, tầng: ' + entry.floor);

        // 🆕 Tự động lưu game (bao gồm dữ liệu Thế giới động)
        await saveGameHistory();
        console.log('[Thế giới động] Đã tự động lưu bản ghi');
        console.log('[Thế giới động] Số lượng bản ghi lịch sử hiện tại:', gameState.dynamicWorld.history.length);

    } catch (error) {
        console.error('[Thế giới động] Tạo thất bại:', error);
        
        // Loại bỏ thông báo đang tải
        const loading = document.getElementById('dynamic-world-loading');
        if (loading) loading.remove();
    } finally {
        gameState.dynamicWorld.isProcessing = false;
    }
}

// Hợp nhất các biến được tạo từ Thế giới động vào biến chính
function mergeDynamicWorldVariables(dynamicVariables) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Thế giới động-Hợp nhất biến] Bắt đầu xử lý');
    console.log('[Thế giới động-Hợp nhất biến] Nội dung biến động:', dynamicVariables);
    
    if (!dynamicVariables) {
        console.warn('[Thế giới động-Hợp nhất biến] ⚠️ dynamicVariables trống, bỏ qua hợp nhất');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    let hasChanges = false;
    
    // 📊 Hiển thị trạng thái trước khi hợp nhất
    console.log('[Thế giới động-Hợp nhất biến] 📊 Số lượng relationships trước khi hợp nhất:', gameState.variables.relationships?.length);

    // Hợp nhất relationships
    if (dynamicVariables.relationships && Array.isArray(dynamicVariables.relationships)) {
        console.log(`[Thế giới động-Hợp nhất biến] 👥 Đang xử lý ${dynamicVariables.relationships.length} quan hệ nhân tế`);
        
        for (const newRel of dynamicVariables.relationships) {
            console.log(`[Thế giới động-Hợp nhất biến] 🔍 Đang xử lý nhân vật: ${newRel.name}`);
            
            // Tìm xem đã tồn tại chưa
            const existingIndex = gameState.variables.relationships.findIndex(
                r => r.name === newRel.name
            );

            if (existingIndex >= 0) {
                console.log(`[Thế giới động-Hợp nhất biến]   - Đã tồn tại, chỉ số: ${existingIndex}`);
                
                // Cập nhật quan hệ hiện có (hợp nhất history, loại bỏ trùng lặp)
                const existing = gameState.variables.relationships[existingIndex];
                const existingHistory = existing.history || [];
                const newHistory = newRel.history || [];
                
                console.log(`[Thế giới động-Hợp nhất biến]   - Lịch sử hiện có: ${existingHistory.length} mục`);
                console.log(`[Thế giới động-Hợp nhất biến]   - Lịch sử mới thêm: ${newHistory.length} mục`);
                
                // Hợp nhất khử trùng: Chỉ thêm các mục lịch sử không lặp lại
                const mergedHistory = [...existingHistory];
                let addedCount = 0;
                
                newHistory.forEach(newItem => {
                    // Kiểm tra xem đã tồn tại nội dung tương tự chưa (so sánh sau khi xóa khoảng trắng)
                    const trimmedNew = newItem.trim();
                    const isDuplicate = mergedHistory.some(existing => existing.trim() === trimmedNew);
                    
                    if (!isDuplicate && trimmedNew) {
                        mergedHistory.push(newItem);
                        addedCount++;
                        console.log(`[Thế giới động-Hợp nhất biến]   - ✅ Thêm lịch sử: ${newItem.substring(0, 50)}...`);
                    } else if (isDuplicate) {
                        console.log(`[Thế giới động-Hợp nhất biến]   - ⏭️ Bỏ qua trùng lặp: ${newItem.substring(0, 50)}...`);
                    }
                });
                
                // Chỉ hợp nhất khi có cập nhật thực tế
                if (addedCount > 0 || existing.favor !== newRel.favor || existing.opinion !== newRel.opinion) {
                    gameState.variables.relationships[existingIndex] = {
                        ...existing,
                        favor: newRel.favor !== undefined ? newRel.favor : existing.favor,
                        opinion: newRel.opinion !== undefined ? newRel.opinion : existing.opinion,
                        personality: newRel.personality !== undefined ? newRel.personality : existing.personality,
                        history: mergedHistory
                    };
                    
                    hasChanges = true;
                    console.log(`[Thế giới động-Hợp nhất biến]   - ✅ Cập nhật hoàn tất: ${newRel.name}, lịch sử: ${existingHistory.length} → ${mergedHistory.length} (thêm ${addedCount} mục)`);
                    console.log(`[Thế giới động-Hợp nhất biến]   - favor: ${existing.favor} → ${newRel.favor}`);
                    console.log(`[Thế giới động-Hợp nhất biến]   - opinion: ${existing.opinion} → ${newRel.opinion}`);
                } else {
                    console.log(`[Thế giới động-Hợp nhất biến]   - ⏭️ Bỏ qua (không có nội dung mới)`);
                }
            } else {
                console.log(`[Thế giới động-Hợp nhất biến]   - 🆕 Nhân vật mới, thêm vào danh sách`);
                
                // Thêm quan hệ mới
                gameState.variables.relationships.push(newRel);
                hasChanges = true;
                console.log(`[Thế giới động-Hợp nhất biến]   - ✅ Đã thêm quan hệ: ${newRel.name}`);
                console.log(`[Thế giới động-Hợp nhất biến]   - favor: ${newRel.favor}`);
                console.log(`[Thế giới động-Hợp nhất biến]   - opinion: ${newRel.opinion}`);
                console.log(`[Thế giới động-Hợp nhất biến]   - Số mục lịch sử: ${newRel.history?.length || 0}`);
            }
        }

        // 📊 Hiển thị trạng thái sau khi hợp nhất
        console.log('[Thế giới động-Hợp nhất biến] 📊 Số lượng relationships sau khi hợp nhất:', gameState.variables.relationships?.length);
        console.log('[Thế giới động-Hợp nhất biến] 📊 Danh sách relationships đầy đủ:', 
            gameState.variables.relationships.map(r => `${r.name}(${r.history?.length || 0} mục lịch sử)`).join(', '));

        // Chỉ cập nhật hiển thị khi có thay đổi thực tế
        if (hasChanges) {
            updateStatusPanel();
            console.log('[Thế giới động-Hợp nhất biến] ✅ Đã hợp nhất biến và cập nhật UI (có cập nhật)');
        } else {
            console.log('[Thế giới động-Hợp nhất biến] ⏭️ Đã kiểm tra biến (không có cập nhật, không làm mới UI)');
        }
    } else {
        console.warn('[Thế giới động-Hợp nhất biến] ⚠️ dynamicVariables.relationships không tồn tại hoặc không phải là mảng');
        console.log('[Thế giới động-Hợp nhất biến] dynamicVariables.relationships:', dynamicVariables.relationships);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Tạo lại nội dung Thế giới động
async function regenerateDynamicWorld(index) {
    if (gameState.dynamicWorld.isProcessing) {
        alert('Đang xử lý, vui lòng đợi...');
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn tạo lại nội dung Thế giới động này không?')) {
        return;
    }

    gameState.dynamicWorld.isProcessing = true;

    // Hiển thị thông báo đang tải bên trong container Thế giới động
    const dynamicWorldContainer = document.getElementById('dynamicWorldContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'dynamic-world-regenerate-loading';
    loadingDiv.style.cssText = 'text-align: center; padding: 40px; background: #f8f9ff; border-radius: 12px; margin: 20px;';
    loadingDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
        <div style="font-size: 16px; color: #667eea; margin-bottom: 10px;">
            <span class="loading"></span> AI đang tạo lại nội dung Thế giới động...
        </div>
        <div style="font-size: 12px; color: #999;">Vui lòng đợi trong giây lát...</div>
    `;
    dynamicWorldContainer.insertBefore(loadingDiv, dynamicWorldContainer.firstChild);

    try {
        // Lấy cấu hình
        const saved = localStorage.getItem('gameConfig');
        const config = saved ? JSON.parse(saved) : {};
        const dwConfig = config.dynamicWorld || {};

        const minWords = dwConfig.minWords || 300;
        const showReasoning = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;
        
        // 🔧 Ép buộc sử dụng Prompt Thế giới động của Bạch Hổ Tông
        let systemPrompt;
        if (dwConfig.prompt && dwConfig.prompt.trim()) {
            systemPrompt = dwConfig.prompt;
            console.log('[Thế giới động-Tạo lại] 📝 Sử dụng Prompt tùy chỉnh của người dùng');
        } else if (document.getElementById('dynamicWorldPrompt') && document.getElementById('dynamicWorldPrompt').value.trim()) {
            systemPrompt = document.getElementById('dynamicWorldPrompt').value;
            console.log('[Thế giới động-Tạo lại] 📝 Sử dụng Prompt từ HTML');
        } else if (typeof window.BaihuSectGameConfig !== 'undefined' && window.BaihuSectGameConfig.defaultDynamicWorldPrompt) {
            systemPrompt = window.BaihuSectGameConfig.defaultDynamicWorldPrompt;
            console.log('[Thế giới động-Tạo lại] 🐅 Sử dụng Prompt mặc định của Bạch Hổ Tông');
        } else {
            systemPrompt = 'Bạn là bộ tạo thế giới động cho thế giới Tu tiên Bạch Hổ Tông. Dựa trên trạng thái và vị trí hiện tại của nhân vật chính, hãy tạo các thông tin bối cảnh như sự kiện phương xa, biến động thế lực, thay đổi môi trường. Các sự kiện thế giới được tạo ra phải phù hợp với thiết lập thế giới quan của Bạch Hổ Tông, thể hiện đặc sắc của thế giới tu tiên và văn hóa độc đáo của Bạch Hổ Tông, bao gồm các yếu tố tu tiên thích hợp: đột phá cảnh giới, tranh đoạt pháp bảo, tông môn tranh đấu, v.v. Kể chuyện theo ngôi thứ ba, phong cách ngôn ngữ cổ điển nhã nhặn, mỗi đoạn khoảng 50-100 chữ, tạo ra 3-5 sự kiện bối cảnh khác nhau.';
            console.log('[Thế giới động-Tạo lại] 🐅 Sử dụng Prompt Bạch Hổ Tông được viết cứng');
        }

        // 🆕 Lấy trạng thái biến hiện tại
        const currentLocation = gameState.variables.location || 'Không rõ';
        const currentNPCs = gameState.variables.relationships.map(r => r.name).join('、') || 'Không có';
        const currentTime = gameState.variables.currentDateTime || 'Không rõ';

        // Xây dựng tin nhắn (chỉ dùng biến hiện tại, không dùng lịch sử)
        let messages = [];

        // 🆕 Tích hợp chức năng truy xuất kho kiến thức
        let knowledgeContext = '';
        const enableKnowledge = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;
        if (window.contextVectorManager && 
            document.getElementById('enableVectorRetrieval')?.checked && 
            enableKnowledge) {
            try {
                console.log('[Thế giới động-Tạo lại] Bắt đầu truy xuất kho kiến thức...');
                
                // Xây dựng truy vấn
                const queryText = `tạo lại thế giới động ${currentLocation} ${currentTime} sự kiện phương xa biến động thế lực`;
                
                // Sử dụng buildOptimizedMessages để lấy nội dung kho kiến thức
                const optimizedMessages = await window.contextVectorManager.buildOptimizedMessages(
                    systemPrompt,
                    gameState.variables,
                    queryText,
                    0, // Không cần lịch sử đối thoại
                    [], // Lịch sử trống
                    queryText // Truyền vào truy vấn
                );
                
                // Trích xuất các tin nhắn hệ thống liên quan đến kho kiến thức
                const knowledgeMessages = optimizedMessages.filter(msg => 
                    msg.role === 'system' && (
                        msg.content.includes('【相关历史回忆】') ||
                        msg.content.includes('【相关知识库】') ||
                        msg.content.includes('【⭐ 重点常驻知识】') ||
                        msg.content.includes('【📌 次重点常驻知识】') ||
                        msg.content.includes('【常驻知识库】')
                    )
                );
                
                if (knowledgeMessages.length > 0) {
                    knowledgeContext = '\n\n【🌍 Tham khảo Kho kiến thức Thế giới động - Có thể tắt trong cài đặt】\n' + 
                        knowledgeMessages.map((msg, index) => {
                            let content = msg.content;
                            if (content.includes('【相关历史回忆】')) content = '📜 [Ký ức lịch sử] ' + content;
                            else if (content.includes('【相关知识库】')) content = '📚 [Kiến thức liên quan] ' + content;
                            else if (content.includes('【⭐ 重点常驻知识】')) content = '⭐ [Kiến thức trọng điểm] ' + content;
                            else if (content.includes('【📌 次重点常驻知识】')) content = '📌 [Kiến thức phụ] ' + content;
                            else if (content.includes('【常驻知识库】')) content = '📖 [Kiến thức thường trực] ' + content;
                            return content;
                        }).join('\n\n');
                    console.log(`[Thế giới động-Tạo lại] Đã tích hợp ${knowledgeMessages.length} mục nội dung kho kiến thức`);
                }
                
            } catch (error) {
                console.warn('[Thế giới động-Tạo lại] Truy xuất kho kiến thức thất bại:', error);
            }
        }

        // Thêm Prompt hệ thống (bao gồm nội dung kho kiến thức)
        const finalSystemPrompt = systemPrompt + knowledgeContext;
        messages.push({
            role: 'system',
            content: finalSystemPrompt
        });
        
        const variableContext = `
【Trạng thái nhân vật chính hiện tại】（Chỉ dùng tham khảo, cấm sửa đổi）
- Thời gian hiện tại: ${currentTime}
- Vị trí hiện tại: ${currentLocation}
- NPC bên cạnh: ${currentNPCs}

【Yêu cầu nghiêm ngặt】
- Tạo lại các sự kiện thế giới cách xa nhân vật chính (địa điểm khác, nhân vật khác)
- Cấm thúc đẩy thời gian! Mô tả những gì đang diễn ra "ngay tại thời điểm này" (${currentTime}) ở những nơi khác
- Cấm liên quan đến bất kỳ sự kiện nào tại vị trí hiện tại "${currentLocation}"!
- Cấm liên quan đến các NPC sau: ${currentNPCs} (họ đang ở cạnh nhân vật chính)
- Cấm mô tả nhân vật chính đang làm gì!
- Cách làm đúng: Mô tả tin đồn phương xa, động thái của các thế lực tại những địa điểm hoàn toàn khác biệt
- Có thể thêm các NPC phương xa mới vào variables.relationships (nhưng phải là những người nhân vật chính chưa biết, xuất hiện trong lời đồn phương xa)
- Đừng sửa đổi dữ liệu NPC đã tồn tại (hệ thống sẽ tự động khử trùng và hợp nhất history)
- Yêu cầu số chữ: Ít nhất ${minWords} chữ
- Cung cấp các góc nhìn và sự kiện khác nhau (lời đồn phương xa)
        `.trim();

        messages.push({
            role: 'user',
            content: variableContext
        });

        messages.push({
            role: 'user',
            content: 'Hãy tạo nội dung Thế giới động mới.\n\n【Cực kỳ quan trọng】Phải xuất ra cấu trúc JSON hoàn chỉnh, tất cả các trường phải đầy đủ, không được cắt ngang giữa chừng! Đảm bảo tất cả các dấu ngoặc nhọn, ngoặc vuông, dấu ngoặc kép đều được đóng đúng cách!'
        });

        // Gọi API
        const response = await callExtraAPI(messages);

        // 🔍 Gỡ lỗi
        console.log('[Thế giới động-Tạo lại] Độ dài phản hồi gốc của API:', response.length, 'ký tự');

        // Phân tích phản hồi
        const data = parseAIResponse(response);

        // 🔍 Log gỡ lỗi: Hiển thị dữ liệu đầy đủ
        if (debugMode || document.getElementById('debugMode')?.checked) {
            console.log('[Thế giới động-Tạo lại-Gỡ lỗi] 📦 Dữ liệu phản hồi AI đầy đủ:');
            console.log('[Thế giới động-Tạo lại-Gỡ lỗi] - story sau khi phân tích:', data.story?.substring(0, 200));
            
            const debugContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Thế giới động Tạo lại - Đầu ra đầy đủ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【Phản hồi AI gốc】(${response.length} ký tự)
${response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Dữ liệu sau khi phân tích】
${JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Biểu mẫu biến (variables)】
${data.variables ? JSON.stringify(data.variables, null, 2) : 'Không có'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Chỉ thị cập nhật biến (variableUpdate)】
${data.variableUpdate || 'Không có'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Quan hệ nhân tế (Trích xuất từ variables)】
${data.variables?.relationships ? JSON.stringify(data.variables.relationships, null, 2) : 'Không có'}
`;
            showDebugOutput(debugContent);
        }

        // 🔧 Kiểm tra an toàn: Đảm bảo data.story tồn tại
        if (!data || !data.story) {
            console.error('[Thế giới động] Phân tích thất bại: data.story không tồn tại');
            throw new Error('Phân tích phản hồi AI thất bại, không lấy được nội dung câu chuyện. Vui lòng kiểm tra định dạng phản hồi của API.');
        }

        // Cập nhật bản ghi lịch sử
        gameState.dynamicWorld.history[index] = {
            ...gameState.dynamicWorld.history[index],
            story: data.story,
            reasoning: data.reasoning,
            variables: data.variables || {},
            variableUpdate: data.variableUpdate || null,
            timestamp: Date.now()
        };

        // Hợp nhất biến
        console.log('[Thế giới động-Tạo lại] Chuẩn bị hợp nhất biến...');
        
        if (data.variableUpdate) {
            console.log('[Thế giới động-Tạo lại] 🎯 Phát hiện định dạng variableUpdate (chỉ thị v3.1)');
            try {
                if (!window.v31Parser) {
                    console.log('[Thế giới động-Tạo lại] Khởi tạo bộ phân tích v3.1...');
                    window.v31Parser = new VariableInstructionParserV31(gameState, {
                        debug: true,
                        enableRollback: false
                    });
                }
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[Thế giới động-Tạo lại] ✅ Kết quả cập nhật biến v3.1:', result);
                updateStatusPanel();
            } catch (error) {
                console.error('[Thế giới động-Tạo lại] ❌ Cập nhật biến v3.1 thất bại:', error);
            }
        } else if (data.variables) {
            console.log('[Thế giới động-Tạo lại] 📋 Phát hiện định dạng variables (biểu mẫu đầy đủ)');
            mergeDynamicWorldVariables(data.variables);
        }

        // 🆕 Thêm vào kho vector
        if (window.contextVectorManager && document.getElementById('enableVectorRetrieval')?.checked) {
            const floor = gameState.dynamicWorld.history[index].floor;
            const dynamicWorldTurnIndex = -floor;
            const storyPreview = data.story.length > 100 ? data.story.substring(0, 100) : data.story;
            
            await window.contextVectorManager.addConversation(
                '[Thế giới động-Tạo lại] ' + storyPreview,
                data.story,
                dynamicWorldTurnIndex,
                data.story
            );
            await window.contextVectorManager.saveToIndexedDB();
            console.log(`[Thế giới động] Đã vector hóa nội dung tạo lại (Tầng ${floor}, turnIndex: ${dynamicWorldTurnIndex})`);
        }

        // Loại bỏ thông báo đang tải
        const loading = document.getElementById('dynamic-world-regenerate-loading');
        if (loading) loading.remove();

        // Cập nhật hiển thị Tab Thế giới động
        displayDynamicWorldHistory();

        console.log('[Thế giới động] Tạo lại thành công');

        // Tự động lưu game
        await saveGameHistory();

    } catch (error) {
        console.error('[Thế giới động] Tạo lại thất bại:', error);
        
        let errorMsg = 'Tạo lại thất bại: ' + error.message;
        if (error.message.includes('AI响应解析失败')) {
            errorMsg += '\n\nGiải pháp khả thi:\n';
            errorMsg += '1. Kiểm tra cấu hình API, đảm bảo mô hình hỗ trợ xuất định dạng JSON\n';
            errorMsg += '2. Giảm thiết lập "Số chữ tối thiểu Thế giới động" (khuyên dùng 150-200 chữ)\n';
            errorMsg += '3. Tăng giới hạn max_tokens của API\n';
            errorMsg += '4. Thử sử dụng mô hình AI khác';
        }
        
        alert(errorMsg);
    } finally {
        gameState.dynamicWorld.isProcessing = false;
    }
}

// Hiển thị tin nhắn Thế giới động trong lịch sử game
function displayDynamicWorldMessage(story, reasoning = null, showReasoning = true, isRegenerate = false) {
    const historyDiv = document.getElementById('gameHistory');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.setAttribute('data-message-index', historyDiv.children.length);

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'message-checkbox';
    checkbox.style.display = gameState.deleteMode ? 'inline-block' : 'none';
    checkbox.onclick = (e) => {
        e.stopPropagation();
        handleMessageCheck(messageDiv);
    };

    headerDiv.innerHTML = `
        <span>🌍 Thế giới động${isRegenerate ? '（Tạo lại）' : ''}</span>
    `;
    headerDiv.insertBefore(checkbox, headerDiv.firstChild);

    messageDiv.appendChild(headerDiv);

    if (reasoning && showReasoning) {
        const reasoningHtml = createDynamicWorldReasoningDisplay(reasoning);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reasoningHtml;
        const reasoningDiv = tempDiv.firstElementChild;
        if (reasoningDiv) {
            messageDiv.appendChild(reasoningDiv);
        }
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = story;

    messageDiv.appendChild(contentDiv);

    historyDiv.appendChild(messageDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// 📨 Kích hoạt tin nhắn tự động từ bạn bè
function triggerAutoFriendMessage() {
    if (typeof window.generateAutoFriendMessage === 'function') {
        window.generateAutoFriendMessage().catch(err => {
            console.error('[📨Tin nhắn bạn bè] Lỗi khi tạo:', err);
        });
    }
}

// Thêm kích hoạt tin nhắn bạn bè vào hook sau khi tạo Thế giới động hoàn tất
window.triggerPostMessageHooks = function() {
    // Kích hoạt Thế giới động
    if (typeof generateDynamicWorld === 'function') {
        generateDynamicWorld().catch(err => console.error('[Thế giới động] Lỗi khi tạo:', err));
    }
    
    // Kích hoạt tin nhắn tự động từ bạn bè
    triggerAutoFriendMessage();
};

console.log('[Hàm Thế giới động] Module đã tải (bao gồm hook kích hoạt tin nhắn bạn bè)');

