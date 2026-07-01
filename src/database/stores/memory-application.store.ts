import { Application, ApplicationStatus, CountryCode, DegreeType } from '../../universities/types';
import { ApplicationStore } from './application-store.types';

export class MemoryApplicationStore implements ApplicationStore {
  private applications: Application[] = [];
  private nextId = 1;

  async create(data: {
    telegram_id: number;
    university_id: string;
    country: CountryCode;
    degree: DegreeType;
    status?: ApplicationStatus;
  }): Promise<Application> {
    const now = new Date();
    const application: Application = {
      id: this.nextId++,
      telegram_id: data.telegram_id,
      university_id: data.university_id,
      country: data.country,
      degree: data.degree,
      status: data.status ?? 'submitted',
      created_at: now,
      updated_at: now,
    };

    this.applications.push(application);
    return { ...application };
  }

  async findByTelegramId(telegramId: number): Promise<Application[]> {
    return this.applications
      .filter((app) => app.telegram_id === telegramId)
      .map((app) => ({ ...app }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async findById(id: number, telegramId: number): Promise<Application | null> {
    const app = this.applications.find(
      (item) => item.id === id && item.telegram_id === telegramId,
    );
    return app ? { ...app } : null;
  }

  async updateStatus(
    id: number,
    telegramId: number,
    status: ApplicationStatus,
  ): Promise<{ application: Application; previousStatus: ApplicationStatus } | null> {
    const app = this.applications.find(
      (item) => item.id === id && item.telegram_id === telegramId,
    );
    if (!app) return null;

    const previousStatus = app.status;
    if (previousStatus === status) {
      return { application: { ...app }, previousStatus };
    }

    app.status = status;
    app.updated_at = new Date();
    return { application: { ...app }, previousStatus };
  }

  async exists(telegramId: number, universityId: string, degree: DegreeType): Promise<boolean> {
    return this.applications.some(
      (app) =>
        app.telegram_id === telegramId &&
        app.university_id === universityId &&
        app.degree === degree,
    );
  }

  async findRecent(limit: number): Promise<Application[]> {
    return this.applications
      .map((app) => ({ ...app }))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  async findByIdOnly(id: number): Promise<Application | null> {
    const app = this.applications.find((item) => item.id === id);
    return app ? { ...app } : null;
  }

  async updateStatusById(
    id: number,
    status: ApplicationStatus,
  ): Promise<{ application: Application; previousStatus: ApplicationStatus } | null> {
    const app = this.applications.find((item) => item.id === id);
    if (!app) return null;

    const previousStatus = app.status;
    if (previousStatus === status) {
      return { application: { ...app }, previousStatus };
    }

    app.status = status;
    app.updated_at = new Date();
    return { application: { ...app }, previousStatus };
  }
}
