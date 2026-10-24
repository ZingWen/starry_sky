/**
 * Whisper 模式的台詞。
 *
 * 兩種組別：
 *   { left: '…', right: '…' }  問答：先出現左上的對話框，8 秒後右邊的對話框回應
 *   { center: '…' }            獨白：畫面正中間直接顯示文字，沒有對話框
 *
 * 想自己換行就在文字裡加 \n，例如 '第一行\n第二行'。
 *
 * 新增、修改或刪除組別只要改這個陣列即可，播放時會隨機挑選，且不會連續出現同一組。
 * 每 3 組問答之後會穿插 1 組 center（次數在 src/ui/whisper.js 的 PAIRS_PER_CENTER 調整）。
 *
 * 加上 main: true 的那一組是主軸：
 *   Quiet 模式：左上固定顯示它的 left（沒有 right），介面隱藏時跟著隱藏
 *   Whisper 模式：每次開始都先播這一組
 */
export const WHISPERS = [
  { main: true, left: '「我想回家， \n 但我的家不在地球上。」', right: '「宇宙很大，總有個地方， \n 能讓你好好呼吸、休息。」' },
  { left: '「我找不到。」', right: '「那就抬頭吧，它一直都在那裡。」' },
  { left: '「我好累。」', right: '「沒關係。休息一下吧。」' },
  { left: '「感受不到感覺了。」', right: '「沒關係。」' },
  { left: '「我覺得我跟人類格格不入。」', right: '「沒關係。做個可愛的外星人也挺好。」' },
  { left: '「我不想工作。」', right: '「咦...沒關係。」' },
  { left: '「我要說壞話了。」', right: '「好。我在聽。」' },
  { left: '「現在要幹嘛?」', right: '「不知道。都行吧?」' },
  { left: '「你聽得見星星的聲音嗎？」', right: '「聽得見。它們在跟著音樂呼吸。」' },
  { left: '「Does it matter if the stars aren’t that bright?」', right: '「The sky has room for all of them.」' },
  { left: '「What if I leave nothing behind?」', right: '「You don’t have to leave a mark \n to have been here.」' },
  { left: '「What if I’m just a lost star with nowhere to go?」', right: '「Stars have the right to wander.」' },
  { left: '「I miss a place I’ve never even been to.」', right: '「I hope one day you’ll recognize it.」' },
  { left: '「I don’t think there’s a place \n for someone like me.」', right: '「Hey...you deserve to simply exist.」' },

  { center: 'Let’s stay awake, let’s talk about \n whatever you’re afraid to say out loud.' },
  { center: 'You don’t have to be meant for anything. \n You’re allowed to simply be.' },
  { center: 'Hey, You really deserve it.' },
  { center: '嘿，好好吃飯，好好睡覺。' },
  { center: '你不用做甚麼，就很好了。' },
  { center: '你僅僅是存在，就很美好。' },
  { center: '你真的超棒的，我打從心底這麼覺得。' },
  { center: '嚕嚕嚕嚕嚕嚕嚕(雜訊)。' },
];
