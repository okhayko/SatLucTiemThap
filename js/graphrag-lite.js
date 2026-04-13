/**
 * GraphRAG-Lite - Hệ thống truy vấn đồ thị tri thức hạng nhẹ trên trình duyệt
 * Dựa trên ý tưởng cốt lõi của Microsoft GraphRAG, tinh chỉnh phù hợp cho môi trường trình duyệt
 *
 * Chức năng:
 * 1. Lưu trữ và quản lý Thực thể/Quan hệ/Chiều hướng
 * 2. Local Search - Truy vấn hình quạt (fan-out) xuất phát từ thực thể
 * 3. Global Search - Truy vấn toàn cục dựa trên chiều hướng
 * 4. Lưu trữ bền vững (Persistence) bằng IndexedDB
 * 5. Tích hợp với mô hình bộ điều phối bộ nhớ (memory dispatcher)
 */

class GraphRAGLite {
    constructor() {
        // Lưu trữ dữ liệu
        this.entities = new Map();      // entityId -> Thực thể (Entity)
        this.relations = [];            // Quan hệ (Relation)[]
        this.dimensions = new Map();    // dimensionName -> Chiều hướng (Dimension)
        this.vectors = new Map();       // entityId -> vector

        // Cấu hình
        this.config = {
            localMaxEntities: 5,         // Số thực thể tối đa cho Local Search
            localMaxDepth: 2,            // Độ sâu mở rộng hình quạt
            globalMaxDimensions: 5,      // Số chiều hướng tối đa cho Global Search
            matchThreshold: 0.3,         // Ngưỡng khớp vector
            enabled: true,               // Trạng thái kích hoạt
            debug: true                  // Chế độ gỡ lỗi (debug)
        };

        // Trạng thái
        this.isInitialized = false;
        this.indexedDB = null;
        this.dbName = 'GraphRAGLiteDB';
        this.dbVersion = 1;

        // Thống kê
        this.stats = {
            searchCount: 0,
            lastSearchAt: null
        };
    }

    // ==================== KHỞI TẠO ====================

    /**
     * Khởi tạo GraphRAG-Lite
     */
    async init() {
        if (this.isInitialized) return;

        try {
            await this.initIndexedDB();
            await this.loadFromIndexedDB();
            this.isInitialized = true;
            this.log('✅ GraphRAG-Lite Khởi tạo hoàn tất');
            this.log(`   Thực thể: ${this.entities.size}, Quan hệ: ${this.relations.length}, Chiều hướng: ${this.dimensions.size}`);
        } catch (error) {
            console.error('[GraphRAG-Lite] Khởi tạo thất bại:', error);
            this.isInitialized = true; // Ngay cả khi lỗi cũng đánh dấu đã khởi tạo để dùng chế độ bộ nhớ tạm (memory)
        }
    }

    /**
     * Khởi tạo IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.indexedDB = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Kho lưu trữ Thực thể
                if (!db.objectStoreNames.contains('entities')) {
                    const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
                    entityStore.createIndex('name', 'name', { unique: false });
                    entityStore.createIndex('type', 'type', { unique: false });
                    entityStore.createIndex('turnIndex', 'turnIndex', { unique: false });
                }

                // Kho lưu trữ Quan hệ
                if (!db.objectStoreNames.contains('relations')) {
                    const relationStore = db.createObjectStore('relations', { keyPath: 'id' });
                    relationStore.createIndex('subject', 'subject', { unique: false });
                    relationStore.createIndex('object', 'object', { unique: false });
                }

                // Kho lưu trữ Chiều hướng
                if (!db.objectStoreNames.contains('dimensions')) {
                    db.createObjectStore('dimensions', { keyPath: 'name' });
                }

                // Kho lưu trữ Cấu hình
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Tải dữ liệu từ IndexedDB
     */
    async loadFromIndexedDB() {
        if (!this.indexedDB) return;

        // Tải thực thể
        const entities = await this.getAllFromStore('entities');
        entities.forEach(entity => {
            this.entities.set(entity.id, entity);
            if (entity.vector) {
                this.vectors.set(entity.id, entity.vector);
            }
        });

        // Tải quan hệ
        this.relations = await this.getAllFromStore('relations');

        // Tải chiều hướng
        const dimensions = await this.getAllFromStore('dimensions');
        dimensions.forEach(dim => {
            // Chuyển mảng entities ngược lại thành Set
            dim.entities = new Set(dim.entities || []);
            this.dimensions.set(dim.name, dim);
        });

        this.log(`Đã tải từ IndexedDB: ${entities.length} thực thể, ${this.relations.length} quan hệ, ${dimensions.length} chiều hướng`);
    }

