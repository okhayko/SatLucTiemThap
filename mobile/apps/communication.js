// 📱 Lắng nghe phản hồi AI từ trang cha (Giao tiếp qua postMessage)
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'MOBILE_AI_RESPONSE') {
        console.log('[📱Ứng dụng Nhắn tin] Đã nhận phản hồi từ AI');
        
        const { loadingId, success, reply, error } = event.data;
        
        // Xóa trạng thái đang tải
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.parentElement.parentElement.parentElement.remove();
        }
        
        // Phân tích và hiển thị phản hồi
        if (success && reply) {
            // Dùng module Prompt để phân tích phản hồi
            if (window.MobilePrompts && window.MobilePrompts.communication) {
                const replies = window.MobilePrompts.communication.parseAIReply(reply);
                replies.forEach(msg => {
                    // Dựa vào sender.id để hiển thị ở khung chat tương ứng (Hiện tại xử lý đơn giản: hiển thị trực tiếp)
                    window.commApi.addMsg('left', msg.content, msg.sender?.name);
                });
            } else {
                window.commApi.addMsg('left', reply);
            }
        } else {
            window.commApi.addMsg('left', `❌ ${error || 'Lỗi kết nối'}`);
        }
        
        // Cập nhật trạng thái nút Gửi Gộp (Batch Send)
        window.commApi.updateBatchBtn();
    }
});

