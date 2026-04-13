// Xem thư viện Vector
        function viewVectorLibrary() {
            if (!window.contextVectorManager) {
                alert('Trình quản lý Vector chưa được khởi tạo!');
                return;
            }

            const embeddings = window.contextVectorManager.conversationEmbeddings;
            const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;

            if (!enableVectorRetrieval) {
                alert('Truy xuất Vector chưa được bật!\n\nVui lòng bật "🧬 Kích hoạt truy xuất Vector (Bộ nhớ thông minh)" trong cài đặt game.');
                return;
            }

            if (embeddings.length === 0) {
                alert('Thư viện Vector đang trống!\n\nVui lòng chơi game trước, hệ thống sẽ tự động ghi lại các đoạn đối thoại vào thư viện.');
                return;
            }

            // Xây dựng nội dung HTML
            let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">🧬 Trình xem Thư viện Vector</h2>
                    <button onclick="document.getElementById('vectorLibraryModal').remove()" style="
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
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${embeddings.length}</div>
                            <div style="font-size: 12px; color: #666;">Tổng số đối thoại</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${window.contextVectorManager.embeddingMethod}</div>
                            <div style="font-size: 12px; color: #666;">Phương pháp Vector hóa</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${window.contextVectorManager.maxRetrieveCount}</div>
                            <div style="font-size: 12px; color: #666;">Số lượng truy xuất</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${window.contextVectorManager.minSimilarityThreshold}</div>
                            <div style="font-size: 12px; color: #666;">Ngưỡng tương đồng</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <input type="text" id="vectorSearchInput" placeholder="🔍 Nhập từ khóa để tìm kiếm đối thoại liên quan..." 
                        style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterVectorList(this.value)">
                </div>

                <div id="vectorListContainer" style="max-height: 500px; overflow-y: auto;">
            `;

            embeddings.forEach((conv, index) => {
                const date = new Date(conv.timestamp).toLocaleString('vi-VN');
                const userPreview = conv.userMessage.length > 60 ? conv.userMessage.substring(0, 60) + '...' : conv.userMessage;
                const aiPreview = conv.aiResponse.length > 100 ? conv.aiResponse.substring(0, 100) + '...' : conv.aiResponse;
                
                htmlContent += `
                    <div class="vector-item" data-index="${index}" style="
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        border: 2px solid #e0e0e0;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f8f9ff';"
                       onmouseout="this.style.borderColor='#e0e0e0'; this.style.background='white';"
                       onclick="showVectorDetail(${index})">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="font-weight: bold; color: #667eea;">Đối thoại vòng thứ ${conv.turnIndex}</div>
                            <div style="font-size: 11px; color: #999;">${date}</div>
                        </div>
                        
                        <div style="background: #e7f5e9; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 11px; color: #666; margin-bottom: 3px;">👤 Người chơi</div>
                            <div style="font-size: 13px; color: #333;">${userPreview}</div>
                        </div>
                        
                        <div style="background: #f0f2ff; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 11px; color: #666; margin-bottom: 3px;">🤖 Phản hồi AI</div>
                            <div style="font-size: 13px; color: #333;">${aiPreview}</div>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 8px; border-radius: 5px;">
                            <div style="font-size: 11px; color: #856404;">📝 Tóm tắt: ${conv.summary}</div>
                        </div>
                        
                        ${conv.variables ? `
                            <div style="margin-top: 8px; font-size: 11px; color: #666;">
                                📍 ${conv.variables.location || 'Không rõ'} | 
                                ⚔️ ${conv.variables.realm || 'Không rõ'} | 
                                ${conv.variables.hasNewItems ? '🎒 Có vật phẩm mới' : ''} 
                                ${conv.variables.hasNewRelationships ? '👥 Có quan hệ mới' : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="exportVectorLibrary()" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">📤 Xuất thư viện Vector</button>
                    
                    <button onclick="clearVectorLibraryConfirm()" style="
                        flex: 1;
                        padding: 12px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🗑️ Xóa thư viện Vector</button>
                </div>
            `;

            // Tạo Modal
            const modal = document.createElement('div');
            modal.id = 'vectorLibraryModal';
            modal.style.cssText = `
                position: absolute;
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

            // Đóng khi click ra ngoài
            modal.onclick = function (e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }

        // Lọc danh sách vector
        function filterVectorList(keyword) {
            const items = document.querySelectorAll('.vector-item');
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

        // Hiển thị chi tiết vector
        function showVectorDetail(index) {
            const conv = window.contextVectorManager.conversationEmbeddings[index];
            if (!conv) return;

            const detailHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📋 Chi tiết đối thoại vòng thứ ${conv.turnIndex}</h2>
                    <button onclick="document.getElementById('vectorDetailModal').remove()" style="
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
                    <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 Siêu dữ liệu (Metadata)</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        🕐 Thời gian: ${new Date(conv.timestamp).toLocaleString('vi-VN')}<br>
                        🔢 Vòng: Thứ ${conv.turnIndex}<br>
                        📝 Tóm tắt: ${conv.summary}
                    </div>
                </div>

                <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">👤 Tin nhắn người chơi</div>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${conv.userMessage}</div>
                </div>

                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">🤖 Phản hồi AI</div>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6; max-height: 300px; overflow-y: auto;">${conv.aiResponse}</div>
                </div>

                ${conv.variables ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px;">
                        <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">📍 Các biến quan trọng</div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            Địa điểm: ${conv.variables.location || 'Không rõ'}<br>
                            Cảnh giới: ${conv.variables.realm || 'Không rõ'}<br>
                            Sinh lực (HP): ${conv.variables.hp || '?'}/${conv.variables.hpMax || '?'}<br>
                            Linh lực (MP): ${conv.variables.mp || '?'}/${conv.variables.mpMax || '?'}<br>
                            ${conv.variables.hasNewItems ? '✅ Vòng này nhận được vật phẩm mới<br>' : ''}
                            ${conv.variables.hasNewRelationships ? '✅ Vòng này có quan hệ nhân sự mới<br>' : ''}
                        </div>
                    </div>
                ` : ''}

                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                    <button onclick="testVectorSimilarity(${index})" style="
                        width: 100%;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 Kiểm tra độ tương đồng với đối thoại này</button>
                </div>
            `;

            const modal = document.createElement('div');
            modal.id = 'vectorDetailModal';
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
            content.innerHTML = detailHtml;

            modal.appendChild(content);
            document.body.appendChild(modal);

            modal.onclick = function (e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }

        // Kiểm tra độ tương đồng
        function testVectorSimilarity(targetIndex) {
            const keyword = prompt('Vui lòng nhập từ khóa kiểm tra (ví dụ: Thanh Vân Tông, Trưởng lão, Tu luyện...):');
            if (!keyword) return;

            const targetConv = window.contextVectorManager.conversationEmbeddings[targetIndex];
            const testVector = window.contextVectorManager.createKeywordVector(keyword);
            const similarity = window.contextVectorManager.calculateCosineSimilarity(testVector, targetConv.vector);

            alert(`🧪 Kết quả kiểm tra độ tương đồng\n\nTừ khóa: "${keyword}"\nĐối thoại mục tiêu: Vòng thứ ${targetConv.turnIndex}\n\nĐộ tương đồng: ${(similarity * 100).toFixed(2)}%\n\n${similarity >= window.contextVectorManager.minSimilarityThreshold ? '✅ Cao hơn ngưỡng, sẽ được tìm thấy' : '❌ Thấp hơn ngưỡng, sẽ không được tìm thấy'}`);
        }

        // Xuất thư viện Vector
        function exportVectorLibrary() {
            const data = {
                embeddings: window.contextVectorManager.conversationEmbeddings,
                method: window.contextVectorManager.embeddingMethod,
                exportTime: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `ThuVienVector_${new Date().toLocaleString('vi-VN').replace(/[/:]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ Đã xuất thư viện Vector!');
        }

        // Xác nhận xóa thư viện Vector
        function clearVectorLibraryConfirm() {
            if (!confirm('⚠️ Bạn có chắc chắn muốn xóa thư viện Vector không?\n\nThao tác này sẽ xóa tất cả các vector đối thoại đã lưu, không thể khôi phục!')) {
                return;
            }

            window.contextVectorManager.clear();
            window.contextVectorManager.saveToIndexedDB().then(() => {
                alert('✅ Thư viện Vector đã được xóa!');
                document.getElementById('vectorLibraryModal')?.remove();
            }).catch(err => {
                console.error('Xóa thất bại:', err);
                alert('❌ Xóa thất bại: ' + err.message);
            });
        }

        // 🆕 Chẩn đoán: Kiểm tra số lượng tin nhắn thực tế được render
        function diagnoseMessageDisplay() {
            const historyDiv = document.getElementById('gameHistory');
            const userMessages = historyDiv.querySelectorAll('.user-message');
            const aiMessages = historyDiv.querySelectorAll('.ai-message');
            const dynamicMessages = historyDiv.querySelectorAll('.dynamic-world-message');
            
            const report = `
━━━━━━━━━━ Báo cáo Chẩn đoán Hiển thị Tin nhắn ━━━━━━━━━━

📊 Dữ liệu trong bộ nhớ:
  - Tổng số conversationHistory: ${gameState.conversationHistory.length}
  - Tin nhắn người chơi: ${gameState.conversationHistory.filter(m => m.role === 'user').length} tin
  - Tin nhắn AI: ${gameState.conversationHistory.filter(m => m.role === 'assistant').length} tin
  - Lịch sử quan trọng: ${gameState.variables.history ? gameState.variables.history.length : 0} tin

🖥️ Phần tử DOM thực tế đã render:
  - Tổng số phần tử con trong gameHistory: ${historyDiv.children.length}
  - Tin nhắn người chơi (.user-message): ${userMessages.length} tin
  - Tin nhắn AI (.ai-message): ${aiMessages.length} tin
  - Tin nhắn thế giới động (.dynamic-world-message): ${dynamicMessages.length} tin

📝 Chi tiết conversationHistory:
${gameState.conversationHistory.map((msg, i) => 
    `  [${i+1}] ${msg.role === 'user' ? '👤Người chơi' : '🤖AI'}: ${msg.content.substring(0, 40)}...`
).join('\n')}

📜 Lịch sử quan trọng (variables.history):
${gameState.variables.history ? gameState.variables.history.map((h, i) => `  [${i+1}] ${h.substring(0, 50)}...`).join('\n') : '  (Không có)'}

💡 Đề xuất:
  ${historyDiv.children.length === 0 ? '❌ Không có tin nhắn nào được render! Vui lòng kiểm tra hàm render.' : ''}
  ${historyDiv.children.length < gameState.conversationHistory.length ? '⚠️ Số lượng tin nhắn được render ít hơn trong bộ nhớ, có thể một số tin nhắn bị lỗi render.' : ''}
  ${historyDiv.children.length === gameState.conversationHistory.length ? '✅ Số lượng tin nhắn khớp, nếu không thấy có thể do lỗi CSS.' : ''}
  ${gameState.variables.history && gameState.variables.history.length < gameState.conversationHistory.filter(m => m.role === 'user').length ? '⚠️ Số lượng lịch sử quan trọng ít hơn số vòng đối thoại, đề nghị dùng chức năng "Tái tạo lịch sử".' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;
            
            console.log(report);
            alert(report);
        }

        // 🆕 Xem Ma trận Lịch sử (History Matrix)
        function viewHistoryMatrix() {
            if (!window.contextVectorManager) {
                alert('Trình quản lý Vector chưa được khởi tạo!');
                return;
            }
            
            if (!window.matrixManager) {
                alert('Trình quản lý Ma trận chưa được khởi tạo!');
                return;
            }
            
            const historyVectorSize = window.contextVectorManager.historyEmbeddings.length;
            const historyMatrixLayers = window.matrixManager.historyMatrix.layers.length;
            const recentCount = window.contextVectorManager.recentHistoryCount;
            const matrixCount = window.contextVectorManager.matrixHistoryCount;
            
            // Xây dựng nội dung HTML
            let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #28a745; margin: 0;">📊 Trình xem Ma trận Lịch sử</h2>
                    <button onclick="document.getElementById('historyMatrixModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Đóng</button>
                </div>
                
                <div style="background: #f0f8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${historyVectorSize}</div>
                            <div style="font-size: 12px; color: #666;">Số lượng Vector Lịch sử</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${historyMatrixLayers}</div>
                            <div style="font-size: 12px; color: #666;">Số lớp ma trận</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${recentCount}</div>
                            <div style="font-size: 12px; color: #666;">Số tin gửi gần đây</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${matrixCount}</div>
                            <div style="font-size: 12px; color: #666;">Số tin truy xuất ma trận</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <input type="text" id="matrixSearchInput" placeholder="🔍 Nhập từ khóa để tìm kiếm lớp ma trận liên quan..." 
                        style="width: 100%; padding: 12px; border: 2px solid #28a745; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterMatrixLayers(this.value)">
                </div>

                <div id="matrixLayersContainer" style="max-height: 400px; overflow-y: auto;">
            `;

            // Hiển thị thông tin lớp ma trận
            if (historyMatrixLayers > 0) {
                const layers = window.matrixManager.historyMatrix.layers;
                layers.forEach((layer, index) => {
                    const weight = layer.weight ? layer.weight.toFixed(3) : '0.000';
                    const vectorCount = layer.vectors ? layer.vectors.length : 0;
                    const topic = layer.topic || 'Chưa phân loại';
                    
                    // Lấy vector đầu tiên của lớp này làm bản xem trước
                    let preview = 'Không có dữ liệu';
                    if (layer.vectors && layer.vectors.length > 0) {
                        const firstVector = layer.vectors[0];
                        // Vector History dùng trường content, vector đối thoại dùng trường text
                        const textContent = firstVector.content || firstVector.text || firstVector.aiResponse;
                        if (textContent) {
                            preview = textContent.length > 80 ? 
                                textContent.substring(0, 80) + '...' : 
                                textContent;
                        }
                    }
                    
                    const createTime = layer.createTime ? new Date(layer.createTime).toLocaleString('vi-VN') : 'Không rõ';
                    
                    htmlContent += `
                        <div class="matrix-layer-item" data-index="${index}" style="
                            background: white;
                            padding: 15px;
                            border-radius: 10px;
                            margin-bottom: 10px;
                            border: 2px solid #e0e0e0;
                            cursor: pointer;
                            transition: all 0.3s;
                        " onmouseover="this.style.borderColor='#28a745'; this.style.background='#f8fff8';"
                           onmouseout="this.style.borderColor='#e0e0e0'; this.style.background='white';"
                           onclick="showMatrixLayerDetail(${index})">
                           
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="font-weight: bold; color: #28a745;">Lớp ${index + 1}: ${topic}</div>
                                <div style="font-size: 11px; color: #999;">Trọng số: ${weight}</div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                                <div style="font-size: 11px; color: #666; margin-bottom: 3px;">📊 Thông tin thống kê</div>
                                <div style="font-size: 13px; color: #333;">
                                    Số lượng Vector: ${vectorCount} | Thời gian tạo: ${createTime}
                                </div>
                            </div>
                            
                            <div style="background: #e7f5e9; padding: 10px; border-radius: 5px;">
                                <div style="font-size: 11px; color: #666; margin-bottom: 3px;">📝 Xem trước nội dung</div>
                                <div style="font-size: 13px; color: #333;">${preview}</div>
                            </div>
                        </div>
                    `;
                });
            } else {
                htmlContent += `
                    <div style="
                        background: #fff3cd;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        color: #856404;
                    ">
                        <div style="font-size: 18px; margin-bottom: 10px;">⚠️ Ma trận trống</div>
                        <div style="font-size: 14px; margin-bottom: 10px;">Cần AI trả lời có chứa thông tin lịch sử (history) để xây dựng ma trận</div>
                        <div style="font-size: 13px; margin-bottom: 15px;">💡 Sau khi bật truy xuất vector, lịch sử trong phản hồi của AI sẽ tự động được vector hóa và xây dựng ma trận</div>
                        <div style="font-size: 12px; color: #856404; background: #fef5e7; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            <strong>Trạng thái hiện tại:</strong><br>
                            • Thư viện Vector Lịch sử: ${historyVectorSize} dữ liệu<br>
                            • Số lớp ma trận: ${historyMatrixLayers} lớp<br>
                            <br>
                            <strong>Nguyên nhân có thể:</strong><br>
                            • Số lượng vector quá ít, chưa hình thành lớp có ý nghĩa<br>
                            • Độ tương đồng của vector không đủ cao, không thể phân cụm<br>
                            • Việc xây dựng ma trận cần tích lũy nhiều đối thoại hơn
                        </div>
                        <button onclick="rebuildHistoryMatrix()" style="
                            margin-top: 15px;
                            padding: 10px 20px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 13px;
                        ">🔄 Tái tạo ma trận thủ công</button>
                    </div>
                `;
            }

            // Hiển thị Lịch sử gần đây
            if (historyVectorSize > 0) {
                htmlContent += `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #6f42c1; margin-bottom: 10px;">📋 3 bản ghi Lịch sử gần đây</h3>
                `;
                
                for (let i = Math.max(0, historyVectorSize - 3); i < historyVectorSize; i++) {
                    const embedding = window.contextVectorManager.historyEmbeddings[i];
                    if (embedding && embedding.content) {
                        const preview = embedding.content.length > 100 ? embedding.content.substring(0, 100) + '...' : embedding.content;
                        const turnIndex = embedding.turnIndex || '?';
                        const historyIndex = embedding.historyIndex || '?';
                        const timestamp = embedding.timestamp ? new Date(embedding.timestamp).toLocaleString('vi-VN') : 'Không rõ thời gian';
                        
                        htmlContent += `
                            <div style="
                                background: #f8f9ff;
                                padding: 12px;
                                border-radius: 8px;
                                margin-bottom: 8px;
                                border-left: 4px solid #6f42c1;
                            ">
                                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                                    [Vòng ${turnIndex}-Mục ${historyIndex}] ${timestamp}
                                </div>
                                <div style="font-size: 13px; color: #333;">${preview}</div>
                            </div>
                        `;
                    }
                }
                htmlContent += `</div>`;
            }
            
            htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="testMatrixRetrieval()" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 Kiểm tra truy xuất ma trận</button>
                    
                    <button onclick="rebuildHistoryMatrix()" style="
                        flex: 1;
                        padding: 12px;
                        background: #ffc107;
                        color: #212529;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🔄 Tái tạo ma trận</button>
                    
                    <button onclick="exportHistoryMatrix()" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">📤 Xuất ma trận</button>
                </div>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">💡 Lệnh Console:</div>
                    <div style="font-size: 11px; font-family: monospace; color: #333;">
                        • HistoryMatrixTest.runFullTest() - Kiểm tra toàn diện<br>
                        • window.matrixManager.visualizeHistory() - Trực quan hóa ma trận
                    </div>
                </div>
            `;

            // Tạo Modal
            const modal = document.createElement('div');
            modal.id = 'historyMatrixModal';
            modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                
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

            // Đóng khi click ra ngoài
            modal.onclick = function (e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }