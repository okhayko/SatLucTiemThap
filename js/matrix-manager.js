/**
 * 矩阵管理器 - 自动矩阵化系统
 * 基于对话向量自动构建层级话题矩阵
 * 整合向量化和矩阵自组织
 */

class AutoGrowingMatrix {
    constructor() {
        this.layers = [];              // 话题层矩阵
        this.relations = [];           // 层间关系
        this.similarityThreshold = 0.7; // 层归属阈值
        this.mergeThreshold = 0.9;     // 层合并阈值
        this.timeDecayRate = 0.9;      // 时间衰减率
        this.minLayerWeight = 0.1;     // 最小层权重
    }

    /**
     * 核心方法：摄取向量并自动分层
     */
    ingestVector(vectorData) {
        const { vector, turnIndex, userMessage, aiResponse, timestamp } = vectorData;

        // 🆕 动态调整相似度阈值：向量数量少时降低阈值
        const dynamicThreshold = this.layers.length < 3 ?
            Math.max(0.3, this.similarityThreshold - 0.3) : // 少于3层时，阈值降低到0.3
            this.similarityThreshold;

        // 1. 计算与现有层的相似度
        const layerWeights = this.calculateLayerWeights(vector, timestamp);

        // 2. 决定归属（归入现有层 or 创建新层）
        if (layerWeights.maxWeight > dynamicThreshold && this.layers.length > 0) {
            // 归入现有层
            const targetLayer = this.layers[layerWeights.maxIndex];
            targetLayer.vectors.push(vectorData);
            targetLayer.lastUpdateTime = timestamp;
            targetLayer.weight = this.updateLayerWeight(targetLayer);

            // 更新层中心（加权平均）
            this.updateLayerCenter(targetLayer);

            console.log(`[矩阵生长] 第${turnIndex}轮对话归入层${layerWeights.maxIndex}（${targetLayer.topic}），相似度：${(layerWeights.maxWeight * 100).toFixed(1)}%`);
        } else {
            // 创建新层
            const newLayer = {
                id: this.layers.length,
                center: vector,                    // 层中心向量
                vectors: [vectorData],             // 该层的所有向量
                topic: this.inferTopic(vectorData), // 自动推断话题
                weight: 1.0,                       // 层权重
                createTime: timestamp,
                lastUpdateTime: timestamp
            };

            this.layers.push(newLayer);

            // 建立与其他层的关联
            if (this.layers.length > 1) {
                this.buildRelations(newLayer);
            }

            console.log(`[矩阵生长] 第${turnIndex}轮对话创建新层${newLayer.id}，话题：${newLayer.topic}，阈值：${(dynamicThreshold * 100).toFixed(1)}%`);
        }

        // 3. 定期优化矩阵结构
        if (this.layers.length % 10 === 0) {
            this.optimizeMatrix();
        }
    }

    /**
     * 计算向量与各层的关联强度
     */
    calculateLayerWeights(newVector, currentTime) {
        if (this.layers.length === 0) {
            return { maxWeight: 0, maxIndex: -1, allWeights: [] };
        }

        const weights = this.layers.map((layer, index) => {
            // 计算语义相似度
            const similarity = this.cosineSimilarity(newVector, layer.center);

            // 应用时间衰减
            const timeDiff = currentTime - layer.lastUpdateTime;
            const timeDecay = Math.pow(this.timeDecayRate, timeDiff / (1000 * 60 * 60)); // 按小时衰减

            return similarity * timeDecay * layer.weight;
        });

        const maxWeight = Math.max(...weights);
        const maxIndex = weights.indexOf(maxWeight);

        return { maxWeight, maxIndex, allWeights: weights };
    }

    /**
     * 更新层中心向量（加权平均）
     */
    updateLayerCenter(layer) {
        // 如果只有一个向量，直接使用
        if (layer.vectors.length === 1) {
            layer.center = layer.vectors[0].vector;
            return;
        }

        // 检查向量类型
        const firstVector = layer.vectors[0].vector;
        const isArray = Array.isArray(firstVector);

        if (isArray) {
            // 稠密向量：计算平均
            const dim = firstVector.length;
            const centerVector = new Array(dim).fill(0);

            layer.vectors.forEach(v => {
                for (let i = 0; i < dim; i++) {
                    centerVector[i] += v.vector[i];
                }
            });

            for (let i = 0; i < dim; i++) {
                centerVector[i] /= layer.vectors.length;
            }

            layer.center = centerVector;
        } else {
            // 稀疏向量：合并所有关键词，取平均权重
            const mergedVector = {};
            const wordCounts = {};

            layer.vectors.forEach(v => {
                Object.keys(v.vector).forEach(word => {
                    mergedVector[word] = (mergedVector[word] || 0) + v.vector[word];
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                });
            });

            // 平均化
            Object.keys(mergedVector).forEach(word => {
                mergedVector[word] /= wordCounts[word];
            });

            layer.center = mergedVector;
        }
    }

