/**
 * GraphRAG-Lite - 浏览器端轻量级知识图谱检索系统
 * 基于微软GraphRAG核心思想，适配浏览器环境
 * 
 * 功能：
 * 1. 实体/关系/维度的存储和管理
 * 2. Local Search - 从实体出发的扇形检索
 * 3. Global Search - 基于维度的全局查询
 * 4. IndexedDB持久化
 * 5. 与记忆调度器模式集成
 */

class GraphRAGLite {
    constructor() {
        // 数据存储
        this.entities = new Map();      // entityId -> Entity
        this.relations = [];            // Relation[]
        this.dimensions = new Map();    // dimensionName -> Dimension
        this.vectors = new Map();       // entityId -> vector

        // 配置
        this.config = {
            localMaxEntities: 5,        // Local Search最大实体数
            localMaxDepth: 2,           // 扇形扩展深度
            globalMaxDimensions: 5,     // Global Search最大维度数
            matchThreshold: 0.3,        // 向量匹配阈值
            enabled: true,              // 是否启用
            debug: true                 // 调试模式
        };

        // 状态
        this.isInitialized = false;
        this.indexedDB = null;
        this.dbName = 'GraphRAGLiteDB';
        this.dbVersion = 1;

        // 统计
        this.stats = {
            searchCount: 0,
            lastSearchAt: null
        };
    }

    // ==================== 初始化 ====================

    /**
     * 初始化GraphRAG-Lite
     */
    async init() {
        if (this.isInitialized) return;

        try {
            await this.initIndexedDB();
            await this.loadFromIndexedDB();
            this.isInitialized = true;
            this.log('✅ GraphRAG-Lite 初始化完成');
            this.log(`   实体: ${this.entities.size}, 关系: ${this.relations.length}, 维度: ${this.dimensions.size}`);
        } catch (error) {
            console.error('[GraphRAG-Lite] 初始化失败:', error);
            this.isInitialized = true; // 即使失败也标记为已初始化，使用内存模式
        }
    }

    /**
     * 初始化IndexedDB
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

                // 实体存储
                if (!db.objectStoreNames.contains('entities')) {
                    const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
                    entityStore.createIndex('name', 'name', { unique: false });
                    entityStore.createIndex('type', 'type', { unique: false });
                    entityStore.createIndex('turnIndex', 'turnIndex', { unique: false });
                }

                // 关系存储
                if (!db.objectStoreNames.contains('relations')) {
                    const relationStore = db.createObjectStore('relations', { keyPath: 'id' });
                    relationStore.createIndex('subject', 'subject', { unique: false });
                    relationStore.createIndex('object', 'object', { unique: false });
                }

                // 维度存储
                if (!db.objectStoreNames.contains('dimensions')) {
                    db.createObjectStore('dimensions', { keyPath: 'name' });
                }

                // 配置存储
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * 从IndexedDB加载数据
     */
    async loadFromIndexedDB() {
        if (!this.indexedDB) return;

        // 加载实体
        const entities = await this.getAllFromStore('entities');
        entities.forEach(entity => {
            this.entities.set(entity.id, entity);
            if (entity.vector) {
                this.vectors.set(entity.id, entity.vector);
            }
        });

        // 加载关系
        this.relations = await this.getAllFromStore('relations');

        // 加载维度
        const dimensions = await this.getAllFromStore('dimensions');
        dimensions.forEach(dim => {
            // 将entities数组转回Set
            dim.entities = new Set(dim.entities || []);
            this.dimensions.set(dim.name, dim);
        });

        this.log(`从IndexedDB加载: ${entities.length}实体, ${this.relations.length}关系, ${dimensions.length}维度`);
    }

