// ==================== Hệ thống quản lý gói kiến thức DLC ====================
        // ✅ Các chức năng cốt lõi của class DLCManager đã được di chuyển hoàn toàn sang dlc-manager.js
        // ✅ dlc-manager.js sẽ tự động tạo thực thể window.dlcManager
        // 
        // Các hàm tương tác UI sau đây được giữ lại trong file này:
        // - createNewDLC, manageDLC, activateDLC, deactivateDLC
        // - deleteDLC, exportDLC, exportAllDLC, importDLC
        // - editDLCKnowledge, viewDLCKnowledgeVectorStatus
        // - vectorizeDLCKnowledge, confirmEditDLCKnowledge

        // Tạo DLC mới
        function createNewDLC() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <h2 style="color: #667eea; margin-bottom: 20px;">📦 Tạo gói kiến thức DLC mới</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Tên DLC:</label>
                        <input type="text" id="dlcNameInput" placeholder="Ví dụ: Thế giới quan Tu tiên Cthulhu" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Mô tả DLC:</label>
                        <textarea id="dlcDescInput" placeholder="Mô tả nội dung và mục đích của gói DLC này..." style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 80px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">Các mục kiến thức (Định dạng JSON):</label>
                        <textarea id="dlcKnowledgeInput" placeholder='Vui lòng dán mảng JSON của các mục kiến thức theo định dạng sau:
