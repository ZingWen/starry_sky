// 新增劇情：複製這個檔案、改掉檔名開頭的底線，例如 my-story.js，id 要跟其他劇情不同
import { say, ask, option } from './_dsl.js';

export default {
  id: 'my-story',
  script: [
    say('這裡是畫面文字。', 'This is what gets read aloud.'),
    say('你今天好嗎？', 'How are you today?'),

    ask(
      option('很好', [
        say('真為你開心。', "I'm happy for you."),
      ]),
      option('不太好', [
        say('這樣啊。', 'I see.'),
      ]),
    ),

    // 不管選哪個都會接到這裡
    say('下次見。', 'See you next time.'),
  ],
};
