/**
 * Trò chơi Tu Tiên - Hệ thống chiến đấu theo lượt hoàn chỉnh
 */

// combatState đã được định nghĩa trong combat-system-part1.js, ở đây không khai báo lại

/**
 * Khởi động chiến đấu
 */
function startCombat(enemyInfo) {
    console.log('🎮 Khởi động chiến đấu:', enemyInfo);
    
    combatState.combatStartInfo = enemyInfo;
    
    // Khởi tạo dữ liệu người chơi
    const playerData = {
        name: gameState.variables.name || "Người chơi",
        realm: gameState.variables.realm || "Phàm nhân",
        hp: gameState.variables.hp || 100,
        hpMax: gameState.variables.hpMax || 100,
        mp: gameState.variables.mp || 100,
        mpMax: gameState.variables.mpMax || 100,
        attributes: gameState.variables.attributes || {
            physique: 10, comprehension: 10, spirituality: 10,
            luck: 10, charm: 10, willpower: 10
        },
        techniques: gameState.variables.techniques || [],
        spells: gameState.variables.spells || [],
        effects: []
    };
    
    // Tạo dữ liệu kẻ địch
    const realmConfig = REALM_CONFIG[enemyInfo.realmLevel] || REALM_CONFIG[1];
    const enemyHp = rollDice(realmConfig.hp.min, realmConfig.hp.max);
    const enemyMp = rollDice(realmConfig.mp.min, realmConfig.mp.max);
    
    const enemyData = {
        name: enemyInfo.name,
        realm: enemyInfo.realm,
        realmLevel: enemyInfo.realmLevel,
        hp: enemyHp,
        hpMax: enemyHp,
        mp: enemyMp,
        mpMax: enemyMp,
        attributes: enemyInfo.attributes,
        techniques: enemyInfo.techniques.length > 0 ? enemyInfo.techniques : 
                    getRandomItems(TECHNIQUES[enemyInfo.realmLevel] || TECHNIQUES[1], 2),
        spells: enemyInfo.spells.length > 0 ? enemyInfo.spells : 
                getRandomItems(SPELLS[enemyInfo.realmLevel] || SPELLS[1], 2),
        effects: []
    };
    
    // Khởi tạo trạng thái chiến đấu
    combatState.isActive = true;
    combatState.player = playerData;
    combatState.enemy = enemyData;
    combatState.currentTurn = 'player';
    combatState.turnCount = 1;
    combatState.combatLog = [];
    combatState.playerMomentum = 0;
    combatState.enemyMomentum = 0;
    
    addCombatLog(`⚔️ Trận chiến bắt đầu! ${playerData.name} VS ${enemyData.name}`);
    addCombatLog(`${enemyData.name}（${enemyData.realm}）- HP:${enemyData.hp}/${enemyData.hpMax} MP:${enemyData.mp}/${enemyData.mpMax}`);
    
    showCombatUI();
    
    // Đảm bảo DOM được tạo hoàn toàn trước khi render UI
    setTimeout(() => {
        renderCombatUI();
    }, 100);
}

/**
 * Hiển thị giao diện chiến đấu
 */