// Định nghĩa chức năng giao tiếp toàn cục
window.commApi = {
    searchMode: 'friend', // Chế độ tìm kiếm hiện tại: 'friend' (Bạn bè) hoặc 'group' (Nhóm)
    
    // 📨 Hàng đợi tin nhắn chờ gửi
    pendingMessages: [],
    
    // Thông tin cuộc trò chuyện hiện tại
    currentChat: {
        name: '',
        id: '',
        type: 'private', // 'private' (Cá nhân) hoặc 'group' (Nhóm)
        groupInfo: null
    },
    
    // 💾 Lưu trữ lịch sử trò chuyện { chatId: { info: {...}, messages: [...], history: [...] } }
    chatStorage: {},
    
    // Danh sách liên hệ
    contacts: [],
    
    // Lưu lịch sử trò chuyện vào bộ nhớ
    saveChatMessage: (chatId, message) => {
        if (!window.commApi.chatStorage[chatId]) {
            window.commApi.chatStorage[chatId] = {
                info: { ...window.commApi.currentChat },
                messages: [],  // Tin nhắn hiển thị trên UI
                history: []    // Ngữ cảnh lịch sử gửi cho AI
            };
        }
        
        // Thêm vào danh sách tin nhắn
        window.commApi.chatStorage[chatId].messages.push({
            ...message,
            timestamp: Date.now()
        });
        
        // Nếu là tin nhắn của người dùng hoặc phản hồi từ AI, thêm vào ngữ cảnh lịch sử
        if (message.direction === 'outgoing' || message.direction === 'incoming') {
            window.commApi.chatStorage[chatId].history.push({
                role: message.direction === 'outgoing' ? 'user' : 'assistant',
                content: message.content,
                sender: message.sender
            });
            
            // Giới hạn độ dài của ngữ cảnh lịch sử (Giữ tối đa 20 mục)
            if (window.commApi.chatStorage[chatId].history.length > 20) {
                window.commApi.chatStorage[chatId].history = 
                    window.commApi.chatStorage[chatId].history.slice(-20);
            }
        }
        
        // Tự động lưu vào localStorage
        window.commApi.saveToStorage();
        console.log('[📱Lưu trữ Chat] Đã lưu tin nhắn vào', chatId);
    },
    
    // Lấy ngữ cảnh lịch sử của cuộc trò chuyện hiện tại (Dành cho AI)
    getChatHistory: (chatId) => {
        const chat = window.commApi.chatStorage[chatId];
        if (!chat) return [];
        return chat.history || [];
    },
    
    // Lấy danh sách tin nhắn (Dành cho hiển thị UI)
    getChatMessages: (chatId) => {
        const chat = window.commApi.chatStorage[chatId];
        if (!chat) return [];
        return chat.messages || [];
    },
    
    // Lưu vào localStorage
    saveToStorage: () => {
        try {
            const data = {
                chatStorage: window.commApi.chatStorage,
                contacts: window.commApi.contacts
            };
            localStorage.setItem('mobileChatData', JSON.stringify(data));
        } catch (e) {
            console.error('[📱Lưu trữ Chat] Lưu thất bại:', e);
        }
    },
    
    // Tải từ localStorage
    loadFromStorage: () => {
        try {
            const saved = localStorage.getItem('mobileChatData');
            if (saved) {
                const data = JSON.parse(saved);
                window.commApi.chatStorage = data.chatStorage || {};
                window.commApi.contacts = data.contacts || [];
                console.log('[📱Lưu trữ Chat] Đã tải lịch sử trò chuyện');
            }
        } catch (e) {
            console.error('[📱Lưu trữ Chat] Tải thất bại:', e);
        }
    },
    
    // Xuất dữ liệu lưu trữ (Dùng cho lưu game)
    exportSaveData: () => {
        return {
            chatStorage: window.commApi.chatStorage,
            contacts: window.commApi.contacts
        };
    },
    
    // Nhập dữ liệu lưu trữ (Khôi phục từ file lưu game)
    importSaveData: (data) => {
        if (data) {
            window.commApi.chatStorage = data.chatStorage || {};
            window.commApi.contacts = data.contacts || [];
            window.commApi.saveToStorage();
            console.log('[📱Lưu trữ Chat] Đã khôi phục từ file lưu');
        }
    },
    
    // Xóa toàn bộ dữ liệu trò chuyện
    clearAllData: () => {
        window.commApi.chatStorage = {};
        window.commApi.contacts = [];
        window.commApi.currentChat = { name: '', id: '', type: 'private', groupInfo: null };
        window.commApi.pendingMessages = [];
        localStorage.removeItem('mobileChatData');
        console.log('[📱Lưu trữ Chat] Dữ liệu đã bị xóa');
    },

    // Chuyển đổi Tab
    switchTab: (el, mode) => {
        // Cập nhật trạng thái active
        const tabs = document.querySelectorAll('.add-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        el.classList.add('active');
        
        // Cập nhật chế độ tìm kiếm
        window.commApi.searchMode = mode;
        
        // Cập nhật dòng chữ gợi ý và ô nhập liệu
        const input = document.getElementById('search-input');
        const hint = document.getElementById('search-hint');
        const results = document.getElementById('search-results');
        
        if (mode === 'friend') {
            input.placeholder = 'NHẬP_ID_NGƯỜI_DÙNG...';
            results.innerHTML = '<div class="search-hint" id="search-hint">// Nhập ID người dùng hoặc tên để tìm bạn bè</div>';
        } else {
            input.placeholder = 'NHẬP_TÊN_NHÓM...';
            results.innerHTML = '<div class="search-hint" id="search-hint">// Nhập tên nhóm chat hoặc ID để tìm nhóm</div>';
        }
        input.value = '';
    },

    openChat: (name, type, id = null) => {
        const listView = document.getElementById('comm-list-view');
        const detailView = document.getElementById('comm-detail-view');
        const nameEl = document.getElementById('chat-detail-name');
        
        // Cài đặt thông tin cuộc trò chuyện hiện tại
        const chatId = id || 'chat_' + name.replace(/\s+/g, '_');
        window.commApi.currentChat = {
            name: name,
            id: chatId,
            type: type === 'group' ? 'group' : 'private',
            groupInfo: type === 'group' ? { name: name, id: chatId } : null
        };
        
        // Làm trống hàng đợi tin nhắn chờ gửi
        window.commApi.pendingMessages = [];
        
        // Lấy Header của khung chính và ẩn đi
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';

        // Điều chỉnh padding của app-body để vừa toàn màn hình
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && detailView && nameEl) {
            listView.classList.add('hidden');
            detailView.classList.remove('hidden');
            nameEl.textContent = name;
            
            // Làm trống vùng chứa tin nhắn
            const msgContainer = document.getElementById('chat-messages');
            msgContainer.innerHTML = '';
            
            // Tải lịch sử trò chuyện đã lưu
            const savedMessages = window.commApi.getChatMessages(chatId);
            if (savedMessages.length > 0) {
                console.log('[📱Trò chuyện] Tải các tin nhắn đã lưu:', savedMessages.length, 'tin');
                savedMessages.forEach((msg, index) => {
                    const side = msg.direction === 'outgoing' ? 'right' : 'left';
                    window.commApi.addMsgToUI(side, msg.content, msg.sender?.name, index);
                });
            } else {
                // Lần đầu trò chuyện, hiển thị lời chào
                window.commApi.addMsgToUI('left', `Kênh kết nối mã hóa với ${name} đã được thiết lập`);
            }
            
            // Cập nhật trạng thái nút Gửi Gộp
            window.commApi.updateBatchBtn();
        }
    },

    closeChat: () => {
        const listView = document.getElementById('comm-list-view');
        const detailView = document.getElementById('comm-detail-view');
        
        // Phục hồi Header của khung chính
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';

        // Phục hồi style cho app-body
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && detailView) {
            detailView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
    },

    // Gửi tin nhắn (Chỉ hiển thị lên UI, thêm vào hàng đợi chờ gửi)
    sendMsg: () => {
        const input = document.getElementById('chat-input-box');
        if (input && input.value.trim()) {
            const text = input.value.trim();
            const chat = window.commApi.currentChat;
            
            // Hiển thị lên UI
            window.commApi.addMsg('right', text);
            input.value = '';
            
            // Tạo đối tượng tin nhắn và thêm vào hàng đợi
            if (window.MobilePrompts && window.MobilePrompts.communication) {
                const msgObj = window.MobilePrompts.communication.createOutgoingMessage(
                    text,
                    chat.name,
                    chat.id,
                    chat.type,
                    chat.groupInfo
                );
                window.commApi.pendingMessages.push(msgObj);
                console.log('[📱Ứng dụng Nhắn tin] Tin nhắn đã được đưa vào hàng đợi:', msgObj);
            } else {
                // Nếu module Prompt chưa được load, sử dụng định dạng đơn giản
                window.commApi.pendingMessages.push({
                    direction: "outgoing",
                    chatType: chat.type,
                    target: { name: chat.name, id: chat.id },
                    sender: { name: "Tôi", id: "self" },
                    msgType: "text",
                    content: text
                });
            }
            
            // Cập nhật trạng thái nút Gửi Gộp
            window.commApi.updateBatchBtn();
        }
    },
    
    // 📤 Gửi gộp (Gửi tất cả tin nhắn trong hàng đợi cho AI cùng một lúc)
    sendBatch: async () => {
        if (window.commApi.pendingMessages.length === 0) {
            console.log('[📱Ứng dụng Nhắn tin] Không có tin nhắn chờ gửi');
            return;
        }
        
        const messages = [...window.commApi.pendingMessages];
        const chat = window.commApi.currentChat;
        
        console.log('[📱Ứng dụng Nhắn tin] Gửi gộp ' + messages.length + ' tin nhắn');
        
        // Lấy ngữ cảnh lịch sử của cuộc trò chuyện hiện tại (Chỉ gửi lịch sử của đối tượng đang trò chuyện)
        const chatHistory = window.commApi.getChatHistory(chat.id);
        console.log('[📱Ứng dụng Nhắn tin] Lịch sử trò chuyện hiện tại:', chatHistory.length, 'tin');
        
        // Xóa hàng đợi
        window.commApi.pendingMessages = [];
        window.commApi.updateBatchBtn();
        
        // Hiển thị trạng thái đang tải (Không lưu vào bộ nhớ)
        const loadingId = 'loading-' + Date.now();
        window.commApi.addMsgToUI('left', '<span id="' + loadingId + '" class="loading-dots">Đang gửi...</span>');
        
        // Xây dựng JSON cho tin nhắn của người dùng
        let userMessageJson;
        if (window.MobilePrompts && window.MobilePrompts.communication) {
            userMessageJson = window.MobilePrompts.communication.buildUserMessage(messages);
        } else {
            userMessageJson = JSON.stringify({ messages: messages }, null, 2);
        }
        
        // Gửi yêu cầu đến trang cha qua postMessage
        try {
            console.log('[📱Ứng dụng Nhắn tin] Đang gửi tin nhắn gộp cho trang cha...');
            console.log('[📱Ứng dụng Nhắn tin] Loại trò chuyện:', chat.type);
            window.parent.postMessage({
                type: 'MOBILE_AI_REQUEST',
                userMessage: userMessageJson,
                chatContext: chat.name,
                chatId: chat.id,
                chatType: chat.type,  // Thêm loại trò chuyện (private/group)
                chatHistory: chatHistory,  // Gửi ngữ cảnh lịch sử của cuộc trò chuyện hiện tại
                loadingId: loadingId,
                isBatchMessage: true  // Đánh dấu là gửi gộp
            }, '*');
        } catch (error) {
            console.error('[📱Ứng dụng Nhắn tin] Lỗi postMessage:', error);
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) {
                loadingEl.parentElement.parentElement.parentElement.remove();
            }
            window.commApi.addMsg('left', `❌ Lỗi kết nối: ${error.message}`);
        }
    },
    
    // Cập nhật trạng thái nút Gửi Gộp
    updateBatchBtn: () => {
        const btn = document.getElementById('batch-send-btn');
        if (btn) {
            const count = window.commApi.pendingMessages.length;
            if (count > 0) {
                btn.textContent = `Gửi(${count})`;
                btn.classList.add('has-pending');
            } else {
                btn.textContent = 'Gửi';
                btn.classList.remove('has-pending');
            }
        }
    },

    // Xóa tin nhắn (Từ cả UI và bộ nhớ)
    deleteMessage: (msgElement, msgIndex = null) => {
        if (!msgElement) return;
        
        // Xóa khỏi UI
        msgElement.remove();
        
        // Xóa khỏi bộ nhớ
        const chat = window.commApi.currentChat;
        if (chat.id && window.commApi.chatStorage[chat.id]) {
            const messages = window.commApi.chatStorage[chat.id].messages;
            // Xóa luôn lịch sử tương ứng
            const history = window.commApi.chatStorage[chat.id].history;
            
            if (msgIndex !== null && msgIndex >= 0 && msgIndex < messages.length) {
                messages.splice(msgIndex, 1);
                // Xóa đồng bộ trong history (Chỉ mục có thể không khớp hoàn toàn, nhưng cố gắng giữ nhất quán)
                if (history && history.length > msgIndex) {
                    history.splice(msgIndex, 1);
                }
            } else {
                // Nếu không chỉ định index, xóa tin nhắn cuối cùng
                messages.pop();
                if (history && history.length > 0) {
                    history.pop();
                }
            }
            window.commApi.saveToStorage();
            
            // Thông báo cho game chính đồng bộ lưu vào IndexedDB
            window.commApi.notifyMainGameToSave();
            console.log('[📱Trò chuyện] Đã xóa tin nhắn (Đồng bộ với IndexedDB)');
        }
    },
    
    // Làm trống toàn bộ tin nhắn của cuộc trò chuyện hiện tại
    clearCurrentChat: () => {
        const chat = window.commApi.currentChat;
        if (chat.id && window.commApi.chatStorage[chat.id]) {
            window.commApi.chatStorage[chat.id].messages = [];
            window.commApi.chatStorage[chat.id].history = [];
            window.commApi.saveToStorage();
            
            // Làm trống UI
            const container = document.getElementById('chat-messages');
            if (container) {
                container.innerHTML = '';
                window.commApi.addMsgToUI('left', `Lịch sử trò chuyện với ${chat.name} đã được dọn dẹp`);
            }
            
            // Thông báo cho game chính đồng bộ lưu vào IndexedDB
            window.commApi.notifyMainGameToSave();
            console.log('[📱Trò chuyện] Đã dọn dẹp cuộc trò chuyện hiện tại (Đồng bộ với IndexedDB)');
        }
    },
    
    // Thông báo cho game chính đồng bộ lưu vào IndexedDB
    notifyMainGameToSave: () => {
        try {
            window.parent.postMessage({
                type: 'MOBILE_DATA_CHANGED',
                action: 'save',
                data: window.commApi.exportSaveData()
            }, '*');
            console.log('[📱Trò chuyện] Đã thông báo cho game chính để lưu đồng bộ');
        } catch (e) {
            console.warn('[📱Trò chuyện] Thông báo cho game chính thất bại:', e);
        }
    },
    
    // Chỉ hiển thị tin nhắn lên UI (Không lưu)
    addMsgToUI: (side, text, senderName = null, msgIndex = null) => {
        const container = document.getElementById('chat-messages');
        if (container) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg-row ${side}`;
            if (msgIndex !== null) {
                msgDiv.dataset.msgIndex = msgIndex;
            }
            
            // Nếu có tên người gửi và là tin nhắn bên trái (nhận) trong nhóm, hiển thị tên người gửi
            const senderHtml = (side === 'left' && senderName && window.commApi.currentChat.type === 'group') 
                ? `<div class="msg-sender">${senderName}</div>` 
                : '';
            
            // Nút xóa (Hiện ra khi ấn giữ hoặc click)
            const deleteBtn = `<button class="msg-delete-btn" onclick="event.stopPropagation(); window.commApi.deleteMessage(this.closest('.msg-row'), ${msgIndex})" title="Xóa tin nhắn">×</button>`;
            
            msgDiv.innerHTML = `
                <div class="msg-content">
                    ${senderHtml}
                    <div class="msg-bubble">${text}</div>
                    <div class="msg-meta">
                        ${new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'})}
                        ${deleteBtn}
                    </div>
                </div>
            `;
            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
        }
    },
    
    // Hiển thị tin nhắn lên UI và lưu vào bộ nhớ
    addMsg: (side, text, senderName = null) => {
        // Hiển thị lên UI
        window.commApi.addMsgToUI(side, text, senderName);
        
        // Lưu vào bộ nhớ
        const chat = window.commApi.currentChat;
        if (chat.id) {
            const message = {
                direction: side === 'right' ? 'outgoing' : 'incoming',
                chatType: chat.type,
                target: side === 'right' ? { name: chat.name, id: chat.id } : { name: 'Tôi', id: 'self' },
                sender: side === 'right' ? { name: 'Tôi', id: 'self' } : { name: senderName || chat.name, id: chat.id },
                msgType: 'text',
                content: text
            };
            window.commApi.saveChatMessage(chat.id, message);
        }
    },

    // Mở trang Thêm Bạn Bè / Nhóm Chat
    openAddView: () => {
        const listView = document.getElementById('comm-list-view');
        const addView = document.getElementById('comm-add-view');
        
        // Lấy Header của khung chính và ẩn đi
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';

        // Điều chỉnh lại style của app-body
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && addView) {
            listView.classList.add('hidden');
            addView.classList.remove('hidden');
        }
    },

    // Đóng trang Thêm
    closeAddView: () => {
        const listView = document.getElementById('comm-list-view');
        const addView = document.getElementById('comm-add-view');
        
        // Khôi phục Header của khung chính
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';

        // Khôi phục style của app-body
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && addView) {
            addView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
    },

    // Chức năng tìm kiếm
    searchTarget: () => {
        const input = document.getElementById('search-input');
        const resultArea = document.getElementById('search-results');
        const mode = window.commApi.searchMode;
        
        if (input && resultArea) {
            const query = input.value.trim();
            if (!query) {
                resultArea.innerHTML = mode === 'friend' 
                    ? '<div class="search-hint">// Nhập ID người dùng hoặc tên để tìm bạn bè</div>'
                    : '<div class="search-hint">// Nhập tên nhóm chat hoặc ID để tìm nhóm</div>';
                return;
            }
            
            // Giả lập kết quả tìm kiếm
            resultArea.innerHTML = `
                <div class="search-loading">
                    <span class="loading-text">ĐANG_QUÉT_MẠNG_LƯỚI</span>
                    <span class="loading-dots">...</span>
                </div>
            `;
            
            setTimeout(() => {
                if (mode === 'friend') {
                    // Kết quả tìm bạn bè - Tạo ID 6 số
                    const userId = window.commApi.generateUniqueId(6, 'private');
                    resultArea.innerHTML = `
                        <div class="search-result-item" onclick="window.commApi.addContact('${query}', '${userId}', 'private')">
                            <div class="result-avatar">👤</div>
                            <div class="result-info">
                                <div class="result-name">${query}</div>
                                <div class="result-id">ID: ${userId}</div>
                            </div>
                            <div class="result-action">THÊM</div>
                        </div>
                    `;
                } else {
                    // Kết quả tìm nhóm chat - Tạo ID 4 số
                    const groupId = window.commApi.generateUniqueId(4, 'group');
                    resultArea.innerHTML = `
                        <div class="search-result-item" onclick="window.commApi.addContact('${query}', '${groupId}', 'group')">
                            <div class="result-avatar">👥</div>
                            <div class="result-info">
                                <div class="result-name" style="color:#ff003c">${query}</div>
                                <div class="result-id">ID: ${groupId}</div>
                            </div>
                            <div class="result-action">THAM GIA</div>
                        </div>
                    `;
                }
            }, 800);
        }
    },
    
    // Tạo ID không trùng lặp
    generateUniqueId: (digits, type) => {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        let id;
        let attempts = 0;
        
        do {
            id = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
        } while (window.commApi.contacts.some(c => c.id === String(id)) && attempts < 100);
        
        return String(id);
    },
    
    // Thêm liên hệ vào danh sách
    addContact: (name, id, type) => {
        // Kiểm tra xem đã tồn tại chưa
        if (window.commApi.contacts.some(c => c.id === id || c.name === name)) {
            alert('Liên hệ này đã tồn tại');
            return;
        }
        
        // Tạo object liên hệ
        const contact = {
            name: name,
            id: id,
            type: type, // 'private' hoặc 'group'
            avatar: type === 'group' ? '👥' : '👤',
            addedAt: Date.now()
        };
        
        // Thêm vào danh sách liên hệ
        window.commApi.contacts.push(contact);
        
        // Lưu vào bộ nhớ
        window.commApi.saveToStorage();
        
        // Hiển thị ra danh sách trò chuyện
        window.commApi.renderContactToList(contact);
        
        // Đóng trang Thêm
        window.commApi.closeAddView();
        
        console.log('[📱Liên hệ] Đã thêm:', contact);
    },
    
    // Hiển thị liên hệ ra danh sách trò chuyện
    renderContactToList: (contact) => {
        const container = document.querySelector('.comm-container');
        if (!container) return;
        
        // Ẩn thông báo trống
        const emptyHint = document.getElementById('empty-contacts-hint');
        if (emptyHint) emptyHint.style.display = 'none';
        
        const chatId = `chat_${contact.id}`;
        const isGroup = contact.type === 'group';
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.setAttribute('data-contact-id', contact.id);
        chatItem.onclick = () => window.commApi.openChat(contact.name, contact.type, chatId);
        
        // Lấy bản xem trước của tin nhắn cuối cùng
        const lastMsg = window.commApi.getLastMessage(chatId);
        
        chatItem.innerHTML = `
            <div class="chat-avatar-wrapper">
                <div class="chat-avatar glitch-effect" data-text="${contact.avatar}">${contact.avatar}</div>
                ${!isGroup ? '<div class="status-indicator online"></div>' : ''}
            </div>
            <div class="chat-content">
                <div class="chat-header">
                    <span class="chat-name" ${isGroup ? 'style="color:#ff003c"' : ''}>${contact.name}</span>
                    <span class="chat-time">${lastMsg.time || 'MỚI'}</span>
                </div>
                <div class="chat-msg">>> ${lastMsg.text || 'Nhấn để bắt đầu trò chuyện...'}</div>
            </div>
        `;
        
        // Chèn vào đầu danh sách
        container.insertBefore(chatItem, container.firstChild);
    },
    
    // Lấy tin nhắn cuối cùng của một cuộc trò chuyện
    getLastMessage: (chatId) => {
        const chat = window.commApi.chatStorage[chatId];
        if (!chat || !chat.messages || chat.messages.length === 0) {
            return { text: null, time: null };
        }
        const lastMsg = chat.messages[chat.messages.length - 1];
        const time = new Date(lastMsg.timestamp);
        const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        return { 
            text: lastMsg.content.length > 20 ? lastMsg.content.substring(0, 20) + '...' : lastMsg.content,
            time: timeStr 
        };
    },
    
    // Tải tất cả liên hệ từ bộ nhớ và hiển thị
    renderAllContacts: () => {
        const container = document.querySelector('.comm-container');
        if (!container) return;
        
        // Hiển thị/ẩn thông báo trống
        const emptyHint = document.getElementById('empty-contacts-hint');
        
        if (window.commApi.contacts.length === 0) {
            if (emptyHint) emptyHint.style.display = 'block';
            return;
        }
        
        if (emptyHint) emptyHint.style.display = 'none';
        
        // Xóa tất cả các liên hệ hiện có (nhưng vẫn giữ lại thông báo trống)
        const existingItems = container.querySelectorAll('.chat-item');
        existingItems.forEach(item => item.remove());
        
        // Hiển thị toàn bộ liên hệ
        window.commApi.contacts.forEach(contact => {
            window.commApi.renderContactToList(contact);
        });
    },
    
    // Khởi tạo Ứng dụng Nhắn tin (Gọi khi mở)
    initApp: () => {
        // Làm chậm việc render để đảm bảo DOM đã được load xong
        setTimeout(() => {
            window.commApi.renderAllContacts();
        }, 50);
    }
};

const communicationApp = `
<div class="comm-wrapper">
    <div id="comm-list-view" class="comm-view">
        <div class="comm-top-bar">
            <div class="comm-status">TÍN_HIỆU_MẠNH</div>
            <div class="comm-add-btn" onclick="window.commApi.openAddView()">+</div>
        </div>

        <div class="comm-container">
            <div class="empty-hint" id="empty-contacts-hint" style="text-align:center; color:#666; padding:40px 20px; font-size:12px;">
                // Tạm thời chưa có người liên hệ nào<br>
                Hãy nhấp vào dấu + ở góc trên cùng bên phải để thêm bạn bè hoặc tạo nhóm chat
            </div>
        </div>
    </div>

    <div id="comm-detail-view" class="comm-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.commApi.closeChat()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name" id="chat-detail-name">KHÔNG_XÁC_ĐỊNH</div>
                <div class="detail-status">KẾT_NỐI_MÃ_HÓA</div>
            </div>
            <div class="clear-chat-btn" onclick="if(confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?')) window.commApi.clearCurrentChat()">Làm sạch</div>
            <div class="batch-send-btn" id="batch-send-btn" onclick="window.commApi.sendBatch()">Gửi Đi</div>
        </div>

        <div class="messages-area" id="chat-messages">
            </div>

        <div class="input-area">
            <div class="input-wrapper">
                <input type="text" id="chat-input-box" class="chat-input" placeholder="NHẬP_DỮ_LIỆU..." onkeypress="if(event.keyCode==13) window.commApi.sendMsg()">
                <div class="input-deco"></div>
            </div>
            <button class="send-btn" onclick="window.commApi.sendMsg()">GỬI</button>
        </div>
    </div>

    <div id="comm-add-view" class="comm-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.commApi.closeAddView()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name">THÊM_MỤC_TIÊU</div>
                <div class="detail-status">QUÉT_MẠNG</div>
            </div>
        </div>

        <div class="add-content">
            <div class="add-tabs">
                <div class="add-tab active" onclick="window.commApi.switchTab(this, 'friend')">Thêm Bạn Bè</div>
                <div class="add-tab" onclick="window.commApi.switchTab(this, 'group')">Tìm Nhóm Chat</div>
            </div>

            <div class="search-box">
                <input type="text" id="search-input" class="search-input" placeholder="NHẬP_ID_MỤC_TIÊU..." onkeypress="if(event.keyCode==13) window.commApi.searchTarget()">
                <button class="search-btn" onclick="window.commApi.searchTarget()">QUÉT</button>
            </div>

            <div class="search-results" id="search-results">
                <div class="search-hint" id="search-hint">// Vui lòng nhập tên để tiến hành tìm kiếm</div>
            </div>
        </div>
    </div>
</div>

<style>
.comm-wrapper {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Prevent double scrollbars */
}

.comm-view {
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.comm-view.hidden {
    display: none;
}

/* Top Bar for List */
.comm-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px 10px 10px;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
    margin-bottom: 10px;
}

.comm-status {
    font-size: 10px;
    color: var(--primary);
    opacity: 0.7;
}

.comm-add-btn {
    width: 24px;
    height: 24px;
    border: 1px solid var(--primary);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
}

.comm-add-btn:hover {
    background: var(--primary);
    color: #000;
    box-shadow: 0 0 10px var(--primary);
}

/* List Styles */
.comm-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding-right: 5px; /* Space for scrollbar */
    flex: 1;
}

/* Cyberpunk scrollbar for comm-container */
.comm-container::-webkit-scrollbar {
    width: 6px;
}

.comm-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    border: 1px solid rgba(0, 243, 255, 0.1);
}

