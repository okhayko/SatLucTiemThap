/**
 * Quản lý UI Sơ đồ nhân vật
 * Cung cấp giao diện cấu hình và giao diện quản lý nhân vật
 */

class CharacterGraphUI {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Khởi tạo UI
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        // Đợi DOM tải xong
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        this.isInitialized = true;
        console.log('[UI Sơ đồ nhân vật] Khởi tạo hoàn tất');
    }

    /**
     * Tạo HTML cho bảng cấu hình
     */
    createConfigPanelHTML() {
        return `
            <div class="config-section" id="characterGraphSection" style="display: none;">
                <div class="config-section-header" onclick="toggleSection('characterGraphSection')">
                    <span>👥 Cài đặt Sơ đồ nhân vật</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="config-section-content">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 14px; color: white; margin-bottom: 8px;">
                            <strong>🌟 Hệ thống Sơ đồ nhân vật</strong>
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.6;">
                            Tự động trích xuất <strong>Tên, Tính cách, Ngoại hình</strong> của nhân vật vào kho sơ đồ vector, truy xuất thông minh các nhân vật liên quan thông qua so khớp vector. Chỉ thêm các nhân vật có độ khớp cao vào ngữ cảnh để tránh ngữ cảnh quá dài.
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="enableCharacterGraph" onchange="characterGraphUI.toggleCharacterGraph()" checked>
                            <span>Kích hoạt hệ thống Sơ đồ nhân vật</span>
                        </label>
                        <small style="color: #999; display: block; margin-top: 5px;">
                            Sau khi kích hoạt, thông tin nhân vật sẽ được lưu vào sơ đồ và tải động vào ngữ cảnh qua so khớp vector.
                        </small>
                    </div>

                    <div id="characterGraphFields" style="display: block;">
                        <div class="form-group">
                            <label>
                                <span>Ngưỡng so khớp</span>
                                <input type="range" id="graphMatchThreshold" min="0" max="100" value="40" 
                                    oninput="document.getElementById('graphMatchThresholdValue').textContent = this.value + '%'">
                                <span id="graphMatchThresholdValue" style="margin-left: 10px;">40%</span>
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                Chỉ những nhân vật có độ tương đồng cao hơn giá trị này mới được thêm vào ngữ cảnh.
                            </small>
                        </div>

                        <div class="form-group">
                            <label>
                                <span>Số nhân vật tối đa trong ngữ cảnh</span>
                                <input type="number" id="graphMaxCharacters" min="1" max="10" value="3" style="width: 80px;">
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                Số lượng nhân vật liên quan tối đa được tải vào ngữ cảnh trong mỗi lần đối thoại.
                            </small>
                        </div>

                        <div class="form-group">
                            <label>
                                <span>Trọng số Tên</span>
                                <input type="range" id="graphNameWeight" min="1" max="5" step="0.5" value="3" 
                                    oninput="document.getElementById('graphNameWeightValue').textContent = this.value">
                                <span id="graphNameWeightValue" style="margin-left: 10px;">3</span>
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                Trọng số của Tên trong so khớp vector (so với Tính cách và Ngoại hình).
                            </small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphAutoExtract" checked>
                                <span>Tự động trích xuất nhân vật từ phản hồi AI</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphAutoMatch" checked>
                                <span>Tự động khớp nhân vật liên quan vào ngữ cảnh</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphDebugMode" checked>
                                <span>Kích hoạt nhật ký gỡ lỗi (Debug Log)</span>
                            </label>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button onclick="characterGraphUI.saveConfig()" 
                                style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                💾 Lưu cấu hình
                            </button>
                            <button onclick="characterGraphUI.openManagementPanel()" 
                                style="flex: 1; padding: 10px; background: #764ba2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                📊 Quản lý sơ đồ
                            </button>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="characterGraphUI.migrateRelationships()" 
                                style="flex: 1; padding: 10px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🚀 Di chuyển nhân vật hiện có
                            </button>
                            <button onclick="characterGraphUI.testMatch()" 
                                style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🔍 Kiểm tra so khớp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Tạo HTML cho bảng quản lý
     */
    createManagementPanelHTML() {
        return `
            <div id="characterGraphManagementModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; overflow: auto;">
                <div style="max-width: 900px; margin: 0 auto; background: #1a1a2e; border-radius: 10px; padding: 30px; position: relative;">
                    <button onclick="characterGraphUI.closeManagementPanel()" 
                        style="position: absolute; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 20px;">
                        ×
                    </button>

                    <h2 style="color: white; margin-bottom: 20px;">👥 Quản lý Sơ đồ nhân vật</h2>

                    <div id="graphStatsPanel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">Tổng số nhân vật</div>
                                <div id="statTotalCharacters" style="font-size: 24px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">Số lần so khớp</div>
                                <div id="statMatchCount" style="font-size: 24px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">Độ khớp trung bình</div>
                                <div id="statAvgScore" style="font-size: 24px; font-weight: bold;">0%</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <input type="text" id="characterSearchInput" placeholder="🔍 Tìm kiếm tên, tính cách hoặc ngoại hình..." 
                            style="width: 100%; padding: 12px; border: 1px solid #444; background: #2a2a3e; color: white; border-radius: 5px; font-size: 14px;"
                            onkeyup="characterGraphUI.searchCharacters()">
                    </div>

                    <div id="characterListPanel" style="max-height: 400px; overflow-y: auto; background: #2a2a3e; border-radius: 8px; padding: 15px;">
                        <div style="text-align: center; color: #999; padding: 40px;">
                            Đang tải...
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="characterGraphUI.exportGraph()" 
                            style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📤 Xuất sơ đồ
                        </button>
                        <button onclick="characterGraphUI.importGraph()" 
                            style="flex: 1; padding: 12px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 Nhập sơ đồ
                        </button>
                        <button onclick="characterGraphUI.clearGraph()" 
                            style="flex: 1; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🗑️ Xóa sạch sơ đồ
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render danh sách nhân vật
     */
    async renderCharacterList(searchQuery = '') {
        const listPanel = document.getElementById('characterListPanel');
        if (!listPanel) return;

        const manager = window.characterGraphManager;
        if (!manager || !manager.isInitialized) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Trình quản lý sơ đồ chưa được khởi tạo</div>';
            return;
        }

        const allCharacters = Array.from(manager.characters.values());
        
        // Lọc
        let filteredCharacters = allCharacters;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredCharacters = allCharacters.filter(char => 
                (char.name || '').toLowerCase().includes(query) ||
                (char.personality || '').toLowerCase().includes(query) ||
                (char.appearance || '').toLowerCase().includes(query)
            );
        }

        // Sắp xếp (theo thời gian khớp cuối cùng)
        filteredCharacters.sort((a, b) => (b.lastMatchedAt || 0) - (a.lastMatchedAt || 0));

        if (filteredCharacters.length === 0) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Không tìm thấy nhân vật nào</div>';
            return;
        }

        let html = '';
        filteredCharacters.forEach((char, index) => {
            html += `
                <div style="background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #444;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div style="color: white; font-size: 16px; font-weight: bold;">${char.name}</div>
                            <div style="color: #999; font-size: 12px; margin-top: 5px;">
                                Số lần khớp: ${char.matchCount || 0} | 
                                Lần khớp cuối: ${char.lastMatchedAt ? new Date(char.lastMatchedAt).toLocaleString('vi-VN') : 'Chưa từng'}
                            </div>
                        </div>
                        <button onclick="characterGraphUI.deleteCharacter('${char.name}')" 
                            style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            🗑️ Xóa
                        </button>
                    </div>
                    <div style="color: #ccc; font-size: 13px; line-height: 1.6;">
                        ${char.personality ? `<div><strong>Tính cách:</strong> ${char.personality}</div>` : ''}
                        ${char.appearance ? `<div><strong>Ngoại hình:</strong> ${char.appearance}</div>` : ''}
                        ${char.realm ? `<div><strong>Cảnh giới:</strong> ${char.realm}</div>` : ''}
                        ${char.age ? `<div><strong>Tuổi:</strong> ${char.age}</div>` : ''}
                    </div>
                </div>
            `;
        });

        listPanel.innerHTML = html;
    }

    /**
     * Cập nhật thông tin thống kê
     */
    async updateStats() {
        const manager = window.characterGraphManager;
        if (!manager || !manager.isInitialized) return;

        const stats = manager.getStats();
        
        const totalEl = document.getElementById('statTotalCharacters');
        const matchEl = document.getElementById('statMatchCount');
        const avgEl = document.getElementById('statAvgScore');

        if (totalEl) totalEl.textContent = stats.totalCharacters;
        if (matchEl) matchEl.textContent = stats.matchCount;
        if (avgEl) avgEl.textContent = (stats.avgMatchScore * 100).toFixed(1) + '%';
    }

    /**
     * Chuyển đổi bật/tắt sơ đồ
     */
    async toggleCharacterGraph() {
        const checkbox = document.getElementById('enableCharacterGraph');
        const fieldsDiv = document.getElementById('characterGraphFields');
        
        if (checkbox.checked) {
            fieldsDiv.style.display = 'block';
            
            // Khởi tạo hệ thống
            if (!window.characterGraphManager.isInitialized) {
                await window.characterGraphManager.init();
            }
            if (!window.characterGraphIntegration.isEnabled) {
                await window.characterGraphIntegration.init();
            }
        } else {
            fieldsDiv.style.display = 'none';
            window.characterGraphIntegration.setEnabled(false);
        }
    }

    /**
     * Lưu cấu hình
     */
    async saveConfig() {
        const config = {
            enabled: document.getElementById('enableCharacterGraph').checked,
            matchThreshold: parseInt(document.getElementById('graphMatchThreshold').value) / 100,
            contextMaxCharacters: parseInt(document.getElementById('graphMaxCharacters').value),
            nameWeight: parseFloat(document.getElementById('graphNameWeight').value),
            autoExtract: document.getElementById('graphAutoExtract').checked,
            autoMatch: document.getElementById('graphAutoMatch').checked,
            enableDebug: document.getElementById('graphDebugMode').checked
        };

        // Lưu vào module tích hợp
        window.characterGraphIntegration.updateConfig(config);

        // Lưu vào trình quản lý sơ đồ
        window.characterGraphManager.updateConfig({
            matchThreshold: config.matchThreshold,
            maxResults: config.contextMaxCharacters,
            nameWeight: config.nameWeight
        });

        alert('✅ Cấu hình Sơ đồ nhân vật đã được lưu!');
    }

    /**
     * Tải cấu hình
     */
    loadConfig() {
        const integration = window.characterGraphIntegration;
        const manager = window.characterGraphManager;
        
        if (integration) {
            const config = integration.getConfig();
            document.getElementById('enableCharacterGraph').checked = integration.isEnabled;
            document.getElementById('graphMatchThreshold').value = config.matchThreshold * 100;
            document.getElementById('graphMatchThresholdValue').textContent = (config.matchThreshold * 100).toFixed(0) + '%';
            document.getElementById('graphMaxCharacters').value = config.contextMaxCharacters;
            document.getElementById('graphAutoExtract').checked = config.autoExtract;
            document.getElementById('graphAutoMatch').checked = config.autoMatch;
            document.getElementById('graphDebugMode').checked = config.enableDebug;
            
            if (integration.isEnabled) {
                document.getElementById('characterGraphFields').style.display = 'block';
            }
        }
        
        if (manager) {
            const config = manager.config;
            document.getElementById('graphNameWeight').value = config.nameWeight;
            document.getElementById('graphNameWeightValue').textContent = config.nameWeight;
        }
    }

    /**
     * Mở bảng quản lý
     */
    async openManagementPanel() {
        let modal = document.getElementById('characterGraphManagementModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', this.createManagementPanelHTML());
            modal = document.getElementById('characterGraphManagementModal');
        }
        
        modal.style.display = 'block';
        await this.updateStats();
        await this.renderCharacterList();
    }

    /**
     * Đóng bảng quản lý
     */
    closeManagementPanel() {
        const modal = document.getElementById('characterGraphManagementModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Tìm kiếm nhân vật
     */
    searchCharacters() {
        const input = document.getElementById('characterSearchInput');
        if (input) {
            this.renderCharacterList(input.value);
        }
    }

    /**
     * Xóa nhân vật
     */
    async deleteCharacter(name) {
        if (!confirm(`Bạn có chắc muốn xóa nhân vật "${name}" không?`)) {
            return;
        }

        await window.characterGraphManager.deleteCharacter(name);
        await this.updateStats();
        await this.renderCharacterList();
    }

    /**
     * Di chuyển nhân vật hiện có
     */
    async migrateRelationships() {
        if (!window.gameState || !window.gameState.variables) {
            alert('❌ Trạng thái trò chơi chưa được khởi tạo');
            return;
        }

        if (!confirm('Bạn có chắc muốn di chuyển các mối quan hệ (relationships) từ biểu mẫu biến hiện tại sang sơ đồ không?')) {
            return;
        }

        await window.characterGraphIntegration.migrateExistingRelationships(window.gameState);
        alert('✅ Di chuyển hoàn tất!');
    }

    /**
     * Kiểm tra so khớp
     */
    async testMatch() {
        const query = prompt('Nhập nội dung muốn kiểm tra (tên, tính cách hoặc ngoại hình):');
        if (!query) return;

        const results = await window.characterGraphManager.searchCharacters(query, '', '');
        
        if (results.length === 0) {
            alert('Không tìm thấy nhân vật phù hợp');
        } else {
            let message = `Tìm thấy ${results.length} kết quả phù hợp:\n\n`;
            results.forEach((char, i) => {
                message += `${i + 1}. ${char.name} (${(char.matchScore * 100).toFixed(1)}%)\n`;
            });
            alert(message);
        }
    }

    /**
     * Xuất sơ đồ
     */
    async exportGraph() {
        const data = window.characterGraphManager.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `character-graph-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        alert('✅ Sơ đồ đã được xuất!');
    }

    /**
     * Nhập sơ đồ
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
                await window.characterGraphManager.importData(data);
                await this.updateStats();
                await this.renderCharacterList();
                alert('✅ Sơ đồ đã được nhập!');
            } catch (error) {
                alert('❌ Nhập thất bại: ' + error.message);
            }
        };
        
        input.click();
    }

    /**
     * Xóa sạch sơ đồ
     */
    async clearGraph() {
        if (!confirm('Bạn có chắc muốn xóa sạch toàn bộ dữ liệu sơ đồ nhân vật không? Hành động này không thể hoàn tác!')) {
            return;
        }
        
        await window.characterGraphManager.clearAll();
        await this.updateStats();
        await this.renderCharacterList();
        alert('✅ Sơ đồ đã được xóa sạch!');
    }
}

// Tạo thực thể toàn cục
if (typeof window !== 'undefined') {
    window.characterGraphUI = new CharacterGraphUI();
    console.log('[UI Sơ đồ nhân vật] Thực thể toàn cục đã được tạo: window.characterGraphUI');
}
