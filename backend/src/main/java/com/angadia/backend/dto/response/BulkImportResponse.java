package com.angadia.backend.dto.response;

import java.util.List;

public record BulkImportResponse(
    int totalRows,
    int successCount,
    int errorCount,
    List<RowError> errors
) {
    public record RowError(int row, String message) {}
}