    /**
     * 从存储获取所有数据
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

    // ==================== 实体管理 ====================

    /**
     * 添加或更新实体
     * @param {Object} entityData - 实体数据
     * @param {number} turnIndex - 轮次索引
     * @param {Array} precomputedVector - 预生成的向量（可选，用于批量处理时避免重复API调用）
     */
    async addOrUpdateEntity(entityData, turnIndex = null, precomputedVector = null) {
        const id = `entity_${entityData.name}_${entityData.type || 'concept'}`;  // 与processUpdate保持一致
        const existing = this.entities.get(id);

        const entity = {
            id,
            name: entityData.name,
            type: entityData.type || 'concept',
            dimensions: entityData.dimensions || [],
            attributes: { ...(existing?.attributes || {}), ...(entityData.attributes || {}) },
            description: entityData.description || existing?.description || '',
            vector: null,

            // 元数据
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            turnIndex: turnIndex ?? existing?.turnIndex ?? (window.gameState?.conversationHistory?.length || 0),
            lastMentioned: Date.now(),
            matchCount: existing?.matchCount || 0
        };

        // 生成向量（优先使用预生成的向量）
        try {
            if (precomputedVector) {
                entity.vector = precomputedVector;
                console.log(`[GraphRAG-Lite] 使用预生成向量: ${entity.name}`);
            } else {
                console.log(`[GraphRAG-Lite] 无预生成向量，调用API: ${entity.name}`);
                entity.vector = await this.generateVector(entity);
            }
            this.vectors.set(id, entity.vector);
        } catch (e) {
            this.log(`生成向量失败: ${entity.name}`, 'warn');
        }

        // 保存
        this.entities.set(id, entity);

        // 更新维度索引
        for (const dimName of entity.dimensions) {
            this.addEntityToDimension(id, dimName);
        }

        // 持久化
        await this.saveEntityToIndexedDB(entity);

        this.log(`${existing ? '更新' : '新增'}实体: ${entity.name} (${entity.type})`);
        return entity;
    }

    /**
     * 根据名称获取实体
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
     * 获取所有实体
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }

    /**
     * 删除实体
     */
    async deleteEntity(name) {
        const entity = this.getEntityByName(name);
        if (!entity) return false;

        // 从维度中移除
        for (const dimName of entity.dimensions) {
            const dim = this.dimensions.get(dimName);
            if (dim) {
                dim.entities.delete(entity.id);
            }
        }

        // 删除相关关系
        this.relations = this.relations.filter(rel =>
            rel.subject !== name && rel.object !== name
        );

        // 删除实体
        this.entities.delete(entity.id);
        this.vectors.delete(entity.id);

        // 持久化删除
        await this.deleteFromIndexedDB('entities', entity.id);

        this.log(`删除实体: ${name}`);
        return true;
    }

    /**
     * 删除指定轮次及之后的所有实体和关系
     * 用于删除楼层或重新生成时同步清除语义数据
     * @param {number} turnIndex - 从该轮次开始删除（包含该轮次）
     */
    async deleteByTurnIndex(turnIndex) {
        if (turnIndex === null || turnIndex === undefined) {
            console.warn('[GraphRAG-Lite] deleteByTurnIndex: turnIndex为空');
            return { deletedEntities: 0, deletedRelations: 0, deletedDimensions: 0 };
        }

        let deletedEntities = 0;
        let deletedRelations = 0;
        let deletedDimensions = 0;

        // 1. 收集需要删除的实体ID
        const entityIdsToDelete = new Set();
        const entitiesToDelete = [];
        for (const [id, entity] of this.entities) {
            if (entity.turnIndex !== undefined && entity.turnIndex >= turnIndex) {
                entitiesToDelete.push({ id, name: entity.name });
                entityIdsToDelete.add(id);
            }
        }

        // 2. 删除实体
        for (const { id, name } of entitiesToDelete) {
            this.entities.delete(id);
            this.vectors.delete(id);
            await this.deleteFromIndexedDB('entities', id);
            deletedEntities++;
        }

        // 3. 删除关系
        const originalRelationsCount = this.relations.length;
        this.relations = this.relations.filter(rel => {
            if (rel.turnIndex !== undefined && rel.turnIndex >= turnIndex) {
                // 异步删除IndexedDB中的关系（静默处理）
                if (rel.id) {
                    this.deleteFromIndexedDB('relations', rel.id).catch(() => { });
                }
                return false;
            }
            return true;
        });
        deletedRelations = originalRelationsCount - this.relations.length;

        // 4. 清理维度：从维度中移除被删除的实体，如果维度变空则删除该维度
        const dimensionsToDelete = [];
        for (const [dimName, dimension] of this.dimensions) {
            // 从维度的实体集合中移除被删除的实体ID
            for (const entityId of entityIdsToDelete) {
                if (dimension.entities.has(entityId)) {
                    dimension.entities.delete(entityId);
                }
            }
            // 如果维度变空，标记为待删除
            if (dimension.entities.size === 0) {
                dimensionsToDelete.push(dimName);
            }
        }

        // 删除空维度
        for (const dimName of dimensionsToDelete) {
            this.dimensions.delete(dimName);
            await this.deleteFromIndexedDB('dimensions', dimName);
            deletedDimensions++;
        }

        if (deletedEntities > 0 || deletedRelations > 0 || deletedDimensions > 0) {
            this.log(`按轮次删除: 从第${turnIndex}轮开始，删除了 ${deletedEntities} 个实体, ${deletedRelations} 条关系, ${deletedDimensions} 个空维度`);
        }

        return { deletedEntities, deletedRelations, deletedDimensions };
    }

