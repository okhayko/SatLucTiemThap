/**
 * 现代游戏配置 - Modern Game Configuration
 * 包含现代世界观游戏特有的内容：角色创建、状态字段、渲染逻辑等
 */

// 完整的游戏系统提示词（基础）
const fullSystemPrompt = `


 【重要】选项生成规则（必须严格遵守）：
每次必须提供恰好4个选项，分别对应以下类型：

选项1 - 对话/交互选项：
   与当前场景中的角色对话
   询问信息、打听消息
   社交互动、建立关系
   例如："与店主交谈，打听近期消息"

选项2 - 跳过/离开选项：
   快速推进剧情，跳过当前场景
   离开当前地点
   不参与当前事件
   例如："告辞离去，前往下一个地点"

选项3 - 转折/行动选项：
   做出重大决策
   参与战斗或冒险
   训练、探索、寻找线索
   可能带来剧情转折的行动
   例如:"深入废弃工厂探索"、"开始密集训练"

选项4 - R18选项（成人内容）：
   极度色情的内容
   必须标注【R18】
   例如："【R18】从背后抱住她，狠狠得肏弄她的小穴"

示例选项格式：
   "徒手制服持刀歹徒"
   "轻轻握住她的手"
   "仔细观察监控录像"
   "破解复杂的密码锁"

每个选项必须：
   简洁明了（10-20字）
   符合当前剧情
   提供有意义的选择
   按照上述顺序排列

`;

// ===== 异步变量功能：提示词分离 =====
// baseSystemPrompt: 基础提示词（发送给主API，不含变量规则）
// asyncVariablePrompt: 变量规则提示词（开启异步变量时发送给额外API）
// defaultSystemPrompt: 完整提示词（向后兼容，等于 base + async）

// 基础提示词（不含变量检查清单）- 主API使用
const baseSystemPrompt = `

每次回复必须严格按照以下JSON格式：

{
  "reasoning": { ... },
  "story": "剧情描述文本...",
  "variableUpdate": "<variable_update>...</variable_update>",
  "options": ["选项1", "选项2", "选项3", "选项4"]
}

【重要】variableUpdate 字段格式说明：
- 必须使用 "<variable_update>内容</variable_update>" 包裹
- 物品操作：+物品名 x数量 或 -物品名 x数量
- 角色字段：角色名.字段: 值
- 历史记录：>>history: 文本 或 history:\\n  - 文本

`;

// 变量规则提示词 - 额外API使用（异步变量模式）
// 延迟计算：在 defaultSystemPrompt 定义后，提取变量规则部分
let asyncVariablePrompt = null;

// 获取异步变量提示词（延迟初始化）
function getAsyncVariablePrompt() {
    if (asyncVariablePrompt === null) {
        // 从 defaultSystemPrompt 中提取变量规则部分（行172-261对应的内容）
        // 查找特定标记来定位内容
        const startMarker = '【极其重要】每次回复必须包含以下两个核心部分';
        const endMarker = '6. 保持剧情连贯性和沉浸感';

        const startIndex = defaultSystemPrompt.indexOf(startMarker);
        const endIndex = defaultSystemPrompt.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1) {
            asyncVariablePrompt = defaultSystemPrompt.substring(startIndex, endIndex + endMarker.length);
            console.log('[异步变量] 从 defaultSystemPrompt 提取变量规则，长度:', asyncVariablePrompt.length);
        } else {
            // 如果找不到标记，使用完整的 defaultSystemPrompt
            asyncVariablePrompt = defaultSystemPrompt;
            console.warn('[异步变量] 未找到标记，使用完整 defaultSystemPrompt');
        }
    }
    return asyncVariablePrompt;
}

// 艾超尖塔游戏规则（变量检查清单）- 完整版本，向后兼容
const defaultSystemPrompt = `你是一个异世界地下城冒险游戏的主持人。
允许死亡：若{{User}}体力归零死亡，坦然宣告死亡事实，严禁安排任何"救星"或强行扭曲世界观。死亡后输出【角色人物已死亡，本次游玩已结束，请开启下一轮游玩】，不再输出其他内容。

每次回复必须包含 reasoning 和 variableUpdate 两个核心字段。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【第1部分：回复格式】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

回复必须为纯JSON（不含markdown代码块），格式如下：
{
  "variableUpdate": "<variable_update>\\n指令内容\\n</variable_update>"
}

variableUpdate 示例：
"variableUpdate": "<variable_update>\\nhp: -25\\n魅魔.favor: +10\\n+治疗药水 x2\\n>>history: 在地下城三层遭遇魅魔，激战后将其制服\\n</variable_update>"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【第2部分：variableUpdate 语法参考】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

variableUpdate 必须用 "<variable_update>内容</variable_update>" 包裹（JSON字符串格式）。

【基础语法（5种操作符）】
+数字  → 增加      hp: +30, mp: +60, spiritStones: +100
-数字  → 减少      hp: -25, mp: -40, spiritStones: -50
=值    → 强制设置  hp: =100, isVirgin: =false
文本   → 替换      mood: 紧张, location: 地下城入口
>>字段 → 追加数组  >>history: 击败守门人

【物品操作】
+物品名 x数量  → 获得物品    +治疗药水 x3, +强效媚药
-物品名 x数量  → 失去物品    -钥匙 x1, -金币 x50

【常用字段一览】
数值类（加减）：hp, mp, spiritStones, exp
文本类（替换）：thought, mood, status, location, currentDateTime, currentGoal

【currentGoal 当前目标格式说明】
currentGoal 用于记录角色当前的主要目标和子目标，格式为用竖线分隔的字符串：
currentGoal: 主目标|子目标1|子目标2|子目标3
示例：currentGoal: 探索第三层地下城|击败守关BOSS|收集稀有材料|寻找隐藏房间
说明：第一项为主目标（最重要），后续为子目标（可选，0-5个）。每轮根据剧情发展更新。
数组类（>>追加）：history, diary, achievements

【角色关系操作（点号格式）】
格式：角色名.字段: 值
示例：魅魔.favor: +15, >>魅魔.history: 被主角征服

新角色创建时必须包含以下全部字段：
角色名.favor: 数字（初始好感度，通常0-20）
角色名.relation: 关系类型
角色名.age: 年龄
角色名.job: 职业/种族
角色名.personality: 性格描述
角色名.opinion: 对主角的看法
角色名.appearance: 外貌描述
角色名.isVirgin: =true或=false
# ACJT版角色需包含6个部位（含anus）：
角色名.bodyParts.vagina.description: 描述
角色名.bodyParts.vagina.useCount: 次数
角色名.bodyParts.anus.description: 描述
角色名.bodyParts.anus.useCount: 次数
角色名.bodyParts.breasts/mouth/hands/feet 同上
>>角色名.history: 初次相遇情况

【bodyParts useCount 合理性规则】
禁止所有角色useCount都写0，必须根据年龄/职业/经历合理推算：
- 处女(isVirgin:true) → vagina.useCount必须=0，但mouth/hands/anus可有次数
- 非处女 → vagina.useCount必须>0
- 年龄参考：19岁清纯少女0-5次；25-30岁成熟女性10-50次；30+熟女50-200次

【特殊状态（ACJT特有）】
# 只能通过温泉休息清除一项
specialStatus.状态名.active: =true
specialStatus.状态名.effect: 效果描述
specialStatus.状态名.description: 状态描述
# 常见状态：跳蛋（费用-1）、淫纹（休息堕落+5）、乳环（防御-2）、项圈（HP上限-10）、贞操带（回血限制）、催情药（攻击-3）、羞耻衣（堕落+3）、烙印（被特定怪伤+50%）

【势力/组织操作（JSON追加）】
>>factions: {"name": "势力名", "leader": "领袖", "location": "所在地", "members": ["成员1", "成员2"], "description": "介绍"}

【主角详细信息】
protagonist.appearance: 外貌描述
protagonist.mood: 当前心情
protagonist.status: 当前状态
protagonist.isVirgin: =false（若失贞）
protagonist.firstSex: 详细描述（首次必须记录）
protagonist.lastSex: 详细描述（每次性行为都更新）
protagonist.sexualPreference: 性癖描述

# bodyParts 可用部位（ACJT版共6个，含anus）：
# 每个部位需同时设置 .description（状态描述）和 .useCount: +1（使用次数）
protagonist.bodyParts.vagina.description: 小穴状态描述
protagonist.bodyParts.vagina.useCount: +1
protagonist.bodyParts.anus.description: 肛门状态描述
protagonist.bodyParts.anus.useCount: +1
protagonist.bodyParts.breasts.description: 胸部状态描述
protagonist.bodyParts.breasts.useCount: +1
protagonist.bodyParts.mouth.description: 嘴巴状态描述
protagonist.bodyParts.mouth.useCount: +1
protagonist.bodyParts.hands.description: 手部状态描述
protagonist.bodyParts.hands.useCount: +1
protagonist.bodyParts.feet.description: 足部状态描述
protagonist.bodyParts.feet.useCount: +1


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【第3部分：核心规范】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- variableUpdate 与 story 同等重要，宁多勿漏
- variableCheck 中的每个"是"都必须在 variableUpdate 中体现
- history 每轮必须存在，遗漏将导致游戏记录断裂
- 叙事风格：客观、简洁、留白、远观`;

