const puppeteer = require("puppeteer");
const fs = require("fs");

async function validateEmail(email, page) {
  if (!email || !page) return;

  try {
    const input = await page.$("#email");
    await input.focus();
    await input.type(email);

    const [, button] = await page.$$("input");
    button.click();

    await page.waitForNavigation();

    const output = await page.$("#output");
    const outputText = await output.$eval(".left", (e) => e.innerHTML);
    const emailisValid =
      outputText.includes("Conta de e-mail existe") &&
      outputText.includes("Conectou com sucesso ao") &&
      outputText.includes(" encontrado.") &&
      outputText.includes("is a valid email address.");

    return emailisValid;
  } catch (error) {
    console.log("deu erro", error.message);
  }
}

async function executeBrowser() {
  // const emails = require("./emails.json");
  const emails = [
    { email: "eduardo.yyuganasjd@asd.com" },
    { email: "eduardo.yyuganasjd@asd.com" },
    { email: "eduardo.yyuganasjd@asd.com" },
  ];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://pt.infobyip.com/verifyemailaccount.php");

  const invalidEmails = [];

  console.time(`tempo para validar emails`);
  for await (const { email } of emails) {
    console.time(`tempo para validar o email: ${email}`);
    const isValid = await validateEmail(email, page);

    if (!isValid) invalidEmails.push(email);

    console.log(`o email ${email} é ${isValid ? "válido" : "inválido"} \n`);
    console.timeEnd(`tempo para validar o email: ${email}`);
  }
  console.timeEnd(`tempo para validar emails`);

  fs.writeFileSync("invalidEmails.txt", invalidEmails.join("\n"));

  await browser.close();
}

executeBrowser();
