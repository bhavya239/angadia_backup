package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Transaction;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportExcelService {

    private final DailyRegisterService dailyRegisterService;

    public byte[] generateDailyRegisterExcel(LocalDate date) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Daily Register");

            // Fonts and Styles
            Font boldFont = workbook.createFont();
            boldFont.setBold(true);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(boldFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0.00"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle boldCurrencyStyle = workbook.createCellStyle();
            boldCurrencyStyle.cloneStyleFrom(currencyStyle);
            boldCurrencyStyle.setFont(boldFont);

            // Title Row
            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue("Angadia Pedhi - Daily Register: " + date.toString());
            titleRow.getCell(0).setCellStyle(headerStyle);

            BigDecimal openBalance = dailyRegisterService.getOpeningBalance(date);
            Row openBalRow = sheet.createRow(1);
            openBalRow.createCell(0).setCellValue("Opening Balance:");
            Cell openBalCell = openBalRow.createCell(1);
            openBalCell.setCellValue(openBalance.doubleValue());
            openBalCell.setCellStyle(boldCurrencyStyle);

            // Table Headers
            String[] headers = {"Date", "Sender", "Receiver", "Jama/In (+)", "Udhar/Out (-)", "Balance"};
            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            List<Transaction> txns = dailyRegisterService.getDailyTransactions(date);
            BigDecimal currentBalance = openBalance;
            BigDecimal totalCredit = BigDecimal.ZERO;
            BigDecimal totalDebit = BigDecimal.ZERO;

            int rowIdx = 4;
            for (Transaction t : txns) {
                Row row = sheet.createRow(rowIdx++);
                BigDecimal amt = t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO;
                BigDecimal vatav = t.getVatavAmount() != null ? t.getVatavAmount() : BigDecimal.ZERO;

                BigDecimal credit = amt.add(vatav);
                BigDecimal debit = amt;
                currentBalance = currentBalance.add(credit).subtract(debit);

                totalCredit = totalCredit.add(credit);
                totalDebit = totalDebit.add(debit);

                row.createCell(0).setCellValue(t.getTxnDate().toString());
                row.createCell(1).setCellValue(t.getSenderName() != null ? t.getSenderName() : "");
                row.createCell(2).setCellValue(t.getReceiverName() != null ? t.getReceiverName() : "");
                
                Cell cCell = row.createCell(3);
                cCell.setCellValue(credit.doubleValue());
                cCell.setCellStyle(currencyStyle);

                Cell dCell = row.createCell(4);
                dCell.setCellValue(debit.doubleValue());
                dCell.setCellStyle(currencyStyle);

                Cell bCell = row.createCell(5);
                bCell.setCellValue(currentBalance.doubleValue());
                bCell.setCellStyle(currencyStyle);
            }

            // Footer
            Row footerRow = sheet.createRow(rowIdx + 1);
            Cell totalLabel = footerRow.createCell(2);
            totalLabel.setCellValue("TOTAL");
            totalLabel.setCellStyle(headerStyle);

            Cell tcCell = footerRow.createCell(3);
            tcCell.setCellValue(totalCredit.doubleValue());
            tcCell.setCellStyle(boldCurrencyStyle);

            Cell tdCell = footerRow.createCell(4);
            tdCell.setCellValue(totalDebit.doubleValue());
            tdCell.setCellStyle(boldCurrencyStyle);

            Cell finalBalCell = footerRow.createCell(5);
            finalBalCell.setCellValue(currentBalance.doubleValue());
            finalBalCell.setCellStyle(boldCurrencyStyle);

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