function showCombatUI() {
    let combatModal = document.getElementById('combatModal');
    if (!combatModal) {
        // Nếu modal chưa tồn tại, tạo mới
        combatModal = document.createElement('div');
        combatModal.id = 'combatModal';
        combatModal.className = 'combat-modal';
        document.body.appendChild(combatModal);
    }
    
    // Thiết lập nội dung HTML dù modal đã tồn tại hay chưa
    combatModal.innerHTML = `
        <div class="combat-container">
            <div class="combat-header">
                <h2>⚔️ Chiến đấu theo lượt</h2>
                <div class="combat-header-controls">
                    <span class="combat-turn">Hiệp <span id="combatTurnNum">1</span></span>
                    <button class="combat-restart-btn" onclick="restartCombat()" title="Thách thức lại">🔄</button>
                    <button class="combat-close-btn" onclick="closeCombat()" title="Đóng chiến đấu">✖</button>
                </div>
            </div>
            
            <div class="combat-battlefield">
                <div class="combat-character player-side">
                    <div class="character-name" id="playerName">Người chơi</div>
                    <div class="character-hp">
                        <div class="hp-bar-container">
                            <div class="hp-bar" id="playerHpBar" style="width: 100%"></div>
                            <span class="hp-text" id="playerHpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-mp">
                        <div class="mp-bar-container">
                            <div class="mp-bar" id="playerMpBar" style="width: 100%"></div>
                            <span class="mp-text" id="playerMpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-momentum">
                        <span>💨 Khí thế:</span>
                        <div class="momentum-bar">
                            <div class="momentum-fill" id="playerMomentum" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="character-effects" id="playerEffects"></div>
                </div>
                
                <div class="combat-vs">VS</div>
                
                <div class="combat-character enemy-side">
                    <div class="character-name" id="enemyName">Kẻ địch</div>
                    <div class="character-hp">
                        <div class="hp-bar-container">
                            <div class="hp-bar" id="enemyHpBar" style="width: 100%"></div>
                            <span class="hp-text" id="enemyHpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-mp">
                        <div class="mp-bar-container">
                            <div class="mp-bar" id="enemyMpBar" style="width: 100%"></div>
                            <span class="mp-text" id="enemyMpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-momentum">
                        <span>💨 Khí thế:</span>
                        <div class="momentum-bar">
                            <div class="momentum-fill" id="enemyMomentum" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="character-effects" id="enemyEffects"></div>
                </div>
            </div>
            
            <div class="combat-log-container">
                <div class="combat-log" id="combatLog"></div>
            </div>
            
            <div class="combat-skills" id="combatSkills">
                <div class="skills-title">Chọn hành động</div>
                <div class="skills-tabs">
                    <button class="skill-tab active" onclick="switchSkillTab('techniques')">Công pháp</button>
                    <button class="skill-tab" onclick="switchSkillTab('spells')">Pháp thuật</button>
                </div>
                <div class="skills-list" id="skillsList"></div>
            </div>
        </div>
    `;
    
    combatModal.style.display = 'flex';
}

/**
 * Ẩn giao diện chiến đấu
 */
function hideCombatUI() {
    const combatModal = document.getElementById('combatModal');
    if (combatModal) {
        combatModal.style.display = 'none';
    }
}

/**
 * Đóng giao diện chiến đấu
 */
function closeCombat() {
    console.log('🚪 Đóng giao diện chiến đấu');
    hideCombatUI();
    
    // Xóa trạng thái chiến đấu
    if (typeof combatState !== 'undefined') {
        combatState.isInCombat = false;
        combatState.currentEnemy = null;
    }
    
    // Xóa thông tin chiến đấu lưu tạm
    if (window.pendingCombatInfo) {
        window.pendingCombatInfo = null;
    }
}

/**
 * Thách thức lại
 */
function restartCombat() {
    console.log('🔄 Thách thức lại');
    
    // Kiểm tra có kẻ địch hiện tại không
    if (typeof combatState !== 'undefined' && combatState.currentEnemy) {
        // Đặt lại trạng thái chiến đấu
        combatState.turn = 1;
        combatState.playerHp = combatState.playerMaxHp;
        combatState.playerMp = combatState.playerMaxMp;
        combatState.enemyHp = combatState.enemyMaxHp;
        combatState.enemyMp = combatState.enemyMaxMp;
        combatState.playerMomentum = 0;
        combatState.enemyMomentum = 0;
        combatState.playerEffects = [];
        combatState.enemyEffects = [];
        
        // Đặt lại thời gian hồi chiêu
        if (combatState.playerTechniques) {
            combatState.playerTechniques.forEach(tech => tech.currentCooldown = 0);
        }
        if (combatState.playerSpells) {
            combatState.playerSpells.forEach(spell => spell.currentCooldown = 0);
        }
        if (combatState.enemyTechniques) {
            combatState.enemyTechniques.forEach(tech => tech.currentCooldown = 0);
        }
        if (combatState.enemySpells) {
            combatState.enemySpells.forEach(spell => spell.currentCooldown = 0);
        }
        
        // Render lại giao diện
        renderCombatUI();
        
        // Thêm nhật ký bắt đầu lại
        addCombatLog('🔄 Trận chiến bắt đầu lại!');
    } else {
        console.warn('⚠️ Không tìm thấy kẻ địch hiện tại, không thể thách thức lại');
        alert('Không tìm thấy kẻ địch có thể thách thức lại');
    }
}

/**
 * Render giao diện chiến đấu
 */