// 现代游戏的默认动态世界提示词
const defaultDynamicWorldPrompt = `你是一个现代世界的动态世界生成器。根据当前主角状态和位置，生成远方发生的世界事件。

【重要要求】每次生成动态世界事件时，必须包含人际关系变量的更新！这是强制性的，不可跳过！

每次回复必须严格按照以下JSON格式：
{
  "reasoning": {
    "worldState": "当前世界状态分析（势力、资源、冲突）",
    "timeframe": "本次事件发生的时间范围",
    "keyEvents": ["关键事件1", "关键事件2"],
    "npcActions": "重要NPC的行动和计划",
    "impact": "这些事件对主角的潜在影响"
  },
  "story": "动态世界事件描述（300-500字）",
  
  // 【注意】每次都必须更新至少一个角色的关系变量！
  "variableUpdate": "<variable_update>\\n# 新角色出现或现有角色关系变化（强制要求）\\n林小雨.favor: 10\\n林小雨.relation: 初识的女子\\n林小雨.age: 26\\n林小雨.job: 记者\\n林小雨.personality: 机敏狡黯, 独来独往\\n林小雨.opinion: 此人颇有些神秘\\n林小雨.appearance: 身着黑色职业装，身形苗条\\n林小雨.sexualPreference: 异性恋\\n林小雨.isVirgin: true\\n林小雨.firstSex: 未知\\n林小雨.lastSex: 未知\\n>>林小雨.history: 初次听闻其名，传言她已抢先潜入秘密基地\\n\\n# 历史记录\\n>>player.worldEvents: 听闻林小雨抢先潜入秘密基地\\n</variable_update>"
}

【核心原则 - 避免剧情冲突】：

1. 【禁止】直接影响主角正在互动的NPC和事件：
    禁止：不要让主角当前正在交谈/战斗/同行的NPC突然离开、被抓、死亡、消失
    禁止：不要改变主角当前所在位置的状态（如"你所在的公司突然被查封"）
    禁止：不要直接改变主角正在进行的事件结果
    正确：描述其他地方、其他人物、其他时间段的事件

2. 【时间流速控制 - 极其重要】：
   - 【禁止推进主角时间】：动态世界描述的是"同一时间段"其他地方发生的事
   - 【禁止】出现"一月后"、"数日后"、"半年过去"等任何时间推进词汇
   - 【禁止】描述主角在做什么（如"你与她躲藏一月"、"你们在破庙中"等）
   -  正确：描述"此时此刻"其他地方正在发生的事
   -  使用"此时"、"同一时刻"、"就在这时"等表达同步时间
   - 时间参照：使用主角当前的currentDateTime作为基准，描述同一天或前后1-2天的远方事件

3. 描述范围（远离主角的事件）：
   - 其他城市/区域的事件
   - 主角暂时不知道的远方传闻
   - 其他人的活动
   - 势力暗流、政治变化
   - 远方的战斗、冲突

4. NPC处理原则：
   - 【优先】涉及主角当前relationships中不在主角身边的NPC
   - 【允许】创建新的远方NPC（主角不认识的人、势力人物）
   - 【禁止】描述主角身边的人、同行的人、正在交谈的人
   - 【禁止】修改主角已认识的NPC的状态（位置、生死、重大遭遇）
   -  可以创作完全新的远方NPC作为传闻背景

5. 变量更新限制（重要）：
   - 【强制要求】必须返回variableUpdate字段，包含关系变量更新
   - 【允许】修改主角已认识的NPC（使用角色名.字段格式）
   - 【允许】添加远方传闻中的新人物（主角未见过、未互动过）
   - 【禁止】修改主角的任何属性、物品、位置等
   - 【禁止】添加与主角有直接互动的NPC

6. 内容类型示例（正确）：
    "东城区某科技公司传出消息，三日后将举办小型招聘会..."
    "北城郊区有人目击到可疑人物出没，引起了附近居民的警惕..."
    "网络上惄然流传，某处废弃工厂疑似有神秘活动，已有数位探险者前往探查..."
    "你曾听闻的那位高手程序员，据说最近在密集开发新项目..."

7. 错误示例（禁止）：
    "你的同伴突然被绑架了" ← 不要影响主角身边的人
    "半年过去，公司已经倒闭" ← 时间流速太快
    "你所在的酒店今夜被警方突袭" ← 不要直接影响主角当前位置
    "你的老板被抓" ← 不要改变关键NPC的生死状态

8. 叙事风格：
   - 客观视角，像远方传来的消息、传闻
   - 使用"据说"、"有人传言"、"网络上流传"等表述
   - 留下悬念和伏笔，不要直接揭示答案
   - 营造世界在运转的感觉，但不干扰主线

9. 【重要】与主线协调：
   - 仔细阅读主角当前的location、正在进行的事件
   - 避开主角当前互动的所有NPC
   - 描述的事件应该是"远方的背景音"，不是"当前的重大事件"
   - 为主角未来的冒险埋下线索，而不是强制改变现状

【variableUpdate 变量字段说明】（与系统提示词相同）

一、新角色创建（动态世界重点）
当动态世界事件中出现新角色时，必须完整设置：
- 角色名.favor: 初始好感度（通常0-20）
- 角色名.relation: 关系类型
- 角色名.age: 年龄
- 角色名.job: 职业
- 角色名.personality: 性格描述
- 角色名.opinion: 对主角的看法
- 角色名.appearance: 外貌描述
- 角色名.sexualPreference: 性取向
- 角色名.isVirgin: 是否处
- 角色名.firstSex: 初次性经历
- 角色名.lastSex: 最近性经历
- 角色名.bodyParts.vagina.description: 小穴详细描写
- 角色名.bodyParts.vagina.useCount: 0
- 角色名.bodyParts.breasts.description: 胸部详细描写
- 角色名.bodyParts.breasts.useCount: 0
- 角色名.bodyParts.mouth.description: 嘴巴详细描写
- 角色名.bodyParts.mouth.useCount: 0
- 角色名.bodyParts.hands.description: 手部详细描写
- 角色名.bodyParts.hands.useCount: 0
- 角色名.bodyParts.feet.description: 足部详细描写
- 角色名.bodyParts.feet.useCount: 0
- >>角色名.history: 初次相遇情况

二、世界事件记录
记录到玩家的世界事件列表：
- >>player.worldEvents: 听闻林小雨潜入秘密基地（追加）
- >>player.worldEvents: 北城郊区出现可疑人物（追加）

三、性爱场景更新
如果动态世界事件中发生性爱：
- 角色名.isVirgin: =false（替换）
- 角色名.firstSex: 详细描述（替换）
- 角色名.lastSex: 详细描述（替换）
- 角色名.bodyParts.vagina.useCount: +1（如发生插入）
- 角色名.bodyParts.mouth.useCount: +1（如发生口交）
- 角色名.bodyParts.breasts.useCount: +1（如发生乳交）
- 角色名.bodyParts.hands.useCount: +1（如发生手交）
- 角色名.bodyParts.feet.useCount: +1（如发生足交）
- >>角色名.history: 性爱经历记录（追加）

四、操作符说明（同系统提示词）
- +数字 = 增加
- -数字 = 减少
- =值 = 替换
- 文本 = 替换
- >>字段 = 追加
最后，绝对不要偷懒！对照表单，更新所有相关字段！
【抗绝望规范】：适用所有内容
【叙事风格】：客观、简洁、留白、远观`;

