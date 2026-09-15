# SahiMilo Website

A mobile-first static MVP for SahiMilo, built with plain HTML, CSS and JavaScript.

## Files

- `index.html` - website structure and content
- `style.css` - responsive design
- `script.js` - categories, services, search and sample professional results

## Run locally

Open `index.html` in a browser.

For a local server, from this folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Before launch

1. In `script.js`, replace the sample `PROFESSIONALS` array with your real pilot professionals.
2. Replace all placeholder phone numbers such as `9999999999` with your SahiMilo number and actual professional numbers.
3. Update WhatsApp links with your SahiMilo WhatsApp number.
4. Connect the professional registration form to Google Forms, Google Sheets, Airtable or another backend. The current static form only shows a success message.
5. Update About/Contact details.
6. Test every Call and WhatsApp button on a phone.

## GitHub Pages + GoDaddy

Create a public GitHub repository, upload these three website files, then enable GitHub Pages from Settings > Pages and publish from the `main` branch.

In GitHub Pages, add your GoDaddy domain under Custom domain. Then configure the DNS records in GoDaddy exactly as GitHub's current custom-domain instructions specify.

Do not put passwords, API keys or private customer information into this static repository.
