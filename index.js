const puppeteer = require("puppeteer");
const fs = require("fs");

async function validateEmail(email, page) {
  if (!email || !page) throw new Error("Invalid parameters");

  try {
    const input = await page.$("#email");
    await input.focus();
    await input.type(email);

    const [, button] = await page.$$("input");
    button.click();

    await page.waitForNavigation();

    const output = await page.$("#output");

    const outputText = await output?.$eval(".left", (e) => e?.innerHTML);

    const emailisValid =
      outputText?.includes("Conta de e-mail existe") ||
      (outputText?.includes("Conectou com sucesso ao") &&
        outputText?.includes(" encontrado.") &&
        outputText?.includes("is a valid email address."));

    // clear input after validate
    await page.evaluate(() => (document.getElementById("email").value = ""));

    return emailisValid;
  } catch (error) {
    throw new Error(error);
  }
}

async function executeBrowser() {
  console.log(`🔥 Process started at ${new Date().toISOString()}`);
  // array of emails in format : [ { email: 'example@email.com' } ]
  const emails = require("./emails.json");

  const emailsAlreadyProcessed = fs
    .readFileSync("./invalidEmails.txt")
    .toString()
    .split("\n");

  // const pendingEmailsToValidate = [
  //   { email: "example1@email.com" },
  //   { email: "example2@email.com" },
  //   { email: "example3@email.com" },
  // ];
  const pendingEmailsToValidate = [
    ...emails.filter((e) => !emailsAlreadyProcessed.includes(e.email)),
  ];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://pt.infobyip.com/verifyemailaccount.php");

  const progressChunk = 100 / pendingEmailsToValidate.length;
  let progress = 0;

  const interval = setInterval(() => {
    console.log(`Progress: ${progress.toFixed(2)}%`);

    if (progress >= 100) clearInterval(interval);
  }, 5000);

  let restart = false;
  console.time(`Time to validate emails`);
  for await (const { email } of pendingEmailsToValidate) {
    try {
      const isValid = await validateEmail(email, page);

      if (!isValid) fs.appendFileSync("invalidEmails.txt", `${email}\n`);
      fs.appendFileSync("alreadyProcessed.txt", `${email}\n`);

      progress += progressChunk;
    } catch (error) {
      restart = true;
      console.log("An error ocurred", error.message || error);

      clearInterval(interval);
      break;
    }
  }
  console.timeEnd(`Time to validate emails`);

  await browser.close();

  if (restart) executeBrowser();
}

executeBrowser();
