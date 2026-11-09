/**
 * 寫劇情用的小工具，用法見同資料夾的 README.md。
 */

/** 一句台詞：畫面文字、實際朗讀內容（省略就唸畫面文字，'' 不唸）、音檔路徑（優先於朗讀） */
export function say(text, speak, voice) {
  return { type: 'say', text, speak, voice };
}

/** 選項，必須緊接在一句 say 後面，選項會跟那句話一起出現；選完自動接回下一步 */
export function ask(...options) {
  return { type: 'ask', options };
}

/** ask 裡的一個選項：按鈕文字、選了之後的台詞（可以是空陣列） */
export function option(label, steps = []) {
  return { label, steps };
}

/** 顯示一句話，等使用者把聲音關掉、連續無聲後才繼續 */
export function waitForSilence(line) {
  return { type: 'waitForSilence', line };
}

const MAX_OPTIONS = 3;

function checkSteps(steps, where, errors) {
  if (!Array.isArray(steps)) {
    errors.push(`${where}：台詞必須是陣列`);
    return;
  }
  steps.forEach((step, i) => {
    const at = `${where} 第 ${i + 1} 步`;
    if (step?.type === 'say') {
      if (!step.text) errors.push(`${at}：say 沒有文字`);
    } else if (step?.type === 'waitForSilence') {
      if (step.line?.type !== 'say') errors.push(`${at}：waitForSilence 裡要放一句 say`);
    } else if (step?.type === 'ask') {
      if (steps[i - 1]?.type !== 'say') errors.push(`${at}：ask 前面必須緊接一句 say`);
      if (!step.options.length || step.options.length > MAX_OPTIONS) {
        errors.push(`${at}：選項要有 1～${MAX_OPTIONS} 個`);
      }
      step.options.forEach((o) => {
        if (!o?.label) errors.push(`${at}：有選項沒有文字`);
        else checkSteps(o.steps, `${at}「${o.label}」`, errors);
      });
    } else {
      errors.push(`${at}：不認得的步驟，請用 say、ask 或 waitForSilence`);
    }
  });
}

/** 檢查所有劇情，回傳錯誤訊息陣列 */
export function validateStories(stories) {
  const errors = [];
  const seen = new Set();
  stories.forEach((story, i) => {
    const name = story?.id || `第 ${i + 1} 個檔案`;
    if (!story?.id) errors.push(`${name}：沒有 id，或沒有 export default`);
    else if (seen.has(story.id)) errors.push(`${name}：id 重複`);
    seen.add(story?.id);
    if (!story?.script?.length) errors.push(`${name}：script 是空的`);
    else checkSteps(story.script, name, errors);
  });
  return errors;
}
