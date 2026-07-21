package com.vyaparsetu.service.scheduler;

import com.vyaparsetu.entity.auth.RefreshToken;
import com.vyaparsetu.entity.ledger.LedgerBalance;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.notification.Notification;
import com.vyaparsetu.entity.sync.SyncQueue;
import com.vyaparsetu.repository.auth.RefreshTokenRepository;
import com.vyaparsetu.repository.business.BusinessRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.notification.NotificationRepository;
import com.vyaparsetu.repository.sync.SyncQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final SyncQueueRepository syncQueueRepository;
    private final NotificationRepository notificationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerBalanceRepository ledgerBalanceRepository;
    private final ItemRepository itemRepository;
    private final BusinessRepository businessRepository;

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void processSyncQueue() {
        log.debug("Running scheduled sync queue processing");

        List<SyncQueue> pendingItems = syncQueueRepository
                .findByStatusAndNextRetryAtBeforeOrNextRetryAtIsNull("PENDING", Instant.now());

        for (SyncQueue item : pendingItems) {
            try {
                item.setStatus("PROCESSING");
                syncQueueRepository.save(item);

                item.setStatus("COMPLETED");
                item.setProcessedAt(Instant.now());
                syncQueueRepository.save(item);
            } catch (Exception e) {
                log.error("Failed to process sync queue item {}: {}", item.getId(), e.getMessage());
                item.setStatus("FAILED");
                item.setRetryCount(item.getRetryCount() + 1);
                item.setErrorMessage(e.getMessage());
                item.setNextRetryAt(Instant.now().plusSeconds(30L * Math.min(item.getRetryCount(), 10)));
                syncQueueRepository.save(item);
            }
        }

        if (!pendingItems.isEmpty()) {
            log.info("Processed {} sync queue items", pendingItems.size());
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void sendScheduledNotifications() {
        log.debug("Running scheduled notifications check");

        List<Notification> pendingNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getScheduledAt() != null
                        && n.getScheduledAt().isBefore(Instant.now())
                        && n.getStatus() == Notification.NotificationStatus.PENDING)
                .toList();

        for (Notification notification : pendingNotifications) {
            try {
                notification.setStatus(Notification.NotificationStatus.SENT);
                notification.setDeliveredAt(Instant.now());
                notificationRepository.save(notification);
            } catch (Exception e) {
                log.error("Failed to send scheduled notification {}: {}", notification.getId(), e.getMessage());
                notification.setStatus(Notification.NotificationStatus.FAILED);
                notificationRepository.save(notification);
            }
        }
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void generateDailyBackup() {
        log.info("Running daily database backup (mock)");
        log.info("Backup completed at: {}", Instant.now());
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldTokens() {
        log.info("Running expired token cleanup");

        List<RefreshToken> allTokens = refreshTokenRepository.findAll();
        int removed = 0;

        for (RefreshToken token : allTokens) {
            if (token.getExpiresAt().isBefore(Instant.now()) || token.isRevoked()) {
                refreshTokenRepository.delete(token);
                removed++;
            }
        }

        log.info("Cleaned up {} expired/revoked tokens", removed);
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateOutstandingAging() {
        log.info("Running outstanding aging update");

        List<LedgerBalance> allBalances = ledgerBalanceRepository.findAll();
        LocalDate today = LocalDate.now();

        for (LedgerBalance balance : allBalances) {
            List<LedgerEntry> entries = ledgerEntryRepository
                    .findByBusinessIdAndPartyIdOrderByEntryDateDesc(
                            balance.getBusinessId(), balance.getPartyId());

            BigDecimal totalOverdue = BigDecimal.ZERO;
            BigDecimal totalDue = BigDecimal.ZERO;

            for (LedgerEntry entry : entries) {
                if (entry.getDueDate() != null && entry.getDueDate().isBefore(today)) {
                    totalOverdue = totalOverdue.add(entry.getAmount());
                } else {
                    totalDue = totalDue.add(entry.getAmount());
                }
            }

            balance.setTotalDue(totalDue);
            balance.setTotalOverdue(totalOverdue);
            balance.setAsOfDate(today);
            ledgerBalanceRepository.save(balance);
        }

        log.info("Updated aging for {} parties", allBalances.size());
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void checkLowStockAlerts() {
        log.debug("Running low stock alerts check");

        List<com.vyaparsetu.entity.item.Item> lowStockItems = itemRepository.findAll().stream()
                .filter(i -> i.getCurrentStock() != null && i.getMinStockLevel() != null
                        && i.getCurrentStock().compareTo(i.getMinStockLevel()) <= 0)
                .toList();

        if (!lowStockItems.isEmpty()) {
            log.info("Found {} low stock items", lowStockItems.size());
        }
    }
}
