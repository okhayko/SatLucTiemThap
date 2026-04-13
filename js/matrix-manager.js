/**
 * Trình quản lý Ma trận - Hệ thống ma trận hóa tự động
 * Tự động xây dựng ma trận chủ đề phân tầng dựa trên vector hội thoại
 * Tích hợp vector hóa và tự tổ chức ma trận
 */

class AutoGrowingMatrix {
    constructor() {
        this.layers = [];              // Ma trận tầng chủ đề
        this.relations = [];           // Quan hệ giữa các tầng
        this.similarityThreshold = 0.7; // Ngưỡng thuộc về tầng
        this.mergeThreshold = 0.9;     // Ngưỡng gộp tầng
        this.timeDecayRate = 0.9;      // Tỷ lệ suy giảm theo thời gian
        this.minLayerWeight = 0.1;     // Trọng số tầng tối thiểu
    }

    /**
     * Phương thức cốt lõi: Tiếp nhận vector và tự động phân tầng
     */
    ingestVector(vectorData) {
        const { vector, turnIndex, userMessage, aiResponse, timestamp } = vectorData;

        // 🆕 Điều chỉnh động ngưỡng tương đồng: Hạ ngưỡng khi số lượng vector còn ít
        const dynamicThreshold = this.layers.length < 3 ?
            Math.max(0.3, this.similarityThreshold - 0.3) : // Khi ít hơn 3 tầng, ngưỡng hạ xuống 0.3
            this.similarityThreshold;

        // 1. Tính toán độ tương đồng với các tầng hiện có
        const layerWeights = this.calculateLayerWeights(vector, timestamp);

        // 2. Quyết định thuộc về (vào tầng hiện có hoặc tạo tầng mới)
        if (layerWeights.maxWeight > dynamicThreshold && this.layers.length > 0) {
            // Đưa vào tầng hiện có
            const targetLayer = this.layers[layerWeights.maxIndex];
            targetLayer.vectors.push(vectorData);
            targetLayer.lastUpdateTime = timestamp;
            targetLayer.weight = this.updateLayerWeight(targetLayer);

            // Cập nhật tâm của tầng (trung bình có trọng số)
            this.updateLayerCenter(targetLayer);

            console.log(`[Ma trận sinh trưởng] Lượt hội thoại thứ ${turnIndex} được đưa vào tầng ${layerWeights.maxIndex}（${targetLayer.topic}），độ tương đồng：${(layerWeights.maxWeight * 100).toFixed(1)}%`);
        } else {
            // Tạo tầng mới
            const newLayer = {
                id: this.layers.length,
                center: vector,                    // Vector tâm của tầng
                vectors: [vectorData],             // Tất cả vector thuộc tầng này
                topic: this.inferTopic(vectorData), // Tự động suy luận chủ đề
                weight: 1.0,                       // Trọng số tầng
                createTime: timestamp,
                lastUpdateTime: timestamp
            };

            this.layers.push(newLayer);

            // Thiết lập liên kết với các tầng khác
            if (this.layers.length > 1) {
                this.buildRelations(newLayer);
            }

            console.log(`[Ma trận sinh trưởng] Lượt hội thoại thứ ${turnIndex} tạo tầng mới ${newLayer.id}，chủ đề：${newLayer.topic}，ngưỡng：${(dynamicThreshold * 100).toFixed(1)}%`);
        }

        // 3. Định kỳ tối ưu hóa cấu trúc ma trận
        if (this.layers.length % 10 === 0) {
            this.optimizeMatrix();
        }
    }

    /**
     * Tính toán cường độ liên kết giữa vector và các tầng
     */
    calculateLayerWeights(newVector, currentTime) {
        if (this.layers.length === 0) {
            return { maxWeight: 0, maxIndex: -1, allWeights: [] };
        }

        const weights = this.layers.map((layer, index) => {
            // Tính toán độ tương đồng ngữ nghĩa
            const similarity = this.cosineSimilarity(newVector, layer.center);

            // Áp dụng suy giảm theo thời gian
            const timeDiff = currentTime - layer.lastUpdateTime;
            const timeDecay = Math.pow(this.timeDecayRate, timeDiff / (1000 * 60 * 60)); // Suy giảm theo giờ

            return similarity * timeDecay * layer.weight;
        });

        const maxWeight = Math.max(...weights);
        const maxIndex = weights.indexOf(maxWeight);

        return { maxWeight, maxIndex, allWeights: weights };
    }