.comm-container::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, var(--primary) 0%, rgba(157, 0, 255, 0.8) 100%);
    border-radius: 3px;
    border: 1px solid rgba(0, 243, 255, 0.3);
    box-shadow: 0 0 6px rgba(0, 243, 255, 0.4);
}

.comm-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #fff 0%, var(--primary) 100%);
    box-shadow: 0 0 10px var(--primary);
}

.comm-container::-webkit-scrollbar-corner {
    background: rgba(0, 0, 0, 0.3);
}

.chat-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 243, 255, 0.1);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
    transition: all 0.2s;
    cursor: pointer;
    margin-right: 2px; /* Lề an toàn */
    flex-shrink: 0; /* Ngăn chặn co lại */
}

.chat-item:hover {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--primary);
    transform: translateX(5px);
}

.chat-avatar-wrapper {
    position: relative;
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
}

.chat-avatar {
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    border: 1px solid var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    position: relative;
    overflow: hidden;
}

.status-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: #0f0;
    box-shadow: 0 0 5px #0f0;
    border: 1px solid #000;
}

.chat-content {
    flex: 1;
    font-family: 'Courier New', monospace;
    overflow: hidden;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.chat-name {
    color: var(--primary);
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 0 5px rgba(0, 243, 255, 0.5);
}

.chat-time {
    font-size: 10px;
    color: #666;
    background: rgba(0,0,0,0.5);
    padding: 2px 4px;
    border: 1px solid #333;
    position: absolute;
    top: 4px;
    right: 4px;
}

.chat-msg {
    font-size: 12px;
    color: #aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.unread-mark {
    background: var(--secondary);
    color: #000;
    font-weight: bold;
    font-size: 10px;
    padding: 2px 6px;
    clip-path: polygon(20% 0%, 100% 0, 100% 100%, 0% 100%);
    animation: pulse-red 1s infinite;
}

/* Các kiểu giao diện chi tiết */
.detail-header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 10px; /* Tăng padding để thay thế app-header */
    border-bottom: 1px solid rgba(0, 243, 255, 0.3);
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(10px);
    z-index: 10;
    margin-bottom: 0; /* Bỏ lề dưới, để nội dung trôi chảy */
}

