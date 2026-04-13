/**
 * Trình biên tập biến - Chỉnh sửa trực quan các mục trong trình quản lý biến khi đang chơi
 * Hỗ trợ bố cục phản hồi (responsive), ghi đè biến gốc sau khi lưu
 */

// Mở trình biên tập biến
function openVariableEditor() {
    if (!gameState.isGameStarted) {
        alert('Vui lòng bắt đầu trò chơi trước');
        return;
    }

    const vars = gameState.variables;
    
    // Xây dựng HTML trình biên tập
    const editorHTML = buildVariableEditorHTML(vars);
    
    // Tạo hộp thoại (modal)
    const modal = document.createElement('div');
    modal.id = 'variableEditorModal';
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
        padding: 10px;
        box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 100%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;
    content.innerHTML = editorHTML;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Đóng khi click ra ngoài
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Xây dựng HTML trình biên tập biến
function buildVariableEditorHTML(vars) {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
            <h2 style="color: #667eea; margin: 0; font-size: 18px;">Trình Quản Lý Biến</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="saveVariableEdits()" style="
                    padding: 8px 20px;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">Lưu</button>
                <button onclick="document.getElementById('variableEditorModal').remove()" style="
                    padding: 8px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Đóng</button>
            </div>
        </div>

        <div class="ve-tabs" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
            <button class="ve-tab-btn active" onclick="switchVETab('basic')" data-tab="basic" style="padding: 8px 15px; border: none; background: #667eea; color: white; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Thông tin cơ bản</button>
            <button class="ve-tab-btn" onclick="switchVETab('stats')" data-tab="stats" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Chỉ số thuộc tính</button>
            <button class="ve-tab-btn" onclick="switchVETab('attributes')" data-tab="attributes" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Thuộc tính lục duy</button>
            <button class="ve-tab-btn" onclick="switchVETab('items')" data-tab="items" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Vật phẩm đạo cụ</button>
            <button class="ve-tab-btn" onclick="switchVETab('relationships')" data-tab="relationships" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Quan hệ nhân vật</button>
            <button class="ve-tab-btn" onclick="switchVETab('skills')" data-tab="skills" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">Công pháp pháp thuật</button>
        </div>

        <div id="ve-tab-basic" class="ve-tab-content" style="display: block;">
            ${buildBasicInfoEditor(vars)}
        </div>

        <div id="ve-tab-stats" class="ve-tab-content" style="display: none;">
            ${buildStatsEditor(vars)}
        </div>

        <div id="ve-tab-attributes" class="ve-tab-content" style="display: none;">
            ${buildAttributesEditor(vars)}
        </div>

        <div id="ve-tab-items" class="ve-tab-content" style="display: none;">
            ${buildItemsEditor(vars)}
        </div>

        <div id="ve-tab-relationships" class="ve-tab-content" style="display: none;">
            ${buildRelationshipsEditor(vars)}
        </div>

        <div id="ve-tab-skills" class="ve-tab-content" style="display: none;">
            ${buildSkillsEditor(vars)}
        </div>
    `;
}

// Chuyển đổi tab
function switchVETab(tabName) {
    // Ẩn nội dung tất cả các tab
    document.querySelectorAll('.ve-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Đặt lại kiểu dáng cho tất cả các nút tab
    document.querySelectorAll('.ve-tab-btn').forEach(btn => {
        btn.style.background = '#e0e0e0';
        btn.style.color = '#333';
        btn.classList.remove('active');
    });
    
    // Hiển thị nội dung tab được chọn
    const selectedTab = document.getElementById('ve-tab-' + tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // Làm nổi bật nút được chọn
    const selectedBtn = document.querySelector(`.ve-tab-btn[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.style.background = '#667eea';
        selectedBtn.style.color = 'white';
        selectedBtn.classList.add('active');
    }
}

// Xây dựng trình biên tập thông tin cơ bản
function buildBasicInfoEditor(vars) {
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Thông tin cơ bản</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Họ tên</label>
                    <input type="text" id="ve-name" value="${vars.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Tuổi</label>
                    <input type="number" id="ve-age" value="${vars.age || 18}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Giới tính</label>
                    <select id="ve-gender" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                        <option value="Nam" ${vars.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                        <option value="Nữ" ${vars.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                    </select>
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Thân phận</label>
                    <input type="text" id="ve-identity" value="${vars.identity || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Cảnh giới</label>
                    <input type="text" id="ve-realm" value="${vars.realm || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Vị trí</label>
                    <input type="text" id="ve-location" value="${vars.location || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Tính cách</label>
                    <input type="text" id="ve-personality" value="${vars.personality || ''}" placeholder="VD: Trầm ổn nội tâm, phóng khoáng bất kham" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Ngoại hình</label>
                    <input type="text" id="ve-appearance" value="${vars.appearance || ''}" placeholder="VD: Diện mạo tuấn tú, vóc dáng thon dài" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field" style="grid-column: 1 / -1;">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Thời gian hiện tại</label>
                    <input type="text" id="ve-currentDateTime" value="${vars.currentDateTime || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field" style="grid-column: 1 / -1;">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Thiên phú (ngăn cách bằng dấu phẩy)</label>
                    <input type="text" id="ve-talents" value="${vars.talents ? vars.talents.join('、') : ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// Xây dựng trình biên tập chỉ số thuộc tính
function buildStatsEditor(vars) {
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Chỉ số thuộc tính</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Sinh lực (HP)</label>
                    <input type="number" id="ve-hp" value="${vars.hp || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Sinh lực tối đa</label>
                    <input type="number" id="ve-hpMax" value="${vars.hpMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Linh lực (MP)</label>
                    <input type="number" id="ve-mp" value="${vars.mp || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Linh lực tối đa</label>
                    <input type="number" id="ve-mpMax" value="${vars.mpMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Linh thạch</label>
                    <input type="number" id="ve-spiritStones" value="${vars.spiritStones || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Cơ duyên</label>
                    <input type="number" id="ve-karmaFortune" value="${vars.karmaFortune || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Thiên khiển</label>
                    <input type="number" id="ve-karmaPunishment" value="${vars.karmaPunishment || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Tiến độ tu luyện</label>
                    <input type="number" id="ve-cultivationProgress" value="${vars.cultivationProgress || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Giới hạn tiến độ tu luyện</label>
                    <input type="number" id="ve-cultivationProgressMax" value="${vars.cultivationProgressMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Cấp luyện đan</label>
                    <input type="text" id="ve-alchemyLevel" value="${vars.alchemyLevel || 'Chưa nhập môn'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Cấp luyện khí</label>
                    <input type="text" id="ve-craftingLevel" value="${vars.craftingLevel || 'Chưa nhập môn'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// Xây dựng trình biên tập thuộc tính lục duy
function buildAttributesEditor(vars) {
    const attrs = vars.attributes || {};
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">Thuộc tính lục duy</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Căn cốt</label>
                    <input type="number" id="ve-attr-physique" value="${attrs.physique || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Khí vận</label>
                    <input type="number" id="ve-attr-fortune" value="${attrs.fortune || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Ngộ tính</label>
                    <input type="number" id="ve-attr-comprehension" value="${attrs.comprehension || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Thần thức</label>
                    <input type="number" id="ve-attr-spirit" value="${attrs.spirit || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Tiềm năng</label>
                    <input type="number" id="ve-attr-potential" value="${attrs.potential || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Mị lực</label>
                    <input type="number" id="ve-attr-charisma" value="${attrs.charisma || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// Xây dựng trình biên tập vật phẩm
function buildItemsEditor(vars) {
    const items = vars.items || [];
    let itemsHTML = items.map((item, index) => `
        <div class="ve-item-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
            <input type="text" data-item-index="${index}" data-item-field="name" value="${item.name || ''}" placeholder="Tên" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-item-index="${index}" data-item-field="count" value="${item.count || 1}" placeholder="Số lượng" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="text" data-item-index="${index}" data-item-field="type" value="${item.type || ''}" placeholder="Loại" style="flex: 1; min-width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVEItem(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Xóa</button>
        </div>
    `).join('');

    return `
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">Vật phẩm đạo cụ</h3>
                <button onclick="addVEItem()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Thêm vật phẩm</button>
            </div>
            <div id="ve-items-list">
                ${itemsHTML || '<div style="text-align: center; color: #999; padding: 20px;">Không có vật phẩm</div>'}
            </div>
        </div>
    `;
}

// Xây dựng trình biên tập quan hệ nhân vật
function buildRelationshipsEditor(vars) {
    const relationships = vars.relationships || [];
    let relHTML = relationships.map((rel, index) => `
        <div class="ve-rel-card" style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: bold; color: #667eea;">${rel.name || 'Chưa đặt tên'}</span>
                <button onclick="removeVERelationship(${index})" style="padding: 4px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Xóa</button>
            </div>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Tên</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="name" value="${rel.name || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Quan hệ</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="relation" value="${rel.relation || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Hảo cảm</label>
                    <input type="number" data-rel-index="${index}" data-rel-field="favor" value="${rel.favor || 0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Tuổi</label>
                    <input type="number" data-rel-index="${index}" data-rel-field="age" value="${rel.age || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Cảnh giới</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="realm" value="${rel.realm || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Tính cách</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="personality" value="${rel.personality || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Ngoại hình</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="appearance" value="${rel.appearance || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">Ấn tượng</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="opinion" value="${rel.opinion || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">Quan hệ nhân vật</h3>
                <button onclick="addVERelationship()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Thêm nhân vật</button>
            </div>
            <div id="ve-relationships-list">
                ${relHTML || '<div style="text-align: center; color: #999; padding: 20px;">Chưa có quan hệ nhân vật</div>'}
            </div>
        </div>
    `;
}

// Xây dựng trình biên tập công pháp pháp thuật
function buildSkillsEditor(vars) {
    const techniques = vars.techniques || [];
    const spells = vars.spells || [];

    let techHTML = techniques.map((tech, index) => `
        <div class="ve-skill-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f0f4ff; border-radius: 6px;">
            <input type="text" data-tech-index="${index}" data-tech-field="name" value="${tech.name || ''}" placeholder="Tên" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-tech-index="${index}" data-tech-field="power" value="${tech.power || 0}" placeholder="Uy lực" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-tech-index="${index}" data-tech-field="mpCost" value="${tech.mpCost || 0}" placeholder="Tiêu hao" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVETechnique(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Xóa</button>
        </div>
    `).join('');

    let spellHTML = spells.map((spell, index) => `
        <div class="ve-skill-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f5f0ff; border-radius: 6px;">
            <input type="text" data-spell-index="${index}" data-spell-field="name" value="${spell.name || ''}" placeholder="Tên" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-spell-index="${index}" data-spell-field="power" value="${spell.power || 0}" placeholder="Uy lực" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-spell-index="${index}" data-spell-field="mpCost" value="${spell.mpCost || 0}" placeholder="Tiêu hao" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVESpell(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Xóa</button>
        </div>
    `).join('');

    return `
        <div class="ve-section" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">Công pháp</h3>
                <button onclick="addVETechnique()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Thêm công pháp</button>
            </div>
            <div id="ve-techniques-list">
                ${techHTML || '<div style="text-align: center; color: #999; padding: 20px;">Chưa có công pháp</div>'}
            </div>
        </div>
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #764ba2; margin: 0; font-size: 15px;">Pháp thuật</h3>
                <button onclick="addVESpell()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Thêm pháp thuật</button>
            </div>
            <div id="ve-spells-list">
                ${spellHTML || '<div style="text-align: center; color: #999; padding: 20px;">Chưa có pháp thuật</div>'}
            </div>
        </div>
    `;
}

// Thêm vật phẩm
function addVEItem() {
    if (!gameState.variables.items) {
        gameState.variables.items = [];
    }
    gameState.variables.items.push({ name: '', count: 1, type: '' });
    refreshVEItemsList();
}

// Xóa vật phẩm
function removeVEItem(index) {
    if (gameState.variables.items) {
        gameState.variables.items.splice(index, 1);
        refreshVEItemsList();
    }
}

// Làm mới danh sách vật phẩm
function refreshVEItemsList() {
    const container = document.getElementById('ve-items-list');
    if (container) {
        container.innerHTML = buildItemsEditor(gameState.variables).match(/<div id="ve-items-list">([\s\S]*?)<\/div>/)?.[1] || '';
    }
}

// Thêm quan hệ nhân vật
function addVERelationship() {
    if (!gameState.variables.relationships) {
        gameState.variables.relationships = [];
    }
    gameState.variables.relationships.push({ 
        name: '', 
        relation: '', 
        favor: 0, 
        age: '',
        realm: '',
        personality: '',
        appearance: '',
        opinion: ''
    });
    refreshVERelationshipsList();
}

// Xóa quan hệ nhân vật
function removeVERelationship(index) {
    if (gameState.variables.relationships) {
        gameState.variables.relationships.splice(index, 1);
        refreshVERelationshipsList();
    }
}

// Làm mới danh sách quan hệ nhân vật
function refreshVERelationshipsList() {
    const container = document.getElementById('ve-relationships-list');
    if (container) {
        const newContent = buildRelationshipsEditor(gameState.variables);
        const match = newContent.match(/<div id="ve-relationships-list">([\s\S]*?)<\/div>\s*<\/div>\s*$/);
        if (match) {
            container.innerHTML = match[1];
        }
    }
}

// Thêm công pháp
function addVETechnique() {
    if (!gameState.variables.techniques) {
        gameState.variables.techniques = [];
    }
    gameState.variables.techniques.push({ name: '', type: 'Công pháp', power: 0, mpCost: 0, description: '', effect: '' });
    refreshVESkillsList();
}

// Xóa công pháp
function removeVETechnique(index) {
    if (gameState.variables.techniques) {
        gameState.variables.techniques.splice(index, 1);
        refreshVESkillsList();
    }
}

// Thêm pháp thuật
function addVESpell() {
    if (!gameState.variables.spells) {
        gameState.variables.spells = [];
    }
    gameState.variables.spells.push({ name: '', type: 'Pháp thuật', power: 0, mpCost: 0, description: '', effect: '' });
    refreshVESkillsList();
}

// Xóa pháp thuật
function removeVESpell(index) {
    if (gameState.variables.spells) {
        gameState.variables.spells.splice(index, 1);
        refreshVESkillsList();
    }
}

// Làm mới danh sách công pháp pháp thuật
function refreshVESkillsList() {
    const tabContent = document.getElementById('ve-tab-skills');
    if (tabContent) {
        tabContent.innerHTML = buildSkillsEditor(gameState.variables);
    }
}

// Lưu chỉnh sửa biến
function saveVariableEdits() {
    try {
        // Thông tin cơ bản
        const nameEl = document.getElementById('ve-name');
        if (nameEl) gameState.variables.name = nameEl.value;

        const ageEl = document.getElementById('ve-age');
        if (ageEl) gameState.variables.age = parseInt(ageEl.value) || 18;

        const genderEl = document.getElementById('ve-gender');
        if (genderEl) gameState.variables.gender = genderEl.value;

        const identityEl = document.getElementById('ve-identity');
        if (identityEl) gameState.variables.identity = identityEl.value;

        const realmEl = document.getElementById('ve-realm');
        if (realmEl) gameState.variables.realm = realmEl.value;

        const locationEl = document.getElementById('ve-location');
        if (locationEl) gameState.variables.location = locationEl.value;

        const personalityEl = document.getElementById('ve-personality');
        if (personalityEl) gameState.variables.personality = personalityEl.value;

        const appearanceEl = document.getElementById('ve-appearance');
        if (appearanceEl) gameState.variables.appearance = appearanceEl.value;

        const dateTimeEl = document.getElementById('ve-currentDateTime');
        if (dateTimeEl) gameState.variables.currentDateTime = dateTimeEl.value;

        const talentsEl = document.getElementById('ve-talents');
        if (talentsEl) {
            const talentsStr = talentsEl.value.trim();
            gameState.variables.talents = talentsStr ? talentsStr.split(/[,，、]/).map(t => t.trim()).filter(t => t) : [];
        }

        // Chỉ số thuộc tính
        const hpEl = document.getElementById('ve-hp');
        if (hpEl) gameState.variables.hp = parseInt(hpEl.value) || 100;

        const hpMaxEl = document.getElementById('ve-hpMax');
        if (hpMaxEl) gameState.variables.hpMax = parseInt(hpMaxEl.value) || 100;

        const mpEl = document.getElementById('ve-mp');
        if (mpEl) gameState.variables.mp = parseInt(mpEl.value) || 100;

        const mpMaxEl = document.getElementById('ve-mpMax');
        if (mpMaxEl) gameState.variables.mpMax = parseInt(mpMaxEl.value) || 100;

        const spiritStonesEl = document.getElementById('ve-spiritStones');
        if (spiritStonesEl) gameState.variables.spiritStones = parseInt(spiritStonesEl.value) || 0;

        const karmaFortuneEl = document.getElementById('ve-karmaFortune');
        if (karmaFortuneEl) gameState.variables.karmaFortune = parseInt(karmaFortuneEl.value) || 0;

        const karmaPunishmentEl = document.getElementById('ve-karmaPunishment');
        if (karmaPunishmentEl) gameState.variables.karmaPunishment = parseInt(karmaPunishmentEl.value) || 0;

        const cultivationProgressEl = document.getElementById('ve-cultivationProgress');
        if (cultivationProgressEl) gameState.variables.cultivationProgress = parseInt(cultivationProgressEl.value) || 0;

        const cultivationProgressMaxEl = document.getElementById('ve-cultivationProgressMax');
        if (cultivationProgressMaxEl) gameState.variables.cultivationProgressMax = parseInt(cultivationProgressMaxEl.value) || 100;

        const alchemyLevelEl = document.getElementById('ve-alchemyLevel');
        if (alchemyLevelEl) gameState.variables.alchemyLevel = alchemyLevelEl.value || 'Chưa nhập môn';

        const craftingLevelEl = document.getElementById('ve-craftingLevel');
        if (craftingLevelEl) gameState.variables.craftingLevel = craftingLevelEl.value || 'Chưa nhập môn';

        // Thuộc tính lục duy
        if (!gameState.variables.attributes) {
            gameState.variables.attributes = {};
        }
        
        const attrFields = ['physique', 'fortune', 'comprehension', 'spirit', 'potential', 'charisma'];
        attrFields.forEach(attr => {
            const el = document.getElementById('ve-attr-' + attr);
            if (el) gameState.variables.attributes[attr] = parseInt(el.value) || 10;
        });

        // Thu thập dữ liệu vật phẩm
        const itemInputs = document.querySelectorAll('[data-item-index]');
        const itemsMap = new Map();
        itemInputs.forEach(input => {
            const index = parseInt(input.dataset.itemIndex);
            const field = input.dataset.itemField;
            if (!itemsMap.has(index)) {
                itemsMap.set(index, { name: '', count: 1, type: '' });
            }
            const item = itemsMap.get(index);
            if (field === 'count') {
                item[field] = parseInt(input.value) || 1;
            } else {
                item[field] = input.value;
            }
        });
        if (itemsMap.size > 0) {
            gameState.variables.items = Array.from(itemsMap.values()).filter(item => item.name);
        }

        // Thu thập dữ liệu quan hệ nhân vật
        const relInputs = document.querySelectorAll('[data-rel-index]');
        const relMap = new Map();
        relInputs.forEach(input => {
            const index = parseInt(input.dataset.relIndex);
            const field = input.dataset.relField;
            if (!relMap.has(index)) {
                relMap.set(index, { name: '', relation: '', favor: 0 });
            }
            const rel = relMap.get(index);
            if (field === 'favor' || field === 'age') {
                rel[field] = parseInt(input.value) || 0;
            } else {
                rel[field] = input.value;
            }
        });
        if (relMap.size > 0) {
            gameState.variables.relationships = Array.from(relMap.values()).filter(rel => rel.name);
        }

        // Thu thập dữ liệu công pháp
        const techInputs = document.querySelectorAll('[data-tech-index]');
        const techMap = new Map();
        techInputs.forEach(input => {
            const index = parseInt(input.dataset.techIndex);
            const field = input.dataset.techField;
            if (!techMap.has(index)) {
                techMap.set(index, { name: '', type: 'Công pháp', power: 0, mpCost: 0, description: '', effect: '' });
            }
            const tech = techMap.get(index);
            if (field === 'power' || field === 'mpCost') {
                tech[field] = parseInt(input.value) || 0;
            } else {
                tech[field] = input.value;
            }
        });
        if (techMap.size > 0) {
            gameState.variables.techniques = Array.from(techMap.values()).filter(tech => tech.name);
        }

        // Thu thập dữ liệu pháp thuật
        const spellInputs = document.querySelectorAll('[data-spell-index]');
        const spellMap = new Map();
        spellInputs.forEach(input => {
            const index = parseInt(input.dataset.spellIndex);
            const field = input.dataset.spellField;
            if (!spellMap.has(index)) {
                spellMap.set(index, { name: '', type: 'Pháp thuật', power: 0, mpCost: 0, description: '', effect: '' });
            }
            const spell = spellMap.get(index);
            if (field === 'power' || field === 'mpCost') {
                spell[field] = parseInt(input.value) || 0;
            } else {
                spell[field] = input.value;
            }
        });
        if (spellMap.size > 0) {
            gameState.variables.spells = Array.from(spellMap.values()).filter(spell => spell.name);
        }

        // Cập nhật bảng trạng thái
        if (typeof updateStatusPanel === 'function') {
            updateStatusPanel();
        }

        // Lưu vào IndexedDB
        if (typeof saveGameHistory === 'function') {
            saveGameHistory();
        }

        // Đóng trình biên tập
        const modal = document.getElementById('variableEditorModal');
        if (modal) {
            modal.remove();
        }

        // Thông báo lưu thành công
        alert('Biến đã được lưu');
        
        console.log('[Trình biên tập biến] Biến đã lưu:', gameState.variables);
    } catch (error) {
        console.error('[Trình biên tập biến] Lưu thất bại:', error);
        alert('Lưu thất bại: ' + error.message);
    }
}

// Xuất ra toàn cục
window.openVariableEditor = openVariableEditor;
window.saveVariableEdits = saveVariableEdits;
window.switchVETab = switchVETab;
window.addVEItem = addVEItem;
window.removeVEItem = removeVEItem;
window.addVERelationship = addVERelationship;
window.removeVERelationship = removeVERelationship;
window.addVETechnique = addVETechnique;
window.removeVETechnique = removeVETechnique;
window.addVESpell = addVESpell;
window.removeVESpell = removeVESpell;