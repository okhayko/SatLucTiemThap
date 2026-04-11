/**
 * 角色创建系统模块
 * 包含：出身选择、天赋系统、属性分配、角色确认等
 * 从 game.html 中提取
 */

// ==================== 角色创建系统 ====================

/**
 * 初始化出身列表
 */
function initializeOrigins() {
    // 检查origins数据是否存在
    if (!window.origins || !Array.isArray(window.origins)) {
        console.error('[角色创建] ❌ origins 数据不存在或不是数组:', window.origins);
        return;
    }

    console.log('[角色创建] 📋 开始初始化出身列表，数量:', window.origins.length);

    const originGrid = document.getElementById('originGrid');
    if (!originGrid) {
        console.error('[角色创建] ❌ originGrid 元素不存在');
        return;
    }

    originGrid.innerHTML = '';

    window.origins.forEach(origin => {
        const card = document.createElement('div');
        card.className = 'origin-card';
        card.setAttribute('data-origin-id', origin.id);
        if (origin.id === characterCreation.selectedOrigin) {
            card.classList.add('selected');
        }
        card.onclick = () => selectOrigin(origin.id);

        // 构建属性效果HTML
        let effectsHTML = '';
        if (Object.keys(origin.attributeEffects).length > 0) {
            effectsHTML = Object.entries(origin.attributeEffects).map(([attr, value]) => {
                const attrName = getAttributeName(attr);
                return `<span class="origin-card-feature">${attrName}${value > 0 ? '+' : ''}${value}</span>`;
            }).join('');
        }

        // 构建点数修正文本
        const pointsText = origin.pointsModifier !== 0
            ? `${origin.pointsModifier > 0 ? '+' : ''}${origin.pointsModifier} 点数`
            : '0 点数';

        card.innerHTML = `
            <div class="origin-card-header">
                <div class="origin-card-title">${origin.name}</div>
                <div class="origin-card-badge">${pointsText}</div>
            </div>
            <div class="origin-card-description">${origin.description}</div>
            <div class="origin-card-features">
                ${effectsHTML}
            </div>
        `;

        originGrid.appendChild(card);
    });
}

/**
 * 选择出身
 */
