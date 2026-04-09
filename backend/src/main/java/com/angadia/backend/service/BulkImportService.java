package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Party;
import com.angadia.backend.domain.entity.Transaction;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.domain.enums.TransactionStatus;
import com.angadia.backend.dto.request.BulkImportRowRequest;
import com.angadia.backend.dto.response.BulkImportResponse;
import com.angadia.backend.dto.response.BulkImportResponse.RowError;
import com.angadia.backend.dto.response.ParsedRowResponse;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.repository.TransactionRepository;
import com.angadia.backend.util.FinancialConstants;
import com.angadia.backend.util.SequenceGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkImportService {

    private static final int HDR_DATE          = 0;
    private static final int HDR_SENDER        = 1;
    private static final int HDR_SENT_AMOUNT   = 2;
    private static final int HDR_RECEIVER      = 3;
    private static final int HDR_RECV_AMOUNT   = 4;
    private static final int HDR_VATAV         = 5;
    private static final int HDR_CITY          = 6;
    private static final int HDR_REMARKS       = 7;

    private final PartyRepository partyRepository;
    private final TransactionRepository transactionRepository;
    private final SequenceGenerator sequenceGenerator;
    private final AuditLogService auditLogService;

    // ─── PHASE 1: Parse & Validate → Return preview rows ─────────────────────

    public List<ParsedRowResponse> parseAndValidate(MultipartFile file) throws Exception {
        List<ParsedRowResponse> rows = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            boolean firstRow = true;
            int rowNum = 0;

            for (Row row : sheet) {
                if (firstRow) { firstRow = false; continue; }  // skip header
                if (isRowEmpty(row)) continue;

                rowNum++;
                rows.add(parseRow(row, rowNum));
            }
        }

        return rows;
    }

    // ─── PHASE 2: Commit confirmed rows → Return summary ─────────────────────

    public BulkImportResponse commitImport(List<BulkImportRowRequest> rows,
                                           String userId, String username,
                                           String ipAddress, String userAgent) {
        int total   = rows.size();
        int success = 0;
        List<RowError> errors = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            int displayRow = i + 2; // 1-based + header
            BulkImportRowRequest req = rows.get(i);

            try {
                Optional<Party> senderOpt   = partyRepository.findByNameIgnoreCase(req.senderName());
                Optional<Party> receiverOpt = partyRepository.findByNameIgnoreCase(req.receiverName());

                if (senderOpt.isEmpty()) {
                    errors.add(new RowError(displayRow, "Sender party not found: " + req.senderName()));
                    continue;
                }
                if (receiverOpt.isEmpty()) {
                    errors.add(new RowError(displayRow, "Receiver party not found: " + req.receiverName()));
                    continue;
                }

                Party sender   = senderOpt.get();
                Party receiver = receiverOpt.get();

                if (!sender.isActive()) {
                    errors.add(new RowError(displayRow, "Sender is inactive: " + req.senderName()));
                    continue;
                }
                if (!receiver.isActive()) {
                    errors.add(new RowError(displayRow, "Receiver is inactive: " + req.receiverName()));
                    continue;
                }
                if (sender.getId().equals(receiver.getId())) {
                    errors.add(new RowError(displayRow, "Sender and receiver cannot be same party"));
                    continue;
                }

                // Use sentAmount as the canonical amount; vatav is explicit from Excel
                BigDecimal amount      = req.sentAmount() != null ? req.sentAmount() : BigDecimal.ZERO;
                BigDecimal vatavAmt    = req.vatav() != null ? req.vatav() : BigDecimal.ZERO;
                // Calculate vatav rate back from amount (or store zero if amount is 0)
                BigDecimal vatavRate   = amount.compareTo(BigDecimal.ZERO) > 0
                    ? vatavAmt.multiply(BigDecimal.valueOf(100)).divide(amount, 4, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

                LocalDate txnDate      = req.txnDate() != null ? req.txnDate() : LocalDate.now();
                String txnNumber       = sequenceGenerator.generateTxnNumber(txnDate);

                Transaction txn = Transaction.builder()
                    .txnNumber(txnNumber)
                    .txnDate(txnDate)
                    .senderId(sender.getId())
                    .senderName(sender.getName())
                    .senderCity(sender.getCityName())
                    .receiverId(receiver.getId())
                    .receiverName(receiver.getName())
                    .receiverCity(receiver.getCityName())
                    .amount(amount)
                    .vatavRate(vatavRate)
                    .vatavAmount(vatavAmt)
                    .narration(req.remarks())
                    .status(TransactionStatus.ACTIVE)
                    .createdBy(userId)
                    .build();

                transactionRepository.save(txn);

                auditLogService.logAsync(userId, username, AuditAction.TRANSACTION_CREATED,
                    "Transaction", txn.getId(), null, txn.toString(), ipAddress, userAgent);

                success++;

            } catch (Exception e) {
                log.error("Error saving bulk row {}: {}", displayRow, e.getMessage());
                errors.add(new RowError(displayRow, "Internal error: " + e.getMessage()));
            }
        }

        return new BulkImportResponse(total, success, errors.size(), errors);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private ParsedRowResponse parseRow(Row row, int rowNum) {
        List<String> errs = new ArrayList<>();

        // ── Date ──────────────────────────────────────────────────────────────
        LocalDate txnDate = null;
        Cell dateCell = row.getCell(HDR_DATE);
        if (dateCell == null || dateCell.getCellType() == CellType.BLANK) {
            errs.add("Date is required");
        } else {
            try {
                if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                    txnDate = dateCell.getLocalDateTimeCellValue().toLocalDate();
                } else if (dateCell.getCellType() == CellType.STRING) {
                    txnDate = LocalDate.parse(dateCell.getStringCellValue().trim());
                } else {
                    errs.add("Invalid date format — use YYYY-MM-DD or Excel date cell");
                }
                if (txnDate != null && txnDate.isAfter(LocalDate.now())) {
                    errs.add("Date cannot be in the future");
                }
            } catch (Exception e) {
                errs.add("Invalid date: " + getCellString(dateCell));
            }
        }

        // ── Sender ────────────────────────────────────────────────────────────
        String senderName = getCellString(row.getCell(HDR_SENDER));
        String senderId   = null;
        if (senderName.isBlank()) {
            errs.add("Sender name is required");
        } else {
            Optional<Party> s = partyRepository.findByNameIgnoreCase(senderName);
            if (s.isEmpty()) errs.add("Sender not found: " + senderName);
            else if (!s.get().isActive()) errs.add("Sender is inactive: " + senderName);
            else senderId = s.get().getId();
        }

        // ── Sent Amount ──────────────────────────────────────────────────────
        BigDecimal sentAmount = parseBigDecimal(row.getCell(HDR_SENT_AMOUNT));
        if (sentAmount == null || sentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            errs.add("SentAmount must be > 0");
            sentAmount = BigDecimal.ZERO;
        }

        // ── Receiver ──────────────────────────────────────────────────────────
        String receiverName = getCellString(row.getCell(HDR_RECEIVER));
        String receiverId   = null;
        if (receiverName.isBlank()) {
            errs.add("Receiver name is required");
        } else {
            Optional<Party> r = partyRepository.findByNameIgnoreCase(receiverName);
            if (r.isEmpty()) errs.add("Receiver not found: " + receiverName);
            else if (!r.get().isActive()) errs.add("Receiver is inactive: " + receiverName);
            else receiverId = r.get().getId();
        }

        // Cross-party check
        if (senderId != null && receiverId != null && senderId.equals(receiverId)) {
            errs.add("Sender and receiver cannot be the same party");
        }

        // ── Received Amount ───────────────────────────────────────────────────
        BigDecimal receivedAmount = parseBigDecimal(row.getCell(HDR_RECV_AMOUNT));
        if (receivedAmount == null) receivedAmount = BigDecimal.ZERO;

        // ── Vatav ─────────────────────────────────────────────────────────────
        BigDecimal vatav = parseBigDecimal(row.getCell(HDR_VATAV));
        if (vatav == null) vatav = BigDecimal.ZERO;
        if (vatav.compareTo(BigDecimal.ZERO) < 0) {
            errs.add("Vatav cannot be negative");
            vatav = BigDecimal.ZERO;
        }

        // ── City & Remarks (optional) ─────────────────────────────────────────
        String city    = getCellString(row.getCell(HDR_CITY));
        String remarks = getCellString(row.getCell(HDR_REMARKS));

        return new ParsedRowResponse(
            rowNum + 1,   // display row (1=header, so data starts at 2)
            txnDate, senderName, senderId, sentAmount,
            receiverName, receiverId, receivedAmount,
            vatav, city, remarks,
            errs.isEmpty(), errs
        );
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                // Return integer-looking numerics as int strings
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCachedFormulaResultType() == CellType.STRING
                ? cell.getStringCellValue()
                : String.valueOf(cell.getNumericCellValue());
            default      -> "";
        };
    }

    private BigDecimal parseBigDecimal(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(cell.getNumericCellValue());
            }
            String s = getCellString(cell).replaceAll("[,₹ ]", "");
            if (s.isBlank()) return null;
            return new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }
}