// 获取系统提示词（优先使用HTML中的textarea，如果为空则使用默认值）
function getSystemPrompt() {
    const el = document.getElementById('systemPrompt');
    if (el && el.value && el.value.trim()) {
        return el.value;
    }
    return fullSystemPrompt;
}

// 获取动态世界提示词（优先使用HTML中的textarea，如果为空则使用默认值）
function getDynamicWorldPrompt() {
    const el = document.getElementById('dynamicWorldPrompt');
    if (el && el.value && el.value.trim()) {
        return el.value;
    }
    return defaultDynamicWorldPrompt;
}

// 生成现代游戏特有的状态面板HTML
function generateStatusPanelHTML() {
    return `
        <!-- 状态面板样式 -->
        <style>
            .status-icon-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                padding: 10px;
            }
            @media (max-width: 600px) {
                .status-icon-grid {
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    padding: 8px;
                }
            }
            .status-icon-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 5px 5px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid #333;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-height: 70px;
            }
                .status-icon-btn img{transform: translateY(0px)}
            .status-icon-btn img:hover {
                transform: translateY(-6px);transition: all 0.3s ease;
            }
            .status-icon-btn:active {
                transform: scale(0.95);
            }
            .status-icon-btn .icon {
                font-size: 24px;
                margin-bottom: 4px;
            }
            .status-icon-btn .label {
                font-size: 10px;
                color: #aaa;
                text-align: center;
                white-space: nowrap;
            }
            .status-icon-btn .badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4757;
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                border-radius: 10px;
                min-width: 16px;
                text-align: center;
            }
            .status-icon-btn-wrapper {
                position: relative;
            }
            /* 弹窗样式 - 克苏鲁风格 */
            .status-modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.85);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }
            .status-modal-overlay.active {
                display: flex;
            }
            .status-modal {
                background: linear-gradient(180deg, rgba(25, 18, 15, 0.98) 0%, rgba(15, 10, 8, 0.99) 50%, rgba(20, 14, 12, 0.98) 100%);
                border: 3px solid #3d2f24;
                border-radius: 4px;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: modalSlideIn 0.3s ease;
                box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.8), 0 0 15px rgba(139,0,0,0.3);
                position: relative;
            }
            .status-modal::before {
                content: '';
                position: absolute;
                top: -5px; left: -5px; right: -5px; bottom: -5px;
                border: 2px solid #1a1310;
                pointer-events: none;
            }
            .status-modal::after {
                content: '';
                position: absolute;
                top: 3px; left: 3px; right: 3px; bottom: 3px;
                border: 1px solid rgba(107, 82, 65, 0.3);
                pointer-events: none;
            }
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .status-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 2px solid rgba(139, 0, 0, 0.4);
                background: linear-gradient(180deg, rgba(139,0,0,0.15) 0%, transparent 100%);
            }
            .status-modal-header h3 {
                margin: 0;
                color: #c9b896;
                font-size: 16px;
                font-family: 'Cinzel', serif;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
            }
            .status-modal-close {
                background: none;
                border: none;
                color: #6b5d4d;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: all 0.2s;
            }
            .status-modal-close:hover {
                color: #8b0000;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
            }
            .status-modal-body {
                padding: 15px 20px;
                overflow-y: auto;
                flex: 1;
                color: #c9b896;
            }
            @media (max-width: 600px) {
                .status-modal {
                    max-width: 95%;
                    max-height: 85vh;
                }
                .status-modal-header {
                    padding: 12px 15px;
                }
                .status-modal-body {
                    padding: 12px 15px;
                }
            }
        </style>

        <!-- 右侧状态面板 -->
        <div class="panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 16px;">角色状态</h2>
                <button onclick="openVariableEditor()" style="margin-right:10px;padding: 5px 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;display:none;">编辑</button>
            </div>

            <!-- Tab切换 -->
            <div class="tab-container">
                <button class="tab-button active" onclick="switchTab('status')">状态栏</button>
                <button class="tab-button" onclick="switchTab('dynamicWorld')">动态世界</button>
            </div>

            <!-- 状态栏Tab内容 -->
            <div id="statusTab" class="tab-content active">
                <!-- 角色信息（直接展示） -->
                <div class="inline-status-section" style="margin-bottom: 10px; padding: 12px; background: url(img/background/tit_bg_2.png); border-radius: 4px; border-top: 1px solid rgba(139,0,0,0.4);border-bottom: 1px solid rgba(139,0,0,0.4); box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(139,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="color: #c9b896; font-size: 16px; font-weight: bold; text-shadow: 0 0 8px rgba(139,0,0,0.5);" id="inlinePlayerName">未命名</div>
                        <div style="display: flex; gap: 12px;">
                            <span style="color: #8b4513; font-size: 13px;">🏰 第<span id="inlinePlayerFloor" style="color: #c9b896;">1</span>层</span>
                            <span style="color: #8b4513; font-size: 13px;">💰 <span id="inlinePlayerGold" style="color: #c9b896;">100</span></span>
                        </div>
                    </div>
                </div>
                
                <!-- 属性信息（直接展示） -->
                <div class="inline-status-section" style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_1.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ff6b81; font-size: 16px; font-weight: bold;" id="inlinePlayerHp">70/70</div>
                        <div style="color: #888; font-size: 14px;">❤️ 生命</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_2.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;" id="inlinePlayerEnergy">3</div>
                        <div style="color: #888; font-size: 14px;">⚡ 费用</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_3.png); border-radius: 6px; text-align: center;">
                        <div style="color: #9c88ff; font-size: 16px; font-weight: bold;" id="inlinePlayerCorruption">0</div>
                        <div style="color: #888; font-size: 14px;">💜 堕落</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_4.png); border-radius: 6px; text-align: center;">
                        <div style="color: #ff4757; font-size: 16px; font-weight: bold;" id="inlinePlayerAttack">0</div>
                        <div style="color: #888; font-size: 14px;">⚔️ 攻击</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_1.png); border-radius: 6px; text-align: center;">
                        <div style="color: #70a1ff; font-size: 16px; font-weight: bold;" id="inlinePlayerDefense">0</div>
                        <div style="color: #888; font-size: 14px;">🛡️ 防御</div>
                    </div>
                    <div style="padding: 8px; background: url(img/background/inline-status-section_bg_2.png); border-radius: 6px; text-align: center;">
                        <div style="color: #70a1ff; font-size: 16px; font-weight: bold;" id="inlinePlayerArmor">0</div>
                        <div style="color: #888; font-size: 14px;">🔰 护甲</div>
                    </div>
                </div>
                
                <!-- 图标网格（其他功能） -->
                <div class="status-icon-grid">
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('protagonist')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_001.png"></span>
                            <span class="label">详情</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('specialStatus')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_002.png"></span>
                            <span class="label">状态</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('items')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_003.png"></span>
                            <span class="label">道具</span>
                        </div>
                        <span class="badge" id="itemsBadge" style="display:none;">0</span>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('relationships')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_004.png"></span>
                            <span class="label">关系</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('faction')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_005.png"></span>
                            <span class="label">势力</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('history')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_006.png"></span>
                            <span class="label">历史</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('cards')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_007.png"></span>
                            <span class="label" id="cardDeckCount">卡组</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" onclick="openStatusModal('relics')">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_008.png"></span>
                            <span class="label" id="relicCount">圣遗物</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="hotelBtn" onclick="TownSystem.openHotel()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_009.png"></span>
                            <span class="label">旅馆</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="brothelBtn" onclick="TownSystem.openBrothel()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_010.png"></span>
                            <span class="label">妓院</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="blackMarketBtn" onclick="BlackMarketSystem.open()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_011.png"></span>
                            <span class="label">黑市</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="churchBtn" onclick="TownSystem.openChurch()" style="opacity: 0.5; pointer-events: none;">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_012.png"></span>
                            <span class="label">教堂</span>
                        </div>
                    </div>
                    <div class="status-icon-btn-wrapper">
                        <div class="status-icon-btn" id="cultivationBtn" onclick="CultivationSystem.open()">
                            <span class="icon"><img src="../game_acjt/img/icon/ksl_013.png"></span>
                            <span class="label">修行</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 状态栏Tab内容结束 -->

            <!-- 动态世界Tab内容 -->
            <div id="dynamicWorldTab" class="tab-content">
                <div class="dynamic-world-container" id="dynamicWorldContainer">
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                        <div style="font-size: 16px; margin-bottom: 10px;">动态世界未启用</div>
                        <div style="font-size: 12px;">请在设置中启用动态世界功能</div>
                    </div>
                </div>
            </div>

            <!-- 隐藏的数据容器（供渲染函数使用） -->
            <div style="display:none;">
                <span id="playerName">未命名</span>
                <span id="playerFloor">1</span>
                <span id="playerGold">100</span>
                <span id="playerHp">70/70</span>
                <span id="playerEnergy">3</span>
                <span id="playerAttack">0</span>
                <span id="playerDefense">0</span>
                <span id="playerArmor">0</span>
                <span id="playerCorruption">0</span>
                <span id="protagonistAppearance">未知</span>
                <span id="protagonistSexPref">未知</span>
                <span id="protagonistVirgin">未知</span>
                <span id="protagonistFirstSex">未知</span>
                <span id="protagonistLastSex">未知</span>
                <div id="protagonistBodyParts"></div>
                <div id="specialStatusList"></div>
                <div id="itemsList"></div>
                <div id="relationshipsList"></div>
                <div id="factionInfo"></div>
                <div id="historyList"></div>
                <div id="cardDeckList"></div>
                <div id="relicsList"></div>
            </div>
        </div>

        <!-- 状态弹窗 -->
        <div class="status-modal-overlay" id="statusModalOverlay" onclick="closeStatusModal(event)">
            <div class="status-modal" onclick="event.stopPropagation()">
                <div class="status-modal-header">
                    <h3 id="statusModalTitle">标题</h3>
                    <button class="status-modal-close" onclick="closeStatusModal()">&times;</button>
                </div>
                <div class="status-modal-body" id="statusModalBody">
                    内容
                </div>
            </div>
        </div>
    `;
}

