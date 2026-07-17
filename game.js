"use strict";

const SAVE_KEY = "wenxia_save_v1";

const defaultState = {
  playerName: "無名",
  currentScene: "prologue",
  stats: {
    meaning: 0,
    reasoning: 0,
    virtue: 0,
    knowledge: 0
  },
  visitedScenes: [],
  completed: false
};

let gameState = structuredClone(defaultState);

const scenes = {
  prologue: {
    chapter: "第一章",
    title: "和氏璧現世",
    progress: "序章",
    location: "趙國書院",
    speaker: "旁白",
    text:
      "戰國之世，七雄並立。趙惠文王得楚國和氏璧。消息傳至秦國，秦王派使者前來，聲稱願以十五座城交換寶璧。\n\n你名為「{playerName}」，只是書院中一名尚未受人重視的弟子。",
    choices: [
      {
        text: "先到藏書閣查閱秦、趙形勢",
        next: "library",
        effects: {
          meaning: 1,
          knowledge: 1
        }
      },
      {
        text: "前往大殿，直接旁聽群臣議事",
        next: "court",
        effects: {
          reasoning: 1
        }
      },
      {
        text: "此事與我無關，先完成自己的雜務",
        next: "chores",
        effects: {
          virtue: -1
        }
      }
    ]
  },

  library: {
    chapter: "第一章",
    title: "秦強趙弱",
    progress: "修習一",
    location: "書院藏經閣",
    speaker: "掌院先生",
    text:
      "秦國勢強，趙國勢弱。若把璧交給秦國，秦國可能取得寶璧而不交出城池；若拒絕，秦國又可能藉故攻趙。\n\n先生問：「這種進退兩難的形勢，應如何概括？」",
    choices: [
      {
        text: "予璧，秦城恐不可得；不予，則恐秦兵之來",
        next: "libraryCorrect",
        effects: {
          meaning: 2,
          reasoning: 1,
          knowledge: 1
        },
        feedback: {
          title: "文義領悟",
          text:
            "你掌握了事件的核心矛盾：交出和氏璧，可能得不到城；不交出，又擔心秦國出兵。"
        }
      },
      {
        text: "趙國既有和氏璧，秦國必然不敢進攻",
        next: "libraryWrong",
        effects: {
          meaning: -1
        },
        feedback: {
          title: "需要再想",
          text:
            "和氏璧是珍寶，卻不能消除秦、趙之間的實力差距。判斷人物行動時，需要先理解政治形勢。"
        }
      }
    ]
  },

  libraryCorrect: {
    chapter: "第一章",
    title: "秦強趙弱",
    progress: "修習完成",
    location: "書院藏經閣",
    speaker: "掌院先生",
    text:
      "先生微微頷首：「能看見兩種選擇各自的風險，才算真正理解局勢。現在到趙王大殿去吧。」",
    choices: [
      {
        text: "前往趙王大殿",
        next: "court"
      }
    ]
  },

  libraryWrong: {
    chapter: "第一章",
    title: "秦強趙弱",
    progress: "重新思考",
    location: "書院藏經閣",
    speaker: "掌院先生",
    text:
      "先生搖頭：「珍寶不能代替國力。你必須分清事件的表面與根本。」",
    choices: [
      {
        text: "重新分析秦、趙形勢",
        next: "library"
      },
      {
        text: "帶着疑問前往大殿",
        next: "court"
      }
    ]
  },

  chores: {
    chapter: "第一章",
    title: "無名之輩",
    progress: "支線事件",
    location: "書院後院",
    speaker: "老僕",
    text:
      "老僕看着你掃地，低聲道：「國家有難，身份低微便可以置身事外嗎？」\n\n遠處鐘聲響起，趙王正在召集群臣。",
    choices: [
      {
        text: "放下掃帚，趕往大殿",
        next: "court",
        effects: {
          virtue: 1
        }
      },
      {
        text: "完成職責後再去",
        next: "lateCourt",
        effects: {
          virtue: 1,
          reasoning: -1
        }
      }
    ]
  },

  lateCourt: {
    chapter: "第一章",
    title: "廷議已開",
    progress: "大殿議事",
    location: "趙王大殿",
    speaker: "旁白",
    text:
      "你趕到大殿時，群臣已爭論多時。有人主張獻璧，有人主張拒秦，卻沒有人能保證趙國安然無事。",
    choices: [
      {
        text: "靜聽眾人意見",
        next: "courtQuestion"
      }
    ]
  },

  court: {
    chapter: "第一章",
    title: "廷議風雲",
    progress: "大殿議事",
    location: "趙王大殿",
    speaker: "趙王",
    text:
      "「秦王欲以十五城換取和氏璧。諸位以為，此璧當予，還是不予？」\n\n大殿中議論紛紛。你發現，問題不只是『給』或『不給』，而是誰能出使秦國，既保全國體，又能隨機應變。",
    choices: [
      {
        text: "關鍵是找到能夠回覆秦國的使者",
        next: "courtQuestion",
        effects: {
          reasoning: 1
        }
      },
      {
        text: "只要把和氏璧藏起來便可",
        next: "courtQuestion",
        effects: {
          reasoning: -1
        },
        feedback: {
          title: "局勢判斷",
          text:
            "藏起寶璧不能回應秦國要求，也可能令秦國找到出兵藉口。外交問題需要外交策略。"
        }
      }
    ]
  },

  courtQuestion: {
    chapter: "第一章",
    title: "何人可使",
    progress: "文義考驗",
    location: "趙王大殿",
    speaker: "宦者令繆賢",
    text:
      "繆賢說，他的門客藺相如可以出使秦國。\n\n原文以「求人可使報秦者」表達趙王尋找使者。這句話最合理的現代語譯是甚麼？",
    choices: [
      {
        text: "尋找一個可以出使並答覆秦國的人",
        next: "recommendation",
        effects: {
          meaning: 2,
          knowledge: 1
        },
        feedback: {
          title: "答對了",
          text:
            "「求人可使報秦者」可理解為：尋找一個可以出使、回覆秦國的人。「者」指符合前面條件的人。"
        }
      },
      {
        text: "要求秦國派遣使者回覆趙國",
        next: "questionRetry",
        effects: {
          meaning: -1
        },
        feedback: {
          title: "語譯錯誤",
          text:
            "句中的尋找者是趙王；「可使報秦」修飾「人」，不是要求秦國派遣使者。"
        }
      },
      {
        text: "找人把秦國使者趕回去",
        next: "questionRetry",
        effects: {
          meaning: -1
        },
        feedback: {
          title: "字詞辨析",
          text:
            "這裏的「報」是回覆、答覆，不是報復，也不是趕走對方。"
        }
      }
    ]
  },

  questionRetry: {
    chapter: "第一章",
    title: "倒裝之句",
    progress: "文義重溫",
    location: "趙王大殿",
    speaker: "書院先生",
    text:
      "先生在你耳邊低聲提醒：「先找句子的中心詞，再看其他部分修飾誰。這句的中心是『求人』。」",
    choices: [
      {
        text: "再次回答",
        next: "courtQuestion"
      }
    ]
  },

  recommendation: {
    chapter: "第一章",
    title: "布衣藺相如",
    progress: "人物登場",
    location: "趙王大殿",
    speaker: "藺相如",
    text:
      "一名衣着樸素的門客步入殿中。他沒有顯赫出身，面對趙王和群臣卻毫無畏色。\n\n藺相如說，若秦國交出城池，和氏璧便留在秦國；若秦國不交城池，他必使和氏璧完整回到趙國。",
    choices: [
      {
        text: "請求成為藺相如的隨行文書",
        next: "endingGood",
        requirement: {
          stat: "reasoning",
          value: 1,
          label: "需要明辨 1"
        },
        effects: {
          virtue: 1
        }
      },
      {
        text: "先記錄藺相如的計策，再作決定",
        next: "endingNormal",
        effects: {
          knowledge: 1
        }
      }
    ]
  },

  endingGood: {
    chapter: "第一章",
    title: "使秦之路",
    progress: "序章完成",
    location: "趙國城門",
    speaker: "藺相如",
    text:
      "藺相如看了你一眼：「出使秦國，靠的不是匹夫之勇。要明白形勢，也要守住趙國的尊嚴。」\n\n你隨使團踏出城門。前方，是強秦的咸陽宮，也是第一次真正的考驗。",
    completed: true,
    choices: [
      {
        text: "查看本章學習成果",
        action: "showReport"
      },
      {
        text: "返回開始畫面",
        action: "returnTitle"
      }
    ]
  },

  endingNormal: {
    chapter: "第一章",
    title: "留守趙國",
    progress: "序章完成",
    location: "趙國書院",
    speaker: "掌院先生",
    text:
      "你沒有隨使團前往秦國，卻把朝堂上的每一句話記錄下來。先生告訴你：「記錄只是第一步，還要理解人物為何這樣說、這樣做。」",
    completed: true,
    choices: [
      {
        text: "查看本章學習成果",
        action: "showReport"
      },
      {
        text: "重新挑戰序章",
        action: "restart"
      }
    ]
  }
};

