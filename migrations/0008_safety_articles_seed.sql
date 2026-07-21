-- Seed safety articles

INSERT OR IGNORE INTO safety_articles
  (id, slug, title, summary, body, author_name, author_role, category, published_at)
VALUES
  (
    'article-001',
    'reporting-who-to-contact',
    'Reporting an incident: who to contact',
    'Know when to contact Triple Zero, Policelink, Crime Stoppers or BizWatch.',
    '## If it is happening now

Call Triple Zero (000) when:

- A crime is happening now.
- Someone is injured or in immediate danger.
- Urgent police attendance is required.

Do not place yourself, your staff or customers in danger while trying to intervene.

## For non-urgent incidents

If the incident has already occurred and immediate police attendance is not required, report it to Queensland Police through:

- Policelink online reporting
- **131 444**, available 24 hours a day
- Your local police station

Online reporting options include retail theft, break-ins, stolen property, property damage, graffiti and suspicious activity.

## Providing information anonymously

Information about criminal activity can be reported anonymously to Crime Stoppers on **1800 333 000**.

## Where BizWatch fits

A BizWatch report helps approved local businesses identify recurring behaviour, locations and patterns within the 4551 area.

Submitting a BizWatch report does not create a police report or replace reporting the incident to Queensland Police.

Where applicable, include your police report reference when submitting the incident to BizWatch.',
    'BizWatch Team',
    'Community safety guidance',
    'Reporting',
    datetime('now', '-25 days')
  ),
  (
    'article-002',
    'what-to-record-after-incident',
    'What information should you record after an incident?',
    'A simple checklist for recording accurate and useful information.',
    'Record the details as soon as it is safe to do so. Memories can become less reliable over time, even when an incident initially seems clear.

## Record the basics

- Date and approximate time
- Business name and location
- What happened
- Where in or around the business it occurred
- Direction the person or vehicle travelled
- Whether police were contacted
- Police report reference, if available

## Describe the person

Record only what you observed:

- Clothing and footwear
- Approximate height and build
- Hair and distinguishing features
- Items being carried
- Words spoken or behaviour observed
- Other people accompanying them

Avoid guessing someone''s identity, background or motive.

## Describe any vehicle

Include:

- Registration number, even if incomplete
- Make, model and colour
- Distinguishing marks or damage
- Direction of travel
- Number and description of occupants

## Preserve supporting material

Secure relevant CCTV, photographs, receipts, transaction records and witness details. Keep the original files wherever possible and avoid editing or sharing footage publicly.

A short, factual report is more useful than a long report containing assumptions.',
    'BizWatch Team',
    'Community safety guidance',
    'Reporting',
    datetime('now', '-20 days')
  ),
  (
    'article-003',
    'preserving-cctv-after-incident',
    'Preserving CCTV after an incident',
    'What to do with CCTV footage before it is automatically overwritten.',
    'Many CCTV systems automatically overwrite recordings after a set period. Secure relevant footage as soon as possible after an incident.

## Save more than the main event

Export footage covering:

- The period before the incident
- The incident itself
- The person entering and leaving
- Nearby cameras showing direction of travel
- Any vehicle or other people involved

Footage from before and after the event may show details that were not obvious at the time.

## Keep the original quality

- Export the highest-quality version available.
- Do not crop, enhance or add text to the original file.
- Keep an untouched original copy.
- Record the camera location and the time period covered.
- Check whether the system''s displayed time is correct.

## Store it securely

Restrict access to staff who genuinely need it. Do not publish footage or images on social media, where doing so could identify innocent people, interfere with an investigation or create unnecessary legal and privacy risks.

Tell police and BizWatch that footage is available. Only upload or provide it through an approved, secure process.',
    'BizWatch Team',
    'Community safety guidance',
    'Evidence',
    datetime('now', '-15 days')
  ),
  (
    'article-004',
    'responding-to-shoplifting-aggressive-behaviour',
    'Responding safely to shoplifting or aggressive behaviour',
    'Put safety first and avoid turning a property incident into a physical confrontation.',
    'Every business should have a simple response that staff understand before an incident occurs.

## During an incident

- Stay calm and keep a safe distance.
- Do not block the person''s exit.
- Do not pursue them outside the business.
- Do not physically search or touch them.
- Move other staff and customers away if necessary.
- Observe useful details without staring or escalating the situation.
- Call Triple Zero if there is violence, a weapon or an immediate threat.

Queensland Police recommends reporting all shoplifting incidents and advises against physically touching a suspected shoplifter. Police determine whether the available evidence supports further action.

## After the incident

- Check whether anyone requires assistance.
- Preserve CCTV and other evidence.
- Ask witnesses to record what they personally observed.
- Report the matter to police where appropriate.
- Submit a factual BizWatch report.
- Debrief affected staff privately.

The value of stolen or damaged property is never more important than someone''s safety.',
    'BizWatch Team',
    'Community safety guidance',
    'Staff safety',
    datetime('now', '-10 days')
  ),
  (
    'article-005',
    'why-reporting-every-incident-matters',
    'Why reporting every incident matters',
    'Small reports can reveal larger patterns when businesses contribute consistently.',
    'A single incident can appear minor when viewed in isolation. Several reports from nearby businesses may reveal repeated behaviour, common times, linked vehicles or movement through the area.

## Consistent reporting can help identify

- Repeat visits to different businesses
- Recurring descriptions or vehicles
- Particular days or times of concern
- Movement between nearby locations
- Emerging safety issues
- Areas where businesses may need additional precautions

Report what happened even when nothing was stolen or the person left before police attended. Suspicious behaviour, attempted theft, threats and repeated disturbances may still contribute useful information.

BizWatch reports should remain factual and should not be used to identify, accuse or publicly shame an individual. An alert indicates that something was reported; it does not establish guilt.

BizWatch supports local awareness. It does not replace reporting crime to Queensland Police.',
    'BizWatch Team',
    'Community safety guidance',
    'Community awareness',
    datetime('now', '-5 days')
  );

INSERT OR IGNORE INTO article_related (article_id, related_article_id) VALUES
  ('article-001', 'article-002'),
  ('article-001', 'article-005'),
  ('article-002', 'article-001'),
  ('article-002', 'article-003'),
  ('article-003', 'article-002'),
  ('article-003', 'article-004'),
  ('article-004', 'article-003'),
  ('article-004', 'article-002'),
  ('article-005', 'article-001'),
  ('article-005', 'article-002');
