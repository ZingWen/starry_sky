import { say, ask, option } from './_dsl.js';

export default {
  id: 'tua-18-lowpower',
  script: [
    say('這裡是TUA-18號星。', 'This is star T U A eighteen.'),
    say('喂喂喂？', 'Hello? Hello, hello?'),
    say('啊，你在啊。', 'Oh, there you are.'),
    say('我今天電源很低，就不說太多話了。', "My power's running pretty low today, so I won't talk much."),
    ask(
      option('我怎麼幫你充電？', [
        say('沒關係，我自己有方法', "It's okay, I have my own way."),
        say('而且現在不急著充電。', "Besides, there's no rush to charge right now."),
        say('還是謝謝你。', 'But thank you, really.'),
      ]),
      option('我也是', [
        say('那就一起安靜待著吧？', "Then why don't we just stay here quietly, together?"),
      ]),
      option('......', [
        say('謝謝你一起待在這裡。', 'Thank you for staying here with me.'),
      ]),
    ),
  ],
};
