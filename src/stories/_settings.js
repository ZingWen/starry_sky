/**
 * 瀏覽器語音設定。rate 是語速（1 為正常），pitch 是音高（0~2）。
 * voices 由前往後找，名稱包含該文字就使用；都找不到時交給瀏覽器挑同語言的語音。
 * 朗讀內容有中文字就用 zh，否則用 en。
 */
export const SPEECH = {
  rate: 0.85,
  pitch: 1,
  voices: {
    zh: [
      'HsiaoChen',
      'HsiaoYu',
      'Google 國語'
    ],
    en: [
      'Aria',
      'Jenny',
      'Google US English'
    ]
  }
};
