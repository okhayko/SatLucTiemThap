// Hàm xử lý đầu vào người dùng

// Gửi đầu vào tùy chỉnh của người dùng
async function sendUserInput() {
    const inputBox = document.getElementById('userInput');
    let userText = inputBox.value.trim();

    if (!userText) {
        alert('Vui lòng nhập nội dung!');
        return;
    }

    if (gameState.isProcessing) return;

    if (!gameState.isGameStarted) {
        alert('Vui lòng tạo nhân vật và bắt đầu trò chơi trước!');
        return;
    }

    // 🆕 Tự động đính kèm bộ nhớ đệm hành động
    const actionsSummary = getPendingActionsSummary();
    if (actionsSummary) {
        userText = actionsSummary + userText;
    }

    // 🆕 Hiển thị đầu vào người dùng đầy đủ trong console
    console.log('📤 [Đầu vào người dùng]', userText);

    // Xóa nội dung khung nhập liệu
    inputBox.value = '';

    gameState.isProcessing = true;

    // Hiển thị đầu vào người dùng
    displayUserMessage(userText);

    // Thêm vào lịch sử
    gameState.conversationHistory.push({
        role: 'user',
        content: userText
    });

    // Lưu snapshot biến hiện tại (tin nhắn người dùng)
    gameState.variableSnapshots.push(JSON.parse(JSON.stringify(gameState.variables)));

    // 🆕 Xóa bộ nhớ đệm hành động
    clearPendingActions();

    // Lưu lịch sử trò chơi
    saveGameHistory().catch(err => console.error('Lưu lịch sử thất bại:', err));

    // Hiển thị thông báo đang tải
    const historyDiv = document.getElementById('gameHistory');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
    loadingDiv.id = 'loading-message';
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        // 🎭 Phân tích đầu vào người dùng (nếu được bật)
        let userProfileEnhancement = '';
        if (window.userProfileAnalyzer && window.userProfileAnalyzer.isEnabled()) {
            console.log('[🎭Hồ sơ người dùng] Đang phân tích đầu vào người dùng...');
            
            // Cập nhật thông báo đang tải
            const loadingEl = document.getElementById('loading-message');
            if (loadingEl) {
                loadingEl.innerHTML = '<div class="message-content"><span class="loading"></span> Đang phân tích ý định người dùng...</div>';
            }
            
            try {
                // Xây dựng bối cảnh trò chơi (truyền cho API phân tích)
                const gameContext = {
                    currentLocation: gameState.variables.location || 'Không rõ',
                    currentScene: gameState.conversationHistory.slice(-2).map(h => h.content?.substring(0, 200)).join('\n'),
                    characterName: gameState.variables.name || 'Không rõ',
                    realm: gameState.variables.realm || 'Phàm nhân'
                };
                
                const analysisResult = await window.userProfileAnalyzer.analyze(userText, gameContext);
                
                if (analysisResult) {
                    userProfileEnhancement = window.userProfileAnalyzer.getEnhancedPrompt(analysisResult);
                    console.log('[🎭Hồ sơ người dùng] Phân tích hoàn tất, gợi ý nâng cao đã được tạo');
                }
            } catch (analysisError) {
                console.warn('[🎭Hồ sơ người dùng] Phân tích thất bại, sẽ sử dụng đầu vào gốc:', analysisError);
            }
            
            // Khôi phục thông báo đang tải
            if (loadingEl) {
                loadingEl.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
            }
        }
        
        // 🎯 Sử dụng hàm thống nhất để xây dựng prompt nâng cao
        let enhancedInput = buildEnhancedPrompt(userText);
        
        // 🎭 Nếu có tăng cường từ hồ sơ người dùng, thêm vào prompt
        if (userProfileEnhancement) {
            enhancedInput = userProfileEnhancement + '\n\n---\n\n' + enhancedInput;
        }

        // 🆕 Hiển thị prompt nâng cao đầy đủ trong console
        console.log('📤 [Đầu vào người dùng gốc]', userText);
        if (userProfileEnhancement) {
            console.log('🎭 [Tăng cường hồ sơ người dùng]', userProfileEnhancement);
        }
        console.log('🤖 [Prompt đầy đủ gửi cho AI]', enhancedInput);

        // 🔧 Truyền đầu vào gốc của người dùng (dùng cho tìm kiếm vector)
        const response = await callAI(enhancedInput, false, userText);

        // Xóa thông báo đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        handleAIResponse(response);

        // Kích hoạt tạo thế giới động (bất đồng bộ, không chặn luồng chính)
        generateDynamicWorld().catch(err => console.error('[Thế giới động] Lỗi tạo:', err));

        // 📨 Kích hoạt tin nhắn bạn bè tự động (bất đồng bộ, không chặn luồng chính)
        if (typeof window.generateAutoFriendMessage === 'function') {
            window.generateAutoFriendMessage().catch(err => console.error('[📨Tin nhắn bạn bè tự động] Lỗi tạo:', err));
        }

    } catch (error) {
        // Xóa thông báo đang tải
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        // ❌ Không xóa tin nhắn người dùng! Hiển thị lỗi và nút thử lại
        displayErrorMessageWithRetry('AI phản hồi thất bại: ' + error.message, async () => {
            // Xóa thông báo lỗi
            const errorDiv = document.getElementById('error-message-with-retry');
            if (errorDiv) errorDiv.remove();
            
            // Tạo lại phản hồi cuối cùng
            await regenerateLastResponse();
        });
    }

    gameState.isProcessing = false;
}