const elements = {
  titleScreen: document.querySelector("#title-screen"),
  gameScreen: document.querySelector("#game-screen"),
  playerNameInput: document.querySelector("#player-name"),
  playerNameDisplay: document.querySelector("#player-name-display"),
  newGameButton: document.querySelector("#new-game-button"),
  continueButton: document.querySelector("#continue-button"),
  saveButton: document.querySelector("#save-button"),
  restartButton: document.querySelector("#restart-button"),
  saveMessage: document.querySelector("#save-message"),

  chapterTitle: document.querySelector("#chapter-title"),
  sceneLocation: document.querySelector("#scene-location"),
  speakerName: document.querySelector("#speaker-name"),
  dialogueText: document.querySelector("#dialogue-text"),
  choicesContainer: document.querySelector("#choices-container"),
  progressText: document.querySelector("#progress-text"),
  autosaveText: document.querySelector("#autosave-text"),

  meaning: document.querySelector("#stat-meaning"),
  reasoning: document.querySelector("#stat-reasoning"),
  virtue: document.querySelector("#stat-virtue"),
  knowledge: document.querySelector("#stat-knowledge"),

  feedbackBox: document.querySelector("#feedback-box"),
  feedbackTitle: document.querySelector("#feedback-title"),
  feedbackText: document.querySelector("#feedback-text")
};

