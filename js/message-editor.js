// Chỉnh sửa tin nhắn người dùng
let editDebounceTimer = null;
let isEditing = false;

function editUserMessage(messageIndex) {
    // Ngăn chặn nhấp chuột lặp lại
    if (isEditing) {
        console.log('[Chỉnh sửa] Đang trong quá trình chỉnh sửa, bỏ qua nhấp chuột lặp lại');
        return;
    }

    // Xóa bộ hẹn giờ chống rung trước đó
    if (editDebounceTimer) {
        clearTimeout(editDebounceTimer);
    }

    // Thiết lập chống rung (debounce)
    editDebounceTimer = setTimeout(() => {
        performEdit(messageIndex);
        editDebounceTimer = null;
    }, 200);
}

function performEdit(messageIndex) {
    if (isEditing) return;
    isEditing = true;

    // 🔧 Bảo vệ khung nhập liệu của người dùng, ngăn chặn bị ảnh hưởng bởi thao tác chỉnh sửa
    const userInput = document.getElementById('userInput');
    const originalInputValue = userInput ? userInput.value : '';

    try {
        const historyDiv = document.getElementById('gameHistory');
        const messages = historyDiv.children;

        if (messageIndex >= messages.length) {
            isEditing = false;
            return;
        }

        const messageDiv = messages[messageIndex];
        const contentDiv = messageDiv.querySelector('.message-content');
        const originalText = contentDiv.getAttribute('data-original-text') || contentDiv.textContent;

        // Kiểm tra xem đã ở chế độ chỉnh sửa chưa
        if (contentDiv.classList.contains('edit-mode')) {
            console.log('[Chỉnh sửa] Tin nhắn đã ở trong chế độ chỉnh sửa');
            isEditing = false;
            return;
        }

        // Lưu tham chiếu phần tử cha của div nội dung gốc
        const parentElement = contentDiv.parentNode;

        // Tạo khu vực chỉnh sửa
        const textarea = document.createElement('textarea');
        textarea.style.cssText = 'width: 100%; min-height: 100px; padding: 10px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;resize: vertical;';
        textarea.value = originalText;

        // Tạo container chứa nút
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';

        // Tạo container chỉnh sửa
        const editContainer = document.createElement('div');
        editContainer.className = 'message-content edit-mode';
        editContainer.appendChild(textarea);
        editContainer.appendChild(btnContainer);

        // Nút lưu
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-success';
        saveBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
        saveBtn.innerHTML = '💾 Lưu';
        saveBtn.onclick = () => {
            const newText = textarea.value.trim();
            if (!newText) {
                alert('Nội dung không được để trống!');
                return;
            }

            // Cập nhật hiển thị
            contentDiv.textContent = newText;
            contentDiv.setAttribute('data-original-text', newText);

            // Cập nhật nội dung trong hồ sơ lịch sử
            let historyIndex = 0;
            for (let i = 0; i <= messageIndex; i++) {
                if (messages[i].classList.contains('user-message') || messages[i].classList.contains('ai-message')) {
                    if (i === messageIndex) break;
                    historyIndex++;
                }
            }

            if (historyIndex < gameState.conversationHistory.length) {
                gameState.conversationHistory[historyIndex].content = newText;
                // Lưu vào cơ sở dữ liệu
                saveGameHistory().catch(err => console.error('Lưu thất bại:', err));
            }

            // Khôi phục hiển thị ban đầu
            parentElement.replaceChild(contentDiv, editContainer);

            // 🔧 Kiểm tra và khôi phục khung nhập liệu của người dùng
            if (userInput && userInput.value !== originalInputValue) {
                console.warn('[Chỉnh sửa] Phát hiện khung nhập liệu bị thay đổi ngoài ý muốn, đang khôi phục...');
                userInput.value = originalInputValue;
            }

            isEditing = false;
        };

        // Nút hủy
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
        cancelBtn.innerHTML = '❌ Hủy';
        cancelBtn.onclick = () => {
            // Khôi phục hiển thị ban đầu
            parentElement.replaceChild(contentDiv, editContainer);

            // 🔧 Kiểm tra và khôi phục khung nhập liệu của người dùng
            if (userInput && userInput.value !== originalInputValue) {
                console.warn('[Chỉnh sửa] Phát hiện khung nhập liệu bị thay đổi ngoài ý muốn, đang khôi phục...');
                userInput.value = originalInputValue;
            }

            isEditing = false;
        };

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(cancelBtn);

        // Thay thế khu vực nội dung
        parentElement.replaceChild(editContainer, contentDiv);
        textarea.focus();

    } catch (error) {
        console.error('[Chỉnh sửa] Có lỗi khi chỉnh sửa tin nhắn:', error);

        // 🔧 Khôi phục khung nhập liệu người dùng ngay cả khi có lỗi
        if (userInput && userInput.value !== originalInputValue) {
            console.warn('[Chỉnh sửa] Khôi phục nội dung khung nhập liệu khi có lỗi...');
            userInput.value = originalInputValue;
        }

        isEditing = false;
    }
}

