import React, { forwardRef } from 'react';

const LOGO_URL = 'https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png';
const WATERMARK_URL = 'https://i.postimg.cc/G2hjVFLH/c583e512-b7bc-45ed-bed9-fa5b4c5060d7-removalai-preview.png';

const safe = (val) => (val === null || val === undefined ? '' : String(val));
const dateToWords = (dateStr) => { return dateStr; }; // আপনি চাইলে এখানে বাংলা/ইংরেজি ওয়ার্ড কনভার্টার বসাতে পারেন

const PDFTemplate = forwardRef(({ app, certSettings, qrCodeUrl, barcodeUrl }, ref) => {
  if (!app) return null;

  return (
    <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
      <div ref={ref} style={{ width: '800px', minHeight: '1130px', padding: '50px 60px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -45%)', opacity: 0.12, zIndex: 0, pointerEvents: 'none', textAlign: 'center' }}>
          <img src={WATERMARK_URL} alt="Watermark" style={{ width: '850px' }} crossOrigin="anonymous" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ width: '120px', textAlign: 'center', marginTop: '10px' }}>
              {qrCodeUrl && <img id="qr-img" src={qrCodeUrl} alt="QR" style={{ width: '110px', height: '110px', margin: '0 auto', display: 'block' }} />}
              <p style={{ fontSize: '13px', marginTop: '8px', fontWeight: 'bold', letterSpacing: '1px', color: '#555' }}>{certSettings?.qr_prefix}</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={LOGO_URL} alt="Logo" style={{ width: '75px', margin: '0 auto 10px auto', display: 'block' }} crossOrigin="anonymous" />
              <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#333', whiteSpace: 'nowrap' }}>{certSettings?.govt_name}</h1>
              <p style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#444' }}>{certSettings?.office_name}</p>
              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#222', lineHeight: '1.4' }}>
                <p style={{ margin: 0 }}>{certSettings?.custom_union_name ? certSettings.custom_union_name.split(',')[0].trim() : (app.union_en || app.union_name || '').split(',')[0].trim()}</p>
                <p style={{ margin: 0 }}>{safe(app.upazila_en || app.city_corp)}, {safe(app.district_en || app.district)}</p>
              </div>
              <p style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#555' }}>{certSettings?.rule_text}</p>
            </div>
            <div style={{ width: '150px', textAlign: 'right', marginTop: '15px' }}>
              {barcodeUrl && <img id="barcode-img" src={barcodeUrl} alt="Barcode" style={{ width: '150px', height: '45px' }} />}
            </div>
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 25px 0', fontFamily: 'Noto Sans Bengali, Arial, sans-serif', color: '#111' }}>জন্ম নিবন্ধন সনদ / Birth Registration Certificate</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '12px' }}>
            <div style={{ width: '30%' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Date of Registration</p>
              <p style={{ margin: 0, color: '#444' }}>{new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div style={{ width: '40%', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Birth Registration Number</p>
              <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0, color: '#111' }}>{app.tracking_id}</p>
            </div>
            <div style={{ width: '30%', textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Date of Issuance</p>
              <p style={{ margin: 0, color: '#444' }}>{new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '2', color: '#222' }}>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: '20%' }}>Date of Birth</div>
              <div style={{ width: '30%' }}>: {app.dob}</div>
              <div style={{ width: '15%' }}>Sex</div>
              <div style={{ width: '35%' }}>: {app.gender === 'পুরুষ' ? 'Male' : app.gender === 'মহিলা' ? 'Female' : 'Hijra'}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '25px' }}>
              <div style={{ width: '20%' }}>In Word</div>
              <div style={{ width: '80%' }}>: {dateToWords(app.dob)}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>নাম</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {app.first_name_bn} {app.last_name_bn}</div>
              <div style={{ width: '15%' }}>Name</div>
              <div style={{ width: '35%' }}>: {app.first_name_en} {app.last_name_en}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতা</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {app.mother_name_bn}</div>
              <div style={{ width: '15%' }}>Mother</div>
              <div style={{ width: '35%' }}>: {app.mother_name_en}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতার জাতীয়তা</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
              <div style={{ width: '15%' }}>Nationality</div>
              <div style={{ width: '35%' }}>: Bangladeshi</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতা</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {app.father_name_bn}</div>
              <div style={{ width: '15%' }}>Father</div>
              <div style={{ width: '35%' }}>: {app.father_name_en}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতার জাতীয়তা</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
              <div style={{ width: '15%' }}>Nationality</div>
              <div style={{ width: '35%' }}>: Bangladeshi</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>জন্মস্থান</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {(app.village_bn || '').split(',')[0].trim()}, {safe(app.district)}, বাংলাদেশ</div>
              <div style={{ width: '15%' }}>Place of Birth</div>
              <div style={{ width: '35%' }}>: {(app.village_en || '').split(',')[0].trim()}, {safe(app.district_en || app.district)}, Bangladesh</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>স্থায়ী ঠিকানা</div>
              <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {(app.house_road_bn || '').split(',')[0].trim()}, {(app.village_bn || '').split(',')[0].trim()}, {safe(app.post_office_bn)}, {safe(app.district)}।</div>
              <div style={{ width: '15%' }}>Permanent<br/>Address</div>
              <div style={{ width: '35%' }}>: {(app.house_road_en || '').split(',')[0].trim()}, {(app.village_en || '').split(',')[0].trim()}, {safe(app.post_office_en)}, {safe(app.district_en || app.district)}.</div>
            </div>
          </div>
          <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <div style={{ width: '40%' }}>
              <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '8px', display: 'inline-block', margin: 0, color: '#111' }}>Seal & Signature</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444' }}>Assistant to Registrar</p>
            </div>
            <div style={{ width: '40%', textAlign: 'right' }}>
              <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '8px', display: 'inline-block', margin: 0, color: '#111' }}>Seal & Signature</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444' }}>Registrar</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '40px', color: '#555', letterSpacing: '0.5px' }}>{certSettings?.footer_text}</div>
        </div>
      </div>
    </div>
  );
});

export default PDFTemplate;