.detail-back {
    cursor: pointer;
    color: var(--primary);
    font-family: 'Courier New', monospace;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(0, 243, 255, 0.2);
    border-radius: 8px;
    transition: all 0.2s;
    background: rgba(0, 243, 255, 0.1);
}

.detail-back:hover {
    background: var(--primary);
    color: #000;
}

.detail-title-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.detail-name {
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 10px var(--primary);
    line-height: 1.2;
}

.detail-status {
    font-size: 9px;
    color: #666;
    letter-spacing: 1px;
}

.batch-send-btn {
    font-size: 12px;
    color: var(--text-main);
    cursor: pointer;
    padding: 6px 12px;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--primary);
    border-radius: 4px;
    transition: all 0.3s;
}

.batch-send-btn:hover {
    background: rgba(0, 243, 255, 0.2);
    box-shadow: 0 0 10px var(--primary-glow);
}

.batch-send-btn.has-pending {
    background: var(--primary);
    color: #000;
    font-weight: bold;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { box-shadow: 0 0 5px var(--primary-glow); }
    50% { box-shadow: 0 0 15px var(--primary-glow); }
}

.detail-menu {
    font-size: 20px;
    color: var(--primary);
    cursor: pointer;
    padding: 0 10px;
}

.messages-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 15px 10px;
    background: rgba(0, 0, 0, 0.2);
}