// Gửi lại tin nhắn người dùng
async function resendUserMessage(messageIndex) {
    if (gameState.isProcessing) return;

    const historyDiv = document.getElementById('gameHistory');
    const messages = historyDiv.children;

    if (messageIndex >= messages.length) return;

    const messageDiv = messages[messageIndex];
    const contentDiv = messageDiv.querySelector('.message-content');
    const messageText = contentDiv.getAttribute('data-original-text') || contentDiv.textContent;

    if (!messageText.trim()) {
        alert('Nội dung tin nhắn trống!');
        return;
    }

    // Tìm tất cả các tin nhắn sau tin nhắn này và xóa chúng
    const messagesToDelete = [];
    for (let i = messageIndex + 1; i < messages.length; i++) {
        messagesToDelete.push(messages[i]);
    }

    // Xác nhận xóa (nếu có tin nhắn kế tiếp)
    if (messagesToDelete.length > 0) {
        if (!confirm(`Gửi lại sẽ xóa ${messagesToDelete.length} tin nhắn sau tin nhắn này, xác định tiếp tục không?`)) {
            return;
        }

        // Xóa tin nhắn trong UI
        messagesToDelete.forEach(msg => msg.remove());
    }

    // Tính toán chỉ số trong hồ sơ lịch sử
    let historyIndex = 0;
    for (let i = 0; i <= messageIndex; i++) {
        if (messages[i] && (messages[i].classList.contains('user-message') || messages[i].classList.contains('ai-message'))) {
            if (i === messageIndex) break;
            historyIndex++;
        }
    }

    // Xóa tin nhắn tương ứng trong hồ sơ lịch sử (tất cả tin nhắn sau tin nhắn người dùng này)
    const deleteCount = messagesToDelete.length;
    if (deleteCount > 0 && historyIndex + 1 < gameState.conversationHistory.length) {
        gameState.conversationHistory.splice(historyIndex + 1, deleteCount);
        gameState.variableSnapshots.splice(historyIndex + 1, deleteCount);
    }

    // 🌍 Lưu dữ liệu độc lập của thế giới động (lưu trước khi quay lui)
    const dynamicWorldBackup = {
        history: JSON.parse(JSON.stringify(gameState.dynamicWorld.history || [])),
        floor: gameState.dynamicWorld.floor || 0
    };

    // Quay lui biến về trạng thái trước khi tin nhắn người dùng này được gửi
    if (historyIndex > 0 && historyIndex - 1 < gameState.variableSnapshots.length) {
        // Quay lui về trạng thái phản hồi AI trước tin nhắn người dùng này
        gameState.variables = JSON.parse(JSON.stringify(gameState.variableSnapshots[historyIndex - 1]));
        updateStatusPanel();
    } else if (historyIndex === 0) {
        // 🔧 Khi gửi lại từ tầng 0, làm trống mảng history (vì đây là tin nhắn đầu tiên không có lịch sử trước đó)
        console.log('[Gửi lại] Gửi lại từ tầng 0, làm trống mảng history');
        gameState.variables.history = [];
        updateStatusPanel();
    }

    // 🌍 Khôi phục dữ liệu độc lập của thế giới động (khôi phục sau khi quay lui)
    gameState.dynamicWorld.history = dynamicWorldBackup.history;
    gameState.dynamicWorld.floor = dynamicWorldBackup.floor;
    console.log('[Gửi lại] Đã bảo vệ dữ liệu thế giới động không bị quay lui');

    // 🆕 Xóa các mục tương ứng khỏi thư viện vector
    if (deleteCount > 0 && window.contextVectorManager) {
        // Tính toán phạm vi lượt hội thoại cần xóa
        const startTurn = Math.floor(historyIndex / 2) + 1;
        const endTurn = Math.floor((historyIndex + deleteCount) / 2) + 1;

        // Xóa các mục tương ứng trong conversationEmbeddings
        const conversationIndicesToRemove = [];
        window.contextVectorManager.conversationEmbeddings.forEach((conv, index) => {
            if (conv.turnIndex >= startTurn && conv.turnIndex <= endTurn) {
                conversationIndicesToRemove.push(index);
            }
        });
        // Xóa từ dưới lên trên
        for (let i = conversationIndicesToRemove.length - 1; i >= 0; i--) {
            window.contextVectorManager.conversationEmbeddings.splice(conversationIndicesToRemove[i], 1);
        }
        if (conversationIndicesToRemove.length > 0) {
            console.log(`[Thư viện vector] Đã xóa ${conversationIndicesToRemove.length} vector hội thoại của lượt ${startTurn}-${endTurn} (Gửi lại)`);
        }

        // Xóa các mục tương ứng trong historyEmbeddings
        if (window.contextVectorManager.historyEmbeddings) {
            const historyIndicesToRemove = [];
            window.contextVectorManager.historyEmbeddings.forEach((entry, index) => {
                if (entry.turnIndex >= startTurn && entry.turnIndex <= endTurn) {
                    historyIndicesToRemove.push(index);
                }
            });
            // Xóa từ dưới lên trên
            for (let i = historyIndicesToRemove.length - 1; i >= 0; i--) {
                window.contextVectorManager.historyEmbeddings.splice(historyIndicesToRemove[i], 1);
            }
            if (historyIndicesToRemove.length > 0) {
                console.log(`[Thư viện vector History] Đã xóa ${historyIndicesToRemove.length} vector history của lượt ${startTurn}-${endTurn} (Gửi lại)`);
            }
        }

        // Lưu vào IndexedDB
        window.contextVectorManager.saveToIndexedDB().catch(err =>
            console.warn('[Thư viện vector] Lưu thất bại:', err)
        );
    }

    // 🆕 Xóa nhân vật được thêm vào trong các lượt tương ứng khỏi đồ thị nhân vật
    if (window.characterGraphManager && typeof window.characterGraphManager.deleteCharactersByTurnRange === 'function') {
        const startTurn = Math.floor(historyIndex / 2) + 1;
        const endTurn = Math.floor((historyIndex + deleteCount) / 2) + 1;

        window.characterGraphManager.deleteCharactersByTurnRange(startTurn, endTurn)
            .then(deletedNames => {
                if (deletedNames.length > 0) {
                    console.log(`[Gửi lại] Quay lui đồ thị nhân vật đã xóa ${deletedNames.length} nhân vật`);
                }
            })
            .catch(err => console.warn('[Gửi lại] Quay lui đồ thị nhân vật thất bại:', err));
    }

    // 🧠 Xóa các thực thể và quan hệ trong các lượt tương ứng khỏi mạng ngữ nghĩa GraphRAG
    if (window.graphRAGLite && typeof window.graphRAGLite.deleteByTurnIndex === 'function') {
        const startTurn = Math.floor(historyIndex / 2) + 1;
        window.graphRAGLite.deleteByTurnIndex(startTurn)
            .then(result => {
                if (result.deletedEntities > 0 || result.deletedRelations > 0) {
                    console.log(`[Gửi lại] Quay lui GraphRAG đã xóa ${result.deletedEntities} thực thể, ${result.deletedRelations} quan hệ`);
                }
            })
            .catch(err => console.warn('[Gửi lại] Quay lui GraphRAG thất bại:', err));
    }

    // 📚 Xóa số lượng tương ứng các bản lưu trữ kế hoạch cốt truyện (dựa trên số lượng tin nhắn AI đã xóa)
    if (deleteCount > 0 && window.plotArchiveManager && typeof window.plotArchiveManager.deleteLastN === 'function') {
        // Thống kê có bao nhiêu tin nhắn AI trong số tin nhắn bị xóa
        let aiMessageCount = 0;
        messagesToDelete.forEach(msg => {
            if (msg.classList.contains('ai-message')) {
                aiMessageCount++;
            }
        });

        if (aiMessageCount > 0) {
            const actualDeleted = window.plotArchiveManager.deleteLastN(aiMessageCount);
            console.log(`[Gửi lại] Đã xóa ${aiMessageCount} tin nhắn AI, xóa tương ứng ${actualDeleted} bản lưu trữ kế hoạch cốt truyện`);
        }
    }

    // 🆕 Xóa dữ liệu ma trận lịch sử của các lượt tương ứng
    if (deleteCount > 0 && window.matrixManager && window.matrixManager.historyMatrix) {
        const startTurn = Math.floor(historyIndex / 2) + 1;
        const endTurn = Math.floor((historyIndex + deleteCount) / 2) + 1;
        window.matrixManager.historyMatrix.deleteByTurnRange(startTurn, endTurn);
        console.log(`[Gửi lại] Đã xóa dữ liệu ma trận lịch sử lượt ${startTurn}-${endTurn}`);
    }

    // Xóa tin nhắn người dùng này khỏi hồ sơ lịch sử (chuẩn bị gửi lại)
    if (historyIndex < gameState.conversationHistory.length) {
        gameState.conversationHistory.splice(historyIndex, 1);
        gameState.variableSnapshots.splice(historyIndex, 1);
    }

    gameState.isProcessing = true;

    // Xóa tin nhắn người dùng này trong UI
    messageDiv.remove();

    // Hiển thị lại tin nhắn người dùng
    displayUserMessage(messageText);

    // Thêm vào hồ sơ lịch sử
    gameState.conversationHistory.push({
        role: 'user',
        content: messageText
    });

    // Lưu ảnh chụp biến hiện tại
    gameState.variableSnapshots.push(JSON.parse(JSON.stringify(gameState.variables)));

    // Hiển thị gợi ý đang tải (sau tin nhắn người dùng)
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> Đang phân tích dữ liệu nhập người dùng...</div>';
    loadingDiv.id = 'loading-message';
    historyDiv.appendChild(loadingDiv);

    try {
        console.log('🔄 [Gửi lại] Tin nhắn người dùng gốc:', messageText);

        // 🎭 Phân tích chân dung người dùng (cũng cần phân tích khi gửi lại)
        let analysisEnhancement = '';
        if (window.userProfileAnalyzer && window.userProfileAnalyzer.isEnabled()) {
            try {
                console.log('[🎭Chân dung người dùng] Gửi lại: Bắt đầu phân tích dữ liệu nhập người dùng...');
                const gameContext = {
                    currentLocation: gameState.variables.location || 'Không rõ',
                    characterName: gameState.variables.name || 'Không rõ',
                    realm: gameState.variables.realm || 'Phàm nhân'
                };
                const analysisResult = await window.userProfileAnalyzer.analyzeUserInput(messageText, gameContext);
                if (analysisResult) {
                    console.log('[🎭Chân dung người dùng] Gửi lại: Phân tích hoàn tất', analysisResult);
                    // 🔧 Sửa lỗi: Sử dụng getEnhancedPrompt để tạo từ khóa gợi ý tăng cường hoàn chỉnh
                    analysisEnhancement = window.userProfileAnalyzer.getEnhancedPrompt(analysisResult);
                    if (analysisEnhancement) {
                        console.log('[🎭Chân dung người dùng] Gửi lại: Từ khóa gợi ý tăng cường đã được tạo');
                    }
                }
            } catch (analysisErr) {
                console.warn('[🎭Chân dung người dùng] Gửi lại: Phân tích thất bại', analysisErr);
            }
        }

        // Cập nhật gợi ý đang tải
        loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';

        // 🎯 Sử dụng hàm thống nhất để xây dựng gợi ý tăng cường
        let enhancedMessage = buildEnhancedPrompt(messageText);

        // 🎭 Đính kèm kết quả phân tích chân dung người dùng
        if (analysisEnhancement) {
            enhancedMessage = analysisEnhancement + '\n\n---\n\n' + enhancedMessage;
        }

        console.log('🔄 [Gửi lại] Prompt sau khi tăng cường:', enhancedMessage);

        // 🔧 Truyền vào từ khóa gợi ý tăng cường hoàn chỉnh để truy xuất vector
        const response = await callAI(enhancedMessage, false, enhancedMessage);

        // Loại bỏ gợi ý đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        handleAIResponse(response);

        // Kích hoạt tạo thế giới động (bất đồng bộ, không làm tắc nghẽn quy trình chính)
        generateDynamicWorld().catch(err => console.error('[Thế giới động] Tạo bất thường:', err));

        // Kích hoạt tin nhắn tự động từ bạn bè (bất đồng bộ, không làm tắc nghẽn quy trình chính)
        if (typeof window.generateAutoFriendMessage === 'function') {
            window.generateAutoFriendMessage().catch(err => console.error('[Tin nhắn tự động bạn bè] Tạo bất thường:', err));
        }

    } catch (error) {
        // Loại bỏ gợi ý đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        // Đừng xóa tin nhắn người dùng! Hiển thị lỗi và nút thử lại
        displayErrorMessageWithRetry('Gửi lại thất bại: ' + error.message, async () => {
            // Loại bỏ tin nhắn lỗi
            const errorDiv = document.getElementById('error-message-with-retry');
            if (errorDiv) errorDiv.remove();

            // Thử lại lần nữa
            await resendUserMessage(messageIndex);
        });
    }

    gameState.isProcessing = false;
}