    /**
     * 自动推断话题名称
     */
    inferTopic(vectorData) {
        const { userMessage, aiResponse, content } = vectorData;

        // 🔧 修复：兼容多种字段格式（aiResponse、content、userMessage）
        const textContent = aiResponse || content || userMessage || '';

        if (!textContent) {
            return `话题${this.layers.length}`;
        }

        // 简单策略：提取关键词作为话题
        if (window.contextVectorManager) {
            const keywords = window.contextVectorManager.extractKeywords(textContent);

            if (keywords.length > 0) {
                return keywords.slice(0, 3).map(k => k.word).join('-');
            }
        }

        // 回退：从文本中提取前几个字作为话题
        const preview = textContent.substring(0, 20).replace(/[，。！？、\s]/g, '');
        return preview || `话题${this.layers.length}`;
    }

    /**
     * 建立层间关系
     */
    buildRelations(newLayer) {
        this.layers.forEach((layer) => {
            if (layer.id === newLayer.id) return;

            const similarity = this.cosineSimilarity(newLayer.center, layer.center);

            if (similarity > 0.5) {
                this.relations.push({
                    from: layer.id,
                    to: newLayer.id,
                    type: this.inferRelationType(similarity),
                    strength: similarity
                });
            }
        });
    }

    /**
     * 推断关系类型
     */
    inferRelationType(similarity) {
        if (similarity > 0.8) return '强关联';
        if (similarity > 0.6) return '中关联';
        return '弱关联';
    }

    /**
     * 矩阵优化：合并相似层、删除低权重层
     */
    optimizeMatrix() {
        console.log('[矩阵优化] 开始优化...');

        // 1. 合并高度相似的层
        this.mergeSimilarLayers();

        // 2. 删除权重过低的层
        this.pruneLowWeightLayers();

        console.log(`[矩阵优化] 优化完成，当前层数：${this.layers.length}`);
    }

    /**
     * 合并相似层
     */
    mergeSimilarLayers() {
        for (let i = 0; i < this.layers.length; i++) {
            for (let j = i + 1; j < this.layers.length; j++) {
                const similarity = this.cosineSimilarity(
                    this.layers[i].center,
                    this.layers[j].center
                );

                if (similarity > this.mergeThreshold) {
                    // 合并层j到层i
                    this.layers[i].vectors.push(...this.layers[j].vectors);
                    this.updateLayerCenter(this.layers[i]);
                    this.layers[i].weight = this.updateLayerWeight(this.layers[i]);

                    // 删除层j
                    this.layers.splice(j, 1);

                    console.log(`[矩阵优化] 合并层${i}和层${j}`);
                    return this.mergeSimilarLayers(); // 递归继续
                }
            }
        }
    }

    /**
     * 修剪低权重层
     */
    pruneLowWeightLayers() {
        const before = this.layers.length;

        this.layers = this.layers.filter(layer => layer.weight >= this.minLayerWeight);

        const removed = before - this.layers.length;
        if (removed > 0) {
            console.log(`[矩阵优化] 删除了${removed}个低权重层`);
        }
    }

    /**
     * 更新层权重
     */
    updateLayerWeight(layer) {
        // 基于向量数量和最近活跃度
        const vectorCount = layer.vectors.length;
        const recency = 1 / (1 + (Date.now() - layer.lastUpdateTime) / (1000 * 60 * 60 * 24));

        return Math.min(1.0, vectorCount * 0.1 + recency * 0.5);
    }

    /**
     * 余弦相似度计算（复用supply.js的方法）
     */
    cosineSimilarity(vec1, vec2) {
        if (window.contextVectorManager) {
            return window.contextVectorManager.calculateCosineSimilarity(vec1, vec2);
        }

        // 降级实现
        return 0;
    }

    /**
     * 获取矩阵可视化数据
     */
    getVisualizationData() {
        return {
            layers: this.layers.map(layer => ({
                id: layer.id,
                topic: layer.topic,
                vectorCount: layer.vectors.length,
                weight: layer.weight,
                createTime: new Date(layer.createTime).toLocaleString()
            })),
            relations: this.relations,
            stats: {
                totalLayers: this.layers.length,
                totalVectors: this.layers.reduce((sum, l) => sum + l.vectors.length, 0),
                avgVectorsPerLayer: this.layers.length > 0
                    ? (this.layers.reduce((sum, l) => sum + l.vectors.length, 0) / this.layers.length).toFixed(2)
                    : 0
            }
        };
    }