    /**
     * Cập nhật vector tâm của tầng (trung bình có trọng số)
     */
    updateLayerCenter(layer) {
        // Nếu chỉ có một vector, sử dụng trực tiếp
        if (layer.vectors.length === 1) {
            layer.center = layer.vectors[0].vector;
            return;
        }

        // Kiểm tra loại vector
        const firstVector = layer.vectors[0].vector;
        const isArray = Array.isArray(firstVector);

        if (isArray) {
            // Vector dày đặc (Dense): Tính trung bình
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
            // Vector thưa thớt (Sparse): Gộp tất cả từ khóa, lấy trọng số trung bình
            const mergedVector = {};
            const wordCounts = {};

            layer.vectors.forEach(v => {
                Object.keys(v.vector).forEach(word => {
                    mergedVector[word] = (mergedVector[word] || 0) + v.vector[word];
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                });
            });

            // Trung bình hóa
            Object.keys(mergedVector).forEach(word => {
                mergedVector[word] /= wordCounts[word];
            });

            layer.center = mergedVector;
        }
    }

    /**
     * Tự động suy luận tên chủ đề
     */
    inferTopic(vectorData) {
        const { userMessage, aiResponse, content } = vectorData;

        // 🔧 Sửa lỗi: Tương thích nhiều định dạng trường dữ liệu (aiResponse, content, userMessage)
        const textContent = aiResponse || content || userMessage || '';

        if (!textContent) {
            return `Chủ đề ${this.layers.length}`;
        }

        // Chiến lược đơn giản: Trích xuất từ khóa làm chủ đề
        if (window.contextVectorManager) {
            const keywords = window.contextVectorManager.extractKeywords(textContent);

            if (keywords.length > 0) {
                return keywords.slice(0, 3).map(k => k.word).join('-');
            }
        }

        // Dự phòng: Trích xuất vài chữ đầu từ văn bản làm chủ đề
        const preview = textContent.substring(0, 20).replace(/[，。！？、\s]/g, '');
        return preview || `Chủ đề ${this.layers.length}`;
    }

    /**
     * Thiết lập quan hệ giữa các tầng
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
     * Suy luận loại quan hệ
     */
    inferRelationType(similarity) {
        if (similarity > 0.8) return 'Liên kết mạnh';
        if (similarity > 0.6) return 'Liên kết vừa';
        return 'Liên kết yếu';
    }

    /**
     * Tối ưu hóa ma trận: Gộp các tầng tương đồng, xóa các tầng trọng số thấp
     */
    optimizeMatrix() {
        console.log('[Tối ưu ma trận] Bắt đầu tối ưu...');

        // 1. Gộp các tầng có độ tương đồng cao
        this.mergeSimilarLayers();

        // 2. Xóa các tầng có trọng số quá thấp
        this.pruneLowWeightLayers();

        console.log(`[Tối ưu ma trận] Tối ưu hoàn tất, số tầng hiện tại：${this.layers.length}`);
    }

    /**
     * Gộp các tầng tương đồng
     */
    mergeSimilarLayers() {
        for (let i = 0; i < this.layers.length; i++) {
            for (let j = i + 1; j < this.layers.length; j++) {
                const similarity = this.cosineSimilarity(
                    this.layers[i].center,
                    this.layers[j].center
                );

                if (similarity > this.mergeThreshold) {
                    // Gộp tầng j vào tầng i
                    this.layers[i].vectors.push(...this.layers[j].vectors);
                    this.updateLayerCenter(this.layers[i]);
                    this.layers[i].weight = this.updateLayerWeight(this.layers[i]);

                    // Xóa tầng j
                    this.layers.splice(j, 1);

                    console.log(`[Tối ưu ma trận] Gộp tầng ${i} và tầng ${j}`);
                    return this.mergeSimilarLayers(); // Tiếp tục đệ quy
                }
            }
        }
    }

