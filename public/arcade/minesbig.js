// 踩地雷（大盤）: 10 × 14 with 24 mines, a long game. Same rules as the 8×8.
import { makeMines } from './mines.js';

export default api => makeMines(api, { W: 10, H: 14, N: 24, win: 60, par: 10 * 60 });