    /**
     * 智能检索（基于矩阵结构）
     * @param {string} query - 查询文本
     * @param {number} maxResults - 最多返回多少条结果
     * @returns {Array} 检索结果
     */
    searchByMatrix(query, maxResults = 15) {
        if (!window.contextVectorManager) {
            console.warn('[矩阵检索] contextVectorManager未初始化');
            return [];
        }

        // 1. 向量化查询
        const queryVector = window.contextVectorManager.createKeywordVector(query);

        // 2. 找到最相关的层
        const layerScores = this.layers.map((layer, index) => ({
            index,
            score: this.cosineSimilarity(queryVector, layer.center) * layer.weight
        }));

        layerScores.sort((a, b) => b.score - a.score);

        // 3. 从最相关的层中检索向量
        const topLayers = layerScores.slice(0, 3); // 只从前3个最相关的层中检索
        const results = [];

        topLayers.forEach(({ index, score }) => {
            const layer = this.layers[index];
            layer.vectors.forEach(vecData => {
                const vecScore = this.cosineSimilarity(queryVector, vecData.vector);
                results.push({
                    ...vecData,
                    matchScore: vecScore * score, // 综合层权重
                    layerTopic: layer.topic,
                    layerId: layer.id
                });
            });
        });

        // 按分数排序
        results.sort((a, b) => b.matchScore - a.matchScore);

        return results.slice(0, maxResults);
    }

    /**
     * 导出矩阵数据
     */
    export() {
        return {
            layers: this.layers,
            relations: this.relations,
            timestamp: Date.now()
        };
    }

    /**
     * 导入矩阵数据
     */
    import(data) {
        if (!data || !data.layers) {
            console.warn('[矩阵管理器] 导入数据无效');
            return;
        }

        this.layers = data.layers || [];
        this.relations = data.relations || [];
        console.log(`[矩阵管理器] 导入成功，共${this.layers.length}层`);
    }

    /**
     * 清空矩阵
     */
    clear() {
        this.layers = [];
        this.relations = [];
        console.log('[矩阵管理器] 矩阵已清空');
    }

    /**
     * 🆕 按轮次删除向量
     * @param {number} turnIndex - 要删除的轮次索引
     * @returns {number} 删除的向量数量
     */
    deleteByTurnIndex(turnIndex) {
        let deletedCount = 0;

        // 遍历所有层，删除匹配的向量
        this.layers.forEach(layer => {
            const before = layer.vectors.length;
            layer.vectors = layer.vectors.filter(v => v.turnIndex !== turnIndex);
            deletedCount += before - layer.vectors.length;

            // 如果层还有向量，更新层中心
            if (layer.vectors.length > 0) {
                this.updateLayerCenter(layer);
                layer.weight = this.updateLayerWeight(layer);
            }
        });

        // 删除空层
        const beforeLayers = this.layers.length;
        this.layers = this.layers.filter(layer => layer.vectors.length > 0);
        const deletedLayers = beforeLayers - this.layers.length;

        if (deletedCount > 0) {
            console.log(`[矩阵回滚] 删除了第${turnIndex}轮的${deletedCount}条向量，${deletedLayers}个空层`);
        }

        return deletedCount;
    }

    /**
     * 🆕 按轮次范围删除向量
     * @param {number} startTurn - 起始轮次（包含）
     * @param {number} endTurn - 结束轮次（包含，可选，默认删除到最后）
     * @returns {number} 删除的向量数量
     */
    deleteByTurnRange(startTurn, endTurn = Infinity) {
        let deletedCount = 0;

        // 遍历所有层，删除匹配的向量
        this.layers.forEach(layer => {
            const before = layer.vectors.length;
            layer.vectors = layer.vectors.filter(v =>
                v.turnIndex < startTurn || v.turnIndex > endTurn
            );
            deletedCount += before - layer.vectors.length;

            // 如果层还有向量，更新层中心
            if (layer.vectors.length > 0) {
                this.updateLayerCenter(layer);
                layer.weight = this.updateLayerWeight(layer);
            }
        });

        // 删除空层
        const beforeLayers = this.layers.length;
        this.layers = this.layers.filter(layer => layer.vectors.length > 0);
        const deletedLayers = beforeLayers - this.layers.length;

        if (deletedCount > 0) {
            console.log(`[矩阵回滚] 删除了第${startTurn}-${endTurn}轮的${deletedCount}条向量，${deletedLayers}个空层`);
        }

        return deletedCount;
    }
}