    /**
     * Cắt tỉa các tầng trọng số thấp
     */
    pruneLowWeightLayers() {
        const before = this.layers.length;

        this.layers = this.layers.filter(layer => layer.weight >= this.minLayerWeight);

        const removed = before - this.layers.length;
        if (removed > 0) {
            console.log(`[Tối ưu ma trận] Đã xóa ${removed} tầng trọng số thấp`);
        }
    }

    /**
     * Cập nhật trọng số tầng
     */
    updateLayerWeight(layer) {
        // Dựa trên số lượng vector và mức độ hoạt động gần đây
        const vectorCount = layer.vectors.length;
        const recency = 1 / (1 + (Date.now() - layer.lastUpdateTime) / (1000 * 60 * 60 * 24));

        return Math.min(1.0, vectorCount * 0.1 + recency * 0.5);
    }

    /**
     * Tính toán độ tương đồng Cosine (Sử dụng lại phương thức từ supply.js)
     */
    cosineSimilarity(vec1, vec2) {
        if (window.contextVectorManager) {
            return window.contextVectorManager.calculateCosineSimilarity(vec1, vec2);
        }

        // Triển khai dự phòng
        return 0;
    }

    /**
     * Lấy dữ liệu trực quan hóa ma trận
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
     * Truy xuất thông minh (Dựa trên cấu trúc ma trận)
     * @param {string} query - Văn bản truy vấn
     * @param {number} maxResults - Số lượng kết quả tối đa trả về
     * @returns {Array} Kết quả truy xuất
     */
    searchByMatrix(query, maxResults = 15) {
        if (!window.contextVectorManager) {
            console.warn('[Truy xuất ma trận] contextVectorManager chưa được khởi tạo');
            return [];
        }

        // 1. Vector hóa truy vấn
        const queryVector = window.contextVectorManager.createKeywordVector(query);

        // 2. Tìm các tầng liên quan nhất
        const layerScores = this.layers.map((layer, index) => ({
            index,
            score: this.cosineSimilarity(queryVector, layer.center) * layer.weight
        }));

        layerScores.sort((a, b) => b.score - a.score);

        // 3. Truy xuất vector từ các tầng liên quan nhất
        const topLayers = layerScores.slice(0, 3); // Chỉ truy xuất từ 3 tầng liên quan nhất
        const results = [];

        topLayers.forEach(({ index, score }) => {
            const layer = this.layers[index];
            layer.vectors.forEach(vecData => {
                const vecScore = this.cosineSimilarity(queryVector, vecData.vector);
                results.push({
                    ...vecData,
                    matchScore: vecScore * score, // Trọng số tầng tổng hợp
                    layerTopic: layer.topic,
                    layerId: layer.id
                });
            });
        });

        // Sắp xếp theo điểm số
        results.sort((a, b) => b.matchScore - a.matchScore);

        return results.slice(0, maxResults);
    }

    /**
     * Xuất dữ liệu ma trận
     */
    export() {
        return {
            layers: this.layers,
            relations: this.relations,
            timestamp: Date.now()
        };
    }

    /**
     * Nhập dữ liệu ma trận
     */
    import(data) {
        if (!data || !data.layers) {
            console.warn('[Trình quản lý ma trận] Dữ liệu nhập không hợp lệ');
            return;
        }

        this.layers = data.layers || [];
        this.relations = data.relations || [];
        console.log(`[Trình quản lý ma trận] Nhập thành công, tổng cộng ${this.layers.length} tầng`);
    }

    /**
     * Xóa sạch ma trận
     */
    clear() {
        this.layers = [];
        this.relations = [];
        console.log('[Trình quản lý ma trận] Ma trận đã được xóa sạch');
    }

