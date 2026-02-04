import "./index.css";
import "../css/animate.min.css";
import "./canvas.js";
import {
  addQipao,
  setPrizes,
  showPrizeList,
  setPrizeData,
  resetPrize
} from "./prizeList";
import { NUMBER_MATRIX } from "./config.js";
import mockData from "./mock"
// layui.use(['layer', 'form'], function(){
//   var layer = layui.layer
//   ,form = layui.form;

//   layer.msg('Hello World');
// });
const ROTATE_TIME = 1000;
const BASE_HEIGHT = 1080;


let TOTAL_CARDS,
  nowScenes,
  btns = {
    enter: document.querySelector("#enter"),
    lotteryBar: document.querySelector("#lotteryBar")
  },
  prizes,
  EACH_COUNT,
  ROW_COUNT = 7,
  COLUMN_COUNT = 17,
  COMPANY,
  HIGHLIGHT_CELL = [],
  // 当前的比例
  Resolution = 1;

let camera,
  scene,
  renderer,
  controls,
  threeDCards = [],
  targets = {
    table: [],
    sphere: []
  };

let selectedCardIndex = [],
  rotate = false,
  basicData = {
    prizes: [], //奖品信息
    users: [], //所有人员
    luckyUsers: {}, //已中奖人员
    leftUsers: [] //未中奖人员
  },
  interval,
  // 当前抽的奖项，从最低奖开始抽，直到抽到大奖
  currentPrizeIndex,
  //当前选择的奖品
  currentPrize,
  // 正在抽奖
  isLotting = false,
  currentLuckys = [],
  // 当前轮次抽中的奖品
  currentWonPrizes = [];

initAll();

/**
 * 初始化所有DOM
 */
function initAll() {


  // window.AJAX({
  //   url: "/getTempData",
  //   success(data) {
  //     // 获取基础数据
  //     prizes = data.cfgData.prizes;//奖项
  //     EACH_COUNT = data.cfgData.EACH_COUNT;//抽奖公式["1","2"] 一等奖1,二等奖3 
  //     COMPANY = data.cfgData.COMPANY;//公司名
  //     HIGHLIGHT_CELL = createHighlight();
  //     basicData.prizes = prizes;//基础奖项配置
  //     setPrizes(prizes);

  //     TOTAL_CARDS = ROW_COUNT * COLUMN_COUNT;

  //     // 读取当前已设置的抽奖结果
  //     basicData.leftUsers = data.leftUsers;//左边用户
  //     basicData.luckyUsers = data.luckyData;//已抽奖用户

  //     let prizeIndex = basicData.prizes.length - 1;
  //     for (; prizeIndex > -1; prizeIndex--) {
  //       if (
  //         data.luckyData[prizeIndex] &&
  //         data.luckyData[prizeIndex].length >=
  //           basicData.prizes[prizeIndex].count
  //       ) {
  //         continue;
  //       }
  //       currentPrizeIndex = prizeIndex;
  //       currentPrize = basicData.prizes[currentPrizeIndex];
  //       break;
  //     }

  //     showPrizeList(currentPrizeIndex);
  //     let curLucks = basicData.luckyUsers[currentPrize.type];
  //     setPrizeData(currentPrizeIndex, curLucks ? curLucks.length : 0, true);
  //   }
  // });

  // window.AJAX({
  //   url: "/getUsers",
  //   success(data) {
  //     console.log(data);
  //     // basicData.users = data;

  //     // initCards();
  //     // // startMaoPao();
  //     // animate();
  //     // shineCard();
  //   }
  // });
  initStyle()
  startMock()
}
function initStyle() {
  if (mockData.bgVideo) {
    bgVideo.innerHTML = `<video class="bg-video" src="${mockData.bgVideo}" loop="" muted=""
    autoplay=""></video>`
  }
  body.style.backgroundImage = mockData.background//背景颜色
}
function startMock() {

  prizes = mockData.prizes;//奖项
  EACH_COUNT = mockData.EACH_COUNT;//抽奖公式["1","2"] 一等奖1,二等奖3 
  COMPANY = mockData.COMPANY;//公司名
  HIGHLIGHT_CELL = createHighlight();
  basicData.prizes = prizes;//基础奖项配置
  setPrizes(prizes);

  TOTAL_CARDS = ROW_COUNT * COLUMN_COUNT;

  // 读取当前已设置的抽奖结果
  basicData.leftUsers = mockData.leftUsers;//左边用户
  basicData.luckyUsers = mockData.luckyData;//已抽奖用户

  // 从第1轮开始，找到当前应该抽奖的轮次
  let prizeIndex = 1; // 从1开始，0是"抽奖结束"占位符
  for (; prizeIndex < basicData.prizes.length; prizeIndex++) {
    let prizeType = basicData.prizes[prizeIndex].type;
    let luckyCount = mockData.luckyData[prizeType] ? mockData.luckyData[prizeType].length : 0;
    if (luckyCount < basicData.prizes[prizeIndex].count) {
      // 这一轮还没抽完
      currentPrizeIndex = prizeIndex;
      currentPrize = basicData.prizes[currentPrizeIndex];
      break;
    }
  }

  // 如果所有轮次都抽完了
  if (prizeIndex >= basicData.prizes.length) {
    currentPrizeIndex = 0; // 显示"抽奖结束"
    currentPrize = basicData.prizes[0];
  }

  console.log("当前轮次索引:", currentPrizeIndex, "当前奖项:", currentPrize);
  showPrizeList(currentPrizeIndex);
  let curLucks = basicData.luckyUsers[currentPrize.type];
  setPrizeData(currentPrizeIndex, curLucks ? curLucks.length : 0, true);

  //setuser
  basicData.users = mockData.user

  localStorage.setItem("allUser", JSON.stringify(basicData.leftUsers))

  initCards();
  // startMaoPao();
  animate();
  shineCard();

}