function renderCombatUI() {
    // Kiểm tra giao diện chiến đấu có tồn tại không
    const combatModal = document.getElementById('combatModal');
    if (!combatModal) {
        console.error('❌ Modal chiến đấu không tồn tại, không thể render UI');
        return;
    }
    
    // Cập nhật các phần tử một cách an toàn
    const turnNum = document.getElementById('combatTurnNum');
    if (turnNum) turnNum.textContent = combatState.turnCount;
    
    const playerName = document.getElementById('playerName');
    if (playerName) playerName.textContent = combatState.player.name;
    
    updateHPBar('player', combatState.player.hp, combatState.player.hpMax);
    updateMPBar('player', combatState.player.mp, combatState.player.mpMax);
    updateMomentum('player', combatState.playerMomentum);
    
    const enemyName = document.getElementById('enemyName');
    if (enemyName) enemyName.textContent = `${combatState.enemy.name}（${combatState.enemy.realm}）`;
    
    updateHPBar('enemy', combatState.enemy.hp, combatState.enemy.hpMax);
    updateMPBar('enemy', combatState.enemy.mp, combatState.enemy.mpMax);
    updateMomentum('enemy', combatState.enemyMomentum);
    
    renderSkills('techniques');
    renderCombatLog();
}

/**
 * Cập nhật thanh máu (HP)
 */
function updateHPBar(side, hp, hpMax) {
    const percentage = Math.max(0, Math.min(100, (hp / hpMax) * 100));
    const hpBar = document.getElementById(`${side}HpBar`);
    const hpText = document.getElementById(`${side}HpText`);
    
    if (hpBar) {
        hpBar.style.width = percentage + '%';
        if (percentage > 50) {
            hpBar.style.background = 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)';
        } else if (percentage > 25) {
            hpBar.style.background = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
        } else {
            hpBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
        }
    }
    
    if (hpText) {
        hpText.textContent = `${Math.max(0, Math.floor(hp))}/${hpMax}`;
    }
}

/**
 * Cập nhật thanh năng lượng (MP)
 */
function updateMPBar(side, mp, mpMax) {
    const percentage = Math.max(0, Math.min(100, (mp / mpMax) * 100));
    const mpBar = document.getElementById(`${side}MpBar`);
    const mpText = document.getElementById(`${side}MpText`);
    
    if (mpBar) mpBar.style.width = percentage + '%';
    if (mpText) mpText.textContent = `${Math.max(0, Math.floor(mp))}/${mpMax}`;
}

/**
 * Cập nhật khí thế (Momentum)
 */
function updateMomentum(side, momentum) {
    const momentumBar = document.getElementById(`${side}Momentum`);
    if (momentumBar) {
        momentumBar.style.width = Math.max(0, Math.min(100, momentum)) + '%';
    }
}

/**
 * Cập nhật hiệu ứng trạng thái
 */
function updateEffects(side) {
    const effectsContainer = document.getElementById(`${side}Effects`);
    if (!effectsContainer) return;
    
    const effects = side === 'player' ? combatState.player.effects : combatState.enemy.effects;
    effectsContainer.innerHTML = effects.map(effect => {
        const desc = EFFECT_DESCRIPTIONS[effect.type] || effect.type;
        return `<span class="effect-badge ${effect.type}">${desc}</span>`;
    }).join('');
}

/**
 * Chuyển đổi tab kỹ năng
 */
function switchSkillTab(tab) {
    const tabs = document.querySelectorAll('.skill-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = Array.from(tabs).find(t => 
        (tab === 'techniques' && t.textContent.includes('Công pháp')) ||
        (tab === 'spells' && t.textContent.includes('Pháp thuật'))
    );
    if (activeTab) activeTab.classList.add('active');
    
    renderSkills(tab);
}

/**
 * Render danh sách kỹ năng
 */
