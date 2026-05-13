import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus, Resource } from '../../database/entities/booking.entity';
import { MessageDispatcherService } from '../../messaging/dispatcher/message-dispatcher.service';

export interface TimeSlot {
  resourceId: string;
  resourceName: string;
  datetime: Date;
  durationMinutes: number;
}

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Resource) private readonly resourceRepo: Repository<Resource>,
    private readonly dispatcher: MessageDispatcherService,
  ) {}

  async getAvailableSlots(
    tenantId: string,
    date: string,
    options?: { specialty?: string; resourceId?: string },
  ): Promise<TimeSlot[]> {
    const targetDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      targetDate.getDay()
    ];

    const query = this.resourceRepo.createQueryBuilder('r')
      .where('r.tenantId = :tenantId AND r.isActive = true', { tenantId });

    if (options?.resourceId) {
      query.andWhere('r.id = :resourceId', { resourceId: options.resourceId });
    }

    const resources = await query.getMany();
    const slots: TimeSlot[] = [];

    for (const resource of resources) {
      const daySchedule = resource.availability?.weekdays?.[dayOfWeek];
      if (!daySchedule?.length) continue;

      // Busca agendamentos existentes neste dia
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await this.bookingRepo.find({
        where: {
          resourceId: resource.id,
          scheduledAt: Between(startOfDay, endOfDay),
          status: BookingStatus.CONFIRMED,
        },
      });

      const busyTimes = new Set(existing.map((b) => b.scheduledAt.toISOString()));

      for (const period of daySchedule) {
        const [startH, startM] = period.start.split(':').map(Number);
        const [endH, endM] = period.end.split(':').map(Number);
        const duration = period.slotDuration || 30;

        let current = new Date(targetDate);
        current.setHours(startH, startM, 0, 0);
        const endTime = new Date(targetDate);
        endTime.setHours(endH, endM, 0, 0);

        while (current < endTime) {
          if (!busyTimes.has(current.toISOString())) {
            slots.push({
              resourceId: resource.id,
              resourceName: resource.name,
              datetime: new Date(current),
              durationMinutes: duration,
            });
          }
          current = new Date(current.getTime() + duration * 60 * 1000);
        }
      }
    }

    return slots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  }

  async createBooking(
    tenantId: string,
    clientId: string,
    opts: { resourceId: string; datetime: string; notes?: string },
  ): Promise<Booking> {
    const scheduledAt = new Date(opts.datetime);

    // Verificar conflito
    const conflict = await this.bookingRepo.findOne({
      where: {
        resourceId: opts.resourceId,
        scheduledAt,
        status: BookingStatus.CONFIRMED,
      },
    });

    if (conflict) throw new BadRequestException('Horário já ocupado');

    const booking = this.bookingRepo.create({
      tenantId,
      clientId,
      resourceId: opts.resourceId,
      scheduledAt,
      status: BookingStatus.CONFIRMED,
      notes: opts.notes,
    });

    return this.bookingRepo.save(booking);
  }

  async rescheduleBooking(
    bookingId: string,
    tenantId: string,
    newDatetime: string,
    reason?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, tenantId },
    });

    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    // Cancela o atual
    await this.bookingRepo.update(bookingId, { status: BookingStatus.RESCHEDULED });

    // Cria novo
    const newBooking = this.bookingRepo.create({
      tenantId,
      clientId: booking.clientId,
      resourceId: booking.resourceId,
      scheduledAt: new Date(newDatetime),
      status: BookingStatus.CONFIRMED,
      notes: reason ? `Remarcado: ${reason}` : booking.notes,
      previousBookingId: bookingId,
    });

    return this.bookingRepo.save(newBooking);
  }

  async cancelBooking(
    bookingId: string,
    tenantId: string,
    reason?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, tenantId },
    });

    if (!booking) throw new NotFoundException('Agendamento não encontrado');

    await this.bookingRepo.update(bookingId, {
      status: BookingStatus.CANCELLED,
      notes: reason ? `Cancelado: ${reason}` : booking.notes,
    });

    return this.bookingRepo.findOne({ where: { id: bookingId } }) as Promise<Booking>;
  }

  async getClientBookings(
    tenantId: string,
    clientId: string,
    filter: 'upcoming' | 'past' | 'all' = 'upcoming',
  ): Promise<Booking[]> {
    const now = new Date();
    const query = this.bookingRepo.createQueryBuilder('b')
      .where('b.tenantId = :tenantId AND b.clientId = :clientId', { tenantId, clientId });

    if (filter === 'upcoming') {
      query.andWhere('b.scheduledAt > :now AND b.status = :status', {
        now,
        status: BookingStatus.CONFIRMED,
      });
    } else if (filter === 'past') {
      query.andWhere('b.scheduledAt < :now', { now });
    }

    return query.orderBy('b.scheduledAt', 'ASC').getMany();
  }

  formatSlotsMessage(slots: TimeSlot[]): string {
    if (!slots.length) return 'Infelizmente não há horários disponíveis para esta data. 😕';

    const lines = slots.slice(0, 8).map((s) => {
      const time = s.datetime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `• *${time}* — ${s.resourceName}`;
    });

    return `*Horários disponíveis:*\n\n${lines.join('\n')}\n\nQual horário você prefere?`;
  }
}