function initCards() {
  let member = basicData.users,
    showCards = [],
    length = member.length;

  let isBold = false,
    showTable = basicData.leftUsers.length === basicData.users.length,
    index = 0,
    totalMember = member.length,
    position = {
      x: (140 * COLUMN_COUNT - 20) / 2,
      y: (180 * ROW_COUNT - 20) / 2
    };

  camera = new THREE.PerspectiveCamera(
    45,
    mockData.width / mockData.height,
    1,
    10000
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (let i = 0; i < ROW_COUNT; i++) {
    for (let j = 0; j < COLUMN_COUNT; j++) {
      isBold = HIGHLIGHT_CELL.includes(j + "-" + i);
      var element = createCard(
        member[index % length],
        isBold,
        index,
        showTable
      );

      var object = new THREE.CSS3DObject(element);
      object.position.x = Math.random() * 4000 - 2000;
      object.position.y = Math.random() * 4000 - 2000;
      object.position.z = Math.random() * 4000 - 2000;

      scene.add(object);
      threeDCards.push(object);
      //

      var object = new THREE.Object3D();
      object.position.x = j * 140 - position.x;
      object.position.y = -(i * 180) + position.y;
      targets.table.push(object);
      index++;
    }
  }

  // sphere

  var vector = new THREE.Vector3();

  for (var i = 0, l = threeDCards.length; i < l; i++) {
    var phi = Math.acos(-1 + (2 * i) / l);
    var theta = Math.sqrt(l * Math.PI) * phi;
    var object = new THREE.Object3D();
    object.position.setFromSphericalCoords(800 * Resolution, phi, theta);
    vector.copy(object.position).multiplyScalar(2);
    object.lookAt(vector);
    targets.sphere.push(object);
  }

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(mockData.width, mockData.height);
  document.getElementById("container").appendChild(renderer.domElement);

  //

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  bindEvent();

  if (showTable) {
    switchScreen("enter");
  } else {
    switchScreen("lottery");
  }
}


function setLotteryStatus(status = false) {
  isLotting = status;
}

/**
 * 事件绑定
 */
// function bindEvent() {
//   document.querySelector("#menu").addEventListener("click", function (e) {
//     e.stopPropagation();
//     // 如果正在抽奖，则禁止一切操作
//     if (isLotting) {
//       addQipao("抽慢一点点～～");
//       return false;
//     }

//     let target = e.target.id;
//     switch (target) {
//       // 显示数字墙
//       case "welcome":
//         switchScreen("enter");
//         rotate = false;
//         break;
//       // 进入抽奖
//       case "enter":
//         removeHighlight();
//         addQipao(`马上抽取[${currentPrize.title}],不要走开。`);
//         // rotate = !rotate;
//         rotate = true;
//         switchScreen("lottery");
//         break;
//       // 重置
//       case "reset":
//         let doREset = window.confirm(
//           "是否确认重置数据，重置后，当前已抽的奖项全部清空？"
//         );
//         if (!doREset) {
//           return;
//         }
//         addQipao("重置所有数据，重新抽奖");
//         addHighlight();
//         resetCard();
//         // 重置所有数据
//         currentLuckys = [];
//         basicData.leftUsers = Object.assign([], basicData.users);
//         basicData.luckyUsers = {};
//         currentPrizeIndex = basicData.prizes.length - 1;
//         currentPrize = basicData.prizes[currentPrizeIndex];

//         resetPrize(currentPrizeIndex);
//         reset();
//         switchScreen("enter");
//         break;
//       // 抽奖
//       case "lottery":
//         //更新状态
//         setLotteryStatus(true);
//         // 每次抽奖前先保存上一次的抽奖数据
//         saveData();
//         //更新剩余抽奖数目的数据显示
//         changePrize();
//         resetCard().then(res => {
//           // 抽奖
//           lottery();
//         });
//         addQipao(`正在抽取[${currentPrize.title}],调整好姿势`);
//         break;
//       // 重新抽奖
//       case "reLottery":
//         if (currentLuckys.length === 0) {
//           addQipao(`当前还没有抽奖，无法重新抽取喔~~`);
//           return;
//         }
//         setErrorData(currentLuckys);
//         addQipao(`重新抽取[${currentPrize.title}],做好准备`);
//         setLotteryStatus(true);
//         // 重新抽奖则直接进行抽取，不对上一次的抽奖数据进行保存
//         // 抽奖
//         resetCard().then(res => {
//           // 抽奖
//           lottery();
//         });
//         break;
//       // 导出抽奖结果
//       case "save":
//         saveData().then(res => {
//           resetCard().then(res => {
//             // 将之前的记录置空
//             currentLuckys = [];
//           });
//           exportData();
//           addQipao(`数据已保存到EXCEL中。`);
//         });
//         break;
//     }
//   });

//   window.addEventListener("resize", onWindowResize, false);
// }
/**
 * 事件绑定
 */

function bindEvent() {
  document.querySelector("#menu").addEventListener("click", function (e) {
    e.stopPropagation();
    // 如果正在抽奖，则禁止一切操作'
    let target = e.target.id;

    if (!['reset', 'back'].includes(target)) {
      if (isLotting) {
        addQipao("抽慢一点点～～抽奖还没结束");
        return false;
      }
      let perCount = EACH_COUNT[currentPrizeIndex],
        leftCount = basicData.leftUsers.length
      const notAllowed = perCount > leftCount

      if (notAllowed) {
        addQipao("池中已经没有人拉,请重置抽奖人员池");
        return false;
      }

      //骇客
      console.log(currentPrize);


    }



    switch (target) {
      // 显示数字墙
      case "welcome":
        switchScreen("enter");
        rotate = false;
        break;
      //返回首页
      case "back":

        switchScreen("enter");

        rotate = false;
        break;
      // 进入抽奖
      case "awards":
        replaceMusic(currentPrize.awards)

        break;
      case "enter":
        removeHighlight();
        addQipao(`马上抽取[${currentPrize.title}],不要走开。`);
        // rotate = !rotate;
        rotate = true;
        switchScreen("lottery");
        break;
      // 重置
      case "reset":
        let doREset = window.confirm(
          "是否确认重置数据，重置后，当前已抽的奖项全部清空？"
        );
        if (!doREset) {
          return;
        }
        addQipao("重置所有数据，重新抽奖");
        addHighlight();
        resetCard();
        // 重置所有数据
        currentLuckys = [];
        basicData.leftUsers = Object.assign([], basicData.users);
        basicData.luckyUsers = {};
        currentPrizeIndex = basicData.prizes.length - 1;
        currentPrize = basicData.prizes[currentPrizeIndex];

        resetPrize(currentPrizeIndex);
        resetMock();
        switchScreen("enter");
        break;
      // 抽奖
      case "lottery":

        //更新状态
        setLotteryStatus(true);
        // 每次抽奖前先保存上一次的抽奖数据
        // saveData();
        //feat@把保存移除到roll点以后执行 
        saveMock()
        //feat@是否还有礼物
        if (!currentPrizeIndex) {
          addQipao(`没有可以抽取的奖品了`);

          let doREset = window.confirm(
            "礼物已经抽完,是否重置礼物？"
          );
          if (!doREset) {
            return;
          } else {
            document.getElementById("reset").click()
          }


          return
        }
        replaceMusic(currentPrize.enter)
        mockData.setSecret(currentPrize, basicData)
        //更新剩余抽奖数目的数据显示
        changePrize();
        resetCard().then(res => {
          // 抽奖
          lottery();
        })
        addQipao(`正在抽取[${currentPrize.title}],调整好姿势`);
        break;
      // 重新抽奖
      case "reLottery":
        if (currentLuckys.length === 0) {
          addQipao(`当前还没有抽奖，无法重新抽取喔~~`);
          return;
        }
        // setErrorData(currentLuckys);
        addQipao(`重新抽取[${currentPrize.title}],做好准备`);
        setLotteryStatus(true);
        // 重新抽奖则直接进行抽取，不对上一次的抽奖数据进行保存
        // 抽奖
        resetCard().then(res => {
          // 抽奖
          lottery();
        });
        break;
      // 导出抽奖结果
      case "save":
        saveMock().then(res => {
          resetCard().then(res => {
            // 将之前的记录置空
            currentLuckys = [];
          });
          exportData();
          addQipao(`数据已保存到EXCEL中。`);
        });
        break;

      case "result":
        saveMock().then(res => {
          resetCard().then(res => {
            // 将之前的记录置空
            currentLuckys = [];
          });
        });
        // layer.open({
        //   type: 1, 
        //   content: '<div></div>' //这里content是一个普通的String
        // });

        break;

    }
  });

  window.addEventListener("resize", onWindowResize, false);
}

//场景转换
function switchScreen(type) {
  switch (type) {
    case "enter":
      btns.enter.classList.remove("none");
      btns.lotteryBar.classList.add("none");
      transform(targets.table, 2000);
      break;
    default:
      btns.enter.classList.add("none");
      btns.lotteryBar.classList.remove("none");
      transform(targets.sphere, 2000);
      break;
  }
}

/**
 * 创建元素
 */
function createElement(css, text) {
  let dom = document.createElement("div");
  dom.className = css || "";
  dom.innerHTML = text || "";
  return dom;
}

/**
 * 创建名牌
 */
function createCard(user, isBold, id, showTable) {
  var element = createElement();
  element.id = "card-" + id;

  if (isBold) {
    element.className = "element lightitem";

    if (showTable) {
      element.classList.add("highlight");
    }
    //feat@刷新后不显示默认背景色
    element.style.backgroundColor = mockData.atmosphereGroupCard()
  } else {
    element.className = "element";
    element.style.backgroundColor = mockData.atmosphereGroupCard()

  }
  //添加公司标识
  COMPANY && element.appendChild(createElement("company", COMPANY));

  element.appendChild(createElement("name", user[1]));

  // element.appendChild(createElement("details", user[0] + "<br/>" + user[2]));
  return element;
}

function removeHighlight() {
  document.querySelectorAll(".highlight").forEach(node => {
    node.classList.remove("highlight");
  });
}

function addHighlight() {
  document.querySelectorAll(".lightitem").forEach(node => {
    node.classList.add("highlight");
  });
}

/**
 * 渲染地球等
 */
function transform(targets, duration) {
  // TWEEN.removeAll();
  for (var i = 0; i < threeDCards.length; i++) {
    var object = threeDCards[i];
    var target = targets[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    // new TWEEN.Tween(object.rotation)
    //     .to({
    //         x: target.rotation.x,
    //         y: target.rotation.y,
    //         z: target.rotation.z
    //     }, Math.random() * duration + duration)
    //     .easing(TWEEN.Easing.Exponential.InOut)
    //     .start();
  }

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}

//旋转地球
function rotateBall() {
  return new Promise((resolve, reject) => {
    console.log(Math.PI);
    scene.rotation.y = 0;
    new TWEEN.Tween(scene.rotation)
      .to(
        {
          y: Math.PI * (currentPrize && currentPrize.circle || 8)
        },
        currentPrize && currentPrize.ROTATE_TIME || ROTATE_TIME
      )
      .onUpdate(render)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
      .onComplete(() => {
        resolve();
      });
  });
}

function onWindowResize() {
  camera.aspect = mockData.width / mockData.height;
  camera.updateProjectionMatrix();
  renderer.setSize(mockData.width, mockData.height);
  render();
}

function animate() {
  // 让场景通过x轴或者y轴旋转
  // rotate && (scene.rotation.y += 0.088);

  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();

  // 渲染循环
  // render();
}

function render() {
  renderer.render(scene, camera);
}

function selectCard(duration = 600) {
  rotate = false;
  let width = 140,
    tag = -(currentLuckys.length - 1) / 2,
    locates = [];

  // 计算位置信息, 大于5个分两排显示
  if (currentLuckys.length > 5) {
    let yPosition = [-87, 87],
      l = selectedCardIndex.length,
      mid = Math.ceil(l / 2);
    tag = -(mid - 1) / 2;
    for (let i = 0; i < mid; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[0] * Resolution
      });
      tag++;
    }

    tag = -(l - mid - 1) / 2;
    for (let i = mid; i < l; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[1] * Resolution
      });
      tag++;
    }
  } else {
    for (let i = selectedCardIndex.length; i > 0; i--) {
      locates.push({
        x: tag * width * Resolution,
        y: 0 * Resolution
      });
      tag++;
    }
  }

  // 显示每个人获得的具体奖品
  let prizeMessages = currentLuckys.map((item, index) => {
    let prizeName = currentWonPrizes[index] || "神秘礼品";
    return `${item[1]}获得【${prizeName}】`;
  });
  addQipao(
    `🎉恭喜！${prizeMessages.join("，")}，新的一年必定旺旺旺！`
  );

  selectedCardIndex.forEach((cardIndex, index) => {
    let prizeName = currentWonPrizes[index] || "神秘礼品";
    changeCard(cardIndex, currentLuckys[index], prizeName);
    var object = threeDCards[cardIndex];
    new TWEEN.Tween(object.position)
      .to(
        {
          x: locates[index].x,
          y: locates[index].y * Resolution,
          z: 2200
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    object.element.classList.add("prize");
    tag++;
  });

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
    .onComplete(() => {
      // 动画结束后可以操作
      setLotteryStatus();
    });
}

/**
 * 重置抽奖牌内容
 */
function resetCard(duration = 500) {
  if (currentLuckys.length === 0) {
    return Promise.resolve();
  }

  selectedCardIndex.forEach(index => {
    let object = threeDCards[index],
      target = targets.sphere[index];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  });

  return new Promise((resolve, reject) => {
    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .onUpdate(render)
      .start()
      .onComplete(() => {
        selectedCardIndex.forEach(index => {
          let object = threeDCards[index];
          object.element.classList.remove("prize");
        });
        resolve();
      });
  });
}

/**
 * 抽奖
 */
function lottery() {

  rotateBall().then(() => {
    // 将之前的记录置空
    currentLuckys = [];
    currentWonPrizes = [];
    selectedCardIndex = [];
    // 当前同时抽取的数目,当前奖品抽完还可以继续抽，但是不记录数据
    let perCount = EACH_COUNT[currentPrizeIndex],
      luckyData = basicData.luckyUsers[currentPrize.type],
      leftCount = basicData.leftUsers.length,
      leftPrizeCount = currentPrize.count - (luckyData ? luckyData.length : 0);
    const cloneLeftUsers = JSON.parse(JSON.stringify(basicData.leftUsers))

    // 获取当前轮次的剩余奖品
    let roundType = currentPrize.type;
    let leftPrizes = mockData.getLeftPrizesForRound(roundType);

    if (leftCount === 0) {
      addQipao("人员已抽完，现在重新设置所有人员可以进行二次抽奖！");
      basicData.leftUsers = basicData.users;
      leftCount = basicData.leftUsers.length;
    }

    currentLuckys = lotteryRan(leftCount, perCount).map(index => {
      return cloneLeftUsers[index]
    })

    // 从当前轮次的奖品池中随机抽取奖品
    for (let i = 0; i < perCount && leftPrizes.length > 0; i++) {
      let prizeIndex = random(leftPrizes.length);
      let wonPrize = leftPrizes.splice(prizeIndex, 1)[0];
      currentWonPrizes.push(wonPrize);
    }

    // 保存当前轮次剩余奖品
    mockData.saveLeftPrizesForRound(roundType, leftPrizes);

    console.log("中奖人员:", currentLuckys);
    console.log("中奖奖品:", currentWonPrizes);

    for (let i = 0; i < perCount; i++) {

      // let luckyId = random(leftCount);

      //feat@原写法重新抽奖会排除池子里的人
      // currentLuckys.push(cloneLeftUsers.splice(luckyId, 1)[0]);
      // console.log(luckyId);
      // console.error(basicData.leftUsers[luckyId],basicData.leftUsers,luckyId);
      // currentLuckys.push(basicData.leftUsers[luckyId]);

      leftCount--;
      leftPrizeCount--;

      let cardIndex = random(TOTAL_CARDS);
      while (selectedCardIndex.includes(cardIndex)) {
        cardIndex = random(TOTAL_CARDS);
      }
      selectedCardIndex.push(cardIndex);

      if (leftPrizeCount === 0) {
        break;
      }
    }

    // console.log(currentLuckys);
    selectCard();
  });
}

function lotteryRan(number, time) {
  var arr = [];
  let Random
  for (var i = 0; i < time; i++) {
    Random = Math.floor(Math.random() * number);
    if (arr.includes(Random)) {
      i--
    } else {
      arr.push(Random)
    }
  }
  console.log(arr);
  //  function Ran(){
  //           do{
  //              Random=Math.floor(Math.random()*number);
  //           } while(arr.indexOf(Random)!=-1)
  //           arr.push(Random);
  //  }
  return arr


}
// lotteryRa(30,5)


/**
 * @description: mock数据保存
 * @param {*}
 * @return {*}
 * @Date: 2022-01-11 16:02:49
 */
function saveMock() {
  if (!currentPrize) {
    //若奖品抽完，则不再记录数据，但是还是可以进行抽奖
    return;
  }
  //当前选中奖品类型
  let type = currentPrize.type,
    //幸运用户建立池子
    curLucky = basicData.luckyUsers[type] || [];
  //幸运用户入池
  curLucky = curLucky.concat(currentLuckys);
  // 上述合并
  basicData.luckyUsers[type] = curLucky;

  //feat@把roll点的人员池子功能迁移到此处
  console.log(curLucky.map(item => item[0]), "幸运用户");
  basicData.leftUsers = basicData.leftUsers.filter(human => !curLucky.map(item => item[0]).includes(human[0]))

  //奖品数小于等于幸运用户数,这一轮抽满了
  if (currentPrize.count <= curLucky.length) {
    //进入下一轮
    currentPrizeIndex++;
    //超过最后一轮则回到0（抽奖结束）
    if (currentPrizeIndex >= basicData.prizes.length) {
      currentPrizeIndex = 0;
    }
    //选择奖品更新为下一轮
    currentPrize = basicData.prizes[currentPrizeIndex];


  }

  //有幸运人数
  if (currentLuckys.length > 0) {
    // todo by xc 添加数据保存机制，以免服务器挂掉数据丢失
    return setLuckyStore(type, currentLuckys, currentPrizeIndex);
  }

  // console.error(basicData);
  return Promise.resolve();


}
/**
 * 保存上一次的抽奖结果
 */
function saveData() {
  if (!currentPrize) {
    //若奖品抽完，则不再记录数据，但是还是可以进行抽奖
    return;
  }

  let type = currentPrize.type,
    curLucky = basicData.luckyUsers[type] || [];

  curLucky = curLucky.concat(currentLuckys);

  basicData.luckyUsers[type] = curLucky;

  if (currentPrize.count <= curLucky.length) {
    currentPrizeIndex--;

    if (currentPrizeIndex <= -1) {
      currentPrizeIndex = 0;
    }
    currentPrize = basicData.prizes[currentPrizeIndex];
  }

  if (currentLuckys.length > 0) {
    // todo by xc 添加数据保存机制，以免服务器挂掉数据丢失
    return
  }
  return Promise.resolve();
}
/**
 * @description: 方法说明....
 * @param {*} type 中奖产品编号
 * @param {*} currentLuckys
 * @return {*}
 * @Date: 2022-01-11 18:29:47
 */
function setLuckyStore(type, currentLuckys, PrizeIndex) {

  //中奖商品对应人记录
  // console.log(mockData.luckyData,basicData.luckyUsers);
  // console.log(Object.keys(mockData.luckyData).includes(type+""),"长度");
  // mockData.luckyData[type]=[...mockData.luckyData[type],...currentLuckys]
  // console.log( mockData.luckyData);
  const luckyData = JSON.stringify(basicData.luckyUsers)
  localStorage.setItem("luckyData", luckyData)
  //leftuser 用户抽奖池
  // const idList=currentLuckys.map(item=>item[0])
  // mockData.leftUsers=mockData.leftUsers.filter(item=>{
  //   return  !idList.includes(item[0])
  // })
  // console.log(mockData.leftUsers,basicData.leftUsers);
  const leftUsers = JSON.stringify(basicData.leftUsers)
  localStorage.setItem("leftUsers", leftUsers)

  // 保存中奖人员和对应奖品的映射
  let wonPrizes = JSON.parse(localStorage.getItem("wonPrizes")) || {};
  if (!wonPrizes[type]) {
    wonPrizes[type] = [];
  }
  currentLuckys.forEach((user, index) => {
    wonPrizes[type].push({
      user: user,
      prize: currentWonPrizes[index] || "神秘礼品"
    });
  });
  localStorage.setItem("wonPrizes", JSON.stringify(wonPrizes));

}

function changePrize() {
  let luckys = basicData.luckyUsers[currentPrize.type];
  let luckyCount = (luckys ? luckys.length : 0) + EACH_COUNT[currentPrizeIndex];
  // 修改左侧prize的数目和百分比
  setPrizeData(currentPrizeIndex, luckyCount);
}

/**
 * 随机抽奖
 */
function random(num) {
  // Math.floor取到0-num-1之间数字的概率是相等的
  return Math.floor(Math.random() * num);
}

/**
 * 切换名牌人员信息
 */
// function changeCard(cardIndex, user) {
//   let card = threeDCards[cardIndex].element;

//   card.innerHTML = `<div class="company">${COMPANY}</div><div class="name">${
//     user[1]
//   }</div><div class="details">${user[0]}<br/>${user[2] || "PSST"}</div>`;
// }
function changeCard(cardIndex, user, prize) {
  let card = threeDCards[cardIndex].element;
  const nameDom = `<div class="name">${user[1]}</div>`;
  const companyDom = `<div class="company">${COMPANY}</div>`;
  const prizeDom = prize ? `<div class="prize-name">${prize}</div>` : '';
  card.innerHTML = nameDom + (COMPANY ? companyDom : '') + prizeDom;
}

/**
 * 切换名牌背景
 */
function shine(cardIndex, color) {
  let card = threeDCards[cardIndex].element;
  card.style.backgroundColor =
    color || mockData.atmosphereGroupCard();
}

/**
 * 随机切换背景和人员信息
 */
function shineCard() {
  let maxCard = 10,
    maxUser;
  let shineCard = 10 + random(maxCard);

  setInterval(() => {
    // 正在抽奖停止闪烁
    if (isLotting) {
      return;
    }
    maxUser = basicData.leftUsers.length;
    for (let i = 0; i < shineCard; i++) {
      let index = random(maxUser),
        cardIndex = random(TOTAL_CARDS);
      // 当前显示的已抽中名单不进行随机切换
      if (selectedCardIndex.includes(cardIndex)) {
        continue;
      }
      shine(cardIndex);
      changeCard(cardIndex, basicData.leftUsers[index]);
    }
  }, 500);
}

function setData(type, data) {
  return new Promise((resolve, reject) => {
    window.AJAX({
      url: "/saveData",
      data: {
        type,
        data
      },
      success() {
        resolve();
      },
      error() {
        reject();
      }
    });
  });
}

function setErrorData(data) {
  return new Promise((resolve, reject) => {
    window.AJAX({
      url: "/errorData",
      data: {
        data
      },
      success() {
        resolve();
      },
      error() {
        reject();
      }
    });
  });
}

function exportData() {
  window.AJAX({
    url: "/export",
    success(data) {
      if (data.type === "success") {
        location.href = data.url;
      }
    }
  });
}

function reset() {
  window.AJAX({
    url: "/reset",
    success(data) {
      console.log("重置成功");
    }
  });
}
function resetMock() {
  localStorage.clear();
  location.reload()
  // initAll()


}

function createHighlight() {
  let year = new Date().getFullYear() + "";
  let step = 4,
    xoffset = 1,
    yoffset = 1,
    highlight = [];

  year.split("").forEach(n => {
    highlight = highlight.concat(
      NUMBER_MATRIX[n].map(item => {
        return `${item[0] + xoffset}-${item[1] + yoffset}`;
      })
    );
    xoffset += step;
  });

  return highlight;
}
/**
 * @description: 替换音乐
 * @param {*} scenes 场景值对应音乐名
 * @return {*}
 * @Date: 2022-01-19 14:46:05
 */
function replaceMusic(scenes) {
  if (nowScenes == scenes) return
  let music = document.querySelector("#music");
  music.src = `./data/${scenes}.m4a`
  musicBox.click()
  nowScenes = scenes

}

let onload = window.onload;

window.onload = function () {
  onload && onload();

  let music = document.querySelector("#music");
  console.log(music);
  let rotated = 0,
    stopAnimate = false,
    musicBox = document.querySelector("#musicBox");

  function animate() {
    requestAnimationFrame(function () {
      if (stopAnimate) {
        return;
      }
      rotated = rotated % 360;
      musicBox.style.transform = "rotate(" + rotated + "deg)";
      rotated += 1;
      animate();
    });
  }

  musicBox.addEventListener(
    "click",
    function (e) {
      if (music.paused) {
        music.play().then(
          () => {
            stopAnimate = false;
            animate();
          },
          () => {
            addQipao("背景音乐自动播放失败，请手动播放！");
          }
        );
      } else {
        music.pause();
        stopAnimate = true;
      }
    },
    false
  );

  setTimeout(function () {

    replaceMusic("enter-BGM")
    // musicBox.click();
  }, 2000);
};