function selectOrigin(originId) {
    const oldOrigin = window.origins.find(o => o.id === characterCreation.selectedOrigin);
    const newOrigin = window.origins.find(o => o.id === originId);
    if (!newOrigin) return;

    // 移除旧出身的效果
    if (oldOrigin) {
        characterCreation.remainingPoints -= oldOrigin.pointsModifier;
        Object.entries(oldOrigin.attributeEffects).forEach(([attr, value]) => {
            characterCreation.baseAttributes[attr] -= value;
        });
    }

    // 应用新出身的效果
    characterCreation.selectedOrigin = originId;
    characterCreation.remainingPoints += newOrigin.pointsModifier;
    Object.entries(newOrigin.attributeEffects).forEach(([attr, value]) => {
        characterCreation.baseAttributes[attr] += value;
    });

    // 更新UI
    document.querySelectorAll('.origin-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-origin-id="${originId}"]`).classList.add('selected');

    updatePointsDisplay();
    updateAttributesDisplay();
}

/**
 * 初始化天赋列表
 */
function initializeTalents() {
    // 调试信息：检查 window.talents 状态
    console.log('[角色创建] 🔍 调试信息:');
    console.log('  - window.talents 是否存在:', typeof window.talents !== 'undefined');
    console.log('  - window.talents 类型:', typeof window.talents);
    console.log('  - window.talents 值:', window.talents);

    // 检查talents数据是否存在
    if (!window.talents || !Array.isArray(window.talents)) {
        console.error('[角色创建] ❌ talents 数据不存在或不是数组:', window.talents);

        // 使用内联备用天赋数据
        console.log('[角色创建] 🔄 使用内联备用天赋数据...');
        window.talents = [
            // 正面天赋（消耗点数）
            {
                id: 'genius',
                name: '天赋异禀',
                type: 'positive',
                cost: -15,
                description: '天生灵根超凡，修炼速度极快',
                effects: { comprehension: 8, potential: 5 }
            },
            {
                id: 'strong_body',
                name: '先天道体',
                type: 'positive',
                cost: -10,
                description: '天生道体，根骨绝佳',
                effects: { physique: 10, spirit: 5 }
            },
            {
                id: 'lucky_star',
                name: '气运之子',
                type: 'positive',
                cost: -10,
                description: '天生好运，容易获得机缘',
                effects: { fortune: 15, charisma: 3 }
            },
            {
                id: 'swift_comprehension',
                name: '过目不忘',
                type: 'positive',
                cost: -8,
                description: '悟性惊人，领悟力超群',
                effects: { comprehension: 12 }
            },
            {
                id: 'charm_master',
                name: '倾国倾城',
                type: 'positive',
                cost: -10,
                description: '容貌出众，魅力超群',
                effects: { charisma: 10, fortune: 3 }
            },
            // 负面天赋（增加点数）
            {
                id: 'weak_body',
                name: '体弱多病',
                type: 'negative',
                cost: 15,
                description: '身体虚弱，根骨欠佳',
                effects: { physique: -8, spirit: -4 }
            },
            {
                id: 'bad_luck',
                name: '霉运缠身',
                type: 'negative',
                cost: 15,
                description: '运气不佳，容易遇到麻烦',
                effects: { fortune: -10 }
            },
            {
                id: 'slow_mind',
                name: '愚钝迟缓',
                type: 'negative',
                cost: 10,
                description: '资质平庸，悟性较差',
                effects: { comprehension: -8 }
            }
        ];
        console.log('[角色创建] ✅ 备用天赋数据已加载，数量:', window.talents.length);
    }

    console.log('[角色创建] ✨ 开始初始化天赋列表，数量:', window.talents.length);

    const talentGrid = document.getElementById('talentGrid');
    if (!talentGrid) {
        console.error('[角色创建] ❌ talentGrid 元素不存在');
        return;
    }

    talentGrid.innerHTML = '';

    window.talents.forEach(talent => {
        const card = document.createElement('div');
        card.className = `talent-card ${talent.type}`;
        card.setAttribute('data-talent-id', talent.id);
        card.onclick = () => toggleTalent(talent.id);

        const effectsHTML = Object.entries(talent.effects).map(([attr, value]) => {
            const attrName = getAttributeName(attr);
            return `<span class="talent-card-feature">${attrName}${value > 0 ? '+' : ''}${value}</span>`;
        }).join('');

        const costText = `${talent.cost > 0 ? '+' : ''}${talent.cost} 点数`;

        card.innerHTML = `
            <div class="talent-card-header">
                <div class="talent-card-title">${talent.name}</div>
                <div class="talent-card-badge">${costText}</div>
            </div>
            <div class="talent-card-description">${talent.description}</div>
            <div class="talent-card-features">${effectsHTML}</div>
        `;

        talentGrid.appendChild(card);
    });
}

/**
 * 切换天赋选择
 */
function toggleTalent(talentId) {
    const talent = window.talents.find(t => t.id === talentId);
    if (!talent) return;

    const index = characterCreation.selectedTalents.findIndex(t => t === talentId);
    const card = document.querySelector(`[data-talent-id="${talentId}"]`);

    if (index >= 0) {
        // 取消选择
        characterCreation.selectedTalents.splice(index, 1);
        characterCreation.remainingPoints -= talent.cost;
        card.classList.remove('selected');
    } else {
        // 检查点数是否足够
        if (characterCreation.remainingPoints + talent.cost < 0) {
            alert('点数不足！');
            return;
        }

        // 选择天赋
        characterCreation.selectedTalents.push(talentId);
        characterCreation.remainingPoints += talent.cost;
        card.classList.add('selected');
    }

    updatePointsDisplay();
    updateAttributesDisplay(); // 实时更新属性显示
}

/**
 * 选择难度
 */
function selectDifficulty(difficulty) {
    // 移除所有选中状态
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 选中当前难度
    document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('selected');

    // 设置点数
    const pointsMap = {
        'easy': 200,
        'normal': 100,
        'hard': 50,
        'hell': 25,
        'dragon': 9999
    };

    const oldMax = characterCreation.maxPoints;
    const newMax = pointsMap[difficulty];
    const diff = newMax - oldMax;

    characterCreation.difficulty = difficulty;
    characterCreation.maxPoints = newMax;
    characterCreation.remainingPoints += diff;

    updatePointsDisplay();
}

/**
 * 选择性别
 */
function selectGender(gender) {
    document.querySelectorAll('.gender-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelector(`[data-gender="${gender}"]`).classList.add('selected');
    characterCreation.selectedGender = gender;
}

/**
 * 调整属性
 */
function adjustAttribute(attr, delta) {
    const current = characterCreation.baseAttributes[attr];
    const newValue = current + delta;

    // 减点时：属性不能低于5（只在减点时检查）
    if (delta < 0 && newValue < 5) {
        alert('属性不能低于5点！');
        return;
    }

    // 加点时：检查剩余点数是否足够
    if (delta > 0 && characterCreation.remainingPoints < 1) {
        alert('点数不足！请取消部分天赋或选择增加点数的出身/天赋');
        return;
    }

    // 更新属性
    characterCreation.baseAttributes[attr] = newValue;
    characterCreation.remainingPoints -= delta;

    // 更新显示
    updateAttributesDisplay();
    updatePointsDisplay();
}

/**
 * 更新属性显示（基础属性 + 天赋加成）
 */
function updateAttributesDisplay() {
    // 计算天赋加成
    const talentBonus = {
        physique: 0,
        fortune: 0,
        comprehension: 0,
        spirit: 0,
        potential: 0,
        charisma: 0,
        karmaFortune: 0,
        karmaPunishment: 0
    };

    characterCreation.selectedTalents.forEach(talentId => {
        const talent = window.talents.find(t => t.id === talentId);
        if (talent && talent.effects) {
            Object.entries(talent.effects).forEach(([attr, value]) => {
                if (talentBonus[attr] !== undefined) {
                    talentBonus[attr] += value;
                }
            });
        }
    });

    // 更新每个属性的显示
    Object.keys(characterCreation.baseAttributes).forEach(attr => {
        const baseValue = characterCreation.baseAttributes[attr];
        const bonus = talentBonus[attr] || 0;
        const finalValue = baseValue + bonus;

        const valueElement = document.getElementById(`${attr}-value`);
        if (valueElement) {
            if (bonus !== 0) {
                // 显示：基础值 + 加成 = 最终值
                valueElement.innerHTML = `${baseValue} <span style="color: ${bonus > 0 ? '#28a745' : '#dc3545'}; font-size: 12px;">${bonus > 0 ? '+' : ''}${bonus}</span> = <span style="color: #667eea;">${finalValue}</span>`;
            } else {
                valueElement.textContent = baseValue;
            }
        }
    });
}

/**
 * 更新点数显示
 */
function updatePointsDisplay() {
    document.getElementById('remainingPoints').textContent = characterCreation.remainingPoints;

    // 更新所有加减按钮的状态
    const canAdd = characterCreation.remainingPoints > 0;
    document.querySelectorAll('.attr-btn').forEach(btn => {
        if (btn.textContent === '+') {
            btn.disabled = !canAdd;
        }
    });
}

/**
 * 确认创建角色
 */
function confirmCharacterCreation() {
    // 获取输入
    const name = document.getElementById('charNameInput').value.trim();
    const age = parseInt(document.getElementById('charAgeInput').value) || 18;
    const personality = document.getElementById('charPersonality').value.trim();
    const customSettings = document.getElementById('customSettings').value.trim();

    if (!name) {
        alert('请输入角色姓名！');
        return;
    }

    if (age < 1 || age > 999) {
        alert('请输入合理的年龄（1-999）！');
        return;
    }

    // 计算最终属性（基础属性 + 天赋效果）
    const finalAttributes = { ...characterCreation.baseAttributes };
    let karmaFortune = 0;
    let karmaPunishment = 0;
    const selectedTalentNames = [];

    characterCreation.selectedTalents.forEach(talentId => {
        const talent = window.talents.find(t => t.id === talentId);
        if (talent) {
            selectedTalentNames.push(talent.name);
            Object.entries(talent.effects).forEach(([attr, value]) => {
                if (attr === 'karmaFortune') {
                    karmaFortune += value;
                } else if (attr === 'karmaPunishment') {
                    karmaPunishment += value;
                } else if (finalAttributes[attr] !== undefined) {
                    finalAttributes[attr] += value;
                }
            });
        }
    });

    // 获取选中的出身
    const selectedOrigin = origins.find(o => o.id === characterCreation.selectedOrigin);
    const originName = selectedOrigin ? selectedOrigin.name : '凡人';

    // 更新游戏状态
    gameState.variables.name = name;
    gameState.variables.age = age;
    gameState.variables.gender = characterCreation.selectedGender === 'male' ? '男' : '女';
    gameState.variables.realm = '';
    gameState.variables.location = '';
    gameState.variables.spiritStones = 0;  // 初始灵石
    gameState.variables.talents = selectedTalentNames;
    gameState.variables.attributes = finalAttributes;
    gameState.variables.karmaFortune = karmaFortune;
    gameState.variables.karmaPunishment = karmaPunishment;

    // 初始化功法法术数组
    gameState.variables.techniques = [];
    gameState.variables.spells = [];

    // 添加历史记录
    const talentDesc = selectedTalentNames.length > 0 ? `拥有天赋：${selectedTalentNames.join('、')}。` : '';
    gameState.variables.history = [
        `${name}，${age}岁，${gameState.variables.gender}性，${personality}。出身：${originName}。${talentDesc}`
    ];

    // 更新UI
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // 构建角色创建信息，传递给AI
    const characterInfo = {
        name: name,
        age: age,
        gender: gameState.variables.gender,
        personality: personality,
        difficulty: characterCreation.difficulty,
        origin: originName,
        customSettings: customSettings,
        talents: selectedTalentNames,
        attributes: finalAttributes
    };

    // 保存角色信息供游戏开始时使用
    gameState.characterInfo = characterInfo;

    // 清空游戏历史区域并显示加载提示
    const historyDiv = document.getElementById('gameHistory');
    historyDiv.innerHTML = `
        <div class="message ai-message loading-message">
            <div class="cyber-loader">
                <div class="cyber-loader-content">
                    <div class="cyber-scanner"></div>
                    <div class="cyber-text glitch-text" data-text="SYSTEM INITIALIZING...">SYSTEM INITIALIZING...</div>
                    <div class="cyber-subtext">正在构建世界观...</div>
                    <div class="cyber-progress">
                        <div class="cyber-progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 自动开始游戏
    if (typeof startGame === 'function') {
        startGame();
    }
}

/**
 * 在游戏历史区域显示角色创建界面
 */
function displayCharacterCreationInHistory() {
    const historyDiv = document.getElementById('gameHistory');

    // 使用配置文件中的角色创建界面生成函数
    if (window.XiuxianGameConfig && window.XiuxianGameConfig.generateCharacterCreation) {
        historyDiv.innerHTML = window.XiuxianGameConfig.generateCharacterCreation();
    } else {
        // 备用：如果配置文件未加载，显示简单提示
        historyDiv.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #999;">
                <h2>⚠️ 配置文件未加载</h2>
                <p>请确保游戏配置文件（如 xiuxian-config.js）已正确加载</p>
            </div>
        `;
        console.error('[角色创建] 配置文件未加载或缺少 generateCharacterCreation 函数');
        return;
    }

    // 重置角色创建状态
    characterCreation.difficulty = 'normal';
    characterCreation.maxPoints = 100;
    characterCreation.remainingPoints = 100;
    characterCreation.selectedOrigin = '';
    characterCreation.selectedTalents = [];
    characterCreation.selectedGender = 'male';
    characterCreation.selectedOrigin = 'commoner';

    // 立即初始化列表（DOM已插入）
    setTimeout(() => {
        try {
            initializeOrigins();
            initializeTalents();
            updateAttributesDisplay();
            updatePointsDisplay();
            console.log('[角色创建] ✅ 所有组件初始化完成');
        } catch (error) {
            console.error('[角色创建] ❌ 组件初始化失败:', error);
        }
    }, 50); // 短暂延迟确保DOM完全渲染
}

/**
 * 辅助函数：获取属性中文名
 */
function getAttributeName(attr) {
    const nameMap = {
        physique: '根骨',
        fortune: '气运',
        comprehension: '悟性',
        spirit: '神识',
        potential: '潜力',
        charisma: '魅力',
        karmaFortune: '机缘',
        karmaPunishment: '天谴'
    };
    return nameMap[attr] || attr;
}

// ==================== 依赖说明 ====================
// 本模块依赖以下全局变量：
// - gameState (游戏状态)
// - characterCreation (角色创建状态)
// - origins (出身列表，从 bhz-config.js)
// - talents (天赋列表，从 bhz-config.js)
// - updateStatusPanel() (更新状态面板函数，在 game.html)
// - startGame() (开始游戏函数，在 game.html)
