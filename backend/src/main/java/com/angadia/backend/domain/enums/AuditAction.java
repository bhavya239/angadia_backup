package com.angadia.backend.domain.enums;

public enum AuditAction {
    // Auth
    LOGIN,
    LOGOUT,
    LOGIN_FAILED,
    TOKEN_REFRESH,
    PASSWORD_CHANGE,

    // User management
    USER_CREATED,
    USER_UPDATED,
    USER_DEACTIVATED,

    // City
    CITY_CREATED,
    CITY_UPDATED,

    // Party
    PARTY_CREATED,
    PARTY_UPDATED,
    PARTY_DELETED,

    // Transaction
    TRANSACTION_CREATED,
    TRANSACTION_DELETED,

    // Opening Balance
    OPENING_BALANCE_SET,
    OPENING_BALANCE_UPDATED,

    // Vatav Rate
    VATAV_RATE_CREATED,
    VATAV_RATE_UPDATED,

    // Reports / Export
    REPORT_EXPORTED,
    DATA_IMPORTED,

    // Backup / Restore
    BACKUP_CREATED,
    RESTORE_INITIATED,
    RESTORE_COMPLETED,

    // Year end
    YEAR_END_CLOSING
}
