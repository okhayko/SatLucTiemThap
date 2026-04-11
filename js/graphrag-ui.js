/**
 * GraphRAG-Lite UI管理
 * 提供配置面板和图谱管理界面
 */

class GraphRAGUI {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 初始化UI
     */
    async init() {
        if (this.isInitialized) return;

        // 等待DOM加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        this.isInitialized = true;
        console.log('[GraphRAG-UI] 初始化完成');
    }

    /**
     * 创建配置面板HTML
     */
    createConfigPanelHTML() {
        return `
            <div class="config-section" id="graphRAGSection" style="display: none;">
                <div class="config-section-header" onclick="toggleSection('graphRAGSection')">
                    <span>🧠 GraphRAG-Lite 语义网络</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="config-section-content">
                    <!-- 说明区域 -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 14px; color: white; margin-bottom: 8px;">
                            <strong>🌐 GraphRAG-Lite（需开启记忆调度器模式）</strong>
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.6;">
                            基于微软GraphRAG思想的轻量级实现，自动提取<strong>人物、地点、物品、事件</strong>等实体，
                            通过<strong>维度关联</strong>发现隐含联系（如提到沙县→想起一起吃饭的朋友）
                        </div>
                    </div>

                    <!-- 开关 -->
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="enableGraphRAG" onchange="graphRAGUI.toggle()" checked>
                            <span>启用GraphRAG-Lite语义网络</span>
                        </label>
                        <small style="color: #999; display: block; margin-top: 5px;">
                            启用后将与记忆调度器并发提取语义信息，取代History矩阵
                        </small>
                    </div>

                    <div id="graphRAGFields" style="display: block;">
                        <!-- Local Search设置 -->
                        <div class="form-group">
                            <label>
                                <span>Local Search 最大实体数</span>
                                <input type="number" id="graphLocalMaxEntities" min="1" max="20" value="5" style="width: 80px;">
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                每次搜索最多返回多少个相关实体
                            </small>
                        </div>

                        <div class="form-group">
                            <label>
                                <span>扇形扩展深度</span>
                                <input type="number" id="graphFanOutDepth" min="1" max="3" value="2" style="width: 80px;">
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                从目标实体出发，扩展多少层关系
                            </small>
                        </div>

                        <!-- 匹配阈值 -->
                        <div class="form-group">
                            <label>
                                <span>向量匹配阈值</span>
                                <input type="range" id="graphMatchThreshold" min="0" max="100" value="30" 
                                    oninput="document.getElementById('graphMatchThresholdValue').textContent = this.value + '%'">
                                <span id="graphMatchThresholdValue" style="margin-left: 10px;">30%</span>
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                相似度低于此值的实体不会被匹配
                            </small>
                        </div>

                        <!-- 调试模式 -->
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphDebugMode" checked>
                                <span>启用调试日志</span>
                            </label>
                        </div>

                        <!-- 操作按钮 -->
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button onclick="graphRAGUI.saveConfig()" 
                                style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                💾 保存配置
                            </button>
                            <button onclick="graphRAGUI.openManagementPanel()" 
                                style="flex: 1; padding: 10px; background: #764ba2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                📊 管理图谱
                            </button>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="graphRAGUI.migrateFromCharacterGraph()" 
                                style="flex: 1; padding: 10px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🚀 迁移人物图谱
                            </button>
                            <button onclick="graphRAGUI.testSearch()" 
                                style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🔍 测试搜索
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建管理面板HTML
     */
    createManagementPanelHTML() {
        return `
            <div id="graphRAGModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; overflow: auto;">
                <div style="max-width: 1100px; margin: 20px auto; background: #1a1a2e; border-radius: 12px; padding: 30px; position: relative;">
                    <!-- 关闭按钮 -->
                    <button onclick="graphRAGUI.closeManagementPanel()" 
                        style="position: absolute; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 24px;">
                        ×
                    </button>

                    <h2 style="color: white; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
                        🧠 GraphRAG-Lite 图谱管理
                    </h2>

                    <!-- 统计概览 -->
                    <div id="graphRAGStatsPanel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin-bottom: 25px; color: white;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 20px; text-align: center;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">实体</div>
                                <div id="statEntities" style="font-size: 28px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">关系</div>
                                <div id="statRelations" style="font-size: 28px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">维度</div>
                                <div id="statDimensions" style="font-size: 28px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">人物</div>
                                <div id="statPersons" style="font-size: 28px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">地点</div>
                                <div id="statPlaces" style="font-size: 28px; font-weight: bold;">0</div>
                            </div>
                        </div>
                    </div>

                    <!-- 搜索和筛选 -->
                    <div style="margin-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap;">
                        <input type="text" id="graphSearchInput" placeholder="🔍 搜索实体名、维度..." 
                            style="flex: 1; min-width: 200px; padding: 12px 15px; border: 1px solid #444; background: #2a2a3e; color: white; border-radius: 8px; font-size: 14px;"
                            onkeyup="graphRAGUI.filterEntities()">
                        
                        <select id="graphTypeFilter" onchange="graphRAGUI.filterEntities()"
                            style="padding: 12px 15px; border: 1px solid #444; background: #2a2a3e; color: white; border-radius: 8px;">
                            <option value="all">全部类型</option>
                            <option value="person">👤 人物</option>
                            <option value="place">📍 地点</option>
                            <option value="item">📦 物品</option>
                            <option value="event">📅 事件</option>
                            <option value="faction">🏛️ 势力</option>
                            <option value="concept">💡 概念</option>
                        </select>
                    </div>

                    <!-- 主内容区 -->
                    <div style="display: grid; grid-template-columns: 1fr 280px; gap: 20px;">
                        <!-- 左侧：实体列表 -->
                        <div>
                            <h3 style="color: #ccc; margin-bottom: 15px; font-size: 14px;">📦 实体列表</h3>
                            <div id="graphEntityList" style="max-height: 400px; overflow-y: auto; background: #2a2a3e; border-radius: 10px; padding: 15px;">
                                <div style="text-align: center; color: #999; padding: 40px;">加载中...</div>
                            </div>
                        </div>

                        <!-- 右侧 -->
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <!-- 维度统计 -->
                            <div>
                                <h3 style="color: #ccc; margin-bottom: 10px; font-size: 14px;">🏷️ 维度</h3>
                                <div id="graphDimensionList" style="max-height: 180px; overflow-y: auto; background: #2a2a3e; border-radius: 10px; padding: 12px;">
                                    <div style="text-align: center; color: #999; padding: 20px;">加载中...</div>
                                </div>
                            </div>

                            <!-- 关系列表 -->
                            <div>
                                <h3 style="color: #ccc; margin-bottom: 10px; font-size: 14px;">🔗 最近关系</h3>
                                <div id="graphRelationList" style="max-height: 180px; overflow-y: auto; background: #2a2a3e; border-radius: 10px; padding: 12px;">
                                    <div style="text-align: center; color: #999; padding: 20px;">加载中...</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
                        <button onclick="graphRAGUI.exportGraph()" 
                            style="flex: 1; min-width: 100px; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            📤 导出
                        </button>
                        <button onclick="graphRAGUI.importGraph()" 
                            style="flex: 1; min-width: 100px; padding: 12px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            📥 导入
                        </button>
                        <button onclick="graphRAGUI.clearGraph()" 
                            style="flex: 1; min-width: 100px; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">
                            🗑️ 清空
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 切换启用状态
     */
    toggle() {
        const checkbox = document.getElementById('enableGraphRAG');
        const fieldsDiv = document.getElementById('graphRAGFields');

        if (checkbox && fieldsDiv) {
            fieldsDiv.style.display = checkbox.checked ? 'block' : 'none';

            if (window.graphRAGLite) {
                window.graphRAGLite.config.enabled = checkbox.checked;
            }
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        if (!window.graphRAGLite) return;

        const config = {
            enabled: document.getElementById('enableGraphRAG')?.checked ?? true,
            localMaxEntities: parseInt(document.getElementById('graphLocalMaxEntities')?.value) || 5,
            localMaxDepth: parseInt(document.getElementById('graphFanOutDepth')?.value) || 2,
            matchThreshold: (parseInt(document.getElementById('graphMatchThreshold')?.value) || 30) / 100,
            debug: document.getElementById('graphDebugMode')?.checked ?? true
        };

        window.graphRAGLite.updateConfig(config);

        // 保存到localStorage
        localStorage.setItem('graphRAGConfig', JSON.stringify(config));

        alert('✅ GraphRAG配置已保存！');
    }

    /**
     * 加载配置
     */
    loadConfig() {
        const saved = localStorage.getItem('graphRAGConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);

                const enableEl = document.getElementById('enableGraphRAG');
                if (enableEl) enableEl.checked = config.enabled ?? true;

                const maxEntitiesEl = document.getElementById('graphLocalMaxEntities');
                if (maxEntitiesEl) maxEntitiesEl.value = config.localMaxEntities || 5;

                const depthEl = document.getElementById('graphFanOutDepth');
                if (depthEl) depthEl.value = config.localMaxDepth || 2;

                const thresholdEl = document.getElementById('graphMatchThreshold');
                if (thresholdEl) {
                    thresholdEl.value = (config.matchThreshold || 0.3) * 100;
                    const valueEl = document.getElementById('graphMatchThresholdValue');
                    if (valueEl) valueEl.textContent = thresholdEl.value + '%';
                }

                const debugEl = document.getElementById('graphDebugMode');
                if (debugEl) debugEl.checked = config.debug ?? true;

                if (window.graphRAGLite) {
                    window.graphRAGLite.updateConfig(config);
                }
            } catch (e) {
                console.warn('[GraphRAG-UI] 加载配置失败:', e);
            }
        }
    }

    /**
     * 打开管理面板
     */
    async openManagementPanel() {
        let modal = document.getElementById('graphRAGModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', this.createManagementPanelHTML());
            modal = document.getElementById('graphRAGModal');
        }

        modal.style.display = 'block';
        await this.updateStats();
        await this.renderEntityList();
        await this.renderDimensionList();
        await this.renderRelationList();
    }