/* Tùy chỉnh thanh cuộn cho khu vực tin nhắn */
.messages-area::-webkit-scrollbar {
    width: 4px;
}
.messages-area::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 2px;
}
.messages-area::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
}

.msg-row {
    display: flex;
    width: 100%;
}

.msg-row.left {
    justify-content: flex-start;
}

.msg-row.right {
    justify-content: flex-end;
}

.msg-content {
    max-width: 80%;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.left .msg-content { align-items: flex-start; }
.right .msg-content { align-items: flex-end; }

.msg-bubble {
    padding: 10px 15px;
    font-size: 13px;
    line-height: 1.4;
    position: relative;
    word-break: break-word;
}

.left .msg-bubble {
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid rgba(0, 243, 255, 0.3);
    border-radius: 0 10px 10px 10px;
    color: #fff;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.right .msg-bubble {
    background: rgba(255, 0, 60, 0.1);
    border: 1px solid rgba(255, 0, 60, 0.3);
    border-radius: 10px 0 10px 10px;
    color: #fff;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
}

.msg-meta {
    font-size: 8px;
    color: #555;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Nút xóa tin nhắn */
.msg-delete-btn {
    background: rgba(255, 0, 60, 0.2);
    border: 1px solid rgba(255, 0, 60, 0.3);
    color: #ff003c;
    font-size: 12px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    transition: all 0.2s;
    padding: 0;
    line-height: 1;
}

.msg-delete-btn:hover {
    opacity: 1;
    background: rgba(255, 0, 60, 0.4);
    box-shadow: 0 0 5px rgba(255, 0, 60, 0.5);
}

/* Nút xóa cuộc trò chuyện */
.clear-chat-btn {
    font-size: 10px;
    color: #ff003c;
    cursor: pointer;
    padding: 4px 8px;
    background: rgba(255, 0, 60, 0.1);
    border: 1px solid rgba(255, 0, 60, 0.3);
    border-radius: 4px;
    transition: all 0.2s;
}

.clear-chat-btn:hover {
    background: rgba(255, 0, 60, 0.3);
}

.input-area {
    display: flex;
    gap: 10px;
    padding: 15px 10px; /* Thêm padding cho khoảng cách ở dưới cùng */
    background: rgba(0,0,0,0.8);
    border-top: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0; /* Ngăn chặn việc bị co lại */
}

.input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    height: 40px;
}

.chat-input {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    padding: 0 15px;
    color: #fff;
    font-family: 'Courier New', monospace;
    outline: none;
    transition: all 0.3s;
    border-radius: 4px;
}

.chat-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.1);
}

