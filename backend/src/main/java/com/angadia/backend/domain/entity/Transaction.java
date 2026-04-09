package com.angadia.backend.domain.entity;

import com.angadia.backend.domain.enums.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "transactions")
@CompoundIndexes({
    @CompoundIndex(name = "date_status_idx",      def = "{'txnDate': -1, 'status': 1}"),
    @CompoundIndex(name = "sender_date_idx",       def = "{'senderId': 1, 'txnDate': -1, 'status': 1}"),
    @CompoundIndex(name = "receiver_date_idx",     def = "{'receiverId': 1, 'txnDate': -1, 'status': 1}"),
    @CompoundIndex(name = "sender_receiver_idx",   def = "{'senderId': 1, 'receiverId': 1, 'txnDate': -1}")
})
public class Transaction {

    @Id
    private String id;

    @Indexed(unique = true)
    private String txnNumber;        // TXN-YYYYMMDD-XXXXX

    private LocalDate txnDate;

    // Sender (money goes OUT from sender)
    private String senderId;
    private String senderName;       // Denormalized
    private String senderCity;       // Denormalized

    // Receiver (money comes IN to receiver)
    private String receiverId;
    private String receiverName;     // Denormalized
    private String receiverCity;     // Denormalized

    private BigDecimal amount;

    private BigDecimal vatavRate;    // % commission
    private BigDecimal vatavAmount;  // Calculated: amount * vatavRate / 100

    private String narration;

    @Builder.Default
    private TransactionStatus status = TransactionStatus.ACTIVE;

    // Soft delete fields
    private Instant deletedAt;
    private String deletedBy;
    private String deleteReason;

    @CreatedDate
    private Instant createdAt;

    private String createdBy;

    @LastModifiedDate
    private Instant updatedAt;

    private String updatedBy;

    @org.springframework.data.annotation.Version
    private Long version;
}
