import { Application, ApplicationStatus, CountryCode, DegreeType } from '../../universities/types';

export interface ApplicationStore {
  create(data: {
    telegram_id: number;
    university_id: string;
    country: CountryCode;
    degree: DegreeType;
    status?: ApplicationStatus;
  }): Promise<Application>;

  findByTelegramId(telegramId: number): Promise<Application[]>;

  findById(id: number, telegramId: number): Promise<Application | null>;

  updateStatus(
    id: number,
    telegramId: number,
    status: ApplicationStatus,
  ): Promise<{ application: Application; previousStatus: ApplicationStatus } | null>;

  exists(telegramId: number, universityId: string, degree: DegreeType): Promise<boolean>;
}