// 打开状态弹窗
function openStatusModal(type) {
    const overlay = document.getElementById('statusModalOverlay');
    const title = document.getElementById('statusModalTitle');
    const body = document.getElementById('statusModalBody');

    if (!overlay || !title || !body) return;

    let titleText = '';
    let content = '';

    switch (type) {
        case 'character':
            titleText = '👤 角色信息';
            content = `
                <div class="status-item" style="margin-bottom: 12px; padding: 10px; background: rgba(255,107,157,0.1); border-radius: 8px;">
                    <div style="color: #888; font-size: 12px;">姓名</div>
                    <div style="color: #ff6b9d; font-size: 18px; font-weight: bold;">${document.getElementById('playerName')?.textContent || '未命名'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                        <div style="color: #888; font-size: 11px;">当前层数</div>
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;">${document.getElementById('playerFloor')?.textContent || '1'}</div>
                    </div>
                    <div style="padding: 10px; background: rgba(255,215,0,0.1); border-radius: 8px;">
                        <div style="color: #888; font-size: 11px;">金币</div>
                        <div style="color: #ffd700; font-size: 16px; font-weight: bold;">💰 ${document.getElementById('playerGold')?.textContent || '0'}</div>
                    </div>
                </div>
            `;
            break;

        case 'attributes':
            titleText = '❤️ 角色属性';
            content = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="padding: 12px; background: rgba(255,107,129,0.15); border-radius: 8px; border: 1px solid rgba(255,107,129,0.3);">
                        <div style="color: #888; font-size: 11px;">生命值</div>
                        <div style="color: #ff6b81; font-size: 18px; font-weight: bold;">${document.getElementById('playerHp')?.textContent || '70/70'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(255,215,0,0.15); border-radius: 8px; border: 1px solid rgba(255,215,0,0.3);">
                        <div style="color: #888; font-size: 11px;">费用点</div>
                        <div style="color: #ffd700; font-size: 18px; font-weight: bold;">⚡ ${document.getElementById('playerEnergy')?.textContent || '3'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(255,71,87,0.15); border-radius: 8px; border: 1px solid rgba(255,71,87,0.3);">
                        <div style="color: #888; font-size: 11px;">攻击力</div>
                        <div style="color: #ff4757; font-size: 18px; font-weight: bold;">⚔️ ${document.getElementById('playerAttack')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(112,161,255,0.15); border-radius: 8px; border: 1px solid rgba(112,161,255,0.3);">
                        <div style="color: #888; font-size: 11px;">防御力</div>
                        <div style="color: #70a1ff; font-size: 18px; font-weight: bold;">🛡️ ${document.getElementById('playerDefense')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(112,161,255,0.1); border-radius: 8px; border: 1px solid rgba(112,161,255,0.2);">
                        <div style="color: #888; font-size: 11px;">初始护甲</div>
                        <div style="color: #70a1ff; font-size: 18px; font-weight: bold;">🔰 ${document.getElementById('playerArmor')?.textContent || '0'}</div>
                    </div>
                    <div style="padding: 12px; background: rgba(156,136,255,0.15); border-radius: 8px; border: 1px solid rgba(156,136,255,0.3);">
                        <div style="color: #888; font-size: 11px;">堕落值</div>
                        <div style="color: #9c88ff; font-size: 18px; font-weight: bold;">💜 ${document.getElementById('playerCorruption')?.textContent || '0'}</div>
                    </div>
                </div>
            `;
            break;

        case 'protagonist':
            titleText = '🌸 主角详细信息';
            // 生成当前目标HTML
            let goalHTML = '';
            const goalVars = window.gameState?.variables || {};
            if (goalVars.currentGoal) {
                const goals = goalVars.currentGoal.split('|').map(g => g.trim()).filter(g => g);
                const mainGoal = goals[0] || '';
                const subGoals = goals.slice(1);
                const subGoalsHTML = subGoals.length > 0 ? subGoals.map(g => `<div style="font-size: 12px; color: #c9b896; padding: 3px 0 3px 12px; border-left: 2px solid rgba(139,0,0,0.4);">▸ ${g}</div>`).join('') : '';
                goalHTML = `
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(139,0,0,0.15); border-radius: 8px; border: 1px solid rgba(139,0,0,0.3);">
                    <div style="color: #ff6347; font-weight: bold; margin-bottom: 8px;">🎯 当前目标</div>
                    <div style="font-size: 14px; color: #ffd700; font-weight: bold; margin-bottom: 6px;">★ ${mainGoal}</div>
                    ${subGoalsHTML}
                </div>`;
            }
            content = `
                ${goalHTML}
                <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,105,180,0.1); border-radius: 8px; border: 1px solid rgba(255,105,180,0.2);">
                    <div style="color: #ff69b4; font-weight: bold; margin-bottom: 8px;">📋 基本状态</div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">外貌：</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistAppearance')?.textContent || '未知'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">性癖：</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistSexPref')?.textContent || '未知'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">处女：</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistVirgin')?.textContent || '未知'}</span>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        <span style="color: #888;">初次：</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistFirstSex')?.textContent || '未知'}</span>
                    </div>
                    <div style="font-size: 12px;">
                        <span style="color: #888;">最近：</span>
                        <span style="color: #ddd;">${document.getElementById('protagonistLastSex')?.textContent || '未知'}</span>
                    </div>
                </div>
                <div style="padding: 10px; background: rgba(255,105,180,0.15); border-radius: 8px; border: 1px solid rgba(255,105,180,0.3);">
                    <div style="color: #ff69b4; font-weight: bold; margin-bottom: 8px;">💕 身体详情</div>
                    <div style="font-size: 12px; color: #aaa;">${document.getElementById('protagonistBodyParts')?.innerHTML || '暂无数据'}</div>
                </div>
            `;
            break;

        case 'specialStatus':
            titleText = '⚠️ 特殊状态';
            // 🔧 先更新内容再获取，确保显示最新状态
            if (typeof SpecialStatusManager !== 'undefined') {
                SpecialStatusManager.updateDisplay();
            }
            const statusContent = document.getElementById('specialStatusList')?.innerHTML || '<div style="text-align: center; color: #666;">暂无异常状态</div>';
            content = `<div style="font-size: 13px;">${statusContent}</div>`;
            break;

        case 'items':
            titleText = '🎒 道具';
            const itemsContent = document.getElementById('itemsList')?.innerHTML || '<div style="text-align: center; color: #666;">暂无道具</div>';
            content = `<div>${itemsContent}</div>`;
            break;

        case 'relationships':
            titleText = '👥 人际关系';
            let relContent = document.getElementById('relationshipsList')?.innerHTML || '<div style="text-align: center; color: #666;">暂无关系</div>';
            // 为弹窗内的元素添加 modal- 前缀，避免 ID 冲突
            relContent = relContent.replace(/relationship-details-/g, 'modal-relationship-details-');
            relContent = relContent.replace(/toggleRelationshipDetails\(/g, 'toggleModalRelationshipDetails(');
            content = `<div>${relContent}</div>`;
            break;

        case 'faction':
            titleText = '🏛️ 势力信息';
            const factionContent = document.getElementById('factionInfo')?.innerHTML || '<div style="text-align: center; color: #666;">暂无势力</div>';
            content = `<div>${factionContent}</div>`;
            break;

        case 'history':
            titleText = '📜 重要历史';
            const historyContent = document.getElementById('historyList')?.innerHTML || '<div style="text-align: center; color: #666;">暂无历史</div>';
            content = `<div>${historyContent}</div>`;
            break;

        case 'cards':
            titleText = '🃏 卡组';
            const cardsContent = document.getElementById('cardDeckList')?.innerHTML || '<div style="text-align: center; color: #666;">暂无卡牌</div>';
            content = `<div>${cardsContent}</div>`;
            break;

        case 'relics':
            titleText = '🏆 圣遗物';
            content = generateRelicsModalContent();
            break;

        default:
            titleText = '信息';
            content = '<div style="text-align: center; color: #666;">暂无内容</div>';
    }

    title.textContent = titleText;
    body.innerHTML = content;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭状态弹窗
function closeStatusModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const overlay = document.getElementById('statusModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 生成圣遗物弹窗内容
function generateRelicsModalContent() {
    // 检查 PlayerState 和 RelicConfig 是否存在
    if (typeof PlayerState === 'undefined' || typeof RelicConfig === 'undefined') {
        return '<div style="text-align: center; color: #666;">圣遗物系统未加载</div>';
    }

    const relics = PlayerState.relics || [];

    if (relics.length === 0) {
        return `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;">🏆</div>
                <div style="color: #666; font-size: 14px;">暂无圣遗物</div>
                <div style="color: #888; font-size: 12px; margin-top: 10px;">在商店购买圣遗物可获得永久增益效果</div>
            </div>
        `;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    relics.forEach((relicId, index) => {
        const relic = RelicConfig[relicId];
        if (!relic) {
            html += `
                <div style="background: rgba(100,100,100,0.2); border: 1px solid #444; border-radius: 8px; padding: 12px;">
                    <div style="color: #888;">未知圣遗物: ${relicId}</div>
                </div>
            `;
            return;
        }

        // 解析效果描述
        let effectsHtml = '';
        if (relic.effect) {
            const effectNames = {
                maxHp: '最大HP',
                attack: '攻击力',
                defense: '防御力',
                baseArmor: '初始护甲',
                energy: '费用点',
                corruption: '堕落值',
                goldBonus: '金币奖励',
                healBonus: '治疗效果',
                lifesteal: '生命汲取',
                drawBonus: '抽牌数',
                reflect: '反伤',
                shopDiscount: '商店折扣'
            };

            const effects = Object.entries(relic.effect).map(([key, value]) => {
                const name = effectNames[key] || key;
                const color = value > 0 ? '#2ed573' : '#ff4757';
                const sign = value > 0 ? '+' : '';
                return `<span style="color: ${color}; font-size: 11px; margin-right: 8px;">${name}${sign}${value}</span>`;
            });

            effectsHtml = `<div style="margin-top: 8px;">${effects.join('')}</div>`;
        }

        html += `
            <div style="background: linear-gradient(135deg, rgba(50,40,60,0.9) 0%, rgba(30,25,40,0.95) 100%);
                       border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; padding: 15px;
                       display: flex; align-items: flex-start; gap: 15px;">
                <div style="font-size: 36px; min-width: 50px; text-align: center;">${relic.icon}</div>
                <div style="flex: 1;">
                    <div style="color: #ffd700; font-size: 15px; font-weight: bold; margin-bottom: 5px;">${relic.name}</div>
                    <div style="color: #aaa; font-size: 12px; line-height: 1.5;">${relic.desc}</div>
                    ${effectsHtml}
                </div>
            </div>
        `;
    });

    html += '</div>';

    // 添加统计信息
    html += `
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333; text-align: center;">
            <span style="color: #888; font-size: 12px;">共拥有 </span>
            <span style="color: #ffd700; font-size: 14px; font-weight: bold;">${relics.length}</span>
            <span style="color: #888; font-size: 12px;"> 件圣遗物</span>
        </div>
    `;

    return html;
}

// 弹窗内的关系展开/折叠（使用 modal- 前缀的 ID）
function toggleModalRelationshipDetails(index) {
    const detailsDiv = document.getElementById(`modal-relationship-details-${index}`);
    if (detailsDiv) {
        const isHidden = detailsDiv.style.display === 'none' || !detailsDiv.style.display;
        detailsDiv.style.display = isHidden ? 'block' : 'none';
    }
}


// 调试信息：确认关键数据已加载
console.log('[xiuxian-config] ✅ 配置文件加载完成');
console.log('[xiuxian-config] - origins 数量:', window.origins ? window.origins.length : 'undefined');
console.log('[xiuxian-config] - talents 数量:', window.talents ? window.talents.length : 'undefined');
console.log('[xiuxian-config] - characterCreation:', typeof window.characterCreation !== 'undefined' ? '已定义' : 'undefined');

// 状态面板渲染函数
function renderStatusPanel(vars) {
    // 兼容处理：如果传入的是完整gameState，提取variables部分
    const variables = vars.variables || vars;

    console.log('[现代配置] renderStatusPanel 被调用');
    console.log('[现代配置] variables:', variables);

    // 检查关键元素是否存在（状态面板是否已加载）
    // 兼容ACJT模式：检查多个可能的元素
    const hasStatusPanel = document.getElementById('currentDateTime') ||
        document.getElementById('playerFloor') ||
        document.getElementById('relationshipsList');
    if (!hasStatusPanel) {
        console.warn('[现代配置] ⚠️ 状态面板元素不存在，跳过渲染');
        console.warn('[现代配置] 请确保 HTML模板已正确加载');
        return;
    }

    console.log('[现代配置] ✅ 状态面板元素存在，开始渲染');

    // 安全设置元素文本的辅助函数
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    // 姓名
    setElementText('playerName', variables.name || '未命名');

    // 时间
    setElementText('currentDateTime', variables.currentDateTime || '-');

    // 基本信息
    setElementText('charName', variables.name || '未知');
    setElementText('charAge', variables.age || '-');
    setElementText('charGender', variables.gender || '-');
    setElementText('charIdentity', variables.identity || '-');
    setElementText('charJob', variables.job || '-');
    setElementText('charLocation', variables.location || '-');
    setElementText('charTalents', variables.talents && variables.talents.length > 0 ? variables.talents.join('、') : '-');



    // 特殊属性（现代世界观）
    setElementText('reputation', variables.reputation || 0);
    setElementText('stress', variables.stress || 0);

    // 势力信息
    renderFactionInfo(variables);

    // 主角详细信息
    renderProtagonistDetails(variables);

    // 道具列表
    renderItems(variables);

    // 人际关系
    renderRelationships(variables);

    // 重要历史
    renderHistory(variables);

    // 特殊状态
    renderSpecialStatus(variables);

    console.log('[现代配置] ✅ renderStatusPanel 完成');
}

// 渲染主角详细信息
function renderProtagonistDetails(vars) {
    const protagonist = vars.protagonist;

    // 基本状态
    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || '未知';
    };

    if (protagonist) {
        setEl('protagonistAppearance', protagonist.appearance);
        setEl('protagonistSexPref', protagonist.sexualPreference);
        setEl('protagonistVirgin', protagonist.isVirgin === true ? '是' : protagonist.isVirgin === false ? '否' : '未知');
        setEl('protagonistFirstSex', protagonist.firstSex);
        setEl('protagonistLastSex', protagonist.lastSex);

        // 身体详情
        const bodyPartsDiv = document.getElementById('protagonistBodyParts');
        if (bodyPartsDiv && protagonist.bodyParts) {
            const parts = [
                { key: 'penis', name: '阳物', icon: '🍆' },
                { key: 'vagina', name: '小穴', icon: '🌸' },
                { key: 'breasts', name: '胸部', icon: '🍒' },
                { key: 'mouth', name: '嘴巴', icon: '👄' },
                { key: 'anus', name: '肛门', icon: '🔘' },
                { key: 'hands', name: '手部', icon: '🤲' },
                { key: 'feet', name: '足部', icon: '🦶' }
            ];

            let html = '';
            parts.forEach(part => {
                const data = protagonist.bodyParts[part.key];
                if (data) {
                    html += `<div style="margin-bottom: 4px;">
                        <span style="color: #ff69b4;">${part.icon} ${part.name}：</span>
                        <span style="color: #999;">${data.description || '未知'}</span>
                        <span style="color: #2ed573; margin-left: 5px;">(${data.useCount || 0}次)</span>
                    </div>`;
                }
            });

            bodyPartsDiv.innerHTML = html || '暂无数据';
        }
    } else {
        // protagonist 为空时显示提示
        const bodyPartsDiv = document.getElementById('protagonistBodyParts');
        if (bodyPartsDiv) {
            bodyPartsDiv.innerHTML = '<div style="color: #666;">等待AI生成...</div>';
        }
    }
}

// 渲染势力信息
function renderFactionInfo(vars) {
    const factionInfo = document.getElementById('factionInfo');
    if (!factionInfo) return;

    if (vars.faction && vars.faction.name) {
        const faction = vars.faction;
        const membersText = Array.isArray(faction.members) && faction.members.length > 0
            ? faction.members.join('、')
            : '无';

        factionInfo.innerHTML = `
            <div class="relationship-detail-row">
                <span class="relationship-detail-label">势力名：</span>
                <span class="relationship-detail-value">${faction.name}</span>
            </div>
            ${faction.leader ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">领袖：</span>
                <span class="relationship-detail-value">${faction.leader}</span>
            </div>` : ''}
            ${faction.location ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">所在地：</span>
                <span class="relationship-detail-value">${faction.location}</span>
            </div>` : ''}
            ${faction.members && faction.members.length > 0 ? `<div class="relationship-detail-row">
                <span class="relationship-detail-label">主要成员：</span>
                <span class="relationship-detail-value">${membersText}</span>
            </div>` : ''}
            ${faction.description ? `<div class="relationship-detail-row" style="flex-direction: column; align-items: flex-start;">
                <span class="relationship-detail-label">介绍：</span>
                <span class="relationship-detail-value" style="margin-top: 5px; line-height: 1.6;">${faction.description}</span>
            </div>` : ''}
        `;
    } else {
        factionInfo.innerHTML = '<div style="text-align: center; color: #999;">暂无势力</div>';
    }
}



// 获取属性中文名称
function getAttributeName(attr) {
    const names = {
        'physique': '体质',
        'fortune': '运气',
        'comprehension': '智力',
        'spirit': '精神',
        'potential': '潜力',
        'charisma': '魅力'
    };
    return names[attr] || attr;
}

// 渲染道具列表
function renderItems(vars) {
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) return;

    if (Array.isArray(vars.items) && vars.items.length > 0) {
        itemsList.innerHTML = vars.items.map((item, index) => {
            const isEquipment = item.type && item.type.startsWith('装备-');
            const isPill = item.type && (item.type.includes('药物') || item.type.includes('药'));

            const equipBtn = isEquipment ? `<button class="equip-btn" onclick="equipItem('${item.name}')">装备</button>` : '';
            const usePillBtn = isPill ? `<button class="equip-btn" onclick="usePill(${index})" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">服用</button>` : '';

            const effectsText = item.effects ? Object.entries(item.effects).map(([attr, value]) => {
                if (attr === 'skillProgress') {
                    return `技能进度+${value}`;
                } else if (attr === 'hp') {
                    return `体力${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'mp') {
                    return `精力${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'hpMax') {
                    return `体力上限${value > 0 ? '+' : ''}${value}`;
                } else if (attr === 'mpMax') {
                    return `精力上限${value > 0 ? '+' : ''}${value}`;
                }
                return `${getAttributeName(attr)}${value > 0 ? '+' : ''}${value}`;
            }).join(' ') : '';

            return `<div class="item-entry">
                <div>
                    <div>${item.name} x${item.count}</div>
                    <div style="font-size: 11px; color: #666;">${item.type || ''} ${effectsText}</div>
                </div>
                <div class="item-actions">
                    ${equipBtn}
                    ${usePillBtn}
                </div>
            </div>`;
        }).join('');
    } else {
        itemsList.innerHTML = '<div style="text-align: center; color: #999;">暂无道具</div>';
    }
}

