export interface PaypalEmail {
  email: string;
  bookTitle: string;
  format: string;
  date: string;
}

export interface Book {
  id: string;
  title: string;
  price: number;
  pdfUrl: string;
  epubUrl: string;
  pdfFileName?: string;
  epubFileName?: string;
  downloads?: number;
}

export interface Publication {
  id: string;
  title: string;
  outlet: string;
  date: string;
  url: string;
  pdfUrl: string;
  epubUrl: string;
  pdfFileName?: string;
  epubFileName?: string;
  downloads?: number;
}

export interface PaymentMerchantConfig {
  paypalEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
}

export interface WriterData {
  books: Book[];
  publications: Publication[];
  paypalEmails?: PaypalEmail[];
  merchantConfig?: PaymentMerchantConfig;
}
