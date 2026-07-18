"use strict";

/* =========================================================
   文俠傳：十二典章
   完整 game.js
   ========================================================= */

const SAVE_KEY = "wenxia_save_v10";

/* =========================================================
   初始遊戲狀態
   ========================================================= */

const defaultState = {
  playerName: "無名",
  currentScene: "academyArrival",

  stats: {
    meaning: 0,
    reasoning: 0,
    virtue: 0,
    knowledge: 0
  },

  academy: {
    day: 1,
    maxDays: 5,
    actionPoints: 1,
    maxActionPoints: 1,
    stress: 0,
    maxStress: 6,
    dailyActions: [],
    completed: false,
    lastFeedback: null,
    currentEvent: null,
    eventTriggeredToday: false,
    actionCounts: {
      translation: 0,
      strategy: 0,
      character: 0,
      quotation: 0,
      structure: 0,
      review: 0
    },
    wrongQuestionIds: [],
    completedGames: {},
    miniGame: null
  },

  mastery: {
    context: 0,
    syntax: 0,
    character: 0,
    evidence: 0
  },

  flags: {
    correctedReport: false,
    evidenceTraining: false,
    merchantInsight: false,
    copiedWrongText: false,
    correctedCopy: false,
    teacherGuidance: false
  },

  eventsSeen: [],
  eventHistory: [],
  failure: null,
  visitedScenes: [],
  completed: false
};

let gameState = cloneDefaultState();

/* =========================================================
   主線場景資料
   ========================================================= */