/**
 * 矩阵管理器 - 整合向量化和矩阵自组织
 */
class MatrixManager {
    constructor() {
        this.matrix = new AutoGrowingMatrix();
        this.historyMatrix = new AutoGrowingMatrix(); // 🆕 专用于history的矩阵
        this.initialized = false;
    }

    /**
     * 从现有历史记录初始化矩阵
     */
    async initializeFromHistory() {
        console.log('[矩阵管理器] 开始从历史记录构建矩阵...');

        if (!window.contextVectorManager) {
            console.error('[矩阵管理器] contextVectorManager未初始化');
            return;
        }

        const embeddings = window.contextVectorManager.conversationEmbeddings;

        if (embeddings.length === 0) {
            console.warn('[矩阵管理器] 向量库为空，请先重建向量库');
            return;
        }

        // 逐条摄取向量
        for (const embedding of embeddings) {
            this.matrix.ingestVector(embedding);
        }

        this.initialized = true;
        console.log(`[矩阵管理器] 矩阵构建完成！共${this.matrix.layers.length}层`);

        return this.matrix.getVisualizationData();
    }

    /**
     * 🆕 从history向量库初始化矩阵
     */
    async initializeHistoryMatrix() {
        console.log('[矩阵管理器] 开始从history向量库构建矩阵...');

        if (!window.contextVectorManager || !window.contextVectorManager.historyEmbeddings) {
            console.error('[矩阵管理器] history向量库未初始化');
            return;
        }

        const historyEmbeddings = window.contextVectorManager.historyEmbeddings;

        if (historyEmbeddings.length === 0) {
            console.warn('[矩阵管理器] history向量库为空');
            return;
        }

        // 逐条摄取history向量
        for (const embedding of historyEmbeddings) {
            this.historyMatrix.ingestVector(embedding);
        }

        console.log(`[矩阵管理器] history矩阵构建完成！共${this.historyMatrix.layers.length}层`);

        return this.historyMatrix.getVisualizationData();
    }

    /**
     * 新对话时自动添加到矩阵
     */
    async addConversation(userMsg, aiResponse, turnIndex, variables) {
        // 1. 先通过supply.js向量化
        await window.contextVectorManager.addConversation(
            userMsg, aiResponse, turnIndex, variables
        );

        // 2. 获取刚添加的向量
        const latestEmbedding = window.contextVectorManager.conversationEmbeddings[
            window.contextVectorManager.conversationEmbeddings.length - 1
        ];

        // 3. 添加到矩阵
        if (this.initialized && latestEmbedding) {
            this.matrix.ingestVector(latestEmbedding);
        }
    }

    /**
     * 可视化矩阵结构
     */
    visualize() {
        const data = this.matrix.getVisualizationData();

        console.log('=== 对话矩阵可视化 ===');
        console.log(`总层数: ${data.stats.totalLayers}`);
        console.log(`总向量数: ${data.stats.totalVectors}`);
        console.log(`平均每层向量数: ${data.stats.avgVectorsPerLayer}`);
        console.log('\n层级结构:');

        data.layers.forEach(layer => {
            console.log(`层${layer.id}: ${layer.topic} (${layer.vectorCount}条, 权重${layer.weight.toFixed(2)})`);
        });

        console.log('\n层间关系:');
        data.relations.forEach(rel => {
            console.log(`层${rel.from} --${rel.type}(${rel.strength.toFixed(2)})--> 层${rel.to}`);
        });

        return data;
    }

    /**
     * 🆕 可视化history矩阵
     */
    visualizeHistory() {
        const data = this.historyMatrix.getVisualizationData();

        console.log('=== History矩阵可视化 ===');
        console.log(`总层数: ${data.stats.totalLayers}`);
        console.log(`总向量数: ${data.stats.totalVectors}`);
        console.log(`平均每层向量数: ${data.stats.avgVectorsPerLayer}`);
        console.log('\n层级结构:');

        data.layers.forEach(layer => {
            console.log(`层${layer.id}: ${layer.topic} (${layer.vectorCount}条, 权重${layer.weight.toFixed(2)})`);
        });

        return data;
    }

    /**
     * 导出矩阵数据
     */
    export() {
        return {
            conversationMatrix: this.matrix.export(),
            historyMatrix: this.historyMatrix.export(),
            timestamp: Date.now()
        };
    }

