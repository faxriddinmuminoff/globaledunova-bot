import { Language } from '../types';
import { getUniversityStore } from '../database/storage';
import { logAdminAudit } from '../audit/audit-admin.service';
import {
  CreateUniversityInput,
  UniversityRecord,
} from '../universities/university.types';
import { setUniversityRequirement } from '../database/repositories/requirement.repository';
import { DocumentType } from '../documents/types';
import { CountryCode, DegreeType } from '../universities/types';

export interface UniversityWizardDraft {
  id?: string;
  countryCode?: CountryCode;
  supportedDegrees?: DegreeType[];
  names?: Record<Language, { name: string; city: string }>;
  requirements?: Partial<Record<DocumentType, boolean>>;
}

export function validateWizardDraft(draft: UniversityWizardDraft): string | null {
  if (!draft.countryCode) return 'country_required';
  if (!draft.supportedDegrees?.length) return 'degrees_required';
  if (!draft.names?.en?.name) return 'name_en_required';
  if (!draft.id && !draft.names) return 'invalid_draft';
  return null;
}

export function buildUniversityId(country: CountryCode, slug: string): string {
  return `${country}-${slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}`;
}

export async function saveUniversityWizard(
  draft: UniversityWizardDraft,
  adminId: number,
  isEdit = false,
): Promise<UniversityRecord> {
  const error = validateWizardDraft(draft);
  if (error) throw new Error(error);

  const id = draft.id ?? buildUniversityId(draft.countryCode!, draft.names!.en.name);

  let record: UniversityRecord | null;

  if (isEdit && draft.id) {
    record = await getUniversityStore().update(draft.id, {
      names: draft.names,
      supportedDegrees: draft.supportedDegrees,
    });
    if (!record) throw new Error('university_not_found');
    await logAdminAudit({
      adminId,
      action: 'university_updated',
      entityType: 'university',
      entityId: undefined,
      metadata: { previousValue: draft.id, newValue: record, universityId: draft.id },
    });
  } else {
    const input: CreateUniversityInput = {
      id,
      countryCode: draft.countryCode!,
      names: draft.names!,
      supportedDegrees: draft.supportedDegrees,
    };
    record = await getUniversityStore().create(input);
    await logAdminAudit({
      adminId,
      action: 'university_created',
      entityType: 'university',
      metadata: { newValue: record, universityId: id },
    });
  }

  if (draft.requirements) {
    for (const [docType, required] of Object.entries(draft.requirements)) {
      if (typeof required === 'boolean') {
        await setUniversityRequirement(id, docType as DocumentType, required);
        await logAdminAudit({
          adminId,
          action: 'requirement_changed',
          entityType: 'university_requirement',
          metadata: {
            universityId: id,
            documentType: docType,
            newValue: required,
          },
        });
      }
    }
  }

  return record;
}

export async function deactivateUniversity(
  universityId: string,
  adminId: number,
): Promise<boolean> {
  const existing = await getUniversityStore().findById(universityId);
  if (!existing) return false;

  const ok = await getUniversityStore().archive(universityId);
  if (ok) {
    await logAdminAudit({
      adminId,
      action: 'university_deleted',
      entityType: 'university',
      metadata: {
        universityId,
        previousValue: existing,
        newValue: { is_archived: true },
      },
    });
  }
  return ok;
}

export async function listManageableUniversities(): Promise<UniversityRecord[]> {
  return getUniversityStore().findAllActive();
}