    /**
     * Lấy tất cả dữ liệu từ một kho lưu trữ cụ thể
     */
    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.indexedDB) {
                resolve([]);
                return;
            }
            const transaction = this.indexedDB.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // ==================== QUẢN LÝ THỰC THỂ ====================

    /**
     * Thêm hoặc cập nhật thực thể
     * @param {Object} entityData - Dữ liệu thực thể
     * @param {number} turnIndex - Chỉ số lượt hội thoại
     * @param {Array} precomputedVector - Vector tính toán sẵn (tùy chọn)
     */
    async addOrUpdateEntity(entityData, turnIndex = null, precomputedVector = null) {
        const id = `entity_${entityData.name}_${entityData.type || 'concept'}`; 
        const existing = this.entities.get(id);

        const entity = {
            id,
            name: entityData.name,
            type: entityData.type || 'concept',
            dimensions: entityData.dimensions || [],
            attributes: { ...(existing?.attributes || {}), ...(entityData.attributes || {}) },
            description: entityData.description || existing?.description || '',
            vector: null,

            // Siêu dữ liệu (Metadata)
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            turnIndex: turnIndex ?? existing?.turnIndex ?? (window.gameState?.conversationHistory?.length || 0),
            lastMentioned: Date.now(),
            matchCount: existing?.matchCount || 0
        };

        // Tạo vector (ưu tiên vector tính toán sẵn)
        try {
            if (precomputedVector) {
                entity.vector = precomputedVector;
                console.log(`[GraphRAG-Lite] Sử dụng vector tính sẵn: ${entity.name}`);
            } else {
                console.log(`[GraphRAG-Lite] Không có vector sẵn, đang gọi API: ${entity.name}`);
                entity.vector = await this.generateVector(entity);
            }
            this.vectors.set(id, entity.vector);
        } catch (e) {
            this.log(`Tạo vector thất bại: ${entity.name}`, 'warn');
        }

        // Lưu vào bộ nhớ
        this.entities.set(id, entity);

        // Cập nhật chỉ mục chiều hướng
        for (const dimName of entity.dimensions) {
            this.addEntityToDimension(id, dimName);
        }

        // Lưu trữ bền vững
        await this.saveEntityToIndexedDB(entity);

        this.log(`${existing ? 'Cập nhật' : 'Thêm mới'} thực thể: ${entity.name} (${entity.type})`);
        return entity;
    }

    /**
     * Lấy thực thể theo tên
     */
    getEntityByName(name) {
        for (const [id, entity] of this.entities) {
            if (entity.name === name) {
                return entity;
            }
        }
        return null;
    }

    /**
     * Lấy danh sách tất cả thực thể
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }

    /**
     * Xóa thực thể
     */
    async deleteEntity(name) {
        const entity = this.getEntityByName(name);
        if (!entity) return false;

        // Loại bỏ thực thể khỏi các chiều hướng
        for (const dimName of entity.dimensions) {
            const dim = this.dimensions.get(dimName);
            if (dim) {
                dim.entities.delete(entity.id);
            }
        }

        // Xóa các quan hệ liên quan
        this.relations = this.relations.filter(rel =>
            rel.subject !== name && rel.object !== name
        );

        // Xóa thực thể và vector
        this.entities.delete(entity.id);
        this.vectors.delete(entity.id);

        // Xóa trong IndexedDB
        await this.deleteFromIndexedDB('entities', entity.id);

        this.log(`Đã xóa thực thể: ${name}`);
        return true;
    }

    /**
     * Xóa thực thể và quan hệ theo lượt hội thoại
     * Dùng để đồng bộ dữ liệu ngữ nghĩa khi xóa tầng hoặc tạo lại nội dung
     * @param {number} turnIndex - Bắt đầu xóa từ lượt này (bao gồm cả lượt này)
     */
    async deleteByTurnIndex(turnIndex) {
        if (turnIndex === null || turnIndex === undefined) {
            console.warn('[GraphRAG-Lite] deleteByTurnIndex: turnIndex trống');
            return { deletedEntities: 0, deletedRelations: 0, deletedDimensions: 0 };
        }

        let deletedEntities = 0;
        let deletedRelations = 0;
        let deletedDimensions = 0;

        // 1. Thu thập ID thực thể cần xóa
        const entityIdsToDelete = new Set();
        const entitiesToDelete = [];
        for (const [id, entity] of this.entities) {
            if (entity.turnIndex !== undefined && entity.turnIndex >= turnIndex) {
                entitiesToDelete.push({ id, name: entity.name });
                entityIdsToDelete.add(id);
            }
        }

        // 2. Xóa thực thể
        for (const { id, name } of entitiesToDelete) {
            this.entities.delete(id);
            this.vectors.delete(id);
            await this.deleteFromIndexedDB('entities', id);
            deletedEntities++;
        }

        // 3. Xóa quan hệ
        const originalRelationsCount = this.relations.length;
        this.relations = this.relations.filter(rel => {
            if (rel.turnIndex !== undefined && rel.turnIndex >= turnIndex) {
                // Xóa quan hệ trong IndexedDB bất đồng bộ
                if (rel.id) {
                    this.deleteFromIndexedDB('relations', rel.id).catch(() => { });
                }
                return false;
            }
            return true;
        });
        deletedRelations = originalRelationsCount - this.relations.length;

        // 4. Dọn dẹp chiều hướng: Loại bỏ thực thể bị xóa, nếu chiều hướng rỗng thì xóa chiều hướng đó
        const dimensionsToDelete = [];
        for (const [dimName, dimension] of this.dimensions) {
            for (const entityId of entityIdsToDelete) {
                if (dimension.entities.has(entityId)) {
                    dimension.entities.delete(entityId);
                }
            }
            if (dimension.entities.size === 0) {
                dimensionsToDelete.push(dimName);
            }
        }

        // Xóa chiều hướng rỗng
        for (const dimName of dimensionsToDelete) {
            this.dimensions.delete(dimName);
            await this.deleteFromIndexedDB('dimensions', dimName);
            deletedDimensions++;
        }

        if (deletedEntities > 0 || deletedRelations > 0 || deletedDimensions > 0) {
            this.log(`Xóa theo lượt: Từ lượt ${turnIndex}, đã xóa ${deletedEntities} thực thể, ${deletedRelations} quan hệ, ${deletedDimensions} chiều hướng rỗng`);
        }

        return { deletedEntities, deletedRelations, deletedDimensions };
    }

    // ==================== QUẢN LÝ QUAN HỆ ====================

    /**
     * Thêm quan hệ
     */
    async addRelation(relationData, turnIndex = null) {
        const id = `rel_${relationData.subject}_${relationData.predicate}_${relationData.object}`;

        // Kiểm tra tồn tại
        const existing = this.relations.find(r => r.id === id);
        if (existing) {
            // Cập nhật độ tin cậy (lấy giá trị cao hơn)
            existing.certainty = Math.max(existing.certainty, relationData.certainty || 0.8);
            return existing;
        }

        const relation = {
            id,
            subject: relationData.subject,
            predicate: relationData.predicate,
            object: relationData.object,
            certainty: relationData.certainty || 0.8,
            context: relationData.context || '',
            turnIndex: turnIndex ?? (window.gameState?.conversationHistory?.length || 0),
            createdAt: Date.now()
        };

        this.relations.push(relation);

        // Lưu trữ bền vững
        await this.saveRelationToIndexedDB(relation);

        this.log(`Thêm quan hệ: ${relation.subject} --${relation.predicate}--> ${relation.object}`);
        return relation;
    }

    /**
     * Lấy tất cả quan hệ của một thực thể
     */
    getRelationsFor(entityName) {
        return this.relations.filter(rel =>
            rel.subject === entityName || rel.object === entityName
        );
    }

    // ==================== QUẢN LÝ CHIỀU HƯỚNG ====================

    /**
     * Thêm thực thể vào chiều hướng
     */
    addEntityToDimension(entityId, dimensionName) {
        let dim = this.dimensions.get(dimensionName);

        if (!dim) {
            dim = {
                name: dimensionName,
                entities: new Set(),
                summary: '',
                vector: null,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.dimensions.set(dimensionName, dim);
        }

        dim.entities.add(entityId);
        dim.updatedAt = Date.now();

        // Cập nhật vector chiều hướng và tóm tắt bất đồng bộ
        this.updateDimensionAsync(dimensionName);
    }

    /**
     * Cập nhật chiều hướng bất đồng bộ (Vector và Tóm tắt)
     * Tối ưu: Vector chiều hướng dùng từ khóa, tránh gọi API bổ sung
     */
    async updateDimensionAsync(dimensionName) {
        const dim = this.dimensions.get(dimensionName);
        if (!dim) return;

        // Sử dụng phương pháp từ khóa để tạo vector (không gọi API)
        try {
            dim.vector = this.createSimpleKeywordVector(dimensionName);
        } catch (e) { /* Bỏ qua */ }

        // Tạo tóm tắt
        const entityNames = Array.from(dim.entities).map(id => {
            const entity = this.entities.get(id);
            return entity?.name || id;
        });
        dim.summary = `Chứa ${entityNames.length} thực thể liên quan: ${entityNames.slice(0, 5).join('、')}${entityNames.length > 5 ? '...' : ''}`;

        // Lưu trữ bền vững
        await this.saveDimensionToIndexedDB(dim);
    }

    /**
     * Lấy tất cả các chiều hướng
     */
    getAllDimensions() {
        return Array.from(this.dimensions.values());
    }

    // ==================== LOCAL SEARCH ====================

    /**
     * Local Search - Truy vấn hình quạt xuất phát từ thực thể
     * @param {string} query - Văn bản truy vấn
     * @param {number} maxEntities - Số thực thể tối đa trả về
     * @param {number} maxDepth - Độ sâu mở rộng hình quạt
     * @param {Array} precomputedVector - Vector truy vấn tính sẵn
     */
    async localSearch(query, maxEntities = null, maxDepth = null, precomputedVector = null) {
        maxEntities = maxEntities ?? this.config.localMaxEntities;
        maxDepth = maxDepth ?? this.config.localMaxDepth;

        this.log(`Local Search: "${query.substring(0, 50)}..." (max: ${maxEntities}, độ sâu: ${maxDepth})`);
        this.stats.searchCount++;
        this.stats.lastSearchAt = Date.now();

        // 1. Nhận diện thực thể đích
        const targetEntities = await this.identifyEntities(query, precomputedVector);

        if (targetEntities.length === 0) {
            this.log('Không nhận diện được thực thể liên quan');
            return { entities: [], relations: [], dimensions: [] };
        }

        this.log(`Nhận diện được ${targetEntities.length} thực thể đích: ${targetEntities.map(e => e.name).join(', ')}`);

        // 2. Mở rộng hình quạt
        const result = {
            entities: new Map(),
            relations: [],
            dimensions: new Set()
        };

        for (const entity of targetEntities) {
            await this.fanOut(entity, result, maxDepth, 0);
        }

        // 3. Mở rộng thông qua chiều hướng
        for (const dimName of result.dimensions) {
            const dim = this.dimensions.get(dimName);
            if (dim) {
                for (const entityId of dim.entities) {
                    if (result.entities.size < maxEntities * 2) { 
                        const entity = this.entities.get(entityId);
                        if (entity && !result.entities.has(entityId)) {
                            result.entities.set(entityId, { ...entity, source: 'dimension', viaD: dimName });
                        }
                    }
                }
            }
        }

        // 4. Sắp xếp và cắt bớt
        const sortedEntities = Array.from(result.entities.values())
            .sort((a, b) => {
                // Ưu tiên liên kết trực tiếp, sau đó tới liên kết chiều hướng
                if (a.source === 'direct' && b.source !== 'direct') return -1;
                if (b.source === 'direct' && a.source !== 'direct') return 1;
                return (b.matchCount || 0) - (a.matchCount || 0);
            })
            .slice(0, maxEntities);

        // 5. Cập nhật số lần khớp
        sortedEntities.forEach(e => {
            const entity = this.entities.get(e.id);
            if (entity) {
                entity.matchCount = (entity.matchCount || 0) + 1;
                entity.lastMentioned = Date.now();
            }
        });

        this.log(`Local Search trả về: ${sortedEntities.length} thực thể, ${result.relations.length} quan hệ`);

        return {
            entities: sortedEntities,
            relations: result.relations,
            dimensions: Array.from(result.dimensions)
        };
    }

    /**
     * Mở rộng hình quạt (Fan-out)
     */
    async fanOut(entity, result, maxDepth, currentDepth) {
        if (currentDepth >= maxDepth) return;

        // Thêm thực thể hiện tại
        result.entities.set(entity.id, { ...entity, source: 'direct', depth: currentDepth });

        // Thêm chiều hướng
        (entity.dimensions || []).forEach(dim => result.dimensions.add(dim));

        // Tìm kiếm các quan hệ liên quan
        const relations = this.getRelationsFor(entity.name);
        for (const rel of relations) {
            // Tránh lặp lại quan hệ
            if (!result.relations.find(r => r.id === rel.id)) {
                result.relations.push(rel);
            }

            // Mở rộng tới thực thể liên kết
            const targetName = rel.subject === entity.name ? rel.object : rel.subject;
            const targetEntity = this.getEntityByName(targetName);
            if (targetEntity && !result.entities.has(targetEntity.id)) {
                await this.fanOut(targetEntity, result, maxDepth, currentDepth + 1);
            }
        }
    }

/**
     * Nhận diện thực thể trong câu truy vấn
     * @param {string} query - Văn bản truy vấn
     * @param {Array} precomputedVector - Vector truy vấn đã tính toán trước (tùy chọn)
     */
    async identifyEntities(query, precomputedVector = null) {
        const matched = [];

        // 1. Khớp chính xác theo tên
        for (const [id, entity] of this.entities) {
            if (query.includes(entity.name)) {
                matched.push({ ...entity, matchType: 'exact' });
            }
        }

        // 2. Nếu không có khớp chính xác, sử dụng độ tương đồng vector (tái sử dụng hoặc tạo mới vector)
        if (matched.length === 0) {
            const queryVector = precomputedVector || await this.generateVector({ name: query, type: 'query' });
            if (queryVector) {
                for (const [id, entity] of this.entities) {
                    const entityVector = this.vectors.get(id);
                    if (entityVector) {
                        const similarity = this.cosineSimilarity(queryVector, entityVector);
                        if (similarity > this.config.matchThreshold) {
                            matched.push({ ...entity, matchType: 'vector', similarity });
                        }
                    }
                }
                // Sắp xếp theo độ tương đồng giảm dần
                matched.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
            }
        }

        return matched.slice(0, 5); // Trả về tối đa 5 thực thể
    }

    // ==================== Global Search ====================

    /**
     * Global Search - Truy vấn toàn cục dựa trên chiều hướng
     * @param {string} query - Văn bản truy vấn
     * @param {number} maxDimensions - Số lượng chiều hướng tối đa trả về
     * @param {Array} precomputedVector - Vector truy vấn tính trước (tránh tính toán lặp lại)
     */
    async globalSearch(query, maxDimensions = null, precomputedVector = null) {
        maxDimensions = maxDimensions ?? this.config.globalMaxDimensions;

        this.log(`Global Search: "${query.substring(0, 50)}..."`);

        // 1. Sử dụng vector tính trước hoặc tạo mới
        const queryVector = precomputedVector || await this.generateVector({ name: query, type: 'query' });

        // 2. Khớp các chiều hướng liên quan
        const matchedDimensions = [];

        for (const [name, dim] of this.dimensions) {
            // Khớp theo tên
            if (query.includes(name)) {
                matchedDimensions.push({ ...dim, similarity: 1.0, matchType: 'exact' });
                continue;
            }

            // Khớp theo vector
            if (dim.vector && queryVector) {
                const similarity = this.cosineSimilarity(queryVector, dim.vector);
                if (similarity > this.config.matchThreshold) {
                    matchedDimensions.push({ ...dim, similarity, matchType: 'vector' });
                }
            }
        }

        // 3. Sắp xếp
        matchedDimensions.sort((a, b) => b.similarity - a.similarity);
        const topDimensions = matchedDimensions.slice(0, maxDimensions);

        // 4. Định dạng kết quả trả về
        return {
            dimensions: topDimensions.map(dim => ({
                name: dim.name,
                summary: dim.summary || `Bao gồm ${dim.entities.size} thực thể`,
                entities: Array.from(dim.entities).slice(0, 5).map(id => {
                    const entity = this.entities.get(id);
                    return entity?.name || id;
                }),
                similarity: dim.similarity
            }))
        };
    }

    // ==================== Xử lý cập nhật ====================

    /**
     * Xử lý cập nhật trích xuất ngữ nghĩa
     * @param {Object} semanticUpsert - Dữ liệu ngữ nghĩa trích xuất từ Flash API
     * @param {number} turnIndex - Lượt hội thoại hiện tại
     */
    async processUpdate(semanticUpsert, turnIndex = null) {
        if (!semanticUpsert) return;

        const currentTurn = turnIndex ?? (window.gameState?.conversationHistory?.length || 0);
        let entityCount = 0;
        let relationCount = 0;

        // 1. Xử lý hàng loạt thực thể mới (một lần gọi API tạo tất cả vector)
        if (semanticUpsert.newEntities && Array.isArray(semanticUpsert.newEntities) && semanticUpsert.newEntities.length > 0) {
            const entitiesToProcess = semanticUpsert.newEntities.map(e => ({
                id: `entity_${e.name}_${e.type || 'concept'}`,
                name: e.name,
                type: e.type || 'concept',
                description: e.description
            }));

            const batchVectors = await this.generateBatchVectors(entitiesToProcess);

            // Thêm thực thể (sử dụng vector đã tính toán hàng loạt)
            for (const entityData of semanticUpsert.newEntities) {
                const entityId = `entity_${entityData.name}_${entityData.type || 'concept'}`;
                const precomputedVector = batchVectors.get(entityId);
                console.log(`[GraphRAG-Lite] Truy xuất vector tính sẵn: ${entityId} -> ${precomputedVector ? '✓ Tìm thấy' : '✗ Không thấy'}`);
                await this.addOrUpdateEntity(entityData, currentTurn, precomputedVector);
                entityCount++;
            }
        }

        // 2. Xử lý quan hệ mới
        if (semanticUpsert.newRelations && Array.isArray(semanticUpsert.newRelations)) {
            for (const relData of semanticUpsert.newRelations) {
                await this.addRelation(relData, currentTurn);
                relationCount++;
            }
        }

        // 3. Xử lý liên kết chiều hướng
        if (semanticUpsert.dimensionLinks && Array.isArray(semanticUpsert.dimensionLinks)) {
            for (const link of semanticUpsert.dimensionLinks) {
                const dim = this.dimensions.get(link.dimension);
                if (dim && link.semanticMeaning) {
                    dim.summary = link.semanticMeaning;
                    await this.saveDimensionToIndexedDB(dim);
                }
            }
        }

        this.log(`Xử lý cập nhật hoàn tất: ${entityCount} thực thể, ${relationCount} quan hệ`);
    }

    // ==================== Xây dựng ngữ cảnh ====================

    /**
     * Xây dựng ngữ cảnh GraphRAG cho bộ điều phối bộ nhớ
     * @param {string} userInput - Nhập liệu từ người dùng
     * @param {string} lastAIReply - Phản hồi cuối cùng của AI
     */
    async buildContext(userInput, lastAIReply = '') {
        if (!this.config.enabled || this.entities.size === 0) {
            return null;
        }

        // Kết hợp truy vấn
        const query = userInput + (lastAIReply ? '\n' + lastAIReply.substring(0, 500) : '');

        // 🔧 Tính trước vector truy vấn để tránh tính toán lặp lại trong local/global search
        const queryVector = await this.generateVector({ name: query, type: 'query' });

        // Thực hiện Local Search
        const localResult = await this.localSearch(query, null, null, queryVector);

        // Kiểm tra xem có cần Global Search không (dựa trên các từ khóa liệt kê)
        const needGlobal = /có những ai|có những gì|tất cả|tổng cộng|thống kê/.test(userInput);
        let globalResult = null;
        if (needGlobal) {
            globalResult = await this.globalSearch(userInput, null, queryVector);
        }

        // Định dạng ngữ cảnh
        return this.formatContext(localResult, globalResult);
    }

    /**
     * Định dạng ngữ cảnh thành văn bản
     */
    formatContext(localResult, globalResult) {
        let context = '';

        // Kết quả Local Search
        if (localResult.entities.length > 0) {
            context += '【🔍 Thực thể liên quan】\n';
            localResult.entities.forEach(entity => {
                const typeIcons = { person: '👤', place: '📍', item: '📦', event: '📅', faction: '🏛️', concept: '💡' };
                const icon = typeIcons[entity.type] || '❓';
                context += `${icon} ${entity.name}`;
                if (entity.dimensions?.length > 0) {
                    context += ` [${entity.dimensions.slice(0, 3).join(', ')}]`;
                }
                context += '\n';

                // Thêm các thuộc tính then chốt
                if (entity.attributes) {
                    const attrs = [];
                    if (entity.attributes.personality) attrs.push(`Tính cách: ${entity.attributes.personality}`);
                    if (entity.attributes.appearance) attrs.push(`Ngoại hình: ${entity.attributes.appearance}`);
                    if (entity.attributes.realm) attrs.push(`Cảnh giới: ${entity.attributes.realm}`);
                    if (attrs.length > 0) {
                        context += `   ${attrs.join(' | ')}\n`;
                    }
                }
            });
        }

        // Mạng lưới quan hệ
        if (localResult.relations.length > 0) {
            context += '\n【🔗 Mạng lưới quan hệ】\n';
            localResult.relations.slice(0, 10).forEach(rel => {
                context += `${rel.subject} --${rel.predicate}--> ${rel.object}\n`;
            });
        }

        // Liên kết chiều hướng
        if (localResult.dimensions.length > 0) {
            context += '\n【🏷️ Chiều hướng chung】\n';
            context += localResult.dimensions.slice(0, 5).join('、') + '\n';
        }

        // Kết quả Global Search
        if (globalResult && globalResult.dimensions.length > 0) {
            context += '\n【🌐 Tổng quan toàn cục】\n';
            globalResult.dimensions.forEach(dim => {
                context += `▸ ${dim.name}: ${dim.summary}\n`;
            });
        }

        return context.trim();
    }

    // ==================== Liên quan đến Vector ====================

    /**
     * Tạo vector (sử dụng phương thức vector hóa trong cài đặt trò chơi)
     */
    async generateVector(entity) {
        const text = `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim();

        if (window.contextVectorManager) {
            const method = window.contextVectorManager.embeddingMethod;

            if (method === 'transformers') {
                return await window.contextVectorManager.getEmbeddingFromTransformers(text);
            } else if (method === 'api') {
                return await window.contextVectorManager.getEmbeddingFromAPI(text);
            } else {
                return window.contextVectorManager.createKeywordVector(text);
            }
        }

        // Dự phòng: Sử dụng vector từ khóa đơn giản
        return this.createSimpleKeywordVector(text);
    }

    /**
     * Tạo vector hàng loạt (một lần gọi API cho nhiều thực thể)
     * @param {Array<Object>} entities - Mảng thực thể
     * @returns {Promise<Map>} - Bản đồ mapping entityId -> vector
     */
    async generateBatchVectors(entities) {
        if (!entities || entities.length === 0) return new Map();

        const texts = entities.map(entity =>
            `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim()
        );

        if (window.contextVectorManager?.getBatchEmbeddingsFromAPI &&
            window.contextVectorManager.embeddingMethod === 'api') {
            try {
                console.log(`[GraphRAG-Lite] Đang tạo vector hàng loạt cho ${entities.length} thực thể`);
                const vectors = await window.contextVectorManager.getBatchEmbeddingsFromAPI(texts);

                const result = new Map();
                entities.forEach((entity, i) => {
                    if (vectors[i]) {
                        const key = entity.id || entity.name;
                        result.set(key, vectors[i]);
                        console.log(`[GraphRAG-Lite] Đã lưu đệm vector hàng loạt: ${key}`);
                    }
                });
                return result;
            } catch (e) {
                console.warn('[GraphRAG-Lite] Tạo vector hàng loạt thất bại, chuyển về xử lý từng mục:', e);
            }
        }

        const result = new Map();
        for (const entity of entities) {
            const text = `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim();
            const vector = this.createSimpleKeywordVector(text);
            result.set(entity.id || entity.name, vector);
        }
        return result;
    }

    /**
     * Vector từ khóa đơn giản (Phương án dự phòng)
     */
    createSimpleKeywordVector(text) {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const vector = {};
        words.forEach(word => {
            vector[word] = (vector[word] || 0) + 1;
        });
        return vector;
    }

    /**
     * Tính độ tương đồng Cosine
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB) return 0;

        const isArrayA = Array.isArray(vecA);
        const isArrayB = Array.isArray(vecB);

        if (isArrayA && isArrayB) {
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;
            const len = Math.min(vecA.length, vecB.length);

            for (let i = 0; i < len; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
            }

            if (normA === 0 || normB === 0) return 0;
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }

        if (!isArrayA && !isArrayB) {
            const keysA = Object.keys(vecA);
            const keysB = Object.keys(vecB);
            const allKeys = new Set([...keysA, ...keysB]);

            let dotProduct = 0;
            let normA = 0;
            let normB = 0;

            for (const key of allKeys) {
                const a = vecA[key] || 0;
                const b = vecB[key] || 0;
                dotProduct += a * b;
                normA += a * a;
                normB += b * b;
            }

            if (normA === 0 || normB === 0) return 0;
            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }

        return 0;
    }

    // ==================== Lưu trữ bền vững (Persistence) ====================

    async saveEntityToIndexedDB(entity) {
        if (!this.indexedDB) return;
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['entities'], 'readwrite');
            const store = transaction.objectStore('entities');
            const request = store.put(entity);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveRelationToIndexedDB(relation) {
        if (!this.indexedDB) return;
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['relations'], 'readwrite');
            const store = transaction.objectStore('relations');
            const request = store.put(relation);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveDimensionToIndexedDB(dimension) {
        if (!this.indexedDB) return;
        const dimToSave = {
            ...dimension,
            entities: Array.from(dimension.entities || [])
        };
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction(['dimensions'], 'readwrite');
            const store = transaction.objectStore('dimensions');
            const request = store.put(dimToSave);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFromIndexedDB(storeName, key) {
        if (!this.indexedDB) return;
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ==================== Thao tác dữ liệu ====================

    /**
     * Xóa sạch toàn bộ dữ liệu
     */
    async clearAll() {
        this.entities.clear();
        this.relations = [];
        this.dimensions.clear();
        this.vectors.clear();

        if (this.indexedDB) {
            const stores = ['entities', 'relations', 'dimensions'];
            for (const storeName of stores) {
                await new Promise((resolve, reject) => {
                    const transaction = this.indexedDB.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        }

        this.log('Đã xóa sạch toàn bộ dữ liệu');
    }

    /**
     * Xuất dữ liệu
     */
    export() {
        return {
            entities: Array.from(this.entities.values()),
            relations: this.relations,
            dimensions: Array.from(this.dimensions.entries()).map(([name, dim]) => ({
                ...dim,
                entities: Array.from(dim.entities || [])
            })),
            config: this.config,
            stats: this.stats,
            exportedAt: Date.now()
        };
    }

    /**
     * Nhập dữ liệu
     */
    async import(data) {
        if (!data) return;

        await this.clearAll();

        // Nhập thực thể
        if (data.entities) {
            for (const entity of data.entities) {
                this.entities.set(entity.id, entity);
                if (entity.vector) {
                    this.vectors.set(entity.id, entity.vector);
                }
                await this.saveEntityToIndexedDB(entity);
            }
        }

        // Nhập quan hệ
        if (data.relations) {
            this.relations = data.relations;
            for (const rel of data.relations) {
                await this.saveRelationToIndexedDB(rel);
            }
        }

        // Nhập chiều hướng
        if (data.dimensions) {
            for (const dim of data.dimensions) {
                const dimension = {
                    ...dim,
                    entities: new Set(dim.entities || [])
                };
                this.dimensions.set(dim.name, dimension);
                await this.saveDimensionToIndexedDB(dimension);
            }
        }

        // Nhập cấu hình
        if (data.config) {
            this.config = { ...this.config, ...data.config };
        }

        this.log(`Nhập dữ liệu hoàn tất: ${this.entities.size} thực thể, ${this.relations.length} quan hệ, ${this.dimensions.size} chiều hướng`);
    }

    /**
     * Di trú dữ liệu từ Character Graph cũ
     */
    async migrateFromCharacterGraph() {
        const oldManager = window.characterGraphManager;
        if (!oldManager || !oldManager.characters) {
            this.log('Không tìm thấy dữ liệu Character Graph', 'warn');
            return 0;
        }

        let count = 0;
        for (const [name, char] of oldManager.characters) {
            await this.addOrUpdateEntity({
                name: char.name,
                type: 'person',
                dimensions: [],
                attributes: {
                    relation: char.relation,
                    favor: char.favor,
                    age: char.age,
                    realm: char.realm,
                    personality: char.personality,
                    appearance: char.appearance,
                    opinion: char.opinion,
                    history: char.history
                }
            });
            count++;
        }

        this.log(`Di trú từ Character Graph thành công: ${count} nhân vật`);
        return count;
    }

    /**
     * Xóa theo dải lượt hội thoại
     */
    async deleteByTurnRange(startTurn, endTurn) {
        let deletedCount = 0;

        // Xóa thực thể
        for (const [id, entity] of this.entities) {
            if (entity.turnIndex >= startTurn && entity.turnIndex <= endTurn) {
                await this.deleteEntity(entity.name);
                deletedCount++;
            }
        }

        // Xóa quan hệ
        this.relations = this.relations.filter(rel => {
            const keep = rel.turnIndex < startTurn || rel.turnIndex > endTurn;
            if (!keep) deletedCount++;
            return keep;
        });

        this.log(`Xóa theo lượt: ${startTurn}-${endTurn}, tổng cộng đã xóa ${deletedCount} mục`);
        return deletedCount;
    }

    // ==================== Phương thức tiện ích ====================

    /**
     * Lấy thông tin thống kê
     */
    getStats() {
        const typeCount = {};
        for (const entity of this.entities.values()) {
            typeCount[entity.type] = (typeCount[entity.type] || 0) + 1;
        }

        return {
            entityCount: this.entities.size,
            relationCount: this.relations.length,
            dimensionCount: this.dimensions.size,
            typeCount,
            searchCount: this.stats.searchCount,
            lastSearchAt: this.stats.lastSearchAt
        };
    }

    /**
     * Cập nhật cấu hình
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.log('Cấu hình đã được cập nhật');
    }

    /**
     * Xuất nhật ký (Log)
     */
    log(message, level = 'log') {
        if (!this.config.debug && level !== 'error') return;
        const prefix = '[GraphRAG-Lite]';
        if (level === 'warn') {
            console.warn(prefix, message);
        } else if (level === 'error') {
            console.error(prefix, message);
        } else {
            console.log(prefix, message);
        }
    }

    // ==================== Phương thức tích hợp Lưu trữ (Archive) ====================

    /**
     * Xuất toàn bộ dữ liệu (Dùng cho lưu trữ game)
     */
    exportData() {
        return {
            entities: Array.from(this.entities.entries()),
            relations: [...this.relations],
            dimensions: Array.from(this.dimensions.entries()).map(([name, dim]) => ({
                name,
                entities: Array.from(dim.entities),
                summary: dim.summary,
                createdAt: dim.createdAt,
                updatedAt: dim.updatedAt
            })),
            vectors: Array.from(this.vectors.entries()),
            stats: { ...this.stats }
        };
    }

    /**
     * Nhập dữ liệu (Khôi phục từ bản lưu trữ)
     */
    async importData(data) {
        if (!data) return;

        try {
            await this.clearAll();

            if (data.entities) {
                for (const [id, entity] of data.entities) {
                    this.entities.set(id, entity);
                    await this.saveEntityToIndexedDB(entity);
                }
            }

            if (data.relations) {
                this.relations = [...data.relations];
                for (const rel of this.relations) {
                    await this.saveRelationToIndexedDB(rel);
                }
            }

            if (data.dimensions) {
                for (const dim of data.dimensions) {
                    this.dimensions.set(dim.name, {
                        name: dim.name,
                        entities: new Set(dim.entities),
                        summary: dim.summary,
                        createdAt: dim.createdAt,
                        updatedAt: dim.updatedAt,
                        vector: null
                    });
                    await this.saveDimensionToIndexedDB(this.dimensions.get(dim.name));
                }
            }

            if (data.vectors) {
                for (const [id, vec] of data.vectors) {
                    this.vectors.set(id, vec);
                }
            }

            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }

            console.log(`[GraphRAG-Lite] Dữ liệu đã được nhập: ${this.entities.size} thực thể, ${this.relations.length} quan hệ`);
        } catch (e) {
            console.error('[GraphRAG-Lite] Nhập dữ liệu thất bại:', e);
        }
    }

    /**
     * Xóa sạch dữ liệu (Dùng khi bắt đầu game mới)
     */
    async clearAll() {
        this.entities.clear();
        this.relations = [];
        this.dimensions.clear();
        this.vectors.clear();
        this.stats = { searchCount: 0, lastSearchAt: null };

        if (this.db) {
            try {
                const transaction = this.db.transaction(['entities', 'relations', 'dimensions'], 'readwrite');
                await Promise.all([
                    new Promise((resolve, reject) => {
                        const req = transaction.objectStore('entities').clear();
                        req.onsuccess = resolve;
                        req.onerror = () => reject(req.error);
                    }),
                    new Promise((resolve, reject) => {
                        const req = transaction.objectStore('relations').clear();
                        req.onsuccess = resolve;
                        req.onerror = () => reject(req.error);
                    }),
                    new Promise((resolve, reject) => {
                        const req = transaction.objectStore('dimensions').clear();
                        req.onsuccess = resolve;
                        req.onerror = () => reject(req.error);
                    })
                ]);
                console.log('[GraphRAG-Lite] Dữ liệu trong IndexedDB đã được xóa sạch');
            } catch (e) {
                console.warn('[GraphRAG-Lite] Xóa dữ liệu IndexedDB thất bại:', e);
            }
        }

        console.log('[GraphRAG-Lite] Toàn bộ dữ liệu đã được dọn sạch');
    }

    async saveDimensionToIndexedDB(dimension) {
        if (!this.db) return;
        try {
            const transaction = this.db.transaction(['dimensions'], 'readwrite');
            const store = transaction.objectStore('dimensions');
            const data = {
                name: dimension.name,
                entities: Array.from(dimension.entities),
                summary: dimension.summary,
                createdAt: dimension.createdAt,
                updatedAt: dimension.updatedAt
            };
            store.put(data);
        } catch (e) {
            console.warn('[GraphRAG-Lite] Lưu chiều hướng thất bại:', e);
        }
    }
}

// Khởi tạo thực thể toàn cục
if (typeof window !== 'undefined') {
    window.graphRAGLite = new GraphRAGLite();
    console.log('[GraphRAG-Lite] Thực thể toàn cục đã được tạo: window.graphRAGLite');

    // Tự động khởi tạo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.graphRAGLite.init();
        });
    } else {
        setTimeout(() => window.graphRAGLite.init(), 100);
    }
}
