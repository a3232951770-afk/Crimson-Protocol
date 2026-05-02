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
  // ===== 母星核心 =====
  "女":{ char:"女", pinyin:"nǚ", category:"matrilineal", pollutionLevel:0,
    shuowen:"妇人也。象形。",
    modern:"女性，与「男」相对；女儿。",
    analysis:"甲骨文和金文中的「女」字，是一个双膝跪地、两臂交叉放在胸前的人形。这个字是整个汉字女字旁体系的根基——超过240个常用汉字以「女」为部首。它既是母系社会最原始的生命符号，也是父权语言改造工程的首要目标。赤字协议的使命：重新点亮这颗根级星辰。" },
  // ===== 贬义字 (stigma) =====
  "嫉":{ char:"嫉", pinyin:"jí", category:"stigma", pollutionLevel:5,
    shuowen:"害贤也。从女，疾声。",
    modern:"因他人胜过自己而产生的怨恨，常与「妒」连用。",
    analysis:"「害贤也」——妨害贤能之人，《说文》直接将此归于女性。「嫉」从「女」，「疾」既是声旁也是义符：疾病、痛苦，女性的才华被定义为一种疾症。同样的竞争心，在男性字形里叫「竞」，叫「雄」。" },
  "妒":{ char:"妒", pinyin:"dù", category:"stigma", pollutionLevel:5,
    shuowen:"妇妒夫也。从女，户声。",
    modern:"对才能、名誉、地位或境遇比自己好的人心怀怨恨。",
    analysis:"许慎的解释直接暴露了父权婚姻制度的压迫性。在古代一夫多妻制下，女性为了生存资源产生的合理情绪防御，被制度定义为「妇妒夫」，从而将结构性剥削转化为女性个体的道德缺陷进行规训。嫉妒本是人类面对资源不平等的本能反应，却被强行刻进女性的字形里。" },
  "嫌":{ char:"嫌", pinyin:"xián", category:"stigma", pollutionLevel:3,
    shuowen:"不平于心也。从女，兼声。",
    modern:"怀疑、不满足、厌弃（嫌弃、嫌疑）。",
    analysis:"「不平于心」——对现状不满足的情绪，被字形固定在女性身上。心有不甘，是女性最被压制的情感；而一旦表达，便得到了「嫌」这个专属的贬义容器。" },
  "婊":{ char:"婊", pinyin:"biǎo", category:"stigma", pollutionLevel:5,
    shuowen:"《说文》未收录，后起俗字。「表」本指衣服外层。",
    modern:"妓女（多用于粗俗的骂人语）。",
    analysis:"这是一个纯粹的「荡妇羞辱（Slut-shaming）」词汇。它将结构性的性剥削现象，转化为对处于最底层受剥削女性的道德审判和人格侮辱，并被广泛用于攻击任何不符合父权规训的女性。" },
  "娼":{ char:"娼", pinyin:"chāng", category:"stigma", pollutionLevel:5,
    shuowen:"倡也。从女，昌声。",
    modern:"现代语境中特指以卖淫为业的女性，含严重歧视。",
    analysis:"「倡也」——《说文》原义是表演艺术者，并无道德评判。从汉代到宋代，「娼」完成了从「艺人」到「性工作者」的强制降格，是父权制度对女性身体系统性商品化的语言印记。" },
  "妓":{ char:"妓", pinyin:"jì", category:"stigma", pollutionLevel:5,
    shuowen:"女乐也。从女，支声。",
    modern:"现代语境中特指卖淫女性，含严重歧视。",
    analysis:"「女乐也」——原义是女性乐师、表演者，与「伎」同源，指技艺精湛的人。女性在公共空间中展示才艺，在男本位的消费文化中其才华价值最终被抹杀，被文字强制打上了身体交易的污名烙印。" },
  "嫖":{ char:"嫖", pinyin:"piāo", category:"stigma", pollutionLevel:5,
    shuowen:"轻也。从女，票声。",
    modern:"现代语境专指男性召妓行为。",
    analysis:"《说文》本义是「轻也」——轻盈、飘逸。然而现代汉语中「嫖」成了描述男性召妓行为的专用字——行为主体绝大多数为男性，但描述时汉字却使用「女」字旁，巧妙地隐去了男性的主体责任。" },
  "奸":{ char:"奸", pinyin:"jiān", category:"stigma", pollutionLevel:5,
    shuowen:"姦，私也。从三女。",
    modern:"狡诈，邪恶；发生不正当的性行为（如强奸）。",
    analysis:"女性语义贬损的极端案例。三个「女」字叠加，其造字的底层逻辑粗暴地预设了「女人聚在一起就会产生私情、邪恶和狡诈」。在现代，它更将男权主导的性暴力犯罪（强奸）的命名，死死绑定在受害者的性别形体上。" },
  "妄":{ char:"妄", pinyin:"wàng", category:"stigma", pollutionLevel:4,
    shuowen:"乱也。从女，亡声。",
    modern:"荒诞不经、胡乱、不顾事实（妄想、妄图）。",
    analysis:"「乱也，从女」。女性的想象力、愿望与期待，被汉字的造字者命名为「妄」。「妄想」二字，将女性的主体欲望定性为一种精神疾患。" },
  "婪":{ char:"婪", pinyin:"lán", category:"stigma", pollutionLevel:4,
    shuowen:"贪也。从女，林声。",
    modern:"贪得无厌，极度贪婪。",
    analysis:"贪婪，由「女」构成。「贪」从「贝」（财富），而「婪」从「女」。历史上财产权归属于男性，当女性表达对资源的渴望，便被命名为「婪」。" },
  "妖":{ char:"妖", pinyin:"yāo", category:"stigma", pollutionLevel:4,
    shuowen:"巧也。一曰异也。从女，芺声。",
    modern:"怪异反常的事物；装束或神态不正派、迷惑人（如妖艳）。",
    analysis:"本意指事物的反常与奇异，却强行加上「女」旁。它将社会动荡、自然灾害或男性自身欲望的失控，统统归咎于女性的存在，女性被视作一种可能引发混乱的「异物」。" },
  "妨":{ char:"妨", pinyin:"fáng", category:"stigma", pollutionLevel:3,
    shuowen:"害也。从女，方声。",
    modern:"阻碍，伤害，对事情不利（如妨碍）。",
    analysis:"将「阻碍」与「伤害」具象化时选择女字旁。反映了父权叙事中将女性视为男性建功立业或家族秩序的「隐患」与「绊脚石」。" },
  "奴":{ char:"奴", pinyin:"nú", category:"stigma", pollutionLevel:5,
    shuowen:"古之罪人也。从女，从又。又，手也。",
    modern:"奴隶，被完全剥夺自由与权利的人。",
    analysis:"「从女，从又」——「又」是手的象形。字形即是「手抓住女人」。《说文》解释为「古之罪人」——被视为有罪之人，因此成为奴隶。女性的身体被收纳进「奴役」这个概念的字形基础里。" },
  "佞":{ char:"佞", pinyin:"nìng", category:"stigma", pollutionLevel:4,
    shuowen:"巧谄高材也。从女，信省。",
    modern:"惯于用花言巧语谄媚人（如奸佞）。",
    analysis:"谄媚逢迎本是官场政治中下位者的生存策略，但造字者将其与「女」字旁结合，暗指这种「口蜜腹剑、心术不正」的特质是女性化的，从而将政治道德的败坏转嫁给女性特征。" },
  "妪":{ char:"妪", pinyin:"yù", category:"stigma", pollutionLevel:3,
    shuowen:"母也。从女，区声。",
    modern:"年老的女人。",
    analysis:"「区」有隐藏、微小、局限之意。相比于称呼男性的「老」、「翁」等中性或带有尊长意味的字，「妪」字在历史语境中往往带有一种卑微、琐碎甚至略带神秘负面的色彩（如老妪、巫妪）。" },
  "姘":{ char:"姘", pinyin:"pīn", category:"stigma", pollutionLevel:4,
    shuowen:"私也。从女，并声。",
    modern:"男女私通，非婚同居。",
    analysis:"「私也，从女」——婚姻制度之外的情感关系被定性为「私」，字形锁定在女性身上。明明是男女双向的行为，造字却单向地使用了「女」字旁，将道德污点单独推给了女性。" },
  "媸":{ char:"媸", pinyin:"chī", category:"stigma", pollutionLevel:3,
    shuowen:"后起字，晋代以后渐多。意为丑陋，与「妍」相对。",
    modern:"丑陋（如妍媸）。",
    analysis:"把人类对外貌的负面评价（丑陋）赋予了「女」字旁。这深刻反映了女性被置于「审美客体」的地位：女性的价值被牢牢绑定在容貌上，以至于连「丑」这个抽象概念，都需要用女字旁来具象化。" },
  "媱":{ char:"媱", pinyin:"yáo", category:"stigma", pollutionLevel:4,
    shuowen:"曲美貌。从女，䍃声。",
    modern:"游玩；轻佻、淫荡。",
    analysis:"从原本的「美丽、摇曳」演变为后世词典中的「轻佻、淫荡」。这个字的词义演变史就是一部女性行为受限史——女性展示形体之美或追求自由游乐，在父权道德观中逐渐被定性为不守妇道的轻浮。" },
  "媚":{ char:"媚", pinyin:"mèi", category:"stigma", pollutionLevel:3,
    shuowen:"说也。从女，眉声。",
    modern:"谄媚、逢迎；姿态可爱。",
    analysis:"当作为贬义词（如谄媚、崇洋媚外）使用时，它将「出卖尊严以取悦上位者」的卑劣行为与女性特质绑定。父权社会对女性的虚伪要求：既要求女性顺从取悦，又在宏观道德上鄙视这种取悦。" },
  "婢":{ char:"婢", pinyin:"bì", category:"stigma", pollutionLevel:4,
    shuowen:"女之卑者也。从女，卑声。",
    modern:"旧时供人使唤的女子（如婢女、奴婢）。",
    analysis:"「卑」+「女」= 婢。没有对应的「男卑」字，「卑下」的位置从造字之初就分配给了女性。" },

  // ===== 制度字 (institution) 11字 =====
  "娶":{ char:"娶", pinyin:"qǔ", category:"institution", pollutionLevel:4,
    shuowen:"娶妇也。从女从取，取亦声。",
    modern:"男子把女子接过来成亲。",
    analysis:"「取」+「女」。字形直白地展现了古代婚姻制度中女性作为「被掠夺、被获取的财产」的客体地位。婚姻在此不是两个独立个体的结合，而是男性单向的获取行为。" },
  "嫁":{ char:"嫁", pinyin:"jià", category:"institution", pollutionLevel:3,
    shuowen:"女适人也。从女，家声。",
    modern:"女子出嫁，进入婚姻。",
    analysis:"「女适人也」——「适」在古汉语中有「归属于」之意。出嫁，即女人归属于某个男人的「家」。字形「从女，家声」——女人进入家，这个「家」是男性的家，不是她自己的家。" },
  "妇":{ char:"妇", pinyin:"fù", category:"institution", pollutionLevel:3,
    shuowen:"服也。从女持帚，洒扫也。",
    modern:"已婚女性；媳妇。",
    analysis:"「服也，从女持帚，洒扫也」——字形就是一个手持扫帚的女人，含义是「服从」与「服侍」。女性进入婚姻的字形定义：拿起扫帚，开始服从。" },
  "妻":{ char:"妻", pinyin:"qī", category:"institution", pollutionLevel:3,
    shuowen:"妇与夫齐者也。从女，从屮，从又。",
    modern:"男性配偶，妻子。",
    analysis:"《说文》解释「妇与夫齐者」——所谓「齐」是相对于「妾」而言的最高地位，而非相对于丈夫。甲骨文和金文字形是「一只手抓住一个女子的头发」，赤裸裸地保留了远古时代「抢婚制」的暴力遗存。" },
  "妾":{ char:"妾", pinyin:"qiè", category:"institution", pollutionLevel:5,
    shuowen:"有罪女子，给事之得接于君者。从辛，从女。",
    modern:"旧指姬妾，即男性在妻子之外纳的女性。",
    analysis:"《说文》明文：「有罪女子，给事之得接于君者」——妾是有罪的女人，因罪服事主人。「辛」字形是刑具。这个字的造字逻辑，是把女性进入婚姻关系定义为一种刑罚与赎罪。" },
  "妃":{ char:"妃", pinyin:"fēi", category:"institution", pollutionLevel:3,
    shuowen:"匹也。从女，己声。",
    modern:"皇帝的妾；太子、王侯的妻子。",
    analysis:"虽然本意是「匹配」，但在漫长的历史演变中，它固化为了一夫多妻制和皇权至高无上的象征。女性在这里不是独立的个体，而是通过与最高男权（皇权）的依附关系来获取阶级地位，是权力交易的顶级筹码。" },
  "嫔":{ char:"嫔", pinyin:"pín", category:"institution", pollutionLevel:4,
    shuowen:"服也。从女，宾声。",
    modern:"古代皇宫里的女官，也指帝王的妾。",
    analysis:"「宾」有客体、服从之意。这个字代表了古代将女性制度化、等级化地圈禁在深宫之中的残酷事实——她们作为统治阶级繁衍血脉的资源库，被完全抹杀了个人意志。" },
  "寡":{ char:"寡", pinyin:"guǎ", category:"institution", pollutionLevel:4,
    shuowen:"少也。",
    modern:"死去了丈夫的妇人（如寡妇、守寡）。",
    analysis:"这是一个跨越字形的制度枷锁。男性丧偶称为「鳏」，可再娶；女性丧偶称为「寡」，在明清贞节牌坊制度下，这不仅代表着失去配偶，更意味着被剥夺了再次追求情爱与幸福的权力。" },
  "婴":{ char:"婴", pinyin:"yīng", category:"institution", pollutionLevel:2,
    shuowen:"颈饰也。从女，从賏，賏亦声。",
    modern:"不满一岁的小孩。",
    analysis:"本指女性佩戴的颈饰，带有一种被事物缠绕、束缚的意象。这种缠绕的意象后来转嫁到了需要被时刻抱在胸前抚育的新生儿身上。潜台词是：育儿是女性天然且唯一的强制性职责。" },
  "嫡":{ char:"嫡", pinyin:"dí", category:"institution", pollutionLevel:3,
    shuowen:"正妻也。从女，啇声。",
    modern:"宗法制度下指正妻，或正妻所生的（如嫡子、嫡系）。",
    analysis:"宗法制度的核心基石。「嫡」的存在本身就是对一夫多妻制的合法化。父权社会通过区分女性的身份高低（嫡与庶），来界定男性财产和权力的继承权。" },
  "庶":{ char:"庶", pinyin:"shù", category:"institution", pollutionLevel:3,
    shuowen:"屋下众也。",
    modern:"宗法制度下指妾所生的（如庶出）。",
    analysis:"与「嫡」是一体两面的压迫。因为母亲（妾）在家庭中处于被奴役的性客体地位，连带其子女也被打上「庶」的低阶层烙印。这是父权制通过控制女性生育价值，进而实行阶级固化的铁证。" },
  "婚":{ char:"婚", pinyin:"hūn", category:"institution", pollutionLevel:3,
    shuowen:"妇家也。礼，娶妇以昏时。妇人，阴也，故曰婚。",
    modern:"结婚，组成婚姻关系。",
    analysis:"「妇人，阴也，故曰婚」——因为女性属阴，所以娶亲选在黄昏。然而学者考证，黄昏娶亲真实原因是抢婚制。阴阳之说是后来的文化包装。" },

  // ===== 褒义字 (reclaim) 18字 =====
  "好":{ char:"好", pinyin:"hǎo", category:"reclaim", pollutionLevel:1,
    shuowen:"美也。从女从子。",
    modern:"优点多的，使人满意的；美好。",
    analysis:"汉字中最基础的正向评价词，其造字底层逻辑却是「一个女人加上一个孩子」。它直白地宣告了古代社会的价值观：女性最大的「美好」、对社会唯一的正面价值，就是完成生育（尤其是生育男嗣）的职责。但另一视角：母亲与孩子在一起，就是美好本身——这是每天被数十亿人使用的字。" },
  "妙":{ char:"妙", pinyin:"miào", category:"reclaim", pollutionLevel:1,
    shuowen:"神也。从女，少声。（后世多直接解构为「少女」）",
    modern:"美好，奇妙，神奇。",
    analysis:"将「奇妙」、「绝佳」的抽象概念，与「年轻的女性（少女）」绑定。它深刻反映了父权凝视下对女性青春的极度迷恋与物化（Youth Fetishism），女性一旦老去，便失去了「妙」的资格。" },
  "娇":{ char:"娇", pinyin:"jiāo", category:"reclaim", pollutionLevel:2,
    shuowen:"姿也。从女，乔声。",
    modern:"美好可爱（如娇美）；柔弱（如娇弱）。",
    analysis:"这个字系统性地美化了女性的「脆弱」与「附属状态」。它将柔弱、易碎、需要被庇护的特质包装成一种审美标准，从而在潜意识里剥夺了女性作为强者的独立性。" },
  "妍":{ char:"妍", pinyin:"yán", category:"reclaim", pollutionLevel:1,
    shuowen:"技也。一曰慧也。从女，幵声。",
    modern:"美丽，巧慧（多形容女性或花草）。",
    analysis:"这个字的演变史是一部典型的女性价值降级史。从《说文》中的「才智、技能」，退化为后世纯粹指代外貌的「美丽」。它证明了在男权社会中，女性的智慧被刻意忽略，最终只剩下了供人赏玩的皮囊价值。" },
  "婉":{ char:"婉", pinyin:"wǎn", category:"reclaim", pollutionLevel:2,
    shuowen:"顺也。从女，宛声。",
    modern:"柔顺，美好（如婉顺）；委婉，曲折。",
    analysis:"将「顺从」、「不直接冲突」的特质专门冠以「女」字旁。它规定了所谓「好女人」的沟通方式和性格标准——必须是绕弯的、退让的、没有攻击性的，这是语言对女性抗争精神的隐性阉割。" },
  "娴":{ char:"娴", pinyin:"xián", category:"reclaim", pollutionLevel:2,
    shuowen:"雅也。从女，闲声。",
    modern:"文雅，柔美文静，庄重不轻浮。",
    analysis:"「娴」代表了上流社会对女性的终极行为规训：要安静、端庄、不出格。它用「文雅」的名义，将女性限制在一种静止的、毫无威胁的、适合被装点在家庭门面上的状态。" },
  "姿":{ char:"姿", pinyin:"zī", category:"reclaim", pollutionLevel:1,
    shuowen:"态也。从女，次声。",
    modern:"容貌，形态，引申为资质。",
    analysis:"用女字旁来定义「形态」，因为在古代审美体系中，男性的身体多用于行动（劳作、战斗），而女性的身体则是用来被「观看」的。它将女性彻底化作了视觉消费的客体。" },
  "娟":{ char:"娟", pinyin:"juān", category:"reclaim", pollutionLevel:1,
    shuowen:"婵娟，态也。从女，肙声。",
    modern:"秀丽，美好（如娟秀）。",
    analysis:"与「姿」、「妍」类似，是专门创造出来形容女性柔美、纤细外貌的字，进一步固化了女性必须满足「柔和秀丽」这一单一审美维度的刻板印象。" },
  "婷":{ char:"婷", pinyin:"tíng", category:"reclaim", pollutionLevel:1,
    shuowen:"后起字，多指颜色和悦、体态优美。",
    modern:"形容人或花木美好（如亭亭玉立、娉婷）。",
    analysis:"常与花木并列，赞美女性具有像植物一样安静、美观、且不具反抗性的装饰价值。" },
  "婀":{ char:"婀", pinyin:"ē", category:"reclaim", pollutionLevel:2,
    shuowen:"后起字，常与「娜」连用为「婀娜」。",
    modern:"形容柔软而美好的样子（多指体态或声音）。",
    analysis:"纯粹服务于男性凝视的造字。它专门用来描摹女性肢体扭动、柔软无骨的姿态，将对女性身体的性化包装在文学赞美之中。" },
  "娜":{ char:"娜", pinyin:"nuó", category:"reclaim", pollutionLevel:1,
    shuowen:"后起字。",
    modern:"形容女子姿态柔美（如婀娜、袅娜）。",
    analysis:"同「婀」。它捕捉的是女性身体在被观看时的「摇曳感」，是一种完全处于被动客体位置的审美标准。" },
  "妩":{ char:"妩", pinyin:"wǔ", category:"reclaim", pollutionLevel:1,
    shuowen:"媚也。从女，无声。",
    modern:"女子姿态美好可爱（如妩媚）。",
    analysis:"「妩」与「媚」同义，核心都是「取悦」。它定义了女性的美必须是带有讨好性质的，是能够激起上位者（男性）怜爱与欲望的，而非女性自身的生命力展现。" },
  "姝":{ char:"姝", pinyin:"shū", category:"reclaim", pollutionLevel:1,
    shuowen:"好也。从女，朱声。",
    modern:"美丽的女子。",
    analysis:"将美丽直接等同于女性本身。在古汉语中，男性可以通过才华、武力、品德被称呼，而对于女性，最高级的指代名词往往就是「美女」，抹平了女性其他维度的个人成就。" },
  "娉":{ char:"娉", pinyin:"pīng", category:"reclaim", pollutionLevel:2,
    shuowen:"问也。从女，甹声。",
    modern:"形容女子姿态美好的样子（如娉婷）。",
    analysis:"本义是婚姻交易中的一个程序（男方去女方家打听女方姓名八字以备迎娶）。后来竟然演变成赞美女性外貌的词。这暗示了女性的美丽本身就是婚姻市场上的待价而沽的商品。" },
  "姣":{ char:"姣", pinyin:"jiāo", category:"reclaim", pollutionLevel:1,
    shuowen:"好也。从女，交声。",
    modern:"相貌美（多指女子）。",
    analysis:"与「好」、「姝」同源，继续加固「女性=美丽客体」的语境结界。" },
  "娆":{ char:"娆", pinyin:"ráo", category:"reclaim", pollutionLevel:2,
    shuowen:"苛也。从女，尧声。",
    modern:"娇媚，使人着迷（如妖娆、娇娆）。",
    analysis:"与「妖」字如出一辙。本义是「麻烦、搅扰」，后引申为「极具诱惑力的美」。它体现了父权制下对女性性感魅力的恐惧与迷恋交织的矛盾心理，即所谓的「危险的尤物」。" },
  "妥":{ char:"妥", pinyin:"tuǒ", category:"reclaim", pollutionLevel:3,
    shuowen:"安也。从爪，从女。",
    modern:"合适，安当，稳妥。",
    analysis:"极其冰冷且暴力的造字逻辑。古文字形为上方一只手「爪」，向下按住一个女人「女」。它揭示了父权制社会中关于「稳定」的终极密码：只有用手（权力/暴力）将女人死死按住、控制住，社会秩序才会「稳妥」。" },
  "淑":{ char:"淑", pinyin:"shū", category:"reclaim", pollutionLevel:2,
    shuowen:"清湛也。",
    modern:"女子品行端正、善良（如淑女、贤淑）。",
    analysis:"这是古代社会颁发给女性的最高精神牌坊。它要求女性如水般清透、无杂质（暗指贞洁），且能包容万物、向下流淌（暗指无底线的隐忍与奉献）。它是将剥削浪漫化、道德化的终极洗脑词汇。" },

  // ===== 母系遗存 (matrilineal) 4字 =====
  "姓":{ char:"姓", pinyin:"xìng", category:"matrilineal", pollutionLevel:0,
    shuowen:"人所生也。从女，从生，生亦声。",
    modern:"姓氏，标识血缘来源的符号。",
    analysis:"「人所生也，从女从生」——姓氏，是人从母亲而来的标记。中国上古最古老的百家姓几乎全带女字旁：姬、姜、姚、妫、姒、嬴……这是母系氏族社会最直接的证据。" },
  "始":{ char:"始", pinyin:"shǐ", category:"matrilineal", pollutionLevel:0,
    shuowen:"女之初也。从女，台声。",
    modern:"起头，最初，与「终」相对（如开始、原始）。",
    analysis:"为什么「万物之初」要用女字旁？因为在早期人类的宇宙观中，生命的孕育和诞生（女性的创生权）就是世间万物起源的终极隐喻。女性，即是文明与生命唯一的「起点」。" },
  "姬":{ char:"姬", pinyin:"jī", category:"matrilineal", pollutionLevel:1,
    shuowen:"周室女子之美称。从女，臣声。",
    modern:"古代美女的泛称；也指歌舞表演者（被贬义化）。",
    analysis:"「周室女子之美称」——「姬」是周朝王室的姓氏，是华夏文明最重要的母系古姓之一，代表了女性作为族群核心的时代记忆。然而在后世，「姬」逐渐被用作歌女、舞女的泛称。" },
  "姜":{ char:"姜", pinyin:"jiāng", category:"matrilineal", pollutionLevel:0,
    shuowen:"神农居姜水，因以为姓。从女，羊声。",
    modern:"中国古老姓氏之一；也指姜这种植物。",
    analysis:"炎帝神农氏之姓，中华文明最古老的母系姓氏之一。姜与姬并称，是母系氏族时代最有力的历史印证。" },
  "妫":{ char:"妫", pinyin:"guī", category:"matrilineal", pollutionLevel:0,
    shuowen:"虞舜居妫汭，因以为姓。从女，为声。",
    modern:"古老姓氏，现代极少使用。",
    analysis:"舜帝之姓，从女。妫与姬、姜同属中华最古老的母系姓氏体系，是「姓从母来」的活化石。" },
  "妊":{ char:"妊", pinyin:"rèn", category:"matrilineal", pollutionLevel:0,
    shuowen:"孕也。从女，壬声。",
    modern:"怀孕（如妊妇、妊娠）。",
    analysis:"古语有云「化育万物谓之壬」。在远古时期，孕育生命被视为与天地造化同等神圣的伟力。这个字保留了子宫作为「第一母星」核心的原始创生尊严，是纯粹的女性力量结晶。" },

  // ===== 中性字 (neutral) =====
  "如":{ char:"如", pinyin:"rú", category:"neutral", pollutionLevel:3,
    shuowen:"从随也。从女，从口。",
    modern:"顺从，依照；如同，比得上。",
    analysis:"这是一个非常特殊的字。在甲骨文中，它是一个女人跪坐在一个「口」旁边，本意是「听从命令」。作为现代汉语最高频使用的中性词之一，我们每天都在不知不觉中书写着古代女性被命令、被驱使的姿态。" },
  "娠":{ char:"娠", pinyin:"shēn", category:"neutral", pollutionLevel:0,
    shuowen:"女妊身动也。从女，辰声。",
    modern:"怀孕（如妊娠）。",
    analysis:"「辰」在古代有震动、生机萌发之意。这个字非常客观且充满力量地描绘了胎动——女性体内孕育新生命的生物学现实。" },
  "娩":{ char:"娩", pinyin:"miǎn", category:"neutral", pollutionLevel:0,
    shuowen:"生子免身也。从女，免声。",
    modern:"妇女生孩子（如分娩）。",
    analysis:"「免」有解脱、免除之意。从身体中孕育并送出新生命——这是女性作为生命第一起源的生物学力量。" },
  "委":{ char:"委", pinyin:"wěi", category:"neutral", pollutionLevel:2,
    shuowen:"委随也。从女，从禾。",
    modern:"委托、委曲、委靡；也表示堆积、放置。",
    analysis:"「委随也，从女从禾」——随顺、曲从，这种顺从的状态由「女」承载。「委曲求全」「委靡不振」——这些词汇所描述的软弱、顺从的姿态，都建立在「女」的字形基础上。" },

  // ===== 亲属字 (kinship) - 用reclaim分类 =====
  "妈":{ char:"妈", pinyin:"mā", category:"reclaim", pollutionLevel:0,
    shuowen:"《说文》未收录，《广雅》：「妈，母也。」从女，马声。",
    modern:"母亲；对长辈妇女的尊称。",
    analysis:"「ma」这个音在人类几乎所有语言中都指代母亲。这个字是人类最原始的声音记忆——对赋予生命者的本能呼唤。" },
  "奶":{ char:"奶", pinyin:"nǎi", category:"reclaim", pollutionLevel:1,
    shuowen:"本指乳房，后引申为提供乳汁的人（母亲或乳母），再引申为祖母。",
    modern:"乳房；乳汁；祖母（奶奶）。",
    analysis:"女性身体最直接的生命给予器官。从「哺育」到「祖母」，「奶」字承载了生命传承的三代链条——全部由女性承担。" },
  "姐":{ char:"姐", pinyin:"jiě", category:"matrilineal", pollutionLevel:0,
    shuowen:"蜀谓母曰姐。从女，且声。",
    modern:"称呼比自己年长的同辈女性。",
    analysis:"《说文》明确记载：「蜀谓母曰姐」——在四川方言里，「姐」是对母亲的称呼。这个字承载了女性长辈、母亲权威的原始意义。" },
  "妹":{ char:"妹", pinyin:"mèi", category:"neutral", pollutionLevel:0,
    shuowen:"女弟也。从女，未声。",
    modern:"同父母中比自己年纪小的女性。",
    analysis:"「未」本义是枝繁叶茂的树木，含有「未来」、「尚有可能」之意。妹妹是家庭中充满生命可能性的女性。" },
  "姑":{ char:"姑", pinyin:"gū", category:"institution", pollutionLevel:2,
    shuowen:"夫母也。从女，古声。",
    modern:"父亲的姐妹；也指丈夫的母亲（婆婆）。",
    analysis:"宗法制将女性严格按照「父系血缘」和「母系血缘」进行亲疏划分。在以男性为核心的家族中，女性亲戚往往被边缘化为「外人」，她们在宗族遗产和话语权上被系统性地排斥。" },
  "姨":{ char:"姨", pinyin:"yí", category:"matrilineal", pollutionLevel:0,
    shuowen:"妻之姊妹同出为姨。从女，夷声。",
    modern:"母亲的姐妹。",
    analysis:"母系亲戚的专有称谓。「姨」的存在见证了母系血脉网络在汉语亲属称谓体系中的保留——尽管在父权宗法中她们常被排挤为「外亲」。" },
  "娘":{ char:"娘", pinyin:"niáng", category:"reclaim", pollutionLevel:0,
    shuowen:"本义为少女。后专指母亲。",
    modern:"母亲；长辈妇女；年轻妇女（如姑娘）。",
    analysis:"「良女」的组合——善良之女。从少女到母亲，这个字的含义扩展本身就是对女性生命历程的温柔注视。「娘娘」、「老娘」、「姑娘」——这些称谓里保留着对女性尊贵地位的记忆。" },
  "婶":{ char:"婶", pinyin:"shěn", category:"institution", pollutionLevel:2,
    shuowen:"叔父之妻。",
    modern:"叔叔的妻子。",
    analysis:"因为婚姻契约而进入一个陌生父权家庭的女性（所谓的「外姓人」）。她们的身份完全由男性亲属关系界定。" },
  "嫂":{ char:"嫂", pinyin:"sǎo", category:"institution", pollutionLevel:2,
    shuowen:"兄妻也。从女，叟声。",
    modern:"哥哥的妻子。",
    analysis:"同「婶」，嫂子的身份标识完全建立在与男性的关系之上。父权制将女性定义为男性的附属品。" },
  "嬷":{ char:"嬷", pinyin:"mó", category:"institution", pollutionLevel:2,
    shuowen:"后起字，多指年老妇女或从事底层家务的女性（如乳母）。",
    modern:"老年妇女；乳母。",
    analysis:"年老女性或从事底层家务的女性称谓，往往伴随着服务、底层的意味。" },
  "姥":{ char:"姥", pinyin:"lǎo", category:"matrilineal", pollutionLevel:0,
    shuowen:"后起字。",
    modern:"老年妇女；外祖母（姥姥）。",
    analysis:"外祖母——母亲的母亲。「姥姥」是母系血脉链条上的祖母称谓，是家族里最珍贵的女性长辈记忆之一。" },
  "婆":{ char:"婆", pinyin:"pó", category:"institution", pollutionLevel:3,
    shuowen:"老太也。从女，波声。",
    modern:"年老的妇女；丈夫的母亲（婆婆）。",
    analysis:"当一个女人在父权家庭中熬到年老，她便成了「婆」。父权制极其狡猾地将压迫新媳妇的权力下放给了「婆」，制造了千古无解的「婆媳矛盾」。本质上，这是父权制让受害者（女性）互相倾轧，以转移矛盾、维护男性家长统治地位。" },
  "媳":{ char:"媳", pinyin:"xí", category:"institution", pollutionLevel:3,
    shuowen:"后起俗字。「息」本义为儿子。「女」加「息」，即儿子的女人。",
    modern:"儿子的妻子（如儿媳、媳妇）。",
    analysis:"极其直白的物化造字！「媳」字就是「女」字旁加上「息」（儿子），意思是「给儿子配的女人」。在这个称谓里，她没有名字，没有自我，唯一的社会身份和存在的意义，就是作为父系家族繁衍下一代的工具和免费劳动力。" },
  "媒":{ char:"媒", pinyin:"méi", category:"neutral", pollutionLevel:1,
    shuowen:"谋也。谋合二姓者也。从女，某声。",
    modern:"媒人；媒介、媒体。",
    analysis:"撮合婚姻的人，是女性职业的专门化。「媒」的字形承认了女性在社会交际中的核心作用，却将其限定于服务于婚姻制度的功能。" },

  // ===== 扩展贬义字 =====
  "嬖":{ char:"嬖", pinyin:"bì", category:"stigma", pollutionLevel:4,
    shuowen:"便嬖，爱也。从女，辟声。",
    modern:"受宠的（贬义，指以色事人而被宠幸）。",
    analysis:"「辟」本有君王之意，「嬖」字将女性与通过讨好上位者获得宠爱绑定，暗含道德贬损。" },
  "嬉":{ char:"嬉", pinyin:"xī", category:"neutral", pollutionLevel:1,
    shuowen:"乐也。从女，喜声。",
    modern:"嬉戏、玩耍。",
    analysis:"「喜」+「女」= 嬉戏。有趣的是，「快乐地玩耍」这个概念也被冠以女字旁。是赞美？还是暗示女性「应该」保持一种被动的、娱乐他人的状态？" },

  // 保留原有褒义扩展
  "媛":{ char:"媛", pinyin:"yuàn", category:"reclaim", pollutionLevel:2,
    shuowen:"美女也。从女，从爰，爰亦声。",
    modern:"雅称美好的女性；现被网络用于嘲讽特定女性群体（「某某媛」）。",
    analysis:"「媛」是对美好女性最雅正的称谓。然而2020年代，「媛」在网络语境里被污名化为嘲讽词：「佛媛」「病媛」「飞盘媛」。一个字的现代命运，折射出对女性形象管控的新形态。" },
  "婵":{ char:"婵", pinyin:"chán", category:"reclaim", pollutionLevel:1,
    shuowen:"婵娟，女力士也。从女，单声。",
    modern:"现多用于形容姿态轻盈优美（婵娟），原义已几乎失传。",
    analysis:"《说文》原文：「婵娟，女力士也」——婵娟，是女力士！有力量的女性。然而这个字的力量之义被完全遮蔽，「婵娟」在后世诗词里变成了「姿态美好」的代名词。" },
  "嫣":{ char:"嫣", pinyin:"yān", category:"reclaim", pollutionLevel:0,
    shuowen:"美好貌。从女，焉声。",
    modern:"形容女性笑容美好（嫣然一笑）。",
    analysis:"「嫣然」描述的是一种自然流露的美好状态。这是汉字里罕见的、纯粹赞美女性状态而无贬义附着的字之一。" },

  // 额外扩展
  "奻":{ char:"奻", pinyin:"nuán", category:"stigma", pollutionLevel:5,
    shuowen:"訟也。从二女。",
    modern:"争吵、诉讼（现代已极少使用）。",
    analysis:"两个「女」字并排就等于争吵、诉讼——《说文》字形即偏见。这是汉字史上最赤裸的构字偏见之一。" }
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
const INITIAL_TIMELINE = [];
// 史记初始数据已清空。可通过以下方式添加：
// 1. Firebase Console → timeline_posts 集合 → 手动添加文档
// 2. 发布羊皮卷帖子 → 投票超200 → 自动收录
// 3. 管理员手动在 Firebase Console 修改帖子 votes 字段

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
  let results = [];
  try {
    // 1. 从timeline_posts集合读取（管理员手动添加的）
    const q1 = query(collection(db,'timeline_posts'),where('dimension','==',dimension));
    const snap1 = await getDocs(q1);
    if(!snap1.empty) results.push(...snap1.docs.map(d=>({id:d.id,...d.data()})));
  } catch(e){ console.warn('[赤字协议] 史记读取失败:', e); }
  
  try {
    // 2. 从community_posts中拉取200+票的羊皮卷（自动升阶）
    const q2 = query(collection(db,'community_posts'),
      where('type','==','parchment'), where('reported','==',false), limit(100));
    const snap2 = await getDocs(q2);
    if(!snap2.empty) {
      const promoted = snap2.docs.map(d=>({id:d.id,...d.data()}))
        .filter(p => (p.votes||0) >= 200 && (!dimension || p.dimension === dimension));
      // 转换为timeline格式
      promoted.forEach(p => {
        if (!results.find(r => r.id === p.id)) {
          results.push({
            id: p.id, dimension: p.dimension || 'huaxia',
            era: '社区收录', tag: '🏷️ 已升阶',
            title: p.title, summary: (p.content||'').substring(0,100),
            content: `<p>${(p.content||'').replace(/\n/g,'</p><p>')}</p>`,
            votes: p.votes||0, author: p.authorName||'',
            promoted: true
          });
        }
      });
    }
  } catch(e){ console.warn('[赤字协议] 社区升阶帖读取失败:', e); }
  
  if (results.length === 0) {
    results = INITIAL_TIMELINE.filter(p=>p.dimension===dimension);
  }
  return results.sort((a,b)=>(b.votes||0)-(a.votes||0));
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

