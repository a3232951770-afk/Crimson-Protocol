// ============================================================
// dict-defs.js —— 汉典 / 古籍释义数据层（补充块）
// 用途：显示在 CHARACTER_DATA 手写 modern 之下的丰富释义
// 结构：每个字 = { zh: 中文义项数组, en: 英文义项数组（与 zh 逐条对应） }
//   · 多音字义项以〔读音〕前缀区分
//   · 「（考释）」为说文/古籍等说明性材料，单列一条
//   · 古诗词引文保留中文原句，英文仅译义项，不硬译诗句
// ============================================================

export const DICT_DEFS = {

  /* ========== 母系遗存 matrilineal（10字） ========== */
  "女": {
    zh: [
      "女性，与「男」相对。古代以未婚者为「女」，已婚者为「妇」，今通称「妇女」。",
      "女儿。",
      "星名，二十八宿之一。"
    ],
    en: [
      "A female, as opposed to 男 (male). In antiquity an unmarried female was 女 and a married one 妇; today the two form 妇女 (women).",
      "A daughter.",
      "The name of a star, one of the twenty-eight lunar mansions."
    ]
  },
  "姓": {
    zh: ["表明家族的字。", "平民。"],
    en: ["The graph marking one's family or clan.", "Commoners."]
  },
  "始": {
    zh: ["起头，最初，与「终」相对。", "才，刚才。"],
    en: ["The beginning, the earliest point; the opposite of 终 (end).", "Just now; only then."]
  },
  "姬": {
    zh: [
      "古代对妇女的美称。",
      "汉代宫中的女官。",
      "旧时称妾。",
      "旧时称以歌舞为业的女子。",
      "姓。"
    ],
    en: [
      "An honorific for women in antiquity.",
      "A female palace official in the Han dynasty.",
      "A former term for a concubine.",
      "A former term for a woman who made her living by singing and dancing.",
      "A surname."
    ]
  },
  "姜": {
    zh: ["多年生草本植物，地下茎黄色，味辣，可供调味或入药。", "姓。"],
    en: ["Ginger; a perennial herb whose yellow rhizome is pungent and used as seasoning or medicine.", "A surname."]
  },
  "妫": {
    zh: ["姓。"],
    en: ["A surname."]
  },
  "妊": {
    zh: ["怀孕。"],
    en: ["To be pregnant."]
  },
  "姐": {
    zh: [
      "称同父母（或只同父、只同母）而比自己年长的女子。",
      "对比自己年长的同辈女性的称呼。",
      "对未婚女子的通称。"
    ],
    en: [
      "An elder sister sharing one or both parents.",
      "A term of address for an older female of one's own generation.",
      "A general term of address for a young unmarried woman."
    ]
  },
  "姨": {
    zh: ["称母亲的姊妹。", "妻的姊妹。", "妾。"],
    en: ["One's mother's sister (maternal aunt).", "One's wife's sister.", "A concubine."]
  },
  "姥": {
    zh: [
      "〔mǔ〕年老的妇女。",
      "〔lǎo〕称外祖母，亦为对老妇人的敬称；旧时称接生的妇女。"
    ],
    en: [
      "〔mǔ〕An old woman.",
      "〔lǎo〕A maternal grandmother; also a respectful term for an old woman; formerly, a midwife."
    ]
  },

  /* ========== 褒义字 reclaim（25字） ========== */
  "好": {
    zh: [
      "〔hǎo〕优点多或使人满意的，与「坏」相对。",
      "〔hǎo〕身体康健，疾病消失，生活幸福。",
      "〔hǎo〕友爱，和睦。",
      "〔hǎo〕容易。",
      "〔hǎo〕完成，完善。",
      "〔hǎo〕表示应允、赞成。",
      "〔hǎo〕很，甚。",
      "〔hǎo〕便于。",
      "〔hǎo〕反话，表示不满意。",
      "〔hào〕喜爱，与「恶」（wù）相对。",
      "〔hào〕常常，容易（发生某事）。"
    ],
    en: [
      "〔hǎo〕Having many merits; satisfactory; the opposite of 坏 (bad).",
      "〔hǎo〕Healthy, recovered from illness, living well.",
      "〔hǎo〕Friendly, on good terms.",
      "〔hǎo〕Easy to do.",
      "〔hǎo〕Finished, brought to completion.",
      "〔hǎo〕Expressing assent or approval — all right, yes.",
      "〔hǎo〕Very, quite.",
      "〔hǎo〕So as to make convenient.",
      "〔hǎo〕Said ironically, expressing dissatisfaction.",
      "〔hào〕To like, to be fond of; the opposite of 恶 (wù, to dislike).",
      "〔hào〕To be prone to; for something to happen readily."
    ]
  },
  "妙": {
    zh: ["美，好。", "奇巧，神奇。", "青春年少。"],
    en: ["Fine, good.", "Ingenious, wonderful.", "Young, in the flower of youth."]
  },
  "娇": {
    zh: ["美好可爱。", "爱怜过甚，过分珍惜。", "柔弱。"],
    en: ["Lovely, endearing.", "To pamper, to dote on excessively.", "Delicate, frail."]
  },
  "妍": {
    zh: ["美丽。", "巧。"],
    en: ["Beautiful.", "Clever, skillful."]
  },
  "婉": {
    zh: ["和顺，（说话）曲折含蓄。", "美好，柔美。"],
    en: ["Gentle and compliant; (of speech) indirect and tactful.", "Fine, softly beautiful."]
  },
  "娴": {
    zh: ["熟练。", "文雅。"],
    en: ["Skilled, practiced.", "Refined, elegant."]
  },
  "姿": {
    zh: ["面貌，容貌。", "形态，样子。"],
    en: ["Looks, facial appearance.", "Form, bearing, manner."]
  },
  "娟": {
    zh: ["秀丽，美好。"],
    en: ["Graceful and fair."]
  },
  "婷": {
    zh: ["〔婷婷〕形容人或花木美好。", "〔娉婷〕见「娉」。"],
    en: ["〔婷婷〕describing the loveliness of a person or of flowering plants.", "〔娉婷〕see 娉."]
  },
  "婀": {
    zh: ["柔美的样子。"],
    en: ["The look of soft grace."]
  },
  "娜": {
    zh: [
      "〔nà〕女子人名用字及译音字。",
      "〔nuó〕柔美的样子；轻柔的样子。"
    ],
    en: [
      "〔nà〕A character used in women's given names and in transliteration.",
      "〔nuó〕The look of soft grace; the look of light gentleness."
    ]
  },
  "妩": {
    zh: ["〔妩媚〕女子、花木等姿态美好可爱。（繁体作「嫵」）"],
    en: ["〔妩媚〕the charming, lovely bearing of a woman or of flowering plants. (Traditional form 嫵.)"]
  },
  "姝": {
    zh: ["美丽，美好。", "美女。", "柔顺。"],
    en: ["Beautiful, fine.", "A beautiful woman.", "Gentle and yielding."]
  },
  "娉": {
    zh: ["〔娉婷〕形容女子姿态美好。"],
    en: ["〔娉婷〕describing a woman's graceful bearing."]
  },
  "姣": {
    zh: ["美好。", "淫乱。"],
    en: ["Fair, comely.", "Licentious."]
  },
  "娆": {
    zh: [
      "〔ráo〕娇媚；柔弱。",
      "〔rǎo〕烦忧，扰乱。"
    ],
    en: [
      "〔ráo〕Charming and alluring; delicate.",
      "〔rǎo〕Troubled; to disturb."
    ]
  },
  "妥": {
    zh: ["适当，合适。", "安稳，停当（多用在动词后）。"],
    en: ["Proper, fitting.", "Settled, in good order (often used after a verb)."]
  },
  "淑": {
    zh: ["善，美（多指女性）。", "清澈。"],
    en: ["Good and fair (usually of women).", "Clear, limpid."]
  },
  "妈": {
    zh: [
      "称呼母亲。",
      "对女性长辈的称呼。",
      "旧时连着姓称中、老年女仆。"
    ],
    en: [
      "A term of address for one's mother.",
      "A term of address for older female relatives.",
      "Formerly, appended to a surname to address a middle-aged or elderly female servant."
    ]
  },
  "奶": {
    zh: ["哺乳的器官。", "乳汁。", "用乳房给孩子喂奶。"],
    en: ["The organ that gives milk (the breast).", "Milk.", "To nurse a child at the breast."]
  },
  "娘": {
    zh: ["母亲。", "对年轻女子的称呼。", "称长一辈或年长的已婚妇女。"],
    en: ["Mother.", "A term of address for a young woman.", "A term for a married woman of the older generation or one's senior."]
  },
  "媛": {
    zh: [
      "〔yuàn〕美女。",
      "〔yuán〕〔婵媛〕牵引；情思牵萦。"
    ],
    en: [
      "〔yuàn〕A beautiful woman.",
      "〔yuán〕〔婵媛〕to pull, to draw; (of feeling) to be bound up in longing."
    ]
  },
  "婵": {
    zh: [
      "〔婵娟〕①姿态美好，如「竹婵婵，笼晓烟」；②指美女，如「一带妆楼临水盖，家家分影照婵娟」；③指月亮。",
      "〔婵媛〕①牵连，相连，如「结根竦本，垂条婵媛」；②眷恋，如「心婵媛而伤怀兮」。",
      "〔婵连〕牵连，引申为亲族，如「云余肇祖于高阳兮，惟楚怀之婵连」。"
    ],
    en: [
      "〔婵娟〕① a graceful bearing (line 竹婵婵，笼晓烟); ② a beautiful woman (line 一带妆楼临水盖，家家分影照婵娟); ③ the moon.",
      "〔婵媛〕① linked, joined (line 结根竦本，垂条婵媛); ② deep attachment (line 心婵媛而伤怀兮).",
      "〔婵连〕linked; by extension, kin (line 云余肇祖于高阳兮，惟楚怀之婵连)."
    ]
  },
  "嫣": {
    zh: ["容貌美好，多指笑容。"],
    en: ["Fair of appearance, usually of a smile."]
  },
  "媱": {
    zh: ["曲肩行的样子。", "嬉戏，玩乐。", "美好。"],
    en: ["The manner of walking with the shoulders swaying.", "To play, to frolic.", "Fine, good."]
  },

  /* ========== 中性字 neutral（7字） ========== */
  "如": {
    zh: [
      "依照，顺从。",
      "像，相似。",
      "比得上，及。",
      "到，往。",
      "假若，假设。",
      "奈，怎么。",
      "与，和。",
      "或者。",
      "用在形容词后，表示动作或事物的状态。",
      "表示举例。",
      "应当。",
      "〔如月〕农历二月的别称。",
      "姓。"
    ],
    en: [
      "To follow, to comply with.",
      "To be like, to resemble.",
      "To be a match for, to equal.",
      "To go to.",
      "If, supposing.",
      "How, what to do about.",
      "And, with.",
      "Or.",
      "Used after an adjective to describe a state.",
      "To introduce an example — such as.",
      "Ought to.",
      "〔如月〕an alternative name for the second lunar month.",
      "A surname."
    ]
  },
  "娠": {
    zh: ["胎儿在母体中微动，泛指怀孕。"],
    en: ["The stirring of a fetus in the womb; by extension, pregnancy."]
  },
  "娩": {
    zh: ["妇女生孩子。"],
    en: ["(Of a woman) to give birth."]
  },
  "委": {
    zh: [
      "任，派，把事交给人办。",
      "抛弃，舍弃。",
      "推托，卸。",
      "曲折，弯转。",
      "积聚。",
      "末，尾。",
      "确实。",
      "无精打采，不振作。"
    ],
    en: [
      "To appoint; to entrust a matter to someone.",
      "To cast off, to abandon.",
      "To shirk, to shift responsibility.",
      "Winding, bending.",
      "To accumulate.",
      "The end, the tail.",
      "Indeed, truly.",
      "Listless, dispirited."
    ]
  },
  "妹": {
    zh: [
      "称同父母（或只同父、只同母）而比自己年幼的女子。",
      "对比自己年幼的同辈女性的称呼。",
      "年轻女子；女孩子。",
      "姓。"
    ],
    en: [
      "A younger sister sharing one or both parents.",
      "A term of address for a younger female of one's own generation.",
      "A young woman; a girl.",
      "A surname."
    ]
  },
  "媒": {
    zh: ["撮合男女婚事的人。", "使双方发生关系的人或事物。"],
    en: ["A matchmaker who arranges marriages.", "A person or thing that brings two sides into relation; a medium, an agent."]
  },
  "嬉": {
    zh: ["游戏，玩耍。"],
    en: ["To play, to amuse oneself."]
  },

  /* ========== 制度字 institution（20字） ========== */
  "娶": {
    zh: [
      "把女子接过来成亲。",
      "（考释）《说文解字》：「取婦也。从女从取，取亦聲。」古代战争中割取俘虏或敌人的左耳作为记功凭证，「取」的甲骨文即呈此象；汉字「立象以取义，得意而忘形」，「取」引申为「以武力获得」。「娶」从女从取，可理解为「以武力抢个妻子」，仍是抢婚习俗的印证。汉代以前文献中「娶」常写作「取」，如《礼记·杂记》：「可以冠，取妻。」"
    ],
    en: [
      "To take a woman in marriage.",
      "(Note) The Shuowen Jiezi glosses 娶 as “to take a wife; composed of 女 and 取, with 取 also giving the sound.” In antiquity the left ear of a captured or slain enemy was cut off as proof of merit, and the oracle-bone form of 取 depicts this; since Chinese characters set up an image to seize a meaning and then let the image go, 取 came to mean to obtain by force. 娶, built from 女 and 取, may thus be read as “to seize a wife by force” — a trace of marriage-by-capture. In pre-Han texts 娶 was often written 取, as in the Liji (“Zaji”): “one may cap and take a wife.”"
    ]
  },
  "嫁": {
    zh: [
      "女子结婚。",
      "〔嫁接〕把两种植物接在一起使其变种，以提早结果、增强抗性、提高品质。",
      "把祸害、怨恨推到别人身上。"
    ],
    en: [
      "(Of a woman) to marry.",
      "〔嫁接〕to graft two plants together to alter the variety, so as to fruit earlier, resist disease, and improve quality.",
      "To shift misfortune or blame onto another."
    ]
  },
  "妇": {
    zh: ["已婚的女子。", "妻，与「夫」相对。", "儿媳。", "泛指女性。"],
    en: ["A married woman.", "A wife, as opposed to 夫 (husband).", "A daughter-in-law.", "Women in general."]
  },
  "妻": {
    zh: [
      "〔qī〕男子的配偶。",
      "〔qì〕以女嫁人。"
    ],
    en: [
      "〔qī〕A man's spouse; a wife.",
      "〔qì〕To give a woman in marriage to someone."
    ]
  },
  "妾": {
    zh: ["旧时男人正妻之外娶的女子。", "谦辞，旧时女子自称。"],
    en: ["In former times, a woman a man took in addition to his principal wife; a concubine.", "A humble self-reference formerly used by women."]
  },
  "妃": {
    zh: [
      "〔fēi〕帝王的妾，位次于皇后；亦指太子、王、侯的妻。",
      "〔fēi〕对神女的尊称。",
      "〔fēi〕同「绯」，粉红色。",
      "〔pèi〕同「配」，婚配。"
    ],
    en: [
      "〔fēi〕A ruler's consort, ranking below the empress; also the wife of a crown prince, prince, or marquis.",
      "〔fēi〕An honorific for a goddess.",
      "〔fēi〕Same as 绯, pink.",
      "〔pèi〕Same as 配, to marry, to mate."
    ]
  },
  "嫔": {
    zh: [
      "古代皇宫里的女官，皇帝的妾，侍从。",
      "古代妻死后之称。",
      "〔嫔俪〕伉俪，配偶。",
      "同「缤」，众多的样子。"
    ],
    en: [
      "A female palace official in antiquity; an imperial concubine or attendant.",
      "In antiquity, a title for a wife after her death.",
      "〔嫔俪〕husband and wife; a spouse.",
      "Same as 缤, a look of multitude."
    ]
  },
  "寡": {
    zh: ["少，缺少。", "淡而无味。", "妇女死了丈夫。"],
    en: ["Few, lacking.", "Bland, without flavor.", "(Of a woman) to have lost her husband; widowed."]
  },
  "婴": {
    zh: ["才生下来的小孩儿。", "触，缠绕。"],
    en: ["A newborn child; an infant.", "To touch; to entangle, to be beset by."]
  },
  "嫡": {
    zh: [
      "封建宗法制度中指正妻。",
      "正妻所生的。",
      "亲的，血统最近的，宗法制度下家庭的正支。",
      "系统最近的，正统的。"
    ],
    en: [
      "Under the feudal clan-law system, the principal wife.",
      "Born of the principal wife.",
      "Closest in blood; the main line of a family under clan law.",
      "Closest in lineage; orthodox, the direct line of transmission."
    ]
  },
  "庶": {
    zh: [
      "众多。",
      "平民，百姓。",
      "宗法制度下家庭的旁支，与「嫡」相对。",
      "表示希望或推测；但愿，或许，如「庶竭驽钝，攘除奸凶」。"
    ],
    en: [
      "Numerous, manifold.",
      "Commoners, the common people.",
      "Under the clan-law system, a collateral branch of a family; the opposite of 嫡.",
      "Expressing hope or conjecture — may it be that, perhaps (line 庶竭驽钝，攘除奸凶)."
    ]
  },
  "婚": {
    zh: [
      "男女结为夫妇。",
      "（考释）《说文解字》：「婦家也。娶婦以昏時，婦人陰也，故曰婚。」「娶婦以昏時」即在黄昏时娶亲，学界普遍认为与抢婚习俗有关：男子在族外寻得中意女子，便在黄昏时集结同伴，未经女子及其家属同意强行劫走为妻；此举易引冲突，为便于掩护逃脱，故择傍晚行动。"
    ],
    en: [
      "(Of a man and woman) to become husband and wife; to marry.",
      "(Note) The Shuowen glosses 婚 as “the wife's family,” adding that “one takes a wife at dusk, and as woman belongs to the yin, it is called 婚.” Taking a wife at dusk (娶婦以昏時) is widely held to derive from marriage-by-capture: having found a desired woman outside his own clan, a man would gather companions at dusk and carry her off by force without her or her family's consent; because this readily provoked conflict, dusk was chosen to aid concealment and escape."
    ]
  },
  "姑": {
    zh: [
      "称父亲的姐妹。",
      "丈夫的姊妹。",
      "旧时妻称夫的母亲。",
      "少女，亦作妇女的通称。",
      "暂且，苟且。"
    ],
    en: [
      "One's father's sister (paternal aunt).",
      "One's husband's sister.",
      "Formerly, a wife's term for her husband's mother.",
      "A young woman; also a general term for women.",
      "For the time being; merely, tentatively."
    ]
  },
  "婶": {
    zh: ["叔父的妻子。", "称呼与母亲同辈而年龄较轻的已婚妇女。"],
    en: ["The wife of one's father's younger brother.", "A term of address for a married woman of one's mother's generation but younger."]
  },
  "嫂": {
    zh: ["哥哥的妻子。", "泛称年岁不大的已婚妇女。"],
    en: ["An elder brother's wife.", "A general term for a young married woman."]
  },
  "嬷": {
    zh: ["〔嬷嬷〕①旧时称奶妈；②称呼老年妇女。"],
    en: ["〔嬷嬷〕① formerly, a wet nurse; ② a term of address for an old woman."]
  },
  "婆": {
    zh: [
      "年老的妇女。",
      "丈夫的母亲。",
      "称长两辈的亲属妇女。",
      "方言，泛指已婚的青年妇女，亦称妻子。",
      "旧时指从事某些职业的妇女。"
    ],
    en: [
      "An old woman.",
      "One's husband's mother; mother-in-law.",
      "A female relative two generations senior.",
      "(Dialect) a young married woman; also a wife.",
      "Formerly, a woman in certain trades (e.g. matchmaker, midwife)."
    ]
  },
  "媳": {
    zh: ["子、弟及其他晚辈的妻子。"],
    en: ["The wife of one's son, younger brother, or other junior; a daughter-in-law."]
  },
  "威": {
    zh: [
      "表现出来使人敬畏的气魄。",
      "凭借力量或势力（威胁、威慑）。",
      "（考释）《说文解字》：「姑也。从女从戌。漢律曰：婦告威姑。」姑即夫母。「威」本指女子丈夫的母亲，即婆婆；婆之于儿媳即为「威」。其时女性不仅须「伏」于男性，亦受制于同性。"
    ],
    en: [
      "An awe-inspiring force of presence.",
      "To rely on strength or power (to threaten, to overawe).",
      "(Note) The Shuowen glosses 威 as “mother-in-law; composed of 女 and 戌,” citing the Han statute “a wife lodges complaint with her 威姑.” 姑 means the husband's mother; 威 originally denoted a husband's mother — the mother-in-law — whose authority over the daughter-in-law was itself called 威. In that age a woman had not only to submit to men but also to be ruled by another woman."
    ]
  },
  "妿": {
    zh: [
      "古代以妇道教人的女教师。",
      "（考释）《说文解字》：「女師也。」杜林曰：「加教于女也。」即古代传授女子「四德」的女教师。"
    ],
    en: [
      "In antiquity, a female teacher who instructed women in womanly conduct.",
      "(Note) The Shuowen glosses 妿 as “a female teacher”; Du Lin adds “one who imparts instruction to women” — a teacher of the four virtues required of women in antiquity."
    ]
  },

  /* ========== 贬义字 stigma（29字） ========== */
  "嫉": {
    zh: ["因别人比自己好而怨恨。", "憎恨（嫉恶如仇）。"],
    en: ["Resentment because another is better than oneself.", "To hate (嫉恶如仇, to hate evil as an enemy)."]
  },
  "妒": {
    zh: ["因为别人好而忌恨。"],
    en: ["To resent another for being better off."]
  },
  "嫌": {
    zh: ["可疑之点（嫌疑）。", "厌恶，不满意。", "怨（前嫌、嫌隙）。"],
    en: ["A point of suspicion (嫌疑, suspicion).", "To dislike, to be dissatisfied with.", "Grievance (前嫌, a past grudge; 嫌隙, an estrangement bred of suspicion)."]
  },
  "婊": {
    zh: ["〔婊子〕妓女。"],
    en: ["〔婊子〕a prostitute (used abusively)."]
  },
  "娼": {
    zh: ["妓女（娼妓、娼寮）。", "同「倡」，唱戏的女子。"],
    en: ["A prostitute (娼妓; 娼寮, a brothel).", "Same as 倡, a woman performer."]
  },
  "妓": {
    zh: [
      "以卖淫为生的女子。",
      "古代称歌女，表演歌舞的女子。",
      "（考释）《汉武外史》载「古未有妓，至汉武始置营妓，以待军士之无妻室者」，谓上古本无妓女，至汉武帝始设军妓，以犒军中无妻室的将士，显系将女性物化为工具或礼物。"
    ],
    en: [
      "A woman who makes her living by prostitution.",
      "In antiquity, a female singer or performer of song and dance.",
      "(Note) The Hanwu Waishi records that “in antiquity there were no 妓; only under Emperor Wu of Han were camp 妓 first established, to serve soldiers without wives.” Camp prostitutes were set up to reward wifeless troops — plainly treating women as objects, as tools or gifts."
    ]
  },
  "嫖": {
    zh: [
      "〔piáo〕玩弄娼妓的堕落行为（嫖妓、嫖宿、嫖客）。",
      "〔piāo〕〔嫖姚〕勇健轻捷的样子。"
    ],
    en: [
      "〔piáo〕The degraded act of consorting with prostitutes (嫖妓; 嫖客, a whoremonger).",
      "〔piāo〕〔嫖姚〕valiant and nimble in bearing."
    ]
  },
  "奸": {
    zh: [
      "阴险，虚伪，狡诈。",
      "不忠于国家或自己一方的人。",
      "男女发生不正当的性行为（奸淫、强奸、通奸）。"
    ],
    en: [
      "Sinister, false, cunning.",
      "One disloyal to the state or to one's own side; a traitor.",
      "Illicit sexual conduct between man and woman (奸淫; 强奸, rape; 通奸, adultery)."
    ]
  },
  "妄": {
    zh: ["胡乱，荒诞不合理。", "非分的，不实的。"],
    en: ["Reckless, absurd, unreasonable.", "Presumptuous; untrue, groundless."]
  },
  "婪": {
    zh: ["贪爱财物（贪婪）。"],
    en: ["To crave wealth greedily (贪婪, avarice)."]
  },
  "妖": {
    zh: [
      "迷信指异于常态而害人的东西（妖魔鬼怪；妖精）。",
      "装束或神态不正派。",
      "媚，艳丽。",
      "邪恶而迷惑人的。"
    ],
    en: [
      "In superstition, a thing abnormal and harmful (妖魔鬼怪, demons and monsters; 妖精, a spirit, figuratively an alluring woman).",
      "(Of dress or manner) improper, meretricious.",
      "Seductive, gaudily beautiful.",
      "Evil and deluding."
    ]
  },
  "妨": {
    zh: ["阻碍，伤害（妨碍、妨害）。"],
    en: ["To hinder, to harm (妨碍, to obstruct; 妨害, to impair)."]
  },
  "奴": {
    zh: [
      "阶级社会中受压迫、剥削、役使而无人身自由的人。",
      "像对待奴隶那样地（奴役、奴使）。",
      "使人甘受奴役地（奴化）。"
    ],
    en: [
      "In class society, a person oppressed, exploited, and put to service, without personal freedom.",
      "In the manner of treating a slave (奴役, to enslave).",
      "So as to make people submit to servitude (奴化, to reduce to servility)."
    ]
  },
  "佞": {
    zh: [
      "有才智，旧时谦称（不佞）。",
      "善辩，巧言谄媚（佞人、奸佞）。"
    ],
    en: [
      "Talented and clever — formerly a humble self-reference (不佞).",
      "Glib and flattering (佞人, a smooth-tongued, unprincipled person; 奸佞, a treacherous flatterer)."
    ]
  },
  "妪": {
    zh: ["年老的女人（老妪）。"],
    en: ["An old woman (老妪)."]
  },
  "姘": {
    zh: ["非夫妻而同居的不正当男女关系（姘居、姘头、姘夫、姘妇）。"],
    en: ["An illicit cohabiting relationship outside marriage (姘居, to cohabit illicitly; 姘头, an illicit partner)."]
  },
  "媸": {
    zh: ["相貌丑陋，与「妍」相对。"],
    en: ["Ugly of appearance; the opposite of 妍 (fair)."]
  },
  "媚": {
    zh: [
      "谄，逢迎（媚外、谄媚、献媚、奴颜媚骨）。",
      "美好，可爱（明媚、秀媚、妩媚、娇媚）。",
      "喜爱，如「我既媚君姿，君亦悦我颜」。"
    ],
    en: [
      "To fawn, to ingratiate (媚外, to toady to foreigners; 奴颜媚骨, a servile and fawning nature).",
      "Fine, lovely (明媚, bright and charming; 妩媚, enchanting).",
      "To love, to delight in — as in the line 我既媚君姿，君亦悦我颜 (I delight in your grace, and you take pleasure in my face)."
    ]
  },
  "婢": {
    zh: ["被役使的女子（奴婢、婢女、奴颜婢膝）。"],
    en: ["A woman kept in service; a maidservant (婢女; 奴颜婢膝, cringing and servile)."]
  },
  "嬖": {
    zh: ["宠幸（嬖爱、嬖幸、嬖人）。"],
    en: ["To favor, to dote on (嬖人, a favorite gained through ingratiation)."]
  },
  "奻": {
    zh: ["争吵。", "愚。"],
    en: ["To quarrel.", "Foolish."]
  },
  "媢": {
    zh: [
      "嫉妒。",
      "（考释）《说文解字》：「夫妒婦也。从女冒聲。一曰相視也。」"
    ],
    en: [
      "To be jealous.",
      "(Note) The Shuowen glosses 媢 as “a husband's jealousy of his wife; composed of 女 with 冒 as the phonetic. One source says it means to eye one another.”"
    ]
  },
  "嫚": {
    zh: [
      "轻视，侮辱。",
      "通「慢」，懈怠；迟缓。",
      "（考释）《说文解字》：「侮易也。从女曼聲。」即欺凌、轻视之意。"
    ],
    en: [
      "To slight, to insult.",
      "Used for 慢: negligent; slow.",
      "(Note) The Shuowen glosses 嫚 as “to insult and treat lightly” — that is, to bully and despise."
    ]
  },
  "姦": {
    zh: [
      "狡诈邪恶的行为。《书·尧典》：「克谐以孝，烝烝乂，不格姦。」",
      "歹人；恶人。《左传·昭公九年》：「故允姓之姦，居于瓜州。」",
      "外乱或内乱。《左传·成公十七年》：「臣闻乱在外为姦。」",
      "凶恶之物。《楚辞·招魂》：「天地四方，多贼姦些。」",
      "奸淫；私通。《左传·庄公二年》：「夫人姜氏会齐侯于禚，书姦也。」",
      "盗窃。《左传·文公十八年》：「窃贿为盗，窃器为姦。」",
      "伪；虚假。《逸周书·常训》：「遂伪曰姦。」",
      "狡黠；刁滑。",
      "指品行或行为恶劣。",
      "〔gān〕干犯；扰乱。《韩非子·定法》。",
      "（考释）《说文解字》：「私也。从三女。一曰詐也，淫也。」意涵含自私、狡诈、淫逸。"
    ],
    en: [
      "Cunning and evil conduct. (Cited: Shujing, “Yaodian.”)",
      "A villain; an evil person. (Cited: Zuozhuan, Zhao 9.)",
      "Disorder without or within. (Cited: Zuozhuan, Cheng 17.)",
      "A malignant thing. (Cited: Chuci, “Zhaohun.”)",
      "Illicit sex; adultery. (Cited: Zuozhuan, Zhuang 2.)",
      "Theft. (Cited: Zuozhuan, Wen 18.)",
      "False; counterfeit. (Cited: Yizhoushu, “Changxun.”)",
      "Sly, artful.",
      "Base in character or conduct.",
      "〔gān〕to offend against; to disturb. (Cited: Hanfeizi, “Dingfa.”)",
      "(Note) The Shuowen glosses 姦 as “private/selfish; composed of three 女,” adding “one source says it means deceit, and lewdness” — carrying the senses of selfishness, cunning, and licentiousness."
    ]
  },
  "嬾": {
    zh: [
      "同「懒」。",
      "（考释）《说文·女部》：「嬾，懈也，怠也，一曰卧也。从女，賴聲。」《玉篇》：「懈惰也。」"
    ],
    en: [
      "Same as 懒 (lazy).",
      "(Note) The Shuowen (woman radical) glosses 嬾 as “slack, idle; one source says, lying down”; the Yupian glosses it as “indolent.”"
    ]
  },
  "㜥": {
    zh: [
      "狡猾、狡诈。",
      "（考释）《集韵》：「莫佳切，音埋。意黠也。」"
    ],
    en: [
      "Sly, cunning.",
      "(Note) The Jiyun gives the reading (莫佳切, read mái) and glosses it as “sly of intent.”"
    ]
  },
  "娭": {
    zh: [
      "〔xī〕①玩乐；嬉戏，如「国富强而法立兮，属贞臣而日娭」。②古时对妇女的贱称。",
      "〔āi〕〔娭毑（jiě）〕方言，①祖母；②对年老妇女的尊称；③婢女。"
    ],
    en: [
      "〔xī〕① to play, to frolic (line 国富强而法立兮，属贞臣而日娭); ② in antiquity, a base term for a woman.",
      "〔āi〕〔娭毑〕(dialect) ① a grandmother; ② a respectful term for an old woman; ③ a maidservant."
    ]
  },
  "娔": {
    zh: ["古代对老年妇女的蔑称。"],
    en: ["In antiquity, a contemptuous term for an old woman."]
  },
  "㜯": {
    zh: [
      "悦乐（《说文》「悅樂也」）。",
      "妇人贱称（一曰婦人賤稱）。",
      "（考释）《集韵》：「虚其切，音熙。」"
    ],
    en: [
      "Joy, gladness (Shuowen: “joyful delight”).",
      "A base term for a woman (“one source: a base term for a woman”).",
      "(Note) The Jiyun gives the reading (虛其切, read xī)."
    ]
  }

};
