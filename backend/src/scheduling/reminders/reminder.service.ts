import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { Client } from '../../database/entities/client.entity';
import { MessageDispatcherService } from '../../messaging/dispatcher/message-dispatcher.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    private readonly dispatcher: MessageDispatcherService,
  ) {}

  // Roda todo dia às 8h — envia lembretes para consultas do dia seguinte
  @Cron('0 8 * * *')
  async sendDayBeforeReminders(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(23, 59, 59, 999);

    await this.sendReminders(tomorrow, endTomorrow, '24h');
  }

  // Roda a cada hora — envia lembretes 2h antes
  @Cron(CronExpression.EVERY_HOUR)
  async sendTwoHourReminders(): Promise<void> {
    const twoHoursAhead = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const window = new Date(twoHoursAhead.getTime() + 5 * 60 * 1000); // janela de 5 min

    await this.sendReminders(twoHoursAhead, window, '2h');
  }

  private async sendReminders(from: Date, to: Date, type: string): Promise<void> {
    const bookings = await this.bookingRepo.find({
      where: {
        scheduledAt: Between(from, to),
        status: BookingStatus.CONFIRMED,
      },
    });

    for (const booking of bookings) {
      // Verificar se já enviou este tipo de lembrete
      const alreadySent = booking.remindersSent?.some((r) => r.type === type);
      if (alreadySent) continue;

      const client = await this.clientRepo.findOne({ where: { id: booking.clientId } });
      if (!client) continue;

      const time = booking.scheduledAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const date = booking.scheduledAt.toLocaleDateString('pt-BR');

      const message = type === '24h'
        ? `Olá${client.name ? `, *${client.name}*` : ''}! 👋\n\nLembrando que você tem uma consulta *amanhã, ${date} às ${time}*.\n\nPor favor, confirme sua presença respondendo *SIM* ou *NÃO*.`
        : `Olá${client.name ? `, *${client.name}*` : ''}! 👋\n\nSua consulta é em *2 horas* (${time}). Te esperamos! 📅`;

      try {
        await this.dispatcher.send(booking.tenantId, client.phone, {
          type: 'text',
          text: message,
        });

        // Registrar lembrete como enviado
        const remindersSent = [
          ...(booking.remindersSent || []),
          { type, sentAt: new Date().toISOString() },
        ];
        await this.bookingRepo.update(booking.id, { remindersSent });
        this.logger.debug(`Reminder [${type}] sent for booking ${booking.id}`);
      } catch (err) {
        this.logger.error(`Failed to send reminder for booking ${booking.id}`, err);
      }
    }
  }
}
