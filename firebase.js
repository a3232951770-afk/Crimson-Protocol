/* ==========================================
   🔥 firebase.js — 赤字协议数据层 v2
   字典数据硬编码，邮箱+密码登录
   ========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  addDoc, query, orderBy, limit, onSnapshot, updateDoc,
  increment, serverTimestamp, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxyzADE9XACDH2tMElF20syM9ENEOZcXk",
  authDomain: "crimson-protocol.firebaseapp.com",
  projectId: "crimson-protocol",
  storageBucket: "crimson-protocol.firebasestorage.app",
  messagingSenderId: "555887660317",
  appId: "1:555887660317:web:1bc34326342cb2a04025f4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/* ---- 字典硬编码数据 ---- */
export const CHARACTER_DATA = {
  "妒":{ char:"妒", pinyin:"dù", category:"stigma", pollutionLevel:5,
    shuowen:"妇妒夫也。从女，户声。",
    modern:"因别人比自己强而产生的怨恨与忌恨。",
    analysis:"《说文》开篇即将嫉妒绑定为女性天然属性——「妇妒夫也」。字从「女」，以「户」为声，暗示女性困守门户之内、以夫为天的规训逻辑。嫉妒本是人类面对资源不平等的本能反应，却被强行刻进女性的字形里。" },
  "嫉":{ char:"嫉", pinyin:"jí", category:"stigma", pollutionLevel:5,
    shuowen:"害贤也。从女，疾声。",
    modern:"因他人胜过自己而产生的怨恨，常与「妒」连用。",
    analysis:"「害贤也」——妨害贤能之人，《说文》直接将此归于女性。「嫉」从「女」，「疾」既是声旁也是义符：疾病、痛苦，女性的才华被定义为一种疾症。同样的竞争心，在男性字形里叫「竞」，叫「雄」。" },
  "奸":{ char:"奸", pinyin:"jiān", category:"stigma", pollutionLevel:5,
    shuowen:"犯淫也。从三女。",
    modern:"①以暴力强迫发生性关系 ②邪恶、狡猾（奸诈）",
    analysis:"三个「女」字叠加，在造字逻辑里就等于淫乱。构字本身即是一种暴力——把女性的存在与「犯」字捆绑。这个字同时承担了「性暴力加害」与「道德败坏」的两重含义，而两种含义都压在了「女」的字形上。" },
  "婪":{ char:"婪", pinyin:"lán", category:"stigma", pollutionLevel:4,
    shuowen:"贪也。从女，林声。",
    modern:"贪得无厌，极度贪婪。",
    analysis:"贪婪，由「女」构成。历史上财产权归属于男性，女性没有独立支配财产的权利；当女性表达对资源的渴望，便被命名为「婪」。" },
  "妄":{ char:"妄", pinyin:"wàng", category:"stigma", pollutionLevel:4,
    shuowen:"乱也。从女，亡声。",
    modern:"荒诞不经、胡乱、不顾事实（妄想、妄图）。",
    analysis:"「乱也，从女」。女性的想象力、愿望与期待，被汉字的造字者命名为「妄」。「妄想」二字，将女性的主体欲望定性为一种精神疾患。" },
  "嫌":{ char:"嫌", pinyin:"xián", category:"stigma", pollutionLevel:3,
    shuowen:"不平于心也。从女，兼声。",
    modern:"怀疑、不满足、厌弃（嫌弃、嫌疑）。",
    analysis:"「不平于心」——对现状不满足的情绪，被字形固定在女性身上。心有不甘，是女性最被压制的情感；而一旦表达，便得到了「嫌」这个专属的贬义容器。" },
  "妖":{ char:"妖", pinyin:"yāo", category:"stigma", pollutionLevel:4,
    shuowen:"巧也。从女，夭声。一曰女子笑貌。",
    modern:"妖怪、邪魅；形容女性过度艳丽（妖艳）。",
    analysis:"《说文》原义是「巧也」——灵巧聪慧，「一曰女子笑貌」——形容女性笑颜美好。这个字的本义是赞美。然而经过漫长的父权演化，「妖」成了妖魔化女性魅力的专用词。" },
  "娼":{ char:"娼", pinyin:"chāng", category:"stigma", pollutionLevel:5,
    shuowen:"倡也。从女，昌声。",
    modern:"现代语境中特指以卖淫为业的女性，含严重歧视。",
    analysis:"「倡也」——《说文》原义是表演艺术者，并无道德评判。从汉代到宋代，「娼」完成了从「艺人」到「性工作者」的强制降格，是父权制度对女性身体系统性商品化的语言印记。" },
  "妓":{ char:"妓", pinyin:"jì", category:"stigma", pollutionLevel:5,
    shuowen:"女乐也。从女，支声。",
    modern:"现代语境中特指卖淫女性，含严重歧视。",
    analysis:"「女乐也」——原义是女性乐师、表演者，与「伎」同源，指技艺精湛的人。这个字的贬义化轨迹与「娼」几乎平行：一个掌握专业技艺的女性表演者，被父权历史系统性地改写为性服务提供者。" },
  "嫖":{ char:"嫖", pinyin:"piāo", category:"stigma", pollutionLevel:5,
    shuowen:"轻也。从女，票声。",
    modern:"现代语境专指男性召妓行为。",
    analysis:"《说文》本义是「轻也」——轻盈、飘逸。然而现代汉语中「嫖」成了描述男性召妓行为的专用字——沿用女字旁，让「女」承担男性行为的污名。" },
  "奴":{ char:"奴", pinyin:"nú", category:"stigma", pollutionLevel:5,
    shuowen:"古之罪人也。从女，从又。又，手也。",
    modern:"奴隶，被完全剥夺自由与权利的人。",
    analysis:"「从女，从又」——「又」是手的象形。字形即是「手抓住女人」。《说文》解释为「古之罪人」——被视为有罪之人，因此成为奴隶。女性的身体被收纳进「奴役」这个概念的字形基础里。" },
  "妾":{ char:"妾", pinyin:"qiè", category:"stigma", pollutionLevel:5,
    shuowen:"有罪女子，给事之得接于君者。从辛，从女。",
    modern:"旧指姬妾，即男性在妻子之外纳的女性。",
    analysis:"《说文》明文：「有罪女子，给事之得接于君者」——妾是有罪的女人，因罪服事主人。「辛」字形是刑具。这个字的造字逻辑，是把女性进入婚姻关系定义为一种刑罚与赎罪。" },
  "奻":{ char:"奻", pinyin:"nuán", category:"stigma", pollutionLevel:5,
    shuowen:"訟也。从二女。",
    modern:"争吵、诉讼（现代已极少使用）。",
    analysis:"两个「女」字并排就等于争吵、诉讼——《说文》字形即偏见。「奻妇之言，不足听也」，《康熙字典》以此为例句，将「奻」与「愚」并列。这是汉字史上最赤裸的构字偏见之一。" },
  "姘":{ char:"姘", pinyin:"pīn", category:"stigma", pollutionLevel:4,
    shuowen:"私也。从女，并声。",
    modern:"男女私通，非婚同居。",
    analysis:"「私也，从女」——婚姻制度之外的情感关系被定性为「私」，字形锁定在女性身上。逃离指定婚配的女性，在字典里得到了一个专门的污名。" },
  "婚":{ char:"婚", pinyin:"hūn", category:"institution", pollutionLevel:3,
    shuowen:"妇家也。礼，娶妇以昏时。妇人，阴也，故曰婚。",
    modern:"结婚，组成婚姻关系。",
    analysis:"「妇人，阴也，故曰婚」——因为女性属阴，所以娶亲选在黄昏。然而学者考证，黄昏娶亲真实原因是抢婚制——天色昏暗，便于男性劫掠女性。阴阳之说是后来的文化包装。「婚」字里藏着一段劫夺的历史。" },
  "妻":{ char:"妻", pinyin:"qī", category:"institution", pollutionLevel:3,
    shuowen:"妇与夫齐者也。从女，从屮，从又。又，持事妻职也。",
    modern:"男性配偶，妻子。",
    analysis:"《说文》解释「妇与夫齐者」——所谓「齐」是相对于「妾」而言的最高地位，而非相对于丈夫。字形「从又」，「又」是手。妻子的职责是「持事」——被手掌握、操持家务。" },
  "妇":{ char:"妇", pinyin:"fù", category:"institution", pollutionLevel:3,
    shuowen:"服也。从女持帚，洒扫也。",
    modern:"已婚女性；媳妇。",
    analysis:"「服也，从女持帚，洒扫也」——字形就是一个手持扫帚的女人，含义是「服从」与「服侍」。女性进入婚姻的字形定义：拿起扫帚，开始服从。" },
  "嫁":{ char:"嫁", pinyin:"jià", category:"institution", pollutionLevel:3,
    shuowen:"女适人也。从女，家声。",
    modern:"女子出嫁，进入婚姻。",
    analysis:"「女适人也」——「适」在古汉语中有「归属于」之意。出嫁，即女人归属于某个男人的「家」。字形「从女，家声」——女人进入家，这个「家」是男性的家，不是她自己的家。" },
  "姓":{ char:"姓", pinyin:"xìng", category:"matrilineal", pollutionLevel:0,
    shuowen:"人所生也。从女，从生，生亦声。",
    modern:"姓氏，标识血缘来源的符号。",
    analysis:"「人所生也，从女从生」——姓氏，是人从母亲而来的标记。中国上古最古老的百家姓几乎全带女字旁：姬、姜、姚、妫、姒、嬴……这是母系氏族社会最直接的证据，是最古老的女权铭文：我们从母亲而来。" },
  "姬":{ char:"姬", pinyin:"jī", category:"matrilineal", pollutionLevel:1,
    shuowen:"周室女子之美称。从女，臣声。",
    modern:"古代美女的泛称；也指歌舞表演者（被贬义化）。",
    analysis:"「周室女子之美称」——「姬」是周朝王室的姓氏，是华夏文明最重要的母系古姓之一，代表了女性作为族群核心的时代记忆。然而在后世，「姬」逐渐被用作歌女、舞女的泛称，一个承载王族荣耀的母系姓氏被父权历史一步步降格。" },
  "姜":{ char:"姜", pinyin:"jiāng", category:"matrilineal", pollutionLevel:0,
    shuowen:"神农居姜水，因以为姓。从女，羊声。",
    modern:"中国古老姓氏之一；也指姜这种植物。",
    analysis:"炎帝神农氏之姓，中华文明最古老的母系姓氏之一。姜与姬并称，是母系氏族时代最有力的历史印证。从女而来的姓，承载着几千年前那个以母亲为中心的世界的记忆。" },
  "好":{ char:"好", pinyin:"hǎo", category:"reclaim", pollutionLevel:0,
    shuowen:"美也。从女，从子。",
    modern:"好的、美好、优良。",
    analysis:"「美也，从女从子」——女与子同在，是美好。这个字每天被数十亿人使用，而很少有人意识到，它的字形底层是对女性-母亲的赞美：母亲与孩子在一起，就是美好本身。" },
  "妙":{ char:"妙", pinyin:"miào", category:"reclaim", pollutionLevel:0,
    shuowen:"少也。从女，从少。",
    modern:"美妙、奇妙、精妙。",
    analysis:"「少也，从女从少」——本义是少女，由「少女」引申出「美妙、灵动、奇绝」。这个字保存了古代汉语对年轻女性的审美赞颂：少女之态即是世间最美妙的存在。" },
  "媛":{ char:"媛", pinyin:"yuàn", category:"reclaim", pollutionLevel:2,
    shuowen:"美女也。从女，从爰，爰亦声。",
    modern:"雅称美好的女性；现被网络用于嘲讽特定女性群体（「某某媛」）。",
    analysis:"「美女也」——「媛」是对美好女性最雅正的称谓。然而2020年代，「媛」在网络语境里被污名化为嘲讽词：「佛媛」「病媛」「飞盘媛」。一个字的现代命运，折射出对女性形象管控的新形态。" },
  "婵":{ char:"婵", pinyin:"chán", category:"reclaim", pollutionLevel:1,
    shuowen:"婵娟，女力士也。从女，单声。",
    modern:"现多用于形容姿态轻盈优美（婵娟），原义已几乎失传。",
    analysis:"《说文》原文：「婵娟，女力士也」——婵娟，是女力士！有力量的女性。然而这个字的力量之义被完全遮蔽，「婵娟」在后世诗词里变成了「姿态美好」的代名词，「女力士」的原意消失无踪。" },
  "嫣":{ char:"嫣", pinyin:"yān", category:"reclaim", pollutionLevel:0,
    shuowen:"美好貌。从女，焉声。",
    modern:"形容女性笑容美好（嫣然一笑）。",
    analysis:"「美好貌，从女，焉声」——「嫣然」描述的是一种自然流露的美好状态。「焉」字本是一种鸟，「嫣」的字形暗含女性如鸟般自由美好的气息。这是汉字里罕见的、纯粹赞美女性状态而无贬义附着的字之一。" },
  "姐":{ char:"姐", pinyin:"jiě", category:"reclaim", pollutionLevel:0,
    shuowen:"蜀谓母曰姐。从女，且声。",
    modern:"称呼比自己年长的同辈女性。",
    analysis:"《说文》明确记载：「蜀谓母曰姐」——在四川方言里，「姐」是对母亲的称呼。这个字承载了女性长辈、母亲权威的原始意义。从「母亲」到「比自己大的女性同辈」，「姐」的含义在历史演变中降格，但母系称谓的根系从未消失。" },
  "妫":{ char:"妫", pinyin:"guī", category:"matrilineal", pollutionLevel:0,
    shuowen:"虞舜居妫汭，因以为姓。从女，为声。",
    modern:"古老姓氏，现代极少使用。",
    analysis:"舜帝之姓，从女。妫与姬、姜同属中华最古老的母系姓氏体系，是「姓从母来」的活化石。虞舜文化里保留了大量母系社会的痕迹——「姓」字本身就是最好的证明。" },
  "妥":{ char:"妥", pinyin:"tuǒ", category:"neutral", pollutionLevel:2,
    shuowen:"安也。从女，从爪。",
    modern:"稳妥、安当、合适。",
    analysis:"「安也，从女从爪」——「爪」是手，字形是手压在女人上面，得到「安稳」之意。这个代表稳妥、安当的字，其字形来源是对女性的压制动作。「妥」的每一次使用，都在无意识地重复一个字形里隐藏的控制逻辑。" },
  "委":{ char:"委", pinyin:"wěi", category:"neutral", pollutionLevel:2,
    shuowen:"委随也。从女，从禾。",
    modern:"委托、委曲、委靡；也表示堆积、放置。",
    analysis:"「委随也，从女从禾」——随顺、曲从，这种顺从的状态由「女」承载。「委曲求全」「委靡不振」——这些词汇所描述的软弱、顺从的姿态，都建立在「女」的字形基础上。" },
  "媒":{ char:"媒", pinyin:"méi", category:"neutral", pollutionLevel:1,
    shuowen:"谋也。谋合二姓者也。从女，某声。",
    modern:"媒人；媒介、媒体。",
    analysis:"「谋合二姓者也」——撮合婚姻的人，是女性职业的专门化。「媒」的字形承认了女性在社会交际中的核心作用，却将其限定于服务于婚姻制度的功能。现代「媒体」「媒介」的意义，是这个字少有的正向扩展。" }
};

