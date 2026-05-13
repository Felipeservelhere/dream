import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../core/auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity';
import { Message, MessageSender } from '../database/entities/message.entity';
import { Booking, BookingStatus } from '../database/entities/booking.entity';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Métricas do dashboard' })
  async dashboard(@CurrentUser() user: User) {
    const tenantId = user.tenantId;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      openConversations,
      waitingHuman,
      resolvedToday,
      totalMessages,
      aiMessages,
      bookingsToday,
    ] = await Promise.all([
      this.convRepo.count({ where: { tenantId, status: ConversationStatus.OPEN } }),
      this.convRepo.count({ where: { tenantId, status: ConversationStatus.WAITING_HUMAN } }),
      this.convRepo.createQueryBuilder('c')
        .where('c.tenantId = :tenantId AND c.status = :s AND c.resolvedAt >= :today', { tenantId, s: ConversationStatus.RESOLVED, today })
        .getCount(),
      this.msgRepo.count({ where: { tenantId } }),
      this.msgRepo.count({ where: { tenantId, sender: MessageSender.AI } }),
      this.bookingRepo.createQueryBuilder('b')
        .where('b.tenantId = :tenantId AND b.createdAt >= :today', { tenantId, today })
        .getCount(),
    ]);

    const aiHandledPercent = totalMessages > 0 ? Math.round((aiMessages / totalMessages) * 100) : 0;

    return {
      openConversations,
      waitingHuman,
      resolvedToday,
      totalBookingsToday: bookingsToday,
      aiHandledPercent,
      messagesThisMonth: totalMessages,
      avgResponseTime: '< 1s',
    };
  }
}
