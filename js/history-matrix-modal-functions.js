// 🆕 History矩阵支持函数
// 这些函数为 viewHistoryMatrix() 提供支持

// 过滤矩阵层
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

// 显示矩阵层详情
function showMatrixLayerDetail(layerIndex) {
    const layer = window.matrixManager.historyMatrix.layers[layerIndex];
    if (!layer) return;

    let detailHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin: 0;">📋 矩阵层 ${layerIndex + 1} 详情</h2>
            <button onclick="document.getElementById('matrixLayerDetailModal').remove()" style="
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">关闭</button>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 层信息</div>
            <div style="font-size: 13px; line-height: 1.8;">
                🏷️ 话题：${layer.topic || '未分类'}<br>
                ⚖️ 权重：${layer.weight ? layer.weight.toFixed(3) : '0.000'}<br>
                📦 向量数量：${layer.vectors ? layer.vectors.length : 0}<br>
                🕐 创建时间：${layer.createTime ? new Date(layer.createTime).toLocaleString('zh-CN') : '未知'}<br>
                🔄 更新时间：${layer.lastUpdateTime ? new Date(layer.lastUpdateTime).toLocaleString('zh-CN') : '未知'}
            </div>
        </div>

        <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">📦 包含的向量</div>
            <div style="max-height: 300px; overflow-y: auto;">
    `;

    if (layer.vectors && layer.vectors.length > 0) {
        layer.vectors.forEach((vector, index) => {
            const content = vector.content || vector.text || vector.aiResponse || '无内容';
            const preview = content.length > 150 ? content.substring(0, 150) + '...' : content;
            const turnIndex = vector.turnIndex || '?';
            const historyIndex = vector.historyIndex || '?';
            const timestamp = vector.timestamp ? new Date(vector.timestamp).toLocaleString('zh-CN') : '未知时间';
            
            detailHtml += `
                <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; border-left: 3px solid #28a745;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                        [${index + 1}] 轮${turnIndex}-条${historyIndex} | ${timestamp}
                    </div>
                    <div style="font-size: 12px; color: #333; line-height: 1.4;">${preview}</div>
                </div>
            `;
        });
    } else {
        detailHtml += `<div style="color: #666; font-style: italic;">该层暂无向量数据</div>`;
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
            ">🧪 测试此层检索</button>
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

// 测试矩阵检索
function testMatrixRetrieval() {
    const keyword = prompt('请输入测试关键词（如：青云宗、长老、修炼等）：');
    if (!keyword) return;

    try {
        const results = window.matrixManager.historyMatrix.searchByMatrix(keyword, 5);
        
        if (results.length === 0) {
            alert(`🧪 矩阵检索测试结果\n\n关键词："${keyword}"\n\n❌ 未找到相关结果\n\n💡 可能原因：\n• 矩阵为空\n• 关键词与现有内容不匹配\n• 相似度阈值过高`);
        } else {
            let resultText = `🧪 矩阵检索测试结果\n\n关键词："${keyword}"\n找到 ${results.length} 条相关结果：\n\n`;
            
            results.forEach((result, index) => {
                const content = result.content || result.text || result.aiResponse || '无内容';
                const preview = content.length > 80 ? content.substring(0, 80) + '...' : content;
                const score = result.matchScore ? (result.matchScore * 100).toFixed(2) : '0.00';
                
                resultText += `${index + 1}. [相似度: ${score}%] ${preview}\n`;
            });
            
            alert(resultText);
        }
    } catch (error) {
        alert(`❌ 检索测试失败：${error.message}`);
    }
}

// 测试层检索
function testLayerRetrieval(layerIndex) {
    const keyword = prompt('请输入测试关键词：');
    if (!keyword) return;

    try {
        const layer = window.matrixManager.historyMatrix.layers[layerIndex];
        if (!layer) {
            alert('❌ 层不存在');
            return;
        }

        // 在该层内搜索
        const results = [];
        const queryVector = window.contextVectorManager.createKeywordVector(keyword);
        
        layer.vectors.forEach(vector => {
            const similarity = window.contextVectorManager.calculateCosineSimilarity(queryVector, vector.vector);
            if (similarity > window.contextVectorManager.minSimilarityThreshold) {
                results.push({ vector, similarity: (similarity * 100).toFixed(2) });
            }
        });

        if (results.length === 0) {
            alert(`🧪 层${layerIndex + 1}检索测试\n\n关键词："${keyword}"\n\n❌ 未找到相关结果`);
        } else {
            let resultText = `🧪 层${layerIndex + 1}检索测试\n\n关键词："${keyword}"\n找到 ${results.length} 条相关结果：\n\n`;
            
            results.forEach((result, index) => {
                const content = result.vector.content || result.vector.text || result.vector.aiResponse || '无内容';
                const preview = content.length > 60 ? content.substring(0, 60) + '...' : content;
                resultText += `${index + 1}. [相似度: ${result.similarity}%] ${preview}\n`;
            });
            
            alert(resultText);
        }
    } catch (error) {
        alert(`❌ 层检索测试失败：${error.message}`);
    }
}

// 重建History矩阵
async function rebuildHistoryMatrix() {
    if (!confirm('⚠️ 确定要重建History矩阵吗？\n\n这将清空现有矩阵并重新从向量库构建。\n如果向量库为空，将自动从history记录构建。')) {
        return;
    }

    try {
        // 清空现有矩阵
        window.matrixManager.historyMatrix.clear();
        
        // 🔧 修复：如果historyEmbeddings为空，先从gameState.variables.history构建
        if (window.contextVectorManager.historyEmbeddings.length === 0) {
            const history = window.gameState?.variables?.history;
            if (history && Array.isArray(history) && history.length > 0) {
                console.log(`[History矩阵] 🔄 向量库为空，从history记录构建（${history.length}条）...`);
                
                // 显示进度提示
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
                        🔄 正在重建History向量库...
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        请稍候，正在处理 <span id="rebuildCurrentItem">0</span>/${history.length} 条记录
                    </div>
                `;
                document.body.appendChild(progressMsg);
                
                // 清空并重建historyEmbeddings
                window.contextVectorManager.historyEmbeddings = [];
                
                for (let i = 0; i < history.length; i++) {
                    const historyText = history[i];
                    if (!historyText || typeof historyText !== 'string') continue;
                    
                    // 更新进度
                    const progressSpan = document.getElementById('rebuildCurrentItem');
                    if (progressSpan) progressSpan.textContent = i + 1;
                    
                    // 生成向量
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
                    
                    // 添加到historyEmbeddings
                    window.contextVectorManager.historyEmbeddings.push({
                        content: historyText,
                        vector: vector,
                        turnIndex: i + 1,
                        historyIndex: i,
                        timestamp: Date.now()
                    });
                    
                    // 让UI有机会更新
                    if (i % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
                
                // 移除进度提示
                progressMsg.remove();
                
                console.log(`[History矩阵] ✅ 已从history记录构建 ${window.contextVectorManager.historyEmbeddings.length} 条向量`);
                
                // 保存到IndexedDB
                await window.contextVectorManager.saveToIndexedDB();
            } else {
                alert('⚠️ 矩阵重建失败：向量库为空且无history记录可用');
                return;
            }
        }
        
        // 重新初始化矩阵
        const data = await window.matrixManager.initializeHistoryMatrix();
        if (data) {
            alert(`✅ History矩阵重建成功！\n\n重建了 ${data.stats.totalLayers} 层矩阵\n包含 ${data.stats.totalVectors} 个向量`);
            
            // 刷新当前显示
            document.getElementById('historyMatrixModal')?.remove();
            viewHistoryMatrix();
        } else {
            alert('⚠️ 矩阵重建失败：无法初始化矩阵');
        }
    } catch (error) {
        console.error('[History矩阵] 重建失败:', error);
        alert(`❌ 矩阵重建失败：${error.message}`);
        // 移除可能残留的进度提示
        document.getElementById('rebuildProgress')?.remove();
    }
}

// 导出History矩阵
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
        a.download = `History矩阵_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ History矩阵已导出！');
    } catch (error) {
        alert(`❌ 导出失败：${error.message}`);
    }
}

console.log('[History矩阵] 支持函数已加载');