export const CATEGORY_CONFIG = {
  all:         { label:'全部星域',   color:'rgba(255,255,255,0.75)' },
  stigma:      { label:'「贬义」字', color:'#ff2a2a' },
  institution: { label:'制度字',     color:'#cc4e3c' },
  matrilineal: { label:'母系遗存',   color:'#c8860a' },
  reclaim:     { label:'「褒义」字', color:'#5a9e6f' },
  neutral:     { label:'中性字',     color:'rgba(200,200,200,0.55)' }
};

/* ---- 史记初始数据 ---- */
const INITIAL_TIMELINE = [
  { id:"huaxia_001", dimension:"huaxia", era:"上古神话", tag:"🏷️ 凿壁/考据",
    title:"鲧的性别考证：被篡改的母系起源",
    summary:"「鲧腹生禹」的隐喻背后，是一段被父权神话粗暴抹去的母系生殖崇拜。",
    content:`<p>《山海经》记载「鲧复（腹）生禹」——鲧的腹中生出了大禹。在母系社会的生殖崇拜语境下，这是完整的叙述：鲧，是一位伟大的女性部落首领。</p><p>「鲧」字从鱼，鱼在远古是女性生殖力的象征，广泛出现于仰韶文化彩陶。大禹治水的功绩后来被父系王权接管改写，「子承父业」的叙事模板被套在禹与鲧的关系上，鲧的性别被悄然篡改。但「鲧腹生禹」这四个字，像一块被遗忘的化石，保留了篡改之前的记忆。</p><p style="color:var(--terracotta);margin-top:1rem;">— 参考：《山海经·海内经》；李零《中国方术正考》</p>`,
    votes:47, author:"@女书守护者_007", promoted:false },
  { id:"huaxia_002", dimension:"huaxia", era:"上古神话", tag:"🏷️ 语言考古",
    title:"「姓」字的秘密：中国最古老的女权铭文",
    summary:"从女从生，上古百家大姓全带女字旁——这不是巧合，是母系氏族的活化石。",
    content:`<p>汉字「姓」，从女从生——姓是人从母亲而来的标记。中国最古老的姓几乎清一色带女字旁：<strong style="color:var(--amber)">姬、姜、姚、妫、姒、嬴</strong></p><p>这是中国历史上保存最完好的母系制度痕迹——它没有被写在史书里，而是被刻进了最日常的汉字里，让每一个中国人都在无意识地传递着这段被遗忘的历史。父系王朝建立后，「氏」逐渐凌驾于「姓」之上，但「姓」字从未改变——它仍然从女，仍然从生。</p><p style="color:var(--terracotta);margin-top:1rem;">— 参考：郑张尚芳《上古音系》；许慎《说文解字》</p>`,
    votes:89, author:"@盖娅的遗存_01", promoted:false },
  { id:"huaxia_003", dimension:"huaxia", era:"上古神话", tag:"🏷️ 图像学",
    title:"女娲的降格之路：从创世神到男神助手",
    summary:"《说文》原载「古之神圣女，化万物者也」——女娲曾是独立的创世神，没有伏羲。",
    content:`<p>《说文解字》「媧」字条：「媧，古之神圣女，化万物者也。」——女娲是独立的创世主，许慎的记载里没有伏羲。</p><p>伏羲与女娲的配对，是汉代才系统出现的。早期图像里，<strong style="color:var(--amber)">女娲执规，伏羲执矩</strong>——规（圆规）象征天、创造，矩（直角尺）象征地。女娲主创造，地位高于伏羲。随着时代推移，图像位置悄然改变：早期女左男右 → 后期男左女右（符合「男左女右」的阴阳秩序）。创世女神被纳入婚姻关系，成为男神的配偶与协助者。</p><p style="color:var(--terracotta);margin-top:1rem;">— 参考：许慎《说文解字》媧字条；闻一多《伏羲考》</p>`,
    votes:134, author:"@星火坐标_北京", promoted:true },
  { id:"huanyu_001", dimension:"huanyu", era:"古典时代", tag:"🏷️ 童话解构",
    title:"白雪公主的真实权力结构：被掩盖的女性继承权之争",
    summary:"王后为何要杀白雪公主？不是嫉妒美貌，而是因为她威胁到了王位继承。",
    content:`<p>白雪公主是国王的亲生女儿，拥有王位的第一顺位继承权。王后的权力完全依附于国王，若国王去世，真正能继承权力的是白雪公主，而非王后。从这个角度看，王后的行动不是嫉妒，而是政治自保。</p><p>格林兄弟在1812年整理出版时，系统性地强化了「女性之间因嫉妒互相伤害」的叙事框架，而淡化了其中的权力结构分析。「嫉妒」这个女字旁的词，再次被征用，来掩盖一段关于权力与生存的故事。</p><p style="color:var(--terracotta);margin-top:1rem;">— 参考：Jack Zipes, «The Brothers Grimm»</p>`,
    votes:62, author:"@语言考古学家_042", promoted:false },
  { id:"lingjing_001", dimension:"lingjing", era:"现代解构", tag:"🏷️ 语言实验",
    title:"如果没有女字旁：一次思想实验",
    summary:"把「嫉、妒、婪、妄、嫌」的女字旁换掉，换成「忄」（心）——同样的字义，完全不同的社会叙事。",
    content:`<p>如果将以下汉字的「女」字旁，替换为「忄」（竖心旁，代表心理状态）：</p><p><strong style="color:var(--neon-red)">嫉→疾</strong>（心有疾患，人皆有之）<br><strong style="color:var(--neon-red)">妒→忕</strong>（心之常态，无关性别）<br><strong style="color:var(--neon-red)">妄→忘</strong>（心之所失，并非女性专属）</p><p>当「女」字旁被移除，这些情绪和状态立刻失去了性别归属——它们回归为普遍的人类心理现象。偏旁不是中立的；偏旁是意识形态。造字实验室正在做的，就是这件事。</p>`,
    votes:201, author:"@协议初始化_000", promoted:true }
];