    /**
     * 🆕 Xóa vector theo lượt hội thoại
     * @param {number} turnIndex - Chỉ số lượt hội thoại cần xóa
     * @returns {number} Số lượng vector đã xóa
     */
    deleteByTurnIndex(turnIndex) {
        let deletedCount = 0;

        // Duyệt qua tất cả các tầng, xóa các vector khớp
        this.layers.forEach(layer => {
            const before = layer.vectors.length;
            layer.vectors = layer.vectors.filter(v => v.turnIndex !== turnIndex);
            deletedCount += before - layer.vectors.length;

            // Nếu tầng vẫn còn vector, cập nhật tâm của tầng
            if (layer.vectors.length > 0) {
                this.updateLayerCenter(layer);
                layer.weight = this.updateLayerWeight(layer);
            }
        });

        // Xóa các tầng rỗng
        const beforeLayers = this.layers.length;
        this.layers = this.layers.filter(layer => layer.vectors.length > 0);
        const deletedLayers = beforeLayers - this.layers.length;

        if (deletedCount > 0) {
            console.log(`[Hoàn tác ma trận] Đã xóa ${deletedCount} vector của lượt thứ ${turnIndex}，${deletedLayers} tầng rỗng`);
        }

        return deletedCount;
    }

    /**
     * 🆕 Xóa vector theo phạm vi lượt hội thoại
     * @param {number} startTurn - Lượt bắt đầu (bao gồm)
     * @param {number} endTurn - Lượt kết thúc (bao gồm, tùy chọn, mặc định xóa đến hết)
     * @returns {number} Số lượng vector đã xóa
     */
    deleteByTurnRange(startTurn, endTurn = Infinity) {
        let deletedCount = 0;

        // Duyệt qua tất cả các tầng, xóa các vector khớp
        this.layers.forEach(layer => {
            const before = layer.vectors.length;
            layer.vectors = layer.vectors.filter(v =>
                v.turnIndex < startTurn || v.turnIndex > endTurn
            );
            deletedCount += before - layer.vectors.length;

            // Nếu tầng vẫn còn vector, cập nhật tâm của tầng
            if (layer.vectors.length > 0) {
                this.updateLayerCenter(layer);
                layer.weight = this.updateLayerWeight(layer);
            }
        });

        // Xóa các tầng rỗng
        const beforeLayers = this.layers.length;
        this.layers = this.layers.filter(layer => layer.vectors.length > 0);
        const deletedLayers = beforeLayers - this.layers.length;

        if (deletedCount > 0) {
            console.log(`[Hoàn tác ma trận] Đã xóa ${deletedCount} vector thuộc lượt thứ ${startTurn}-${endTurn}，${deletedLayers} tầng rỗng`);
        }

        return deletedCount;
    }
}

/**
 * Trình quản lý ma trận - Tích hợp vector hóa và tự tổ chức ma trận
 */
class MatrixManager {
    constructor() {
        this.matrix = new AutoGrowingMatrix();
        this.historyMatrix = new AutoGrowingMatrix(); // 🆕 Ma trận chuyên dụng cho history
        this.initialized = false;
    }

    /**
     * Khởi tạo ma trận từ hồ sơ lịch sử hiện có
     */
    async initializeFromHistory() {
        console.log('[Trình quản lý ma trận] Bắt đầu xây dựng ma trận từ lịch sử...');

        if (!window.contextVectorManager) {
            console.error('[Trình quản lý ma trận] contextVectorManager chưa được khởi tạo');
            return;
        }

        const embeddings = window.contextVectorManager.conversationEmbeddings;

        if (embeddings.length === 0) {
            console.warn('[Trình quản lý ma trận] Thư viện vector trống, vui lòng xây dựng lại thư viện vector trước');
            return;
        }

        // Tiếp nhận từng vector một
        for (const embedding of embeddings) {
            this.matrix.ingestVector(embedding);
        }

        this.initialized = true;
        console.log(`[Trình quản lý ma trận] Xây dựng ma trận hoàn tất! Tổng cộng ${this.matrix.layers.length} tầng`);

        return this.matrix.getVisualizationData();
    }

    /**
     * 🆕 Khởi tạo ma trận từ thư viện vector history
     */
    async initializeHistoryMatrix() {
        console.log('[Trình quản lý ma trận] Bắt đầu xây dựng ma trận từ thư viện vector history...');

        if (!window.contextVectorManager || !window.contextVectorManager.historyEmbeddings) {
            console.error('[Trình quản lý ma trận] Thư viện vector history chưa được khởi tạo');
            return;
        }

        const historyEmbeddings = window.contextVectorManager.historyEmbeddings;

        if (historyEmbeddings.length === 0) {
            console.warn('[Trình quản lý ma trận] Thư viện vector history đang trống');
            return;
        }

        // Tiếp nhận từng vector history
        for (const embedding of historyEmbeddings) {
            this.historyMatrix.ingestVector(embedding);
        }

        console.log(`[Trình quản lý ma trận] Xây dựng ma trận history hoàn tất! Tổng cộng ${this.historyMatrix.layers.length} tầng`);

        return this.historyMatrix.getVisualizationData();
    }

