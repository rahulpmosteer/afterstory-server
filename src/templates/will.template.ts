// src/templates/will.template.ts

interface WillTemplateData {
  profile: any;
  metadata: any;
  will: any;
  assets: any[];
  beneficiaries: any[];
  distribution: any;
  distribution_items: any[];
}

export function generateWillHtml(data: WillTemplateData): string {
  const { profile, metadata, will, assets, beneficiaries, distribution, distribution_items } = data;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hindiDate = today.toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const assetCategoryLabel: Record<string, string> = {
    property: 'Immovable Property / अचल संपत्ति',
    bank_account: 'Bank Account / बैंक खाता',
    investment: 'Investments / निवेश',
    jewellery: 'Jewellery / आभूषण',
    vehicle: 'Vehicle / वाहन',
    business: 'Business Interest / व्यापारिक हित',
    digital_asset: 'Digital Asset / डिजिटल संपत्ति',
    other: 'Other / अन्य',
  };

  // Build a lookup map for assets and beneficiaries
  const assetMap = new Map(assets.map((a: any) => [a.id, a]));
  const beneficiaryMap = new Map(beneficiaries.map((b: any) => [b.id, b]));

  const assetsHtml = assets.map((asset: any, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${assetCategoryLabel[asset.category] ?? asset.category}</td>
      <td>${asset.description}</td>
      <td>${asset.location_or_details ?? '—'}</td>
      <td>${asset.estimated_value
        ? `₹${Number(asset.estimated_value).toLocaleString('en-IN')}`
        : '—'
      }</td>
    </tr>
  `).join('');

  const beneficiariesHtml = beneficiaries.map((ben: any, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${ben.full_name}</td>
      <td>${ben.relationship}</td>
      <td>${ben.phone_number ?? '—'}</td>
      <td>${ben.address ?? '—'}</td>
    </tr>
  `).join('');

  // Generate distribution section based on mode
  let distributionHtml = '';
  if (distribution) {
    if (distribution.distribution_mode === 'simple') {
      // Simple mode — show percentage of estate per beneficiary
      const rows = distribution_items.map((item: any) => {
        const ben = beneficiaryMap.get(item.beneficiary_id);
        return `
          <tr>
            <td>${ben?.full_name ?? '—'}</td>
            <td>${ben?.relationship ?? '—'}</td>
            <td>Entire Estate / सम्पूर्ण संपत्ति</td>
            <td>${item.share_percentage}%</td>
          </tr>
        `;
      }).join('');

      distributionHtml = `
        <div class="section page-break">
          <div class="section-title">
            Distribution of Estate
            <span class="bilingual-label">/ संपत्ति का वितरण</span>
          </div>
          <p style="font-size:10pt; color:#555; margin-bottom:12px; font-style:italic;">
            I direct that my entire estate be distributed as follows.
            <br>मैं निर्देश देता/देती हूँ कि मेरी सम्पूर्ण संपत्ति निम्नानुसार वितरित की जाए।
          </p>
          <table>
            <thead>
              <tr>
                <th>Beneficiary / लाभार्थी</th>
                <th>Relationship / संबंध</th>
                <th>Asset / संपत्ति</th>
                <th>Share / हिस्सा</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } else {
      // By asset mode — group items by asset
      const groupedByAsset = new Map<string, any[]>();
      for (const item of distribution_items) {
        const key = item.asset_id ?? 'unallocated';
        if (!groupedByAsset.has(key)) {
          groupedByAsset.set(key, []);
        }
        groupedByAsset.get(key)!.push(item);
      }

      let rows = '';
      for (const [assetId, items] of groupedByAsset) {
        const asset = assetMap.get(assetId);
        items.forEach((item: any, idx: number) => {
          const ben = beneficiaryMap.get(item.beneficiary_id);
          rows += `
            <tr>
              <td>${idx === 0 ? (asset?.description ?? '—') : ''}</td>
              <td>${idx === 0
                ? (assetCategoryLabel[asset?.category] ?? '—')
                : ''
              }</td>
              <td>${ben?.full_name ?? '—'}</td>
              <td>${ben?.relationship ?? '—'}</td>
              <td>${item.share_percentage}%</td>
            </tr>
          `;
        });
      }

      distributionHtml = `
        <div class="section page-break">
          <div class="section-title">
            Distribution of Assets
            <span class="bilingual-label">/ संपत्तियों का वितरण</span>
          </div>
          <p style="font-size:10pt; color:#555; margin-bottom:12px; font-style:italic;">
            I direct that my assets be distributed to the following persons.
            <br>मैं निर्देश देता/देती हूँ कि मेरी संपत्तियाँ निम्नलिखित व्यक्तियों को दी जाएं।
          </p>
          <table>
            <thead>
              <tr>
                <th>Asset / संपत्ति</th>
                <th>Category / श्रेणी</th>
                <th>Beneficiary / लाभार्थी</th>
                <th>Relationship / संबंध</th>
                <th>Share / हिस्सा</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Last Will and Testament - ${profile?.full_name ?? ''}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Libre Baskerville', serif;
      color: #1a1a2e;
      background: #fff;
      font-size: 11pt;
      line-height: 1.7;
    }

    .header {
      background: linear-gradient(135deg, #1A237E 0%, #0D47A1 100%);
      color: white;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      font-family: 'Inter', sans-serif;
      font-size: 22pt;
      font-weight: 600;
      letter-spacing: 2px;
    }

    .brand-sub {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      opacity: 0.75;
      margin-top: 4px;
      letter-spacing: 1px;
    }

    .doc-badge {
      text-align: right;
      font-family: 'Inter', sans-serif;
    }

    .doc-badge .label {
      font-size: 8pt;
      opacity: 0.7;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .doc-badge .value {
      font-size: 10pt;
      font-weight: 500;
      margin-top: 2px;
    }

    .gold-bar {
      height: 4px;
      background: linear-gradient(90deg, #D4AF37, #F5D020, #D4AF37);
    }

    .doc-title {
      text-align: center;
      padding: 40px 40px 24px;
      border-bottom: 1px solid #e8e8e8;
    }

    .doc-title h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #1A237E;
      letter-spacing: 1px;
    }

    .doc-title h2 {
      font-size: 14pt;
      font-weight: 400;
      color: #555;
      margin-top: 6px;
      font-style: italic;
    }

    .doc-title .date {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      color: #888;
      margin-top: 12px;
    }

    .content { padding: 32px 40px; }

    .section { margin-bottom: 32px; }

    .section-title {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #1A237E;
      border-bottom: 2px solid #1A237E;
      padding-bottom: 6px;
      margin-bottom: 16px;
    }

    .bilingual-label {
      font-size: 9pt;
      color: #888;
      font-style: italic;
    }

    .declaration {
      background: #f8f9ff;
      border-left: 4px solid #1A237E;
      padding: 20px 24px;
      border-radius: 0 8px 8px 0;
      font-size: 10.5pt;
      line-height: 1.8;
    }

    .declaration .hindi {
      margin-top: 12px;
      color: #555;
      font-style: italic;
      font-size: 10pt;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }

    .info-item .label {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item .value {
      font-size: 11pt;
      color: #1a1a2e;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      font-family: 'Inter', sans-serif;
    }

    th {
      background: #1A237E;
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-size: 8.5pt;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }

    tr:nth-child(even) td { background: #fafafa; }

    .witness-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 8px;
    }

    .witness-box {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
    }

    .witness-box .number {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #1A237E;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .signature-section {
      margin-top: 48px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }

    .signature-box { text-align: center; }

    .signature-line {
      border-top: 1px solid #333;
      margin-bottom: 8px;
      padding-top: 8px;
    }

    .signature-label {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #555;
    }

    .disclaimer {
      margin-top: 40px;
      padding: 16px 20px;
      background: #fff8e1;
      border: 1px solid #D4AF37;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      color: #7a6000;
      line-height: 1.6;
    }

    .disclaimer strong {
      display: block;
      margin-bottom: 4px;
      font-size: 9pt;
    }

    .footer {
      margin-top: 32px;
      padding: 20px 40px;
      background: #f8f9ff;
      border-top: 1px solid #e8e8e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #aaa;
    }

    .page-break { page-break-before: always; }

    .instructions-box {
      background: #f8f9ff;
      border: 1px solid #e0e8ff;
      border-radius: 8px;
      padding: 16px 20px;
      font-size: 10.5pt;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">AFTERSTORY</div>
      <div class="brand-sub">LEGACY PLANNING PLATFORM</div>
    </div>
    <div class="doc-badge">
      <div class="label">Document Type</div>
      <div class="value">Last Will & Testament</div>
      <div class="label" style="margin-top:8px">Generated On</div>
      <div class="value">${formattedDate}</div>
    </div>
  </div>

  <div class="gold-bar"></div>

  <div class="doc-title">
    <h1>LAST WILL AND TESTAMENT</h1>
    <h2>अंतिम वसीयतनामा</h2>
    <div class="date">
      Executed at ${will.place_of_creation ?? '___________'}
      on ${formattedDate} (${hindiDate})
    </div>
  </div>

  <div class="content">

    <div class="section">
      <div class="section-title">
        Declaration of Intent
        <span class="bilingual-label">/ इरादे की घोषणा</span>
      </div>
      <div class="declaration">
        <p>
          I, <strong>${profile?.full_name ?? '___________'}</strong>,
          ${metadata?.date_of_birth
            ? `aged approximately ${new Date().getFullYear() - new Date(metadata.date_of_birth).getFullYear()} years,`
            : ''
          }
          residing at
          ${[metadata?.city, metadata?.state].filter(Boolean).join(', ') || '___________'},
          being of sound mind and disposing memory, and not acting under duress,
          menace, fraud, or undue influence of any person whatsoever, do hereby
          make, publish, and declare this to be my Last Will and Testament, hereby
          revoking all former Wills and Codicils made by me.
        </p>
        <p class="hindi">
          मैं, <strong>${profile?.full_name ?? '___________'}</strong>,
          स्वस्थ मन और स्मृति के साथ, बिना किसी दबाव या अनुचित प्रभाव के,
          इसे अपनी अंतिम वसीयत घोषित करता/करती हूँ और अपनी सभी पूर्व
          वसीयतें रद्द करता/करती हूँ।
        </p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        Testator Details
        <span class="bilingual-label">/ वसीयतकर्ता का विवरण</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Full Name / पूरा नाम</div>
          <div class="value">${profile?.full_name ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Religion / धर्म</div>
          <div class="value">${metadata?.religion ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Date of Birth / जन्म तिथि</div>
          <div class="value">${metadata?.date_of_birth ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Blood Group / रक्त समूह</div>
          <div class="value">${metadata?.blood_group ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">City / शहर</div>
          <div class="value">${metadata?.city ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">State / राज्य</div>
          <div class="value">${metadata?.state ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Phone / फ़ोन</div>
          <div class="value">${profile?.phone_number ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Community / समुदाय</div>
          <div class="value">${metadata?.community ?? '—'}</div>
        </div>
      </div>
    </div>

    <div class="section page-break">
      <div class="section-title">
        Schedule of Assets
        <span class="bilingual-label">/ संपत्तियों की अनुसूची</span>
      </div>
      <p style="font-size:10pt; color:#555; margin-bottom:12px; font-style:italic;">
        I declare the following assets to be my property.
        <br>मैं निम्नलिखित संपत्तियों को अपनी संपत्ति घोषित करता/करती हूँ।
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Category / श्रेणी</th>
            <th>Description / विवरण</th>
            <th>Location / स्थान</th>
            <th>Est. Value / अनुमानित मूल्य</th>
          </tr>
        </thead>
        <tbody>${assetsHtml}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">
        Beneficiaries
        <span class="bilingual-label">/ लाभार्थी</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name / नाम</th>
            <th>Relationship / संबंध</th>
            <th>Phone / फ़ोन</th>
            <th>Address / पता</th>
          </tr>
        </thead>
        <tbody>${beneficiariesHtml}</tbody>
      </table>
    </div>

    ${distributionHtml}

    <div class="section">
      <div class="section-title">
        Executor
        <span class="bilingual-label">/ निष्पादक</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Executor Name / निष्पादक का नाम</div>
          <div class="value">${will.executor_name ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Relationship / संबंध</div>
          <div class="value">${will.executor_relationship ?? '—'}</div>
        </div>
        <div class="info-item">
          <div class="label">Phone / फ़ोन</div>
          <div class="value">${will.executor_phone ?? '—'}</div>
        </div>
      </div>
    </div>

    ${will.special_instructions ? `
    <div class="section">
      <div class="section-title">
        Special Instructions
        <span class="bilingual-label">/ विशेष निर्देश</span>
      </div>
      <div class="instructions-box">${will.special_instructions}</div>
    </div>
    ` : ''}

    <div class="section page-break">
      <div class="section-title">
        Witnesses
        <span class="bilingual-label">/ गवाह</span>
      </div>
      <p style="font-size:10pt; color:#555; margin-bottom:16px; font-style:italic;">
        This Will is signed in the presence of the following witnesses.
        <br>यह वसीयत निम्नलिखित गवाहों की उपस्थिति में हस्ताक्षरित है।
      </p>
      <div class="witness-grid">
        <div class="witness-box">
          <div class="number">Witness 1 / गवाह १</div>
          <div class="info-item" style="margin-bottom:8px">
            <div class="label">Name / नाम</div>
            <div class="value">${will.witness1_name ?? '—'}</div>
          </div>
          <div class="info-item">
            <div class="label">Address / पता</div>
            <div class="value">${will.witness1_address ?? '—'}</div>
          </div>
          <div style="margin-top:24px; border-top:1px solid #ccc; padding-top:8px; font-size:9pt; color:#888;">
            Signature / हस्ताक्षर
          </div>
        </div>
        <div class="witness-box">
          <div class="number">Witness 2 / गवाह २</div>
          <div class="info-item" style="margin-bottom:8px">
            <div class="label">Name / नाम</div>
            <div class="value">${will.witness2_name ?? '—'}</div>
          </div>
          <div class="info-item">
            <div class="label">Address / पता</div>
            <div class="value">${will.witness2_address ?? '—'}</div>
          </div>
          <div style="margin-top:24px; border-top:1px solid #ccc; padding-top:8px; font-size:9pt; color:#888;">
            Signature / हस्ताक्षर
          </div>
        </div>
      </div>
    </div>

    <div class="signature-section">
      <div class="signature-box">
        <div style="height:60px;"></div>
        <div class="signature-line"></div>
        <div class="signature-label">
          Signature of Testator / वसीयतकर्ता के हस्ताक्षर
          <br>${profile?.full_name ?? ''}
        </div>
      </div>
      <div class="signature-box">
        <div style="height:60px;"></div>
        <div class="signature-line"></div>
        <div class="signature-label">
          Place & Date / स्थान और तिथि
          <br>${will.place_of_creation ?? ''}, ${formattedDate}
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>⚠️ Important Legal Notice / महत्वपूर्ण कानूनी सूचना</strong>
      This document has been generated by AfterStory as a draft Will for reference
      purposes only. This is NOT a legally executed Will. For this Will to be legally
      valid under the Indian Succession Act, 1925, it must be signed by the testator
      in the presence of two witnesses, and it is strongly recommended to have it
      reviewed and notarised by a qualified legal practitioner.
      <br><br>
      यह दस्तावेज़ AfterStory द्वारा केवल संदर्भ के लिए तैयार किया गया है।
      यह कानूनी रूप से निष्पादित वसीयत नहीं है। इसे वैध बनाने के लिए
      किसी योग्य वकील से परामर्श लें।
    </div>

  </div>

  <div class="footer">
    <div>Generated by AfterStory Legacy Planning Platform</div>
    <div>www.afterstory.in</div>
    <div>Document ID: ${will.id}</div>
  </div>

</body>
</html>
  `;
}