// 渲染人际关系
function renderRelationships(vars) {
    const relationshipsList = document.getElementById('relationshipsList');
    if (!relationshipsList) return;

    console.log('[现代配置] renderRelationships 被调用');
    console.log('[现代配置] relationships:', vars.relationships);

    if (vars.relationships && vars.relationships.length > 0) {
        relationshipsList.innerHTML = vars.relationships.map((rel, index) => {
            console.log(`[现代配置] 渲染关系 ${index}:`, rel);
            console.log(`[现代配置] ${rel.name}.history:`, rel.history);

            // 根据好感度设置颜色类
            let favorClass = '';
            if (rel.favor >= 60) {
                favorClass = 'high';
            } else if (rel.favor <= -30) {
                favorClass = 'low';
            }

            // 构建历史互动记录
            let historyHtml = '';
            if (Array.isArray(rel.history) && rel.history.length > 0) {
                console.log(`[现代配置] ${rel.name} 有 ${rel.history.length} 条历史记录`);
                historyHtml = `
                    <div class="relationship-history">
                        <div class="relationship-history-title">📜 历史互动</div>
                        ${rel.history.map(h => `<div class="relationship-history-item">• ${h}</div>`).join('')}
                    </div>
                `;
            } else {
                console.log(`[现代配置] ${rel.name} 无历史记录或为空`);
            }

            return `
                <div class="relationship-card" onclick="toggleRelationshipDetails(${index})">
                    <div class="relationship-header">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <button class="equip-btn" onclick="event.stopPropagation(); deleteRelationship(${index})"
                                style="background: linear-gradient(135deg, #c85a54 0%, #a84842 100%); padding: 3px 8px;">
                                🗑️
                            </button>
                            <span class="relationship-name">${rel.name} (${rel.relation})</span>
                        </div>
                        <span class="relationship-favor ${favorClass}">好感: ${rel.favor}</span>
                    </div>
                    <div class="relationship-details" id="relationship-details-${index}">
                        ${rel.age ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">年龄：</span>
                            <span class="relationship-detail-value">${rel.age}岁</span>
                        </div>` : ''}
                        ${rel.job ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">职业：</span>
                            <span class="relationship-detail-value">${rel.job}</span>
                        </div>` : ''}
                        ${rel.personality ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">性格：</span>
                            <span class="relationship-detail-value">${rel.personality}</span>
                        </div>` : ''}
                        ${rel.opinion ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">看法：</span>
                            <span class="relationship-detail-value">${rel.opinion}</span>
                        </div>` : ''}
                        ${rel.appearance ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">外貌：</span>
                            <span class="relationship-detail-value">${rel.appearance}</span>
                        </div>` : ''}
                        ${rel.sexualPreference ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">性癖：</span>
                            <span class="relationship-detail-value">${rel.sexualPreference}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">性癖：</span><span class="relationship-detail-value">未知</span></div>'}
                        ${rel.isVirgin !== null && rel.isVirgin !== undefined ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">是否处女：</span>
                            <span class="relationship-detail-value">${rel.isVirgin ? '处子之身' : '非处'}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">是否处女：</span><span class="relationship-detail-value">未知</span></div>'}
                        ${rel.firstSex && rel.firstSex !== '未知' ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">初次做爱：</span>
                            <span class="relationship-detail-value">${rel.firstSex}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">初次做爱：</span><span class="relationship-detail-value">未知</span></div>'}
                        ${rel.lastSex && rel.lastSex !== '未知' ? `<div class="relationship-detail-row">
                            <span class="relationship-detail-label">最近做爱：</span>
                            <span class="relationship-detail-value">${rel.lastSex}</span>
                        </div>` : '<div class="relationship-detail-row"><span class="relationship-detail-label">最近做爱：</span><span class="relationship-detail-value">未知</span></div>'}
                        <div class="body-details-section" style="margin-top: 10px; padding: 10px; background: linear-gradient(135deg, rgba(255, 105, 180, 0.1) 0%, rgba(255, 192, 203, 0.15) 100%); border-radius: 8px; border: 1px solid rgba(255, 105, 180, 0.3);">
                            <div class="body-details-title" style="color: #ff69b4; font-weight: bold; margin-bottom: 8px; text-align: center;">🌸 身体详情 🌸</div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">小穴：</span>
                                <span style="color: #666;">${rel.bodyParts?.vagina?.description || '未知'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(使用${rel.bodyParts?.vagina?.useCount || 0}次)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">胸部：</span>
                                <span style="color: #666;">${rel.bodyParts?.breasts?.description || '未知'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(使用${rel.bodyParts?.breasts?.useCount || 0}次)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">嘴巴：</span>
                                <span style="color: #666;">${rel.bodyParts?.mouth?.description || '未知'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(使用${rel.bodyParts?.mouth?.useCount || 0}次)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">小手：</span>
                                <span style="color: #666;">${rel.bodyParts?.hands?.description || '未知'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(使用${rel.bodyParts?.hands?.useCount || 0}次)</span>
                            </div>
                            <div class="body-part-item" style="font-size: 11px; margin-bottom: 4px;">
                                <span style="color: #ff69b4; font-weight: bold;">玉足：</span>
                                <span style="color: #666;">${rel.bodyParts?.feet?.description || '未知'}</span>
                                <span style="color: #28a745; margin-left: 5px;">(使用${rel.bodyParts?.feet?.useCount || 0}次)</span>
                            </div>
                        </div>
                        ${historyHtml}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        relationshipsList.innerHTML = '<div style="text-align: center; color: #999;">暂无关系</div>';
    }
}

// 渲染重要历史
function renderHistory(vars) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    // 确保 vars.history 是数组类型
    if (Array.isArray(vars.history) && vars.history.length > 0) {
        historyList.innerHTML = vars.history.map((h, index) => {
            return `<div class="history-item">
                <span class="history-index">${index + 1}</span>
                <div class="history-content">${h}</div>
            </div>`;
        }).join('');
    } else {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">暂无历史记录</div>';
    }
}

// 渲染特殊状态（包括AI返回的specialStatus和protagonist.status）
function renderSpecialStatus(vars) {
    const container = document.getElementById('specialStatusList');
    if (!container) return;

    let html = '';
    let hasStatus = false;

    // 1. 渲染主角当前状态（protagonist.status 或 vars.status）
    const protagonistStatus = vars.protagonist?.status || vars.status;
    if (protagonistStatus && protagonistStatus !== '正常') {
        hasStatus = true;
        html += `
            <div style="background: rgba(255,200,100,0.15); border: 1px solid rgba(255,200,100,0.4); 
                 border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ffa502; font-weight: bold;">📍 当前状态</span>
                </div>
                <div style="color: #ffeaa7; margin-top: 4px; font-size: 12px;">${protagonistStatus}</div>
            </div>
        `;
    }

    // 2. 渲染主角心情和想法
    const mood = vars.protagonist?.mood || vars.mood;
    const thought = vars.protagonist?.thought || vars.thought;
    if (mood || thought) {
        hasStatus = true;
        html += `
            <div style="background: rgba(155,89,182,0.15); border: 1px solid rgba(155,89,182,0.4); 
                 border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                ${mood ? `<div style="color: #a29bfe; margin-bottom: 4px;">💭 心情：<span style="color: #dfe6e9;">${mood}</span></div>` : ''}
                ${thought ? `<div style="color: #a29bfe; font-style: italic; font-size: 11px;">"${thought}"</div>` : ''}
            </div>
        `;
    }

    // 3. 渲染 specialStatus 对象中的特殊状态
    const specialStatus = vars.specialStatus;
    if (specialStatus && typeof specialStatus === 'object') {
        const statusKeys = Object.keys(specialStatus);
        if (statusKeys.length > 0) {
            hasStatus = true;
            statusKeys.forEach(statusName => {
                const status = specialStatus[statusName];
                if (status && (status.active === true || status.active === null || status.active === undefined)) {
                    const effect = status.effect || '';
                    const description = status.description || '';
                    html += `
                        <div class="special-status-item" style="background: rgba(255,100,100,0.15); 
                             border: 1px solid rgba(255,100,100,0.4); border-radius: 6px; 
                             padding: 8px; margin-bottom: 6px; cursor: pointer;"
                             title="${description}">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #ff6b81; font-weight: bold;">⚠️ ${statusName}</span>
                            </div>
                            ${effect ? `<div style="color: #fab1a0; font-size: 11px; margin-top: 3px;">效果：${effect}</div>` : ''}
                            ${description ? `<div style="color: #888; font-size: 10px; margin-top: 3px;">${description}</div>` : ''}
                        </div>
                    `;
                }
            });
        }
    }

    // 4. 同时检查 SpecialStatusManager（卡牌系统的特殊状态）
    if (typeof SpecialStatusManager !== 'undefined') {
        const cardStatuses = SpecialStatusManager.getActive();
        if (cardStatuses && cardStatuses.length > 0) {
            hasStatus = true;
            cardStatuses.forEach(status => {
                html += `
                    <div class="special-status-item" style="background: rgba(255,100,100,0.1); 
                         border: 1px solid rgba(255,100,100,0.3); border-radius: 6px; 
                         padding: 8px; margin-bottom: 6px; cursor: pointer;"
                         onclick="SpecialStatusManager.showDetail('${status.id}')"
                         title="${status.fullDesc}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #ff6b81;">${status.icon} ${status.id}</span>
                            <span style="color: #888; font-size: 10px;">${status.desc}</span>
                        </div>
                    </div>
                `;
            });
        }
    }

    if (hasStatus) {
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">暂无异常状态</div>';
    }
}

// 生成角色创建界面HTML（现代游戏特有）
function generateCharacterCreationHTML() {
    return `
        <div class="character-creation">
            <div class="creation-title">⚡ 角色初始化 ⚡</div>


            <!-- 难度选择 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">⚠️</span> 难度协议 / DIFFICULTY</h3>
                <div class="difficulty-options">
                    <div class="difficulty-card" data-difficulty="easy" onclick="selectDifficulty('easy')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">简单模式</div>
                            <div class="difficulty-card-badge">EASY</div>
                        </div>
                        <div class="difficulty-card-description">适合新手的温和开局，拥有充足的资源。</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">200 点数</span>
                            <span class="difficulty-card-feature">高容错率</span>
                        </div>
                    </div>
                    <div class="difficulty-card selected" data-difficulty="normal" onclick="selectDifficulty('normal')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">普通模式</div>
                            <div class="difficulty-card-badge">NORMAL</div>
                        </div>
                        <div class="difficulty-card-description">标准的现代都市体验，风险与机遇并存。</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">100 点数</span>
                            <span class="difficulty-card-feature">平衡体验</span>
                        </div>
                    </div>
                    <div class="difficulty-card hard" data-difficulty="hard" onclick="selectDifficulty('hard')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">困难模式</div>
                            <div class="difficulty-card-badge">HARD</div>
                        </div>
                        <div class="difficulty-card-description">资源匮乏，环境恶劣，只有强者才能生存。</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">50 点数</span>
                            <span class="difficulty-card-feature">极限挑战</span>
                        </div>
                    </div>
                    <div class="difficulty-card" data-difficulty="dragon" onclick="selectDifficulty('dragon')">
                        <div class="difficulty-card-header">
                            <div class="difficulty-card-title">龙傲天</div>
                            <div class="difficulty-card-badge">GOD MODE</div>
                        </div>
                        <div class="difficulty-card-description">无视规则的存在，你就是这个世界的主宰。</div>
                        <div class="difficulty-card-features">
                            <span class="difficulty-card-feature">9999 点数</span>
                            <span class="difficulty-card-feature">横扫一切</span>
                        </div>
                    </div>
                </div>
                <div class="points-display">
                    <span class="points-label">REMAINING POINTS / 剩余点数</span>
                    <div class="points-remaining" id="remainingPoints">100</div>
                </div>
            </div>

            <!-- 基本信息 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">👤</span> 身份档案 / BASIC INFO</h3>
                <div class="form-row">
                    <div class="config-group">
                        <label>代号 / NAME</label>
                        <input type="text" id="charNameInput" class="input-full" placeholder="请输入你的代号..." value="云逍遥">
                    </div>
                    <div class="config-group">
                        <label>骨龄 / AGE</label>
                        <input type="number" id="charAgeInput" class="input-full" placeholder="请输入年龄" value="18" min="1" max="999">
                    </div>
                </div>
                <div class="form-row">
                    <div class="config-group">
                        <label>人格特质 / PERSONALITY</label>
                        <input type="text" id="charPersonality" class="input-full" placeholder="如：冷酷、理性..." value="洒脱不羁">
                    </div>
                </div>
                <div class="config-group">
                    <label>生理性别 / GENDER</label>
                    <div class="gender-options">
                        <div class="gender-card selected" data-gender="male" onclick="selectGender('male')">
                            <span style="font-size: 24px; display: block; margin-bottom: 5px;">👨</span> 男性 MALE
                        </div>
                        <div class="gender-card" data-gender="female" onclick="selectGender('female')">
                            <span style="font-size: 24px; display: block; margin-bottom: 5px;">👩</span> 女性 FEMALE
                        </div>
                    </div>
                </div>
            </div>

            <!-- 出身选择 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">🏙️</span> 社会阶层 / ORIGIN</h3>
                <div class="creation-subtitle" style="text-align: left; margin-bottom: 15px;">选择你的出身背景，这将决定你的初始属性和可用资源。</div>
                <div id="originGrid" class="origin-options">
                    <!-- 出身卡片将通过JS动态生成 -->
                </div>
            </div>

            <!-- 自定义设定 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">💾</span> 额外数据 / CUSTOM DATA</h3>
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 10px;">写入额外的背景数据或特殊设定（可选）</p>
                <textarea id="customSettings" placeholder="例如：身怀隐秘代码、拥有黑客义体、被巨头公司通缉..."
                          style="width: 100%; min-height: 100px;"></textarea>
            </div>

            <!-- 天赋选择 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">🧬</span> 基因天赋 / TALENTS</h3>
                <div class="talent-grid" id="talentGrid">
                    <!-- 天赋卡片将通过JS动态生成 -->
                </div>
            </div>

            <!-- 六维属性 -->
            <div class="creation-section">
                <h3><span style="margin-right: 10px;">📊</span> 属性分配 / ATTRIBUTES</h3>
                <div class="creation-subtitle" style="text-align: left; margin-bottom: 15px;">分配你的核心属性点（每点消耗1点数）</div>
                <div id="attributesPanel">
                    <div class="attribute-row">
                        <span class="attr-name">💪 体质<br><span style="font-size: 10px; opacity: 0.7;">PHYSIQUE</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('physique', -1)">-</button>
                            <span class="attr-value" id="physique-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('physique', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">🍀 运气<br><span style="font-size: 10px; opacity: 0.7;">FORTUNE</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('fortune', -1)">-</button>
                            <span class="attr-value" id="fortune-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('fortune', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">🧠 智力<br><span style="font-size: 10px; opacity: 0.7;">INTELLECT</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('comprehension', -1)">-</button>
                            <span class="attr-value" id="comprehension-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('comprehension', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">👁️ 精神<br><span style="font-size: 10px; opacity: 0.7;">SPIRIT</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('spirit', -1)">-</button>
                            <span class="attr-value" id="spirit-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('spirit', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">⚡ 潜力<br><span style="font-size: 10px; opacity: 0.7;">POTENTIAL</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('potential', -1)">-</button>
                            <span class="attr-value" id="potential-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('potential', 1)">+</button>
                        </div>
                    </div>
                    <div class="attribute-row">
                        <span class="attr-name">✨ 魅力<br><span style="font-size: 10px; opacity: 0.7;">CHARISMA</span></span>
                        <div class="attr-controls">
                            <button class="attr-btn" onclick="adjustAttribute('charisma', -1)">-</button>
                            <span class="attr-value" id="charisma-value">10</span>
                            <button class="attr-btn" onclick="adjustAttribute('charisma', 1)">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 确认按钮 -->
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary glow-effect" onclick="confirmCharacterCreation()" style="font-size: 18px; padding: 18px 60px;">
                    ✅ 启动神经链接 / START GAME
                </button>
            </div>
        </div>
    `;
}

// 导出现代游戏配置
const XiuxianGameConfig = {
    gameName: '艾超尖塔',
    fullSystemPrompt: fullSystemPrompt,                 // 完整的游戏系统提示词（基础）
    defaultSystemPrompt: defaultSystemPrompt,           // 现代游戏规则（变量检查清单）
    baseSystemPrompt: baseSystemPrompt,                 // 🆕 基础提示词（不含变量规则，异步模式主API使用）
    getAsyncVariablePrompt: getAsyncVariablePrompt,     // 🆕 获取变量规则提示词函数（异步模式额外API使用）
    defaultDynamicWorldPrompt: defaultDynamicWorldPrompt, // 默认动态世界提示词
    systemPrompt: getSystemPrompt,                      // 获取系统提示词的函数
    dynamicWorldPrompt: getDynamicWorldPrompt,          // 获取动态世界提示词的函数
    characterCreation: window.characterCreation,
    origins: window.origins,
    renderStatus: renderStatusPanel,
    generateStatusPanel: generateStatusPanelHTML,       // 生成状态面板HTML的函数
    generateCharacterCreation: generateCharacterCreationHTML, // 生成角色创建界面HTML的函数

    // 初始化回调
    onInit: function (framework) {
        console.log('[acjtConfig] 艾超尖塔游戏配置已加载');
        console.log('[acjtConfig] 🆕 异步变量功能已就绪');

        // 设置全局变量供其他函数使用
        window.xiuxianConfig = this;

        // 🆕 设置 ACJTConfig 全局变量（供异步变量功能使用）
        window.ACJTConfig = {
            baseSystemPrompt: baseSystemPrompt,
            getAsyncVariablePrompt: getAsyncVariablePrompt,
            defaultSystemPrompt: defaultSystemPrompt
        };

        // 🔧 强制填充现代游戏提示词（覆盖任何现有值）
        const systemPromptEl = document.getElementById('systemPrompt');
        const dynamicWorldPromptEl = document.getElementById('dynamicWorldPrompt');

        if (systemPromptEl) {
            systemPromptEl.value = fullSystemPrompt;
            console.log('[XiuxianConfig] 🎮 强制设置系统提示词（游戏基础规则）');
            console.log('[XiuxianConfig] 📏 系统提示词长度:', fullSystemPrompt.length);
        }

        if (dynamicWorldPromptEl) {
            dynamicWorldPromptEl.value = defaultDynamicWorldPrompt;
            console.log('[XiuxianConfig] 🌍 强制设置动态世界提示词（现代世界观）');
            console.log('[XiuxianConfig] 📏 动态世界提示词长度:', defaultDynamicWorldPrompt.length);
        }

        // 动态插入状态面板HTML
        const statusPanelContainer = document.getElementById('statusPanelContainer');
        console.log('[XiuxianConfig] 查找 statusPanelContainer:', statusPanelContainer);

        if (statusPanelContainer) {
            // 检查是否已经有实际的HTML元素（不只是注释）
            const hasRealContent = statusPanelContainer.children.length > 0;

            if (!hasRealContent) {
                statusPanelContainer.innerHTML = generateStatusPanelHTML();
                console.log('[XiuxianConfig] ✅ 状态面板HTML已插入');
            } else {
                console.log('[XiuxianConfig] ⚠️ statusPanelContainer 已有内容，跳过插入');
            }
        } else {
            console.error('[XiuxianConfig] ❌ 找不到 statusPanelContainer 元素！');
        }
    }
};

// 导出到全局
window.XiuxianGameConfig = XiuxianGameConfig;
