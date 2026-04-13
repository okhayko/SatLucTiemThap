// 🆕 Các hàm hỗ trợ ma trận History
// Những hàm này cung cấp hỗ trợ cho viewHistoryMatrix()

// Lọc các tầng ma trận
function filterMatrixLayers(keyword) {
    const items = document.querySelectorAll('.matrix-layer-item');
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

// Hiển thị chi tiết tầng ma trận
function showMatrixLayerDetail(layerIndex) {
    const layer = window.matrixManager.historyMatrix.layers[layerIndex];
    if (!layer) return;

    let detailHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin: 0;">📋 Chi tiết tầng ma trận ${layerIndex + 1}</h2>
            <button onclick="document.getElementById('matrixLayerDetailModal').remove()" style="
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
            <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 Thông tin tầng</div>
            <div style="font-size: 13px; line-height: 1.8;">
                🏷️ Chủ đề: ${layer.topic || 'Chưa phân loại'}<br>
                ⚖️ Trọng số: ${layer.weight ? layer.weight.toFixed(3) : '0.000'}<br>
                📦 Số lượng vector: ${layer.vectors ? layer.vectors.length : 0}<br>
                🕐 Thời gian tạo: ${layer.createTime ? new Date(layer.createTime).toLocaleString('vi-VN') : 'Không rõ'}<br>
                🔄 Thời gian cập nhật: ${layer.lastUpdateTime ? new Date(layer.lastUpdateTime).toLocaleString('vi-VN') : 'Không rõ'}
            </div>
        </div>

        <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">📦 Các vector bao gồm</div>
            <div style="max-height: 300px; overflow-y: auto;">
    `;

    if (layer.vectors && layer.vectors.length > 0) {
        layer.vectors.forEach((vector, index) => {
            const content = vector.content || vector.text || vector.aiResponse || 'Không có nội dung';
            const preview = content.length > 150 ? content.substring(0, 150) + '...' : content;
            const turnIndex = vector.turnIndex || '?';
            const historyIndex = vector.historyIndex || '?';
            const timestamp = vector.timestamp ? new Date(vector.timestamp).toLocaleString('vi-VN') : 'Không rõ thời gian';
            
            detailHtml += `
                <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; border-left: 3px solid #28a745;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                        [${index + 1}] Lượt ${turnIndex}-Mục ${historyIndex} | ${timestamp}
                    </div>
                    <div style="font-size: 12px; color: #333; line-height: 1.4;">${preview}</div>
                </div>
            `;
        });
    } else {
        detailHtml += `<div style="color: #666; font-style: italic;">Tầng này hiện chưa có dữ liệu vector</div>`;
    }

    detailHtml += `
            </div>
        </div>

        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
            <button onclick="testLayerRetrieval(${layerIndex})" style="
                width: 100%;
                padding: 12px;
                background: #17a2b8;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">🧪 Kiểm tra truy xuất tầng này</button>
        </div>
    `;

    const modal = document.createElement('div');
    modal.id = 'matrixLayerDetailModal';
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

// Kiểm tra truy xuất ma trận
function testMatrixRetrieval() {
    const keyword = prompt('Vui lòng nhập từ khóa kiểm tra (ví dụ: Thanh Vân Tông, Trưởng lão, Tu luyện...):');
    if (!keyword) return;

    try {
        const results = window.matrixManager.historyMatrix.searchByMatrix(keyword, 5);
        
        if (results.length === 0) {
            alert(`🧪 Kết quả kiểm tra truy xuất ma trận\n\nTừ khóa: "${keyword}"\n\n❌ Không tìm thấy kết quả liên quan\n\n💡 Nguyên nhân có thể:\n• Ma trận trống\n• Từ khóa không khớp với nội dung hiện có\n• Ngưỡng tương đồng quá cao`);
        } else {
            let resultText = `🧪 Kết quả kiểm tra truy xuất ma trận\n\nTừ khóa: "${keyword}"\nTìm thấy ${results.length} kết quả liên quan:\n\n`;
            
            results.forEach((result, index) => {
                const content = result.content || result.text || result.aiResponse || 'Không có nội dung';
                const preview = content.length > 80 ? content.substring(0, 80) + '...' : content;
                const score = result.matchScore ? (result.matchScore * 100).toFixed(2) : '0.00';
                
                resultText += `${index + 1}. [Độ tương đồng: ${score}%] ${preview}\n`;
            });
            
            alert(resultText);
        }
    } catch (error) {
        alert(`❌ Kiểm tra truy xuất thất bại: ${error.message}`);
    }
}

// Kiểm tra truy xuất tầng
function testLayerRetrieval(layerIndex) {
    const keyword = prompt('Vui lòng nhập từ khóa kiểm tra:');
    if (!keyword) return;

    try {
        const layer = window.matrixManager.historyMatrix.layers[layerIndex];
        if (!layer) {
            alert('❌ Tầng không tồn tại');
            return;
        }

        // Tìm kiếm trong tầng này
        const results = [];
        const queryVector = window.contextVectorManager.createKeywordVector(keyword);
        
        layer.vectors.forEach(vector => {
            const similarity = window.contextVectorManager.calculateCosineSimilarity(queryVector, vector.vector);
            if (similarity > window.contextVectorManager.minSimilarityThreshold) {
                results.push({ vector, similarity: (similarity * 100).toFixed(2) });
            }
        });

        if (results.length === 0) {
            alert(`🧪 Kiểm tra truy xuất tầng ${layerIndex + 1}\n\nTừ khóa: "${keyword}"\n\n❌ Không tìm thấy kết quả liên quan`);
        } else {
            let resultText = `🧪 Kiểm tra truy xuất tầng ${layerIndex + 1}\n\nTừ khóa: "${keyword}"\nTìm thấy ${results.length} kết quả liên quan:\n\n`;
            
            results.forEach((result, index) => {
                const content = result.vector.content || result.vector.text || result.vector.aiResponse || 'Không có nội dung';
                const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
                resultText += `${index + 1}. [Độ tương đồng: ${result.similarity}%] ${preview}\n`;
            });
            
            alert(resultText);
        }
    } catch (error) {
        alert(`❌ Kiểm tra truy xuất tầng thất bại: ${error.message}`);
    }
}

// Xây dựng lại ma trận History
async function rebuildHistoryMatrix() {
    if (!confirm('⚠️ Xác nhận xây dựng lại ma trận History?\n\nThao tác này sẽ xóa sạch ma trận hiện tại và xây dựng lại từ kho lưu trữ vector.\nNếu kho lưu trữ vector trống, hệ thống sẽ tự động xây dựng từ nhật ký history.')) {
        return;
    }

    try {
        // Xóa ma trận hiện tại
        window.matrixManager.historyMatrix.clear();
        
        // 🔧 Sửa lỗi: Nếu historyEmbeddings trống, xây dựng trước từ gameState.variables.history
        if (window.contextVectorManager.historyEmbeddings.length === 0) {
            const history = window.gameState?.variables?.history;
            if (history && Array.isArray(history) && history.length > 0) {
                console.log(`[Ma trận History] 🔄 Kho vector trống, đang xây dựng từ nhật ký history (${history.length} mục)...`);
                
                // Hiển thị thông báo tiến độ
                const progressMsg = document.createElement('div');
                progressMsg.id = 'rebuildProgress';
                progressMsg.style.cssText = `
                    position: fixed;
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
                progressMsg.innerHTML = `
                    <div style="color: #28a745; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                        🔄 Đang xây dựng lại kho vector History...
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        Vui lòng đợi, đang xử lý mục <span id="rebuildCurrentItem">0</span>/${history.length}
                    </div>
                `;
                document.body.appendChild(progressMsg);
                
                // Xóa và xây dựng lại historyEmbeddings
                window.contextVectorManager.historyEmbeddings = [];
                
                for (let i = 0; i < history.length; i++) {
                    const historyText = history[i];
                    if (!historyText || typeof historyText !== 'string') continue;
                    
                    // Cập nhật tiến độ
                    const progressSpan = document.getElementById('rebuildCurrentItem');
                    if (progressSpan) progressSpan.textContent = i + 1;
                    
                    // Tạo vector
                    let vector;
                    try {
                        if (window.contextVectorManager.embeddingMethod === 'keyword') {
                            vector = window.contextVectorManager.createKeywordVector(historyText);
                        } else {
                            vector = window.contextVectorManager.createKeywordVector(historyText);
                        }
                    } catch (e) {
                        vector = window.contextVectorManager.createKeywordVector(historyText);
                    }
                    
                    // Thêm vào historyEmbeddings
                    window.contextVectorManager.historyEmbeddings.push({
                        content: historyText,
                        vector: vector,
                        turnIndex: i + 1,
                        historyIndex: i,
                        timestamp: Date.now()
                    });
                    
                    // Cho phép UI cập nhật
                    if (i % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
                
                // Gỡ bỏ thông báo tiến độ
                progressMsg.remove();
                
                console.log(`[Ma trận History] ✅ Đã xây dựng ${window.contextVectorManager.historyEmbeddings.length} vector từ nhật ký history`);
                
                // Lưu vào IndexedDB
                await window.contextVectorManager.saveToIndexedDB();
            } else {
                alert('⚠️ Xây dựng lại ma trận thất bại: Kho vector trống và không có nhật ký history khả dụng');
                return;
            }
        }
        
        // Khởi tạo lại ma trận
        const data = await window.matrixManager.initializeHistoryMatrix();
        if (data) {
            alert(`✅ Xây dựng lại ma trận History thành công!\n\nĐã xây dựng ${data.stats.totalLayers} tầng ma trận\nBao gồm ${data.stats.totalVectors} vector`);
            
            // Làm mới hiển thị hiện tại
            document.getElementById('historyMatrixModal')?.remove();
            viewHistoryMatrix();
        } else {
            alert('⚠️ Xây dựng lại ma trận thất bại: Không thể khởi tạo ma trận');
        }
    } catch (error) {
        console.error('[Ma trận History] Xây dựng lại thất bại:', error);
        alert(`❌ Xây dựng lại ma trận thất bại: ${error.message}`);
        // Gỡ bỏ thông báo tiến độ nếu còn sót lại
        document.getElementById('rebuildProgress')?.remove();
    }
}

// Xuất ma trận History
function exportHistoryMatrix() {
    try {
        const data = {
            historyMatrix: window.matrixManager.historyMatrix.export(),
            historyVectorSize: window.contextVectorManager.historyEmbeddings.length,
            config: {
                recentHistoryCount: window.contextVectorManager.recentHistoryCount,
                matrixHistoryCount: window.contextVectorManager.matrixHistoryCount,
                similarityThreshold: window.matrixManager.historyMatrix.similarityThreshold,
                mergeThreshold: window.matrixManager.historyMatrix.mergeThreshold
            },
            exportTime: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `MaTranHistory_${new Date().toLocaleString('vi-VN').replace(/[/:]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Đã xuất ma trận History!');
    } catch (error) {
        alert(`❌ Xuất thất bại: ${error.message}`);
    }
}

console.log('[Ma trận History] Các hàm hỗ trợ đã được tải');
