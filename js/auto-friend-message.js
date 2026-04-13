/**
 * 📨 Module chức năng tin nhắn tự động từ bạn bè
 * Tương tự như thế giới động, tự động kích hoạt sau mỗi N tầng hội thoại, 
 * lựa chọn ngẫu nhiên một người bạn để gửi tin nhắn.
 */

// Bộ đếm tin nhắn (dùng để xác định khoảng cách kích hoạt)
window.autoFriendMessageCounter = 0;

// Trạng thái đang xử lý
window.autoFriendMessageProcessing = false;

/**
 * Tạo tin nhắn tự động từ bạn bè
 * @param {boolean} forceGenerate - Có bắt buộc tạo hay không (bỏ qua bộ đếm khoảng cách)
 */
async function generateAutoFriendMessage(forceGenerate = false) {
    console.log('[📨Tin nhắn bạn bè] Kích hoạt hàm tạo');
    
    // Lấy cài đặt
    const settings = window.mobilePhoneSettings || {};
    
    // Kiểm tra xem chức năng có được bật không
    if (!settings.enableAutoFriendMessage) {
        console.log('[📨Tin nhắn bạn bè] Chức năng chưa bật, bỏ qua');
        return;
    }
    
    // Kiểm tra cấu hình API điện thoại
    const mobileApiConfig = window.mobileApiConfig || {};
    if (!mobileApiConfig.enabled || !mobileApiConfig.key) {
        console.warn('[📨Tin nhắn bạn bè] API điện thoại chưa cấu hình, bỏ qua');
        return;
    }
    
    // Tăng bộ đếm và kiểm tra khoảng cách
    if (!forceGenerate) {
        window.autoFriendMessageCounter = (window.autoFriendMessageCounter || 0) + 1;
        const interval = settings.autoFriendMessageInterval || 3;
        
        if (window.autoFriendMessageCounter < interval) {
            console.log(`[📨Tin nhắn bạn bè] Chưa đạt khoảng cách (${window.autoFriendMessageCounter}/${interval}), bỏ qua`);
            return;
        }
        
        // Đạt khoảng cách, đặt lại bộ đếm
        console.log('[📨Tin nhắn bạn bè] Đạt khoảng cách yêu cầu, bắt đầu tạo');
        window.autoFriendMessageCounter = 0;
    } else {
        console.log('[📨Tin nhắn bạn bè] Bắt buộc kích hoạt tạo tin nhắn');
    }
    
    // Tránh xử lý trùng lặp
    if (window.autoFriendMessageProcessing) {
        console.warn('[📨Tin nhắn bạn bè] Đang trong quá trình xử lý, bỏ qua');
        return;
    }
    
    window.autoFriendMessageProcessing = true;
    
    try {
        // 1. Lấy danh sách bạn bè
        const contacts = getAvailableContacts();
        if (contacts.length === 0) {
            console.log('[📨Tin nhắn bạn bè] Không có liên lạc bạn bè khả dụng');
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        // 2. Chọn ngẫu nhiên một người bạn
        const randomFriend = contacts[Math.floor(Math.random() * contacts.length)];
        console.log('[📨Tin nhắn bạn bè] Đã chọn ngẫu nhiên:', randomFriend.name);
        
        // 3. Thu thập thông tin ngữ cảnh
        const contextData = await collectContextData(randomFriend, settings);
        
        // 4. Xây dựng yêu cầu API
        const messageCount = {
            min: settings.autoFriendMessageMinCount || 3,
            max: settings.autoFriendMessageMaxCount || 5
        };
        
        const systemPrompt = window.MobilePrompts?.autoFriendMessage?.buildSystemPrompt(
            randomFriend.name, 
            messageCount
        );
        
        const userMessage = window.MobilePrompts?.autoFriendMessage?.buildUserMessage({
            friendInfo: contextData.friendInfo,
            chatHistory: contextData.chatHistory,
            gameContext: contextData.gameContext,
            vectorMatches: contextData.vectorMatches,
            historyRecords: contextData.historyRecords
        });
        
        console.log('[📨Tin nhắn bạn bè] Đang gửi yêu cầu API...');
        console.log('[📨Tin nhắn bạn bè] Độ dài System Prompt:', systemPrompt?.length || 0);
        console.log('[📨Tin nhắn bạn bè] Độ dài User Message:', userMessage?.length || 0);
        
        // Kiểm tra tin nhắn đã được xây dựng đúng chưa
        if (!systemPrompt || !userMessage) {
            console.error('[📨Tin nhắn bạn bè] Xây dựng tin nhắn thất bại!');
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        // 5. Gọi API điện thoại
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];
        
        console.log('[📨Tin nhắn bạn bè] Xem trước tin nhắn gửi đi:', JSON.stringify(messages).substring(0, 500) + '...');
        
        const response = await callMobileAPIForAutoMessage(messages);
        
        console.log('[📨Tin nhắn bạn bè] Phản hồi API:', response?.substring(0, 500) || '(Phản hồi trống)');
        
        // 6. Phân tích phản hồi
        const replies = window.MobilePrompts?.autoFriendMessage?.parseAIReply(response);
        
        if (!replies || replies.length === 0) {
            console.warn('[📨Tin nhắn bạn bè] AI không trả về tin nhắn hợp lệ');
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        console.log(`[📨Tin nhắn bạn bè] Nhận được ${replies.length} tin nhắn`);
        
        // 7. Lưu tin nhắn vào lịch sử chat
        await saveAutoMessages(randomFriend, replies);
        
        // 8. Hiển thị thông báo
        showAutoMessageNotification(randomFriend, replies.length);
        
        // 9. 🔧 Kích hoạt tự động lưu để đảm bảo tin nhắn được ghi vào IndexedDB
        if (typeof saveGameHistory === 'function') {
            saveGameHistory().then(() => {
                console.log('[📨Tin nhắn bạn bè] Đã tự động lưu vào bản ghi');
            }).catch(err => {
                console.warn('[📨Tin nhắn bạn bè] Tự động lưu thất bại:', err);
            });
        }
        
        console.log('[📨Tin nhắn bạn bè] Hoàn tất quá trình tạo');
        
    } catch (error) {
        console.error('[📨Tin nhắn bạn bè] Quá trình tạo thất bại:', error);
    } finally {
        window.autoFriendMessageProcessing = false;
    }
}

/**
 * Lấy danh sách liên lạc bạn bè khả dụng
 */
function getAvailableContacts() {
    let contacts = [];
    
    // Lấy dữ liệu chat điện thoại từ localStorage
    try {
        const saved = localStorage.getItem('mobileChatData');
        if (saved) {
            const data = JSON.parse(saved);
            contacts = data.contacts || [];
        }
    } catch (e) {
        console.warn('[📨Tin nhắn bạn bè] Đọc danh sách liên lạc thất bại:', e);
    }
    
    // Loại bỏ chat nhóm, chỉ giữ lại chat riêng tư
    return contacts.filter(c => c.type === 'private');
}

/**
 * Thu thập dữ liệu ngữ cảnh
 */
async function collectContextData(friend, settings) {
    const contextData = {
        friendInfo: null,
        chatHistory: [],
        gameContext: null,
        vectorMatches: [],
        historyRecords: []
    };
    
    // 1. Lấy thông tin sơ đồ nhân vật
    if (settings.autoFriendUseCharacterGraph) {
        contextData.friendInfo = getCharacterGraphInfo(friend.name);
        if (!contextData.friendInfo) {
            // Nếu không có trong sơ đồ, thử lấy từ relationships
            contextData.friendInfo = getRelationshipInfo(friend.name);
        }
        if (!contextData.friendInfo) {
            // Cuối cùng sử dụng thông tin cơ bản
            contextData.friendInfo = { name: friend.name };
        }
        console.log('[📨Tin nhắn bạn bè] Sơ đồ nhân vật:', contextData.friendInfo?.name || 'Không có');
    }
    
    // 2. Lấy lịch sử chat
    if (settings.autoFriendUseChatHistory) {
        const chatId = `chat_${friend.id}`;
        contextData.chatHistory = getChatHistory(chatId);
        console.log('[📨Tin nhắn bạn bè] Lịch sử chat:', contextData.chatHistory.length, 'mục');
    }
    
    // 3. Lấy ngữ cảnh cốt truyện chính
    const historyDepth = settings.autoFriendMainHistoryDepth || 5;
    if (historyDepth > 0) {
        contextData.gameContext = getGameContext(historyDepth);
        console.log('[📨Tin nhắn bạn bè] Ngữ cảnh game:', contextData.gameContext ? 'Có' : 'Không');
    }
    
    // 4. Khớp nội dung chính qua Vector
    if (settings.autoFriendUseVectorSearch && window.contextVectorManager) {
        const vectorCount = settings.autoFriendVectorCount || 3;
        const queryText = `${friend.name} ${contextData.friendInfo?.relation || ''} ${contextData.friendInfo?.personality || ''}`;
        
        try {
            const results = await window.contextVectorManager.retrieveRelevant(queryText, vectorCount, 'conversation');
            contextData.vectorMatches = results || [];
            console.log('[📨Tin nhắn bạn bè] Khớp Vector:', contextData.vectorMatches.length, 'mục');
        } catch (e) {
            console.warn('[📨Tin nhắn bạn bè] Khớp Vector thất bại:', e);
        }
    }
    
    // 5. Lấy bản ghi History
    if (settings.autoFriendUseHistory && window.gameState?.history) {
        contextData.historyRecords = window.gameState.history.slice(-20) || [];
        console.log('[📨Tin nhắn bạn bè] Bản ghi History:', contextData.historyRecords.length, 'mục');
    }
    
    return contextData;
}

/**
 * Lấy thông tin nhân vật từ sơ đồ nhân vật
 */
function getCharacterGraphInfo(name) {
    if (!window.characterGraphManager) return null;
    
    try {
        const characters = window.characterGraphManager.getAllCharacters?.() || [];
        return characters.find(c => c.name === name);
    } catch (e) {
        console.warn('[📨Tin nhắn bạn bè] Đọc sơ đồ nhân vật thất bại:', e);
        return null;
    }
}

/**
 * Lấy thông tin nhân vật từ relationships
 */
function getRelationshipInfo(name) {
    if (!window.gameState?.variables?.relationships) return null;
    
    return window.gameState.variables.relationships.find(r => r.name === name);
}

/**
 * Lấy lịch sử chat
 */
function getChatHistory(chatId) {
    try {
        const saved = localStorage.getItem('mobileChatData');
        if (saved) {
            const data = JSON.parse(saved);
            const chat = data.chatStorage?.[chatId];
            return chat?.history || [];
        }
    } catch (e) {
        console.warn('[📨Tin nhắn bạn bè] Đọc lịch sử chat thất bại:', e);
    }
    return [];
}

/**
 * Lấy ngữ cảnh trò chơi
 */
function getGameContext(depth) {
    if (!window.gameState?.conversationHistory) return null;
    
    const history = window.gameState.conversationHistory;
    const recentMessages = history.slice(-depth * 2);
    
    if (recentMessages.length === 0) return null;
    
    let context = '';
    recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '【Hành động người chơi】' : '【Phát triển cốt truyện】';
        const content = msg.content?.length > 300 ? msg.content.substring(0, 300) + '...' : msg.content;
        context += `${role}: ${content}\n\n`;
    });
    
    return context;
}

