package com.angadia.backend.util;

import java.time.LocalDate;
import java.time.Month;

public final class FinancialYearUtil {

    private FinancialYearUtil() {}

    /**
     * Returns the Indian financial year string for a given date.
     * Financial year runs April 1 -> March 31.
     * Example: 2024-04-15 -> "2024-25"
     *          2025-01-10 -> "2024-25"
     */
    public static String getFinancialYear(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        if (month >= Month.APRIL.getValue()) {
            return year + "-" + String.format("%02d", (year + 1) % 100);
        } else {
            return (year - 1) + "-" + String.format("%02d", year % 100);
        }
    }

    /**
     * Returns the start of the financial year for a given date (April 1).
     */
    public static LocalDate getFinancialYearStart(LocalDate date) {
        int year = date.getMonthValue() >= Month.APRIL.getValue() ? date.getYear() : date.getYear() - 1;
        return LocalDate.of(year, Month.APRIL, 1);
    }

    /**
     * Returns the end of the financial year for a given date (March 31).
     */
    public static LocalDate getFinancialYearEnd(LocalDate date) {
        int year = date.getMonthValue() >= Month.APRIL.getValue() ? date.getYear() + 1 : date.getYear();
        return LocalDate.of(year, Month.MARCH, 31);
    }
}