.send-btn {
    width: 70px;
    height: 40px;
    background: var(--primary);
    border: none;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
    transition: all 0.2s;
}

.send-btn:active {
    transform: scale(0.95);
}

.glitch-effect::after {
    content: attr(data-text);
    position: absolute;
    left: 2px;
    text-shadow: -1px 0 red;
    top: 0;
    color: white;
    background: black;
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    animation: glitch 2s infinite linear alternate-reverse;
}

.glitch-effect::before {
    content: attr(data-text);
    position: absolute;
    left: -2px;
    text-shadow: 1px 0 blue;
    top: 0;
    color: white;
    background: black;
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    animation: glitch 3s infinite linear alternate-reverse;
}

/* Các kiểu giao diện thêm bạn bè/nhóm */
.add-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 15px 10px;
    overflow-y: auto;
}

.add-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.add-tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    color: #666;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
}

.add-tab.active {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--primary);
    color: var(--primary);
}

.add-tab:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.search-box {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.search-input {
    flex: 1;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
    padding: 0 15px;
    color: #fff;
    font-family: 'Courier New', monospace;
    outline: none;
    transition: all 0.3s;
}

.search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 10px rgba(0, 243, 255, 0.1);
}

.search-btn {
    width: 70px;
    height: 40px;
    background: var(--primary);
    border: none;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
    transition: all 0.2s;
}