function cloneDefaultState() {
  return structuredClone(defaultState);
}

function formatText(text) {
  return text.replaceAll("{playerName}", gameState.playerName);
}

function switchScreen(screenName) {
  elements.titleScreen.classList.toggle(
    "active",
    screenName === "title"
  );

  elements.gameScreen.classList.toggle(
    "active",
    screenName === "game"
  );
}

function updateStats() {
  elements.playerNameDisplay.textContent = gameState.playerName;
  elements.meaning.textContent = gameState.stats.meaning;
  elements.reasoning.textContent = gameState.stats.reasoning;
  elements.virtue.textContent = gameState.stats.virtue;
  elements.knowledge.textContent = gameState.stats.knowledge;
}

function hideFeedback() {
  elements.feedbackBox.classList.add("hidden");
  elements.feedbackTitle.textContent = "";
  elements.feedbackText.textContent = "";
}

function showFeedback(feedback) {
  if (!feedback) {
    hideFeedback();
    return;
  }

  elements.feedbackTitle.textContent = feedback.title;
  elements.feedbackText.textContent = feedback.text;
  elements.feedbackBox.classList.remove("hidden");
}

function checkRequirement(requirement) {
  if (!requirement) {
    return true;
  }

  return gameState.stats[requirement.stat] >= requirement.value;
}

function applyEffects(effects = {}) {
  for (const [stat, amount] of Object.entries(effects)) {
    if (stat in gameState.stats) {
      gameState.stats[stat] += amount;
      gameState.stats[stat] = Math.max(
        0,
        gameState.stats[stat]
      );
    }
  }
}

function createChoiceButton(choice) {
  const button = document.createElement("button");
  const isAvailable = checkRequirement(choice.requirement);

  button.className = "choice-button";
  button.textContent = choice.text;
  button.disabled = !isAvailable;

  if (choice.requirement) {
    const requirementText = document.createElement("span");
    requirementText.className = "requirement-text";
    requirementText.textContent = isAvailable
      ? `已符合：${choice.requirement.label}`
      : choice.requirement.label;

    button.appendChild(requirementText);
  }

  button.addEventListener("click", () => {
    handleChoice(choice);
  });

  return button;
}

function renderScene(sceneId, feedback = null) {
  const scene = scenes[sceneId];

  if (!scene) {
    console.error(`找不到場景：${sceneId}`);
    return;
  }

  gameState.currentScene = sceneId;

  if (!gameState.visitedScenes.includes(sceneId)) {
    gameState.visitedScenes.push(sceneId);
  }

  if (scene.completed) {
    gameState.completed = true;
  }

  elements.chapterTitle.textContent = scene.title;
  elements.sceneLocation.textContent = scene.location;
  elements.speakerName.textContent = scene.speaker;
  elements.dialogueText.textContent = formatText(scene.text);
  elements.progressText.textContent = scene.progress;

  showFeedback(feedback);
  updateStats();

  elements.choicesContainer.replaceChildren();

  scene.choices.forEach((choice) => {
    elements.choicesContainer.appendChild(
      createChoiceButton(choice)
    );
  });

  saveGame(true);
}

