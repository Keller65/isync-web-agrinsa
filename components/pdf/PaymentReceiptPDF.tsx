'use client';

import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';
import { Payment } from '@/types/payments';

const formatMoney = (amount: number) => {
  return amount.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('es-HN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  page: {
    width: 280,
    minHeight: 'auto',
    padding: 10,
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  center: {
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  titleBold: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#000',
    marginVertical: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  colDate: { width: '20%' },
  colInvoice: { width: '35%' },
  colBalance: { width: '22%', textAlign: 'right' },
  colPayment: { width: '23%', textAlign: 'right' },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 9,
  },
  footerCompany: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 8,
    color: '#555',
  },
});

interface PaymentReceiptPDFProps {
  payment: Payment;
}

export function PaymentReceiptPDF({ payment }: PaymentReceiptPDFProps) {
  const pay = payment.payment?.[0] ?? {};

  let paymentExtra = null;
  if (payment.paymentMeans === 'Tarjeta') {
    paymentExtra = (
      <View style={styles.row}>
        <Text>Referencia</Text>
        <Text>{pay.cardVoucherNum ?? 'N/D'}</Text>
      </View>
    );
  } else if (payment.paymentMeans === 'Cheque') {
    paymentExtra = (
      <View>
        <View style={styles.row}>
          <Text>Banco</Text>
          <Text>{pay.bankCode ?? 'N/D'}</Text>
        </View>
        <View style={styles.row}>
          <Text>N° Cheque</Text>
          <Text>{pay.checkNumber ?? 'N/D'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Fecha Cheque</Text>
          <Text>{pay.dueDate ? formatDate(pay.dueDate) : 'N/D'}</Text>
        </View>
      </View>
    );
  } else if (payment.paymentMeans === 'Transferencia') {
    paymentExtra = (
      <View>
        <View style={styles.row}>
          <Text>Fecha</Text>
          <Text>{pay.transferDate ? formatDate(pay.transferDate) : 'N/D'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Referencia</Text>
          <Text>{pay.transferReference ?? 'N/D'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Cuenta</Text>
          <Text>{pay.transferAccountName ?? 'N/D'}</Text>
        </View>
      </View>
    );
  }

  const totalPendiente = payment.invoices.reduce(
    (acc, inv) => acc + (inv.docTotal - inv.appliedAmount),
    0
  );

  return (
    <Document>
      <Page size={[280, 'auto']} style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.titleBold}>iSync Web Demo</Text>
        </View>

        <View>
          <View style={styles.row}>
            <Text style={styles.bold}>Recibo</Text>
            <Text>{payment.docNum}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Cliente</Text>
            <Text>{payment.cardCode} - {payment.cardName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Fecha</Text>
            <Text>{formatDate(payment.docDate)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.center}>
          <Text style={styles.sectionTitle}>Recibo de Cobros</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Facturas</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colDate}>FECHA</Text>
          <Text style={styles.colInvoice}>FACTURA</Text>
          <Text style={[styles.colBalance]}>SALDO ANT.</Text>
          <Text style={[styles.colPayment]}>ABONO</Text>
        </View>

        {payment.invoices.map((invoice, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDate}>{formatDate(invoice.invoiceDate)}</Text>
            <Text style={styles.colInvoice}>{invoice.numAtCard}</Text>
            <Text style={[styles.colBalance]}>L. {formatMoney(invoice.docTotal)}</Text>
            <Text style={[styles.colPayment]}>L. {formatMoney(invoice.appliedAmount)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Pago</Text>
        <View style={styles.row}>
          <Text>Método</Text>
          <Text>{payment.paymentMeans}</Text>
        </View>
        {paymentExtra}

        <View style={styles.row}>
          <Text style={styles.bold}>Total pagado</Text>
          <Text style={styles.bold}>L. {formatMoney(payment.total)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.bold}>Saldo pendiente</Text>
          <Text style={styles.bold}>L. {formatMoney(totalPendiente)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text>¡Gracias por su pago!</Text>
          <Text>Dudas o reclamos llamar al 9595-5397</Text>
        </View>

        <View style={styles.footerCompany}>
          <Text>Powered By iSync</Text>
        </View>
      </Page>
    </Document>
  );
}