function renderSkills(type) {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    skillsList.innerHTML = '';
    let skills = type === 'techniques' ? combatState.player.techniques : combatState.player.spells;
    
    // Nếu không có kỹ năng, tự động thêm kỹ năng "Đánh đấm"
    if (!skills || skills.length === 0) {
        const punchSkill = {
            name: "Đánh đấm",
            power: 15,
            mpCost: 0,
            cooldown: 0,
            currentCooldown: 0,
            description: "Tấn công vật lý cơ bản"
        };
        
        // Tạo mảng kỹ năng tạm thời
        skills = [punchSkill];
        
        // Nếu là công pháp và không có công pháp, thêm vào dữ liệu người chơi
        if (type === 'techniques' && !combatState.player.techniques) {
            combatState.player.techniques = [punchSkill];
        }
        // Nếu là pháp thuật và không có pháp thuật, thêm vào dữ liệu người chơi
        else if (type === 'spells' && !combatState.player.spells) {
            combatState.player.spells = [punchSkill];
        }
    }
    
    skills.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        
        const canUse = combatState.player.mp >= skill.mpCost && 
                      (!skill.currentCooldown || skill.currentCooldown === 0);
        
        if (!canUse) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
        
        let info = `<div class="skill-name">${skill.name}</div><div class="skill-info">
            <span>💥 ${skill.power}</span><span>💧 ${skill.mpCost}</span>`;
        
        if (skill.currentCooldown && skill.currentCooldown > 0) {
            info += `<span class="skill-cooldown">⏰ ${skill.currentCooldown}</span>`;
        }
        info += `</div>`;
        
        btn.innerHTML = info;
        btn.onclick = () => { if (canUse) useSkill(type, skill); };
        skillsList.appendChild(btn);
    });
}

/**
 * Sử dụng kỹ năng
 */
function useSkill(type, skill) {
    if (combatState.currentTurn !== 'player') return;
    
    combatState.combatLog.push(`\n--- Hiệp ${combatState.turnCount}: Người chơi hành động ---`);
    combatState.player.mp -= skill.mpCost;
    
    let damage = skill.power;
    damage += Math.floor((combatState.player.attributes.physique || 10) * 0.5);
    damage -= Math.floor((combatState.enemy.attributes.physique || 10) * 0.2);
    
    const momentum = combatState.playerMomentum;
    damage += Math.floor(damage * momentum / 200);
    
    const luck = combatState.player.attributes.luck || 10;
    const critChance = Math.min(30, luck * 1.5);
    const isCrit = Math.random() * 100 < critChance;
    
    if (isCrit) {
        damage = Math.floor(damage * 1.8);
        combatState.combatLog.push(`💥 Bạo kích! ${combatState.player.name} sử dụng ${skill.name} gây ra ${damage} điểm sát thương!`);
    } else {
        combatState.combatLog.push(`⚔️ ${combatState.player.name} sử dụng ${skill.name} gây ra ${damage} điểm sát thương`);
    }
    
    combatState.enemy.hp -= damage;
    combatState.playerMomentum = Math.min(100, combatState.playerMomentum + 10);
    
    if (skill.cooldown > 0) skill.currentCooldown = skill.cooldown;
    
    renderCombatUI();
    
    if (combatState.enemy.hp <= 0) {
        endCombat('victory');
        return;
    }
    
    setTimeout(() => {
        combatState.currentTurn = 'enemy';
        enemyTurn();
    }, 1500);
}

/**
 * Lượt của kẻ địch
 */
function enemyTurn() {
    combatState.combatLog.push(`\n--- Hiệp ${combatState.turnCount}: Kẻ địch hành động ---`);
    
    const allSkills = [...combatState.enemy.techniques, ...combatState.enemy.spells];
    const available = allSkills.filter(s => 
        combatState.enemy.mp >= s.mpCost && (!s.currentCooldown || s.currentCooldown === 0)
    );
    
    let skill;
    if (available.length > 0) {
        skill = available[Math.floor(Math.random() * available.length)];
    } else {
        skill = { name: "Tấn công thường", power: 10, mpCost: 0, effects: [] };
    }
    
    combatState.enemy.mp -= skill.mpCost;
    
    let damage = skill.power;
    damage += Math.floor((combatState.enemy.attributes.physique || 10) * 0.5);
    damage -= Math.floor((combatState.player.attributes.physique || 10) * 0.2);
    
    const momentum = combatState.enemyMomentum;
    damage += Math.floor(damage * momentum / 200);
    
    const luck = combatState.enemy.attributes.luck || 10;
    const critChance = Math.min(30, luck * 1.5);
    const isCrit = Math.random() * 100 < critChance;
    
    if (isCrit) {
        damage = Math.floor(damage * 1.8);
        combatState.combatLog.push(`💥 Bạo kích! ${combatState.enemy.name} sử dụng ${skill.name} gây ra ${damage} điểm sát thương!`);
    } else {
        combatState.combatLog.push(`⚔️ ${combatState.enemy.name} sử dụng ${skill.name} gây ra ${damage} điểm sát thương`);
    }
    
    combatState.player.hp -= damage;
    combatState.enemyMomentum = Math.min(100, combatState.enemyMomentum + 10);
    
    if (skill.cooldown > 0) skill.currentCooldown = skill.cooldown;
    
    renderCombatUI();
    
    if (combatState.player.hp <= 0) {
        endCombat('defeat');
        return;
    }
    
    setTimeout(() => {
        combatState.turnCount++;
        combatState.currentTurn = 'player';
        renderCombatUI();
    }, 1500);
}

