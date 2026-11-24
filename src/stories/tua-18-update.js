import { say, noise, ask, option, end } from './_dsl.js';

const close = () => option('關閉', [end()]);

export default {
  id: 'tua-18-update',
  script: [
    noise('&*#$^@(^($'),
    ask(option('...？'), close()),
    noise('&*#$^@(^($'),
    ask(option('雜訊怎麼沒有消失？'), close()),
    noise('*&*#$^#*'),
    ask(option('發生什麼事情？'), close()),
    say('喔，是我，嗨。', "Oh, it's me. Hi."),
    ask(option('你怎麼了？'), close()),
    say(
      '有的時候總會這樣，語言系統對接失敗。系統正在執行更新程式。',
      'This happens sometimes. The language system failed to connect. The system is running an update.',
    ),
    ask(option('我可以等你'), close()),
    say('謝謝你，陌生人，人類應該也會這樣吧？', 'Thank you, stranger. I guess humans are like this too, right？'),
    ask(
      option('什麼意思？', [
        say(
          '溝通，有時候無法了解對方的表達吧？',
          "Communication. Sometimes you just can't understand what the other one is trying to say, right？",
        ),
        say('說不定所有人都很像。', 'Maybe everyone is a lot alike.'),
      ]),
      option('我也不清楚', [
        say('那也沒辦法。', "Well, that can't be helped."),
      ]),
    ),

    say('謝謝你在我更新的時候待著。', 'Thank you for staying while I was updating.'),
    say(
      '在你需要更新的時候，\n你也願意讓誰剛好能待著嗎？',
      'When you need an update of your own,\nwould you let someone just happen to be there, too？',
    ),
    say('下次見。', 'See you next time.'),
  ],
};