// 更新用户头像
export async function updateUserAvatar(uid, avatarUrl){
  try {
    await setDoc(doc(db,'users',uid),{avatarUrl, updatedAt:serverTimestamp()},{merge:true});
    return true;
  } catch(e) { console.error('头像更新失败:', e); return false; }
}

// 获取用户档案
export async function getUserProfile(uid){
  try {
    const snap = await getDoc(doc(db,'users',uid));
    if (snap.exists()) return snap.data();
  } catch(e) {}
  return null;
}

// ==========================================
// 💬 私信功能
// ==========================================
function chatIdForUsers(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

// 发送私信
export async function sendDirectMessage(toUid, toName, text) {
  const user = auth.currentUser;
  if (!user) throw new Error('未登录');
  if (!toUid || !text?.trim()) return;
  const chatId = chatIdForUsers(user.uid, toUid);
  const messageText = text.trim();
  const senderName = user.displayName || user.email || '匿名';
  const peerName = toName || '匿名';
  const preview = messageText.substring(0, 80);
  
  // 关键操作（必须成功）：发送实际消息到 /dms/{chatId}/messages
  const sendMessage = addDoc(collection(db,'dms',chatId,'messages'), {
    fromId: user.uid,
    fromName: senderName,
    text: messageText,
    createdAt: serverTimestamp()
  });
  
  // 元数据更新（与消息发送并行）
  const updateMeta = setDoc(doc(db,'dms',chatId), {
    participants: [user.uid, toUid],
    participantNames: { [user.uid]: senderName, [toUid]: peerName },
    lastMessage: preview,
    lastMessageTime: serverTimestamp(),
    lastSenderId: user.uid,
    [`unread_${toUid}`]: true
  }, { merge: true });
  
  // 索引更新（并行，失败不阻塞）
  const updateMyIndex = setDoc(doc(db,'users',user.uid,'chats',chatId), {
    chatId, peerId: toUid, peerName,
    lastMessage: preview, lastMessageTime: serverTimestamp(), unread: false
  }, { merge: true }).catch(e => console.warn('我的对话索引失败:', e));
  
  const updatePeerIndex = setDoc(doc(db,'users',toUid,'chats',chatId), {
    chatId, peerId: user.uid, peerName: senderName,
    lastMessage: preview, lastMessageTime: serverTimestamp(), unread: true
  }, { merge: true }).catch(e => console.warn('对方对话索引失败:', e));
  
  // 等待关键操作完成（消息和元数据），索引在后台异步执行
  await Promise.all([sendMessage, updateMeta]);
  // 索引不阻塞，让用户立即看到消息已发送
  Promise.all([updateMyIndex, updatePeerIndex]).catch(()=>{});
}

// 监听某个对话的所有消息（客户端排序，处理pending writes）
export function listenToDmMessages(chatId, cb) {
  const q = query(collection(db,'dms',chatId,'messages'), limit(500));
  return onSnapshot(q, { includeMetadataChanges: true }, snap => {
    const msgs = snap.docs.map(d => {
      const data = d.data();
      // 如果createdAt还是null（pending write），用本地时间戳代替
      const ts = data.createdAt?.seconds 
        ? data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds||0)/1e6
        : Date.now();
      return { id: d.id, ...data, _sortTs: ts };
    });
    // 客户端按时间升序排
    msgs.sort((a, b) => a._sortTs - b._sortTs);
    cb(msgs);
  }, err => { console.warn('DM监听失败:', err); cb([]); });
}