/**
 * Gọi API điện thoại (Dành cho tin nhắn tự động)
 * Hàm này ghi đè với xử lý hỗ trợ stream và định dạng đa dạng.
 */
async function callMobileAPIForAutoMessage(messages) {
    const config = window.mobileApiConfig;

    if (!config || !config.key || !config.endpoint) {
        throw new Error('API điện thoại chưa được cấu hình.');
    }

    if ((config.type || 'openai') === 'gemini') {
        return await requestGeminiCompletion(config, messages, {
            temperature: 0.8,
            maxTokens: 8192,
            errorPrefix: 'Lỗi Gemini API tin nhắn tự động',
            blockedMessage: '(Tin nhắn tự động) Gemini không trả về nội dung.'
        });
    }

    return await requestOpenAICompatibleCompletion(config, messages, {
        temperature: 0.8,
        maxTokens: 8192,
        errorPrefix: 'Lỗi API tin nhắn tự động',
        logPrefix: '[Tin nhắn tự động] Phản hồi thô:',
        warnPrefix: '[callMobileAPIForAutoMessage] Thiếu lựa chọn (choices):',
        emptyMessage: 'Định dạng phản hồi API tin nhắn tự động không hợp lệ.'
    });
}

/**
 * Lưu tin nhắn tự động vào lịch sử chat
 */
