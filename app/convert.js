const fs = require("fs")
const markdownIt = require("markdown-it")
const puppeteer = require("puppeteer")

async function convert() {
  // Read markdown and convert to HTML
  const md = new markdownIt({ html: true });
  const mdContent = fs.readFileSync("optimized_resume.md", "utf-8")
  const htmlContent = md.render(mdContent)

  // Read CSS
  const css = fs.readFileSync("style.css", "utf-8")

  // Wrap in HTML with custom CSS
  const finalHTML = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(finalHTML, { waitUntil: "load" })
  await page.pdf({ path: "output.pdf", format: "A4", printBackground: true })
  await browser.close()
}

convert()
