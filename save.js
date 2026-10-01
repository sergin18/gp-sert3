'use strict';
/* SAVE — persistência em localStorage (v2) com migração do v1 */

const SAVE = 'sertania_save_v2', SAVE1 = 'sertania_save_v1';

const save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} };
const load = () => { try { let s = JSON.parse(localStorage.getItem(SAVE)); if (!s) s = JSON.parse(localStorage.getItem(SAVE1)); return s ? migrate(s) : null; } catch (e) { return null; } };
const hasSave = () => { const s = load(); return !!(s && s.ind && !s.done); };

function migrate(s) { s.council = s.council || createCouncil(0); s.projects = s.projects || []; s.news = s.news || []; s.votes = s.votes || []; s.unl = s.unl || []; s.blocked = s.blocked || {}; s.plN = s.plN || 0; if (s.advisor === undefined) s.advisor = null; return s; }

const deleteSave = () => { try { localStorage.removeItem(SAVE); localStorage.removeItem(SAVE1); } catch (e) {} };