// Tạo thành phần hiển thị chuỗi suy nghĩ (Chain of Thought)
        function createReasoningDisplay(reasoning) {
            const container = document.createElement('div');
            container.className = 'reasoning-container';

            // Tạo tiêu đề có thể thu gọn
            const header = document.createElement('div');
            header.className = 'reasoning-header';
            header.innerHTML = `
                <span>🧠 Chuỗi suy nghĩ AI</span>
                <span class="reasoning-toggle">Nhấn để mở rộng/thu gọn</span>
            `;

            // Tạo vùng nội dung
            const content = document.createElement('div');
            content.className = 'reasoning-content';

            // Phân tích tình huống
            if (reasoning.situation) {
                const section = document.createElement('div');
                section.className = 'reasoning-section';
                section.innerHTML = `
                    <div class="reasoning-section-title">📊 Phân tích tình huống</div>
                    <div class="reasoning-text">${reasoning.situation}</div>
                `;
                content.appendChild(section);
            }

            // Phân tích lựa chọn của người chơi
            if (reasoning.playerChoice) {
                const section = document.createElement('div');
                section.className = 'reasoning-section';
                section.innerHTML = `
                    <div class="reasoning-section-title">🎯 Phân tích lựa chọn</div>
                    <div class="reasoning-text">${reasoning.playerChoice}</div>
                `;
                content.appendChild(section);
            }

            // Chuỗi logic
            if (reasoning.logicChain && Array.isArray(reasoning.logicChain)) {
                const section = document.createElement('div');
                section.className = 'reasoning-section';
                section.innerHTML = `<div class="reasoning-section-title">🔗 Các bước suy luận</div>`;
                
                const list = document.createElement('ul');
                list.className = 'reasoning-chain';
                reasoning.logicChain.forEach((step, index) => {
                    const li = document.createElement('li');
                    li.textContent = step;
                    list.appendChild(li);
                });
                section.appendChild(list);
                content.appendChild(section);
            }

            // Quyết định cuối cùng
            if (reasoning.outcome) {
                const section = document.createElement('div');
                section.className = 'reasoning-section';
                section.innerHTML = `
                    <div class="reasoning-section-title">✅ Quyết định cuối cùng</div>
                    <div class="reasoning-text">${reasoning.outcome}</div>
                `;
                content.appendChild(section);
            }

            // Thêm sự kiện click để thu gọn/mở rộng
            header.onclick = () => {
                content.classList.toggle('expanded');
            };

            container.appendChild(header);
            container.appendChild(content);

            return container;
        }

        // Hiển thị tin nhắn AI
        // isRestore: Có phải khôi phục từ file lưu hay không (khi khôi phục không tự động tạo ảnh, chỉ hiện nút "Nhấn để tạo")
        function displayAIMessage(story, options, reasoning = null, imgPrompt = null, isRestore = false) {
            const historyDiv = document.getElementById('gameHistory');

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai-message';
            messageDiv.setAttribute('data-message-index', historyDiv.children.length);

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';

            // Thêm hộp kiểm (chỉ hiển thị trong chế độ xóa)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'message-checkbox';
            checkbox.style.display = gameState.deleteMode ? 'inline-block' : 'none';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                handleMessageCheck(messageDiv);
            };

            headerDiv.innerHTML = `
                <span>Thế giới</span>
                <button class="regenerate-btn" onclick="regenerateLastResponseDebounced()">🔄</button>
            `;
            headerDiv.insertBefore(checkbox, headerDiv.firstChild);

            messageDiv.appendChild(headerDiv);

            // Thêm hiển thị chuỗi suy nghĩ (nếu có và người dùng bật hiển thị)
            const showReasoningCheckbox = document.getElementById('showReasoning');
            if (reasoning && showReasoningCheckbox && showReasoningCheckbox.checked) {
                const reasoningDiv = createReasoningDisplay(reasoning);
                messageDiv.appendChild(reasoningDiv);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // 🎨 Nếu bật NovelAI và câu chuyện chứa định dạng img:, xử lý từ gợi ý ảnh
            const hasImagePrompt = story && story.includes('img:');
            if (hasImagePrompt && window.novelAIGenerator && window.novelAIGenerator.enabled && typeof processStoryWithImages === 'function') {
                contentDiv.innerHTML = processStoryWithImages(story);
            } else {
                contentDiv.textContent = story;
            }

            messageDiv.appendChild(contentDiv);
            
            // 🎨 Nếu có trường img độc lập và bật NovelAI, tạo ảnh
            console.log('[displayAIMessage] 🖼️ Nhận được imgPrompt:', imgPrompt ? imgPrompt.substring(0, 50) + '...' : 'Không');
            console.log('[displayAIMessage] 🎨 Trạng thái NovelAI:', window.novelAIGenerator ? window.novelAIGenerator.enabled : 'generator không tồn tại');
            console.log('[displayAIMessage] 📦 isRestore:', isRestore);
            if (imgPrompt && window.novelAIGenerator && window.novelAIGenerator.enabled) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'nai-image-container';
                
                // 🎨 Nếu là khôi phục từ file lưu, hiển thị giao diện từ gợi ý có thể chỉnh sửa
                if (isRestore) {
                    // Tạo ID duy nhất để định danh trình chỉnh sửa này
                    const editorId = 'nai-editor-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    imgContainer.innerHTML = `
                        <div class="nai-image-restore-placeholder" data-editor-id="${editorId}">
                            <div class="nai-restore-actions">
                                <button class="nai-btn nai-restore-generate-btn" onclick="generateRestoredImageFromEditor('${editorId}')">
                                    🖼️ Tạo hình ảnh
                                </button>
                                <button class="nai-btn nai-view-prompt-btn" onclick="togglePromptEditor('${editorId}')">
                                    📝 Xem/Chỉnh sửa từ gợi ý
                                </button>
                            </div>
                            <div class="nai-prompt-editor-container" id="${editorId}" style="display: none;">
                                <div class="nai-prompt-editor-header">
                                    <span>✏️ Chỉnh sửa từ gợi ý</span>
                                    <button class="nai-btn nai-btn-small" onclick="togglePromptEditor('${editorId}')">Thu gọn</button>
                                </div>
                                <textarea class="nai-prompt-textarea" id="${editorId}-textarea" rows="4">${imgPrompt}</textarea>
                                <div class="nai-prompt-editor-footer">
                                    <span class="nai-prompt-char-count">Số ký tự: ${imgPrompt.length}</span>
                                    <div class="nai-prompt-editor-buttons">
                                        <button class="nai-btn nai-btn-reset" onclick="resetPromptEditor('${editorId}', '${imgPrompt.replace(/'/g, "\\'")}')">🔄 Đặt lại</button>
                                        <button class="nai-btn nai-btn-generate" onclick="generateRestoredImageFromEditor('${editorId}')">🎨 Tạo hình ảnh</button>
                                    </div>
                                </div>
                            </div>
                            <div class="nai-image-prompt-preview">
                                Xem trước từ gợi ý: ${imgPrompt.substring(0, 80)}${imgPrompt.length > 80 ? '...' : ''}
                            </div>
                        </div>
                    `;
                    // Lưu từ gợi ý gốc
                    imgContainer.dataset.originalPrompt = imgPrompt;
                    messageDiv.appendChild(imgContainer);
                } else {
                    // Quy trình tạo bình thường
                    imgContainer.innerHTML = `
                        <div class="nai-image-loading">
                            <div>🎨 Đang tạo minh họa...</div>
                            <div class="nai-image-prompt-preview">${imgPrompt.substring(0, 80)}...</div>
                        </div>
                    `;
                    messageDiv.appendChild(imgContainer);
                    
                    // Tạo ảnh bất đồng bộ
                    (async () => {
                        try {
                            console.log('[NovelAI] 🎨 Bắt đầu tạo ảnh:', imgPrompt.substring(0, 50) + '...');
                            const imageBase64 = await window.novelAIGenerator.generateImage(imgPrompt);
                            
                            // Kiểm tra xem giá trị trả về đã bao gồm tiền tố data URL chưa
                            const imageSrc = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
                            
                            imgContainer.innerHTML = `
                                <div class="nai-generated-image-container">
                                    <img class="nai-generated-image" src="${imageSrc}" 
                                         onclick="openNAIImageModal(this.src)" title="Nhấn để phóng to" />
                                    <div class="nai-image-actions">
                                        <button class="nai-btn" onclick="this.parentElement.nextElementSibling.style.display = this.parentElement.nextElementSibling.style.display === 'none' ? 'block' : 'none'">📝 Từ gợi ý</button>
                                        <button class="nai-btn" onclick="regenerateNAIImage(this, '${imgPrompt.replace(/'/g, "\\'")}')">🔄 Tạo lại</button>
                                    </div>
                                    <div class="nai-image-prompt-hidden" style="display:none;"><code>${imgPrompt}</code></div>
                                </div>
                            `;
                            console.log('[NovelAI] ✅ Tạo ảnh thành công');
                        } catch (error) {
                            console.error('[NovelAI] ❌ Tạo ảnh thất bại:', error);
                            imgContainer.innerHTML = `
                                <div class="nai-image-error">
                                    <strong>❌ Tạo ảnh thất bại</strong>
                                    <div>${error.message}</div>
                                    <button class="nai-btn" onclick="regenerateNAIImage(this, '${imgPrompt.replace(/'/g, "\\'")}')">🔄 Thử lại</button>
                                </div>
                            `;
                        }
                    })();
                }
            }

            // Thêm các tùy chọn
            if (options && options.length > 0) {
                const optionsDiv = document.createElement('div');
                optionsDiv.className = 'options-container';

                // Bản đồ biểu tượng tùy chọn - Game Bạch Hổ Tông chỉ hiển thị 4 tùy chọn (bỏ chiến đấu)
                const isBhzGame = window.location.pathname.includes('game-bhz.html') || document.title.includes('Bạch Hổ Tông');
                const optionIcons = isBhzGame ? ['💬', '🚪', '⚡', '💕'] : ['💬', '🚪', '⚡', '💕', '⚔️'];
                const optionTitles = isBhzGame ? ['Đối thoại/Tương tác', 'Bỏ qua/Rời đi', 'Bước ngoặt/Hành động', 'Tùy chọn R18'] : ['Đối thoại/Tương tác', 'Bỏ qua/Rời đi', 'Bước ngoặt/Hành động', 'Tùy chọn R18', 'Chiến đấu theo lượt'];

                // Game Bạch Hổ Tông chỉ xử lý 4 tùy chọn đầu
                const maxOptions = isBhzGame ? 4 : options.length;
                options.slice(0, maxOptions).forEach((option, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';

                    // Đảm bảo option là chuỗi
                    const optionText = typeof option === 'string' ? option : String(option);

                    // Phân tích yêu cầu thuộc tính
                    const requirement = parseAttributeRequirement(optionText);
                    const checkResult = checkAttributeRequirement(requirement);

                    // Thêm biểu tượng
                    const icon = optionIcons[index] || '📌';
                    const title = optionTitles[index] || 'Tùy chọn';

                    // Xây dựng văn bản hiển thị
                    let displayText = `${icon} ${requirement.cleanText}`;

                    // Nếu có yêu cầu thuộc tính, thêm hiển thị trạng thái
                    if (requirement.hasRequirement) {
                        const statusIcon = checkResult.met ? '✅' : '❌';
                        const statusClass = checkResult.met ? 'requirement-met' : 'requirement-not-met';
                        const reqText = `${checkResult.attributeName}${requirement.operator}${requirement.value}`;
                        const currentText = `Hiện tại:${checkResult.currentValue}`;

                        displayText += ` <span class="option-requirement ${statusClass}">${statusIcon}${reqText} (${currentText})</span>`;

                        // Thiết lập tooltip
                        const tooltipText = checkResult.met
                            ? `${title} - Kiểm tra thuộc tính: Đạt`
                            : `${title} - Kiểm tra thuộc tính: Không đạt (Có thể thất bại)`;
                        btn.setAttribute('title', tooltipText);
                    } else {
                        btn.setAttribute('title', title);
                    }

                    btn.innerHTML = displayText;

                    // Lưu tùy chọn gốc và kết quả kiểm tra
                    btn.setAttribute('data-option', optionText);
                    btn.setAttribute('data-check-result', JSON.stringify(checkResult));

                    btn.onclick = async () => {
                        try {
                            // Cố gắng sử dụng hàm toàn cục selectOption
                            if (typeof window.selectOption === 'function') {
                                await window.selectOption(optionText);
                            } else {
                                // Logic xử lý tùy chọn dự phòng
                                console.log('Sử dụng logic xử lý tùy chọn dự phòng');
                                
                                if (gameState.isProcessing) return;
                                
                                gameState.isProcessing = true;
                                
                                // Hiển thị lựa chọn người dùng
                                displayUserMessage(optionText);
                                
                                // Thêm vào lịch sử
                                gameState.conversationHistory.push({
                                    role: 'user',
                                    content: optionText
                                });
                                
                                // Lưu lịch sử trò chơi
                                if (typeof saveGameHistory === 'function') {
                                    saveGameHistory().catch(err => console.error('Lưu lịch sử thất bại:', err));
                                }
                                
                                // Hiển thị thông báo đang tải
                                const historyDiv = document.getElementById('gameHistory');
                                const loadingDiv = document.createElement('div');
                                loadingDiv.className = 'message ai-message';
                                loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
                                loadingDiv.id = 'loading-message';
                                historyDiv.appendChild(loadingDiv);
                                historyDiv.scrollTop = historyDiv.scrollHeight;
                                
                                try {
                                    // 🎭 Phân tích đầu vào người dùng (nếu được bật)
                                    let optionEnhancement = '';
                                    if (window.userProfileAnalyzer && window.userProfileAnalyzer.isEnabled()) {
                                        try {
                                            const loadingEl = document.getElementById('loading-message');
                                            if (loadingEl) {
                                                loadingEl.innerHTML = '<div class="message-content"><span class="loading"></span> Đang phân tích ý định người dùng...</div>';
                                            }
                                            
                                            const gameContext = {
                                                currentLocation: gameState.variables.location || 'Không rõ',
                                                characterName: gameState.variables.name || 'Không rõ',
                                                realm: gameState.variables.realm || 'Phàm nhân'
                                            };
                                            
                                            const analysisResult = await window.userProfileAnalyzer.analyze(optionText, gameContext);
                                            
                                            if (analysisResult) {
                                                optionEnhancement = window.userProfileAnalyzer.getEnhancedPrompt(analysisResult);
                                            }
                                            
                                            if (loadingEl) {
                                                loadingEl.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
                                            }
                                        } catch (analysisErr) {
                                            console.warn('[🎭Hồ sơ người dùng] Phân tích tùy chọn thất bại:', analysisErr);
                                        }
                                    }
                                    
                                    // Gọi AI
                                    if (typeof callAI === 'function') {
                                        let enhancedOption = optionText;
                                        if (optionEnhancement) {
                                            enhancedOption = optionEnhancement + '\n\n---\n\nLựa chọn của người dùng：' + optionText;
                                        }
                                        
                                        const response = await callAI(enhancedOption, false, optionText);
                                        
                                        // Xóa thông báo đang tải
                                        const loading = document.getElementById('loading-message');
                                        if (loading) loading.remove();
                                        
                                        // Xử lý phản hồi AI
                                        if (typeof handleAIResponse === 'function') {
                                            handleAIResponse(response);
                                        }
                                    } else {
                                        throw new Error('Hàm gọi AI chưa được định nghĩa');
                                    }
                                } catch (error) {
                                    // Xóa thông báo đang tải
                                    const loading = document.getElementById('loading-message');
                                    if (loading) loading.remove();
                                    
                                    console.error('Xử lý tùy chọn thất bại:', error);
                                    alert('Có lỗi khi xử lý tùy chọn: ' + error.message);
                                }
                                
                                gameState.isProcessing = false;
                            }
                        } catch (error) {
                            console.error('Xử lý click tùy chọn thất bại:', error);
                            alert('Xử lý tùy chọn thất bại, vui lòng tải lại trang và thử lại');
                        }
                    };
                    optionsDiv.appendChild(btn);
                });

                messageDiv.appendChild(optionsDiv);
            }

            historyDiv.appendChild(messageDiv);
            historyDiv.scrollTop = historyDiv.scrollHeight;
        }

        // Biến toàn cục: Lưu callback thử lại cho lỗi hiện tại
        let currentErrorRetryCallback = null;

        // Hiển thị thông báo lỗi và nút thử lại
        function displayErrorMessageWithRetry(errorMessage, retryCallback) {
            const historyDiv = document.getElementById('gameHistory');

            // Xóa thông báo lỗi đã tồn tại
            const existingError = document.getElementById('error-message-with-retry');
            if (existingError) existingError.remove();

            // Lưu hàm callback vào biến toàn cục
            currentErrorRetryCallback = retryCallback;

            // 🔍 Tạo thông tin chẩn đoán
            const diagnosticInfo = generateDiagnosticInfo(errorMessage);

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai-message';
            messageDiv.id = 'error-message-with-retry';
            messageDiv.style.background = 'linear-gradient(135deg, #ffe6e6 0%, #ffd6d6 100%)';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = '<span>❌ Lỗi</span>';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.style.color = '#c85a54';
            contentDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px; line-height: 1.6;">${errorMessage}</div>
                ${diagnosticInfo}
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="retryLastError()" style="flex: 1;">
                        🔄 Tạo lại
                    </button>
                    <button class="btn btn-secondary" onclick="dismissError()" style="flex: 1;">
                        ❌ Đóng lỗi
                    </button>
                </div>
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; font-size: 12px; color: #666;">
                    💡 Gợi ý: Nếu thất bại nhiều lần, vui lòng mở bảng điều khiển trình duyệt (F12) để xem thông tin lỗi chi tiết.
                </div>
            `;

            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(contentDiv);
            historyDiv.appendChild(messageDiv);
            historyDiv.scrollTop = historyDiv.scrollHeight;
        }

        // Tạo thông tin chẩn đoán
        function generateDiagnosticInfo(errorMessage) {
            let suggestions = [];

            // Cung cấp gợi ý dựa trên loại lỗi
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                suggestions.push('🔌 Vấn đề kết nối mạng - Kiểm tra mạng hoặc điểm cuối API có đúng không');
            }
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                suggestions.push('🔑 Lỗi khóa API - Vui lòng kiểm tra khóa có đúng không');
            }
            if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                suggestions.push('⏰ Giới hạn tần suất gọi API - Vui lòng thử lại sau');
            }
            if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
                suggestions.push('🚨 Lỗi máy chủ API - Thử lại sau hoặc thay đổi API');
            }
            if (errorMessage.includes('timeout')) {
                suggestions.push('⏱️ Yêu cầu hết thời gian - Giảm yêu cầu số từ hoặc thay đổi mạng');
            }
            if (errorMessage.includes('解析') || errorMessage.includes('JSON')) {
                suggestions.push('📄 Phân tích JSON thất bại - Có thể API cắt bớt đầu ra');
                suggestions.push('🔧 Gợi ý: Tăng "Token đầu ra tối đa" lên 16384 hoặc cao hơn');
            }

            if (suggestions.length === 0) {
                suggestions.push('❓ Lỗi không xác định - Xem bảng điều khiển (F12) để biết chi tiết');
            }

            return `
                <div style="margin-top: 10px; padding: 10px; background: rgba(255,200,200,0.3); border-radius: 5px; border-left: 3px solid #c85a54;">
                    <div style="font-weight: bold; font-size: 12px; margin-bottom: 5px;">🔍 Các giải pháp khả thi:</div>
                    ${suggestions.map(s => `<div style="font-size: 11px; margin: 3px 0;">• ${s}</div>`).join('')}
                </div>
            `;
        }

        // Thử lại lỗi cuối cùng
        async function retryLastError() {
            if (currentErrorRetryCallback) {
                await currentErrorRetryCallback();
            } else {
                alert('Không có thao tác nào để thử lại!');
            }
        }

        // Đóng thông báo lỗi
        function dismissError() {
            const errorDiv = document.getElementById('error-message-with-retry');
            if (errorDiv) errorDiv.remove();
            currentErrorRetryCallback = null;
            gameState.isProcessing = false;
        }

        // Hiển thị tin nhắn người dùng
        function displayUserMessage(message, forceRender = false) {
            const historyDiv = document.getElementById('gameHistory');
            // Chế độ gỡ lỗi: Không render tầng người dùng, xuất trực tiếp ra vùng gỡ lỗi
            // Tham số forceRender có thể buộc render (dùng khi tải file lưu)
            const debugCheckbox = document.getElementById('debugMode');
            if (!forceRender && debugCheckbox && debugCheckbox.checked) {
                appendDebug('USER', message);
                return;
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user-message';
            const messageIndex = historyDiv.children.length;
            messageDiv.setAttribute('data-message-index', messageIndex);

            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';

            // Thêm hộp kiểm (chỉ hiển thị trong chế độ xóa)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'message-checkbox';
            checkbox.style.display = gameState.deleteMode ? 'inline-block' : 'none';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                handleMessageCheck(messageDiv);
            };

            // Thêm container nút thao tác
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'display: flex; gap: 5px; align-items: center;';
            
            // Nút chỉnh sửa
            const editBtn = document.createElement('button');
            editBtn.className = 'regenerate-btn';
            editBtn.innerHTML = '✏️';
            editBtn.style.background = '#17a2b8';
            editBtn.onclick = () => editUserMessage(messageIndex);
            
            // Nút gửi lại
            const resendBtn = document.createElement('button');
            resendBtn.className = 'regenerate-btn';
            resendBtn.innerHTML = '🔄';
            resendBtn.onclick = () => resendUserMessage(messageIndex);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(resendBtn);

            headerDiv.innerHTML = '<span>👤 Lựa chọn của bạn</span>';
            headerDiv.insertBefore(checkbox, headerDiv.firstChild);
            headerDiv.appendChild(actionsDiv);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = message;
            contentDiv.setAttribute('data-original-text', message);

            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(contentDiv);

            historyDiv.appendChild(messageDiv);
            historyDiv.scrollTop = historyDiv.scrollHeight;
        }

        // 🎨 Bật/tắt hiển thị trình chỉnh sửa từ gợi ý
        window.togglePromptEditor = function(editorId) {
            const editor = document.getElementById(editorId);
            if (editor) {
                const isHidden = editor.style.display === 'none';
                editor.style.display = isHidden ? 'block' : 'none';
                
                // Cập nhật số ký tự
                if (isHidden) {
                    const textarea = document.getElementById(editorId + '-textarea');
                    if (textarea) {
                        updatePromptCharCount(editorId, textarea.value.length);
                        // Thêm lắng nghe đầu vào
                        textarea.oninput = () => updatePromptCharCount(editorId, textarea.value.length);
                    }
                }
            }
        };

        // 🎨 Cập nhật số ký tự
        window.updatePromptCharCount = function(editorId, count) {
            const editor = document.getElementById(editorId);
            if (editor) {
                const charCount = editor.querySelector('.nai-prompt-char-count');
                if (charCount) {
                    charCount.textContent = `Số ký tự: ${count}`;
                }
            }
        };

        // 🎨 Đặt lại trình chỉnh sửa từ gợi ý
        window.resetPromptEditor = function(editorId, originalPrompt) {
            const textarea = document.getElementById(editorId + '-textarea');
            if (textarea) {
                textarea.value = originalPrompt;
                updatePromptCharCount(editorId, originalPrompt.length);
            }
        };

        // 🎨 Lấy từ gợi ý từ trình chỉnh sửa và tạo ảnh
        window.generateRestoredImageFromEditor = async function(editorId) {
            const textarea = document.getElementById(editorId + '-textarea');
            const container = document.querySelector(`[data-editor-id="${editorId}"]`)?.closest('.nai-image-container');
            
            if (!textarea || !container) {
                console.error('[NovelAI] Không tìm thấy trình chỉnh sửa hoặc container');
                return;
            }
            
            const imgPrompt = textarea.value.trim();
            if (!imgPrompt) {
                alert('Từ gợi ý không được để trống!');
                return;
            }
            
            // Hiển thị trạng thái đang tải
            container.innerHTML = `
                <div class="nai-image-loading">
                    <div>🎨 Đang tạo minh họa...</div>
                    <div class="nai-image-prompt-preview">${imgPrompt.substring(0, 80)}...</div>
                </div>
            `;
            
            try {
                console.log('[NovelAI] 🎨 Bắt đầu tạo ảnh:', imgPrompt.substring(0, 50) + '...');
                const imageBase64 = await window.novelAIGenerator.generateImage(imgPrompt);
                
                // Kiểm tra xem giá trị trả về đã bao gồm tiền tố data URL chưa
                const imageSrc = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
                const escapedPrompt = imgPrompt.replace(/'/g, "\\'").replace(/\n/g, '\\n');
                
                container.innerHTML = `
                    <div class="nai-generated-image-container">
                        <img class="nai-generated-image" src="${imageSrc}" 
                             onclick="openNAIImageModal(this.src)" title="Nhấn để phóng to" />
                        <div class="nai-image-actions">
                            <button class="nai-btn" onclick="toggleGeneratedPromptView(this)">📝 Xem từ gợi ý</button>
                            <button class="nai-btn" onclick="editAndRegenerateImage(this)">✏️ Chỉnh sửa và tạo lại</button>
                        </div>
                        <div class="nai-image-prompt-hidden" style="display:none;">
                            <div class="nai-prompt-view-header">Từ gợi ý hiện tại：</div>
                            <code>${imgPrompt}</code>
                        </div>
                        <div class="nai-image-edit-panel" style="display:none;">
                            <textarea class="nai-prompt-textarea" rows="4">${imgPrompt}</textarea>
                            <div class="nai-prompt-editor-footer">
                                <button class="nai-btn nai-btn-cancel" onclick="cancelEditPrompt(this)">Hủy</button>
                                <button class="nai-btn nai-btn-generate" onclick="regenerateWithEditedPrompt(this)">🎨 Tạo lại</button>
                            </div>
                        </div>
                    </div>
                `;
                console.log('[NovelAI] ✅ Tạo ảnh thành công');
            } catch (error) {
                console.error('[NovelAI] ❌ Tạo ảnh thất bại:', error);
                // Khôi phục giao diện chỉnh sửa
                const newEditorId = 'nai-editor-' + Date.now();
                container.innerHTML = `
                    <div class="nai-image-error">
                        <strong>❌ Tạo ảnh thất bại</strong>
                        <div>${error.message}</div>
                    </div>
                    <div class="nai-image-restore-placeholder" data-editor-id="${newEditorId}">
                        <div class="nai-restore-actions">
                            <button class="nai-btn nai-restore-generate-btn" onclick="generateRestoredImageFromEditor('${newEditorId}')">
                                🖼️ Thử lại
                            </button>
                            <button class="nai-btn nai-view-prompt-btn" onclick="togglePromptEditor('${newEditorId}')">
                                📝 Chỉnh sửa từ gợi ý
                            </button>
                        </div>
                        <div class="nai-prompt-editor-container" id="${newEditorId}" style="display: block;">
                            <textarea class="nai-prompt-textarea" id="${newEditorId}-textarea" rows="4">${imgPrompt}</textarea>
                            <div class="nai-prompt-editor-footer">
                                <span class="nai-prompt-char-count">Số ký tự: ${imgPrompt.length}</span>
                                <button class="nai-btn nai-btn-generate" onclick="generateRestoredImageFromEditor('${newEditorId}')">🎨 Thử lại</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        };

        // 🎨 Bật/tắt xem từ gợi ý của ảnh đã tạo
        window.toggleGeneratedPromptView = function(btn) {
            const container = btn.closest('.nai-generated-image-container');
            if (container) {
                const promptHidden = container.querySelector('.nai-image-prompt-hidden');
                const editPanel = container.querySelector('.nai-image-edit-panel');
                if (promptHidden) {
                    // Ẩn bảng chỉnh sửa
                    if (editPanel) editPanel.style.display = 'none';
                    // Bật/tắt hiển thị
                    promptHidden.style.display = promptHidden.style.display === 'none' ? 'block' : 'none';
                }
            }
        };

        // 🎨 Chỉnh sửa và tạo lại ảnh
        window.editAndRegenerateImage = function(btn) {
            const container = btn.closest('.nai-generated-image-container');
            if (container) {
                const promptHidden = container.querySelector('.nai-image-prompt-hidden');
                const editPanel = container.querySelector('.nai-image-edit-panel');
                if (promptHidden && editPanel) {
                    // Ẩn hiển thị từ gợi ý
                    promptHidden.style.display = 'none';
                    // Hiển thị bảng chỉnh sửa
                    editPanel.style.display = 'block';
                }
            }
        };

        // 🎨 Hủy chỉnh sửa từ gợi ý
        window.cancelEditPrompt = function(btn) {
            const container = btn.closest('.nai-generated-image-container');
            if (container) {
                const editPanel = container.querySelector('.nai-image-edit-panel');
                if (editPanel) {
                    editPanel.style.display = 'none';
                }
            }
        };

        // 🎨 Dùng từ gợi ý đã chỉnh sửa để tạo lại ảnh
        window.regenerateWithEditedPrompt = async function(btn) {
            const container = btn.closest('.nai-generated-image-container');
            const imgContainer = btn.closest('.nai-image-container');
            if (!container || !imgContainer) return;
            
            const textarea = container.querySelector('.nai-image-edit-panel textarea');
            if (!textarea) return;
            
            const imgPrompt = textarea.value.trim();
            if (!imgPrompt) {
                alert('Từ gợi ý không được để trống!');
                return;
            }
            
            // Hiển thị trạng thái đang tải
            imgContainer.innerHTML = `
                <div class="nai-image-loading">
                    <div>🎨 Đang tạo lại minh họa...</div>
                    <div class="nai-image-prompt-preview">${imgPrompt.substring(0, 80)}...</div>
                </div>
            `;
            
            try {
                console.log('[NovelAI] 🎨 Bắt đầu tạo lại ảnh:', imgPrompt.substring(0, 50) + '...');
                const imageBase64 = await window.novelAIGenerator.generateImage(imgPrompt);
                
                const imageSrc = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;
                
                imgContainer.innerHTML = `
                    <div class="nai-generated-image-container">
                        <img class="nai-generated-image" src="${imageSrc}" 
                             onclick="openNAIImageModal(this.src)" title="Nhấn để phóng to" />
                        <div class="nai-image-actions">
                            <button class="nai-btn" onclick="toggleGeneratedPromptView(this)">📝 Xem từ gợi ý</button>
                            <button class="nai-btn" onclick="editAndRegenerateImage(this)">✏️ Chỉnh sửa và tạo lại</button>
                        </div>
                        <div class="nai-image-prompt-hidden" style="display:none;">
                            <div class="nai-prompt-view-header">Từ gợi ý hiện tại：</div>
                            <code>${imgPrompt}</code>
                        </div>
                        <div class="nai-image-edit-panel" style="display:none;">
                            <textarea class="nai-prompt-textarea" rows="4">${imgPrompt}</textarea>
                            <div class="nai-prompt-editor-footer">
                                <button class="nai-btn nai-btn-cancel" onclick="cancelEditPrompt(this)">Hủy</button>
                                <button class="nai-btn nai-btn-generate" onclick="regenerateWithEditedPrompt(this)">🎨 Tạo lại</button>
                            </div>
                        </div>
                    </div>
                `;
                console.log('[NovelAI] ✅ Tạo lại thành công');
            } catch (error) {
                console.error('[NovelAI] ❌ Tạo lại thất bại:', error);
                const newEditorId = 'nai-editor-' + Date.now();
                imgContainer.innerHTML = `
                    <div class="nai-image-error">
                        <strong>❌ Tạo ảnh thất bại</strong>
                        <div>${error.message}</div>
                    </div>
                    <div class="nai-image-restore-placeholder" data-editor-id="${newEditorId}">
                        <div class="nai-restore-actions">
                            <button class="nai-btn nai-restore-generate-btn" onclick="generateRestoredImageFromEditor('${newEditorId}')">
                                🖼️ Thử lại
                            </button>
                        </div>
                        <div class="nai-prompt-editor-container" id="${newEditorId}" style="display: block;">
                            <textarea class="nai-prompt-textarea" id="${newEditorId}-textarea" rows="4">${imgPrompt}</textarea>
                            <div class="nai-prompt-editor-footer">
                                <span class="nai-prompt-char-count">Số ký tự: ${imgPrompt.length}</span>
                                <button class="nai-btn nai-btn-generate" onclick="generateRestoredImageFromEditor('${newEditorId}')">🎨 Thử lại</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        };