    /**
     * 关闭管理面板
     */
    closeManagementPanel() {
        const modal = document.getElementById('graphRAGModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 更新统计信息
     */
    async updateStats() {
        if (!window.graphRAGLite) return;

        const stats = window.graphRAGLite.getStats();

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('statEntities', stats.entityCount);
        setEl('statRelations', stats.relationCount);
        setEl('statDimensions', stats.dimensionCount);
        setEl('statPersons', stats.typeCount?.person || 0);
        setEl('statPlaces', stats.typeCount?.place || 0);
    }

    /**
     * 渲染实体列表
     */
    async renderEntityList(filter = null) {
        const listPanel = document.getElementById('graphEntityList');
        if (!listPanel || !window.graphRAGLite) return;

        const searchQuery = document.getElementById('graphSearchInput')?.value?.toLowerCase() || '';
        const typeFilter = document.getElementById('graphTypeFilter')?.value || 'all';

        let entities = window.graphRAGLite.getAllEntities();

        // 筛选
        if (searchQuery) {
            entities = entities.filter(e =>
                e.name.toLowerCase().includes(searchQuery) ||
                (e.dimensions || []).some(d => d.toLowerCase().includes(searchQuery))
            );
        }
        if (typeFilter !== 'all') {
            entities = entities.filter(e => e.type === typeFilter);
        }

        // 排序
        entities.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        if (entities.length === 0) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">暂无实体</div>';
            return;
        }

        const typeIcons = { person: '👤', place: '📍', item: '📦', event: '📅', faction: '🏛️', concept: '💡' };
        const typeColors = { person: '#3498db', place: '#27ae60', item: '#f39c12', event: '#9b59b6', faction: '#e74c3c', concept: '#1abc9c' };

        let html = '';
        entities.forEach(entity => {
            const icon = typeIcons[entity.type] || '❓';
            const color = typeColors[entity.type] || '#667eea';

            html += `
                <div style="background: #1a1a2e; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid ${color};">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span style="font-size: 16px;">${icon}</span>
                                <span style="color: white; font-size: 14px; font-weight: bold;">${entity.name}</span>
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
                                ${(entity.dimensions || []).slice(0, 4).map(dim => `
                                    <span style="background: rgba(102,126,234,0.3); color: #a8b4ff; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${dim}</span>
                                `).join('')}
                            </div>
                            ${entity.attributes?.personality ? `<div style="color: #888; font-size: 11px;">性格: ${entity.attributes.personality}</div>` : ''}
                        </div>
                        <button onclick="graphRAGUI.deleteEntity('${entity.name}')" 
                            style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            删除
                        </button>
                    </div>
                </div>
            `;
        });

        listPanel.innerHTML = html;
    }

    /**
     * 渲染维度列表
     */
    async renderDimensionList() {
        const listPanel = document.getElementById('graphDimensionList');
        if (!listPanel || !window.graphRAGLite) return;

        const dimensions = window.graphRAGLite.getAllDimensions();

        if (dimensions.length === 0) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 12px;">暂无维度</div>';
            return;
        }

        // 按实体数量排序
        dimensions.sort((a, b) => (b.entities?.size || 0) - (a.entities?.size || 0));

        let html = '';
        dimensions.slice(0, 15).forEach(dim => {
            const count = dim.entities?.size || 0;
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #333;">
                    <span style="color: #a8b4ff; font-size: 12px;">${dim.name}</span>
                    <span style="color: #666; font-size: 11px;">${count}个</span>
                </div>
            `;
        });

        listPanel.innerHTML = html;
    }

    /**
     * 渲染关系列表
     */
    async renderRelationList() {
        const listPanel = document.getElementById('graphRelationList');
        if (!listPanel || !window.graphRAGLite) return;

        const relations = window.graphRAGLite.relations || [];

        if (relations.length === 0) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 12px;">暂无关系</div>';
            return;
        }

        // 取最近的关系
        const recent = relations.slice(-10).reverse();

        let html = '';
        recent.forEach(rel => {
            html += `
                <div style="padding: 4px 0; border-bottom: 1px solid #333; font-size: 11px;">
                    <span style="color: #3498db;">${rel.subject}</span>
                    <span style="color: #f39c12;"> → ${rel.predicate} → </span>
                    <span style="color: #27ae60;">${rel.object}</span>
                </div>
            `;
        });

        listPanel.innerHTML = html;
    }

    /**
     * 筛选实体
     */
    filterEntities() {
        this.renderEntityList();
    }

    /**
     * 删除实体
     */
    async deleteEntity(name) {
        if (!confirm(`确定要删除实体"${name}"吗？`)) return;

        await window.graphRAGLite?.deleteEntity(name);
        await this.updateStats();
        await this.renderEntityList();
        await this.renderDimensionList();
        await this.renderRelationList();
    }

    /**
     * 迁移人物图谱
     */
    async migrateFromCharacterGraph() {
        if (!window.graphRAGLite) {
            alert('❌ GraphRAG-Lite未初始化');
            return;
        }

        if (!confirm('确定要将人物图谱数据迁移到GraphRAG-Lite吗？')) return;

        const count = await window.graphRAGLite.migrateFromCharacterGraph();
        alert(`✅ 迁移完成！共迁移${count}个人物`);

        if (document.getElementById('graphRAGModal')?.style.display === 'block') {
            await this.updateStats();
            await this.renderEntityList();
        }
    }

    /**
     * 测试搜索
     */
    async testSearch() {
        const query = prompt('请输入搜索内容:');
        if (!query) return;

        if (!window.graphRAGLite) {
            alert('❌ GraphRAG-Lite未初始化');
            return;
        }

        const result = await window.graphRAGLite.localSearch(query);

        if (result.entities.length === 0) {
            alert('未找到相关实体');
        } else {
            let msg = `找到${result.entities.length}个相关实体:\n\n`;
            result.entities.forEach((e, i) => {
                msg += `${i + 1}. ${e.name} (${e.type}) [${e.source}]\n`;
            });
            if (result.relations.length > 0) {
                msg += `\n关系: ${result.relations.length}个`;
            }
            if (result.dimensions.length > 0) {
                msg += `\n维度: ${result.dimensions.join(', ')}`;
            }
            alert(msg);
        }
    }

    /**
     * 导出图谱
     */
    async exportGraph() {
        if (!window.graphRAGLite) return;

        const data = window.graphRAGLite.export();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `graphrag-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        alert('✅ 图谱已导出！');
    }

    /**
     * 导入图谱
     */
    async importGraph() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await window.graphRAGLite?.import(data);
                await this.updateStats();
                await this.renderEntityList();
                await this.renderDimensionList();
                await this.renderRelationList();
                alert('✅ 图谱已导入！');
            } catch (error) {
                alert('❌ 导入失败: ' + error.message);
            }
        };

        input.click();
    }

    /**
     * 清空图谱
     */
    async clearGraph() {
        if (!confirm('确定要清空所有GraphRAG数据吗？此操作不可恢复！')) return;

        await window.graphRAGLite?.clearAll();
        await this.updateStats();
        await this.renderEntityList();
        await this.renderDimensionList();
        await this.renderRelationList();
        alert('✅ 图谱已清空！');
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.graphRAGUI = new GraphRAGUI();
    console.log('[GraphRAG-UI] 全局实例已创建: window.graphRAGUI');
}
