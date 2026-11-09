import { say, ask, option } from './_dsl.js';

export default {
  id: 'tua-18-difference',
  script: [
    say('這裡是TUA-18號星。', 'This is star T U A eighteen.'),
    say('你好。', 'Hi there.'),
    say('我能問個問題嗎？', 'Can I ask you something?'),
    say('人類跟機器人的差別是甚麼？', "What's the difference between humans and robots?"),
    ask(
      option('感覺', [
        say('是嗎？但最近，我偶爾也會感到寂寞。', 'Is that so? But lately, I get a little lonely sometimes too.'),
      ]),
      option('記憶', [
        say('是嗎？但最近，我偶爾會清空某些記憶來拓展其他記憶。', 'Is that so? But lately, I sometimes clear out a few memories to make room for others.'),
        say('啊，但我沒有打算忘記我們的對話。', "Oh, but I'm not planning to forget our talk."),
      ]),
      option('不知道', [
        say('我是被創造出來的，人類也是。', 'I was created. So were humans.'),
        say('也許驚人的相似也不一定。', "Maybe we're surprisingly alike."),
      ]),
    ),

    say('時間到了。謝謝你陪我聊天，我該走了。', "Looks like it's time. Thank you for talking with me. I should go now."),
    say('下次見。', 'See you next time.'),
  ],
};
