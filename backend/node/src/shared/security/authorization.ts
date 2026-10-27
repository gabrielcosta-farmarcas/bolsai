import type { CurrentUser } from './current-user.js';

// Ponto único de autorização por dono: só a líder dona do registro o vê.
// Nega por padrão: sem dono conhecido, ninguém passa.
export type OwnedRecord = { leaderId: string };

const isOwner = (user: CurrentUser, record: OwnedRecord): boolean =>
  user.leaderId.length > 0 && record.leaderId === user.leaderId;

export const canViewDirectReport = (user: CurrentUser, report: OwnedRecord): boolean =>
  isOwner(user, report);

export const canViewSession = (user: CurrentUser, session: OwnedRecord): boolean =>
  isOwner(user, session);

export const canViewAnalysis = (user: CurrentUser, analysis: OwnedRecord): boolean =>
  isOwner(user, analysis);

export const canViewAgreement = (user: CurrentUser, agreement: OwnedRecord): boolean =>
  isOwner(user, agreement);

export const canViewResponsibilityMap = (user: CurrentUser, map: OwnedRecord): boolean =>
  isOwner(user, map);

export const canViewResponsibility = (user: CurrentUser, responsibility: OwnedRecord): boolean =>
  isOwner(user, responsibility);

export const canViewNote = (user: CurrentUser, note: OwnedRecord): boolean => isOwner(user, note);
