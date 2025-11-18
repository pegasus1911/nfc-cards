const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const DATA_FILE = path.join(__dirname, '..', 'data', 'cards.json');

function loadCards() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Cannot read cards.json', err);
    return [];
  }
}

function saveCards(cards) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf8');
}

async function main() {
  const cards = loadCards();
  if (!cards.length) {
    console.log('No cards found.');
    return;
  }

  // SMTP setup
  const transporter = nodemailer.createTransport({
    service: 'gmail', // أو smtp آخر
    auth: {
      user: process.env.REPORT_EMAIL_USER,
      pass: process.env.REPORT_EMAIL_PASS
    }
  });

  const now = new Date();
  const periodLabel = now.toLocaleString('en', {
    month: 'long',
    year: 'numeric'
  });

  for (const card of cards) {
    const email = (card.email || '').trim();
    if (!email) {
      continue; // مفيش إيميل لصاحب الكارت
    }

    const total = card.views || 0;
    const month = card.viewsMonth || 0;

    const name = card.fullName || 'there';

    const text = `
Hi ${name},

Here are your NFC card stats for ${periodLabel}:

- Views this month: ${month}
- Total views so far: ${total}

Thanks for using our Alsaiady Business Card platform.

Best regards,
Alsaiady NFC Cards 
`.trim();

    try {
      await transporter.sendMail({
        from: `"NFC Cards Platform" <${process.env.REPORT_EMAIL_USER}>`,
        to: email,
        subject: `Your NFC card stats for ${periodLabel}`,
        text
      });

      console.log(`Report sent to ${name} <${email}>`);
    } catch (err) {
      console.error(`Failed to send email to ${email}`, err);
    }

    // صفّر عداد الشهر بعد ما تبعت التقرير
    card.viewsMonth = 0;
  }

  saveCards(cards);
  console.log('Monthly report completed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
