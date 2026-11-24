import { say, ask, option } from './_dsl.js';

// 分支比較深，把第三層抽出來，主流程比較好讀
const whyObserve = [
  say('這個...', 'Well...'),
  say('因為這是我被設定出來的工作，', "It's the job I was set up to do."),
  say('還有就是，創造我的人也做了個備註，', 'And also, the person who made me left a note.'),
  say('雖然那就不是工作了...你想知道嗎？', "Though that part isn't really work... Would you like to know?"),
  ask(
    option('想', [
      say('上面是這樣寫的，我唸給你聽：', "Here's what it says. Let me read it to you."),
      say('「因為待在這裡的人害怕人類，', 'The one who stays here is afraid of people,'),
      say('所以讓機器人來偶爾說說話，', 'so let a robot come and talk once in a while.'),
      say('只是偶爾就可以，', 'Just once in a while is enough.'),
      say('需要的時候在，不需要的時候就不用。」', "Be there when it's needed, and step back when it's not."),
      say('我的開發者很怪吧，我也覺得。', "My developer's a little strange, right? I think so too."),
      say('以我目前的資料庫，還無法解釋這個行為背後的意義。', "With my current database, I still can't explain what it really means."),
    ]),
    option('現在先不用', [
      say('OK，那我先繼續忙了。', "Okay. Then I'll get back to work."),
    ]),
  ),
];

export default {
  id: 'tua-18-note',
  script: [
    say('喔，嗨，是我，在TUA-18的機器人。', "Oh, hi. It's me, the robot from T U A eighteen."),
    ask(
      option('嗨', [
        say('喔，你好，今天也一切順利。', "Oh, hello. Everything's going fine here today too."),
      ]),
      option('你為甚麼會在這裡工作？', [
        say(
          '這麼突然的問題？因為我負責觀測TUA-18。',
          "Kind of a sudden question, huh? It's because I'm in charge of observing T U A eighteen.",
        ),
        ask(
          option('我知道了', [
            say('好的，祝你今天也一切順利。', 'Alright. I hope everything goes well for you today too.'),
          ]),
          option('為甚麼要觀測TUA-18？', whyObserve),
        ),
      ]),
    ),
  ],
};
