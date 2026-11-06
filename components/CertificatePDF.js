import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// 🟢 তৈরি করা JSON ফাইল থেকে ডেটা ইমপোর্ট করা হচ্ছে
import fontData from '../lib/fontData.json'; 

Font.register({
  family: 'NotoBengali',
  fonts: [
    { 
      src: `data:font/ttf;base64,${fontData.notoFontBase64}`, 
      fontWeight: 400 
    }
  ]
});

// বাকি কোড অপরিবর্তিত থাকবে...

const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return a[num].trim();
  if (num < 100) return (b[Math.floor(num / 10)] + ' ' + a[num % 10]).trim();
  if (num < 1000) return (a[Math.floor(num / 100)] + 'Hundred ' + numberToWords(num % 100)).trim();
  if (num < 100000) return (numberToWords(Math.floor(num / 1000)) + ' Thousand ' + numberToWords(num % 1000)).trim();
  return num.toString();
};

const dateToWords = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d = parseInt(day, 10);
  const m = months[parseInt(month, 10) - 1];
  const y = parseInt(year, 10);
  return `${numberToWords(d)} of ${m} ${numberToWords(y)}`;
};

const styles = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 35, paddingHorizontal: 45, fontFamily: 'Helvetica', position: 'relative', backgroundColor: '#ffffff', fontSize: 9.5 },
  watermark: { position: 'absolute', top: 130, left: 20, width: 550, height: 550, opacity: 0.4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  qrContainer: { alignItems: 'flex-start', width: 100 },
  qrImage: { width: 70, height: 70 },
  qrText: { fontSize: 9, marginTop: 3, marginLeft: 15, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', flex: 1, marginTop: -5 },
  logo: { width: 55, height: 55, marginBottom: 5 },
  
  titleEn: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  titleSub: { fontSize: 9, textAlign: 'center', marginTop: 3 },
  titleSub2: { fontSize: 9.5, textAlign: 'center', marginTop: 10, fontWeight: 'bold', color: '#333' },
  titleSub3: { fontSize: 8, textAlign: 'center', marginTop: 3, color: '#555' },
  
  titleBn: { fontSize: 16, fontWeight: 'bold', fontFamily: 'NotoBengali', textAlign: 'center', marginTop: 12, marginBottom: 15 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metaCol: { width: '30%' },
  metaLabel: { fontSize: 8.5, fontWeight: 'bold', marginBottom: 3 },
  metaValue: { fontSize: 9.5 },
  brnCol: { width: '40%', alignItems: 'center' },
  brnValue: { fontSize: 11, fontWeight: 'bold', marginTop: 3 },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  labelEnLeft: { width: 75, fontSize: 9.5 },
  labelBn: { width: 80, fontFamily: 'NotoBengali', fontSize: 10.5, fontStyle: 'italic' },
  labelEnRight: { width: 85, fontSize: 9.5 },
  valEnLeft: { width: 130, fontSize: 9.5 },
  valBn: { width: 150, fontFamily: 'NotoBengali', fontSize: 10.5, fontStyle: 'italic' },
  valEnRight: { flex: 1, fontSize: 9.5 },
  addrLabelBn: { width: 80, fontFamily: 'NotoBengali', fontSize: 10.5, fontStyle: 'italic', marginTop: 6 },
  addrValBn: { width: 150, fontFamily: 'NotoBengali', fontSize: 10.5, fontStyle: 'italic', marginTop: 6 },
  addrLabelEn: { width: 85, fontSize: 9.5, marginTop: 6 },
  addrValEn: { flex: 1, fontSize: 9.5, marginTop: 6 },
  footer: { position: 'absolute', bottom: 55, left: 45, right: 45, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, fontWeight: 'bold' },
  footerSub: { fontSize: 9, marginTop: 3 },
  bottomNote: { position: 'absolute', bottom: 20, left: 45, right: 45, fontSize: 6.5, textAlign: 'center', color: '#444' }
});

const CertificatePDF = ({ data }) => {
  const d = data || {};
  const birthAddr = d.birthAddress || {};
  
  const safeStr = (v) => (v === null || v === undefined ? '' : String(v));
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  };

  const dobFormatted = formatDate(d.dob);
  const dobInWords = dateToWords(d.dob);

  let genderEn = d.gender;
  if (d.gender === 'পুরুষ') genderEn = 'Male';
  else if (d.gender === 'মহিলা') genderEn = 'Female';
  else if (d.gender === 'হিজড়া') genderEn = 'Hijra';

  const unionEn = birthAddr.unionEn || 'Union';
  const upazilaEn = birthAddr.upazilaEn || 'Sadar';
  const districtEn = birthAddr.districtEn || 'Dhaka';
  
  const districtBn = birthAddr.district || '';

  const placeOfBirthEn = `${birthAddr.villageEn ? birthAddr.villageEn + ', ' : ''}${districtEn}, Bangladesh`;
  const placeOfBirthBn = `${birthAddr.villageBn ? birthAddr.villageBn + ', ' : ''}${districtBn}, বাংলাদেশ`;
  
  const permanentAddressEn = `${birthAddr.houseRoadEn ? birthAddr.houseRoadEn + ', ' : ''}${birthAddr.villageEn}, ${birthAddr.postOfficeEn}, ${districtEn}.`;
  const permanentAddressBn = `${birthAddr.houseRoadBn ? birthAddr.houseRoadBn + ', ' : ''}${birthAddr.villageBn}, ${birthAddr.postOfficeBn}, ${districtBn}।`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src="https://i.postimg.cc/G2hjVFLH/c583e512-b7bc-45ed-bed9-fa5b4c5060d7-removalai-preview.png" style={styles.watermark} />

        <View style={styles.headerRow}>
          <View style={styles.qrContainer}>
            {d.qrCodeUrl && <Image src={d.qrCodeUrl} style={styles.qrImage} />}
            <Text style={styles.qrText}>ASERTR</Text>
          </View>
          
          <View style={styles.logoContainer}>
            <Image src="https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png" style={styles.logo} />
            
            <Text style={styles.titleEn}>Government of the People's Republic of Bangladesh</Text>
            <Text style={styles.titleSub}>Office of the Register, Birth and Death Registration</Text>
            <Text style={styles.titleSub2}>
              {unionEn}, {upazilaEn}, {districtEn}
            </Text>
            <Text style={styles.titleSub3}>(Rule 9, 10)</Text>
          </View>

          <View style={styles.qrContainer}>
            {d.barcodeUrl && <Image src={d.barcodeUrl} style={{ width: 130, height: 45, marginLeft: 10 }} />}
          </View>
        </View>

        <Text style={styles.titleBn}>জন্ম নিবন্ধন সনদ / Birth Registration Certificate</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Date of Registration</Text>
            <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.brnCol}>
            <Text style={styles.metaLabel}>Birth Registration Number</Text>
            <Text style={styles.brnValue}>{safeStr(d.brnNumber) || 'N/A'}</Text>
          </View>
          <View style={{ ...styles.metaCol, alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Date of Issuance</Text>
            <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB')}</Text>
          </View>
        </View>

        <View style={{ marginTop: 15 }}>
          <View style={styles.row}>
            <Text style={styles.labelEnLeft}>Date of Birth</Text>
            <Text style={styles.valEnLeft}>: {dobFormatted}</Text>
            <Text style={styles.labelEnRight}>Sex</Text>
            <Text style={styles.valEnRight}>: {genderEn}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.labelEnLeft}>In Word</Text>
            <Text style={styles.valEnLeft}>: {dobInWords}</Text>
          </View>

          <View style={{ ...styles.row, marginTop: 15 }}>
            <Text style={styles.labelBn}>নাম</Text>
            <Text style={styles.valBn}>: {safeStr(d.nameBn)}</Text>
            <Text style={styles.labelEnRight}>Name</Text>
            <Text style={styles.valEnRight}>: {safeStr(d.nameEn)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.labelBn}>মাতা</Text>
            <Text style={styles.valBn}>: {safeStr(d.motherNameBn)}</Text>
            <Text style={styles.labelEnRight}>Mother</Text>
            <Text style={styles.valEnRight}>: {safeStr(d.motherNameEn)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.labelBn}>মাতার জাতীয়তা</Text>
            <Text style={styles.valBn}>: বাংলাদেশী</Text>
            <Text style={styles.labelEnRight}>Nationality</Text>
            <Text style={styles.valEnRight}>: Bangladeshi</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.labelBn}>পিতা</Text>
            <Text style={styles.valBn}>: {safeStr(d.fatherNameBn)}</Text>
            <Text style={styles.labelEnRight}>Father</Text>
            <Text style={styles.valEnRight}>: {safeStr(d.fatherNameEn)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.labelBn}>পিতার জাতীয়তা</Text>
            <Text style={styles.valBn}>: বাংলাদেশী</Text>
            <Text style={styles.labelEnRight}>Nationality</Text>
            <Text style={styles.valEnRight}>: Bangladeshi</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.addrLabelBn}>জন্মস্থান</Text>
            <Text style={styles.addrValBn}>: {placeOfBirthBn}</Text>
            <Text style={styles.addrLabelEn}>Place of Birth</Text>
            <Text style={styles.addrValEn}>: {placeOfBirthEn}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.addrLabelBn}>স্থায়ী ঠিকানা</Text>
            <Text style={styles.addrValBn}>: {permanentAddressBn}</Text>
            <Text style={styles.addrLabelEn}>Permanent{'\n'}Address</Text>
            <Text style={styles.addrValEn}>: {permanentAddressEn}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>Seal & Signature</Text>
            <Text style={styles.footerSub}>Assistant to Registrar</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.footerText}>Seal & Signature</Text>
            <Text style={styles.footerSub}>Registrar</Text>
          </View>
        </View>
        
        <Text style={styles.bottomNote}>
          This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code.
        </Text>
      </Page>
    </Document>
  );
};

export default CertificatePDF;