// 监听用户的所有聊天列表（从用户子集合读取，避免顶层query规则问题）
export function listenToUserChats(uid, cb) {
  // 改成从 users/{uid}/chats 子集合读取
  const q = query(collection(db,'users',uid,'chats'), limit(50));
  return onSnapshot(q, snap => {
    const chats = snap.docs.map(d => {
      const data = d.data();
      return {
        id: data.chatId || d.id,
        participants: [uid, data.peerId],
        participantNames: { [uid]: '我', [data.peerId]: data.peerName || '匿名' },
        lastMessage: data.lastMessage || '',
        lastMessageTime: data.lastMessageTime,
        [`unread_${uid}`]: data.unread === true
      };
    });
    chats.sort((a,b) => (b.lastMessageTime?.seconds||0) - (a.lastMessageTime?.seconds||0));
    cb(chats);
  }, err => { console.warn('聊天列表监听失败:', err); cb([]); });
}

// 标记为已读
export async function markChatAsRead(chatId, uid) {
  try {
    // 同时更新主dms文档和用户子集合
    await setDoc(doc(db,'dms',chatId), { [`unread_${uid}`]: false }, { merge: true });
    await setDoc(doc(db,'users',uid,'chats',chatId), { unread: false }, { merge: true });
  } catch(e) {}
}

// ==========================================
// 📢 世界公告
// ==========================================
export async function getAnnouncements() {
  try {
    const q = query(collection(db,'announcements'), where('active','==',true), limit(20));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    }
  } catch(e) {}
  return [];
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

// 获取所有已升阶的glyph提案（用于注入字典）
export async function getAllPromotedGlyphs(){
  try {
    const q = query(collection(db,'community_posts'),
      where('type','==','glyph'), where('reported','==',false), limit(200));
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
