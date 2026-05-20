'use client';

import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import { OrderDetailType } from '@/types/orders';
import LogoImage from "@/public/assets/iSync.png";

const formatMoney = (amount: number) => {
  return amount.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
    color: '#000000',
    position: 'relative'
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  logoBox: {
    position: "absolute",
    top: 0,
    left: 10
  },
  logoImage: {
    width: 90,
    height: 90,
  },
  companyInfo: {
    flex: 1,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  companySubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    margin: 2,
  },
  companyDetail: {
    fontSize: 9,
    margin: 1,
    lineHeight: 1.2,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    textTransform: 'uppercase',
  },
  infoTable: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  infoValue: {
    fontSize: 10,
  },
  labelCol: { width: '12%' },
  valueCol: { width: '38%' },
  labelCol2: { width: '15%' },
  valueCol2: { width: '35%' },

  tableArticles: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  thCode: { width: '10%' },
  thDesc: { width: '25%' },
  thCant: { width: '8%', textAlign: 'center' },
  thPU: { width: '12%', textAlign: 'right' },
  thImporte: { width: '12%', textAlign: 'right' },
  thISV: { width: '10%', textAlign: 'right' },
  thTaxCode: { width: '8%', textAlign: 'center' },
  thTotal: { width: '15%', textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  emptyRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 4,
    height: 24,
  },

  tdCode: { width: '10%', fontSize: 9 },
  tdDesc: { width: '25%', fontSize: 9 },
  tdCant: { width: '8%', fontSize: 9, textAlign: 'center' },
  tdPU: { width: '12%', fontSize: 9, textAlign: 'right' },
  tdImporte: { width: '12%', fontSize: 9, textAlign: 'right' },
  tdISV: { width: '10%', fontSize: 9, textAlign: 'right' },
  tdTaxCode: { width: '8%', fontSize: 9, textAlign: 'center' },
  tdTotal: { width: '15%', fontSize: 9, textAlign: 'right' },

  footerSection: {
    flexDirection: 'row',
    marginTop: 25,
    justifyContent: 'space-between',
  },
  notesSection: {
    width: '60%',
    fontSize: 9,
  },
  totalsBox: {
    width: '35%',
  },
  totalsTable: {
    width: '100%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#000',
  },
  totalFinalLabel: {
    fontWeight: 'bold',
    fontSize: 11,
    paddingTop: 4,
  },
  totalFinalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingTop: 4,
  },
  poweredBy: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    fontSize: 8,
    color: '#888888',
    textAlign: 'center',
  },
});

interface OrderPDFProps {
  order?: OrderDetailType | null;
  sellerName?: string;
}