    /**
     * Tự động thêm vào ma trận khi có hội thoại mới
     */
    async addConversation(userMsg, aiResponse, turnIndex, variables) {
        // 1. Vector hóa thông qua supply.js trước
        await window.contextVectorManager.addConversation(
            userMsg, aiResponse, turnIndex, variables
        );

        // 2. Lấy vector vừa được thêm vào
        const latestEmbedding = window.contextVectorManager.conversationEmbeddings[
            window.contextVectorManager.conversationEmbeddings.length - 1
        ];

        // 3. Thêm vào ma trận
        if (this.initialized && latestEmbedding) {
            this.matrix.ingestVector(latestEmbedding);
        }
    }

    /**
     * Trực quan hóa cấu trúc ma trận
     */
    visualize() {
        const data = this.matrix.getVisualizationData();

        console.log('=== Trực quan hóa ma trận hội thoại ===');
        console.log(`Tổng số tầng: ${data.stats.totalLayers}`);
        console.log(`Tổng số vector: ${data.stats.totalVectors}`);
        console.log(`Số vector trung bình mỗi tầng: ${data.stats.avgVectorsPerLayer}`);
        console.log('\nCấu trúc phân tầng:');

        data.layers.forEach(layer => {
            console.log(`Tầng ${layer.id}: ${layer.topic} (${layer.vectorCount} mục, trọng số ${layer.weight.toFixed(2)})`);
        });

        console.log('\nQuan hệ giữa các tầng:');
        data.relations.forEach(rel => {
            console.log(`Tầng ${rel.from} --${rel.type}(${rel.strength.toFixed(2)})--> Tầng ${rel.to}`);
        });

        return data;
    }

    /**
     * 🆕 Trực quan hóa ma trận history
     */
    visualizeHistory() {
        const data = this.historyMatrix.getVisualizationData();

        console.log('=== Trực quan hóa ma trận History ===');
        console.log(`Tổng số tầng: ${data.stats.totalLayers}`);
        console.log(`Tổng số vector: ${data.stats.totalVectors}`);
        console.log(`Số vector trung bình mỗi tầng: ${data.stats.avgVectorsPerLayer}`);
        console.log('\nCấu trúc phân tầng:');

        data.layers.forEach(layer => {
            console.log(`Tầng ${layer.id}: ${layer.topic} (${layer.vectorCount} mục, trọng số ${layer.weight.toFixed(2)})`);
        });

        return data;
    }

    /**
     * Xuất dữ liệu ma trận
     */
    export() {
        return {
            conversationMatrix: this.matrix.export(),
            historyMatrix: this.historyMatrix.export(),
            timestamp: Date.now()
        };
    }

    /**
     * Nhập dữ liệu ma trận
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
        console.log(`[Trình quản lý ma trận] Nhập dữ liệu thành công`);
    }

    /**
     * Xóa sạch ma trận
     */
    clear() {
        this.matrix.clear();
        this.historyMatrix.clear();
        this.initialized = false;
    }
}

// Thực thể toàn cục
window.matrixManager = new MatrixManager();

/**
 * 🆕 Hàm toàn cục: Xóa sạch và xây dựng lại ma trận
 * 🔧 Sửa lỗi: Xây dựng lại từ trạng thái trò chơi hiện tại, không phải từ IndexedDB
 */
