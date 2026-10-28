// Evergreen guides: cloud hosting, analytics and website maintenance.
export const POSTS = [
  {
    slug: 'shared-hosting-vps-or-cloud',
    service: 'cloud',
    title: 'Shared Hosting, VPS or Cloud: Choosing Where Your Website Lives',
    excerpt: 'Hosting affects speed, uptime, security and cost. Here’s how the main options differ and how to choose the right one for your stage of growth.',
    takeaways: [
      'Shared hosting is affordable and simple, but resources are shared with other sites.',
      'A VPS gives dedicated resources and more control, with more responsibility.',
      'Cloud infrastructure scales on demand and suits growing or variable traffic.',
      'Managed hosting adds expert care, covering updates, security and backups, to any of these.',
    ],
    body: `
## Shared hosting

Many websites share one server and its resources. The provider manages the server, and you get a control panel to manage your site.

- **Good for:** brochure websites, small blogs, new businesses with modest traffic.
- **Pros:** low cost, easy to start, no server administration.
- **Cons:** performance can be affected by other sites on the server, resource limits are tight, and control is limited.

## Virtual private server (VPS)

One physical server is divided into isolated virtual servers, each with guaranteed resources.

- **Good for:** busier business sites, online stores, web applications.
- **Pros:** dedicated resources, more consistent performance, full control of software.
- **Cons:** needs server administration skills for security, updates and configuration, unless it is managed for you.

## Cloud infrastructure

Resources come from large pools of servers and can be increased or reduced as needed, often automatically.

- **Good for:** growing businesses, apps, stores with seasonal peaks, anything that needs high availability.
- **Pros:** scalability, redundancy across locations, a wide range of services (databases, storage, content delivery).
- **Cons:** pricing can be complex, and it needs careful architecture and cost monitoring.

## Managed or unmanaged?

> The question is not only where your site is hosted, but who is looking after it.

Unmanaged hosting gives you the server, and the rest is your job. Managed hosting adds a team that handles setup, security patches, monitoring, backups and performance tuning. For businesses without in-house technical staff, managed hosting usually costs less than the downtime and security problems it prevents.

## What to compare

- **Performance:** server location near your customers, fast storage, caching and a content delivery network.
- **Reliability:** uptime commitments, redundancy, monitoring.
- **Security:** firewalls, malware scanning, automatic updates, isolation from other customers.
- **Backups:** frequency, retention, off-site storage and how easy it is to restore.
- **Support:** response times, expertise, and channels you can actually reach.
- **Scalability:** how easily you can upgrade when traffic grows.
- **Total cost:** introductory prices versus renewal prices, and the cost of add-ons.

## Signs you have outgrown your hosting

- Pages slow down during busy periods.
- You see resource limit warnings or unexplained downtime.
- Your site has grown into a store or application with many logged-in users.
- You need features your current plan doesn’t allow.

Moving hosting can be done without downtime when planned well: copy the site, test it on the new server, then switch the domain.

Our [Cloud Services](#/services/cloud) range from managed hosting to multi-region cloud, and include [migration](#/services/cloud) from your current host.
`,
    faqs: [
      ['Does hosting location affect SEO?', 'Indirectly. Hosting close to your visitors, or using a content delivery network, improves speed, and speed affects user experience and search performance.'],
      ['Is cloud hosting always more expensive?', 'Not necessarily. Small cloud setups can be economical, and you pay for what you use. Costs need monitoring, though, because they grow with usage.'],
    ],
  },
  {
    slug: 'backups-and-disaster-recovery',
    service: 'cloud',
    title: 'Backups and Disaster Recovery: The 3-2-1 Rule Explained',
    excerpt: 'Hardware fails, mistakes happen and attacks occur. A sound backup strategy turns a potential disaster into a minor inconvenience.',
    takeaways: [
      'Keep three copies of your data, on two different types of storage, with one copy off-site.',
      'Decide how much data you can afford to lose and how long you can be offline.',
      'Automate backups. Manual routines get forgotten.',
      'A backup you have never restored is a backup you cannot trust.',
    ],
    body: `
## Why backups matter

Websites and business systems can be lost through server failure, accidental deletion, a failed update, malware or a ransomware attack. Without good backups, recovery may be slow, expensive or impossible. With them, it is routine.

## The 3-2-1 rule

> **3** copies of your data, on **2** different types of storage, with **1** copy kept off-site.

- **Three copies:** the live data plus two backups.
- **Two storage types:** for example the server’s disk and separate cloud storage, so one failure can’t take out everything.
- **One off-site:** in a different location or provider, protected from local disasters and from attacks on your main system.

Many organisations add an extra safeguard: one copy that is offline or immutable, meaning it cannot be changed or deleted for a set period, as protection against ransomware.

## Two numbers to decide

### Recovery point objective (RPO)

How much data can you afford to lose? If losing a day of orders is unacceptable, you need backups more often than daily, perhaps hourly or continuous for databases.

### Recovery time objective (RTO)

How long can you be offline? If the answer is minutes, you need standby systems ready to take over. If it is a few hours, restoring from backups may be enough.

These two numbers determine how often you back up and how your recovery is designed.

## What to back up

- Website files, themes, plugins and uploaded media
- Databases (orders, customers, content)
- Configuration files and server settings
- Email, if you host it yourself
- Business documents and accounting data

## Good backup practice

- **Automate** backups on a schedule.
- **Encrypt** backups, especially off-site copies.
- **Keep several versions** so you can go back to before a problem started, since an infection may sit unnoticed for days.
- **Monitor** backup jobs and get alerts when they fail.
- **Document** the restore process so anyone on the team can follow it.

## Test your restores

Schedule regular test restores to a staging environment. Confirm the site works, the data is complete and you know how long the process takes. Testing reveals missing files, corrupted backups and gaps in documentation while there is no emergency.

## A simple disaster recovery plan

1. Who declares an incident and who is contacted.
2. Where backups are stored and how to access them.
3. Step-by-step restore instructions.
4. How you will communicate with customers during an outage.
5. A review afterwards to prevent it happening again.

Our [Cloud Services](#/services/cloud) include automated, off-site backups, with hourly backups and disaster recovery on Enterprise. [Website Maintenance](#/services/maintenance) plans include backup monitoring for WordPress sites.
`,
    faqs: [
      ['Aren’t my host’s backups enough?', 'They are a good start, but they are often kept on the same infrastructure and for a limited time. An independent, off-site copy you control is safer.'],
      ['How long should backups be kept?', 'Keep daily backups for a few weeks and periodic monthly backups for longer, considering any legal or accounting retention requirements that apply to you.'],
    ],
  },
  {
    slug: 'conversion-tracking-basics',
    service: 'analytics',
    title: 'Conversion Tracking: Knowing Which Marketing Actually Brings Customers',
    excerpt: 'Traffic numbers don’t pay the bills. Conversion tracking connects visits, ads and posts to real enquiries and sales, so you know where to invest.',
    takeaways: [
      'Define the actions that matter, called conversions, before setting up any tracking.',
      'Track every enquiry channel: forms, calls, WhatsApp, email clicks and purchases.',
      'Consistent campaign tagging (UTM parameters) makes the source of each visit clear.',
      'Test tracking regularly. Website changes often break it silently.',
    ],
    body: `
## What counts as a conversion

A conversion is any action that moves someone closer to becoming a customer. Primary conversions are the ones that make money, such as purchases, quote requests and bookings. Secondary conversions are signals of interest, such as newsletter sign-ups, brochure downloads and engagement with key pages. Define both, and give primary conversions a value where possible.

## Track every channel customers use

- **Forms:** track successful submissions, ideally via a thank-you page or a confirmed submission event, not just a button click.
- **Phone calls:** track clicks on phone numbers and, for deeper insight, use call tracking numbers per channel.
- **WhatsApp and messaging:** track clicks on chat buttons and links.
- **E-commerce:** track product views, add to cart, checkout steps and purchases with revenue.
- **Bookings:** track completed bookings from scheduling tools.

## Tag your campaigns

> If a link from your newsletter, social post or ad isn’t tagged, its visits may be counted as “direct” or misattributed.

Add UTM parameters to links you share: source (where, e.g. newsletter), medium (type, e.g. email), and campaign (which promotion). Use a consistent naming convention and keep a simple sheet of the tags your team uses.

## Connect advertising platforms

Share conversion data with your ad platforms so they can optimise towards real results. For lead generation, consider importing offline outcomes, such as which leads became customers, so campaigns optimise for quality, not just volume.

## Understand attribution

Customers often interact with several channels before converting: they see a social post, search later, then return via an email. Attribution models decide how credit is shared. No model is perfect. Use them as a guide, compare models, and remember that channels support each other.

## Respect privacy

Tell visitors what you track in your privacy policy, collect consent where required, and avoid sending personal data into analytics tools. Responsible tracking protects both your customers and your business.

## Test and maintain

1. Submit every form and confirm it is recorded.
2. Click phone and WhatsApp buttons on mobile and check they register.
3. Make a test purchase and confirm revenue is recorded correctly.
4. Re-test after website updates, new pages or plugin changes.

With reliable tracking you can answer the questions that matter: which channels bring customers, what each customer costs to acquire, and where the next rupee should go.

Our [Data Insights & Analytics](#/services/analytics) packages set up and maintain tracking across your website, ads and messaging. It is also included in our [Paid Advertising](#/services/advertising) packages.
`,
    faqs: [
      ['Why don’t my analytics numbers match my ad platform?', 'Each tool counts and attributes differently, for example in timing, cookie consent and the conversion window. Expect differences, and focus on trends and on your own sales data.'],
      ['Do I need a developer to set up tracking?', 'Basic tracking can be done with tag management tools, but accurate form, call and e-commerce tracking often benefits from technical help.'],
    ],
  },
  {
    slug: 'marketing-dashboard-numbers',
    service: 'analytics',
    title: 'Building a Marketing Dashboard: The Few Numbers Worth Watching',
    excerpt: 'A good dashboard answers business questions at a glance. Here’s how to choose the metrics, structure the view and turn numbers into decisions.',
    takeaways: [
      'Start from the business questions, not from the data you happen to have.',
      'Show a small number of headline metrics, with detail available underneath.',
      'Always compare against a previous period or a target. Numbers alone lack meaning.',
      'Review on a fixed rhythm, and end every review with a decision.',
    ],
    body: `
## Begin with questions

Before choosing charts, write down the questions the dashboard should answer, for example:

- Are we getting more enquiries or sales than last month?
- Which channels bring customers, and at what cost?
- Is our website turning visitors into leads?
- What should we do more of, and what should we stop?

## Choose a handful of headline metrics

> If everything is on the dashboard, nothing stands out.

For most businesses, the top row covers:

1. **Leads or sales:** the main outcome.
2. **Revenue,** where you sell online or can attribute sales.
3. **Cost per lead or sale:** marketing spend divided by results.
4. **Conversion rate:** results divided by website sessions or ad clicks.
5. **Return on marketing spend:** revenue generated per rupee spent.

## Supporting detail

Beneath the headline numbers, add views that explain them:

- Results and cost by channel: search, ads, social, email, referral, direct.
- Top landing pages and their conversion rates.
- Campaign performance.
- Trends over time, such as weekly or monthly.
- Lead quality: the share of leads that became customers.

## Make numbers meaningful

- Compare with the previous period and the same period last year, especially if your business is seasonal.
- Show targets so the team knows what good looks like.
- Use consistent definitions. Decide exactly what counts as a lead, and stick to it.
- Note important events such as campaigns, website changes or holidays, so changes have context.

## Combine your data sources

The most useful dashboards bring together website analytics, ad platforms, email and social results, and, ideally, your CRM or sales data. Connecting marketing to actual sales shows which activities create revenue, not just activity.

## Design for clarity

- Put the most important numbers at the top left.
- Use simple charts: lines for trends, bars for comparisons.
- Use colour sparingly, and only to highlight what needs attention.
- Make it readable on a phone if decision-makers check it on the go.

## Review with a rhythm

Check headline numbers weekly and do a deeper review monthly. End each review with clear decisions, such as move budget, fix a page, test a new idea, and check the effect of those decisions in the next review.

Our [Data Insights & Analytics](#/services/analytics) Growth and Premium packages include live dashboards that combine your website, ads and CRM data, with regular insight calls.
`,
    faqs: [
      ['How often should a dashboard update?', 'Daily updates are plenty for most businesses. Decisions are usually made weekly or monthly, so real-time data is rarely necessary.'],
      ['What are vanity metrics?', 'Numbers that look impressive but don’t connect to business results, such as raw impressions, follower counts or page views on their own. Track them as supporting context, not as goals.'],
    ],
  },
  {
    slug: 'website-maintenance-checklist',
    service: 'maintenance',
    title: 'Website Maintenance Checklist: Weekly, Monthly and Yearly Tasks',
    excerpt: 'A website is never finished. Regular maintenance keeps it secure, fast and accurate. Use this checklist to stay on top of it.',
    takeaways: [
      'Updates and backups are the foundation of every maintenance routine.',
      'Check forms and key journeys regularly. Broken forms silently lose enquiries.',
      'Review content for accuracy, such as prices, hours, team and offers.',
      'Renew domains and certificates well before they expire.',
    ],
    body: `
## Weekly

- **Backups:** confirm automated backups ran successfully.
- **Updates:** apply security updates to the content management system, themes and plugins, ideally after testing on a staging copy.
- **Uptime:** review monitoring alerts for any downtime.
- **Forms:** submit your main contact or quote form and confirm the enquiry arrives.
- **Security:** review malware scan results and any blocked login attempts.

## Monthly

- **Full update cycle:** apply all pending updates, then test key pages and features.
- **Speed check:** test important pages on mobile and investigate any slowdowns.
- **Broken links:** scan for and fix broken internal and external links.
- **Search console review:** check for crawl errors, indexing issues and security warnings.
- **Analytics review:** look at traffic, conversions and top pages for unusual changes.
- **Content freshness:** update offers, events, prices, opening hours and team changes.
- **Spam and comments:** clear spam and respond to genuine comments.
- **User accounts:** remove access for people who no longer need it.

## Quarterly

- **Restore test:** restore a backup to a staging environment to prove it works.
- **Plugin and theme audit:** remove anything unused, and replace items no longer maintained by their developers.
- **Key journeys:** test checkout, booking and registration end to end on mobile and desktop.
- **Accessibility spot-check:** headings, alt text, colour contrast, keyboard navigation.
- **SEO basics:** titles, descriptions and internal links on key pages.

## Yearly

- **Domain renewal:** check the expiry date and enable auto-renew.
- **SSL certificate:** confirm it renews automatically.
- **Hosting review:** does your plan still suit your traffic and needs?
- **Legal pages:** review privacy policy, terms and cookie notices.
- **Content audit:** update, merge or remove outdated pages and blog posts.
- **Design and UX review:** does the site still reflect your brand and serve your customers well?
- **Passwords:** rotate admin and hosting passwords, and confirm two-factor authentication is on.

## Keep a log

> Record what was done, when and by whom. If something breaks, the log is the fastest path to the cause.

A simple maintenance log speeds up troubleshooting, shows the value of the work, and makes handovers between team members painless.

## When to get help

If updates break things, you don’t have time for routine checks, or your site handles payments and customer data, a professional maintenance plan is usually cheaper than fixing problems after they happen.

Our [Website Maintenance](#/services/maintenance) plans cover these tasks with monthly reports. Pair them with [Cloud Services](#/services/cloud) for managed hosting.
`,
    faqs: [
      ['Should updates be applied automatically?', 'Minor security updates are often safe to automate. Larger updates are better tested on a staging copy first, because they can occasionally conflict with themes or plugins.'],
      ['How do I know if my site has been hacked?', 'Warning signs include unexpected redirects, unfamiliar admin users, spam pages appearing in search results, browser or search engine warnings, and sudden traffic changes. Security monitoring catches most of these early.'],
    ],
  },
  {
    slug: 'wordpress-security-habits',
    service: 'maintenance',
    title: 'Keeping a WordPress Site Secure: Practical Habits That Prevent Hacks',
    excerpt: 'Most compromised websites are hacked through outdated software, weak passwords or abandoned plugins. These habits close the common doors.',
    takeaways: [
      'Keep the core software, themes and plugins updated, and remove what you don’t use.',
      'Use strong, unique passwords and two-factor authentication for every admin account.',
      'Give each user only the access they need.',
      'Combine a firewall, malware scanning and off-site backups for layered protection.',
    ],
    body: `
## How sites usually get hacked

Most attacks are automated. Bots scan the internet for known weaknesses: outdated plugins with published vulnerabilities, weak or reused passwords, and abandoned themes. Your site doesn’t need to be important to be targeted. It just needs to be vulnerable.

## 1. Update consistently

- Apply updates to the WordPress core, themes and plugins promptly, especially security releases.
- Delete inactive plugins and themes. Even disabled code can be exploited.
- Choose plugins that are actively maintained and widely used, and avoid “nulled” or pirated premium plugins, which often contain malware.

## 2. Lock down logins

> A strong password plus two-factor authentication stops the large majority of login attacks.

- Use long, unique passwords stored in a password manager.
- Turn on two-factor authentication for all administrator and editor accounts.
- Limit login attempts and block repeated failures.
- Don’t use “admin” as a username.

## 3. Apply least privilege

Give each person the lowest role that lets them do their job. Content writers don’t need administrator access. Remove accounts promptly when people leave or projects end, and review the user list regularly.

## 4. Secure the hosting environment

- Use reputable hosting with server-level firewalls and isolation between accounts.
- Keep the server’s PHP version current and supported.
- Use HTTPS everywhere.
- Restrict file permissions, and disable file editing from the WordPress dashboard.
- Use secure file transfer (SFTP), not plain FTP.

## 5. Add protective layers

- **Web application firewall:** filters malicious traffic before it reaches your site.
- **Malware scanning:** detects changed files and injected code.
- **Activity logging:** records logins and changes so you can investigate issues.
- **Uptime and blacklist monitoring:** alerts you if your site goes down or is flagged.

## 6. Back up independently

Keep automated, off-site backups with several versions. If the worst happens, a clean backup lets you recover quickly, and enough history lets you go back to before the infection began.

## If your site is compromised

1. Put the site in maintenance mode if it is harming visitors.
2. Change all passwords: WordPress, hosting, database and file access.
3. Restore from a clean backup, or have the malware professionally removed.
4. Update everything and remove the vulnerability that allowed access.
5. Request a review from search engines if your site was flagged.
6. Monitor closely in the following weeks.

Our [Website Maintenance](#/services/maintenance) Pro and Business plans include malware scanning, clean-ups and monitored backups. Our [Cloud Services](#/services/cloud) add firewalls and server-level protection.
`,
    faqs: [
      ['Is WordPress insecure?', 'The core software is actively maintained and secure when kept updated. Most problems come from outdated plugins and themes, weak passwords and poor hosting, all of which are preventable.'],
      ['Do security plugins slow down a site?', 'Some can add load. Server-level firewalls and well-configured, lightweight tools provide protection with minimal impact. Choose tools carefully rather than stacking several.'],
    ],
  },
];
