import { t } from '../i18n';
import { Language } from '../types';
import { escapeLegacyMarkdown } from '../security/markdown';
import { OrgApplicationRecord, WizardDraft, WizardFieldError, WizardStep } from './types';
import { stepPosition } from './wizard';
import { composeFullName } from '../platform/types';

/**
 * Message text for every wizard step and outcome.
 *
 * Split out of the handler so the wording can be tested for all three languages
 * without a Telegram context, and so the handler stays about flow rather than copy.
 */
export function promptForStep(language: Language, step: WizardStep, draft: WizardDraft): string {
  const texts = t(language).orgApp;
  const { current, total } = stepPosition(step);
  const hint = `_${texts.stepHint(current, total)}_\n\n`;

  switch (step) {
    case 'org_type':
      return hint + texts.askOrgType;
    case 'org_name':
      return hint + texts.askOrgName;
    case 'stir':
      return hint + texts.askStir;
    case 'resp_last_name':
      return hint + texts.askLastName;
    case 'resp_first_name':
      return hint + texts.askFirstName;
    case 'resp_middle_name':
      return hint + texts.askMiddleName;
    case 'resp_phone':
      return hint + texts.askPhone;
    case 'charter':
      return hint + texts.askCharter;
    case 'confirm':
      return `${hint}${texts.confirmTitle}\n\n${summaryText(language, draft)}`;
    default:
      return texts.intro;
  }
}

export function summaryText(language: Language, draft: WizardDraft): string {
  const texts = t(language).orgApp;
  const type = draft.organizationType
    ? texts.orgTypeLabels[draft.organizationType]
    : '—';

  return texts.summary({
    organizationType: type,
    organizationName: escapeLegacyMarkdown(draft.organizationName ?? '—'),
    stir: draft.stir ?? '—',
    responsibleFullName: escapeLegacyMarkdown(
      composeFullName({
        lastName: draft.lastName,
        firstName: draft.firstName,
        middleName: draft.middleName,
      }) || '—',
    ),
    phone: draft.phone ?? '—',
    charterFileName: escapeLegacyMarkdown(draft.charter?.fileName ?? '—'),
  });
}

export function fieldErrorText(language: Language, error: WizardFieldError): string {
  const texts = t(language).orgApp;
  switch (error) {
    case 'required':
      return texts.errorRequired;
    case 'too_long':
      return texts.errorTooLong;
    case 'stir_format':
      return texts.errorStirFormat;
    case 'phone_format':
      return texts.errorPhoneFormat;
    case 'file_type':
      return texts.errorFileType;
    case 'file_too_large':
      return texts.errorFileTooLarge;
    default:
      return texts.errorRequired;
  }
}

export function statusMessage(language: Language, record: OrgApplicationRecord): string {
  const texts = t(language).orgApp;
  const label = texts.statusLabels[record.status];

  let message = texts.statusChanged(escapeLegacyMarkdown(record.organizationName), label);

  if (record.rejectionReason) {
    message += texts.statusReason(escapeLegacyMarkdown(record.rejectionReason));
  }
  if (record.status === 'activated') {
    message += texts.activatedExtra;
  }

  return message;
}

export function applicationsListText(
  language: Language,
  records: OrgApplicationRecord[],
): string {
  const texts = t(language).orgApp;
  if (records.length === 0) return texts.myApplicationsEmpty;

  const entries = records.map((record, index) =>
    texts.myApplicationEntry({
      index: index + 1,
      organizationName: escapeLegacyMarkdown(record.organizationName),
      organizationType: texts.orgTypeLabels[record.organizationType] ?? record.organizationType,
      stir: record.stir,
      statusLabel: texts.statusLabels[record.status],
      submittedDate: formatDate(record.submittedAt),
    }),
  );

  return `${texts.myApplicationsTitle}\n\n${entries.join('\n\n')}`;
}

/** ISO timestamp -> `DD.MM.YYYY`. Falls back to the raw value if unparseable. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}
