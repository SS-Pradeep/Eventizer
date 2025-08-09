const puppeteer = require('puppeteer');

async function generatePdfBuffer(st_date, end_date, reason) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`<html><p>I am writing to formally request leave from ${st_date} to ${end_date} due to ${reason}. I will ensure that all my current tasks are either completed or delegated before my leave begins.</p></html>`);
    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF buffer:', error);
    throw error;
  }
}

module.exports = generatePdfBuffer;