async function saveAutoMessages(friend, replies) {
    const chatId = `chat_${friend.id}`;
    
    try {
        // Đọc dữ liệu hiện có
        const saved = localStorage.getItem('mobileChatData');
        const data = saved ? JSON.parse(saved) : { chatStorage: {}, contacts: [] };
        
        // Đảm bảo bản ghi chat tồn tại
        if (!data.chatStorage[chatId]) {
            data.chatStorage[chatId] = {
                info: { name: friend.name, id: chatId, type: 'private' },
                messages: [],
                history: []
            };
        }
        
        // Thêm tin nhắn
        replies.forEach(reply => {
            const message = {
                direction: 'incoming',
                chatType: 'private',
                target: { name: 'Tôi', id: 'self' },
                sender: { name: friend.name, id: friend.id },
                msgType: 'text',
                content: reply.content,
                timestamp: Date.now(),
                isAutoGenerated: true  // Đánh dấu là tạo tự động
            };
            
            data.chatStorage[chatId].messages.push(message);
            data.chatStorage[chatId].history.push({
                role: 'assistant',
                content: reply.content,
                sender: { name: friend.name }
            });
        });
        
        // Giới hạn độ dài lịch sử
        if (data.chatStorage[chatId].history.length > 50) {
            data.chatStorage[chatId].history = data.chatStorage[chatId].history.slice(-50);
        }
        
        // Lưu lại vào localStorage
        localStorage.setItem('mobileChatData', JSON.stringify(data));
        
        console.log(`[📨Tin nhắn bạn bè] Đã lưu ${replies.length} tin nhắn vào lịch sử chat của ${friend.name}`);
        
        // Thông báo cho iframe điện thoại làm mới dữ liệu (nếu có)
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                mobileFrame.contentWindow.postMessage({
                    type: 'MOBILE_DATA_REFRESH',
                    chatId: chatId
                }, '*');
            }
        } catch (e) {
            // iframe có thể không tồn tại hoặc lỗi khác nguồn (CORS)
        }
        
    } catch (e) {
        console.error('[📨Tin nhắn bạn bè] Lưu tin nhắn thất bại:', e);
    }
}

/**
 * Hiển thị thông báo tin nhắn tự động
 */
function showAutoMessageNotification(friend, messageCount) {
    // Tạo phần tử thông báo
    const notification = document.createElement('div');
    notification.className = 'auto-friend-message-notification';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📱</span>
            <div>
                <div style="font-weight: bold;">${friend.name} đã gửi tin nhắn</div>
                <div style="font-size: 12px; opacity: 0.8;">Nhận được ${messageCount} tin nhắn mới</div>
            </div>
        </div>
    `;
    
    // CSS trực tiếp cho thông báo
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #bf00ff 0%, #00f3ff 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(191, 0, 255, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
    `;
    
    // Thêm các keyframe animation vào head nếu chưa có
    if (!document.getElementById('auto-friend-notification-style')) {
        const style = document.createElement('style');
        style.id = 'auto-friend-notification-style';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Click để đóng
    notification.onclick = () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    };
    
    document.body.appendChild(notification);
    
    // Tự động biến mất sau 5 giây
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Phơi bày hàm ra phạm vi toàn cục
window.generateAutoFriendMessage = generateAutoFriendMessage;

console.log('[📨Tin nhắn bạn bè] Module đã được tải');