    // ==================== 关系管理 ====================

    /**
     * 添加关系
     */
    async addRelation(relationData, turnIndex = null) {
        const id = `rel_${relationData.subject}_${relationData.predicate}_${relationData.object}`;

        // 检查是否已存在
        const existing = this.relations.find(r => r.id === id);
        if (existing) {
            // 更新可信度（取较高值）
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

        // 持久化
        await this.saveRelationToIndexedDB(relation);

        this.log(`新增关系: ${relation.subject} --${relation.predicate}--> ${relation.object}`);
        return relation;
    }

    /**
     * 获取实体的所有关系
     */
    getRelationsFor(entityName) {
        return this.relations.filter(rel =>
            rel.subject === entityName || rel.object === entityName
        );
    }

    // ==================== 维度管理 ====================

    /**
     * 添加实体到维度
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

        // 异步生成维度向量和更新摘要
        this.updateDimensionAsync(dimensionName);
    }

    /**
     * 异步更新维度（向量和摘要）
     * 🔧 优化：维度向量使用关键词方法，避免额外API调用
     */
    async updateDimensionAsync(dimensionName) {
        const dim = this.dimensions.get(dimensionName);
        if (!dim) return;

        // 🔧 使用关键词方法生成维度向量（不调用API）
        try {
            dim.vector = this.createSimpleKeywordVector(dimensionName);
        } catch (e) {
            // 忽略
        }

        // 生成摘要
        const entityNames = Array.from(dim.entities).map(id => {
            const entity = this.entities.get(id);
            return entity?.name || id;
        });
        dim.summary = `包含${entityNames.length}个相关实体: ${entityNames.slice(0, 5).join('、')}${entityNames.length > 5 ? '等' : ''}`;

        // 持久化
        await this.saveDimensionToIndexedDB(dim);
    }

    /**
     * 获取所有维度
     */
    getAllDimensions() {
        return Array.from(this.dimensions.values());
    }

    // ==================== Local Search ====================

    /**
     * Local Search - 从实体出发的扇形检索
     * @param {string} query - 查询文本
     * @param {number} maxEntities - 最大返回实体数
     * @param {number} maxDepth - 扇形扩展深度
     * @param {Array} precomputedVector - 预生成的查询向量（可选，用于避免重复计算）
     */
    async localSearch(query, maxEntities = null, maxDepth = null, precomputedVector = null) {
        maxEntities = maxEntities ?? this.config.localMaxEntities;
        maxDepth = maxDepth ?? this.config.localMaxDepth;

        this.log(`Local Search: "${query.substring(0, 50)}..." (max: ${maxEntities}, depth: ${maxDepth})`);
        this.stats.searchCount++;
        this.stats.lastSearchAt = Date.now();

        // 1. 识别目标实体（传入预生成向量）
        const targetEntities = await this.identifyEntities(query, precomputedVector);

        if (targetEntities.length === 0) {
            this.log('未识别到相关实体');
            return { entities: [], relations: [], dimensions: [] };
        }

        this.log(`识别到${targetEntities.length}个目标实体: ${targetEntities.map(e => e.name).join(', ')}`);

        // 2. 扇形扩展
        const result = {
            entities: new Map(),
            relations: [],
            dimensions: new Set()
        };

        for (const entity of targetEntities) {
            await this.fanOut(entity, result, maxDepth, 0);
        }

        // 3. 通过维度扩展
        for (const dimName of result.dimensions) {
            const dim = this.dimensions.get(dimName);
            if (dim) {
                for (const entityId of dim.entities) {
                    if (result.entities.size < maxEntities * 2) { // 多取一些，后面排序截取
                        const entity = this.entities.get(entityId);
                        if (entity && !result.entities.has(entityId)) {
                            result.entities.set(entityId, { ...entity, source: 'dimension', viaD: dimName });
                        }
                    }
                }
            }
        }

        // 4. 排序并截取
        const sortedEntities = Array.from(result.entities.values())
            .sort((a, b) => {
                // 优先直接关联，其次维度关联
                if (a.source === 'direct' && b.source !== 'direct') return -1;
                if (b.source === 'direct' && a.source !== 'direct') return 1;
                return (b.matchCount || 0) - (a.matchCount || 0);
            })
            .slice(0, maxEntities);

        // 5. 更新匹配计数
        sortedEntities.forEach(e => {
            const entity = this.entities.get(e.id);
            if (entity) {
                entity.matchCount = (entity.matchCount || 0) + 1;
                entity.lastMentioned = Date.now();
            }
        });

        this.log(`Local Search返回: ${sortedEntities.length}实体, ${result.relations.length}关系`);

        return {
            entities: sortedEntities,
            relations: result.relations,
            dimensions: Array.from(result.dimensions)
        };
    }

    /**
     * 扇形扩展
     */
    async fanOut(entity, result, maxDepth, currentDepth) {
        if (currentDepth >= maxDepth) return;

        // 添加当前实体
        result.entities.set(entity.id, { ...entity, source: 'direct', depth: currentDepth });

        // 添加维度
        (entity.dimensions || []).forEach(dim => result.dimensions.add(dim));

        // 查找相关关系
        const relations = this.getRelationsFor(entity.name);
        for (const rel of relations) {
            // 避免重复添加关系
            if (!result.relations.find(r => r.id === rel.id)) {
                result.relations.push(rel);
            }

            // 扇形扩展到关联实体
            const targetName = rel.subject === entity.name ? rel.object : rel.subject;
            const targetEntity = this.getEntityByName(targetName);
            if (targetEntity && !result.entities.has(targetEntity.id)) {
                await this.fanOut(targetEntity, result, maxDepth, currentDepth + 1);
            }
        }
    }

    /**
     * 识别查询中的实体
     * @param {string} query - 查询文本
     * @param {Array} precomputedVector - 预生成的查询向量（可选）
     */
    async identifyEntities(query, precomputedVector = null) {
        const matched = [];

        // 1. 名称精确匹配
        for (const [id, entity] of this.entities) {
            if (query.includes(entity.name)) {
                matched.push({ ...entity, matchType: 'exact' });
            }
        }

        // 2. 如果没有精确匹配，使用向量相似度（复用预生成向量或重新生成）
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
                // 按相似度排序
                matched.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
            }
        }