const OrderPDF: React.FC<OrderPDFProps> = ({ order, sellerName = '' }) => {
  // Validación inicial
  if (!order) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No hay datos del pedido para generar el PDF.</Text>
        </Page>
      </Document>
    );
  }

  // Extracción de variables con valores por defecto
  const docDate = new Date(order.docDate ?? "").toLocaleDateString("es-HN");
  const cardName = order.cardName ?? "";
  const federalTaxID = order.federalTaxID ?? "";
  const docNum = order.docNum ?? "";
  const comments = order.comments ?? "";
  const lines = order.lines ?? [];

  // Cálculos
  let productsViews: React.ReactNode[] = [];
  let subtotalCalculated = 0;
  let totalISVCalculated = 0;

  lines.forEach((item, index) => {
    const itemTaxCode = (item as any).taxCode ?? "";
    const priceAfterVAT = item.priceAfterVAT ?? 0;
    const quantity = item.quantity ?? 0;

    const isISV = itemTaxCode === "ISV15";
    const isEXE = itemTaxCode === "EXE";

    let lineNetTotal = 0;
    let lineISVTotal = 0;
    let lineTotalWithISV = 0;

    if (isISV) {
      // Producto con ISV: calcular impuesto
      const isvPerUnit = priceAfterVAT - (priceAfterVAT / 1.15);
      lineISVTotal = quantity * isvPerUnit;
      lineNetTotal = (quantity * priceAfterVAT) / 1.15;
      lineTotalWithISV = lineNetTotal + lineISVTotal;
    } else if (isEXE) {
      // Producto exento: NO calcular ISV
      lineNetTotal = quantity * priceAfterVAT;
      lineISVTotal = 0;
      lineTotalWithISV = lineNetTotal;
    } else {
      // Otros casos (por defecto, sin ISV)
      lineNetTotal = quantity * priceAfterVAT;
      lineISVTotal = 0;
      lineTotalWithISV = lineNetTotal;
    }

    subtotalCalculated += lineNetTotal;
    totalISVCalculated += isISV ? lineISVTotal : 0;

    productsViews.push(
      <View key={item.itemCode || index} style={styles.tableRow}>
        <Text style={styles.tdCode}>{item.itemCode ?? ""}</Text>
        <Text style={styles.tdDesc}>{item.itemDescription ?? ""}</Text>
        <Text style={styles.tdCant}>{quantity.toFixed(2)}</Text>
        <Text style={styles.tdPU}>L{formatMoney(priceAfterVAT)}</Text>
        <Text style={styles.tdImporte}>L{formatMoney(lineNetTotal)}</Text>
        <Text style={styles.tdISV}>L{formatMoney(lineISVTotal)}</Text>
        <Text style={styles.tdTaxCode}>{itemTaxCode}</Text>
        <Text style={styles.tdTotal}>L{formatMoney(lineTotalWithISV)}</Text>
      </View>
    );
  });

  // Filas vacías mínimas
  const minRows = 8;
  if (lines.length < minRows) {
    for (let i = lines.length; i < minRows; i++) {
      productsViews.push(
        <View key={`empty-${i}`} style={styles.emptyRow} />
      );
    }
  }

  const isvCalculated = totalISVCalculated;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.logoBox}>
          <Image
            style={styles.logoImage}
            src={LogoImage.src}
          />
        </View>

        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>iSync SAP Business One</Text>
            <Text style={styles.companySubtitle}>
              iSync Web Demo
            </Text>
            <Text style={styles.companyDetail}>
              Barrio Suyapa 15 avenida 9 Calle S, 21104 San Pedro Sula, Cortés, Honduras
            </Text>
            <Text style={styles.companyDetail}>
              E-mail: desarrollo@solteci.com
            </Text>
            <Text style={styles.companyDetail}>
              <Text style={{ fontWeight: 'bold' }}>
                RTN: 0501-0000-000000
              </Text>
            </Text>
          </View>
        </View>

        <Text style={styles.docTitle}>Oferta - {docNum || 'SN'}</Text>

        {/* INFO */}
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.labelCol]}>Fecha:</Text>
            <Text style={[styles.infoValue, styles.valueCol]}>{docDate}</Text>

            <Text style={[styles.infoLabel, styles.labelCol2]}>Vendedor:</Text>
            <Text style={[styles.infoValue, styles.valueCol2]}>
              {sellerName}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.labelCol]}>Cliente:</Text>
            <Text style={[styles.infoValue, styles.valueCol]}>
              {cardName}
            </Text>

            <Text style={[styles.infoLabel, styles.labelCol2]}>
              RTN Cliente:
            </Text>
            <Text style={[styles.infoValue, styles.valueCol2]}>
              {federalTaxID}
            </Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableArticles}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.thCode]}>Código</Text>
            <Text style={[styles.tableHeaderCell, styles.thDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.thCant]}>Cant</Text>
            <Text style={[styles.tableHeaderCell, styles.thPU]}>P/U</Text>
            <Text style={[styles.tableHeaderCell, styles.thImporte]}>Importe</Text>
            <Text style={[styles.tableHeaderCell, styles.thISV]}>ISV</Text>
            <Text style={[styles.tableHeaderCell, styles.thTaxCode]}></Text>
            <Text style={[styles.tableHeaderCell, styles.thTotal]}>Total</Text>
          </View>

          {productsViews}
        </View>

        {/* FOOTER */}
        <View style={styles.footerSection}>
          <View style={styles.notesSection}>
            <Text>
              <Text style={{ fontWeight: 'bold' }}>
                Nota: La Oferta tiene vigencia por 15 días
              </Text>
            </Text>

            <Text style={{ marginTop: 5 }}>
              <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
            </Text>

            <Text>{comments}</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsTable}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Neto:</Text>
                <Text style={styles.totalsValue}>
                  L{formatMoney(subtotalCalculated)}
                </Text>
              </View>

              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Impuesto:</Text>
                <Text style={styles.totalsValue}>
                  L{formatMoney(isvCalculated)}
                </Text>
              </View>

              <View style={styles.totalFinalRow}>
                <Text style={styles.totalFinalLabel}>Total General:</Text>
                <Text style={styles.totalFinalValue}>
                  L{formatMoney(order.docTotal ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.poweredBy}>Powered by iSync Web</Text>
      </Page>
    </Document>
  );
};

export default OrderPDF;