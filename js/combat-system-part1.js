/**
 * Trò chơi Tu Tiên - Hệ thống chiến đấu theo lượt Part 1
 * Quản lý trạng thái chiến đấu và chức năng phân tích (parsing)
 */

// Quản lý trạng thái chiến đấu
const combatState = {
    isActive: false,
    player: null,
    enemy: null,
    currentTurn: 'player',
    turnCount: 0,
    combatLog: [],
    playerMomentum: 0,
    enemyMomentum: 0,
    combatStartInfo: null
};

/**
 * Phân tích thông tin chiến đấu từ đầu ra của AI
 */
function parseCombatInfo(story) {
    if (!story || !story.includes('===战斗开始===')) {
        return null;
    }
    
    try {
        const combatMatch = story.match(/===战斗开始===([\s\S]*?)===战斗开始===/);
        if (!combatMatch) return null;
        
        const combatBlock = combatMatch[1].trim();
        
        const nameMatch = combatBlock.match(/目标[:：]\s*(.+)/);
        const realmMatch = combatBlock.match(/境界[:：]\s*(.+?)（(\d+)）/);
        const attrsMatch = combatBlock.match(/六维[:：]\s*(.+)/);
        const techniquesMatch = combatBlock.match(/功法[:：]\s*(.+)/);
        const spellsMatch = combatBlock.match(/法术[:：]\s*(.+)/);
        
        if (!nameMatch || !realmMatch || !attrsMatch) {
            return null;
        }
        
        const attrsArray = attrsMatch[1].trim().split(/[,，]/).map(v => parseInt(v.trim()));
        if (attrsArray.length !== 6) {
            return null;
        }
        
        const techniques = [];
        if (techniquesMatch) {
            const techParts = techniquesMatch[1].split(/[,，]/);
            for (const part of techParts) {
                const match = part.trim().match(/(.+?)（威力(\d+)[/／]消耗(\d+)）/);
                if (match) {
                    techniques.push({
                        name: match[1].trim(),
                        power: parseInt(match[2]),
                        mpCost: parseInt(match[3]),
                        cooldown: 0,
                        currentCooldown: 0
                    });
                }
            }
        }
        
        const spells = [];
        if (spellsMatch) {
            const spellParts = spellsMatch[1].split(/[,，]/);
            for (const part of spellParts) {
                const match = part.trim().match(/(.+?)（威力(\d+)[/／]消耗(\d+)）/);
                if (match) {
                    spells.push({
                        name: match[1].trim(),
                        power: parseInt(match[2]),
                        mpCost: parseInt(match[3]),
                        cooldown: 0,
                        currentCooldown: 0
                    });
                }
            }
        }
        
        return {
            name: nameMatch[1].trim(),
            realm: realmMatch[1].trim(),
            realmLevel: parseInt(realmMatch[2]),
            attributes: {
                physique: attrsArray[0],
                comprehension: attrsArray[1],
                spirituality: attrsArray[2],
                luck: attrsArray[3],
                charm: attrsArray[4],
                willpower: attrsArray[5]
            },
            techniques: techniques,
            spells: spells
        };
    } catch (error) {
        console.error('Phân tích thông tin chiến đấu thất bại:', error);
        return null;
    }
}

/**
 * Thêm nhật ký chiến đấu
 */
function addCombatLog(message) {
    combatState.combatLog.push(message);
}

/**
 * Hiển thị nhật ký chiến đấu lên giao diện
 */
function renderCombatLog() {
    const logContainer = document.getElementById('combatLog');
    if (!logContainer) return;
    
    logContainer.innerHTML = combatState.combatLog.map(log => 
        `<div class="log-entry">${log}</div>`
    ).join('');
    
    logContainer.scrollTop = logContainer.scrollHeight;
}
