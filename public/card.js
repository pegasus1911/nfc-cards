async function loadCard() {
  try {
    // نجيب الـ slug من الـ URL
    const parts = window.location.pathname.split('/');
    const slug = parts[parts.length - 1];

    const res = await fetch(`/api/cards/${slug}`);
    if (!res.ok) {
      document.body.innerHTML = '<p style="color:white;text-align:center;">Card not found</p>';
      return;
    }

    const card = await res.json();

    // RTL support
    if (card.rtl) {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }

    // نملأ البيانات في الصفحة
    document.getElementById('fullName').textContent = card.fullName || '';
    document.getElementById('jobTitle').textContent = card.jobTitle || '';
    document.getElementById('company').textContent = card.company || '';

    const avatarImg = document.getElementById('avatar');
    if (card.avatarUrl) {
      avatarImg.src = card.avatarUrl;
    } else {
      avatarImg.style.display = 'none';
    }

    // أزرار التواصل
    const callBtn = document.getElementById('callBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const emailBtn = document.getElementById('emailBtn');
    const websiteBtn = document.getElementById('websiteBtn');
    const linkedinBtn = document.getElementById('linkedinBtn');
    const instagramBtn = document.getElementById('instagramBtn');

    if (card.phone) {
      callBtn.href = `tel:${card.phone}`;
    } else {
      callBtn.style.display = 'none';
    }

    if (card.whatsapp) {
      const clean = card.whatsapp.replace(/\D/g, '');
      whatsappBtn.href = `https://wa.me/${clean}`;
    } else {
      whatsappBtn.style.display = 'none';
    }

    if (card.email) {
      emailBtn.href = `mailto:${card.email}`;
    } else {
      emailBtn.style.display = 'none';
    }

    if (card.website) {
      websiteBtn.href = card.website;
    } else {
      websiteBtn.style.display = 'none';
    }

    if (card.linkedin) {
      linkedinBtn.href = card.linkedin;
    } else {
      linkedinBtn.style.display = 'none';
    }

    if (card.instagram) {
      instagramBtn.href = card.instagram;
    } else {
      instagramBtn.style.display = 'none';
    }

    // زرار Save Contact (vCard)
    const saveBtn = document.getElementById('saveContactBtn');
    saveBtn.addEventListener('click', () => {
      const vcardLines = [
        'BEGIN:VCARD',
        'VERSION=3.0',
        `FN:${card.fullName || ''}`,
        card.company ? `ORG:${card.company}` : '',
        card.jobTitle ? `TITLE:${card.jobTitle}` : '',
        card.phone ? `TEL;TYPE=CELL:${card.phone}` : '',
        card.email ? `EMAIL:${card.email}` : '',
        card.website ? `URL:${card.website}` : '',
        'END:VCARD'
      ].filter(Boolean);

      const blob = new Blob([vcardLines.join('\r\n')], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(card.fullName || 'contact').replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<p style="color:white;text-align:center;">Error loading card</p>';
  }
}

loadCard();
