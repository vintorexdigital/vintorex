// Evergreen guides: SEO, social media, paid ads and email/WhatsApp.
export const POSTS = [
  {
    slug: 'seo-fundamentals',
    service: 'seo',
    title: 'SEO Fundamentals: How Search Engines Find, Understand and Rank Your Pages',
    excerpt: 'Search engines crawl, index and rank. Understanding those three steps explains almost every SEO recommendation you will ever hear.',
    takeaways: [
      'If a page cannot be crawled and indexed, nothing else in SEO matters.',
      'Each page should target one clear topic and match what the searcher wants.',
      'Helpful, original content and genuine links from relevant sites build lasting rankings.',
      'SEO compounds over months. Shortcuts that promise instant results tend to backfire.',
    ],
    body: `
## Step 1: Crawling

Search engines discover pages by following links and reading sitemaps. If your important pages are not linked from other pages on your site, or are blocked by settings, they may never be found.

- Link to every important page from your navigation or from related pages.
- Submit an XML sitemap.
- Make sure pages that should be public are not blocked by robots rules or “noindex” tags.

## Step 2: Indexing

After crawling, search engines analyse a page and decide whether to store it in their index. Thin, duplicated or low-value pages may be skipped.

- Give each page a unique purpose and substantial, original content.
- Avoid several near-identical pages targeting the same thing.
- Use one canonical address per page, so “www” and “non-www” or “http” and “https” versions do not compete.

## Step 3: Ranking

When someone searches, the engine orders indexed pages by how well they satisfy that search. Hundreds of signals are involved, but they fall into a few understandable groups.

### Relevance and intent

Does the page answer what the searcher actually wants? Someone searching “how to clean a water tank” wants instructions. Someone searching “water tank cleaning service near me” wants a provider. Match the page type to the intent.

### Quality and expertise

Content written by people with real experience, with accurate details, examples and clear explanations, tends to perform better over time than generic text.

### Authority

Links from other relevant, reputable websites act like recommendations. A few genuine links from respected sources in your industry are worth far more than many low-quality ones.

### Experience

Fast loading, mobile-friendly layout, secure connections (HTTPS) and pages without intrusive pop-ups all support good rankings and keep visitors on the page.

## On-page essentials

- A descriptive **title tag** with the main topic near the start.
- A **meta description** that earns the click. It is not a ranking factor, but it affects whether people choose you.
- One clear **main heading** and logical subheadings.
- **Internal links** from related pages, using descriptive link text.
- **Image alt text** that describes the image.
- **Structured data** where relevant, such as business details, products, FAQs and reviews.

> Write for the reader first. Pages that genuinely help people are the pages search engines are built to reward.

## What to avoid

- Buying bulk links or joining link schemes.
- Stuffing keywords unnaturally into text.
- Copying content from other sites.
- Creating many thin pages for every town or keyword variation.

These tactics can cause ranking drops that take a long time to recover from.

## How long does SEO take?

Expect early improvements within a few months and stronger results over six to twelve months, depending on competition and your starting point. SEO is an investment that compounds. Good pages keep bringing visitors long after they are published.

Want a team to handle it? Our [SEO packages](#/services/seo) cover technical, on-page, local and content work, and pair well with [SEO Content Writing](#/services/content-writing).
`,
    faqs: [
      ['Can anyone guarantee a #1 ranking?', 'No. Search engines control rankings and change them constantly. Be wary of guarantees. Ask instead how progress will be measured and reported.'],
      ['Do I need to keep doing SEO forever?', 'Competitors keep improving, and sites need upkeep, so ongoing effort protects and grows results. The level of effort can reduce once strong foundations are in place.'],
    ],
  },
  {
    slug: 'local-seo-guide',
    service: 'seo',
    title: 'Local SEO: How to Win Customers Searching Near You',
    excerpt: '“Near me” searches come from people ready to act. Here’s how to appear in map results and local listings, and turn those searches into calls and visits.',
    takeaways: [
      'Your business profile on map services is often seen before your website.',
      'Consistent name, address and phone details across the web build trust with search engines.',
      'A steady flow of genuine reviews, with thoughtful replies, is a strong local signal.',
      'Location and service pages on your website support your map listing.',
    ],
    body: `
## Why local search is different

When someone searches for a service with a location, or “near me”, search engines show a map with a short list of businesses before the regular results. Those listings get a large share of clicks, calls and direction requests. Ranking there depends on three broad factors: **relevance** (do you offer what was searched?), **distance** (how close are you?) and **prominence** (how well-known and well-reviewed are you?).

## 1. Claim and complete your business profile

- Verify ownership of your listing on map services such as Google Business Profile.
- Choose the most accurate primary category, then add relevant secondary ones.
- Fill in every field: services, products, hours, holiday hours, attributes, service areas and a description.
- Add real photos of your premises, team and work, and keep adding them over time.
- Post updates, offers and news regularly.

## 2. Keep your details consistent

> Your business name, address and phone number should be identical everywhere they appear online.

Search engines compare your details across your website, directories, social profiles and industry listings. Inconsistencies, such as an old phone number or a different spelling, create doubt. Audit your listings and correct them.

## 3. Earn and respond to reviews

- Ask happy customers for reviews at the right moment, such as after a successful job or delivery.
- Make it easy with a direct link or QR code.
- Reply to every review, positive or negative, politely and specifically.
- Never buy reviews or offer incentives that break platform rules.

Reviews influence both ranking and the decision of the person reading them.

## 4. Strengthen your website for local search

- Include your full address and phone number on your site, ideally in the footer and on the contact page.
- Embed a map on your contact page.
- Create a page for each core service, mentioning the areas you serve naturally.
- If you have multiple branches, give each one its own page with unique details.
- Add local business structured data.

## 5. Build local relevance

Get listed in reputable local and industry directories. Join local business associations, sponsor community events and work with local partners. These often bring genuine links and mentions. Local news coverage helps too.

## 6. Track the results

Measure calls, direction requests, website clicks and messages from your business profile, along with enquiries from your location pages. These show whether local visibility is turning into customers.

Local SEO is included in every one of our [SEO packages](#/services/seo). Ongoing profile management is available as a [monthly add-on](#/services/seo).
`,
    faqs: [
      ['Can I rank in areas where I do not have an office?', 'Map results favour nearby businesses, so ranking far from your address is hard. Service-area settings and good service pages help you appear for searches across the areas you cover.'],
      ['How do I handle a negative review?', 'Respond calmly, acknowledge the issue, avoid sharing private details and offer to resolve it offline. A thoughtful reply often reassures future customers more than the review itself worries them.'],
    ],
  },
  {
    slug: 'social-media-content-plan',
    service: 'social-media',
    title: 'Building a Social Media Content Plan You Can Actually Keep Up',
    excerpt: 'Consistency beats bursts of activity. A simple content plan, built on a few themes and a realistic schedule, keeps your accounts active and useful.',
    takeaways: [
      'Pick three to five content themes that serve your audience and your business goals.',
      'Choose a posting frequency you can sustain, then stick to it.',
      'Batch-create content monthly and schedule it in advance.',
      'Review what worked each month and do more of it.',
    ],
    body: `
## Start with goals and audience

Decide what social media should do for your business: build awareness, generate enquiries, support existing customers or recruit staff. Then describe your audience. Who are they? What do they care about, and what questions do they ask before buying? Every post should serve one of those people and one of those goals.

## Choose your platforms carefully

You do not need to be everywhere. Choose the two or three platforms where your customers already spend time and where your content format fits. A visual product suits image and short-video platforms. Professional services often do well on business networks. Doing two platforms well beats doing five poorly.

## Define content themes

Themes, sometimes called content pillars, make planning easy. For example:

- **Educate:** tips, how-tos and answers to common questions.
- **Show:** behind the scenes, your team and your process.
- **Prove:** reviews, case studies, before-and-after.
- **Offer:** products, services, promotions and launches.
- **Engage:** questions, polls, community stories.

> A useful balance is mostly helpful or interesting content, with promotional posts making up a smaller share.

## Set a realistic rhythm

Frequency matters less than consistency. Three good posts a week, every week, builds more than daily posting for a fortnight followed by silence. Decide your weekly mix, for example two educational posts, one proof post and one short video, and repeat it.

## Plan monthly, create in batches

1. Hold a one-hour planning session at the start of each month.
2. List key dates: festivals, launches, events, seasonal peaks.
3. Fill a calendar with topics for each slot using your themes.
4. Create the graphics, captions and videos in one or two batches.
5. Schedule everything in advance with a scheduling tool.

## Write captions that work

- Lead with a hook in the first line.
- Keep sentences short and conversational.
- End with a clear call to action, such as comment, save, message us or visit the link.
- Use a small set of relevant hashtags, not dozens of generic ones.

## Engage, don’t just post

Reply to comments and messages promptly. Engage with your customers’ and partners’ content. Social platforms reward conversation, and customers notice when a brand responds.

## Measure and adjust monthly

Look beyond likes. Track reach, saves, shares, profile visits, link clicks and enquiries. Identify your top posts each month, understand why they worked, and make more of them.

Want it done for you? Our [Social Media Marketing](#/services/social-media) packages include planning, design, reels, scheduling and reporting. Add [Reels & Video Production](#/services/video) for more video.
`,
    faqs: [
      ['How many posts per week is right?', 'There is no universal number. Start with a schedule you can sustain, often three to five posts a week, and adjust based on results and capacity.'],
      ['Should I use the same content on every platform?', 'Reuse ideas across platforms, but adapt the format, length and tone to each one. Copying the same post everywhere usually underperforms.'],
    ],
  },
  {
    slug: 'organic-vs-paid-social',
    service: 'social-media',
    title: 'Organic vs Paid Social Media: What Each Does and When to Use Them',
    excerpt: 'Organic posts build relationships with people who already follow you. Paid social puts your message in front of new people. The best results come from using both deliberately.',
    takeaways: [
      'Organic content builds trust and community but reaches mainly existing followers.',
      'Paid promotion reaches new, targeted audiences quickly and measurably.',
      'Promote content that has already performed well organically.',
      'Retargeting people who engaged with you is often the most efficient paid spend.',
    ],
    body: `
## What organic social does well

Organic social is the content you publish without paying for distribution. It is how you show personality, answer questions, share proof and keep customers engaged. Its strengths are trust, community and long-term brand building. Its limitation is reach: most of your posts are seen by a fraction of your followers, and few people beyond them.

## What paid social does well

Paid social means paying the platform to show your content to people you choose by location, age, interests, behaviour or past interactions with your business. Its strengths are speed, scale, precise targeting and clear measurement. Its limitation is that results usually stop when spending stops.

## How they work together

> Use organic content to learn what resonates, then use paid budget to amplify the winners.

1. **Test organically.** Post consistently and watch which topics and formats get saves, shares and comments.
2. **Boost proven content.** Put a modest budget behind top-performing posts to reach similar new audiences.
3. **Retarget engaged people.** Show offers to people who watched your videos, visited your website or interacted with your profile.
4. **Convert.** Send warm audiences to a clear offer: book, buy, enquire.

## Choosing the right objective

Paid campaigns ask you to pick an objective, such as awareness, traffic, engagement, leads or sales. Choose the one that matches the action you actually want. Optimising for clicks when you want enquiries often brings cheap clicks that never convert.

## Targeting basics

- **Location** matters most for local businesses. Keep the radius realistic.
- **Interests and demographics** help with cold audiences, but avoid over-narrowing.
- **Custom audiences**, such as website visitors, customer lists and video viewers, usually perform best.
- **Lookalike audiences** find people similar to your best customers.

## Budget and testing

Start with a modest daily budget, test two or three creatives and audiences, and give campaigns enough time to gather data before judging them. Scale gradually what works, and pause what does not.

## Measure what matters

For organic, track reach, engagement rate, follower growth and profile actions. For paid, track cost per result, conversion rate and, where possible, revenue or enquiries generated. Connect your website analytics so you can see what happens after the click.

Our [Social Media Marketing](#/services/social-media) packages cover organic content. [Paid Advertising](#/services/advertising) handles campaigns across platforms.
`,
    faqs: [
      ['Is boosting a post the same as running ads?', 'Boosting is a simplified form of advertising. Full ad campaigns offer more control over objectives, audiences, placements and testing, which usually means better results.'],
      ['How much should a small business spend on social ads?', 'Start with an amount you can sustain for at least a few weeks, so the platform can learn and you can compare results. Increase spend only on campaigns that show a healthy cost per result.'],
    ],
  },
  {
    slug: 'search-ads-vs-social-ads',
    service: 'advertising',
    title: 'Search Ads vs Social Ads: Matching the Platform to Customer Intent',
    excerpt: 'Search ads catch people who are already looking. Social ads reach people who aren’t looking yet. Knowing the difference decides where your budget works hardest.',
    takeaways: [
      'Search ads capture existing demand. Social ads create demand among the right audiences.',
      'High-intent, urgent services usually start with search. Visual and impulse products often start with social.',
      'Landing pages and conversion tracking matter as much as the ads themselves.',
      'Most growing businesses end up using both at different stages of the customer journey.',
    ],
    body: `
## Two kinds of intent

**Search ads** appear when someone types a query into a search engine. The person has already expressed a need, such as “AC repair near me” or “buy office chairs online”. You are answering a question they asked.

**Social and display ads** appear while people scroll feeds, watch videos or read websites. They were not looking for you, so the ad has to earn attention and create interest.

## When search ads are the better start

- Customers search for your service when they need it: repairs, legal help, medical care, B2B services.
- The need is urgent and the decision is quick.
- You can bid on specific, high-intent keywords.

Watch out for broad keywords that attract the wrong people. Use negative keywords to exclude irrelevant searches. Make sure the ad and landing page match the query closely.

## When social ads are the better start

- Your product is visual, new, or something people do not know to search for.
- You can target by interests, life events, demographics or behaviour.
- You want to build awareness and retarget engaged people later.

The creative is critical here. The first second of a video or the main image decides whether anyone notices.

## The customer journey view

> Think in stages: awareness, consideration, decision. Different platforms excel at different stages.

- **Awareness:** social video, display and video platforms reach new people.
- **Consideration:** retargeting with reviews, comparisons and case studies.
- **Decision:** search ads for brand and high-intent keywords, plus retargeting offers.

## The part most campaigns get wrong: what happens after the click

- Send traffic to a page that matches the ad’s promise, not your generic home page.
- Make the next step obvious: call, form, WhatsApp or buy.
- Load fast on mobile.
- Track conversions, meaning calls, forms, purchases and messages, so the platforms can optimise and you can measure.

## Running a fair test

1. Define the goal and the acceptable cost per lead or sale.
2. Allocate a test budget to each platform.
3. Run for long enough to collect meaningful data.
4. Compare on cost per conversion and lead quality, not clicks.
5. Shift budget towards what performs.

Our [Paid Advertising](#/services/advertising) packages include search and social campaigns with conversion tracking set up from day one. Pair them with a [campaign landing page](#/services/web-design) for best results.
`,
    faqs: [
      ['Should I bid on my own brand name?', 'Often yes. It is usually cheap, protects you from competitors appearing above you, and lets you control the message. Review it periodically to confirm it adds value.'],
      ['Why are my clicks cheap but enquiries low?', 'Usually a mismatch between targeting, ad message and landing page, or missing conversion tracking. Check search terms, audience settings and the page experience.'],
    ],
  },
  {
    slug: 'ad-performance-metrics',
    service: 'advertising',
    title: 'Measuring Ad Performance: The Metrics That Actually Matter',
    excerpt: 'Impressions and clicks are easy to grow and easy to misread. These are the metrics that show whether advertising is making money, and how they connect.',
    takeaways: [
      'Optimise for business outcomes such as leads, sales and revenue, not for clicks.',
      'Cost per acquisition and return on ad spend are the headline numbers.',
      'Conversion rate and lead quality reveal problems that click metrics hide.',
      'Accurate conversion tracking comes before every other optimisation.',
    ],
    body: `
## Start with tracking

Without conversion tracking you are guessing. Track every action that matters: form submissions, calls from ads and your website, WhatsApp clicks, purchases and bookings. Pass purchase values for e-commerce. Check regularly that tracking still works after website changes.

## The metric chain

Each metric tells you about one step of the journey:

1. **Impressions:** how many times your ad was shown.
2. **Click-through rate (CTR):** clicks ÷ impressions. Shows whether the ad is relevant and compelling.
3. **Cost per click (CPC):** spend ÷ clicks. Influenced by competition and ad quality.
4. **Conversion rate:** conversions ÷ clicks. Shows whether the landing page and offer persuade.
5. **Cost per acquisition (CPA):** spend ÷ conversions. What each lead or sale costs you.
6. **Return on ad spend (ROAS):** revenue ÷ spend. For e-commerce, the clearest measure of profitability.

When results disappoint, find the weak link. Low CTR points to the ad or targeting. Low conversion rate points to the page or offer.

## Know your numbers before you judge ads

> The right CPA depends on your margins and customer value, not on industry averages.

Work out how much a customer is worth to you: average order value, profit margin, and how often customers come back. This tells you the maximum you can afford to pay for a lead or a sale and still profit. A CPA that looks high may be excellent if customers buy repeatedly.

## Lead quality matters

For lead generation, not every lead is equal. Track which campaigns produce leads that become customers. Feed this back into your ad decisions, and where platforms allow it, import offline conversions so they can optimise towards quality.

## Metrics that mislead

- **Clicks and impressions alone:** easy to inflate, often unrelated to sales.
- **Engagement on ads:** likes and comments can be nice, but they are not revenue.
- **Platform-reported results without context:** platforms can count the same customer in different ways, so compare with your own sales data.

## A simple monthly review

- Spend, conversions, CPA and ROAS by campaign.
- Top and bottom performing ads, keywords and audiences.
- Landing page conversion rates.
- Lead-to-customer rate by source.
- Decisions: what to scale, what to fix, what to pause.

Our [Paid Advertising](#/services/advertising) packages report on these metrics. [Data Insights & Analytics](#/services/analytics) connects them to your sales data in one dashboard.
`,
    faqs: [
      ['What is a good conversion rate?', 'It varies widely by industry, offer, price and traffic source. Compare against your own past results and improve steadily, rather than chasing a generic benchmark.'],
      ['How long before I judge a new campaign?', 'Give it enough time and budget to collect a meaningful number of conversions, often a few weeks. Changing everything after a few days makes results hard to read.'],
    ],
  },
  {
    slug: 'email-automations-to-set-up-first',
    service: 'email-marketing',
    title: 'Email and WhatsApp Automations Every Business Should Set Up First',
    excerpt: 'Automated messages work around the clock, reaching customers at the moment they are most likely to act. Start with these proven flows.',
    takeaways: [
      'A welcome series sets expectations and turns new subscribers into customers.',
      'Abandoned cart and browse reminders recover sales that would otherwise be lost.',
      'Post-purchase messages drive reviews, repeat orders and referrals.',
      'Always get consent, make opting out easy, and keep messages genuinely useful.',
    ],
    body: `
## Why automation first

Campaigns, meaning one-off newsletters and offers, need effort every time. Automations are set up once and run continuously, triggered by what a customer does. They often produce a large share of email revenue for online stores, because they arrive at exactly the right moment.

## 1. Welcome series

Triggered when someone subscribes or creates an account.

- **Message 1, immediately:** thank them, deliver any promised discount or download, and say what to expect.
- **Message 2:** your story, what makes you different, best-selling products or core services.
- **Message 3:** social proof, such as reviews, case studies and photos from customers.
- **Message 4:** a clear offer or invitation to book or buy.

## 2. Abandoned cart

Triggered when someone adds items to their cart but doesn’t complete checkout.

- First reminder within a few hours, showing the items left behind.
- A second reminder a day later that answers common objections: delivery time, returns, payment options.
- An optional final reminder with an incentive, used carefully so customers do not learn to wait for discounts.

## 3. Browse abandonment

Triggered when a known subscriber views products or services but doesn’t add anything to the cart. A gentle message featuring what they viewed, plus related items, keeps you in mind.

## 4. Post-purchase

- Order confirmation and shipping updates, which are expected and highly read.
- How-to-use or care tips that reduce returns and support requests.
- A review request after the product has arrived and been used.
- Cross-sell or replenishment reminders timed to when customers typically need more.

## 5. Win-back

Triggered when a customer hasn’t purchased or engaged for a while. Remind them what they liked, share what’s new, and consider a modest incentive. If they still don’t engage, remove them from regular sends to protect deliverability.

## 6. Service reminders

For clinics, salons, workshops and service firms: appointment confirmations, reminders the day before, follow-ups after the visit and reminders for periodic services. These reduce no-shows and bring customers back.

## WhatsApp and SMS alongside email

> Use messaging channels for timely, high-value updates. Use email for richer content.

Messaging apps get read quickly, which makes them ideal for order updates, appointment reminders and time-sensitive offers. They also feel personal, so send fewer, more relevant messages, and always with the customer’s consent.

## Ground rules

- Collect clear consent and record it.
- Include an easy way to unsubscribe or opt out in every message.
- Personalise beyond the first name: past purchases, location, interests.
- Test on mobile, where most messages are read.

Our [Email & WhatsApp Marketing](#/services/email-marketing) packages set up these flows and manage your campaigns every month.
`,
    faqs: [
      ['How many emails should a welcome series have?', 'Three to five messages over one to two weeks works for most businesses. Measure engagement and trim messages that do not perform.'],
      ['Can I add customers to my list without asking?', 'Send marketing messages only to people who have agreed to receive them, and follow the rules that apply to your region and channel. Transactional messages, such as order updates, are different from marketing.'],
    ],
  },
  {
    slug: 'email-deliverability-basics',
    service: 'email-marketing',
    title: 'Email Deliverability Basics: Staying Out of the Spam Folder',
    excerpt: 'A great email is worthless if it lands in spam. Deliverability depends on authentication, list quality and sending habits. Here’s how to get each one right.',
    takeaways: [
      'Authenticate your sending domain with SPF, DKIM and DMARC.',
      'Send only to people who opted in, and remove inactive and invalid addresses regularly.',
      'Engagement drives inbox placement: relevant content to interested people.',
      'Warm up new domains gradually and keep sending volumes consistent.',
    ],
    body: `
## How inbox providers decide

Mailbox providers want to show people email they value. They look at who you are (authentication and reputation), who you send to (list quality) and how recipients react (opens, clicks, replies, deletions and spam complaints). Good deliverability comes from getting all three right.

## 1. Authenticate your domain

Set up three DNS records for the domain you send from:

- **SPF** lists the servers allowed to send email for your domain.
- **DKIM** adds a digital signature proving the message wasn’t altered and came from you.
- **DMARC** tells providers what to do with mail that fails these checks, and sends you reports.

Send from your own domain, such as hello@yourbusiness.com, rather than a free email address. Large senders are increasingly required to have this authentication in place.

## 2. Build a clean, permission-based list

> Never buy or rent email lists. They damage your reputation and break consent rules.

- Use clear sign-up forms that say what subscribers will receive.
- Consider double opt-in, where subscribers confirm by email, for higher-quality lists.
- Remove hard bounces immediately.
- Re-engage or remove subscribers who haven’t opened or clicked in a long time.

## 3. Earn engagement

- Send content your audience asked for, at a predictable rhythm.
- Segment your list so people receive relevant messages.
- Write honest subject lines that match the content.
- Encourage replies. Conversations are a positive signal.

## 4. Make leaving easy

A visible unsubscribe link is required, and it also protects you. People who can’t find it press “report spam” instead, and complaints hurt your reputation far more than unsubscribes.

## 5. Send consistently

Sudden spikes in volume look suspicious. If you have a new domain or haven’t sent in a while, warm up by starting with your most engaged subscribers and increasing volume gradually over a few weeks.

## 6. Watch content and formatting

- Balance images with real text, and include alt text.
- Avoid link shorteners and too many links.
- Use a recognisable sender name.
- Keep the email lightweight and test it on mobile.
- Include your physical business address.

## Monitor the signals

Track bounce rates, spam complaints, unsubscribes and engagement after every send. Rising bounces or complaints are early warnings. Review DMARC reports to spot anyone misusing your domain.

Deliverability setup comes with every [Email & WhatsApp Marketing](#/services/email-marketing) package, and authentication is part of our [Cloud Services](#/services/cloud) email setup.
`,
    faqs: [
      ['Why do my emails go to the Promotions tab?', 'Tabs are based on content type, not quality. Promotional emails landing there is normal. Encouraging subscribers to interact and reply can help, but focus first on staying out of spam.'],
      ['How often should I clean my list?', 'Remove bounces after every send, and review inactive subscribers every few months with a re-engagement campaign before removing them.'],
    ],
  },
];
