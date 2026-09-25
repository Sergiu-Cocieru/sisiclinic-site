# Launching the new site on GoDaddy

The domain, DNS and Microsoft 365 email stay exactly as they are. The switch happens inside the
hosting account's files, so there is no DNS change and email is never touched.

## Before the switch (once)
1. In GoDaddy: note the plan (Economy / Deluxe / Ultimate) and renewal date. Turn on SSH
   (Hosting dashboard > Settings > SSH access). In cPanel > SSH Access, import the deploy public key
   and authorise it. If keys are not allowed, create an FTP account limited to `public_html` instead.
2. Full backup: cPanel Backup Wizard (full, download it), a MySQL dump of the WordPress database,
   and a copy of `public_html` including `wp-content/uploads`.
3. Export the LatePoint customers and bookings and hand them to the clinic; they are personal data.
4. Search Console: download the HTML verification file, add it to `public/`, verify, then export
   16 months of queries and pages as the baseline.
5. Add repository secrets: GODADDY_SSH_HOST, GODADDY_SSH_USER, GODADDY_SSH_KEY, GODADDY_KNOWN_HOSTS
   (`ssh-keyscan -H <host>`).

## The switch (Tuesday morning, with the owner's go-ahead)
```sh
ssh <user>@<host>
mkdir ~/wp_old_$(date +%Y%m%d)
mv ~/public_html/{*,.[!.]*} ~/wp_old_$(date +%Y%m%d)/   # WordPress leaves the web root
mv ~/wp_old_*/.well-known ~/public_html/ 2>/dev/null    # keep AutoSSL validation files
```
Then run the **Deploy live site to GoDaddy** workflow (type DEPLOY). It builds, checks, uploads and
smoke-tests. Rollback: move the WordPress files back into `public_html`.

## Right after
- cPanel > MultiPHP Manager: PHP 8.3 or 8.4 (not 8.2, it loses support on 31 Dec 2026). This also
  avoids GoDaddy's paid "PHP Extended Support" on 7.4. If cPanel adds a PHP handler block to
  `.htaccess`, copy it into `integrations/htaccess.mjs` so the next deploy keeps it.
- cPanel > Email Routing: "Remote Mail Exchanger" (email is on Microsoft 365), so form mail reaches Outlook.
- Send a test message through the contact form and check it arrives, not in spam.
- Search Console: submit `/sitemap-index.xml`, inspect the top pages, watch 404s weekly for 8 weeks.
- Google Business Profile: website https://sisiclinic.co.uk/, booking link = the Treatwell widget link.
- SSL: before 16 Dec 2026 check AutoSSL is included on the plan and running.
- After a clean week, raise HSTS to 31536000 in `integrations/htaccess.mjs`.
- After 30–60 stable days, delete `~/wp_old_*` and the WordPress database (keep the offline backup).