[
  {
    "id": "unique_id",
    "title": "Tiêu đề mục",
    "content": "Nội dung mục",
    "category": "Phân loại",
    "tags": ["Thẻ 1", "Thẻ 2"],
    "alwaysInclude": true,
    "priority": "high"
  }
]' style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 200px; resize: vertical; font-family: monospace; font-size: 12px;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="this.closest('div[style*=position]').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Hủy</button>
                        <button onclick="confirmCreateDLC()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Tạo DLC</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // Xác nhận tạo DLC
        function confirmCreateDLC() {
            const name = document.getElementById('dlcNameInput').value.trim();
            const description = document.getElementById('dlcDescInput').value.trim();
            const knowledgeText = document.getElementById('dlcKnowledgeInput').value.trim();

            if (!name) {
                alert('Vui lòng nhập tên DLC!');
                return;
            }

            if (!knowledgeText) {
                alert('Vui lòng nhập các mục kiến thức!');
                return;
            }

            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('Các mục kiến thức phải ở định dạng mảng');
                }
            } catch (error) {
                alert('Lỗi định dạng JSON: ' + error.message);
                return;
            }

            // Kiểm tra định dạng các mục kiến thức
            for (let i = 0; i < knowledgeItems.length; i++) {
                const item = knowledgeItems[i];
                if (!item.id || !item.title || !item.content) {
                    alert(`Mục kiến thức thứ ${i+1} thiếu các trường bắt buộc (id, title hoặc content)`);
                    return;
                }
            }

            try {
                const dlc = window.dlcManager.createDLC(name, description, knowledgeItems);
                alert(`✅ Gói DLC "${dlc.name}" đã được tạo thành công!\n\nBao gồm ${knowledgeItems.length} mục kiến thức\nDLC ID: ${dlc.id}`);
                document.querySelector('div[style*="position: fixed"]').remove();
            } catch (error) {
                alert('❌ Tạo DLC thất bại: ' + error.message);
            }
        }

        // Quản lý các gói DLC
        function manageDLC() {
            const dlcList = window.dlcManager.getDLCList();
            
            const modal = document.createElement('div');
            modal.id = 'dlcManageModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
               display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            let dlcItemsHtml = '';
            if (dlcList.length === 0) {
                dlcItemsHtml = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
                        <div>Chưa có gói kiến thức DLC nào</div>
                        <div style="font-size: 14px; margin-top: 10px;">Nhấp vào "Tạo DLC mới" để bắt đầu tạo gói kiến thức đầu tiên của bạn</div>
                    </div>
                `;
            } else {
                dlcItemsHtml = dlcList.map(dlc => {
                    const statusBadge = dlc.activated 
                        ? '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">✅ Đã kích hoạt</span>'
                        : '<span style="background: #6c757d; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">⏸️ Chưa kích hoạt</span>';
                    
                    const actionButton = dlc.activated 
                        ? `<button onclick="deactivateDLC('${dlc.id}')" style="padding: 6px 12px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Ngừng</button>`
                        : `<button onclick="activateDLC('${dlc.id}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Kích hoạt</button>`;

                    return `
                        <div style="border: 2px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 15px; ${dlc.activated ? 'border-color: #28a745; background: #f8fff9;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0; color: #333; font-size: 16px;">${dlc.name}</h4>
                                    <div style="font-size: 12px; color: #666; margin-top: 5px;">ID: ${dlc.id}</div>
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    ${statusBadge}
                                </div>
                            </div>
                            
                            <div style="font-size: 13px; color: #666; margin-bottom: 10px; line-height: 1.4;">
                                ${dlc.description || 'Chưa có mô tả'}
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 12px; color: #999;">
                                    📚 ${dlc.knowledgeItems.length} mục kiến thức | 
                                    📅 ${new Date(dlc.createdAt).toLocaleDateString()}
                                    ${dlc.vectorizedAt ? `| 🧬 Đã vector hóa (${dlc.vectorMethod || 'unknown'})` : '| ⚪ Chưa vector hóa'}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    ${actionButton}
                                    <button onclick="editDLCKnowledge('${dlc.id}')" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Sửa mục</button>
                                    <button onclick="vectorizeDLCKnowledge('${dlc.id}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🧬 Vector hóa</button>
                                    <button onclick="exportDLC('${dlc.id}')" style="padding: 6px 12px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Xuất</button>
                                    <button onclick="deleteDLC('${dlc.id}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Xóa</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #667eea; margin: 0;">🎮 Quản lý gói kiến thức DLC</h2>
                        <button onclick="document.getElementById('dlcManageModal').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Đóng</button>
                    </div>
                    
                    <div style="background: #f0f2ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${dlcList.length}</div>
                                <div style="font-size: 12px; color: #666;">Tổng số DLC</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${dlcList.filter(d => d.activated).length}</div>
                                <div style="font-size: 12px; color: #666;">Đã kích hoạt</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${dlcList.filter(d => !d.activated).length}</div>
                                <div style="font-size: 12px; color: #666;">Chưa kích hoạt</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="dlcListContainer">
                        ${dlcItemsHtml}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // Kích hoạt DLC
        async function activateDLC(dlcId) {
            try {
                await window.dlcManager.activateDLC(dlcId);
                alert('✅ Kích hoạt gói DLC thành công!\n\nCác mục kiến thức đã được thêm vào kho kiến thức tĩnh.');
                // Loại bỏ cửa sổ cũ trước khi làm mới để tránh chồng chéo
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // Làm mới giao diện quản lý
            } catch (error) {
                alert('❌ Kích hoạt DLC thất bại: ' + error.message);
            }
        }

        // Ngừng kích hoạt DLC
        async function deactivateDLC(dlcId) {
            try {
                await window.dlcManager.deactivateDLC(dlcId);
                alert('✅ Ngừng kích hoạt gói DLC thành công!\n\nCác mục kiến thức liên quan đã bị xóa khỏi kho kiến thức tĩnh.');
                // Loại bỏ cửa sổ cũ trước khi làm mới để tránh chồng chéo
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // Làm mới giao diện quản lý
            } catch (error) {
                alert('❌ Ngừng kích hoạt DLC thất bại: ' + error.message);
            }
        }

        // Xóa DLC
        async function deleteDLC(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) return;

            if (!confirm(`⚠️ Bạn có chắc chắn muốn xóa gói DLC "${dlc.name}" không?\n\nThao tác này sẽ xóa toàn bộ gói DLC và tất cả các mục kiến thức bên trong.\nNếu DLC đang kích hoạt, nó sẽ tự động bị ngừng trước khi xóa.\n\nHành động này không thể hoàn tác!`)) {
                return;
            }

            try {
                await window.dlcManager.deleteDLC(dlcId);
                alert('✅ Xóa gói DLC thành công!');
                // Loại bỏ cửa sổ cũ trước khi làm mới để tránh chồng chéo
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // Làm mới giao diện quản lý
            } catch (error) {
                alert('❌ Xóa DLC thất bại: ' + error.message);
            }
        }

        // Xuất một gói DLC lẻ
        function exportDLC(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('Gói DLC không tồn tại!');
                return;
            }

            const exportData = {
                version: '1.0',
                type: 'dlc_package',
                exportTime: new Date().toISOString(),
                dlc: dlc
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DLC_${dlc.name}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert(`✅ Xuất gói DLC "${dlc.name}" thành công!\n\nTên tệp: ${a.download}`);
        }

        // Xuất tất cả các gói DLC
        function exportAllDLC() {
            const allDLC = window.dlcManager.getDLCList();
            if (allDLC.length === 0) {
                alert('Hiện chưa có gói DLC nào để xuất!');
                return;
            }

            const exportData = {
                version: '1.0',
                type: 'dlc_collection',
                exportTime: new Date().toISOString(),
                dlcPackages: allDLC
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `All_DLC_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert(`✅ Xuất tất cả gói DLC thành công!\n\nĐã xuất tổng cộng ${allDLC.length} gói DLC\nTên tệp: ${a.download}`);
        }

        // Nhập DLC
        function importDLC() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const data = JSON.parse(text);

                    if (data.type === 'dlc_package') {
                        // Trường hợp một gói DLC đơn lẻ
                        const dlc = data.dlc;
                        
                        // Kiểm tra trùng lặp ID
                        const existingDLC = window.dlcManager.dlcPackages.find(d => d.id === dlc.id);
                        if (existingDLC) {
                            if (!confirm(`⚠️ Phát hiện trùng ID DLC: ${dlc.id}\n\nDLC hiện có: ${existingDLC.name}\nDLC đang nhập: ${dlc.name}\n\nBạn có muốn ghi đè lên DLC hiện có không?`)) {
                                return;
                            }
                            // Xóa DLC hiện có
                            const index = window.dlcManager.dlcPackages.findIndex(d => d.id === dlc.id);
                            window.dlcManager.dlcPackages.splice(index, 1);
                        }

                        // Thêm DLC mới
                        window.dlcManager.dlcPackages.push(dlc);
                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ Nhập gói DLC "${dlc.name}" thành công!\n\nBao gồm ${dlc.knowledgeItems.length} mục kiến thức`);
                    } else if (data.type === 'dlc_collection') {
                        // Trường hợp tập hợp nhiều DLC
                        const dlcPackages = data.dlcPackages;
                        let importedCount = 0;
                        let skippedCount = 0;

                        for (const dlc of dlcPackages) {
                            const existingDLC = window.dlcManager.dlcPackages.find(d => d.id === dlc.id);
                            if (existingDLC) {
                                skippedCount++;
                                continue;
                            }
                            
                            window.dlcManager.dlcPackages.push(dlc);
                            importedCount++;
                        }

                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ Nhập bộ sưu tập DLC thành công!\n\nNhập thành công: ${importedCount} gói\nBỏ qua do trùng lặp: ${skippedCount} gói`);
                    } else if (data.knowledge && Array.isArray(data.knowledge)) {
                        // Tệp kiến thức thông thường - Tự động chuyển đổi sang định dạng DLC
                        const fileName = file.name.replace('.json', '');
                        const dlcName = prompt('🔄 Phát hiện tệp kho kiến thức thông thường\n\nVui lòng nhập tên cho gói DLC mới:', fileName || 'Kho kiến thức đã nhập');
                        
                        if (!dlcName) {
                            return;
                        }

                        const dlcDescription = data.description || prompt('Vui lòng nhập mô tả DLC (tùy chọn):', 'Các mục kiến thức được nhập từ tệp tệp JSON') || '';

                        // Tạo gói DLC
                        const dlc = {
                            id: 'dlc_' + Date.now(),
                            name: dlcName,
                            description: dlcDescription,
                            knowledgeItems: data.knowledge,
                            activated: false,
                            createdAt: new Date().toISOString(),
                            version: '1.0',
                            source: 'imported_knowledge_base',
                            originalFile: file.name
                        };

                        window.dlcManager.dlcPackages.push(dlc);
                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ Tệp kiến thức đã được chuyển đổi thành gói DLC!\n\nTên DLC: ${dlc.name}\nSố mục kiến thức: ${dlc.knowledgeItems.length}\n\n💡 Bạn có thể kích hoạt nó trong phần "Quản lý gói DLC"`);
                    } else {
                        throw new Error('Định dạng tệp không được hỗ trợ. Các định dạng được hỗ trợ là:\n1. Tệp gói DLC (.json)\n2. Tệp bộ sưu tập DLC (.json)\n3. Tệp kho kiến thức (.json) - sẽ được chuyển đổi tự động');
                    }
                } catch (error) {
                    console.error('[Nhập DLC] Lỗi:', error);
                    alert('❌ Nhập thất bại: ' + error.message + '\n\nVui lòng đảm bảo tệp đúng định dạng');
                }
            };
            
            input.click();
        }

        // Chỉnh sửa các mục kiến thức trong DLC
        function editDLCKnowledge(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('Gói DLC không tồn tại!');
                return;
            }

            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #667eea; margin: 0;">📝 Chỉnh sửa các mục kiến thức DLC</h2>
                        <button onclick="this.closest('div[style*=position]').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Đóng</button>
                    </div>
                    
                    <div style="background: #f0f2ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">${dlc.name}</h4>
                        <div style="font-size: 13px; color: #666;">${dlc.description || 'Chưa có mô tả'}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">DLC ID: ${dlc.id}</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="font-weight: bold; color: #333;">Các mục kiến thức (Định dạng JSON):</label>
                            <div style="font-size: 12px; color: #666;">Tổng cộng ${dlc.knowledgeItems.length} mục</div>
                        </div>
                        <textarea id="dlcEditKnowledgeInput" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 300px; resize: vertical; font-family: monospace; font-size: 12px;">${JSON.stringify(dlc.knowledgeItems, null, 2)}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                        <button onclick="viewDLCKnowledgeVectorStatus('${dlcId}')" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">📊 Trạng thái vector</button>
                        <button onclick="vectorizeDLCKnowledge('${dlcId}')" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">🧬 Vector hóa</button>
                        <button onclick="this.closest('div[style*=position]').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Hủy</button>
                        <button onclick="confirmEditDLCKnowledge('${dlcId}')" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Lưu thay đổi</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // Xem trạng thái vector hóa của các mục kiến thức trong DLC
        function viewDLCKnowledgeVectorStatus(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('Gói DLC không tồn tại!');
                return;
            }

            // Lấy các mục kiến thức đang được chỉnh sửa
            const knowledgeText = document.getElementById('dlcEditKnowledgeInput').value.trim();
            
            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('Các mục kiến thức phải ở định dạng mảng');
                }
            } catch (error) {
                alert('Lỗi định dạng JSON: ' + error.message);
                return;
            }

            // Thống kê trạng thái vector hóa
            let vectorizedCount = 0;
            let notVectorizedCount = 0;
            let keywordVectorCount = 0;
            let denseVectorCount = 0;
            let alwaysIncludeCount = 0;

            const statusDetails = knowledgeItems.map(item => {
                if (item.vector) {
                    vectorizedCount++;
                    const isDense = Array.isArray(item.vector);
                    if (isDense) {
                        denseVectorCount++;
                    } else {
                        keywordVectorCount++;
                    }
                    return {
                        title: item.title,
                        status: item.alwaysInclude === true ? '⭐ Kiến thức thường trực (Đã vector hóa)' : '✅ Đã vector hóa',
                        method: item.vectorMethod || 'unknown',
                        type: isDense ? 'dense' : 'sparse',
                        color: item.alwaysInclude === true ? '#ffc107' : '#28a745'
                    };
                } else if (item.alwaysInclude === true) {
                    alwaysIncludeCount++;
                    return {
                        title: item.title,
                        status: '⭐ Kiến thức thường trực',
                        method: 'Không cần vector hóa',
                        type: 'always_include',
                        color: '#ffc107'
                    };
                } else {
                    notVectorizedCount++;
                    return {
                        title: item.title,
                    0: '⚪ Chưa vector hóa',
                        method: 'Trống',
                        type: 'none',
                        color: '#6c757d'
                    };
                }
            });

            // Tạo HTML báo cáo trạng thái
            const statusHtml = `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="color: #333; margin: 0 0 15px 0;">📊 Thống kê vector hóa</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #28a745;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${vectorizedCount}</div>
                            <div style="font-size: 12px; color: #666;">Đã vector hóa</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #6c757d;">
                            <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${notVectorizedCount}</div>
                            <div style="font-size: 12px; color: #666;">Chưa vector hóa</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${alwaysIncludeCount}</div>
                            <div style="font-size: 12px; color: #666;">Kiến thức thường trực</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #17a2b8;">
                            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${denseVectorCount}</div>
                            <div style="font-size: 12px; color: #666;">Vector dày đặc</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #6f42c1;">
                            <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${keywordVectorCount}</div>
                            <div style="font-size: 12px; color: #666;">Vector từ khóa</div>
                        </div>
                    </div>
                </div>

                <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
                    <h3 style="color: #333; margin: 0 0 15px 0;">📋 Trạng thái chi tiết</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${statusDetails.map((item, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${item.title}</div>
                                    <div style="font-size: 11px; color: #666;">Phương pháp: ${item.method} | Loại: ${item.type}</div>
                                </div>
                                <div style="padding: 4px 8px; background: ${item.color}; color: white; border-radius: 12px; font-size: 11px; font-weight: 500;">
                                    ${item.status}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // Tạo modal trạng thái
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10002;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #17a2b8; margin: 0;">📊 Trạng thái vector hóa DLC</h2>
                        <button onclick="this.closest('div[style*=position]').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Đóng</button>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;">${dlc.name}</h4>
                        <div style="font-size: 13px; color: #666;">${dlc.description || 'Chưa có mô tả'}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">DLC ID: ${dlc.id}</div>
                    </div>
                    
                    ${statusHtml}
                </div>
            `;

            document.body.appendChild(modal);
        }

        // Vector hóa các mục kiến thức DLC
        async function vectorizeDLCKnowledge(dlcId) {
            if (!window.contextVectorManager) {
                alert('Trình quản lý vector chưa được khởi tạo!');
                return;
            }

            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('Gói DLC không tồn tại!');
                return;
            }

            // Lấy các mục kiến thức - ưu tiên từ giao diện chỉnh sửa, nếu không có thì lấy từ dữ liệu DLC
            let knowledgeItems;
            const editInput = document.getElementById('dlcEditKnowledgeInput');
            
            if (editInput) {
                // Lấy từ giao diện chỉnh sửa
                const knowledgeText = editInput.value.trim();
                try {
                    knowledgeItems = JSON.parse(knowledgeText);
                    if (!Array.isArray(knowledgeItems)) {
                        throw new Error('Các mục kiến thức phải ở định dạng mảng');
                    }
                } catch (error) {
                    alert('Lỗi định dạng JSON: ' + error.message);
                    return;
                }
            } else {
                // Lấy trực tiếp từ dữ liệu DLC
                knowledgeItems = dlc.knowledgeItems;
                if (!Array.isArray(knowledgeItems)) {
                    alert('Định dạng mục kiến thức DLC bị lỗi!');
                    return;
                }
            }

            // Kiểm tra phương pháp vector hóa
            const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';
            
            if (vectorMethod === 'transformers') {
                // Kiểm tra xem transformers đã được tải chưa
                if (!window.transformersLoaded) {
                    const confirmLoad = confirm('🤖 Việc sử dụng mô hình trình duyệt để vector hóa cần tải tệp mô hình khoảng 50MB\n\nBạn có chắc chắn muốn tiếp tục không?');
                    if (!confirmLoad) return;
                }
            } else if (vectorMethod === 'api') {
                // Kiểm tra cấu hình API
                if (!window.extraApiConfig || !window.extraApiConfig.enabled) {
                    alert('❌ API vector hóa chưa được cấu hình\n\nVui lòng bật và cấu hình embeddings API trong "Cài đặt API bổ sung"');
                    return;
                }
            }

            // Hiển thị thông báo tiến độ
            const progressModal = document.createElement('div');
            progressModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
            `;
            
            progressModal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; min-width: 400px;">
                    <div style="color: #28a745; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                        🧬 Đang vector hóa các mục kiến thức DLC...
                    </div>
                    <div class="loading" style="margin: 20px auto;"></div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 15px;">
                        Phương pháp sử dụng: <strong>${vectorMethod === 'keyword' ? 'Khớp từ khóa' : vectorMethod === 'api' ? 'API Vector hóa' : 'Mô hình trình duyệt'}</strong>
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        Đang xử lý mục thứ <span id="vectorizeCurrent">0</span>/${knowledgeItems.length}
                    </div>
                    <div style="margin-top: 15px; font-size: 12px; color: #999;">
                        Vui lòng không đóng cửa sổ này, quá trình này có thể mất vài phút
                    </div>
                </div>
            `;
            
            document.body.appendChild(progressModal);

            try {
                let successCount = 0;
                let errorCount = 0;

                // Nếu dùng phương pháp transformers, hãy tải mô hình trước
                if (vectorMethod === 'transformers' && !window.transformersLoaded) {
                    document.querySelector('#vectorizeCurrent').textContent = 'Đang tải mô hình';
                    await window.loadTransformersJS();
                    window.transformersLoaded = true;
                }

                // Vector hóa từng mục kiến thức một
                for (let i = 0; i < knowledgeItems.length; i++) {
                    const item = knowledgeItems[i];
                    
                    try {
                        // Cập nhật tiến độ
                        document.querySelector('#vectorizeCurrent').textContent = i + 1;
                        
                        // Tạo vector
                        let vector;
                        const textForVector = `${item.title}\n${item.content}`;
                        
                        if (vectorMethod === 'keyword') {
                            vector = window.contextVectorManager.createKeywordVector(textForVector);
                        } else if (vectorMethod === 'api') {
                            vector = await window.contextVectorManager.getEmbeddingFromAPI(textForVector);
                        } else if (vectorMethod === 'transformers') {
                            vector = await window.contextVectorManager.getEmbeddingFromTransformers(textForVector);
                        }

                        // Cập nhật vector của mục
                        item.vector = vector;
                        item.vectorType = Array.isArray(vector) ? 'dense' : 'sparse';
                        item.vectorizedAt = new Date().toISOString();
                        item.vectorMethod = vectorMethod;
                        
                        successCount++;
                        console.log(`[DLC Vector hóa] ✅ ${item.title} (${item.vectorType})`);
                        
                    } catch (error) {
                        errorCount++;
                        console.error(`[DLC Vector hóa] ❌ ${item.title}:`, error);
                        
                        // Khi thất bại, dùng phương pháp từ khóa làm dự phòng
                        try {
                            const textForVector = `${item.title}\n${item.content}`;
                            const fallbackVector = window.contextVectorManager.createKeywordVector(textForVector);
                            item.vector = fallbackVector;
                            item.vectorType = 'sparse';
                            item.vectorizedAt = new Date().toISOString();
                            item.vectorMethod = 'keyword_fallback';
                            successCount++;
                            console.log(`[DLC Vector hóa] 🔄 ${item.title} (Dự phòng bằng từ khóa)`);
                        } catch (fallbackError) {
                            console.error(`[DLC Vector hóa] ❌ ${item.title} Dự phòng bằng từ khóa cũng thất bại:`, fallbackError);
                        }
                    }
                }

                // Cập nhật các mục kiến thức DLC
                const wasActive = dlc.activated;
                
                // Nếu DLC đã kích hoạt, hãy ngừng kích hoạt nó trước
                if (wasActive) {
                    await window.dlcManager.deactivateDLC(dlcId);
                }

                dlc.knowledgeItems = knowledgeItems;
                dlc.updatedAt = new Date().toISOString();
                dlc.vectorizedAt = new Date().toISOString();
                dlc.vectorMethod = vectorMethod;
                
                await window.dlcManager.saveDLCToIndexedDB();

                // Nếu trước đó đang ở trạng thái kích hoạt, hãy kích hoạt lại
                if (wasActive) {
                    await window.dlcManager.activateDLC(dlcId);
                }

                // Cập nhật khung văn bản của giao diện chỉnh sửa (nếu có)
                const editInput = document.getElementById('dlcEditKnowledgeInput');
                if (editInput) {
                    editInput.value = JSON.stringify(knowledgeItems, null, 2);
                }

                // Gỡ bỏ thông báo tiến độ
                progressModal.remove();

                // Hiển thị kết quả
                let resultMessage = `✅ Hoàn tất vector hóa DLC!\n\n`;
                resultMessage += `📊 Kết quả xử lý:\n`;
                resultMessage += `   - Tổng số mục: ${knowledgeItems.length}\n`;
                resultMessage += `   - Thành công: ${successCount}\n`;
                resultMessage += `   - Thất bại: ${errorCount}\n`;
                resultMessage += `   - Phương pháp: ${vectorMethod === 'keyword' ? 'Khớp từ khóa' : vectorMethod === 'api' ? 'API Vector hóa' : 'Mô hình trình duyệt'}\n\n`;
                resultMessage += `💡 Các mục đã vector hóa sẽ được dùng để truy xuất thông minh\n`;
                resultMessage += `🔄 Đã tự động lưu và cập nhật gói DLC`;

                alert(resultMessage);

                // Làm mới giao diện quản lý DLC để hiển thị trạng thái vector hóa mới nhất
                const manageModal = document.getElementById('dlcManageModal');
                if (manageModal) {
                    // Render lại danh sách DLC
                    manageDLC();
                }

            } catch (error) {
                progressModal.remove();
                alert(`❌ Vector hóa thất bại: ${error.message}\n\nGợi ý:\n- Kiểm tra kết nối mạng\n- Thử sử dụng phương pháp khớp từ khóa\n- Xem Console để biết thêm chi tiết`);
                console.error('[DLC Vector hóa] Thất bại:', error);
            }
        }

        // Xác nhận chỉnh sửa các mục kiến thức DLC
        async function confirmEditDLCKnowledge(dlcId) {
            const knowledgeText = document.getElementById('dlcEditKnowledgeInput').value.trim();

            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('Các mục kiến thức phải ở định dạng mảng');
                }
            } catch (error) {
                alert('Lỗi định dạng JSON: ' + error.message);
                return;
            }

            // Kiểm tra định dạng các mục kiến thức
            for (let i = 0; i < knowledgeItems.length; i++) {
                const item = knowledgeItems[i];
                if (!item.id || !item.title || !item.content) {
                    alert(`Mục kiến thức thứ ${i+1} thiếu các trường bắt buộc (id, title hoặc content)`);
                    return;
                }
            }

            try {
                const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
                const wasActive = dlc.activated;
                
                // Nếu DLC đang được kích hoạt, hãy ngừng kích hoạt trước
                if (wasActive) {
                    await window.dlcManager.deactivateDLC(dlcId);
                }

                // Cập nhật các mục kiến thức
                dlc.knowledgeItems = knowledgeItems;
                dlc.updatedAt = new Date().toISOString();
                
                await window.dlcManager.saveDLCToIndexedDB();

                // Nếu trước đó đang ở trạng thái kích hoạt, hãy kích hoạt lại
                if (wasActive) {
                    await window.dlcManager.activateDLC(dlcId);
                }

                alert(`✅ Cập nhật các mục kiến thức DLC thành công!\n\nĐã cập nhật ${knowledgeItems.length} mục kiến thức`);
                document.querySelector('div[style*="position: fixed"]').remove();
                manageDLC(); // Làm mới giao diện quản lý
            } catch (error) {
                alert('❌ Cập nhật thất bại: ' + error.message);
            }
        }

        // 🔧 Công khai các hàm quản lý DLC ra phạm vi toàn cục để dùng cho sự kiện onclick trong HTML
        window.createNewDLC = createNewDLC;
        window.importDLC = importDLC;
        window.manageDLC = manageDLC;
        window.exportAllDLC = exportAllDLC;

        // ==================== Kết thúc Hệ thống quản lý DLC ====================