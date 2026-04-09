package com.angadia.backend.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Central financial calculation constants and utilities.
 * NEVER use double/float for money calculations.
 */
public final class FinancialConstants {

    private FinancialConstants() {}

    public static final int MONEY_SCALE = 2;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    public static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

    public static final BigDecimal HUNDRED = new BigDecimal("100");
    public static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");

    /**
     * Calculate vatav (commission): amount * rate / 100
     */
    public static BigDecimal calculateVatav(BigDecimal amount, BigDecimal ratePercent) {
        return amount
            .multiply(ratePercent, MATH_CONTEXT)
            .divide(HUNDRED, MONEY_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate simple interest: principal * roi / 100 * days / 365
     * Round ONLY the final result, never intermediate values.
     */
    public static BigDecimal calculateInterest(BigDecimal principal, BigDecimal roiPercent, long days) {
        return principal
            .multiply(roiPercent, MATH_CONTEXT)
            .multiply(BigDecimal.valueOf(days), MATH_CONTEXT)
            .divide(HUNDRED, MATH_CONTEXT)
            .divide(DAYS_IN_YEAR, MONEY_SCALE, ROUNDING_MODE);
    }

    /**
     * Round money to 2 decimal places with HALF_UP.
     */
    public static BigDecimal round(BigDecimal value) {
        return value.setScale(MONEY_SCALE, ROUNDING_MODE);
    }
}
