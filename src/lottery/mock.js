/*
 * @Description: 请输入....
 * @Author: Gavin
 * @Date: 2022-01-11 15:24:49
 * @LastEditTime: 2022-06-21 18:34:34
 * @LastEditors: Gavin
 */
const test = [
  ["001", "陈雁", "允熙科技"]
  , ["002", "黄纯熙", "允熙科技"]
  , ["003", "易雨", "允熙科技"]
  , ["004", "余杰", "允熙科技"]
  , ["005", "蔡露遥", "允熙科技"]
  , ["006", "余启焓", "允熙科技"]
  , ["007", "唐伟", "允熙科技"]
  , ["008", "符长鉴", "允熙科技"]
  , ["009", "代方洁", "允熙科技"]
  , ["010", "徐定桓", "允熙科技"]
  , ["011", "张若飞", "允熙科技"]
  , ["012", "李鹏旗", "允熙科技"]
  , ["013", "唐艺芝", "允熙科技"]
  , ["014", "罗雨璐", "允熙科技"]
  , ["015", "陈龙", "允熙科技"]
  , ["016", "王美华", "允熙科技"]
  , ["017", "钟佩伶", "允熙科技"]
  , ["018", "李继发", "允熙科技"]
  , ["019", "石诚", "允熙科技"]
  , ["020", "吕世雄", "允熙科技"]
]

function randomsort(a, b) {
  return Math.random() > .5 ? -1 : 1;
  //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1
}



const user = test.sort(randomsort)
/**
 * 卡片公司名称标识
 */
const COMPANY = "允熙科技";
/**
 * 奖品设置
 * type: 唯一标识，0是默认特别奖的占位符，其它奖品不可使用
 * count: 奖品数量
 * title: 奖品描述
 * text: 奖品标题
 * img: 图片地址
 * ROTATE_TIME:转的球速度越大越慢
 * circle:旋转圈数最好8*x倍数
 * enter: //抽奖进行时音乐
 * awards: //颁奖音乐
 * roundPrizes: 本轮的具体奖品列表
 */

/**
 * 每轮固定的奖品（按轮次分配）
 */
const roundPrizesConfig = {
  1: [
    "比乐蒂（Bialetti）摩卡壶咖",
    "樱桃键盘MX2.0 Pro",
    "星巴克大容量杯子（黑色）",
    "小米登机箱（黑色）"
  ],
  2: [
    "漫步者W820NB头戴式耳机",
    "星巴克大容量杯子（粉色）",
    "科颜氏高保湿面霜礼盒",
    "飞科吹风机"
  ],
  3: [
    "红包200",
    "5L空气炸锅",
    "小熊养生壶",
    "usmile笑容加Y30S电动牙刷情侣款"
  ],
  4: [
    "小熊养生壶",
    "5L空气炸锅",
    "BKT护腰垫",
    "美的电烤箱"
  ],
  5: [
    "小米登机箱（白色）",
    "好利来200元卡券",
    "山姆同款取暖炉",
    "人体工学罗技Lift蓝牙垂直鼠标"
  ]
};

// 获取当前轮次剩余的奖品
function getLeftPrizesForRound(roundType) {
  const key = `leftPrizes_round_${roundType}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return roundPrizesConfig[roundType] ? [...roundPrizesConfig[roundType]] : [];
}

// 保存当前轮次剩余的奖品
function saveLeftPrizesForRound(roundType, prizes) {
  const key = `leftPrizes_round_${roundType}`;
  localStorage.setItem(key, JSON.stringify(prizes));
}

// 已抽中的奖品记录 { 轮次: [{ user: 用户信息, prize: 奖品名称 }] }
let wonPrizes = JSON.parse(localStorage.getItem("wonPrizes")) || {};

const prizes = [
  {
    type: 0,
    count: 1000,
    title: "抽奖结束",
    text: "全部抽奖已完成"
  },
  {
    type: 1,
    count: 4,
    text: "第一轮",
    title: "摩卡壶/樱桃键盘/星巴克杯/小米登机箱",
    img: "./img/huawei.png",
    enter: "1st-lottery",
    awards: "1st-BJ-BGM",
    ROTATE_TIME: 15000,
    circle: 8 * 4
  },
  {
    type: 2,
    count: 4,
    text: "第二轮",
    title: "漫步者耳机/星巴克杯/科颜氏礼盒/飞科吹风机",
    img: "./img/mbp.jpg",
    enter: "other-lottery",
    awards: "other-BJ-BGM",
    ROTATE_TIME: 12000,
    circle: 8 * 3
  },
  {
    type: 3,
    count: 4,
    text: "第三轮",
    title: "红包200/空气炸锅/养生壶/电动牙刷",
    img: "./img/ipad.jpg",
    enter: "other-lottery",
    awards: "other-BJ-BGM",
    ROTATE_TIME: 10000,
    circle: 8 * 3
  },
  {
    type: 4,
    count: 4,
    text: "第四轮",
    title: "养生壶/空气炸锅/护腰垫/电烤箱",
    img: "./img/kindle.jpg",
    enter: "other-lottery",
    awards: "other-BJ-BGM",
    ROTATE_TIME: 10000,
    circle: 8 * 2
  },
  {
    type: 5,
    count: 4,
    text: "第五轮",
    title: "小米登机箱/好利来卡券/取暖炉/罗技鼠标",
    img: "./img/edifier.jpg",
    enter: "other-lottery",
    awards: "other-BJ-BGM",
    ROTATE_TIME: 10000,
    circle: 8 * 1
  }
];
let luckyData = JSON.parse(localStorage.getItem("luckyData")) || {};

let leftUsers = JSON.parse(localStorage.getItem("leftUsers")) || user;

let awardList = JSON.parse(localStorage.getItem("awardList")) || {}


//不能说的秘密
const excludeUser = []
/**
 * @description: 不能说的秘密
 * @param {*} nowItem 当前奖品
 * @param {*} basicData 当前奖池人员
 * @return {*}
 * @Date: 2022-01-13 15:13:31
 */
function setSecret(nowItem, basicData) {
  if (nowItem.type != 4) {
    // console.log(mockData.excludeUser);
    const excludeId = excludeUser.map(item => item[0])
    // console.log(excludeId, basicData.leftUsers);
    basicData.leftUsers = basicData.leftUsers.filter(human => !excludeId.includes(human[0]))
    // console.log(basicData.leftUsers);
  }
}
//颜色
const rgba = "0,0,0"
//透明度
const opacity = () => 0.3 || Math.random() * 0.7 + 0.25
//气氛组卡片
const atmosphereGroupCard = () => `rgba(${rgba},${opacity()})`
//背景色
const background = "url(https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01ef5e59c878d5a8012053f8c53ab7.jpg%401280w_1l_2o_100sh.jpg&refer=http%3A%2F%2Fimg.zcool.cn&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1645253836&t=e6413ccc6469632cf5476f5f6067e13b)"
//背景动态壁纸模式 不用时可以设置为null或者注释
// const bgVideo="//game.gtimg.cn/images/lol/act/a20220121lunarpass/bg.mp4"
const width = window.innerWidth * .75
const height = window.innerWidth * .75 * .75
/**
 * 一次抽取的奖品个数与prizes对应
 */
const EACH_COUNT = [4, 4, 4, 4, 4];
export default { EACH_COUNT, prizes, COMPANY, user, luckyData, leftUsers, awardList, excludeUser, atmosphereGroupCard, background, setSecret, width, height, bgVideo, roundPrizesConfig, getLeftPrizesForRound, saveLeftPrizesForRound, wonPrizes }