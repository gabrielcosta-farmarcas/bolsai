export { ResponsibilityFields } from './components/ResponsibilityFields';
export { ResponsibilityFileImport } from './components/ResponsibilityFileImport';
export { ResponsibilityTitle } from './components/ResponsibilityTitle';
export {
  responsibilityKeys,
  useExtractProposal,
  useRenameResponsibility,
  useResponsibilities,
} from './hooks/useResponsibilities';
export {
  FIELD_COUNT,
  MIN_RESPONSIBILITIES,
  countFilled,
  emptyFields,
  fieldsFrom,
  filledTexts,
  rulesMessage,
} from './lib/rules';
export type { Proposal, Responsibility } from './types';
