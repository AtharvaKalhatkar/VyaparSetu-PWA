package com.vyaparsetu.dto.business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessSettingsDto {
    private String invoicePrefix;
    private String invoiceSuffix;
    private String defaultPaymentTerms;
    private String currencySymbol;
    private String dateFormat;
    private String timeFormat;
    private String language;
    private String timezone;
}
