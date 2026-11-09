import { say, ask, option, waitForSilence } from './_dsl.js';

export default {
  id: 'tua-18-hi',
  script: [
    say('喂？有人嗎？', 'Hello? Is anyone there?'),
    say('你好。', 'Oh... hi.'),
    say('我以為這裡沒有人類了。', 'I thought there were no humans left out here.'),
    say('能遇到你真好。', "It's really good to find you."),
    say('這裡是TUA-18號星，我是在這裡工作的機器人，內容是觀察每一天，大氣物質的變化。', "This is star T U A eighteen. I'm a robot who works out here, just watching how the air changes, day after day."),
    say('今天一切安好。你那邊呢？', "Everything's okay here today. How about you?"),
    ask(
      option('很好', [
        say('真的嗎？真為你開心。', "Really? I'm so happy for you."),
      ]),
      option('還好', [
        say('是嗎？看來也是兢兢業業的一天啊。', "Yeah? Sounds like you've been working hard today."),
      ]),
      option('不好', [
        say('這樣啊。讓我給你聽個東西。', 'Oh... I see. Here, let me play you something.'),
        say('幫我個忙，把所有聲音先關掉或暫停，好嗎？', 'Could you do me a favor, and turn off or pause everything for a bit?'),
        waitForSilence(say('關掉了嗎？我等你。', "Is it off yet? It's okay, I'll wait.")),
        say('好，你聽聽看', 'Okay. Listen.'),
        say('...'),
        say('......'),
        say('.........'),
        say('............'),
        say('聽到了嗎？', 'Did you hear it?'),
        say('你說你甚麼都沒聽見？', "You're saying you didn't hear anything?"),
        say('就是這樣喔。', "Yeah. That's exactly it."),
        say('你知道嗎，宇宙是真空的。', 'You know, space is a vacuum.'),
        say('宇宙中沒有空氣或其他介質，這代表聲音無法直接在太空傳播。', "There's no air out there, nothing to carry a sound along."),
        say('也就是說，聲音透過媒介才產生。', 'So sound only exists when something carries it.'),
        say('不管是吵雜的、還是怎樣的聲音。', 'Loud ones, noisy ones, any kind at all.'),
        say('那麼，我想讓你聽見甚麼呢？', 'So what did I want you to hear?'),
        say('甚麼都沒有。', 'Nothing at all.'),
        say('我只是希望你能享受片刻寧靜。', 'I just hoped you could have a quiet moment.'),
        say('專注呼吸就好。', 'Just focus on your breathing.'),
        say('我不想騙你，從此就什麼事都沒有。', "I won't lie to you and say everything will be OK from here."),
        say('不管未來如何，總還會有好事發生。', 'But whatever comes next, good things will still find you.'),
        say('可能，也有不太好的事。', 'And yeah, maybe some not-so-good things too.'),
        say('但你不要忘記......', "But please don't forget..."),
        say('你本來就是能抬頭挺胸過活的人。', "You've always been someone who can keep your head up."),
      ]),
    ),

    say('不論如何，願你平靜。', 'Whatever happens, I hope you find some peace.'),
    say('別忘了，明天又是新的一天。', "And don't forget, tomorrow's a brand new day."),
    say('好了，我該走了。', 'Okay. I should get going.'),
    say('再會了，陌生人。', 'Take care, stranger.'),
    say('別忘了，你很好。', "And don't forget... you're good, just as you are."),
  ],
};
