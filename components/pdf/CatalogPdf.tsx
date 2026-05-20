import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.8/files/poppins-latin-400-normal.woff", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.8/files/poppins-latin-600-normal.woff", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.8/files/poppins-latin-700-normal.woff", fontWeight: 700 },
  ],
})

export interface CatalogProduct {
  itemCode: string
  itemName: string
  price: number
  imageBase64?: string | null
}

interface Props {
  products: CatalogProduct[]
  title: string
}

const BLACK = "#111111"
const GRAY = "#6b7280"
const GRAY_LIGHT = "#f5f5f5"
const BORDER = "#e0e0e0"
const PRODUCTS_PER_PAGE = 6

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: "Poppins",
    backgroundColor: "#ffffff",
  },
  /* ---- header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BLACK,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: BLACK,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 9,
    color: GRAY,
    fontWeight: 400,
  },
  /* ---- product grid ---- */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "31.5%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  imgWrap: {
    height: 130,
    backgroundColor: GRAY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  img: {
    width: "100%",
    height: 130,
    objectFit: "contain",
  },
  cardBody: {
    padding: 10,
  },
  code: {
    fontSize: 7.5,
    color: GRAY,
    fontWeight: 400,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 9,
    fontWeight: 600,
    color: BLACK,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GRAY_LIGHT,
    marginHorizontal: -10,
    marginBottom: -10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  price: {
    fontSize: 11,
    fontWeight: 700,
    color: BLACK,
  },
  /* ---- footer ---- */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: GRAY,
    fontWeight: 400,
  },
})

export default function CatalogPdf({ products, title }: Props) {
  const pages = chunk(products, PRODUCTS_PER_PAGE)
  const totalPages = pages.length || 1
  const today = new Date().toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Document>
      {pages.map((pageProducts, pageIdx) => (
        <Page key={pageIdx} size="A4" style={s.page}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>{title}</Text>
              <Text style={s.headerSub}>
                {products.length} productos — {today}
              </Text>
            </View>
          </View>

          {/* Product grid */}
          <View style={s.grid}>
            {pageProducts.map((p) => (
              <View key={p.itemCode} style={s.card}>
                <View style={s.imgWrap}>
                  {p.imageBase64 ? (
                    <Image style={s.img} src={p.imageBase64} />
                  ) : (
                    <Text style={{ fontSize: 9, color: GRAY }}>Sin imagen</Text>
                  )}
                </View>

                <View style={s.cardBody}>
                  <Text style={s.code}>{p.itemCode}</Text>
                  <Text style={s.name}>{p.itemName}</Text>
                  <View style={s.priceRow}>
                    <Text style={s.price}>
                      L {p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>
              {title}
            </Text>
            <Text style={s.footerText}>
              Página {pageIdx + 1} de {totalPages}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}