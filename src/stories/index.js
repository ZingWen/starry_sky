// 自動載入這個資料夾的所有劇情；底線開頭的檔案（工具、設定、模板）不算劇情
import { validateStories } from './_dsl.js';

const modules = import.meta.glob(['./*.js', '!./_*.js', '!./index.js'], { eager: true });

export const SURPRISES = Object.values(modules).map((module) => module.default);

if (import.meta.env.DEV) {
  validateStories(SURPRISES).forEach((error) => console.error(`[劇情錯誤] ${error}`));
}
