package com.angadia.backend.dto.response;

import java.math.BigDecimal;

public record DashboardResponse(
    long totalParties,
    long totalTransactions,
    long todayTransactions,
    BigDecimal totalAmount,
    BigDecimal totalVatav
) {}
