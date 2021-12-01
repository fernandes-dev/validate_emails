const puppeteer = require("puppeteer");
const emails = require("./emails.json");

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
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const email = "eduardo.yugan@gmail.com";

  await page.goto("https://pt.infobyip.com/verifyemailaccount.php");

  console.time(`tempo para validar email`);
  const emailIsValid = await validateEmail(email, page);
  console.log("email é válido? " + emailIsValid);

  await browser.close();

  console.timeEnd(`tempo para validar email`);
}

executeBrowser();
