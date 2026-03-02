import { z } from 'zod';
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    zip: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}, {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}>;
export declare const LineItemSchema: z.ZodObject<{
    lineNumber: z.ZodNumber;
    sku: z.ZodString;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodString;
    unitPrice: z.ZodNumber;
    totalPrice: z.ZodNumber;
    hsCode: z.ZodOptional<z.ZodString>;
    countryOfOrigin: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    lineNumber?: number;
    sku?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    hsCode?: string;
    countryOfOrigin?: string;
}, {
    lineNumber?: number;
    sku?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    hsCode?: string;
    countryOfOrigin?: string;
}>;
export declare const CreatePOSchema: z.ZodObject<{
    receiverTenantId: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    deliveryAddress: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }>;
    deliveryDate: z.ZodString;
    paymentTerms: z.ZodEnum<["NET15", "NET30", "NET45", "NET60", "NET90", "COD", "PREPAID"]>;
    incoterms: z.ZodOptional<z.ZodEnum<["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "FAS", "FOB", "CFR", "CIF"]>>;
    lineItems: z.ZodArray<z.ZodObject<{
        lineNumber: z.ZodNumber;
        sku: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        hsCode: z.ZodOptional<z.ZodString>;
        countryOfOrigin: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
    externalRef: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    receiverTenantId?: string;
    currency?: string;
    deliveryAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    deliveryDate?: string;
    paymentTerms?: "NET15" | "NET30" | "NET45" | "NET60" | "NET90" | "COD" | "PREPAID";
    incoterms?: "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP" | "FAS" | "FOB" | "CFR" | "CIF";
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    externalRef?: string;
    dueDate?: string;
}, {
    receiverTenantId?: string;
    currency?: string;
    deliveryAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    deliveryDate?: string;
    paymentTerms?: "NET15" | "NET30" | "NET45" | "NET60" | "NET90" | "COD" | "PREPAID";
    incoterms?: "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP" | "FAS" | "FOB" | "CFR" | "CIF";
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    externalRef?: string;
    dueDate?: string;
}>;
export declare const UpdatePOSchema: z.ZodObject<Omit<{
    receiverTenantId: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    deliveryAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }>>;
    deliveryDate: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodEnum<["NET15", "NET30", "NET45", "NET60", "NET90", "COD", "PREPAID"]>>;
    incoterms: z.ZodOptional<z.ZodOptional<z.ZodEnum<["EXW", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "FAS", "FOB", "CFR", "CIF"]>>>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        lineNumber: z.ZodNumber;
        sku: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        hsCode: z.ZodOptional<z.ZodString>;
        countryOfOrigin: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }>, "many">>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    externalRef: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "receiverTenantId">, "strip", z.ZodTypeAny, {
    currency?: string;
    deliveryAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    deliveryDate?: string;
    paymentTerms?: "NET15" | "NET30" | "NET45" | "NET60" | "NET90" | "COD" | "PREPAID";
    incoterms?: "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP" | "FAS" | "FOB" | "CFR" | "CIF";
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    externalRef?: string;
    dueDate?: string;
}, {
    currency?: string;
    deliveryAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    deliveryDate?: string;
    paymentTerms?: "NET15" | "NET30" | "NET45" | "NET60" | "NET90" | "COD" | "PREPAID";
    incoterms?: "EXW" | "FCA" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP" | "FAS" | "FOB" | "CFR" | "CIF";
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    externalRef?: string;
    dueDate?: string;
}>;
export declare const RejectDocumentSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason?: string;
}, {
    reason?: string;
}>;
export declare const AcknowledgeDocumentSchema: z.ZodObject<{
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comment?: string;
}, {
    comment?: string;
}>;
export declare const CreateInvoiceSchema: z.ZodObject<{
    receiverTenantId: z.ZodString;
    poReference: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    invoiceDate: z.ZodString;
    dueDate: z.ZodString;
    paymentTerms: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        lineNumber: z.ZodNumber;
        sku: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        hsCode: z.ZodOptional<z.ZodString>;
        countryOfOrigin: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }>, "many">;
    taxAmount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        bankName: z.ZodString;
        accountNumber: z.ZodString;
        routingNumber: z.ZodOptional<z.ZodString>;
        iban: z.ZodOptional<z.ZodString>;
        swiftCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bankName?: string;
        accountNumber?: string;
        routingNumber?: string;
        iban?: string;
        swiftCode?: string;
    }, {
        bankName?: string;
        accountNumber?: string;
        routingNumber?: string;
        iban?: string;
        swiftCode?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    receiverTenantId?: string;
    currency?: string;
    paymentTerms?: string;
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    dueDate?: string;
    poReference?: string;
    invoiceDate?: string;
    taxAmount?: number;
    bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        routingNumber?: string;
        iban?: string;
        swiftCode?: string;
    };
}, {
    receiverTenantId?: string;
    currency?: string;
    paymentTerms?: string;
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    dueDate?: string;
    poReference?: string;
    invoiceDate?: string;
    taxAmount?: number;
    bankDetails?: {
        bankName?: string;
        accountNumber?: string;
        routingNumber?: string;
        iban?: string;
        swiftCode?: string;
    };
}>;
export declare const PackageSchema: z.ZodObject<{
    packageNumber: z.ZodNumber;
    sscc: z.ZodOptional<z.ZodString>;
    weight: z.ZodNumber;
    weightUnit: z.ZodEnum<["KG", "LB"]>;
    dimensions: z.ZodOptional<z.ZodObject<{
        l: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
        unit: z.ZodEnum<["CM", "IN"]>;
    }, "strip", z.ZodTypeAny, {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    }, {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    }>>;
    contents: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    packageNumber?: number;
    sscc?: string;
    weight?: number;
    weightUnit?: "KG" | "LB";
    dimensions?: {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    };
    contents?: string[];
}, {
    packageNumber?: number;
    sscc?: string;
    weight?: number;
    weightUnit?: "KG" | "LB";
    dimensions?: {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    };
    contents?: string[];
}>;
export declare const CreateASNSchema: z.ZodObject<{
    receiverTenantId: z.ZodString;
    poReference: z.ZodString;
    shipDate: z.ZodString;
    carrier: z.ZodEnum<["FEDEX", "UPS", "DHL", "USPS", "CUSTOM"]>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    packages: z.ZodArray<z.ZodObject<{
        packageNumber: z.ZodNumber;
        sscc: z.ZodOptional<z.ZodString>;
        weight: z.ZodNumber;
        weightUnit: z.ZodEnum<["KG", "LB"]>;
        dimensions: z.ZodOptional<z.ZodObject<{
            l: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
            unit: z.ZodEnum<["CM", "IN"]>;
        }, "strip", z.ZodTypeAny, {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        }, {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        }>>;
        contents: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        packageNumber?: number;
        sscc?: string;
        weight?: number;
        weightUnit?: "KG" | "LB";
        dimensions?: {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        };
        contents?: string[];
    }, {
        packageNumber?: number;
        sscc?: string;
        weight?: number;
        weightUnit?: "KG" | "LB";
        dimensions?: {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        };
        contents?: string[];
    }>, "many">;
    lineItems: z.ZodArray<z.ZodObject<{
        lineNumber: z.ZodNumber;
        sku: z.ZodString;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unit: z.ZodString;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        hsCode: z.ZodOptional<z.ZodString>;
        countryOfOrigin: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }, {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    receiverTenantId?: string;
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    poReference?: string;
    shipDate?: string;
    carrier?: "FEDEX" | "UPS" | "DHL" | "USPS" | "CUSTOM";
    trackingNumber?: string;
    packages?: {
        packageNumber?: number;
        sscc?: string;
        weight?: number;
        weightUnit?: "KG" | "LB";
        dimensions?: {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        };
        contents?: string[];
    }[];
}, {
    receiverTenantId?: string;
    lineItems?: {
        lineNumber?: number;
        sku?: string;
        description?: string;
        quantity?: number;
        unit?: string;
        unitPrice?: number;
        totalPrice?: number;
        hsCode?: string;
        countryOfOrigin?: string;
    }[];
    notes?: string;
    poReference?: string;
    shipDate?: string;
    carrier?: "FEDEX" | "UPS" | "DHL" | "USPS" | "CUSTOM";
    trackingNumber?: string;
    packages?: {
        packageNumber?: number;
        sscc?: string;
        weight?: number;
        weightUnit?: "KG" | "LB";
        dimensions?: {
            unit?: "CM" | "IN";
            l?: number;
            w?: number;
            h?: number;
        };
        contents?: string[];
    }[];
}>;
export declare const GenerateLabelSchema: z.ZodObject<{
    carrier: z.ZodEnum<["FEDEX", "UPS", "DHL", "USPS"]>;
    service: z.ZodString;
    labelFormat: z.ZodDefault<z.ZodEnum<["ZPL", "PDF", "PNG"]>>;
    fromAddress: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }>;
    toAddress: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }, {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    }>;
    weight: z.ZodNumber;
    weightUnit: z.ZodDefault<z.ZodEnum<["KG", "LB"]>>;
    dimensions: z.ZodOptional<z.ZodObject<{
        l: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
        unit: z.ZodDefault<z.ZodEnum<["CM", "IN"]>>;
    }, "strip", z.ZodTypeAny, {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    }, {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    }>>;
    referenceNumber: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    isReturn: z.ZodDefault<z.ZodBoolean>;
    signatureRequired: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    weight?: number;
    weightUnit?: "KG" | "LB";
    dimensions?: {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    };
    carrier?: "FEDEX" | "UPS" | "DHL" | "USPS";
    service?: string;
    labelFormat?: "ZPL" | "PDF" | "PNG";
    fromAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    toAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    referenceNumber?: string;
    orderId?: string;
    isReturn?: boolean;
    signatureRequired?: boolean;
}, {
    weight?: number;
    weightUnit?: "KG" | "LB";
    dimensions?: {
        unit?: "CM" | "IN";
        l?: number;
        w?: number;
        h?: number;
    };
    carrier?: "FEDEX" | "UPS" | "DHL" | "USPS";
    service?: string;
    labelFormat?: "ZPL" | "PDF" | "PNG";
    fromAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    toAddress?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    referenceNumber?: string;
    orderId?: string;
    isReturn?: boolean;
    signatureRequired?: boolean;
}>;
export declare const ConnectPartnerSchema: z.ZodObject<{
    targetTenantId: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    tier: z.ZodDefault<z.ZodEnum<["STANDARD", "PREFERRED", "TRUSTED"]>>;
    dataSharingConfig: z.ZodObject<{
        shareInventory: z.ZodDefault<z.ZodBoolean>;
        sharePricing: z.ZodDefault<z.ZodBoolean>;
        shareOrders: z.ZodDefault<z.ZodBoolean>;
        shareShipments: z.ZodDefault<z.ZodBoolean>;
        allowedDocTypes: z.ZodArray<z.ZodEnum<["PO", "INVOICE", "ASN", "DELIVERY_NOTE", "LABEL", "BOL"]>, "many">;
    }, "strip", z.ZodTypeAny, {
        shareInventory?: boolean;
        sharePricing?: boolean;
        shareOrders?: boolean;
        shareShipments?: boolean;
        allowedDocTypes?: ("PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL")[];
    }, {
        shareInventory?: boolean;
        sharePricing?: boolean;
        shareOrders?: boolean;
        shareShipments?: boolean;
        allowedDocTypes?: ("PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL")[];
    }>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    targetTenantId?: string;
    tier?: "STANDARD" | "PREFERRED" | "TRUSTED";
    dataSharingConfig?: {
        shareInventory?: boolean;
        sharePricing?: boolean;
        shareOrders?: boolean;
        shareShipments?: boolean;
        allowedDocTypes?: ("PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL")[];
    };
}, {
    message?: string;
    targetTenantId?: string;
    tier?: "STANDARD" | "PREFERRED" | "TRUSTED";
    dataSharingConfig?: {
        shareInventory?: boolean;
        sharePricing?: boolean;
        shareOrders?: boolean;
        shareShipments?: boolean;
        allowedDocTypes?: ("PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL")[];
    };
}>;
export declare const VendorRegisterSchema: z.ZodObject<{
    companyName: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
    country: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    vatId: z.ZodOptional<z.ZodString>;
    categories: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    country?: string;
    companyName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    website?: string;
    vatId?: string;
    categories?: string[];
}, {
    country?: string;
    companyName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    website?: string;
    vatId?: string;
    categories?: string[];
}>;
export declare const SubscribeFeedSchema: z.ZodEffects<z.ZodObject<{
    partnerTenantId: z.ZodString;
    feedTypes: z.ZodArray<z.ZodEnum<["inventory", "orders", "shipments", "prices", "capacity"]>, "many">;
    deliveryMethod: z.ZodEnum<["WEBHOOK", "API_POLL", "SFTP", "AS2"]>;
    webhookUrl: z.ZodOptional<z.ZodString>;
    webhookSecret: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    partnerTenantId?: string;
    feedTypes?: ("inventory" | "orders" | "shipments" | "prices" | "capacity")[];
    deliveryMethod?: "WEBHOOK" | "API_POLL" | "SFTP" | "AS2";
    webhookUrl?: string;
    webhookSecret?: string;
}, {
    partnerTenantId?: string;
    feedTypes?: ("inventory" | "orders" | "shipments" | "prices" | "capacity")[];
    deliveryMethod?: "WEBHOOK" | "API_POLL" | "SFTP" | "AS2";
    webhookUrl?: string;
    webhookSecret?: string;
}>, {
    partnerTenantId?: string;
    feedTypes?: ("inventory" | "orders" | "shipments" | "prices" | "capacity")[];
    deliveryMethod?: "WEBHOOK" | "API_POLL" | "SFTP" | "AS2";
    webhookUrl?: string;
    webhookSecret?: string;
}, {
    partnerTenantId?: string;
    feedTypes?: ("inventory" | "orders" | "shipments" | "prices" | "capacity")[];
    deliveryMethod?: "WEBHOOK" | "API_POLL" | "SFTP" | "AS2";
    webhookUrl?: string;
    webhookSecret?: string;
}>;
export declare const CreateWebhookSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
}, {
    name?: string;
    url?: string;
    events?: string[];
    isActive?: boolean;
}>;
export declare const RegisterBusinessSchema: z.ZodObject<{
    companyName: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
    country: z.ZodString;
    website: z.ZodOptional<z.ZodString>;
    dunsNumber: z.ZodOptional<z.ZodString>;
    vatId: z.ZodOptional<z.ZodString>;
    planTier: z.ZodDefault<z.ZodEnum<["FREE", "PRO", "ENTERPRISE"]>>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    country?: string;
    companyName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    website?: string;
    vatId?: string;
    dunsNumber?: string;
    planTier?: "FREE" | "PRO" | "ENTERPRISE";
    acceptTerms?: boolean;
}, {
    country?: string;
    companyName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    website?: string;
    vatId?: string;
    dunsNumber?: string;
    planTier?: "FREE" | "PRO" | "ENTERPRISE";
    acceptTerms?: boolean;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    mfaCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
    mfaCode?: string;
}, {
    email?: string;
    password?: string;
    mfaCode?: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string;
}, {
    refreshToken?: string;
}>;
export declare const CreateApiKeySchema: z.ZodObject<{
    name: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<["po:read", "po:write", "invoice:read", "invoice:write", "asn:read", "asn:write", "labels:read", "labels:write", "tracking:read", "partners:read", "partners:write", "vendors:read", "analytics:read", "webhooks:read", "webhooks:write"]>, "many">;
    expiresAt: z.ZodOptional<z.ZodString>;
    rateLimit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    scopes?: ("po:read" | "po:write" | "invoice:read" | "invoice:write" | "asn:read" | "asn:write" | "labels:read" | "labels:write" | "tracking:read" | "partners:read" | "partners:write" | "vendors:read" | "analytics:read" | "webhooks:read" | "webhooks:write")[];
    expiresAt?: string;
    rateLimit?: number;
}, {
    name?: string;
    scopes?: ("po:read" | "po:write" | "invoice:read" | "invoice:write" | "asn:read" | "asn:write" | "labels:read" | "labels:write" | "tracking:read" | "partners:read" | "partners:write" | "vendors:read" | "analytics:read" | "webhooks:read" | "webhooks:write")[];
    expiresAt?: string;
    rateLimit?: number;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const DocumentSearchSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    type: z.ZodOptional<z.ZodEnum<["PO", "INVOICE", "ASN", "DELIVERY_NOTE", "LABEL", "BOL"]>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "SENT", "ACKNOWLEDGED", "ACCEPTED", "REJECTED", "CANCELLED", "PAID"]>>;
    partnerId: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL";
    status?: "DRAFT" | "SENT" | "ACKNOWLEDGED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "PAID";
    currency?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    partnerId?: string;
    from?: string;
    to?: string;
    q?: string;
    minAmount?: number;
    maxAmount?: number;
}, {
    type?: "PO" | "INVOICE" | "ASN" | "DELIVERY_NOTE" | "LABEL" | "BOL";
    status?: "DRAFT" | "SENT" | "ACKNOWLEDGED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "PAID";
    currency?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    partnerId?: string;
    from?: string;
    to?: string;
    q?: string;
    minAmount?: number;
    maxAmount?: number;
}>;
export type CreatePO = z.infer<typeof CreatePOSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type CreateASN = z.infer<typeof CreateASNSchema>;
export type GenerateLabel = z.infer<typeof GenerateLabelSchema>;
export type ConnectPartner = z.infer<typeof ConnectPartnerSchema>;
export type VendorRegister = z.infer<typeof VendorRegisterSchema>;
export type RegisterBusiness = z.infer<typeof RegisterBusinessSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type DocumentSearch = z.infer<typeof DocumentSearchSchema>;
//# sourceMappingURL=index.d.ts.map