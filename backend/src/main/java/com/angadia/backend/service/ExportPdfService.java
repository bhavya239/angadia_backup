package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Transaction;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportPdfService {

    private final DailyRegisterService dailyRegisterService;

    public byte[] generateDailyRegisterPdf(LocalDate date) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("Angadia Pedhi - Daily Register").setBold().setFontSize(16).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Date: " + date.toString()).setTextAlignment(TextAlignment.CENTER).setMarginBottom(10));

        BigDecimal openBalance = dailyRegisterService.getOpeningBalance(date);
        document.add(new Paragraph("Opening Balance: Rs. " + String.format("%.2f", openBalance)).setBold().setMarginBottom(10));

        Table table = new Table(UnitValue.createPercentArray(new float[]{10, 20, 20, 15, 15, 20})).useAllAvailableWidth();
        
        String[] headers = {"Date", "Sender", "Receiver", "Jama/In (+)", "Udhar/Out (-)", "Balance"};
        for (String h : headers) {
            table.addHeaderCell(new Cell().add(new Paragraph(h).setBold()).setBackgroundColor(ColorConstants.LIGHT_GRAY).setTextAlignment(TextAlignment.CENTER));
        }

        List<Transaction> txns = dailyRegisterService.getDailyTransactions(date);
        BigDecimal currentBalance = openBalance;
        BigDecimal totalCredit = BigDecimal.ZERO;
        BigDecimal totalDebit = BigDecimal.ZERO;

        for (Transaction t : txns) {
            BigDecimal amt = t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO;
            BigDecimal vatav = t.getVatavAmount() != null ? t.getVatavAmount() : BigDecimal.ZERO;
            
            BigDecimal credit = amt.add(vatav);
            BigDecimal debit = amt;
            currentBalance = currentBalance.add(credit).subtract(debit); // Effective addition = vatav

            totalCredit = totalCredit.add(credit);
            totalDebit = totalDebit.add(debit);

            table.addCell(new Cell().add(new Paragraph(t.getTxnDate().toString())).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph(t.getSenderName() != null ? t.getSenderName() : "")));
            table.addCell(new Cell().add(new Paragraph(t.getReceiverName() != null ? t.getReceiverName() : "")));
            table.addCell(new Cell().add(new Paragraph(String.format("%.2f", credit))).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(new Cell().add(new Paragraph(String.format("%.2f", debit))).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(new Cell().add(new Paragraph(String.format("%.2f", currentBalance))).setTextAlignment(TextAlignment.RIGHT));
        }

        // Footer Row
        Cell footerLabel = new Cell(1, 3).add(new Paragraph("Total")).setBold().setTextAlignment(TextAlignment.RIGHT);
        table.addCell(footerLabel);
        table.addCell(new Cell().add(new Paragraph(String.format("%.2f", totalCredit))).setBold().setTextAlignment(TextAlignment.RIGHT));
        table.addCell(new Cell().add(new Paragraph(String.format("%.2f", totalDebit))).setBold().setTextAlignment(TextAlignment.RIGHT));
        table.addCell(new Cell().add(new Paragraph(String.format("%.2f", currentBalance))).setBold().setBackgroundColor(ColorConstants.LIGHT_GRAY).setTextAlignment(TextAlignment.RIGHT));

        document.add(table);
        
        document.add(new Paragraph("Closing Balance: Rs. " + String.format("%.2f", currentBalance)).setBold().setMarginTop(10).setTextAlignment(TextAlignment.RIGHT));

        document.close();
        return baos.toByteArray();
    }
}