/* ---- 后台同步（静默，不阻塞UI） ---- */
export async function syncInitialData() {
  try {
    const metaSnap = await getDoc(doc(db,'meta','initialized'));
    const meta = metaSnap.exists() ? metaSnap.data() : {};
    if (!meta.chars_v3) {
      await Promise.all(Object.entries(CHARACTER_DATA).map(([id,d])=>
        setDoc(doc(db,'characters',id),{...d,votes:0,proposals:[],createdAt:serverTimestamp()},{merge:true})));
      await setDoc(doc(db,'meta','initialized'),{chars_v3:true},{merge:true});
    }
    if (!meta.timeline_v3) {
      await Promise.all(INITIAL_TIMELINE.map(p=>
        setDoc(doc(db,'timeline_posts',p.id),{...p,createdAt:serverTimestamp()},{merge:true})));
      await setDoc(doc(db,'meta','initialized'),{timeline_v3:true},{merge:true});
    }
  } catch(e){ console.warn('[赤字协议] Firebase同步失败，本地数据仍可用'); }
}

/* ---- 认证 ---- */
export async function registerUser(email,password,codename){
  const c = await createUserWithEmailAndPassword(auth,email,password);
  const name = (codename||'').trim() || generateCodename();
  await updateProfile(c.user,{displayName:name});
  await setDoc(doc(db,'users',c.user.uid),{
    uid:c.user.uid, email, displayName:name,
    createdAt:serverTimestamp(), isAdmin:false
  });
  return c.user;
}
export async function loginUser(email,password){
  const c = await signInWithEmailAndPassword(auth,email,password);
  return c.user;
}
export function logoutUser(){ return signOut(auth); }
export function onAuthChange(cb){ return onAuthStateChanged(auth,cb); }

