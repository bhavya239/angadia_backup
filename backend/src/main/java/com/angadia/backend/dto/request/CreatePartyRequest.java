package com.angadia.backend.dto.request;

import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.domain.enums.PartyType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreatePartyRequest(
    @NotBlank(message = "Party code is required")
    @Pattern(regexp = "^[A-Z0-9]{1,10}$", message = "Invalid format: only uppercase A-Z and 0-9 allowed, max 10 chars")
    String partyCode,

    @NotBlank(message = "Party name is required")
    @Size(min = 2, max = 100)
    String name,

    @NotBlank(message = "City name is required")
    String cityName,

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number (must be 10 digits starting with 6–9)")
    String phone,

    @Email(message = "Invalid email address")
    String email,

    String address,

    @NotNull(message = "Party type is required")
    PartyType partyType,

    @DecimalMin(value = "0.00") @Digits(integer = 5, fraction = 2)
    BigDecimal crRoi,

    @DecimalMin(value = "0.00") @Digits(integer = 5, fraction = 2)
    BigDecimal drRoi,

    @DecimalMin(value = "0.00") @Digits(integer = 12, fraction = 2)
    BigDecimal openingBalance,

    BalanceType openingBalanceType
) {}
