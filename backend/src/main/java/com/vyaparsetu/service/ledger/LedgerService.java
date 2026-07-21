package com.vyaparsetu.service.ledger;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.ledger.LedgerEntryRequest;
import com.vyaparsetu.dto.ledger.LedgerSummaryDto;
import com.vyaparsetu.dto.ledger.OutstandingDto;
import com.vyaparsetu.dto.mapper.LedgerEntryMapper;
import com.vyaparsetu.entity.ledger.LedgerBalance;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.ledger.LedgerEntry.EntryType;
import com.vyaparsetu.entity.ledger.LedgerEntry.TransactionType;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerBalanceRepository ledgerBalanceRepository;
    private final PartyRepository partyRepository;
    private final LedgerEntryMapper ledgerEntryMapper;
    private final AuditService auditService;

    @Transactional
    public LedgerEntryDto createEntry(UUID businessId, LedgerEntryRequest request) {
        log.info("Creating ledger entry in business: {}", businessId);

        Party party = partyRepository.findByBusinessIdAndId(businessId, request.getPartyId())
                .orElseThrow(() -> new ResourceNotFoundException("Party", request.getPartyId()));

        LedgerEntry entry = LedgerEntry.builder()
                .businessId(businessId)
                .partyId(request.getPartyId())
                .transactionType(TransactionType.valueOf(request.getTransactionType().toUpperCase()))
                .entryType(EntryType.valueOf(request.getEntryType().toUpperCase()))
                .amount(request.getAmount())
                .mode(request.getMode() != null ? LedgerEntry.PaymentMode.valueOf(request.getMode().toUpperCase()) : LedgerEntry.PaymentMode.CASH)
                .reference(request.getReference())
                .note(request.getNote())
                .entryDate(request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now())
                .dueDate(request.getDueDate())
                .invoiceNo(request.getInvoiceNo())
                .build();

        BigDecimal currentBalance = calculateBalance(businessId, request.getPartyId());
        BigDecimal balanceAfter = entry.getEntryType() == EntryType.DEBIT
                ? currentBalance.add(entry.getAmount())
                : currentBalance.subtract(entry.getAmount());
        entry.setBalanceAfter(balanceAfter);

        entry = ledgerEntryRepository.save(entry);

        updateLedgerBalance(businessId, request.getPartyId(), entry);

        auditService.logEvent(businessId.toString(), "CREATE_LEDGER_ENTRY", "LedgerEntry",
                entry.getId(), null, Map.of("partyId", request.getPartyId().toString(),
                        "amount", request.getAmount().toString(), "type", request.getEntryType()));

        return ledgerEntryMapper.toDto(entry);
    }

    @Transactional(readOnly = true)
    public Page<LedgerEntryDto> getEntriesByParty(UUID businessId, UUID partyId,
                                                    LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<LedgerEntry> entryPage;
        if (startDate != null && endDate != null) {
            entryPage = ledgerEntryRepository.findByBusinessIdAndPartyId(businessId, partyId, pageable);
        } else {
            entryPage = ledgerEntryRepository.findByBusinessIdAndPartyId(businessId, partyId, pageable);
        }
        return entryPage.map(ledgerEntryMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<LedgerEntryDto> getEntriesByBusiness(UUID businessId, LocalDate startDate,
                                                      LocalDate endDate, Pageable pageable) {
        Page<LedgerEntry> entryPage = ledgerEntryRepository.findByBusinessId(businessId, pageable);
        return entryPage.map(ledgerEntryMapper::toDto);
    }

    @Transactional(readOnly = true)
    public LedgerSummaryDto getLedgerSummary(UUID businessId, LocalDate startDate, LocalDate endDate) {
        List<LedgerEntry> entries = ledgerEntryRepository
                .findByBusinessIdAndEntryDateBetween(businessId, startDate, endDate);

        BigDecimal totalDebits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.DEBIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredits = entries.stream()
                .filter(e -> e.getEntryType() == EntryType.CREDIT)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long partyCount = entries.stream()
                .map(LedgerEntry::getPartyId)
                .distinct()
                .count();

        return LedgerSummaryDto.builder()
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .openingBalance(totalDebits.subtract(totalCredits))
                .closingBalance(calculateTotalBalance(businessId))
                .partyCount(partyCount)
                .period(startDate + " to " + endDate)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOutstandingReport(UUID businessId) {
        List<Object[]> outstanding = ledgerEntryRepository.getOutstandingByBusinessId(businessId);

        List<OutstandingDto> partyWise = new ArrayList<>();
        BigDecimal totalOutstanding = BigDecimal.ZERO;

        Map<String, BigDecimal> aging = new HashMap<>();
        aging.put("0-30", BigDecimal.ZERO);
        aging.put("31-60", BigDecimal.ZERO);
        aging.put("61-90", BigDecimal.ZERO);
        aging.put("90+", BigDecimal.ZERO);

        for (Object[] row : outstanding) {
            UUID partyId = (UUID) row[0];
            BigDecimal balance = (BigDecimal) row[1];
            if (balance.compareTo(BigDecimal.ZERO) <= 0) continue;

            totalOutstanding = totalOutstanding.add(balance);

            Optional<Party> partyOpt = partyRepository.findById(partyId);
            String partyName = partyOpt.map(Party::getName).orElse("Unknown");

            List<LedgerEntry> entries = ledgerEntryRepository
                    .findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId);
            int daysOverdue = 0;
            LocalDate lastDate = null;
            if (!entries.isEmpty()) {
                lastDate = entries.get(0).getEntryDate();
                daysOverdue = (int) ChronoUnit.DAYS.between(lastDate, LocalDate.now());
            }

            String agingBucket = daysOverdue <= 30 ? "0-30" :
                    daysOverdue <= 60 ? "31-60" :
                            daysOverdue <= 90 ? "61-90" : "90+";
            aging.merge(agingBucket, balance, BigDecimal::add);

            partyWise.add(OutstandingDto.builder()
                    .partyId(partyId)
                    .partyName(partyName)
                    .phone(partyOpt.map(Party::getPhone).orElse(null))
                    .totalOutstanding(balance)
                    .overdueAmount(daysOverdue > 0 ? balance : BigDecimal.ZERO)
                    .daysOverdue(daysOverdue)
                    .creditLimit(partyOpt.map(Party::getCreditLimit).orElse(null))
                    .lastTransactionDate(lastDate)
                    .build());
        }

        Map<String, Object> report = new HashMap<>();
        report.put("totalOutstanding", totalOutstanding);
        report.put("partyWise", partyWise);
        report.put("agingSummary", aging);
        return report;
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateBalance(UUID businessId, UUID partyId) {
        BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId);
        return balance != null ? balance : BigDecimal.ZERO;
    }

    @Transactional
    public void updateBalance(UUID partyId, BigDecimal amount, String entryType) {
        log.info("Updating balance for party: {}, amount: {}, type: {}", partyId, amount, entryType);

        List<LedgerBalance> balances = ledgerBalanceRepository.findByBusinessId(
                partyRepository.findById(partyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Party", partyId))
                        .getBusinessId());

        for (LedgerBalance lb : balances) {
            if (lb.getPartyId().equals(partyId)) {
                BigDecimal newBalance = entryType.equalsIgnoreCase("DEBIT")
                        ? lb.getCurrentBalance().add(amount)
                        : lb.getCurrentBalance().subtract(amount);
                lb.setCurrentBalance(newBalance);
                ledgerBalanceRepository.save(lb);
                return;
            }
        }
    }

    @Transactional
    public LedgerEntryDto reverseEntry(UUID businessId, UUID entryId, String reason) {
        log.info("Reversing ledger entry: {} in business: {}, reason: {}", entryId, businessId, reason);

        LedgerEntry originalEntry = ledgerEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("LedgerEntry", entryId));

        LedgerEntry reversalEntry = LedgerEntry.builder()
                .businessId(businessId)
                .partyId(originalEntry.getPartyId())
                .invoiceId(originalEntry.getInvoiceId())
                .transactionType(originalEntry.getTransactionType())
                .entryType(originalEntry.getEntryType() == EntryType.DEBIT ? EntryType.CREDIT : EntryType.DEBIT)
                .amount(originalEntry.getAmount())
                .mode(originalEntry.getMode())
                .reference("REVERSAL: " + originalEntry.getReference())
                .note("Reversal of " + originalEntry.getId() + ". Reason: " + reason)
                .entryDate(LocalDate.now())
                .build();

        BigDecimal currentBalance = calculateBalance(businessId, originalEntry.getPartyId());
        reversalEntry.setBalanceAfter(reversalEntry.getEntryType() == EntryType.DEBIT
                ? currentBalance.add(reversalEntry.getAmount())
                : currentBalance.subtract(reversalEntry.getAmount()));

        reversalEntry = ledgerEntryRepository.save(reversalEntry);
        updateLedgerBalance(businessId, originalEntry.getPartyId(), reversalEntry);

        auditService.logEvent(businessId.toString(), "REVERSE_LEDGER_ENTRY", "LedgerEntry",
                reversalEntry.getId(), null, Map.of("originalEntryId", entryId.toString(), "reason", reason));

        return ledgerEntryMapper.toDto(reversalEntry);
    }

    private void updateLedgerBalance(UUID businessId, UUID partyId, LedgerEntry entry) {
        Optional<LedgerBalance> existingBalance = ledgerBalanceRepository
                .findByBusinessIdAndPartyId(businessId, partyId);

        LedgerBalance balance = existingBalance.orElseGet(() ->
                LedgerBalance.builder()
                        .businessId(businessId)
                        .partyId(partyId)
                        .currentBalance(BigDecimal.ZERO)
                        .asOfDate(LocalDate.now())
                        .build());

        BigDecimal newBalance = entry.getEntryType() == EntryType.DEBIT
                ? balance.getCurrentBalance().add(entry.getAmount())
                : balance.getCurrentBalance().subtract(entry.getAmount());

        balance.setCurrentBalance(newBalance);
        balance.setAsOfDate(LocalDate.now());
        ledgerBalanceRepository.save(balance);
    }

    private BigDecimal calculateTotalBalance(UUID businessId) {
        List<LedgerBalance> balances = ledgerBalanceRepository.findByBusinessId(businessId);
        return balances.stream()
                .map(LedgerBalance::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
