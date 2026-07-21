package com.vyaparsetu.entity.party;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "party_documents", indexes = {
    @Index(name = "idx_party_doc_party", columnList = "partyId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class PartyDocument extends TenantEntity {

    @Column(name = "party_id", nullable = false, columnDefinition = "UUID")
    private UUID partyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private DocumentType documentType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    public enum DocumentType {
        GST_CERTIFICATE, PAN_CARD, ADDRESS_PROOF, PHOTO, OTHER
    }
}