.search-btn:active {
    transform: scale(0.95);
}

.search-results {
    min-height: 80px;
    margin-bottom: 20px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255,255,255,0.05);
}

.search-hint {
    color: #555;
    font-size: 12px;
    font-style: italic;
}

.search-loading {
    color: var(--primary);
    font-size: 12px;
    animation: blink 0.5s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.search-result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 243, 255, 0.1);
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.search-result-item:hover {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--primary);
}

.result-avatar {
    width: 40px;
    height: 40px;
    background: rgba(0,0,0,0.5);
    border: 1px solid var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.result-info {
    flex: 1;
}

.result-name {
    color: var(--primary);
    font-size: 13px;
    font-weight: bold;
}

.result-id {
    font-size: 10px;
    color: #666;
}

.result-action {
    padding: 5px 12px;
    background: rgba(0, 243, 255, 0.2);
    border: 1px solid var(--primary);
    color: var(--primary);
    font-size: 10px;
    font-weight: bold;
    cursor: pointer;
}

.recommend-section {
    margin-top: auto;
}

.recommend-title {
    color: #666;
    font-size: 11px;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.recommend-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.recommend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 10, 20, 0.6);
    border: 1px solid rgba(255,255,255,0.05);
    cursor: pointer;
    transition: all 0.2s;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
}