// Tạo lại phản hồi cuối cùng
async function regenerateLastResponse() {
    if (gameState.isProcessing) return;
    if (gameState.conversationHistory.length < 2) return;

    // 🔧 Ngăn chặn nhấp chuột lặp lại: Thiết lập cờ xử lý ngay lập tức
    gameState.isProcessing = true;

    // 🔧 Kích hoạt bảo vệ khung nhập liệu toàn cục
    userInputProtection.start();

    // 🔧 Lưu nội dung bị xóa để khôi phục khi thất bại
    let removedAIMessage = null;
    let removedSnapshot = null;
    let removedAIMessageDOM = null;
    let previousVariablesBackup = null;

    // 🆕 Kiểm tra xem tin nhắn cuối cùng có phải là tin nhắn AI không
    const lastMessageIsAI = gameState.conversationHistory.length > 0 &&
        gameState.conversationHistory[gameState.conversationHistory.length - 1].role === 'assistant';

    // Xóa phản hồi AI cuối cùng (chỉ xóa khi tin nhắn cuối cùng thực sự là tin nhắn AI)
    if (lastMessageIsAI) {

        // 🔧 Lưu trạng thái biến hiện tại (dùng để khôi phục khi thất bại)
        previousVariablesBackup = JSON.parse(JSON.stringify(gameState.variables));

        // Xóa tin nhắn AI và ảnh chụp nhanh
        removedAIMessage = gameState.conversationHistory.pop();
        if (gameState.variableSnapshots.length > 0) {
            removedSnapshot = gameState.variableSnapshots.pop();
        }

        // 🆕 Xóa mục tương ứng khỏi thư viện vector
        if (window.contextVectorManager) {
            // Tính toán lượt hiện tại (số lượt sau khi xóa tin nhắn AI)
            const currentTurn = Math.floor(gameState.conversationHistory.length / 2);

            // Xóa lượt này trong thư viện vector
            const vectorIndex = window.contextVectorManager.conversationEmbeddings.findIndex(
                conv => conv.turnIndex === currentTurn + 1
            );

            if (vectorIndex !== -1) {
                window.contextVectorManager.conversationEmbeddings.splice(vectorIndex, 1);
                console.log(`[Thư viện vector] Đã xóa hồ sơ vector lượt thứ ${currentTurn + 1} (Tạo lại)`);
            }

            // 🆕 Đồng thời xóa mục tương ứng trong thư viện vector history
            if (window.contextVectorManager.historyEmbeddings) {
                const historyIndicesToRemove = [];
                window.contextVectorManager.historyEmbeddings.forEach((entry, index) => {
                    if (entry.turnIndex === currentTurn + 1) {
                        historyIndicesToRemove.push(index);
                    }
                });

                // Xóa từ dưới lên trên để tránh vấn đề lệch chỉ số
                for (let i = historyIndicesToRemove.length - 1; i >= 0; i--) {
                    window.contextVectorManager.historyEmbeddings.splice(historyIndicesToRemove[i], 1);
                }

                if (historyIndicesToRemove.length > 0) {
                    console.log(`[Thư viện vector History] Đã xóa ${historyIndicesToRemove.length} hồ sơ history lượt ${currentTurn + 1} (Tạo lại)`);

                    // 🔧 Sửa lỗi: Sử dụng trực tiếp deleteByTurnIndex để xóa dữ liệu ma trận của lượt tương ứng
                    // Thay vì xóa sạch rồi xây dựng lại, điều này sẽ chính xác hơn
                    if (window.matrixManager && window.matrixManager.historyMatrix) {
                        window.matrixManager.historyMatrix.deleteByTurnIndex(currentTurn + 1);
                        console.log(`[Ma trận History] Đã xóa dữ liệu ma trận lượt ${currentTurn + 1}`);
                    }
                }
            }

            // Lưu vào IndexedDB (bất đồng bộ, không gây tắc nghẽn)
            window.contextVectorManager.saveToIndexedDB().catch(err =>
                console.warn('[Thư viện vector] Lưu thất bại:', err)
            );
        }

        // 🌍 Lưu dữ liệu độc lập của thế giới động (lưu trước khi quay lui)
        const dynamicWorldBackup = {
            history: JSON.parse(JSON.stringify(gameState.dynamicWorld.history || [])),
            floor: gameState.dynamicWorld.floor || 0,
            messageCounter: gameState.dynamicWorld.messageCounter || 0
        };

        // ✅ Quay lui biến về trạng thái khi tin nhắn người dùng được gửi (đây là điểm mấu chốt!)
        // Ảnh chụp nhanh của tin nhắn người dùng nằm ở vị trí áp chót
        if (gameState.variableSnapshots.length > 0) {
            gameState.variables = JSON.parse(JSON.stringify(
                gameState.variableSnapshots[gameState.variableSnapshots.length - 1]
            ));
            console.log('[Tạo lại] Đã quay lui biến về trạng thái khi tin nhắn người dùng được gửi');
            updateStatusPanel(); // Cập nhật ngay giao diện hiển thị trạng thái sau khi quay lui
        }

        // 🌍 Khôi phục dữ liệu độc lập của thế giới động (khôi phục sau khi quay lui)
        gameState.dynamicWorld.history = dynamicWorldBackup.history;
        gameState.dynamicWorld.floor = dynamicWorldBackup.floor;
        gameState.dynamicWorld.messageCounter = dynamicWorldBackup.messageCounter;
        console.log('[Tạo lại] Đã bảo vệ dữ liệu thế giới động không bị quay lui');

        // 🆕 Xóa nhân vật được thêm vào trong lượt hiện tại khỏi đồ thị nhân vật
        if (window.characterGraphManager && typeof window.characterGraphManager.deleteCharactersByTurnRange === 'function') {
            const currentTurn = Math.floor(gameState.conversationHistory.length / 2);

            window.characterGraphManager.deleteCharactersByTurnRange(currentTurn, currentTurn)
                .then(deletedNames => {
                    if (deletedNames.length > 0) {
                        console.log(`[Tạo lại] Quay lui đồ thị nhân vật đã xóa ${deletedNames.length} nhân vật`);
                    }
                })
                .catch(err => console.warn('[Tạo lại] Quay lui đồ thị nhân vật thất bại:', err));
        }

        // 🧠 Xóa thực thể và quan hệ của lượt hiện tại khỏi mạng ngữ nghĩa GraphRAG
        if (window.graphRAGLite && typeof window.graphRAGLite.deleteByTurnIndex === 'function') {
            const currentTurn = Math.floor(gameState.conversationHistory.length / 2) + 1;
            window.graphRAGLite.deleteByTurnIndex(currentTurn)
                .then(result => {
                    if (result.deletedEntities > 0 || result.deletedRelations > 0) {
                        console.log(`[Tạo lại] Quay lui GraphRAG đã xóa ${result.deletedEntities} thực thể, ${result.deletedRelations} quan hệ`);
                    }
                })
                .catch(err => console.warn('[Tạo lại] Quay lui GraphRAG thất bại:', err));
        }

        // 📚 Xóa bản lưu trữ kế hoạch cốt truyện cuối cùng (tương ứng với lượt hiện tại)
        if (window.plotArchiveManager && typeof window.plotArchiveManager.deleteLastN === 'function') {
            window.plotArchiveManager.deleteLastN(1);
            console.log('[Tạo lại] Đã xóa bản lưu trữ kế hoạch cốt truyện cuối cùng');
        }

        // 🆕 Chỉ xóa tin nhắn AI trong UI khi thực sự có tin nhắn AI
        // Xóa tin nhắn AI cuối cùng trong UI (loại trừ tin nhắn thế giới động và gợi ý đang tải)
        const historyDiv = document.getElementById('gameHistory');
        const allAIMessages = historyDiv.querySelectorAll('.ai-message');

        // Lọc ra các tin nhắn phản hồi thực sự của AI (loại trừ tin nhắn thế giới động và gợi ý đang tải)
        const aiResponseMessages = Array.from(allAIMessages).filter(msg => {
            // Loại trừ gợi ý đang tải
            if (msg.id === 'loading-message' || msg.id === 'dynamic-world-loading') {
                return false;
            }
            // Loại trừ tin nhắn thế giới động (kiểm tra xem header có chứa văn bản "Thế giới động" không)
            const header = msg.querySelector('.message-header');
            if (header && header.textContent.includes('Thế giới động')) {
                return false;
            }
            // Loại trừ tin nhắn lỗi
            if (msg.id === 'error-message-with-retry') {
                return false;
            }
            return true;
        });

        if (aiResponseMessages.length > 0) {
            removedAIMessageDOM = aiResponseMessages[aiResponseMessages.length - 1];
            removedAIMessageDOM.remove();
            console.log('[Tạo lại] Đã xóa tin nhắn AI trong UI');
        }
    } else {
        // 🆕 Nếu tin nhắn cuối cùng không phải AI (nghĩa là phản hồi AI trước đó đã thất bại), không cần xóa gì cả
        console.log('[Tạo lại] Tin nhắn cuối cùng không phải tin nhắn AI, không cần xóa');
    }

    // Lấy tin nhắn người dùng cuối cùng
    const lastUserMessage = gameState.conversationHistory[gameState.conversationHistory.length - 1].content;

    // 🆕 Hiển thị gợi ý tạo lại trong console
    console.log('🔄 [Tạo lại] Tin nhắn người dùng gốc:', lastUserMessage);

    // Hiển thị gợi ý đang tải
    const historyDiv = document.getElementById('gameHistory');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> Đang phân tích dữ liệu nhập người dùng...</div>';
    loadingDiv.id = 'loading-message';
    historyDiv.appendChild(loadingDiv);

    // 🎭 Phân tích chân dung người dùng (cũng cần phân tích khi tạo lại)
    let analysisEnhancement = '';
    if (window.userProfileAnalyzer && window.userProfileAnalyzer.isEnabled()) {
        try {
            console.log('[🎭Chân dung người dùng] Tạo lại: Bắt đầu phân tích dữ liệu nhập người dùng...');
            const gameContext = {
                currentLocation: gameState.variables.location || 'Không rõ',
                characterName: gameState.variables.name || 'Không rõ',
                realm: gameState.variables.realm || 'Phàm nhân'
            };
            const analysisResult = await window.userProfileAnalyzer.analyzeUserInput(lastUserMessage, gameContext);
            if (analysisResult) {
                console.log('[🎭Chân dung người dùng] Tạo lại: Phân tích hoàn tất', analysisResult);
                // 🔧 Sửa lỗi: Sử dụng getEnhancedPrompt để tạo từ khóa gợi ý tăng cường hoàn chỉnh
                analysisEnhancement = window.userProfileAnalyzer.getEnhancedPrompt(analysisResult);
                if (analysisEnhancement) {
                    console.log('[🎭Chân dung người dùng] Tạo lại: Từ khóa gợi ý tăng cường đã được tạo');
                }
            }
        } catch (analysisErr) {
            console.warn('[🎭Chân dung người dùng] Tạo lại: Phân tích thất bại', analysisErr);
        }
    }

    // Cập nhật gợi ý đang tải
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ lại...</div>';

    // 🎯 Sử dụng hàm thống nhất để xây dựng gợi ý tăng cường
    let enhancedMessage = buildEnhancedPrompt(lastUserMessage);

    // 🎭 Đính kèm kết quả phân tích chân dung người dùng
    if (analysisEnhancement) {
        enhancedMessage = analysisEnhancement + '\n\n---\n\n' + enhancedMessage;
    }

    console.log('🔄 [Tạo lại] Prompt sau khi tăng cường:', enhancedMessage);

    try {
        // Tạm thời xóa tin nhắn người dùng khỏi hồ sơ lịch sử để tránh trùng lặp trong buildAIMessages
        // Vì callAI sẽ thêm tin nhắn người dùng vào cuối mảng tin nhắn tạm thời trong buildAIMessages
        const userMessageObj = gameState.conversationHistory.pop();

        // 🆕 Hiển thị Prompt hoàn chỉnh được gửi cho AI trong console
        console.log('🤖 [Tạo lại - Prompt hoàn chỉnh gửi cho AI]', enhancedMessage);

        // 🔧 Truyền vào từ khóa gợi ý tăng cường hoàn chỉnh để truy xuất vector
        const response = await callAI(enhancedMessage, false, enhancedMessage);

        // Thêm lại tin nhắn người dùng vào hồ sơ lịch sử, giữ cho hồ sơ lịch sử hoàn chỉnh
        gameState.conversationHistory.push(userMessageObj);

        // Loại bỏ gợi ý đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        handleAIResponse(response);

        // Kích hoạt tạo thế giới động (bất đồng bộ, không làm tắc nghẽn quy trình chính)
        generateDynamicWorld().catch(err => console.error('[Thế giới động] Tạo bất thường:', err));

        // 📨 Kích hoạt tin nhắn tự động từ bạn bè (bất đồng bộ, không làm tắc nghẽn quy trình chính)
        if (typeof window.generateAutoFriendMessage === 'function') {
            window.generateAutoFriendMessage().catch(err => console.error('[📨Tin nhắn tự động bạn bè] Tạo bất thường:', err));
        }

    } catch (error) {
        // Loại bỏ gợi ý đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        // 🔧 Khôi phục tin nhắn AI và ảnh chụp biến bị xóa
        if (removedAIMessage) {
            gameState.conversationHistory.push(removedAIMessage);
            console.log('[Khôi phục thử lại] Đã khôi phục tin nhắn AI vào hồ sơ lịch sử');
        }
        if (removedSnapshot) {
            gameState.variableSnapshots.push(removedSnapshot);
            console.log('[Khôi phục thử lại] Đã khôi phục ảnh chụp biến');
        }

        // 🔧 Khôi phục trạng thái biến (nếu có bản sao lưu)
        if (previousVariablesBackup) {
            gameState.variables = previousVariablesBackup;
            updateStatusPanel();
            console.log('[Khôi phục thử lại] Đã khôi phục trạng thái biến');
        }

        // 🔧 Khôi phục DOM của tin nhắn AI
        if (removedAIMessageDOM) {
            historyDiv.appendChild(removedAIMessageDOM);
            console.log('[Khôi phục thử lại] Đã khôi phục DOM tin nhắn AI');
        }

        // Khôi phục tin nhắn người dùng khi có lỗi (nếu nó đã bị pop)
        if (gameState.conversationHistory.length === 0 ||
            gameState.conversationHistory[gameState.conversationHistory.length - 1].role !== 'user') {
            // Nếu tin nhắn cuối cùng không phải người dùng, cần thêm lại
            gameState.conversationHistory.push({
                role: 'user',
                content: lastUserMessage
            });
            console.log('[Khôi phục thử lại] Đã khôi phục tin nhắn người dùng vào hồ sơ lịch sử');
        }

        // Hiển thị lỗi và nút thử lại
        displayErrorMessageWithRetry('Tạo lại thất bại: ' + error.message, async () => {
            // Loại bỏ tin nhắn lỗi
            const errorDiv = document.getElementById('error-message-with-retry');
            if (errorDiv) errorDiv.remove();

            // Thử lại lần nữa
            await regenerateLastResponse();
        });
    }

    // 🔧 Ngừng bảo vệ khung nhập liệu toàn cục
    userInputProtection.stop();

    gameState.isProcessing = false;
}