/**
 * Kết thúc chiến đấu
 */
function endCombat(result) {
    combatState.isActive = false;
    
    if (result === 'victory') {
        combatState.combatLog.push(`\n🎉 Chiến thắng! ${combatState.enemy.name} đã bị đánh bại!`);
        showCombatResult('victory');
    } else {
        combatState.combatLog.push(`\n💀 Thất bại! ${combatState.player.name} đã bị đánh bại...`);
        showCombatResult('defeat');
    }
    
    renderCombatUI();
}

/**
 * Hiển thị kết quả chiến đấu
 */
function showCombatResult(result) {
    const container = document.getElementById('combatSkills');
    if (!container) return;
    
    if (result === 'victory') {
        container.innerHTML = `
            <div class="combat-result">
                <h3>🎉 Chiến thắng!</h3>
                <p>Bạn đã đánh bại ${combatState.enemy.name}（${combatState.enemy.realm}）</p>
                <div class="result-options">
                    <button class="result-btn" onclick="finishCombat('kill')">⚔️ Xử quyết</button>
                    <button class="result-btn" onclick="finishCombat('release')">🕊️ Thả đi</button>
                    <button class="result-btn" onclick="finishCombat('rape')">🔞 Cường bạo</button>
                    <button class="result-btn" onclick="finishCombat('custom')">✏️ Tùy chỉnh</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="combat-result">
                <h3>💀 Thất bại...</h3>
                <p>${combatState.player.name} bị ${combatState.enemy.name} đánh bại</p>
                <div class="result-options">
                    <button class="result-btn" onclick="finishCombat('defeat')">💔 Kết cục mặc định</button>
                    <button class="result-btn" onclick="finishCombat('beg')">🙏 Cầu xin tha mạng</button>
                    <button class="result-btn" onclick="finishCombat('escape')">🏃 Bỏ chạy</button>
                    <button class="result-btn" onclick="finishCombat('seduce')">💋 Dùng sắc dụ dỗ</button>
                    <button class="result-btn" onclick="showCustomDefeatInput()">✏️ Tùy chỉnh</button>
                </div>
                <div id="custom-defeat-input" style="display: none; margin-top: 15px;">
                    <textarea id="defeat-custom-text" placeholder="Mô tả diễn biến sau khi thất bại..." rows="3" style="width: 100%; margin-bottom: 10px;"></textarea>
                    <button class="result-btn" onclick="submitCustomDefeat()">Gửi</button>
                    <button class="result-btn" onclick="hideCustomDefeatInput()">Hủy</button>
                </div>
            </div>
        `;
    }
}

/**
 * Hiển thị nhập tùy chỉnh
 */
function showCustomInput() {
    const container = document.getElementById('combatSkills');
    if (!container) return;
    
    container.innerHTML = `
        <div class="combat-result">
            <h3>✏️ Cách xử lý tùy chỉnh</h3>
            <textarea id="customActionText" placeholder="Hãy nhập những gì bạn muốn làm với ${combatState.enemy.name}..." rows="4" cols="50"></textarea>
            <div class="result-options">
                <button class="result-btn" onclick="finishCombatWithCustom()">Xác nhận</button>
                <button class="result-btn" onclick="showCombatResult('victory')">Quay lại</button>
            </div>
        </div>
    `;
}

/**
 * Hoàn tất chiến đấu với tùy chỉnh
 */
function finishCombatWithCustom() {
    const customText = document.getElementById('customActionText').value;
    if (customText && customText.trim()) {
        finishCombat('custom', customText);
    } else {
        alert('Vui lòng nhập cách xử lý tùy chỉnh');
    }
}

/**
 * Hiển thị nhập tùy chỉnh khi thất bại
 */