.recommend-item:hover {
    background: rgba(0, 243, 255, 0.05);
    border-color: rgba(0, 243, 255, 0.2);
    transform: translateX(3px);
}

.recommend-avatar {
    width: 45px;
    height: 45px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #444;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}

.recommend-info {
    flex: 1;
}

.recommend-name {
    color: var(--primary);
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 3px;
}

.recommend-tag {
    font-size: 10px;
    color: #888;
}

.msg-sender {
    font-size: 12px;
    color: var(--primary);
    margin-bottom: 2px;
    opacity: 0.8;
}
</style>
`;

// 📱 Khởi tạo: Tải lịch sử trò chuyện đã được lưu
(function initMobileChatStorage() {
    // Độ trễ tải, nhằm đảm bảo biến commApi đã được định nghĩa
    setTimeout(() => {
        if (window.commApi && window.commApi.loadFromStorage) {
            window.commApi.loadFromStorage();
            console.log('[📱Ứng dụng Nhắn tin] Nơi lưu trữ trò chuyện đã được khởi tạo xong');
        }
    }, 100);
})();

// Tạo đường truyền (Interface) dùng để lưu dữ liệu nhằm gửi tới cửa sổ gốc (trang cha)
window.getMobileSaveData = function() {
    if (window.commApi && window.commApi.exportSaveData) {
        return window.commApi.exportSaveData();
    }
    return null;
};

window.loadMobileSaveData = function(data) {
    if (window.commApi && window.commApi.importSaveData) {
        window.commApi.importSaveData(data);
    }
};

window.clearMobileData = function() {
    if (window.commApi && window.commApi.clearAllData) {
        window.commApi.clearAllData();
        // Nạp lại giao diện người dùng của phần danh sách bạn bè
        if (window.commApi.renderContactList) {
            window.commApi.renderContactList();
        }
    }
};

// 📱 Giám sát và nhận lệnh "Làm sạch dữ liệu" từ cửa sổ gốc
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'MOBILE_CLEAR_DATA') {
        console.log('[📱Ứng dụng Nhắn tin] Đã tiếp nhận yêu cầu từ lệnh Làm Sạch Dữ Liệu');
        window.clearMobileData();
    }
    // Giám sát và nhận lệnh "Nạp lại dữ liệu"
    if (event.data && event.data.type === 'MOBILE_DATA_REFRESH') {
        console.log('[📱Ứng dụng Nhắn tin] Đã tiếp nhận yêu cầu từ lệnh Nạp Lại Dữ Liệu');
        if (window.commApi && window.commApi.loadFromStorage) {
            window.commApi.loadFromStorage();
            if (window.commApi.renderContactList) {
                window.commApi.renderContactList();
            }
        }
    }
});

// 📱 Lắng nghe các sự kiện thuộc phần storage, sẽ có thể tự động nâng cấp đồng bộ khi trang cha có thay đổi về nội dung của bộ nhớ đệm nội bộ (localStorage)
// Cho phép hỗ trợ đối với việc tên biến có tiền tố (prefix) hoặc không có tiền tố
window.addEventListener('storage', function(event) {
    // Quét kiểm tra xem liệu đây có phải là key lưu trữ dữ liệu của đoạn chat ở ứng dụng điện thoại không (có thể hỗ trợ nhiều loại tiền tố)
    const isMobileChatKey = event.key === 'mobileChatData' || 
                            event.key === 'game_mobileChatData' ||
                            event.key === 'bhz_mobileChatData' ||
                            event.key === 'xiandai_mobileChatData' ||
                            event.key === 'mfszy_mobileChatData';
    
    if (isMobileChatKey) {
        console.log('[📱Ứng dụng Nhắn tin] Nhận thấy có một sự thay đổi từ thiết bị lưu trữ ngoài:', event.key);
        if (event.newValue === null) {
            // Bộ nhớ đã bị xóa (clear)
            if (window.commApi) {
                window.commApi.chatStorage = {};
                window.commApi.contacts = [];
                window.commApi.currentChat = { name: '', id: '', type: 'private', groupInfo: null };
                window.commApi.pendingMessages = [];
                // Cập nhật lại màn hình người dùng
                if (window.commApi.renderContactList) {
                    window.commApi.renderContactList();
                }
                console.log('[📱Ứng dụng Nhắn tin] File bộ nhớ đã được làm trống bằng một tác động ngoại vi');
            }
        } else {
            // Bộ nhớ đã được cập nhật nội dung
            if (window.commApi && window.commApi.loadFromStorage) {
                window.commApi.loadFromStorage();
                if (window.commApi.renderContactList) {
                    window.commApi.renderContactList();
                }
                console.log('[📱Ứng dụng Nhắn tin] Bản cập nhật dữ liệu từ nguồn ngoài đã thành công');
            }
        }
    }
});