window.rebuildMatrix = async function () {
    if (!window.matrixManager) {
        console.error('[Xây dựng lại ma trận] matrixManager chưa được khởi tạo');
        alert('❌ Trình quản lý ma trận chưa được khởi tạo');
        return;
    }

    if (!window.contextVectorManager) {
        console.error('[Xây dựng lại ma trận] contextVectorManager chưa được khởi tạo');
        alert('❌ Trình quản lý vector chưa được khởi tạo');
        return;
    }

    console.log('[Xây dựng lại ma trận] Bắt đầu xóa sạch và xây dựng lại ma trận...');
    console.log('[Xây dựng lại ma trận] Trạng thái thư viện vector hiện tại:');
    console.log(`  - Vector hội thoại: ${window.contextVectorManager.conversationEmbeddings.length} mục`);
    console.log(`  - Vector History: ${window.contextVectorManager.historyEmbeddings.length} mục`);

    // 🔧 Kiểm tra xem thư viện vector có khớp với trạng thái trò chơi hiện tại không
    const currentHistory = window.gameState?.variables?.history || [];
    const vectorHistory = window.contextVectorManager.historyEmbeddings.length;

    if (currentHistory.length > 0 && vectorHistory === 0) {
        console.warn('[Xây dựng lại ma trận] ⚠️ Phát hiện dữ liệu history không khớp!');
        console.warn(`  History trò chơi hiện tại: ${currentHistory.length} mục`);
        console.warn(`  History thư viện vector: ${vectorHistory} mục`);
        console.warn('  Gợi ý nên "Đồng bộ thư viện vector" trước khi xây dựng lại ma trận');

        const confirmRebuild = confirm(
            `⚠️ Dữ liệu thư viện vector không khớp!\n\n` +
            `History trò chơi hiện tại：${currentHistory.length} mục\n` +
            `History thư viện vector：${vectorHistory} mục\n\n` +
            `Gợi ý nhấn "Hủy", sau đó：\n` +
            `1. Mở bảng cấu hình\n` +
            `2. Nhấn "Đồng bộ thư viện vector"\n` +
            `3. Rồi mới xây dựng lại ma trận\n\n` +
            `Hoặc nhấn "Xác nhận" để tiếp tục xây dựng lại bằng thư viện vector hiện tại (có thể bị trống)`
        );

        if (!confirmRebuild) {
            return;
        }
    }

    // Xóa ma trận hiện có
    window.matrixManager.clear();
    console.log('[Xây dựng lại ma trận] ✅ Đã xóa sạch ma trận');

    // Xây dựng lại ma trận hội thoại từ thư viện vector
    if (window.contextVectorManager.conversationEmbeddings.length > 0) {
        await window.matrixManager.initializeFromHistory();
        console.log(`[Xây dựng lại ma trận] ✅ Đã xây dựng lại ma trận hội thoại, tổng cộng ${window.matrixManager.matrix.layers.length} tầng`);
    } else {
        console.log('[Xây dựng lại ma trận] ⚠️ Thư viện vector hội thoại trống, bỏ qua xây dựng lại ma trận hội thoại');
    }

    // Xây dựng lại ma trận history từ thư viện vector
    if (window.contextVectorManager.historyEmbeddings.length > 0) {
        console.log(`[Xây dựng lại ma trận] 🔄 Đang xây dựng lại ma trận history, tổng cộng ${window.contextVectorManager.historyEmbeddings.length} mục...`);
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
                console.warn(`[Xây dựng lại ma trận] Tiếp nhận thất bại:`, entry.content?.substring(0, 30), error);
            }
        }
        console.log(`[Xây dựng lại ma trận] ✅ Đã xây dựng lại ma trận history, tổng cộng ${window.matrixManager.historyMatrix.layers.length} tầng (${ingestedCount} bản ghi)`);
    } else {
        console.log('[Xây dựng lại ma trận] ⚠️ Thư viện vector history trống, bỏ qua xây dựng lại ma trận history');
    }

    // 🆕 Tự động lưu vào bản lưu hiện tại
    if (typeof saveGameToSlot === 'function') {
        await saveGameToSlot('Tự động lưu');
        console.log('[Xây dựng lại ma trận] ✅ Đã lưu vào bản lưu tự động');
    }

    alert(`✅ Xây dựng lại ma trận hoàn tất!\n\nMa trận hội thoại：${window.matrixManager.matrix.layers.length} tầng\nMa trận History：${window.matrixManager.historyMatrix.layers.length} tầng\n\nĐã lưu vào "Tự động lưu"`);
};

console.log('[Trình quản lý ma trận] Đã tải matrix-manager.js');