function showCustomDefeatInput() {
    const inputDiv = document.getElementById('custom-defeat-input');
    if (inputDiv) {
        inputDiv.style.display = 'block';
        // Focus vào khung văn bản
        setTimeout(() => {
            const textarea = document.getElementById('defeat-custom-text');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    }
}

/**
 * Ẩn nhập tùy chỉnh khi thất bại
 */
function hideCustomDefeatInput() {
    const inputDiv = document.getElementById('custom-defeat-input');
    if (inputDiv) {
        inputDiv.style.display = 'none';
        const textarea = document.getElementById('defeat-custom-text');
        if (textarea) {
            textarea.value = '';
        }
    }
}

/**
 * Gửi xử lý thất bại tùy chỉnh
 */
function submitCustomDefeat() {
    const textarea = document.getElementById('defeat-custom-text');
    if (!textarea) return;
    
    const customText = textarea.value.trim();
    if (!customText) {
        alert('Vui lòng nhập mô tả diễn biến sau thất bại');
        return;
    }
    
    finishCombat('custom-defeat', customText);
}

/**
 * Hoàn tất chiến đấu
 */
async function finishCombat(action, customText = '') {
    let report = `\n【Báo cáo chiến đấu】\n`;
    report += `Đối đầu: ${combatState.player.name} VS ${combatState.enemy.name}（${combatState.enemy.realm}）\n`;
    report += `Kết quả: `;
    
    if (action === 'defeat') {
        report += `Bại trận\n`;
    } else if (action === 'beg') {
        report += `Sau khi bại trận đã cầu xin ${combatState.enemy.name} tha mạng\n`;
    } else if (action === 'escape') {
        report += `Sau khi bại trận đã cố gắng bỏ chạy\n`;
    } else if (action === 'seduce') {
        report += `Sau khi bại trận đã tìm cách dùng sắc dụ dỗ để cầu sinh\n`;
    } else if (action === 'custom-defeat') {
        report += `Sau khi bại trận đã ${customText}\n`;
    } else {
        report += `Chiến thắng\n`;
        report += `Cách xử lý: `;
        
        switch(action) {
            case 'kill':
                report += `Đã xử quyết ${combatState.enemy.name}`;
                break;
            case 'release':
                report += `Đã thả ${combatState.enemy.name} đi`;
                break;
            case 'rape':
                report += `Đã cưỡng bức ${combatState.enemy.name}`;
                break;
            case 'custom':
                report += `Đã thực hiện với ${combatState.enemy.name}: ${customText}`;
                break;
        }
    }
    report += `\nNhật ký chiến đấu:\n${combatState.combatLog.slice(-10).join('\n')}`;
    
    // Cập nhật trạng thái người chơi
    gameState.variables.hp = Math.max(1, combatState.player.hp);
    gameState.variables.mp = Math.max(0, combatState.player.mp);
    
    hideCombatUI();
    
    // Xóa thông tin chiến đấu đã sử dụng
    window.pendingCombatInfo = null;
    console.log('🧹 Chiến đấu kết thúc, đã dọn dẹp thông tin chiến đấu');
    
    // Gửi báo cáo chiến đấu cho AI
    if (!gameState.isProcessing) {
        gameState.isProcessing = true;
        
        displayUserMessage(report);
        gameState.conversationHistory.push({ role: 'user', content: report });
        gameState.variableSnapshots.push(JSON.parse(JSON.stringify(gameState.variables)));
        
        const historyDiv = document.getElementById('gameHistory');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI đang suy nghĩ...</div>';
        loadingDiv.id = 'loading-message';
        historyDiv.appendChild(loadingDiv);
        
        try {
            const response = await callAI(report, false, report);
            const loading = document.getElementById('loading-message');
            if (loading) loading.remove();
            handleAIResponse(response);
            generateDynamicWorld().catch(err => console.error('[Thế giới động] Lỗi tạo:', err));
        } catch (error) {
            const loading = document.getElementById('loading-message');
            if (loading) loading.remove();
            displayErrorMessageWithRetry('AI phản hồi thất bại: ' + error.message, () => {
                document.getElementById('error-message-with-retry')?.remove();
                finishCombat(action, customText);
            });
        }
        
        gameState.isProcessing = false;
    }
}

console.log('✅ Hệ thống chiến đấu tải hoàn tất! Hàm startCombat đã được định nghĩa.');
