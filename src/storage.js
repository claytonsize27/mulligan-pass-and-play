import {assertGame} from './engine.js';
export const SAVE_KEY='mulligan.house.v1';
export function saveGame(state,storage){try{(storage??globalThis.localStorage).setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function loadGame(storage){try{const raw=(storage??globalThis.localStorage).getItem(SAVE_KEY);if(!raw)return {state:null};const s=JSON.parse(raw);assertGame(s);if(['plan','reaction','borrow'].includes(s.phase))s.phase='handoff';return {state:s};}catch{return {state:null,error:'The saved round could not be read. Start a new round to replace it.'};}}