/* ---- 字典本地查询（即时） ---- */
export function searchCharLocal(input){
  const k = input.trim();
  return CHARACTER_DATA[k] || Object.values(CHARACTER_DATA).find(c=>c.pinyin===k.toLowerCase()) || null;
}
export function getCharsByCategory(cat){
  if(!cat||cat==='all') return Object.values(CHARACTER_DATA);
  return Object.values(CHARACTER_DATA).filter(c=>c.category===cat);
}

/* ---- 史记读取（Firebase优先，降级本地） ---- */
export async function getTimelinePosts(dimension){
  try {
    const q = query(collection(db,'timeline_posts'),where('dimension','==',dimension));
    const snap = await getDocs(q);
    if(!snap.empty) {
      const posts = snap.docs.map(d=>({id:d.id,...d.data()}));
      return posts.sort((a,b)=>(b.votes||0)-(a.votes||0));
    }
  } catch(e){ console.warn('[赤字协议] 史记读取失败:', e); }
  return INITIAL_TIMELINE.filter(p=>p.dimension===dimension).sort((a,b)=>b.votes-a.votes);
}

/* ---- 社区帖子 ---- */
export async function createPost(data){
  const user = auth.currentUser;
  if(!user) throw new Error('未登录');
  return addDoc(collection(db,'community_posts'),{
    ...data, authorId:user.uid,
    authorName:user.displayName||`@考古学家_${user.uid.slice(0,4)}`,
    createdAt:serverTimestamp(), votes:0, comments:0, reported:false
  });
}
export function listenToPosts(type,cb){
  // 两个equality where不需要复合索引，只有加orderBy才需要
  // 必须包含reported==false，否则安全规则会拒绝读取
  const q = query(collection(db,'community_posts'),
    where('type','==',type), where('reported','==',false), limit(100));
  return onSnapshot(q, snap => {
    let posts = snap.docs.map(d=>({id:d.id,...d.data()}));
    // 客户端按时间排序
    posts.sort((a,b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
    cb(posts.slice(0, 50));
  }, err => {
    console.error('[赤字协议] 帖子监听失败:', err);
    cb([]);
  });
}
export async function addComment(postId,text){
  const user = auth.currentUser;
  if(!user) throw new Error('未登录');
  await addDoc(collection(db,'community_posts',postId,'comments'),{
    text, authorId:user.uid,
    authorName:user.displayName||`@考古学家_${user.uid.slice(0,4)}`,
    createdAt:serverTimestamp()
  });
  await updateDoc(doc(db,'community_posts',postId),{comments:increment(1)});
}
export function listenToComments(postId,cb){
  return onSnapshot(
    query(collection(db,'community_posts',postId,'comments'),orderBy('createdAt','asc')),
    snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
}
export async function votePost(postId){
  await updateDoc(doc(db,'community_posts',postId),{votes:increment(1)});
}
export async function reportPost(postId,reason=''){
  await updateDoc(doc(db,'community_posts',postId),{
    reported:true, reportReason:reason, reportedAt:serverTimestamp()});
}
export async function deletePost(postId){
  await deleteDoc(doc(db,'community_posts',postId));
}

// 获取用户的所有帖子
export async function getUserPosts(uid){
  try {
    const q = query(collection(db,'community_posts'),
      where('authorId','==',uid), where('reported','==',false), limit(100));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d=>({id:d.id,...d.data()}));
    posts.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    return posts;
  } catch(e) { console.warn('获取用户帖子失败:', e); return []; }
}

// 获取单个帖子
export async function getPostById(postId){
  try {
    const snap = await getDoc(doc(db,'community_posts',postId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch(e) {}
  return null;
}

// 获取某个字的所有已升阶提案（投票>=200）
export async function getPromotedProposals(targetChar){
  try {
    const q = query(collection(db,'community_posts'),
      where('type','==','glyph'), where('targetChar','==',targetChar), where('reported','==',false), limit(50));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d=>({id:d.id,...d.data()}));
    return posts.filter(p => (p.votes||0) >= 200).sort((a,b)=>(b.votes||0)-(a.votes||0));
  } catch(e) { return []; }
}

// 获取某个字的所有提案（不限票数，用于详情卡轮播）
export async function getCharProposals(targetChar){
  try {
    const q = query(collection(db,'community_posts'),
      where('type','==','glyph'), where('targetChar','==',targetChar), where('reported','==',false), limit(50));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d=>({id:d.id,...d.data()}));
    return posts.sort((a,b)=>(b.votes||0)-(a.votes||0));
  } catch(e) { return []; }
}

function generateCodename(){
  const p=['青铜时代的','玄武岩层的','黎明前的','赤陶中的','星云边缘的','古老根系的'];
  const s=['记录者','破译者','凿壁人','点灯者','考古学家','觉醒者'];
  return `@${p[Math.floor(Math.random()*p.length)]}${s[Math.floor(Math.random()*s.length)]}_${Math.floor(Math.random()*900+100)}`;
}