    /**
     * 导入矩阵数据
     */
    import(data) {
        if (!data) return;

        if (data.conversationMatrix) {
            this.matrix.import(data.conversationMatrix);
        }

        if (data.historyMatrix) {
            this.historyMatrix.import(data.historyMatrix);
        }

        this.initialized = true;
        console.log(`[矩阵管理器] 导入成功`);
    }

    /**
     * 清空矩阵
     */
    clear() {
        this.matrix.clear();
        this.historyMatrix.clear();
        this.initialized = false;
    }
}

// 全局实例
window.matrixManager = new MatrixManager();

/**
 * 🆕 全局函数：清空并重建矩阵
 * 🔧 修复：从当前游戏状态重建，而不是从IndexedDB
 */
window.rebuildMatrix = async function () {
    if (!window.matrixManager) {
        console.error('[矩阵重建] matrixManager未初始化');
        alert('❌ 矩阵管理器未初始化');
        return;
    }

    if (!window.contextVectorManager) {
        console.error('[矩阵重建] contextVectorManager未初始化');
        alert('❌ 向量管理器未初始化');
        return;
    }

    console.log('[矩阵重建] 开始清空并重建矩阵...');
    console.log('[矩阵重建] 当前向量库状态：');
    console.log(`  - 对话向量：${window.contextVectorManager.conversationEmbeddings.length}条`);
    console.log(`  - History向量：${window.contextVectorManager.historyEmbeddings.length}条`);

    // 🔧 检查向量库是否与当前游戏状态匹配
    const currentHistory = window.gameState?.variables?.history || [];
    const vectorHistory = window.contextVectorManager.historyEmbeddings.length;

    if (currentHistory.length > 0 && vectorHistory === 0) {
        console.warn('[矩阵重建] ⚠️ 检测到history数据不匹配！');
        console.warn(`  当前游戏history: ${currentHistory.length}条`);
        console.warn(`  向量库history: ${vectorHistory}条`);
        console.warn('  建议先"同步向量库"再重建矩阵');

        const confirmRebuild = confirm(
            `⚠️ 向量库数据不匹配！\n\n` +
            `当前游戏history：${currentHistory.length}条\n` +
            `向量库history：${vectorHistory}条\n\n` +
            `建议点击"取消"，然后：\n` +
            `1. 打开配置面板\n` +
            `2. 点击"同步向量库"\n` +
            `3. 再重建矩阵\n\n` +
            `或点击"确定"继续用当前向量库重建（可能为空）`
        );

        if (!confirmRebuild) {
            return;
        }
    }

    // 清空现有矩阵
    window.matrixManager.clear();
    console.log('[矩阵重建] ✅ 已清空矩阵');

    // 从向量库重建对话矩阵
    if (window.contextVectorManager.conversationEmbeddings.length > 0) {
        await window.matrixManager.initializeFromHistory();
        console.log(`[矩阵重建] ✅ 已重建对话矩阵，共${window.matrixManager.matrix.layers.length}层`);
    } else {
        console.log('[矩阵重建] ⚠️ 对话向量库为空，跳过对话矩阵重建');
    }

    // 从向量库重建history矩阵
    if (window.contextVectorManager.historyEmbeddings.length > 0) {
        console.log(`[矩阵重建] 🔄 重建history矩阵，共${window.contextVectorManager.historyEmbeddings.length}条...`);
        let ingestedCount = 0;
        for (const entry of window.contextVectorManager.historyEmbeddings) {
            try {
                window.matrixManager.historyMatrix.ingestVector({
                    vector: entry.vector,
                    aiResponse: entry.content,
                    turnIndex: entry.turnIndex,
                    timestamp: entry.timestamp
                });
                ingestedCount++;
            } catch (error) {
                console.warn(`[矩阵重建] 摄入失败:`, entry.content?.substring(0, 30), error);
            }
        }
        console.log(`[矩阵重建] ✅ 已重建history矩阵，共${window.matrixManager.historyMatrix.layers.length}层（${ingestedCount}条记录）`);
    } else {
        console.log('[矩阵重建] ⚠️ history向量库为空，跳过history矩阵重建');
    }

    // 🆕 自动保存到当前存档
    if (typeof saveGameToSlot === 'function') {
        await saveGameToSlot('自动存档');
        console.log('[矩阵重建] ✅ 已保存到自动存档');
    }

    alert(`✅ 矩阵重建完成！\n\n对话矩阵：${window.matrixManager.matrix.layers.length}层\nHistory矩阵：${window.matrixManager.historyMatrix.layers.length}层\n\n已保存到"自动存档"`);
};

console.log('[矩阵管理器] 已加载 matrix-manager.js');
