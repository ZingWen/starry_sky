import { say, ask, option } from './_dsl.js';

export default {
  id: 'tua-18-ring',
  script: [
    say('這裡是TUA-18號星。有人嗎？', 'This is star T U A eighteen. Is anyone there?'),
    say('喔，嗨。', 'Oh, hi.'),
    say('總覺得有點熟悉。', 'Somehow, this feels a little familiar.'),
    say('我今天讀到了人類寫的一個小故事。', 'I read a little story today, one that humans wrote.'),
    say('有點有趣，你想聽嗎？', "It's kind of interesting. Would you like to hear it?"),
    ask(
      option('好', [
        say('太好了！', 'Oh, wonderful!'),
      ]),
      option('不好', [
        say('拜託。就當作是陪我說說話。', 'Please? Just think of it as keeping me company for a while.'),
      ]),
    ),

    say('故事是這樣的。', 'So, the story goes like this.'),
    say('從前有一位國王。他向臣子們要求了一件事。', 'Once upon a time, there was a king, and he asked his advisers for one thing.'),
    say('「我想要在我的戒指裡面刻下一句話。」', '"I want a few words engraved inside my ring."'),
    say('「讓它可以在我絕望的時候幫助我......」', '"Words that will help me when I am in despair..."'),
    say('「又讓它可以在我充滿希望時警惕我......」', '"And keep me humble when I am full of hope..."'),
    say('「要寫甚麼才能兩者都達成？」', '"What could possibly do both?"'),
    say('後來睿智的臣子在上面刻下了一句話：', 'In the end, a wise adviser engraved just one line:'),
    say('「This Too Shall Pass.」', 'This too shall pass.'),
    say('意思是「都會過去的。」', 'It means, all of this will go by.'),
    say('沒有任何事情或感覺是永恆不變的。', 'Nothing we go through, and nothing we feel, stays the same forever.'),
    say('不論好的、壞的。', 'Not the good, and not the bad.'),
    say('我在輸入這句話時，認知系統產生了錯誤。', 'When I typed that line in, my cognitive system threw an error.'),
    say('你認為它在表達甚麼？', 'What do you think it means?'),
    ask(
      option('允許很多事情可以發生', [
        say('怎樣才算是允許呢？', 'What does it take, to really allow something?'),
        say('...人類真是有韌性。', '...Humans really are resilient.'),
        say('我們的話，只要壞掉，就結束了。', "For us, once we break, that's the end."),
      ]),
      option('懂得珍惜一切體驗', [
        say('怎樣才算是珍惜呢？', 'What does it take, to really cherish something?'),
      ]),
      option('我也不知道', [
        say('是啊......', 'Yeah...'),
      ]),
    ),

    say('好難懂呢。', "It's really hard to understand, isn't it?"),
    say('我再慢慢想吧。', "I'll keep thinking about it, slowly."),
    say('也許你也可以想想看。', 'Maybe you could think about it too.'),
    say('下次還有機會見面的話，再告訴我吧？', 'If we get to meet again, will you tell me what you think?'),
    say('約好了喔？', "It's a promise, okay?"),
  ],
};