const scenes = {
  academyArrival: {
    chapter: "第一章",
    title: "無名入學",
    progress: "書院序章",
    location: "趙國文武書院",
    speaker: "掌院先生",
    text:
      "秦趙交惡，朝局日益緊張。趙國廣召能讀史、明理、善辯的年輕弟子，以備不時之需。\n\n" +
      "你名為「{playerName}」，出身平凡，既無顯赫家世，也未有驚人才學。掌院先生給你五日時間修習。五日後，你將接受朝廷徵召。",
    choices: [
      {
        text: "開始第一日修習",
        action: "openAcademy"
      }
    ]
  },

  academySummons: {
    chapter: "第一章",
    title: "朝廷徵召",
    progress: "養成完成",
    location: "書院正堂",
    speaker: "趙國使者",
    text:
      "第五日黃昏，一名趙國使者帶着王命來到書院。\n\n" +
      "秦王得知趙王擁有和氏璧，派人送來國書，聲稱願以十五城交換寶璧。趙王召集群臣，命書院選派弟子前往大殿聽候差遣。",
    choices: [
      {
        text: "整理所學，前往趙王大殿",
        next: "court"
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
      "「秦王欲以十五城換取和氏璧。諸位以為，此璧當予，還是不予？」\n\n" +
      "大殿中議論紛紛。你發現，問題不只是『給』或『不給』，而是如何避免趙國蒙受欺辱。",
    choices: [
      {
        text: "分析獻璧與拒秦的兩種風險",
        next: "courtAnalysis",
        requirement: {
          type: "mastery",
          key: "context",
          value: 1,
          label: "需要時局達到初識"
        },
        effects: {
          reasoning: 1
        }
      },
      {
        text: "主張暫不正面答覆，先將和氏璧移往安全之處",
        next: "courtPoorChoice",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "先靜聽群臣意見",
        next: "courtQuestion"
      }
    ]
  },

  courtAnalysis: {
    chapter: "第一章",
    title: "兩難之局",
    progress: "時局分析",
    location: "趙王大殿",
    speaker: "你",
    text:
      "你向趙王分析：「若獻出和氏璧，秦國可能只取寶物而不交城池；若拒絕，又可能招致秦兵。故此不能只論予或不予，還要選出能夠隨機應變的使者。」\n\n" +
      "殿上群臣稍稍安靜下來。",
    choices: [
      {
        text: "建議尋找能夠答覆秦國的使者",
        next: "courtQuestion",
        effects: {
          reasoning: 1,
          knowledge: 1
        },
        feedback: {
          title: "時局掌握",
          text:
            "你分辨了表面選擇和真正問題：趙國需要一名能夠維護國家利益、應對強秦的使者。"
        }
      }
    ]
  },

  courtPoorChoice: {
    chapter: "第一章",
    title: "藏璧之議",
    progress: "時局判斷",
    location: "趙王大殿",
    speaker: "廉頗",
    text:
      "廉頗搖頭道：「藏起和氏璧，既不能回覆秦國，也無法消除秦國出兵的威脅。」\n\n" +
      "你意識到，外交危機不能只靠逃避來解決。",
    choices: [
      {
        text: "重新思考真正的問題",
        next: "courtQuestion"
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
      "繆賢表示，他的門客藺相如可以出使秦國。\n\n" +
      "趙王原本正「求人可使報秦者」。這句話最合理的現代語譯是甚麼？",
    choices: [
      {
        text: "尋找一個可以出使並答覆秦國的人",
        next: "recommendation",
        effects: {
          meaning: 2,
          knowledge: 1
        },
        masteryEffects: {
          syntax: 1
        },
        feedback: {
          title: "語譯正確",
          text:
            "句子的中心是「求人」；「可使報秦」修飾所尋找的人。「報」在這裏解作答覆。"
        }
      },
      {
        text: "尋找一名能促使秦國正式回覆趙國的人",
        next: "questionRetry",
        wrongAnswer: true,
        effects: {
          meaning: -1
        },
        feedback: {
          title: "句子方向錯誤",
          text:
            "尋找使者的是趙國；句中不是要求秦國派人。翻譯時要先找出動作的發出者。"
        }
      },
      {
        text: "尋找一名能代表趙國向秦國討回公道的人",
        next: "questionRetry",
        wrongAnswer: true,
        effects: {
          meaning: -1
        },
        feedback: {
          title: "字義錯誤",
          text:
            "「報」在這個語境中解作答覆或回覆，不是報仇。"
        }
      }
    ]
  },

  questionRetry: {
    chapter: "第一章",
    title: "倒裝之句",
    progress: "文義重溫",
    location: "趙王大殿",
    speaker: "掌院先生",
    text:
      "先生低聲提醒你：「先找中心詞。趙王要求的是『人』，其他部分用來說明這個人要具備甚麼條件。」",
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
    speaker: "旁白",
    text:
      "衣着樸素的藺相如步入大殿。他沒有顯赫官位，面對趙王和群臣卻毫無慌亂。\n\n" +
      "趙王問繆賢，為何認為藺相如足以擔當使者。",
    choices: [
      {
        text: "細聽繆賢講述逃亡燕國的往事",
        next: "miaoXianStory"
      }
    ]
  },

  miaoXianStory: {
    chapter: "第一章",
    title: "止亡走燕",
    progress: "人物分析",
    location: "趙王大殿",
    speaker: "宦者令繆賢",
    text:
      "繆賢曾經犯罪，打算逃往燕國。他以為燕王曾經主動握手結交，必會收留自己。\n\n" +
      "藺相如卻勸他不要逃亡。你認為藺相如最可能根據甚麼作出判斷？",
    choices: [
      {
        text: "燕王曾親近繆賢，這段私人交情足以抵消兩國形勢的影響",
        next: "miaoXianWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "燕弱趙強，燕王結交繆賢是因他受趙王寵信",
        next: "miaoXianCorrect",
        effects: {
          reasoning: 2,
          knowledge: 1
        },
        masteryEffects: {
          context: 1,
          character: 1
        },
        feedback: {
          title: "推論正確",
          text:
            "藺相如沒有只看燕王表面的友善，而是從燕、趙強弱和繆賢的身分分析燕王的真正動機。"
        }
      },
      {
        text: "燕王的態度取決於臨場決定，現有資料不足以判斷",
        next: "miaoXianWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      }
    ]
  },

  miaoXianWrong: {
    chapter: "第一章",
    title: "表裏之別",
    progress: "人物分析",
    location: "趙王大殿",
    speaker: "宦者令繆賢",
    text:
      "繆賢解釋，燕王當初願意結交自己，是因為趙國強、燕國弱，而自己又受到趙王寵信。\n\n" +
      "如果他成為趙國逃犯，燕王反而可能把他綁回趙國。",
    choices: [
      {
        text: "明白藺相如如何分析形勢",
        next: "miaoXianCorrect",
        effects: {
          knowledge: 1
        }
      }
    ]
  },

  miaoXianCorrect: {
    chapter: "第一章",
    title: "勇而有謀",
    progress: "人物分析",
    location: "趙王大殿",
    speaker: "宦者令繆賢",
    text:
      "繆賢接受藺相如的建議，主動向趙王請罪，最後得到赦免。因此，他認為藺相如既有勇氣，也有智謀，適合出使秦國。\n\n" +
      "趙王轉身向藺相如詢問和氏璧之事。",
    choices: [
      {
        text: "聽取藺相如的對策",
        next: "policyDebate"
      }
    ]
  },

  policyDebate: {
    chapter: "第一章",
    title: "曲在何方",
    progress: "策論考驗",
    location: "趙王大殿",
    speaker: "藺相如",
    text:
      "藺相如指出：若秦國用城池交換和氏璧，而趙國拒絕，是趙國理虧；若趙國獻璧而秦國不交城池，則是秦國理虧。\n\n" +
      "你認為藺相如為何主張先答應秦國？",
    choices: [
      {
        text: "先接受條件可顯示趙國誠意，秦王顧及聲名後較可能履約",
        next: "policyWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "藉此讓道理站在趙國一方，使秦國承擔失信責任",
        next: "missionOffer",
        requirement: {
          type: "stat",
          key: "reasoning",
          value: 2,
          label: "需要明辨 2"
        },
        effects: {
          reasoning: 2,
          knowledge: 1
        },
        masteryEffects: {
          context: 1,
          character: 1
        },
        feedback: {
          title: "明辨之策",
          text:
            "藺相如不是盲目相信秦王，而是從道理、責任和外交形勢安排下一步。"
        }
      },
      {
        text: "城池關乎國力，因此即使秦國履約機會不高，也值得直接承擔風險",
        next: "policyWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      }
    ]
  },

  policyWrong: {
    chapter: "第一章",
    title: "利與理",
    progress: "策論重溫",
    location: "趙王大殿",
    speaker: "掌院先生",
    text:
      "先生提醒你：「藺相如並非相信秦王，也不是輕視和氏璧。他考慮的是如何使趙國不負理虧之名。」",
    choices: [
      {
        text: "重新分析藺相如的計策",
        next: "policyDebate"
      }
    ]
  },

  missionOffer: {
    chapter: "第一章",
    title: "奉璧使秦",
    progress: "出使決定",
    location: "趙王大殿",
    speaker: "藺相如",
    text:
      "藺相如主動請纓：若秦國先把城池交給趙國，和氏璧便留在秦國；若城池沒有交付，他會把和氏璧完整帶回趙國。\n\n" +
      "他需要一名隨行文書。你是否願意同行？",
    choices: [
      {
        text: "請求成為藺相如的隨行文書",
        next: "qinArrival",
        requirement: {
          type: "stat",
          key: "reasoning",
          value: 3,
          label: "需要明辨 3"
        },
        effects: {
          virtue: 1
        }
      },
      {
        text: "以學識不足為由留在趙國",
        next: "endingStayed"
      }
    ]
  },

  qinArrival: {
    chapter: "第一章",
    title: "西入強秦",
    progress: "抵達秦國",
    location: "秦國章臺",
    speaker: "旁白",
    text:
      "你隨藺相如西入秦國。秦王沒有在正殿接見趙國使者，而是在章臺接過和氏璧，隨即把它傳給宮中侍從觀看。\n\n" +
      "眾人歡呼，秦王卻沒有提及十五座城。",
    choices: [
      {
        text: "趁群臣都在場，立即依國書追問城池，使秦王公開表態",
        next: "qinDirect",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "觀察藺相如如何取回和氏璧",
        next: "jadeFlaw"
      }
    ]
  },

  qinDirect: {
    chapter: "第一章",
    title: "不可躁進",
    progress: "章臺交鋒",
    location: "秦國章臺",
    speaker: "藺相如",
    text:
      "藺相如低聲道：「璧仍在秦王手中。此刻公開質問，只會令我方失去轉圜餘地。」\n\n" +
      "他向秦王表示，玉璧上有一處瑕疵，可以指出來。",
    choices: [
      {
        text: "明白後退一步是為了取回主動",
        next: "jadeFlaw",
        effects: {
          reasoning: 1
        }
      }
    ]
  },

  jadeFlaw: {
    chapter: "第一章",
    title: "璧有瑕",
    progress: "章臺交鋒",
    location: "秦國章臺",
    speaker: "藺相如",
    text:
      "「璧有瑕，請指示王。」\n\n" +
      "秦王把和氏璧交回藺相如。藺相如持璧後退，靠着殿柱，指出秦王接見使者時禮節傲慢，又只顧傳看寶璧，沒有交城的誠意。",
    choices: [
      {
        text: "這反映藺相如先以機智取璧，再以勇氣抗秦",
        next: "pillarThreat",
        effects: {
          reasoning: 2,
          knowledge: 1
        },
        masteryEffects: {
          character: 1,
          evidence: 1
        }
      },
      {
        text: "藺相如先指出玉璧細節，是想以專業判斷爭取秦王重視",
        next: "jadeAnalysisWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      }
    ]
  },

  jadeAnalysisWrong: {
    chapter: "第一章",
    title: "言外之意",
    progress: "人物分析",
    location: "秦國章臺",
    speaker: "旁白",
    text:
      "所謂玉璧有瑕只是藺相如取回和氏璧的辦法。重點不在鑑玉，而在他能迅速判斷秦王失信，並設法重奪主動。",
    choices: [
      {
        text: "重新理解藺相如的行動",
        next: "pillarThreat",
        effects: {
          knowledge: 1
        },
        masteryEffects: {
          character: 1
        }
      }
    ]
  },

  pillarThreat: {
    chapter: "第一章",
    title: "怒髮衝冠",
    progress: "章臺交鋒",
    location: "秦國章臺",
    speaker: "藺相如",
    text:
      "藺相如斜視殿柱，表示如果秦王強行奪璧，他便與和氏璧一同撞碎在柱上。\n\n" +
      "秦王擔心寶璧受損，只得道歉，並命官員取出地圖，假意劃出十五座城。",
    choices: [
      {
        text: "秦王公開道歉並展示地圖，表示他已開始作出可驗證的讓步",
        next: "mapWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "判斷秦王只是拖延和欺詐",
        next: "fiveDayPlan",
        requirement: {
          type: "mastery",
          key: "context",
          value: 2,
          label: "需要時局達到理解"
        },
        effects: {
          reasoning: 2
        }
      },
      {
        text: "建議藺相如繼續觀察",
        next: "fiveDayPlan"
      }
    ]
  },

  mapWrong: {
    chapter: "第一章",
    title: "詐佯予城",
    progress: "形勢判斷",
    location: "秦國章臺",
    speaker: "藺相如",
    text:
      "藺相如指出，秦王只是借地圖假裝交出城池。若真正有意履約，就不會在取得寶璧後完全不談交城之事。",
    choices: [
      {
        text: "協助藺相如思考下一步",
        next: "fiveDayPlan",
        effects: {
          knowledge: 1
        }
      }
    ]
  },

  fiveDayPlan: {
    chapter: "第一章",
    title: "齋戒五日",
    progress: "暗度和璧",
    location: "廣成傳舍",
    speaker: "藺相如",
    text:
      "藺相如以趙王送璧前曾齋戒五日為理由，要求秦王也齋戒五日，並在朝廷設下隆重禮儀，才會再次獻璧。\n\n" +
      "秦王答應後，藺相如獲得五日時間。你認為他應如何處置和氏璧？",
    choices: [
      {
        text: "先保留玉璧至正式朝會，再以完整禮儀要求秦王同步交城",
        next: "planWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      },
      {
        text: "讓隨從穿平民衣服，帶璧從小路返回趙國",
        next: "returnJade",
        effects: {
          reasoning: 2,
          knowledge: 2
        },
        masteryEffects: {
          evidence: 1,
          character: 1
        }
      },
      {
        text: "把玉璧藏於秦國城內的秘密地點，作為談判時的制衡",
        next: "planWrong",
        wrongAnswer: true,
        effects: {
          reasoning: -1
        }
      }
    ]
  },

  planWrong: {
    chapter: "第一章",
    title: "徑道歸趙",
    progress: "策略重溫",
    location: "廣成傳舍",
    speaker: "藺相如",
    text:
      "藺相如判斷秦王即使齋戒，也不會真正交付城池。他決定先讓和氏璧離開秦國，避免五日後再次受制。",
    choices: [
      {
        text: "安排隨從秘密送璧回趙",
        next: "returnJade",
        effects: {
          knowledge: 1
        }
      }
    ]
  },

  returnJade: {
    chapter: "第一章",
    title: "徑道歸璧",
    progress: "暗度和璧",
    location: "廣成傳舍",
    speaker: "旁白",
    text:
      "夜色之中，藺相如命隨從換上平民衣服，把和氏璧藏在身上，從偏僻小路逃離秦國。\n\n" +
      "和氏璧已經踏上歸趙之路，但藺相如本人仍留在秦國。",
    choices: [
      {
        text: "詢問他為何不一同逃走",
        next: "finalCourt"
      }
    ]
  },

  finalCourt: {
    chapter: "第一章",
    title: "廷見秦王",
    progress: "最後交鋒",
    location: "秦國正殿",
    speaker: "藺相如",
    text:
      "五日後，秦王設下隆重禮儀。藺相如坦言和氏璧已經回到趙國，並指出秦國歷來缺乏堅守盟約的君主。\n\n" +
      "他表示自己欺瞞秦王，甘願承受刑罰，請秦王和群臣仔細考慮。",
    choices: [
      {
        text: "秦王會殺死藺相如，以挽回威嚴",
        next: "finalReasoningWrong"
      },
      {
        text: "殺死藺相如既取不回寶璧，也會破壞秦趙關係",
        next: "endingGood",
        requirement: {
          type: "stat",
          key: "reasoning",
          value: 5,
          label: "需要明辨 5"
        },
        effects: {
          reasoning: 1,
          virtue: 1
        }
      },
      {
        text: "觀察秦王如何衡量得失",
        next: "endingNormal"
      }
    ]
  },

  finalReasoningWrong: {
    chapter: "第一章",
    title: "秦王之計",
    progress: "最後交鋒",
    location: "秦國正殿",
    speaker: "旁白",
    text:
      "秦王雖然憤怒，卻明白殺死藺相如也不能取回和氏璧，反而會斷絕秦趙之間的關係。\n\n" +
      "他最終按外交禮節接見藺相如，讓他返回趙國。",
    choices: [
      {
        text: "返回趙國",
        next: "endingNormal"
      }
    ]
  },

  endingGood: {
    chapter: "第一章",
    title: "完璧歸趙",
    progress: "第一章完成",
    location: "趙國王城",
    speaker: "趙王",
    text:
      "和氏璧完整回到趙國，藺相如也沒有使趙國受辱。趙王認為他是一名賢能大夫，把他擢升為上大夫。\n\n" +
      "你親歷了整場外交交鋒，開始明白：藺相如的勇氣並非魯莽，而是建立在細密判斷之上。",
    completed: true,
    choices: [
      {
        text: "查看本章學習報告",
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
    title: "不辱使命",
    progress: "第一章完成",
    location: "趙國王城",
    speaker: "旁白",
    text:
      "秦王最終沒有殺死藺相如，而是按禮節讓他返回趙國。秦國沒有交出城池，趙國也沒有失去和氏璧。\n\n" +
      "你雖然未能預先判斷秦王的決定，仍見證了藺相如如何以智勇維護趙國。",
    completed: true,
    choices: [
      {
        text: "查看本章學習報告",
        action: "showReport"
      },
      {
        text: "重新挑戰",
        action: "restart"
      }
    ]
  },

  endingStayed: {
    chapter: "第一章",
    title: "留守書院",
    progress: "支線結局",
    location: "趙國書院",
    speaker: "掌院先生",
    text:
      "你沒有隨藺相如前往秦國，而是留在書院整理朝堂紀錄。\n\n" +
      "數日後，和氏璧完整回到趙國。先生告訴你：「你已理解部分文義，但要真正掌握人物，仍須分析他在危急關頭的選擇。」",
    completed: true,
    choices: [
      {
        text: "查看本章學習報告",
        action: "showReport"
      },
      {
        text: "重新修習",
        action: "restart"
      }
    ]
  }
};

/* =========================================================
   書院修習資料
   ========================================================= */

const academyActions = {
  translation: {
    name: "奉璧譯館",
    day: 1,
    category: "translation",
    description: "《廉頗藺相如列傳》字詞、句式及完整語譯。",
    stress: 1
  },
  strategy: {
    name: "秦趙決策局",
    day: 2,
    category: "strategy",
    description: "依國力、名義、風險和後備方案判斷秦趙決策。",
    stress: 2
  },
  character: {
    name: "史官斷人物",
    day: 3,
    category: "character",
    description: "配對人物特點、原文證據、描寫手法與分析。",
    stress: 1
  },
  quotation: {
    name: "原文奪璧戰",
    day: 4,
    category: "quotation",
    description: "補字、上下句接龍，並把引文運用於人物分析。",
    stress: 1
  },
  structure: {
    name: "太史公編年卷",
    day: 5,
    category: "structure",
    description: "整理三事次序、篇章結構及《史記》寫作手法。",
    stress: 1
  },
  review: {
    name: "錯題重溫",
    day: 1,
    category: "review",
    description: "重做一道《廉頗藺相如列傳》錯題，完成後降低心疲。",
    stress: -3
  }
};

const miniGameQuestions = {
  translation: [
    {
      id: "tr_tujianqi",
      prompt: "「徒見欺」的句式和語意應如何理解？",
      options: ["只是看見欺騙", "白白地被欺騙", "只欺騙眼前的人"],
      correct: 1,
      focus: "關鍵詞與被動句",
      explanation: "「見」在此表示被動；「徒」解作白白地。"
    },
    {
      id: "tr_baoqin",
      prompt: "「求人可使報秦者」的句子中心及結構是甚麼？",
      options: ["中心是『秦』，屬賓語前置", "中心是『求人』，『可使報秦』修飾『人』", "中心是『報』，意思是報仇"],
      correct: 1,
      focus: "定語後置",
      explanation: "全句指尋找可以出使答覆秦國的人；修飾語置於中心詞『人』之後。"
    },
    {
      id: "tr_heyi",
      prompt: "「何以知之」最準確的語譯是甚麼？",
      options: ["用甚麼方法知道這件事", "為甚麼讓他知道", "知道了甚麼事情"],
      correct: 0,
      focus: "賓語前置",
      explanation: "疑問代詞『何』作介詞『以』的賓語而前置，即『以何知之』。"
    },
    {
      id: "tr_junzhi",
      prompt: "「均之二策，寧許以負秦曲」的推理關係是甚麼？",
      options: ["比較兩策，寧可答允，讓理虧責任落在秦國", "兩策相同，所以拒絕秦國", "平均分配兩策，讓秦國屈服"],
      correct: 0,
      focus: "語境詞義與因果",
      explanation: "「均」是衡量、比較；「負秦曲」指使秦國承擔理虧責任。"
    },
    {
      id: "tr_xianguojia",
      prompt: "「以先國家之急而後私讎也」應如何意譯？",
      options: ["先處理國家危急之事，把私人仇怨放在後面", "國家先報復私人仇敵", "先讓國家危急，再解決私怨"],
      correct: 0,
      focus: "意動用法",
      explanation: "「先」「後」在此表示把國家急務置先、把私人仇怨置後。"
    }
  ],
  strategy: [
    {
      id: "st_jade",
      prompt: "以城易璧時，哪一條推論鏈最完整？",
      options: ["秦強趙弱→必須無條件獻璧", "秦強趙弱→拒絕則趙先理虧→先答允→秦不交城則曲在秦→遣相如出使", "和氏璧珍貴→收藏不理國書"],
      correct: 1,
      focus: "國力、外交名義與風險",
      explanation: "決策同時處理強弱形勢、曲直名義和失信風險，並以使者作執行方案。"
    },
    {
      id: "st_mianchi",
      prompt: "趙王畏秦而不欲赴澠池會，廉頗和藺相如為何主張前往？",
      options: ["只因秦王已保證安全", "不去會顯示趙國弱小怯懦，損害國家威望", "為了讓趙王學習擊缻"],
      correct: 1,
      focus: "外交名義與國家威望",
      explanation: "二人沒有忽略風險，而是判斷拒絕赴會同樣會削弱趙國的外交地位。"
    },
    {
      id: "st_thirty",
      prompt: "廉頗提出趙王三十日不返便立太子，主要作用是甚麼？",
      options: ["乘機奪取王位", "預先維持政局與國家延續，防止秦國扣留趙王要脅", "催促藺相如回國"],
      correct: 1,
      focus: "實際風險與後備方案",
      explanation: "後備部署降低秦國扣留趙王所能取得的政治利益，也顯示廉頗深謀遠慮。"
    },
    {
      id: "st_conflict",
      prompt: "相如面對廉頗揚言羞辱，最完整的決策根據是甚麼？",
      options: ["地位較高，所以不必理會任何人", "將相相鬥會削弱趙國，使強秦得利，因此避讓私人衝突", "害怕廉頗善戰"],
      correct: 1,
      focus: "國家利益",
      explanation: "相如以國家安危為先；避讓不是怯懦，而是避免內耗。"
    }
  ],
  character: [
    {
      id: "ch_pillar",
      prompt: "「持璧倚柱，怒髮上衝冠」最適合支持哪項分析？",
      options: ["以神態和行動描寫呈現相如臨危不懼", "以側面描寫呈現趙王膽怯", "以景物描寫呈現玉璧珍貴"],
      correct: 0,
      focus: "特點、證據與描寫手法",
      explanation: "持璧倚柱是行動，怒髮衝冠是神態，配合當時強秦壓力，突出相如勇敢。"
    },
    {
      id: "ch_hide",
      prompt: "「相如引車避匿」為何不能證明他膽小？",
      options: ["因為他不知道廉頗在場", "後文說明他以國家之急為先，避讓是為免將相相鬥", "因為車行得太快"],
      correct: 1,
      focus: "後文照應與人物動機",
      explanation: "分析人物要連結後文自白；避匿呈現忍辱負重和顧全大局。"
    },
    {
      id: "ch_lianpo",
      prompt: "廉頗「肉袒負荊，因賓客至藺相如門謝罪」最能呈現甚麼？",
      options: ["只重視個人名聲", "坦率、勇於認錯並以國家團結為重", "畏懼藺相如的官位"],
      correct: 1,
      focus: "性格轉變與行動證據",
      explanation: "負荊請罪以具體行動呈現廉頗知錯能改，完成其人物轉變。"
    },
    {
      id: "ch_qinking",
      prompt: "秦王只在章臺接見相如，又把璧傳示美人及左右，主要呈現甚麼？",
      options: ["傲慢無禮，缺乏正式交城誠意", "愛惜人才，願與趙國平等交往", "熟悉玉器鑑賞"],
      correct: 0,
      focus: "側面行動與人物形象",
      explanation: "接見地點和傳璧行動共同顯示秦王輕慢趙使，只重寶璧。"
    }
  ],
  quotation: [
    {
      id: "qu_qinstrong",
      prompt: "補全文句：「秦彊而趙弱，＿＿＿＿。」",
      options: ["不可不許", "寧許以負秦曲", "徒見欺"],
      correct: 0,
      focus: "補字奪璧",
      explanation: "此句先指出國力形勢，作為不能直接拒秦的根據。"
    },
    {
      id: "qu_fivesteps",
      prompt: "哪一句最適合引證藺相如在澠池之會勇敢維護國家尊嚴？",
      options: ["臣請完璧歸趙", "五步之內，相如請得以頸血濺大王矣", "相如引車避匿"],
      correct: 1,
      focus: "引文配題",
      explanation: "相如以近距離威脅秦王擊缻，顯示他在強權前勇敢維護趙王尊嚴。"
    },
    {
      id: "qu_twomen",
      prompt: "接續：「彊秦之所以不敢加兵於趙者，＿＿＿＿。」",
      options: ["徒以吾兩人在也", "以先國家之急", "卒相與驩"],
      correct: 0,
      focus: "上下句接龍",
      explanation: "此句是相如避讓廉頗的核心推理：將相團結能牽制強秦。"
    },
    {
      id: "qu_priority",
      prompt: "哪一句最直接揭示「負荊請罪」部分的主旨？",
      options: ["王不行，示趙弱且怯也", "以先國家之急而後私讎也", "秦王坐章臺見相如"],
      correct: 1,
      focus: "引文與主旨",
      explanation: "此句直接說明相如把國家利益置於私人恩怨之前。"
    }
  ],
  structure: [
    {
      id: "sr_order",
      prompt: "哪組次序正確？",
      options: ["璧有瑕取璧→齋戒五日→從者懷璧歸趙→澠池擊缻→引車避匿→負荊請罪", "齋戒五日→璧有瑕→負荊請罪→澠池擊缻", "澠池擊缻→完璧歸趙→廉頗揚言"],
      correct: 0,
      focus: "全篇情節排序",
      explanation: "篇章依次寫完璧歸趙、澠池之會、負荊請罪三件事。"
    },
    {
      id: "sr_group",
      prompt: "「秦王為趙王擊缻」應歸入哪一卷？",
      options: ["完璧歸趙", "澠池之會", "負荊請罪"],
      correct: 1,
      focus: "三事歸類",
      explanation: "擊缻是澠池宴會上相如迫秦王回應趙王鼓瑟之辱的事件。"
    },
    {
      id: "sr_foreshadow",
      prompt: "開首先寫廉頗是著名將領，而相如只是繆賢舍人，有何結構作用？",
      options: ["只為交代二人年齡", "形成身分對比，為相如升遷及後來將相衝突埋下伏筆", "證明舍人一定比將軍勇敢"],
      correct: 1,
      focus: "對比與伏筆",
      explanation: "相如在前兩事立功升遷，身分變化引出廉頗不服，銜接負荊請罪。"
    },
    {
      id: "sr_methods",
      prompt: "篇章以秦王的退讓和左右反應突出相如的智勇，主要運用甚麼手法？",
      options: ["側面描寫及反襯", "純粹環境描寫", "倒敘和夢境"],
      correct: 0,
      focus: "寫作手法",
      explanation: "他人的反應從側面證明相如行動有效，秦王的強勢也反襯相如的智勇。"
    }
  ]
};

const academyDayThemes = {
  1: "完璧歸趙：字詞語譯",
  2: "完璧歸趙：外交決策",
  3: "澠池之會：情節與人物",
  4: "負荊請罪：主旨與引證",
  5: "全篇結構與手法"
};

const academyEvents = {
  reportMeaning: {
    title: "「報秦」之爭",
    educationNote: "語境會改變字義。翻譯時應先找句子中心，再按上下文判斷多義詞。",
    location: "書院講堂",
    speaker: "同門弟子",
    text:
      "一名同門正在語譯『求人可使報秦者』。\n\n" +
      "他說：『這句是指尋找一個能夠向秦國報仇的人。』\n\n" +
      "旁邊幾名弟子似乎也接受了這個解釋。你會怎樣處理？",
    condition(actionId) {
      return actionId === "translation" || actionId === "structure" || actionId === "translate" || actionId === "service";
    },
    choices: [
      {
        text: "先找出「求人」的中心，再說明「報」在此是答覆",
        learningOutcome: "complete",
        effects: { meaning: 1, virtue: 1, knowledge: 1 },
        masteryEffects: { syntax: 1 },
        flags: { correctedReport: true },
        feedback: {
          title: "教學相長",
          text: "句子的中心是『求人』；『可使報秦』說明所尋找的人。『報』在此解作答覆秦國。"
        }
      },
      {
        text: "提醒他重新判斷「報」的意思，讓他自行找出句子結構",
        learningOutcome: "partial",
        effects: { meaning: 1 },
        feedback: {
          title: "解釋不足",
          text: "你判斷答案有誤，卻沒有說明錯在何處。完整語譯需要交代句子結構和語境字義。"
        }
      },
      {
        text: "先保留意見，待先生講解時再讓全班一起核對",
        learningOutcome: "misconception",
        effects: { virtue: -1 },
        feedback: {
          title: "錯義流傳",
          text: "錯誤解釋在同門之間流傳。你失去了一次透過教學鞏固知識的機會。"
        }
      }
    ]
  },

  teacherEvidence: {
    title: "先生問證",
    educationNote: "人物分析不能只有評語；必須引用行動或言語，並解釋證據與人物特點的關係。",
    location: "書院正堂",
    speaker: "掌院先生",
    text:
      "先生問：『若說藺相如機智，怎樣才能避免答案流於空泛？』\n\n" +
      "他要求你從人物的言語、行動和處境中選擇證據。",
    condition() {
      return gameState.mastery.character >= 1;
    },
    choices: [
      {
        text: "先提出人物特點，再用整段事件的結果支持判斷",
        learningOutcome: "misconception",
        effects: { reasoning: -1 },
        feedback: {
          title: "循環解釋",
          text: "用『聰明』解釋『機智』只是重複觀點，沒有引用具體行動，也沒有分析行動原因。"
        }
      },
      {
        text: "選取具體言行，連結處境、動機與行動效果",
        learningOutcome: "complete",
        effects: { reasoning: 2, knowledge: 1 },
        masteryEffects: { character: 1, evidence: 1 },
        flags: { evidenceTraining: true },
        feedback: {
          title: "論證完整",
          text: "人物分析可以採用『特點—行動或引文—處境與動機—扣題』的結構。"
        }
      },
      {
        text: "列出多項相關原文，讓證據的整體方向呈現人物特點",
        learningOutcome: "partial",
        effects: { knowledge: 1 },
        feedback: {
          title: "有引無析",
          text: "引文只能提供證據。若不解釋證據如何呈現人物特點，答案仍不完整。"
        }
      }
    ]
  },

  qinMerchant: {
    title: "秦商入院",
    educationNote: "時局判斷不能只比較表面利益，還要考慮國力、信用、動機和後果。",
    location: "書院前庭",
    speaker: "秦國商人",
    text:
      "一名秦國商人帶着華麗貨物來到書院。他笑道：『秦國既願用十五城交換一塊玉，趙國豈不是佔了天大的便宜？』\n\n" +
      "部分同門聽後深以為然。",
    condition() {
      return gameState.academy.day >= 2;
    },
    choices: [
      {
        text: "城池能帶來長期國力，趙國可先接受交易，再處理履約風險",
        learningOutcome: "partial",
        effects: { reasoning: -1 },
        feedback: {
          title: "只看表面利益",
          text: "交易價值不是唯一問題。趙國還要考慮秦國是否真會交城，以及拒絕交易可能帶來的後果。"
        }
      },
      {
        text: "比較秦國履約可能、兩國強弱與趙國承擔的後果",
        learningOutcome: "complete",
        effects: { reasoning: 2, knowledge: 1 },
        masteryEffects: { context: 1 },
        flags: { merchantInsight: true },
        feedback: {
          title: "看破交易",
          text: "你沒有被十五城的表面價值迷惑，而是把國力、信用及外交後果納入判斷。"
        }
      },
      {
        text: "秦國信用可疑，趙國應先拒絕交易，以免交璧後失去談判籌碼",
        learningOutcome: "partial",
        effects: { reasoning: -1, virtue: 1 },
        feedback: {
          title: "立場有餘，分析不足",
          text: "拒絕也可能讓秦國取得出兵藉口。外交判斷不能只靠好惡。"
        }
      }
    ]
  },

  copyingError: {
    title: "錯抄簡牘",
    educationNote: "校勘應以原文為依據；心疲過高時，休息和交叉核對比依賴記憶可靠。",
    location: "藏經閣",
    speaker: "旁白",
    text:
      "你在燈下整理簡牘。由於精神疲憊，竟把『求人可使報秦者』抄成意思完全不同的句子。\n\n" +
      "明日這份簡牘便會交給其他弟子使用。",
    special: true,
    condition(actionId) {
      return actionId === "quotation" && gameState.academy.stress >= 5;
    },
    choices: [
      {
        text: "依照剛才背誦的內容修正，以免等待原卷耽誤交付",
        learningOutcome: "misconception",
        effects: { meaning: -1 },
        flags: { copiedWrongText: true },
        feedback: {
          title: "錯上加錯",
          text: "疲憊時只依賴模糊記憶容易再次出錯。錯誤簡牘被保留下來。"
        }
      },
      {
        text: "立即對照原卷，從中心詞與語境重新校勘",
        learningOutcome: "complete",
        effects: { meaning: 1, knowledge: 1 },
        masteryEffects: { syntax: 1, evidence: 1 },
        flags: { correctedCopy: true },
        stress: 1,
        feedback: {
          title: "校勘完成",
          text: "你以原卷核對文字，並重新確認句法和字義。雖然耗費精神，卻避免錯誤流傳。"
        }
      },
      {
        text: "暫停抄寫，稍後與同門依原卷逐字核對",
        learningOutcome: "complete",
        effects: { virtue: 1, meaning: 1 },
        flags: { correctedCopy: true },
        stress: -2,
        feedback: {
          title: "合作校勘",
          text: "你承認自己疲憊，並以合作方式完成校勘。心疲降低了。"
        }
      }
    ]
  },

  teacherGuidance: {
    title: "夜授錦囊",
    educationNote: "融會貫通是把文義、證據、人物動機與時局放進同一條推理鏈。",
    location: "掌院書室",
    speaker: "掌院先生",
    text:
      "先生看過你近日的語譯、人物品評和殘卷記誦，夜裏把你召到書室。\n\n" +
      "『你已能解句，也開始懂得以證據分析人物。但真正面對強敵時，還要把文義、形勢與人物動機連成一體。』",
    special: true,
    condition() {
      const counts = gameState.academy.actionCounts;
      const translationDone = (counts.translation || 0) + (counts.translate || 0) >= 1;
      return translationDone && counts.character >= 1 && counts.quotation >= 1;
    },
    choices: [
      {
        text: "接受指點：先辨形勢，再選證據，最後判斷行動",
        learningOutcome: "complete",
        effects: { meaning: 1, reasoning: 2, knowledge: 1 },
        masteryEffects: { context: 1, syntax: 1, character: 1, evidence: 1 },
        flags: { teacherGuidance: true },
        feedback: {
          title: "融會貫通",
          text: "你取得先生的錦囊。正式任務中，部分高階選項將直接開放。"
        }
      }
    ]
  }
};

/* 將書院學習轉化為主線隱藏選項 */
scenes.court.choices.unshift({
  text: "【書院領悟】十五城只是表面條件，必須考慮秦國信用與兩國強弱",
  description: "你想起秦國商人在書院提出的交易說法。",
  next: "courtAnalysis",
  hiddenWhenLocked: true,
  isHiddenOption: true,
  requirement: { type: "flag", key: "merchantInsight", value: true },
  effects: { reasoning: 2, knowledge: 1 },
  masteryEffects: { context: 1 },
  feedback: {
    title: "書院所學：時局",
    text: "你把書院中的商人事件應用到真正的外交危機，沒有只看十五城的表面價值。"
  }
});

scenes.courtQuestion.choices.unshift({
  text: "【教學相長】『報』是答覆；全句指尋找可以出使答覆秦國的人",
  next: "recommendation",
  hiddenWhenLocked: true,
  isHiddenOption: true,
  requirement: { type: "flag", key: "correctedReport", value: true },
  effects: { meaning: 2, knowledge: 1 },
  masteryEffects: { syntax: 1 },
  feedback: {
    title: "書院所學：句法",
    text: "你曾向同門解釋這個句式，因此在朝堂上立即辨認出中心詞和語境字義。"
  }
});

scenes.miaoXianStory.choices.unshift({
  text: "【先生問證】從燕趙強弱、繆賢身分及燕王動機建立證據鏈",
  next: "miaoXianCorrect",
  hiddenWhenLocked: true,
  isHiddenOption: true,
  requirement: { type: "flag", key: "evidenceTraining", value: true },
  effects: { reasoning: 2, knowledge: 1 },
  masteryEffects: { context: 1, character: 1, evidence: 1 },
  feedback: {
    title: "書院所學：論證",
    text: "你利用形勢、身分、動機和結果支持人物判斷，而非空泛地說藺相如聰明。"
  }
});

scenes.missionOffer.choices.unshift({
  text: "【掌院錦囊】以形勢、文義和證據協助藺相如出使",
  description: "此選項不受原本『明辨 3』限制。",
  next: "qinArrival",
  hiddenWhenLocked: true,
  isHiddenOption: true,
  requirement: { type: "flag", key: "teacherGuidance", value: true },
  effects: { virtue: 1, reasoning: 1, knowledge: 1 },
  feedback: {
    title: "特殊路線開啟",
    text: "掌院先生的指點讓你獲得藺相如認可，憑融會貫通加入使團。"
  }
});

/* =========================================================
   HTML 元素
   ========================================================= */

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
  feedbackText: document.querySelector("#feedback-text"),

  academyStatus: document.querySelector("#academy-status"),
  academyDayValue: document.querySelector("#academy-day-value"),
  actionPointPips: document.querySelector("#action-point-pips"),
  stressMeter: document.querySelector("#stress-meter"),
  stressValue: document.querySelector("#stress-value")
};

/* =========================================================
   基本工具
   ========================================================= */

function cloneDefaultState() {
  if (typeof structuredClone === "function") {
    return structuredClone(defaultState);
  }

  return JSON.parse(JSON.stringify(defaultState));
}

function formatText(text = "") {
  return text.replaceAll(
    "{playerName}",
    gameState.playerName
  );
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

/* =========================================================
   屬性及掌握度
   ========================================================= */

function updateStats() {
  elements.playerNameDisplay.textContent =
    gameState.playerName;

  elements.meaning.textContent =
    gameState.stats.meaning;

  elements.reasoning.textContent =
    gameState.stats.reasoning;

  elements.virtue.textContent =
    gameState.stats.virtue;

  elements.knowledge.textContent =
    gameState.stats.knowledge;

  updateAcademyStatus();
}

function applyEffects(effects = {}) {
  for (const [stat, amount] of Object.entries(effects)) {
    if (!(stat in gameState.stats)) {
      continue;
    }

    gameState.stats[stat] += amount;
    gameState.stats[stat] = Math.max(
      0,
      gameState.stats[stat]
    );
  }
}

function applyMastery(masteryEffects = {}) {
  for (
    const [category, amount]
    of Object.entries(masteryEffects)
  ) {
    if (!(category in gameState.mastery)) {
      continue;
    }

    gameState.mastery[category] += amount;

    gameState.mastery[category] = Math.min(
      3,
      Math.max(0, gameState.mastery[category])
    );
  }
}

function getMasteryLabel(value) {
  if (value >= 3) {
    return "掌握";
  }

  if (value >= 2) {
    return "理解";
  }

  if (value >= 1) {
    return "初識";
  }

  return "未習";
}

/* =========================================================
   書院狀態列
   ========================================================= */

function updateAcademyStatus() {
  if (!elements.academyStatus) {
    return;
  }

  const academy = gameState.academy;

  elements.academyStatus.classList.toggle(
    "hidden",
    academy.completed
  );

  elements.academyDayValue.textContent =
    academy.day;

  elements.actionPointPips.replaceChildren();

  for (
    let index = 0;
    index < academy.maxActionPoints;
    index += 1
  ) {
    const pip = document.createElement("span");
    pip.className = "resource-pip";

    if (index < academy.actionPoints) {
      pip.classList.add("active");
    }

    elements.actionPointPips.appendChild(pip);
  }

  const stressPercentage =
    academy.stress / academy.maxStress * 100;

  elements.stressMeter.style.width =
    `${stressPercentage}%`;

  if (academy.stress >= 5) {
    elements.stressMeter.style.backgroundColor =
      "#9c3028";
  } else if (academy.stress >= 3) {
    elements.stressMeter.style.backgroundColor =
      "#b88932";
  } else {
    elements.stressMeter.style.backgroundColor =
      "#688359";
  }

  elements.stressValue.textContent =
    `${academy.stress} / ${academy.maxStress}`;
}

/* =========================================================
   回饋訊息
   ========================================================= */

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

  elements.feedbackTitle.textContent =
    feedback.title;

  elements.feedbackText.textContent =
    feedback.text;

  elements.feedbackBox.classList.remove("hidden");
}

/* =========================================================
   能力要求
   ========================================================= */

function checkRequirement(requirement) {
  if (!requirement) return true;

  if (requirement.type === "all") {
    return requirement.requirements.every(checkRequirement);
  }

  if (requirement.type === "any") {
    return requirement.requirements.some(checkRequirement);
  }

  if (requirement.type === "flag") {
    return Boolean(gameState.flags[requirement.key]) === (requirement.value === undefined ? true : requirement.value);
  }

  if (requirement.type === "mastery") {
    return gameState.mastery[requirement.key] >= requirement.value;
  }

  if (requirement.type === "action") {
    return gameState.academy.actionCounts[requirement.key] >= requirement.value;
  }

  if (requirement.type === "stat") {
    return gameState.stats[requirement.key] >= requirement.value;
  }

  return true;
}

function createChoiceButton(choice) {
  const isAvailable = checkRequirement(choice.requirement);

  if (choice.hiddenWhenLocked && !isAvailable) {
    return null;
  }

  const button = document.createElement("button");
  button.className = "choice-button";
  button.disabled = !isAvailable;

  if (choice.isHiddenOption) {
    button.classList.add("hidden-choice-button");
  }

  const label = document.createElement("span");
  label.textContent = choice.text;
  button.appendChild(label);

  if (choice.description) {
    const description = document.createElement("span");
    description.className = "choice-description";
    description.textContent = choice.description;
    button.appendChild(description);
  }

  if (choice.requirement && !choice.hiddenWhenLocked) {
    const requirementText = document.createElement("span");
    requirementText.className = "requirement-text";
    requirementText.textContent = isAvailable
      ? `已符合：${choice.requirement.label || "能力要求"}`
      : choice.requirement.label || "尚未符合要求";
    button.appendChild(requirementText);
  }

  button.addEventListener("click", () => handleChoice(choice));
  return button;
}

/* =========================================================
   一般場景系統
   ========================================================= */

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

  elements.chapterTitle.textContent =
    scene.title;

  elements.sceneLocation.textContent =
    scene.location;

  elements.speakerName.textContent =
    scene.speaker;

  elements.dialogueText.textContent =
    formatText(scene.text);

  elements.progressText.textContent =
    scene.progress;

  showFeedback(feedback);
  updateStats();

  if (elements.academyStatus) {
    elements.academyStatus.classList.toggle(
      "hidden",
      gameState.academy.completed
    );
  }

  elements.choicesContainer.replaceChildren();

  scene.choices.forEach((choice) => {
    const button = createChoiceButton(choice);
    if (button) {
      elements.choicesContainer.appendChild(button);
    }
  });

  saveGame(true);
}


function choiceHasNegativeEffect(choice) {
  return Object.values(choice.effects || {}).some((amount) => amount < 0);
}

function isFormalWrongAnswer(choice) {
  return gameState.academy.completed &&
    gameState.currentScene !== "academyHub" &&
    gameState.currentScene !== "academyEvent" &&
    choice.wrongAnswer === true;
}

function getFailureLesson(choice) {
  if (choice.feedback && choice.feedback.text) return choice.feedback.text;

  const lessons = {
    court: "外交危機不能只靠藏匿或逃避；必須同時分析獻璧、拒秦及秦國失信的風險。",
    courtQuestion: "『報』在這個語境中解作答覆；全句是尋找可以出使並答覆秦國的人。",
    miaoXianStory: "藺相如根據燕弱趙強、繆賢受趙王寵信等證據，判斷燕王不會保護逃犯。",
    policyDebate: "先答應秦國不是因為信任秦王，而是為了使失信責任落在秦國一方。",
    qinArrival: "和氏璧仍在秦王手中時不宜躁進；藺相如先借『璧有瑕』取回主動。",
    jadeFlaw: "『璧有瑕』是取回玉璧的計策，重點是藺相如的機智和臨危判斷。",
    pillarThreat: "秦王展示地圖只是拖延；判斷承諾真偽要對照他先前取得玉璧後的實際行動。",
    fiveDayPlan: "既然秦王沒有交城誠意，就應先把和氏璧秘密送回趙國，避免再次受制。",
    finalCourt: "殺死藺相如不能取回玉璧，反而會破壞秦趙關係；秦王必須衡量實際得失。"
  };

  return lessons[gameState.currentScene] ||
    "作答時應以原文、人物處境和事件因果為證據，不能只憑表面印象。";
}

function renderBadEnding(choice) {
  const failedScene = gameState.currentScene;
  const scene = scenes[failedScene];
  const lesson = getFailureLesson(choice);

  gameState.failure = {
    sceneId: failedScene,
    sceneTitle: scene && scene.title || "任務判斷",
    answer: choice.text,
    lesson
  };
  gameState.currentScene = "badEnding";
  gameState.completed = true;

  elements.chapterTitle.textContent = "判斷失誤";
  elements.sceneLocation.textContent = "任務中止";
  elements.speakerName.textContent = "掌院先生";
  elements.progressText.textContent = "失敗結局";
  elements.dialogueText.textContent =
    `【壞結局】${scene && scene.title || "正式任務"}\n\n` +
    `你的選擇：${choice.text}\n\n` +
    "這個判斷使使團失去主動，趙國無法繼續把重要任務交給你。你被送回書院重新研習。\n\n" +
    `【任務結果】策略失效\n${lesson}\n\n` +
    `目前能力：文義 ${gameState.stats.meaning}｜明辨 ${gameState.stats.reasoning}｜` +
    `德行 ${gameState.stats.virtue}｜學識 ${gameState.stats.knowledge}`;

  if (elements.academyStatus) elements.academyStatus.classList.add("hidden");
  showFeedback({
    title: "錯誤分析",
    text: `這項策略忽略了關鍵條件。重新判斷時請留意：${lesson}`
  });
  updateStats();
  elements.choicesContainer.replaceChildren();

  const retryButton = document.createElement("button");
  retryButton.className = "choice-button";
  retryButton.textContent = "回到錯題重新作答";
  retryButton.addEventListener("click", () => {
    gameState.completed = false;
    gameState.failure = null;
    renderScene(failedScene);
  });

  const reportButton = document.createElement("button");
  reportButton.className = "choice-button";
  reportButton.textContent = "查看完整學習報告";
  reportButton.addEventListener("click", showReport);

  const restartButton = document.createElement("button");
  restartButton.className = "choice-button";
  restartButton.textContent = "重新挑戰本章";
  restartButton.addEventListener("click", restartGame);

  elements.choicesContainer.append(retryButton, reportButton, restartButton);
  saveGame(true);
}

function renderSavedBadEnding() {
  const failure = gameState.failure;
  if (!failure) {
    gameState.currentScene = "academyArrival";
    renderScene("academyArrival");
    return;
  }

  const syntheticChoice = {
    text: failure.answer,
    feedback: { text: failure.lesson }
  };
  gameState.currentScene = failure.sceneId;
  renderBadEnding(syntheticChoice);
}

function handleChoice(choice) {
  if (choice.action === "academyEventChoice") {
    resolveAcademyEvent(choice.eventId, choice.choiceIndex);
    return;
  }

  applyEffects(choice.effects);
  applyMastery(choice.masteryEffects);
  applyFlags(choice.flags);

  if (isFormalWrongAnswer(choice)) {
    renderBadEnding(choice);
    return;
  }

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
    openAcademy: () => renderAcademy(),
    showReport,
    returnTitle,
    restart: restartGame
  };

  if (actions[action]) {
    actions[action]();
  }
}


/* =========================================================
   書院隨機事件系統
   ========================================================= */

function applyFlags(flags = {}) {
  for (const [flag, value] of Object.entries(flags)) {
    if (flag in gameState.flags) gameState.flags[flag] = value;
  }
}

function hasSeenEvent(eventId) {
  return gameState.eventsSeen.includes(eventId);
}

function getEligibleAcademyEvents(actionId) {
  return Object.entries(academyEvents).filter(([eventId, event]) => {
    if (hasSeenEvent(eventId)) return false;
    return event.condition(actionId);
  });
}

function chooseRandomItem(items) {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function maybeTriggerAcademyEvent(actionId) {
  const academy = gameState.academy;
  const eligible = getEligibleAcademyEvents(actionId);
  if (eligible.length === 0) return false;

  const specialEvent = eligible.find(([, event]) => event.special);
  if (specialEvent) {
    renderAcademyEvent(specialEvent[0]);
    return true;
  }

  if (academy.eventTriggeredToday) return false;

  const eventChance = academy.day >= 5 ? 0.75 : 0.45;
  if (Math.random() > eventChance) return false;

  const selected = chooseRandomItem(eligible);
  if (!selected) return false;

  renderAcademyEvent(selected[0]);
  return true;
}

function createQuizChoice(text, optionIndex, onSelect) {
  const button = document.createElement("button");
  button.className = "choice-button quiz-choice";
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", () => onSelect(optionIndex, button));
  return button;
}

function createEventChoice(choice, choiceIndex, eventId) {
  return createQuizChoice(choice.text, choiceIndex, (selectedIndex) => {
    resolveAcademyEvent(eventId, selectedIndex);
  });
}

function renderAcademyEvent(eventId) {
  const event = academyEvents[eventId];
  if (!event) {
    console.error(`找不到書院事件：${eventId}`);
    renderAcademy();
    return;
  }

  gameState.currentScene = "academyEvent";
  gameState.academy.currentEvent = eventId;
  if (!hasSeenEvent(eventId)) gameState.eventsSeen.push(eventId);

  elements.chapterTitle.textContent = event.title;
  elements.sceneLocation.textContent = event.location;
  elements.speakerName.textContent = event.speaker;
  elements.dialogueText.textContent = formatText(event.text);
  elements.progressText.textContent = `第 ${gameState.academy.day} 日事件`;

  hideFeedback();
  updateStats();
  elements.choicesContainer.replaceChildren();

  shuffled(event.choices.map((choice, originalIndex) => ({ choice, originalIndex })))
    .forEach(({ choice, originalIndex }) => {
      elements.choicesContainer.appendChild(
        createEventChoice(choice, originalIndex, eventId)
      );
    });

  saveGame(true);
}

function resolveAcademyEvent(eventId, choiceIndex) {
  const event = academyEvents[eventId];
  const choice = event && event.choices[choiceIndex];
  if (!event || !choice) {
    renderAcademy();
    return;
  }

  applyEffects(choice.effects);
  applyMastery(choice.masteryEffects);
  applyFlags(choice.flags);

  if (choice.stress) {
    gameState.academy.stress += choice.stress;
    gameState.academy.stress = Math.min(
      gameState.academy.maxStress,
      Math.max(0, gameState.academy.stress)
    );
  }

  gameState.academy.eventTriggeredToday = true;
  gameState.academy.currentEvent = null;
  gameState.eventHistory.push({
    eventId,
    choiceIndex,
    day: gameState.academy.day
  });
  const outcome = choice.learningOutcome ||
    (choiceHasNegativeEffect(choice) ? "misconception" : "partial");
  const outcomeLabels = {
    complete: "理解完整",
    partial: "理解未全",
    misconception: "觀念偏差"
  };
  const nextStep = {
    complete: "你已能同時使用關鍵證據和推理方法。",
    partial: "你的想法有合理部分，但仍要補上被忽略的證據或因果。",
    misconception: "請重新核對語境、證據及事件因果，不要只看單一線索。"
  };
  const educationalFeedback = {
    title: `${outcomeLabels[outcome]}｜${choice.feedback && choice.feedback.title || event.title}`,
    text:
      `【你的判斷】${choice.text}\n\n` +
      `【分析】${choice.feedback && choice.feedback.text || "你完成了這次判斷。"}\n\n` +
      `【學習重點】${event.educationNote}\n\n` +
      `【改進方向】${nextStep[outcome]}`
  };

  gameState.academy.lastFeedback = educationalFeedback;
  elements.chapterTitle.textContent = event.title;
  elements.sceneLocation.textContent = event.location;
  elements.speakerName.textContent = event.speaker;
  elements.dialogueText.textContent = `你選擇了：${choice.text}`;
  elements.progressText.textContent = `第 ${gameState.academy.day} 日事件結果`;
  showFeedback(educationalFeedback);
  updateStats();
  elements.choicesContainer.replaceChildren();

  const continueButton = document.createElement("button");
  continueButton.className = "choice-button";
  continueButton.textContent = "返回書院";
  continueButton.addEventListener("click", () => renderAcademy(educationalFeedback));
  elements.choicesContainer.appendChild(continueButton);
  saveGame(true);
}

/* =========================================================
   書院養成畫面
   ========================================================= */

function createMasteryGrid() {
  const labels = {
    context: "時局",
    syntax: "句法",
    character: "人物",
    evidence: "引證"
  };

  const grid = document.createElement("div");
  grid.className = "mastery-grid";

  for (
    const [key, label]
    of Object.entries(labels)
  ) {
    const item = document.createElement("div");
    item.className = "mastery-item";

    const name = document.createElement("span");
    name.textContent = label;

    const value = document.createElement("strong");
    value.textContent = getMasteryLabel(
      gameState.mastery[key]
    );

    item.append(name, value);
    grid.appendChild(item);
  }

  return grid;
}

function createAcademyActionButton(actionId, action) {
  const academy = gameState.academy;
  const button = document.createElement("button");
  const isReview = actionId === "review";
  const lockedByDay = !isReview && academy.day < action.day;
  const noWrongQuestions = isReview && academy.wrongQuestionIds.length === 0;
  const cannotAct = academy.actionPoints <= 0 || lockedByDay || noWrongQuestions ||
    (academy.stress >= academy.maxStress && !isReview);

  button.className = "choice-button";
  button.disabled = cannotAct;

  const title = document.createElement("strong");
  title.textContent = action.name;
  const description = document.createElement("span");
  description.className = "choice-description";
  description.textContent = action.description;
  const result = document.createElement("span");
  result.className = "choice-result";

  if (lockedByDay) result.textContent = `第 ${action.day} 日解鎖`;
  else if (noWrongQuestions) result.textContent = "目前沒有錯題";
  else if (academy.actionPoints <= 0) result.textContent = "行動點不足";
  else if (academy.stress >= academy.maxStress && !isReview) result.textContent = "心疲已滿，請重溫錯題";
  else result.textContent = isReview ? "完成後心疲 -3" : `完成題組後結算，心疲 +${action.stress}`;

  button.append(title, description, result);
  button.addEventListener("click", () => startMiniGame(actionId));
  return button;
}

function renderAcademy(feedback = null) {
  const academy = gameState.academy;
  gameState.currentScene = "academyHub";
  academy.miniGame = null;

  elements.chapterTitle.textContent = "《廉頗藺相如列傳》五日備試";
  elements.sceneLocation.textContent = `修習第${academy.day}日`;
  elements.speakerName.textContent = "掌院先生";
  const chapterAtmosphere = {
    1: "書院收到趙境急報：秦王以十五城求和氏璧。掌院命你先破解國書中的文言句式。",
    2: "朝堂使者入院求策。你要在秦強趙弱的局勢中整理一條可行的外交路線。",
    3: "澠池風聲傳回趙境。史官留下的人物紀錄互有矛盾，等待你以行動和言語辨真。",
    4: "廉、藺失和的傳聞流入學宮。你要從殘卷找回能解釋將相抉擇的原文。",
    5: "焚典令的追兵逼近。你必須重整三卷史事，保存《廉頗藺相如列傳》的結構和思想。"
  };
  elements.dialogueText.textContent =
    `${chapterAtmosphere[academy.day]}\n\n今日只有一次行動機會；修習結果、特殊事件和後續劇情會記錄你的選擇。`;
  elements.progressText.textContent = `第 ${academy.day} / ${academy.maxDays} 日`;

  showFeedback(feedback);
  updateStats();
  if (elements.academyStatus) elements.academyStatus.classList.remove("hidden");
  elements.choicesContainer.replaceChildren();
  elements.choicesContainer.appendChild(createMasteryGrid());

  Object.entries(academyActions).forEach(([actionId, action]) => {
    elements.choicesContainer.appendChild(createAcademyActionButton(actionId, action));
  });

  const endDayButton = document.createElement("button");
  endDayButton.className = "choice-button";
  endDayButton.textContent = academy.day >= academy.maxDays ? "完成五日備試，接受朝廷徵召" : "結束今日修習";
  endDayButton.addEventListener("click", endAcademyDay);
  elements.choicesContainer.appendChild(endDayButton);
  saveGame(true);
}

function allMiniGameQuestions() {
  return Object.values(miniGameQuestions).flat();
}

function getQuestionById(id) {
  return allMiniGameQuestions().find((question) => question.id === id);
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function startMiniGame(actionId) {
  const academy = gameState.academy;
  const action = academyActions[actionId];
  if (!action || academy.actionPoints <= 0) return;
  if (academy.day < action.day && actionId !== "review") return;

  let questions;
  if (actionId === "review") {
    const available = academy.wrongQuestionIds.map(getQuestionById).filter(Boolean);
    if (available.length === 0) return;
    questions = [available[Math.floor(Math.random() * available.length)]];
  } else {
    questions = shuffled(miniGameQuestions[action.category]).slice(0, 3);
  }

  academy.miniGame = {
    actionId,
    category: action.category,
    questionIds: questions.map((question) => question.id),
    index: 0,
    correct: 0,
    hints: 0,
    answers: [],
    startedAt: Date.now(),
    currentHintUsed: false,
    currentAnswered: false,
    selectedDisplayIndex: null,
    optionOrders: questions.reduce((orders, question) => {
      orders[question.id] = shuffled(question.options.map((option, originalIndex) => ({ option, originalIndex })));
      return orders;
    }, {})
  };
  renderMiniGameQuestion();
}

function renderMiniGameQuestion() {
  const academy = gameState.academy;
  const session = academy.miniGame;
  if (!session) return renderAcademy();
  const question = getQuestionById(session.questionIds[session.index]);
  if (!question) return finishMiniGame();

  gameState.currentScene = "academyMiniGame";
  elements.chapterTitle.textContent = academyActions[session.actionId].name;
  elements.sceneLocation.textContent = `第 ${session.index + 1} / ${session.questionIds.length} 題`;
  elements.speakerName.textContent = "請選出最合適的答案";
  elements.dialogueText.textContent = question.prompt;
  elements.progressText.textContent = `題組進度 ${session.index + 1} / ${session.questionIds.length}`;
  hideFeedback();
  updateStats();
  elements.choicesContainer.replaceChildren();

  let order = session.optionOrders && session.optionOrders[question.id];
  if (!Array.isArray(order) || order.length !== question.options.length) {
    order = shuffled(question.options.map((option, originalIndex) => ({ option, originalIndex })));
    if (!session.optionOrders) session.optionOrders = {};
    session.optionOrders[question.id] = order;
  }

  const choiceButtons = [];
  order.forEach((item, displayIndex) => {
    const button = createQuizChoice(item.option, displayIndex, (selectedIndex) => {
      if (session.currentAnswered) return;
      session.selectedDisplayIndex = selectedIndex;
      choiceButtons.forEach((choiceButton, index) => {
        choiceButton.classList.toggle("selected", index === selectedIndex);
        choiceButton.setAttribute("aria-pressed", index === selectedIndex ? "true" : "false");
      });
      submitButton.disabled = false;
      saveGame(true);
    });
    button.setAttribute("aria-pressed", session.selectedDisplayIndex === displayIndex ? "true" : "false");
    if (session.selectedDisplayIndex === displayIndex) button.classList.add("selected");
    choiceButtons.push(button);
    elements.choicesContainer.appendChild(button);
  });

  const submitButton = document.createElement("button");
  submitButton.className = "choice-button";
  submitButton.textContent = "提交答案";
  submitButton.disabled = session.selectedDisplayIndex === null;
  submitButton.addEventListener("click", () => submitMiniGameAnswer());
  elements.choicesContainer.appendChild(submitButton);
  saveGame(true);
}

function submitMiniGameAnswer() {
  const academy = gameState.academy;
  const session = academy.miniGame;
  if (!session || session.currentAnswered || session.selectedDisplayIndex === null) return;
  const question = getQuestionById(session.questionIds[session.index]);
  const order = session.optionOrders[question.id];
  const selected = order[session.selectedDisplayIndex];
  const originalOptionIndex = selected.originalIndex;
  const isCorrect = originalOptionIndex === question.correct;

  session.currentAnswered = true;
  if (isCorrect) session.correct += 1;
  else if (!academy.wrongQuestionIds.includes(question.id)) academy.wrongQuestionIds.push(question.id);
  if (isCorrect) academy.wrongQuestionIds = academy.wrongQuestionIds.filter((id) => id !== question.id);
  session.answers.push({
    questionId: question.id,
    optionIndex: originalOptionIndex,
    isCorrect,
    hintUsed: false
  });

  showFeedback({
    title: isCorrect ? "作答正確" : "作答需要修正",
    text:
      `【你的答案】${question.options[originalOptionIndex]}\n\n` +
      `【正確答案】${question.options[question.correct]}\n\n` +
      `【原文與解析】${question.explanation}`
  });
  elements.choicesContainer.querySelectorAll("button").forEach((button) => { button.disabled = true; });

  const nextButton = document.createElement("button");
  nextButton.className = "choice-button";
  nextButton.disabled = false;
  nextButton.textContent = session.index + 1 >= session.questionIds.length ? "查看題組結算" : "下一題";
  nextButton.addEventListener("click", () => {
    session.index += 1;
    session.currentAnswered = false;
    session.selectedDisplayIndex = null;
    if (session.index >= session.questionIds.length) finishMiniGame();
    else renderMiniGameQuestion();
  });
  elements.choicesContainer.appendChild(nextButton);
  saveGame(true);
}

function finishMiniGame() {
  const academy = gameState.academy;
  const session = academy.miniGame;
  if (!session) return renderAcademy();
  const action = academyActions[session.actionId];
  const total = session.questionIds.length;
  const accuracy = session.correct / total;
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
  const noHintBonus = session.hints === 0 ? 1 : 0;
  const performance = accuracy === 1 ? "融會貫通" : accuracy >= 0.67 ? "基本掌握" : "尚待重溫";

  const effects = {};
  const masteryEffects = {};
  if (session.actionId === "review") {
    effects.knowledge = session.correct > 0 ? 1 : 0;
  } else if (session.category === "translation") {
    effects.meaning = session.correct + noHintBonus;
    effects.knowledge = accuracy >= 0.67 ? 1 : 0;
    masteryEffects.syntax = accuracy >= 0.67 ? 1 : 0;
    if (accuracy === 1) gameState.flags.correctedReport = true;
  } else if (session.category === "strategy") {
    effects.reasoning = session.correct + noHintBonus;
    masteryEffects.context = accuracy >= 0.67 ? 1 : 0;
    if (accuracy === 1) gameState.flags.merchantInsight = true;
  } else if (session.category === "character") {
    effects.reasoning = session.correct;
    effects.knowledge = accuracy >= 0.67 ? 1 : 0;
    masteryEffects.character = accuracy >= 0.67 ? 1 : 0;
    masteryEffects.evidence = accuracy === 1 ? 1 : 0;
    if (accuracy === 1) gameState.flags.evidenceTraining = true;
  } else if (session.category === "quotation") {
    effects.meaning = session.correct;
    effects.knowledge = session.correct + noHintBonus;
    masteryEffects.evidence = accuracy >= 0.67 ? 1 : 0;
  } else if (session.category === "structure") {
    effects.knowledge = session.correct + noHintBonus;
    effects.reasoning = accuracy >= 0.67 ? 1 : 0;
    masteryEffects.context = accuracy === 1 ? 1 : 0;
    masteryEffects.character = accuracy >= 0.67 ? 1 : 0;
  }

  applyEffects(effects);
  applyMastery(masteryEffects);
  academy.actionPoints -= 1;
  academy.stress = Math.min(academy.maxStress, Math.max(0, academy.stress + action.stress));
  academy.actionCounts[session.actionId] = (academy.actionCounts[session.actionId] || 0) + 1;
  academy.completedGames[session.category] = Math.max(academy.completedGames[session.category] || 0, Math.round(accuracy * 100));

  const coreCategories = ["translation", "strategy", "character", "quotation", "structure"];
  if (coreCategories.every((category) => academy.completedGames[category] >= 67)) {
    gameState.flags.teacherGuidance = true;
  }

  const changes = Object.entries(effects).filter(([, value]) => value).map(([key, value]) => `${{meaning:"文義",reasoning:"明辨",virtue:"德行",knowledge:"學識"}[key]} +${value}`).join("｜") || "沒有能力加分";
  const feedback = {
    title: `${performance}｜${action.name}`,
    text: `答對 ${session.correct} / ${total} 題｜提示 ${session.hints} 次｜用時 ${elapsedSeconds} 秒\n\n【能力結算】${changes}\n\n【錯題庫】目前有 ${academy.wrongQuestionIds.length} 題，翌日可用「錯題重溫」再答。`
  };
  academy.lastFeedback = feedback;
  academy.miniGame = null;

  const eventActionMap = {
    translation: "translation",
    strategy: "politics",
    character: "character",
    quotation: "quotation",
    structure: "structure",
    review: "review"
  };
  const eventStarted = maybeTriggerAcademyEvent(eventActionMap[session.actionId] || session.actionId);
  if (!eventStarted) renderAcademy(feedback);
}

function endAcademyDay() {
  const academy = gameState.academy;
  if (academy.actionPoints > 0 && !window.confirm(`今日尚有 ${academy.actionPoints} 個行動點。確定提早結束嗎？`)) return;

  if (academy.day >= academy.maxDays) {
    academy.completed = true;
    academy.lastFeedback = null;
    academy.miniGame = null;
    renderScene("academySummons");
    return;
  }

  academy.day += 1;
  academy.dailyActions = [];
  academy.lastFeedback = null;
  academy.miniGame = null;
  academy.currentEvent = null;
  academy.eventTriggeredToday = false;
  academy.stress = Math.max(0, academy.stress - 1);
  academy.actionPoints = academy.maxActionPoints;
  renderAcademy({
    title: `第${academy.day}日｜${academyDayThemes[academy.day]}`,
    text: academy.wrongQuestionIds.length > 0
      ? `晨鐘響起。今日只有一次行動機會；錯題卷中仍有 ${academy.wrongQuestionIds.length} 道疑案，可選擇重查舊卷或推進修習。`
      : "晨鐘響起。今日只有一次行動機會，你的判斷會影響文心、事件旗標和主線選項。"
  });
}

function showReport() {
  const total =
    gameState.stats.meaning +
    gameState.stats.reasoning +
    gameState.stats.virtue +
    gameState.stats.knowledge;

  let rank = "初入文門";

  if (total >= 28) {
    rank = "文武兼備";
  } else if (total >= 20) {
    rank = "明辨之士";
  } else if (total >= 12) {
    rank = "好學弟子";
  }

  const masteryNames = {
    context: "時局",
    syntax: "句法",
    character: "人物",
    evidence: "引證"
  };

  const masteryReport = Object.entries(
    masteryNames
  )
    .map(([key, name]) => {
      return (
        `${name}：` +
        getMasteryLabel(gameState.mastery[key])
      );
    })
    .join("\n");

  const suggestions = [];

  if (gameState.mastery.context < 2) {
    suggestions.push(
      "重溫秦強趙弱及趙國獻璧的兩難。"
    );
  }

  if (gameState.mastery.syntax < 2) {
    suggestions.push(
      "加強倒裝句、被動句及重要字詞語譯。"
    );
  }

  if (gameState.mastery.character < 2) {
    suggestions.push(
      "以具體言語和行動分析藺相如的智與勇。"
    );
  }

  if (gameState.mastery.evidence < 2) {
    suggestions.push(
      "把關鍵原文與人物特點、事件原因連結。"
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "你已掌握本章基礎，可挑戰不設選項的問答模式。"
    );
  }

  elements.speakerName.textContent =
    "學習報告";

  elements.dialogueText.textContent =
    `${gameState.playerName}，你完成了「完璧歸趙」。\n\n` +
    `文義：${gameState.stats.meaning}\n` +
    `明辨：${gameState.stats.reasoning}\n` +
    `德行：${gameState.stats.virtue}\n` +
    `學識：${gameState.stats.knowledge}\n\n` +
    `${masteryReport}\n\n` +
    `本章評級：${rank}\n\n` +
    `修習建議：\n${suggestions.join("\n")}`;

  elements.sceneLocation.textContent =
    "書院評鑑";

  elements.progressText.textContent =
    "學習報告";

  hideFeedback();

  elements.choicesContainer.replaceChildren();

  const replayButton =
    document.createElement("button");

  replayButton.className = "choice-button";
  replayButton.textContent = "重新挑戰";
  replayButton.addEventListener(
    "click",
    restartGame
  );

  const titleButton =
    document.createElement("button");

  titleButton.className = "choice-button";
  titleButton.textContent = "返回開始畫面";
  titleButton.addEventListener(
    "click",
    returnTitle
  );

  elements.choicesContainer.append(
    replayButton,
    titleButton
  );
}

/* =========================================================
   新遊戲、存檔和讀檔
   ========================================================= */

function startNewGame() {
  const enteredName =
    elements.playerNameInput.value.trim();

  gameState = cloneDefaultState();

  gameState.playerName =
    enteredName || "無名";

  switchScreen("game");
  renderScene("academyArrival");
}

function saveGame(isAutoSave = false) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(gameState)
    );

    const time = new Date().toLocaleTimeString(
      "zh-HK",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

    elements.autosaveText.textContent =
      `${isAutoSave ? "自動儲存" : "已儲存"}：${time}`;

    elements.continueButton.disabled = false;
  } catch (error) {
    console.error("儲存失敗：", error);
    elements.autosaveText.textContent =
      "儲存失敗";
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
        ...(parsedData.stats || {})
      },
      academy: {
        ...defaultState.academy,
        ...(parsedData.academy || {}),
        actionCounts: {
          ...defaultState.academy.actionCounts,
          ...(parsedData.academy && parsedData.academy.actionCounts || {})
        },
        wrongQuestionIds: Array.isArray(parsedData.academy && parsedData.academy.wrongQuestionIds)
          ? parsedData.academy.wrongQuestionIds : [],
        completedGames: {
          ...defaultState.academy.completedGames,
          ...(parsedData.academy && parsedData.academy.completedGames || {})
        },
        dailyActions: Array.isArray(parsedData.academy && parsedData.academy.dailyActions)
          ? parsedData.academy.dailyActions
          : []
      },
      mastery: {
        ...defaultState.mastery,
        ...(parsedData.mastery || {})
      },
      flags: {
        ...defaultState.flags,
        ...(parsedData.flags || {})
      },
      eventsSeen: Array.isArray(parsedData.eventsSeen) ? parsedData.eventsSeen : [],
      eventHistory: Array.isArray(parsedData.eventHistory) ? parsedData.eventHistory : [],
      visitedScenes: Array.isArray(parsedData.visitedScenes) ? parsedData.visitedScenes : []
    };

    gameState.academy.maxActionPoints = 1;
    gameState.academy.actionPoints = Math.min(1, gameState.academy.actionPoints);

    switchScreen("game");

    if (gameState.currentScene === "badEnding" && gameState.failure) {
      renderSavedBadEnding();
    } else if (
      gameState.currentScene === "academyEvent" &&
      gameState.academy.currentEvent &&
      academyEvents[gameState.academy.currentEvent]
    ) {
      renderAcademyEvent(gameState.academy.currentEvent);
    } else if (gameState.currentScene === "academyMiniGame" && gameState.academy.miniGame) {
      renderMiniGameQuestion();
    } else if (gameState.currentScene === "academyHub") {
      renderAcademy(gameState.academy.lastFeedback);
    } else if (scenes[gameState.currentScene]) {
      renderScene(gameState.currentScene);
    } else {
      gameState.currentScene = "academyArrival";
      renderScene("academyArrival");
    }
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

  const currentName =
    gameState.playerName;

  localStorage.removeItem(SAVE_KEY);

  gameState = cloneDefaultState();
  gameState.playerName = currentName;

  switchScreen("game");
  renderScene("academyArrival");
}

function returnTitle() {
  saveGame(true);
  switchScreen("title");

  elements.saveMessage.textContent =
    "遊戲進度已保留。";

  updateContinueButton();
}

function updateContinueButton() {
  const hasSave = Boolean(
    localStorage.getItem(SAVE_KEY)
  );

  elements.continueButton.disabled =
    !hasSave;
}

/* =========================================================
   鍵盤及按鈕事件
   ========================================================= */

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

/* =========================================================
   初始化
   ========================================================= */

updateContinueButton();