// 🔧 Hàm tạo lại có chống rung, ngăn chặn nhấp chuột nhanh nhiều lần
let regenerateDebounceTimer = null;
function regenerateLastResponseDebounced() {
    if (regenerateDebounceTimer) {
        clearTimeout(regenerateDebounceTimer);
    }

    // Vô hiệu hóa nút để ngăn chặn nhấp chuột lặp lại
    const regenerateBtns = document.querySelectorAll('.regenerate-btn');
    regenerateBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });

    regenerateDebounceTimer = setTimeout(async () => {
        try {
            await regenerateLastResponse();
        } finally {
            // Kích hoạt lại nút
            const regenerateBtns = document.querySelectorAll('.regenerate-btn');
            regenerateBtns.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
            regenerateDebounceTimer = null;
        }
    }, 300); // Độ trễ chống rung 300ms
}

// 🔧 Bảo vệ khung nhập liệu người dùng toàn cục, ngăn chặn bị sửa đổi ngoài ý muốn
let userInputProtection = {
    isActive: false,
    originalValue: '',
    protectedElement: null,

    start: function () {
        const userInput = document.getElementById('userInput');
        if (userInput && !this.isActive) {
            this.originalValue = userInput.value;
            this.protectedElement = userInput;
            this.isActive = true;

            // Theo dõi sự thay đổi giá trị, khôi phục ngay lập tức nếu bị sửa đổi ngoài ý muốn
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        if (this.protectedElement.value !== this.originalValue) {
                            console.warn('[Bảo vệ khung nhập] Phát hiện khung nhập liệu bị thay đổi ngoài ý muốn, đang khôi phục...');
                            this.protectedElement.value = this.originalValue;
                        }
                    }
                });
            });

            this.observer.observe(this.protectedElement, { attributes: true });
        }
    },

    stop: function () {
        if (this.isActive && this.observer) {
            this.observer.disconnect();
            this.isActive = false;
            this.protectedElement = null;
            this.originalValue = '';
        }
    }
};