function handleChoice(choice) {
  applyEffects(choice.effects);

  if (choice.action) {
    runAction(choice.action);
    return;
  }

  if (choice.next) {
    renderScene(choice.next, choice.feedback);
  }
}

function runAction(action) {
  const actions = {
    showReport,
    returnTitle,
    restart: restartGame
  };

  if (actions[action]) {
    actions[action]();
  }
}

function showReport() {
  const total =
    gameState.stats.meaning +
    gameState.stats.reasoning +
    gameState.stats.virtue +
    gameState.stats.knowledge;

  let rank = "初入文門";

  if (total >= 8) {
    rank = "明辨之士";
  } else if (total >= 5) {
    rank = "好學弟子";
  }

  elements.speakerName.textContent = "學習報告";

  elements.dialogueText.textContent =
    `${gameState.playerName}，你完成了序章。\n\n` +
    `文義：${gameState.stats.meaning}\n` +
    `明辨：${gameState.stats.reasoning}\n` +
    `德行：${gameState.stats.virtue}\n` +
    `學識：${gameState.stats.knowledge}\n\n` +
    `本章評級：${rank}\n\n` +
    "你已認識秦強趙弱的背景，並理解「求人可使報秦者」的基本句意。";

  elements.sceneLocation.textContent = "書院評鑑";
  elements.progressText.textContent = "學習報告";

  hideFeedback();
  elements.choicesContainer.replaceChildren();

  const replayButton = document.createElement("button");
  replayButton.className = "choice-button";
  replayButton.textContent = "重新挑戰";
  replayButton.addEventListener("click", restartGame);

  const titleButton = document.createElement("button");
  titleButton.className = "choice-button";
  titleButton.textContent = "返回開始畫面";
  titleButton.addEventListener("click", returnTitle);

  elements.choicesContainer.append(
    replayButton,
    titleButton
  );
}

function startNewGame() {
  const enteredName = elements.playerNameInput.value.trim();

  gameState = cloneDefaultState();
  gameState.playerName = enteredName || "無名";

  switchScreen("game");
  renderScene("prologue");
}

function saveGame(isAutoSave = false) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(gameState)
    );

    const time = new Date().toLocaleTimeString("zh-HK", {
      hour: "2-digit",
      minute: "2-digit"
    });

    elements.autosaveText.textContent =
      `${isAutoSave ? "自動儲存" : "已儲存"}：${time}`;

    elements.continueButton.disabled = false;
  } catch (error) {
    console.error("儲存失敗：", error);
    elements.autosaveText.textContent = "儲存失敗";
  }
}

function loadGame() {
  const savedData = localStorage.getItem(SAVE_KEY);

  if (!savedData) {
    elements.saveMessage.textContent = "暫時沒有存檔。";
    return;
  }

  try {
    const parsedData = JSON.parse(savedData);

    gameState = {
      ...cloneDefaultState(),
      ...parsedData,
      stats: {
        ...defaultState.stats,
        ...parsedData.stats
      }
    };

    switchScreen("game");
    renderScene(gameState.currentScene);
  } catch (error) {
    console.error("讀取存檔失敗：", error);
    elements.saveMessage.textContent = "存檔損壞，請開始新遊戲。";
  }
}

function restartGame() {
  const shouldRestart = window.confirm(
    "確定重新開始嗎？目前進度將會被清除。"
  );

  if (!shouldRestart) {
    return;
  }

  const currentName = gameState.playerName;

  localStorage.removeItem(SAVE_KEY);
  gameState = cloneDefaultState();
  gameState.playerName = currentName;

  switchScreen("game");
  renderScene("prologue");
}

function returnTitle() {
  switchScreen("title");
  elements.saveMessage.textContent = "遊戲進度已保留。";
  updateContinueButton();
}

function updateContinueButton() {
  const hasSave = Boolean(
    localStorage.getItem(SAVE_KEY)
  );

  elements.continueButton.disabled = !hasSave;
}

elements.newGameButton.addEventListener(
  "click",
  startNewGame
);

elements.continueButton.addEventListener(
  "click",
  loadGame
);

elements.saveButton.addEventListener(
  "click",
  () => saveGame(false)
);

elements.restartButton.addEventListener(
  "click",
  restartGame
);

elements.playerNameInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      startNewGame();
    }
  }
);

updateContinueButton();