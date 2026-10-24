// 竹北政策島 — 政策資料
// 內容整理自公開新聞報導（皆為候選人自述主張），非官方資料。
// 整理日期：2026-10-24

export default {
  meta: {
    candidate: "曾聖凱",
    city: "竹北市",
    slogan: "竹北共識，聖凱延續",
    title: "竹北政策島",
    disclaimer: "非官方整理，資料來自公開新聞報導",
    sources: [
      /* 0 */ { title: "Newtalk：延續鄭朝方治理成果 曾聖凱：8大政策核心讓竹北「超級進化」", url: "https://newtalk.tw/news/view/2026-09-18/1060603" },
      /* 1 */ { title: "民進黨新聞稿：曾聖凱：「竹北共識、聖凱延續」讓城市再進化，打造安全、宜居的文化城", url: "https://www.dpp.org.tw/media/contents/11774" },
      /* 2 */ { title: "聯合報：竹北選戰拚生活政見 曾聖凱提三大行動", url: "https://udn.com/news/story/124652/9790492" },
      /* 3 */ { title: "自由時報：曾聖凱提「竹北好發展」政見 串聯31里生活與商圈資源", url: "https://news.ltn.com.tw/news/politics/breakingnews/5593030" },
      /* 4 */ { title: "聯合報：打造城市韌性 竹北市長參選人曾聖凱推不斷電活動中心", url: "https://udn.com/news/story/124652/9769892" },
      /* 5 */ { title: "自由時報：改善通勤痛點！曾聖凱祭「交通升級三箭」 打造智慧竹北生活圈", url: "https://news.ltn.com.tw/news/politics/breakingnews/5589349" },
      /* 6 */ { title: "聯合報：竹北市長選戰打交通牌 曾聖凱推停車好找、公車好查、通學安心三箭", url: "https://udn.com/news/story/7324/9783343" },
      /* 7 */ { title: "自由時報：民進黨青年志工竹北合體跨世代力挺 曾聖凱拋三大青年政策", url: "https://news.ltn.com.tw/news/politics/breakingnews/5603526" },
      /* 8 */ { title: "聯合報：民進黨全票通過徵召曾聖凱戰竹北 曾提「城市治理」拚十年發展", url: "https://udn.com/vote2026/story/124652/9690222" },
      /* 9 */ { title: "自由時報：曾聖凱拋「500公尺生活圈」 打造有溫度的竹北", url: "https://news.ltn.com.tw/news/politics/breakingnews/5580957" },
      /* 10 */ { title: "自由時報：竹北拚老少共好！曾聖凱倡「健康樂活、社區陪伴、友善環境」三方向", url: "https://news.ltn.com.tw/news/politics/breakingnews/5608817" },
      /* 11 */ { title: "自由時報：曾聖凱拋「公園再進化」政見！主打市管公園分眾規劃 滿足全齡休憩需求", url: "https://news.ltn.com.tw/news/politics/breakingnews/5598378" },
      /* 12 */ { title: "自由時報：曾聖凱中秋節拜票鎖定竹北信仰場域 融入市民生活", url: "https://news.ltn.com.tw/news/politics/breakingnews/5586281" },
      /* 13 */ { title: "自由時報：清晨送車傾聽地方心聲 曾聖凱：政見要貼近市民生活", url: "https://news.ltn.com.tw/news/politics/breakingnews/5595830" },
      /* 14 */ { title: "自由時報：曾聖凱參與雙十升旗 呼籲跨黨派合作落實民生福祉", url: "https://news.ltn.com.tw/news/politics/breakingnews/5601605" }
    ]
  },

  themes: [
    {
      id: "care",
      no: 1,
      title: "全齡照顧",
      icon: "🏠",
      color: "#e07a5f",
      summary: "以「老少共好、世代共享」為目標，從長輩健康、社區陪伴到友善公園環境，照顧不同年齡的市民。",
      quote: "我們希望長輩不只是活得長壽，更要活得健康、快樂、有尊嚴。",
      tags: ["支持生活", "長輩", "老少共好"],
      items: [
        { id: "care-1", title: "健康樂活：肌力與防跌課程", desc: "與社區資源及專業團隊合作，推動長者肌力訓練與跌倒預防課程，透過規律運動維持行動力。", source: 10 },
        { id: "care-2", title: "社區陪伴", desc: "支持各里舉辦藝文、體育與交流活動，鼓勵長輩走出家門、拓展社交圈，建立社區支持網絡。", source: 10 },
        { id: "care-3", title: "友善環境：公園適齡設施", desc: "優化公園步道，增設休憩座椅、遮蔭與無障礙設施，讓不同世代都能舒適使用公園。", source: 10 },
        { id: "care-4", title: "健康課程有穩定空間", desc: "建立透明便利的社區場所借用制度，讓各類健康課程有穩定的活動空間。", source: 9 },
        { id: "care-5", title: "育兒福利與公共幼教", desc: "在青年安居成家政策中，提出完善育兒福利、公共幼教與交通通勤，減輕成家負擔。", source: 7 }
      ],
      links: ["service", "space", "edu"]
    },
    {
      id: "service",
      no: 2,
      title: "城市生活支持服務",
      icon: "🤝",
      color: "#f2a65a",
      summary: "市公所從市民日常需求出發，整合公共空間、生活資訊與服務資源，讓服務走進 31 里。",
      quote: "支持生活、帶動商圈、服務進里",
      tags: ["竹北好發展", "支持生活", "服務進里"],
      items: [
        { id: "service-1", title: "整合公共空間與生活資訊", desc: "整合既有公共空間、生活資訊與服務資源，縮短市民取得公共服務的距離與時間，讓不同年齡與生活型態的市民都能便利使用。", source: 2 },
        { id: "service-2", title: "服務進里", desc: "依各里特色安排活動，把行政資源延伸到第一線，讓居民在自己的生活圈內就能取得更多資源。", source: 13 },
        { id: "service-3", title: "走訪 31 里傾聽需求", desc: "走訪竹北 31 里、舉辦產業座談與市民對話，掌握各里人口組成與生活需求差異，作為市政規劃參考。", source: 8 },
        { id: "service-4", title: "跨層級合作、東西區均衡", desc: "主張中央、縣府與市公所攜手合作，推動資源有效分配，促進竹北東西區均衡發展。", source: 14 }
      ],
      links: ["care", "culture", "space"]
    },
    {
      id: "edu",
      no: 3,
      title: "安心教育",
      icon: "🎒",
      color: "#e9c46a",
      summary: "擴大市公所幼兒園、讓孩子安心上學與探索城市；延續現任市府的教育與公共空間方向。",
      quote: "",
      tags: ["幼教", "通學", "親子"],
      items: [
        { id: "edu-1", title: "擴大市公所幼兒園規模", desc: "持續擴大竹北市公所幼兒園規模，延續現任市府的公共幼教方向。", source: 0 },
        { id: "edu-2", title: "讓孩子安心探索城市", desc: "強調政府應先打造安全的生活環境，讓家長能放心讓孩子探索城市。", source: 1 },
        { id: "edu-3", title: "黃金通學線看得到、搭得到", desc: "以電子站牌、APP 與即時資訊，讓學生與家長掌握通學車輛動態，讓家長放心、學生方便。", source: 6 },
        { id: "edu-4", title: "兒童遊戲空間安全", desc: "「公園再進化」中優化兒童遊戲設施與安全動線，並依法嚴格辦理檢驗管理。", source: 11 }
      ],
      links: ["traffic", "care", "youth"]
    },
    {
      id: "traffic",
      no: 4,
      title: "人本交通",
      icon: "🚲",
      color: "#8fb996",
      summary: "交通服務升級三箭：停車好找、公車好查、通學安心，並以人本理念打造 500 公尺生活圈。",
      quote: "市民要搭車，不會研究這是哪一個機關管轄的公車",
      tags: ["交通三箭", "500公尺生活圈"],
      items: [
        { id: "traffic-1", title: "停車 e 化 2.0", desc: "優化公有停車場資訊，即時掌握停車位置與剩餘車位；延續快、慢充電服務並整合充電設施位置與使用狀況。", source: 6 },
        { id: "traffic-2", title: "公車 2.0", desc: "整合縣府快捷公車、竹北市民公車與雙市黃金通學線三套資訊，結合電子站牌與手機 APP，從使用者角度降低查詢與搭乘門檻。", source: 6 },
        { id: "traffic-3", title: "黃金通學線智慧化", desc: "將通學線納入公車 2.0 資訊整合，以即時動態與智慧站牌讓家長掌握車輛位置與到站狀況。", source: 5 },
        { id: "traffic-4", title: "500 公尺生活圈", desc: "以人本理念與城市設計，讓居民在住家周邊約 500 公尺內即可滿足日常所需。", source: 9 },
        { id: "traffic-5", title: "竹北第一條自行車高速公路", desc: "規劃從高鐵站直通新月沙灣的自行車道，兼具通行與觀光休閒功能。", source: 1 }
      ],
      links: ["edu", "digital", "market"]
    },
    {
      id: "resilience",
      no: 5,
      title: "城市韌性",
      icon: "🛡️",
      color: "#c97c7c",
      summary: "「把竹北保護好」：不斷電活動中心、智慧環境偵測與跨層級防災，讓 31 里平時安心、災時有靠。",
      quote: "把竹北保護好",
      tags: ["防災", "不斷電", "31里"],
      items: [
        { id: "resilience-1", title: "不斷電市民活動中心", desc: "盤點各里安全合適的場館，檢視結構、消防、配電與無障礙後配置備援電力，停電時支援照明、通訊、充電與必要維生設備，並實測供電能力與時間。", source: 4 },
        { id: "resilience-2", title: "智慧環境偵測", desc: "整合既有雨量、水位與積淹水資訊並補足缺口，串聯異常查證、風險通報與現場處置，每筆資訊都對應權責單位與後續行動。", source: 4 },
        { id: "resilience-3", title: "跨層級防災", desc: "市公所負責市管設施與社區整備，消防、水利與縣府、中央協作；結合里長、防災士與社區夥伴演練，事先盤點物資、聯繫方式與弱勢照顧需求。", source: 4 },
        { id: "resilience-4", title: "行動能源屋經驗導入 31 里", desc: "其團隊 2019 年曾設計具發電、儲能與基礎醫療空間的「行動能源屋」，希望將經驗轉化為防災方案，逐步導入竹北 31 個里。", source: 4 }
      ],
      links: ["digital", "space", "care"]
    },
    {
      id: "digital",
      no: 6,
      title: "竹北數位孿生／智慧市政",
      icon: "🛰️",
      color: "#9d8ec4",
      summary: "以資訊整合讓市政更透明好用；目前報導中未見「數位孿生」的具體方案，以下為已公開的智慧化與資訊公開主張。",
      quote: "",
      tags: ["資訊公開", "智慧化"],
      items: [
        { id: "digital-1", title: "竹北公共平台公開市政資訊", desc: "延續現任市府方向，持續擴大「八大政策」，透過竹北公共平台讓民眾得知市政資訊。", source: 1 },
        { id: "digital-2", title: "交通資訊一站整合", desc: "停車、充電樁、公車與通學線資訊整合進電子站牌與手機 APP，以數位科技改善查詢體驗。", source: 6 },
        { id: "digital-3", title: "環境監測資料串聯", desc: "雨量、水位、淹水資料整合並補足缺口，資料直接連結權責單位與處置流程。", source: 4 }
      ],
      links: ["traffic", "resilience", "service"]
    },
    {
      id: "space",
      no: 7,
      title: "公有空間活化",
      icon: "🌳",
      color: "#a3b86c",
      summary: "延續地下道、公園改造成果，推動「公園再進化」與活動中心升級，讓公共空間更好用。",
      quote: "",
      tags: ["公園再進化", "活動中心"],
      items: [
        { id: "space-1", title: "公園再進化：分眾規劃", desc: "全面盤點市公所轄管公園，依各生活圈人口結構分區規劃兒童遊戲、長者休憩與寵物活動場域，原則為盤點需求、分眾規劃、分期改善。", source: 11 },
        { id: "space-2", title: "寵物活動專區評估", desc: "針對腹地適當的公園，評估設置具完善圍籬與動線的寵物活動專區。", source: 11 },
        { id: "space-3", title: "集會所與活動中心升級", desc: "全面檢視各里集會所與活動中心，改善照明、通風與無障礙設施。", source: 9 },
        { id: "space-4", title: "透明便利的借用制度", desc: "建立公共空間借用制度，讓社區課程與活動有穩定的使用空間。", source: 9 },
        { id: "space-5", title: "延續地下道與公園改造", desc: "延續過去三年地下道、公園與公共空間的升級，如市東、市西公園由昏暗改造為受孩子喜愛的特色公園。", source: 1 }
      ],
      links: ["care", "culture", "resilience"]
    },
    {
      id: "market",
      no: 8,
      title: "市場與商圈共榮",
      icon: "🏮",
      color: "#d9a066",
      summary: "以活動串聯與城市行銷，提升傳統市場與在地店家能見度，把活動人潮導入街區消費。",
      quote: "讓資源走出去、人潮走進來",
      tags: ["竹北好發展", "帶動商圈"],
      items: [
        { id: "market-1", title: "活動人潮帶動街區消費", desc: "透過活動串聯、城市行銷與在地特色推廣，提高傳統市場、在地商圈與特色店家的曝光度。", source: 2 },
        { id: "market-2", title: "新瓦屋假日市集", desc: "活化新瓦屋與封街市集，結合客家聚落特色，定期舉辦客家飲食、傳統手作、地方導覽與青年創意主題市集。", source: 9 },
        { id: "market-3", title: "市集交通與動線改善", desc: "改善市集周邊交通引導、行人動線與接駁。", source: 9 },
        { id: "market-4", title: "支持店家接班", desc: "青年政策中支持返鄉務農與店家接班，協助在地商業延續。", source: 7 }
      ],
      links: ["culture", "youth", "traffic"]
    },
    {
      id: "culture",
      no: 9,
      title: "文化運動閱讀巡迴31里",
      icon: "📚",
      color: "#c48b9f",
      summary: "依各里特色規劃文化、運動與閱讀活動，讓市民不必跨區，在自己的生活圈就能參與。",
      quote: "讓傳統不只是被保存，更能融入現代生活、持續發展",
      tags: ["竹北好發展", "服務進里", "文化城"],
      items: [
        { id: "culture-1", title: "巡迴 31 里", desc: "把文化、運動與閱讀資源送進各里，市民不必參加跨區大型活動也能就近參與。", source: 2 },
        { id: "culture-2", title: "因地制宜的里特色活動", desc: "市公所依各里特色與需求規劃活動，讓 31 里共享發展成果。", source: 3 },
        { id: "culture-3", title: "住家周邊的文化資源", desc: "更重視住家周邊的公園、圖書館、展覽與教育資源，打造安全、宜居且有文化底蘊的城市。", source: 1 },
        { id: "culture-4", title: "地方信仰與客家文化", desc: "走訪地方信仰中心與平安戲等活動，主張讓傳統融入現代生活、持續發展。", source: 12 }
      ],
      links: ["service", "market", "space"]
    },
    {
      id: "youth",
      no: 10,
      title: "青年",
      icon: "🌱",
      color: "#ef9a8a",
      summary: "三大青年政策：創業職涯、安居成家、公共參與，讓青年願意來竹北，也願意留下來。",
      quote: "讓青年願意來竹北是城市的吸引力；讓青年願意留下來，才是城市真正的競爭力。",
      tags: ["青年三大政策"],
      items: [
        { id: "youth-1", title: "創業職涯", desc: "整合政府、大學、企業與地方資源，建立創業培訓與數位轉型機制，並活化市有空間。", source: 7 },
        { id: "youth-2", title: "返鄉務農與店家接班", desc: "支持青年返鄉務農與接手在地店家，拓展職涯選擇。", source: 7 },
        { id: "youth-3", title: "安居成家", desc: "協助租屋補貼申請與租賃糾紛轉介，銜接中央與縣府住宅資源。", source: 7 },
        { id: "youth-4", title: "活動中心多元使用", desc: "改善活動中心等設施，提供閱讀、運動與展演用途。", source: 7 },
        { id: "youth-5", title: "城市問題提案與試辦", desc: "開放城市問題提案與試辦機制，讓青年創意能被討論並落實。", source: 7 }
      ],
      links: ["market", "edu", "digital"]
    }
  ],

  // 協作任務：每項對應一組 links，由小人在兩座島之間來回搬運。
  // cargo 是小人背上搬的東西；crew 是兩位搬運人員的職業造型（見 scene.js ROLES）；source 為 meta.sources 索引。
  tasks: [
    { id: "F1", from: "care", to: "space", cargo: "🪑", crew: ["長者志工", "公園管理員"], title: "公園加座椅、遮蔭與無障礙，長輩走得出門", desc: "全齡照顧的「友善環境」與公園再進化一起推：優化步道、增設休憩座椅與遮蔭，讓長輩願意走進公園。", source: 10 },
    { id: "F2", from: "care", to: "service", cargo: "🗝️", crew: ["照服員", "公務員"], title: "社區場所借用透明化，健康課程有固定空間", desc: "建立透明便利的社區場所借用制度，讓長者肌力、防跌等健康課程有穩定的上課地點。", source: 9 },
    { id: "F3", from: "care", to: "edu", cargo: "🍼", crew: ["家長", "幼教老師"], title: "育兒福利與公共幼教，一起減輕成家負擔", desc: "完善育兒福利與公共幼教，並延續擴大市公所幼兒園規模。", source: 7 },
    { id: "F4", from: "service", to: "culture", cargo: "📦", crew: ["里長", "圖書館員"], title: "服務進里：依各里特色把活動送進社區", desc: "市公所依各里特色與需求規劃文化、運動與閱讀活動，居民在自己的生活圈就能參與。", source: 2 },
    { id: "F5", from: "service", to: "space", cargo: "🗺️", crew: ["公務員", "公園管理員"], title: "整合公共空間與生活資訊，縮短找服務的距離", desc: "整合既有公共空間、生活資訊與服務資源，讓不同年齡的市民都能便利使用。", source: 2 },
    { id: "F6", from: "edu", to: "traffic", cargo: "🚌", crew: ["學童", "公車司機"], title: "黃金通學線納入公車 2.0，家長看得到車在哪", desc: "通學線升級為智慧版本，以即時動態與智慧站牌讓學生掌握班車、家長確認到站狀況。", source: 5 },
    { id: "F7", from: "edu", to: "youth", cargo: "🎒", crew: ["幼教老師", "家長"], title: "公共幼教支持青年安居成家", desc: "青年「安居成家」政策中，把育兒福利、公共幼教與通勤一起納入，降低年輕家庭負擔。", source: 7 },
    { id: "F8", from: "traffic", to: "digital", cargo: "📡", crew: ["通勤族", "工程師"], title: "停車、充電、公車資訊整合進 APP 與電子站牌", desc: "停車 e 化 2.0 與公車 2.0：公有停車場剩餘車位、充電樁與三套公車資訊整合查詢。", source: 6 },
    { id: "F9", from: "traffic", to: "market", cargo: "🚲", crew: ["交通志工", "攤商"], title: "市集周邊交通引導與接駁", desc: "活化新瓦屋與封街市集時，同步改善周邊交通引導、行人動線與接駁。", source: 9 },
    { id: "F10", from: "resilience", to: "digital", cargo: "💧", crew: ["防災士", "研究員"], title: "雨量、水位、淹水資料串起來，每筆都有人負責", desc: "整合既有監測資料並補足缺口，每筆資訊對應權責單位與後續處置。", source: 4 },
    { id: "F11", from: "resilience", to: "space", cargo: "🔋", crew: ["電工", "公園管理員"], title: "盤點各里場館，改造為不斷電活動中心", desc: "檢視結構、消防、配電與無障礙後配置備援電力，停電時支援照明、通訊與充電。", source: 4 },
    { id: "F12", from: "resilience", to: "care", cargo: "🧰", crew: ["防災士", "照服員"], title: "事先盤點弱勢照顧需求，災時有人照應", desc: "結合里長、防災士與社區夥伴演練，事先盤點物資、聯繫方式與弱勢照顧需求。", source: 4 },
    { id: "F13", from: "digital", to: "service", cargo: "📱", crew: ["工程師", "公務員"], title: "竹北公共平台公開市政資訊", desc: "延續現任市府方向，透過竹北公共平台讓市民即時得知市政資訊。", source: 1 },
    { id: "F14", from: "space", to: "culture", cargo: "📚", crew: ["公園管理員", "圖書館員"], title: "公園、圖書館、展覽資源放在住家周邊", desc: "更重視住家周邊的公園、圖書館、展覽與教育資源，打造有文化底蘊的城市。", source: 1 },
    { id: "F15", from: "market", to: "culture", cargo: "🏮", crew: ["攤商", "導覽員"], title: "新瓦屋市集結合客家飲食、手作與導覽", desc: "定期舉辦客家飲食、傳統手作、地方導覽與青年創意主題市集。", source: 9 },
    { id: "F16", from: "youth", to: "market", cargo: "🥬", crew: ["小農", "青年店長"], title: "支持青年返鄉務農與店家接班", desc: "青年「創業職涯」政策支持返鄉務農與在地店家接班，讓商圈有新血。", source: 7 },
    { id: "F17", from: "youth", to: "digital", cargo: "💡", crew: ["青年創業者", "研究員"], title: "數位轉型培訓與城市問題提案試辦", desc: "整合大學與企業資源推動數位轉型，並開放城市問題提案與試辦機制。", source: 7 }
  ]
};