        return matched.slice(0, 5); // 最多返回5个
    }

    // ==================== Global Search ====================

    /**
     * Global Search - 基于维度的全局查询
     * @param {string} query - 查询文本
     * @param {number} maxDimensions - 最大返回维度数
     * @param {Array} precomputedVector - 预生成的查询向量（可选，用于避免重复计算）
     */
    async globalSearch(query, maxDimensions = null, precomputedVector = null) {
        maxDimensions = maxDimensions ?? this.config.globalMaxDimensions;

        this.log(`Global Search: "${query.substring(0, 50)}..."`);

        // 1. 使用预生成向量或重新生成
        const queryVector = precomputedVector || await this.generateVector({ name: query, type: 'query' });

        // 2. 匹配相关维度
        const matchedDimensions = [];

        for (const [name, dim] of this.dimensions) {
            // 名称匹配
            if (query.includes(name)) {
                matchedDimensions.push({ ...dim, similarity: 1.0, matchType: 'exact' });
                continue;
            }

            // 向量匹配
            if (dim.vector && queryVector) {
                const similarity = this.cosineSimilarity(queryVector, dim.vector);
                if (similarity > this.config.matchThreshold) {
                    matchedDimensions.push({ ...dim, similarity, matchType: 'vector' });
                }
            }
        }

        // 3. 排序
        matchedDimensions.sort((a, b) => b.similarity - a.similarity);
        const topDimensions = matchedDimensions.slice(0, maxDimensions);

        // 4. 格式化返回
        return {
            dimensions: topDimensions.map(dim => ({
                name: dim.name,
                summary: dim.summary || `包含${dim.entities.size}个实体`,
                entities: Array.from(dim.entities).slice(0, 5).map(id => {
                    const entity = this.entities.get(id);
                    return entity?.name || id;
                }),
                similarity: dim.similarity
            }))
        };
    }

    // ==================== 处理更新 ====================

    /**
     * 处理语义提取的更新
     * @param {Object} semanticUpsert - 从Flash API提取的语义数据
     * @param {number} turnIndex - 当前轮次
     */
    async processUpdate(semanticUpsert, turnIndex = null) {
        if (!semanticUpsert) return;

        const currentTurn = turnIndex ?? (window.gameState?.conversationHistory?.length || 0);
        let entityCount = 0;
        let relationCount = 0;

        // 1. 批量处理新实体（一次API调用生成所有向量）
        if (semanticUpsert.newEntities && Array.isArray(semanticUpsert.newEntities) && semanticUpsert.newEntities.length > 0) {
            // 先批量生成向量，使用与addOrUpdateEntity相同的ID格式
            const entitiesToProcess = semanticUpsert.newEntities.map(e => ({
                id: `entity_${e.name}_${e.type || 'concept'}`,  // 与addOrUpdateEntity保持一致
                name: e.name,
                type: e.type || 'concept',
                description: e.description
            }));

            const batchVectors = await this.generateBatchVectors(entitiesToProcess);

            // 然后添加实体（使用预生成的向量）
            for (const entityData of semanticUpsert.newEntities) {
                const entityId = `entity_${entityData.name}_${entityData.type || 'concept'}`;
                const precomputedVector = batchVectors.get(entityId);
                console.log(`[GraphRAG-Lite] 尝试获取预生成向量: ${entityId} -> ${precomputedVector ? '✓找到' : '✗未找到'}`);
                await this.addOrUpdateEntity(entityData, currentTurn, precomputedVector);
                entityCount++;
            }
        }

        // 2. 处理新关系
        if (semanticUpsert.newRelations && Array.isArray(semanticUpsert.newRelations)) {
            for (const relData of semanticUpsert.newRelations) {
                await this.addRelation(relData, currentTurn);
                relationCount++;
            }
        }

        // 3. 处理维度链接
        if (semanticUpsert.dimensionLinks && Array.isArray(semanticUpsert.dimensionLinks)) {
            for (const link of semanticUpsert.dimensionLinks) {
                const dim = this.dimensions.get(link.dimension);
                if (dim && link.semanticMeaning) {
                    dim.summary = link.semanticMeaning;
                    await this.saveDimensionToIndexedDB(dim);
                }
            }
        }

        this.log(`处理更新完成: ${entityCount}实体, ${relationCount}关系`);
    }

    // ==================== 构建上下文 ====================

    /**
     * 构建用于记忆调度器的GraphRAG上下文
     * @param {string} userInput - 用户输入
     * @param {string} lastAIReply - 上一条AI回复
     */
    async buildContext(userInput, lastAIReply = '') {
        if (!this.config.enabled || this.entities.size === 0) {
            return null;
        }

        // 组合查询
        const query = userInput + (lastAIReply ? '\n' + lastAIReply.substring(0, 500) : '');

        // 🔧 预先生成查询向量，避免localSearch和globalSearch重复计算
        const queryVector = await this.generateVector({ name: query, type: 'query' });

        // 执行Local Search（传入已生成的向量）
        const localResult = await this.localSearch(query, null, null, queryVector);

        // 判断是否需要Global Search（包含"有哪些"、"所有"等词）
        const needGlobal = /有哪些|所有|全部|总共|统计/.test(userInput);
        let globalResult = null;
        if (needGlobal) {
            globalResult = await this.globalSearch(userInput, null, queryVector);
        }

        // 格式化上下文
        return this.formatContext(localResult, globalResult);
    }

    /**
     * 格式化上下文为文本
     */
    formatContext(localResult, globalResult) {
        let context = '';

        // Local Search结果
        if (localResult.entities.length > 0) {
            context += '【🔍 相关实体】\n';
            localResult.entities.forEach(entity => {
                const typeIcons = { person: '👤', place: '📍', item: '📦', event: '📅', faction: '🏛️', concept: '💡' };
                const icon = typeIcons[entity.type] || '❓';
                context += `${icon} ${entity.name}`;
                if (entity.dimensions?.length > 0) {
                    context += ` [${entity.dimensions.slice(0, 3).join(', ')}]`;
                }
                context += '\n';

                // 添加关键属性
                if (entity.attributes) {
                    const attrs = [];
                    if (entity.attributes.personality) attrs.push(`性格:${entity.attributes.personality}`);
                    if (entity.attributes.appearance) attrs.push(`外貌:${entity.attributes.appearance}`);
                    if (entity.attributes.realm) attrs.push(`境界:${entity.attributes.realm}`);
                    if (attrs.length > 0) {
                        context += `   ${attrs.join(' | ')}\n`;
                    }
                }
            });
        }

        // 关系网络
        if (localResult.relations.length > 0) {
            context += '\n【🔗 关系网络】\n';
            localResult.relations.slice(0, 10).forEach(rel => {
                context += `${rel.subject} --${rel.predicate}--> ${rel.object}\n`;
            });
        }

        // 维度关联
        if (localResult.dimensions.length > 0) {
            context += '\n【🏷️ 共享维度】\n';
            context += localResult.dimensions.slice(0, 5).join('、') + '\n';
        }

        // Global Search结果
        if (globalResult && globalResult.dimensions.length > 0) {
            context += '\n【🌐 全局概览】\n';
            globalResult.dimensions.forEach(dim => {
                context += `▸ ${dim.name}: ${dim.summary}\n`;
            });
        }

        return context.trim();
    }

    // ==================== 向量相关 ====================

    /**
     * 生成向量（复用游戏设置中的向量化方法）
     */
    async generateVector(entity) {
        const text = `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim();

        // 使用contextVectorManager的向量化方法
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

        // 降级：使用关键词向量
        return this.createSimpleKeywordVector(text);
    }

    /**
     * 批量生成向量（一次API调用处理多个实体）
     * @param {Array<Object>} entities - 实体数组
     * @returns {Promise<Map>} - entityId -> vector 的映射
     */
    async generateBatchVectors(entities) {
        if (!entities || entities.length === 0) return new Map();

        // 构建文本数组
        const texts = entities.map(entity =>
            `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim()
        );

        // 使用批量API
        if (window.contextVectorManager?.getBatchEmbeddingsFromAPI &&
            window.contextVectorManager.embeddingMethod === 'api') {
            try {
                console.log(`[GraphRAG-Lite] 批量生成向量: ${entities.length} 个实体`);
                const vectors = await window.contextVectorManager.getBatchEmbeddingsFromAPI(texts);

                const result = new Map();
                entities.forEach((entity, i) => {
                    if (vectors[i]) {
                        const key = entity.id || entity.name;
                        result.set(key, vectors[i]);
                        console.log(`[GraphRAG-Lite] 批量向量已缓存: ${key}`);
                    }
                });
                console.log(`[GraphRAG-Lite] 批量向量Map大小: ${result.size}`);
                return result;
            } catch (e) {
                console.warn('[GraphRAG-Lite] 批量向量生成失败，回退到单个处理:', e);
            }
        }

        // 回退：使用关键词方法批量生成
        const result = new Map();
        for (const entity of entities) {
            const text = `${entity.name} ${entity.type || ''} ${entity.description || ''}`.trim();
            const vector = this.createSimpleKeywordVector(text);
            result.set(entity.id || entity.name, vector);
        }
        return result;
    }

    /**
     * 简单关键词向量（降级方案）
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
     * 计算余弦相似度
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB) return 0;

        const isArrayA = Array.isArray(vecA);
        const isArrayB = Array.isArray(vecB);

        // 数组向量
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

        // 对象向量（关键词）
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

    // ==================== 持久化 ====================

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
        // 将Set转为数组存储
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

    // ==================== 数据操作 ====================

    /**
     * 清空所有数据
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

        this.log('已清空所有数据');
    }

    /**
     * 导出数据
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
     * 导入数据
     */
    async import(data) {
        if (!data) return;

        // 清空现有数据
        await this.clearAll();

        // 导入实体
        if (data.entities) {
            for (const entity of data.entities) {
                this.entities.set(entity.id, entity);
                if (entity.vector) {
                    this.vectors.set(entity.id, entity.vector);
                }
                await this.saveEntityToIndexedDB(entity);
            }
        }

        // 导入关系
        if (data.relations) {
            this.relations = data.relations;
            for (const rel of data.relations) {
                await this.saveRelationToIndexedDB(rel);
            }
        }

        // 导入维度
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

        // 导入配置
        if (data.config) {
            this.config = { ...this.config, ...data.config };
        }

        this.log(`导入完成: ${this.entities.size}实体, ${this.relations.length}关系, ${this.dimensions.size}维度`);
    }

    /**
     * 从人物图谱迁移
     */
    async migrateFromCharacterGraph() {
        const oldManager = window.characterGraphManager;
        if (!oldManager || !oldManager.characters) {
            this.log('未找到人物图谱数据', 'warn');
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

        this.log(`从人物图谱迁移: ${count}人`);
        return count;
    }

    /**
     * 根据轮次范围删除
     */
    async deleteByTurnRange(startTurn, endTurn) {
        let deletedCount = 0;

        // 删除实体
        for (const [id, entity] of this.entities) {
            if (entity.turnIndex >= startTurn && entity.turnIndex <= endTurn) {
                await this.deleteEntity(entity.name);
                deletedCount++;
            }
        }

        // 删除关系
        this.relations = this.relations.filter(rel => {
            const keep = rel.turnIndex < startTurn || rel.turnIndex > endTurn;
            if (!keep) deletedCount++;
            return keep;
        });

        this.log(`按轮次删除: ${startTurn}-${endTurn}, 共删除${deletedCount}条`);
        return deletedCount;
    }

    // ==================== 工具方法 ====================

    /**
     * 获取统计信息
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
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.log('配置已更新');
    }

    /**
     * 日志输出
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

    // ==================== 存档集成方法 ====================

    /**
     * 导出所有数据（用于存档）
     * @returns {Object} 可序列化的数据对象
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
                // 不导出vector，导入时会重新生成
            })),
            vectors: Array.from(this.vectors.entries()),
            stats: { ...this.stats }
        };
    }

    /**
     * 导入数据（从存档恢复）
     * @param {Object} data - 导出的数据对象
     */
    async importData(data) {
        if (!data) return;

        try {
            // 先清除现有数据
            await this.clearAll();

            // 导入实体
            if (data.entities) {
                for (const [id, entity] of data.entities) {
                    this.entities.set(id, entity);
                    await this.saveEntityToIndexedDB(entity);
                }
            }

            // 导入关系
            if (data.relations) {
                this.relations = [...data.relations];
                for (const rel of this.relations) {
                    await this.saveRelationToIndexedDB(rel);
                }
            }

            // 导入维度
            if (data.dimensions) {
                for (const dim of data.dimensions) {
                    this.dimensions.set(dim.name, {
                        name: dim.name,
                        entities: new Set(dim.entities),
                        summary: dim.summary,
                        createdAt: dim.createdAt,
                        updatedAt: dim.updatedAt,
                        vector: null  // 稍后重新生成
                    });
                    await this.saveDimensionToIndexedDB(this.dimensions.get(dim.name));
                }
            }

            // 导入向量
            if (data.vectors) {
                for (const [id, vec] of data.vectors) {
                    this.vectors.set(id, vec);
                }
            }

            // 导入统计
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }

            console.log(`[GraphRAG-Lite] 数据已导入: ${this.entities.size}实体, ${this.relations.length}关系, ${this.dimensions.size}维度`);
        } catch (e) {
            console.error('[GraphRAG-Lite] 导入数据失败:', e);
        }
    }

    /**
     * 清除所有数据（用于新游戏）
     */
    async clearAll() {
        // 清除内存数据
        this.entities.clear();
        this.relations = [];
        this.dimensions.clear();
        this.vectors.clear();
        this.stats = { searchCount: 0, lastSearchAt: null };

        // 清除IndexedDB
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
                console.log('[GraphRAG-Lite] IndexedDB数据已清除');
            } catch (e) {
                console.warn('[GraphRAG-Lite] 清除IndexedDB失败:', e);
            }
        }

        console.log('[GraphRAG-Lite] 所有数据已清除');
    }

    /**
     * 保存维度到IndexedDB
     */
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
            console.warn('[GraphRAG-Lite] 保存维度失败:', e);
        }
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.graphRAGLite = new GraphRAGLite();
    console.log('[GraphRAG-Lite] 全局实例已创建: window.graphRAGLite');

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.graphRAGLite.init();
        });
    } else {
        setTimeout(() => window.graphRAGLite.init(), 100);
    }
}
