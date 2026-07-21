package com.vyaparsetu.entity.invoice;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "invoice_sequences", indexes = {
    @Index(name = "idx_inv_seq_business", columnList = "businessId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class InvoiceSequence extends TenantEntity {

    @Column(length = 20)
    private String prefix;

    @Column(length = 20)
    private String suffix;

    @Column(nullable = false)
    @Builder.Default
    private Long sequence = 0L;

    @Column(length = 50)
    private String format;

    @Column(name = "invoice_type", length = 30)
    private String invoiceType;

    @Column(name = "financial_year", length = 20)
    private String financialYear;
}
