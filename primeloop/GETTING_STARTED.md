# Getting Started — The Simple Version

This guide assumes you have never touched code before. Every step tells you exactly
what to click. Take breaks between sections — there's no rush.

## First, the big picture

Think of Primeloop as a house with four rooms, and you need three helpers to build it:

- **The house itself** (the code) — I already built this. It's in the folder you downloaded.
- **Supabase** — this is your filing cabinet in the cloud. Every engager, task, screenshot,
  and payment record lives here.
- **Paystack** — this is your cashier. It takes client payments and sends engager payouts.
- **Anthropic** — this is the "inspector" who checks screenshots when you turn AI checking on.
- **Vercel** — this is the mover. It takes your house (the code) and puts it on the internet
  so anyone can visit it.

You're going to sign up for four free accounts (Supabase, Paystack, Anthropic, Vercel),
connect them to your code, and then your website goes live. Let's go one at a time.

---

## Part 1 — Put your code somewhere Vercel can find it (GitHub)

Vercel (the mover) needs to grab your code from somewhere called GitHub — think of GitHub
as a shelf where your code sits so Vercel can pick it up.

1. Go to [github.com](https://github.com) and click **Sign up**. Make an account (it's free).
2. Once logged in, click the **+** icon top-right → **New repository**.
3. Name it `primeloop`. Leave everything else as default. Click **Create repository**.
4. On the next page, look for a button that says **uploading an existing file**. Click it.
5. Unzip the `primeloop-codebase.zip` file I gave you on your computer first (double-click it,
   most computers unzip automatically).
6. Drag the entire unzipped `primeloop` folder's contents into the GitHub upload box.
7. Scroll down, click the green **Commit changes** button.

Your code is now "on the shelf." Leave this tab open, we'll come back for the link.

---

## Part 2 — Supabase (your filing cabinet)

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign up (free).
2. Click **New project**. Give it a name like `primeloop`. Choose any password for the
   database (write it down somewhere safe, you probably won't need it again but just in case).
   Pick the region closest to Nigeria. Click **Create new project**. Wait about 2 minutes.
3. Once it's ready, look at the left sidebar. Click the icon that looks like **</> SQL Editor**.
4. Click **New query**.
5. Open the file `supabase/schema.sql` from your downloaded folder (open it with any text
   editor — Notepad on Windows, TextEdit on Mac). Select all the text (Ctrl+A or Cmd+A),
   copy it (Ctrl+C or Cmd+C).
6. Paste it into the Supabase SQL box. Click the green **Run** button (or press Ctrl+Enter).
7. A pop-up may appear asking about "Row Level Security." Click **Run and enable RLS**.
8. Repeat steps 4–6 for `supabase/migration_2_verification_and_onboarding.sql`.
9. Repeat steps 4–6 for `supabase/migration_3_auth.sql`.

Your filing cabinet now has all its folders and labels ready.

### Make a folder for screenshots

10. In the left sidebar, click **Storage**.
11. Click **New bucket**. Name it exactly: `submission-screenshots` (spelling matters).
12. Turn on **Public bucket**. Click **Create bucket**.

### Get your three secret keys

13. In the left sidebar, click the gear icon **Project Settings** → **API**.
14. You'll see three things. Keep this tab open, you'll copy these into Vercel later:
    - **Project URL** (looks like `https://xxxxx.supabase.co`)
    - **anon public** key (a long string of letters and numbers)
    - **service_role** key (another long string — never share this one with anyone, ever)

---

## Part 3 — Paystack (your cashier)

1. Go to [paystack.com](https://paystack.com) → **Sign up** (free).
2. Once logged in, go to **Settings** (bottom-left) → **API Keys & Webhooks**.
3. You'll see a toggle for **Test Mode** and **Live Mode**. Stay on **Test Mode** for now —
   this lets you practice with fake money before using real money.
4. Copy the **Test Secret Key** and **Test Public Key**. Keep this tab open.

We'll come back here in Part 6 to paste in a special link (the webhook).

---

## Part 4 — Anthropic (the inspector)

1. Go to [console.anthropic.com](https://console.anthropic.com) → sign up (free).
2. Go to **Settings → Plans & Billing** → add a card and buy a small amount of credit
   (even $5 is enough to test with).
3. Go to **Settings → API Keys** → **Create Key**. Name it `Primeloop`.
4. **Copy the key immediately and save it somewhere** — it starts with `sk-ant-` and you
   can only see it once.

---

## Part 5 — Vercel (the mover, puts your site online)

1. Go to [vercel.com](https://vercel.com) → **Sign up** → choose **Continue with GitHub**
   (this connects the shelf from Part 1 to the mover).
2. Click **Add New** → **Project**.
3. Find your `primeloop` repository from the list and click **Import**.
4. Before clicking Deploy, look for **Environment Variables**. This is where you paste
   in all the secret keys you collected. Add each of these one at a time (name on the left,
   value on the right):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `PAYSTACK_SECRET_KEY` | your Paystack Test Secret Key |
   | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | your Paystack Test Public Key |
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `NEXT_PUBLIC_APP_URL` | leave blank for now, we'll fix this in step 7 |

5. Click **Deploy**. Wait a few minutes. Vercel will show you a link like
   `https://primeloop-yourname.vercel.app` — **that's your live website.**
6. Copy that link.
7. Go back to **Project Settings → Environment Variables** in Vercel, find
   `NEXT_PUBLIC_APP_URL`, and paste your live link as its value. Click **Save**, then go to
   the **Deployments** tab and click **Redeploy** on the latest one so the change takes effect.

---

## Part 6 — Connect Paystack to your live site

1. Go back to your Paystack tab (Part 3).
2. Go to **Settings → API Keys & Webhooks**.
3. Find the box that says **Webhook URL**. Paste in your live link followed by
   `/api/paystack/webhook`. Example: `https://primeloop-yourname.vercel.app/api/paystack/webhook`
4. Click **Save**.

This tells Paystack "whenever someone pays, tell Primeloop immediately."

---

## Part 7 — Make yourself the first admin

There's no button for this on purpose — it keeps random people from becoming admins.
You do it once, manually, right now.

1. Visit your live link + `/signup` (example: `https://primeloop-yourname.vercel.app/signup`).
2. Fill in your own name, WhatsApp number, email, and a password. Click **Create account**.
   (Yes, you're signing up the same way an engager would — we'll upgrade you to admin next.)
3. Go back to Supabase → **SQL Editor** → **New query**.
4. Go to Supabase → **Authentication** (left sidebar) → **Users**. Find the email you just
   signed up with. Click it, and copy the **User UID** (a long string of letters/numbers/dashes).
5. Back in the SQL Editor, paste this in, replacing the placeholder with the UID you copied
   and your real email:

   ```sql
   insert into admins (auth_user_id, email) values ('PASTE-YOUR-UID-HERE', 'you@email.com');
   ```
6. Click **Run**.
7. Go to your live link + `/login`, log in with the email and password from step 2.
   You should land on the admin pricing page. **You're now an admin.**

---

## Part 8 — Set up your onboarding tests

1. While logged in as admin, visit your live link + `/admin/onboarding-tests`.
2. For each platform, paste in a real post link (something you actually posted) and check
   the required actions are what you want.
3. Click **Save** for each one.

---

## Part 9 — Test the whole thing before real money touches it

Do these in order. If something breaks, tell me exactly what happened and I'll fix the code.

1. Visit your live link (the home page) — you should see the order builder.
2. Place a **test order** — Paystack's test mode accepts a fake card number
   `4084 0840 8408 4081`, any future expiry date, any CVV, and `123456` if it asks for a PIN.
3. Go back to Supabase → **Table Editor** → `tasks` table. You should see a new task appear.
4. Go to your live link + `/signup`, create a **second** test account (pretend to be an engager
   this time, use a different email than your admin one).
5. Log in, go to `/onboarding/facebook` (or whichever platform you tested), and submit a
   screenshot for each required action.
6. Since everything starts on **Manual** mode, these will sit as "pending." Go to your live
   link + `/admin/review` (logged in as admin) and you should see them waiting, with the
   screenshot visible. Click **Approve**.
7. Go back to the engager dashboard (`/engager/dashboard`) — the platform should now be
   verified, and the test task from step 2 should be claimable.

If all seven steps worked, your whole system is wired together correctly.

---

## Part 10 — Going properly live

Once you've tested everything and you're ready for real clients and real engagers:

1. In Paystack, flip from **Test Mode** to **Live Mode** (top of the dashboard).
2. Go back to **Settings → API Keys & Webhooks** in Live Mode, copy the **Live** keys.
3. In Vercel, replace `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` with the
   Live versions. Redeploy.
4. Repeat the webhook step (Part 6) for Live Mode.
5. In Anthropic Console, set a monthly spend limit under **Settings → Plans & Billing** so
   your AI checking (once you turn it on) can never surprise you with a huge bill.

---

## If anything goes wrong

Copy the exact error message you see and send it to me — most problems at this stage are
a typo in a key or a missed step, and I can usually tell you the exact fix in one message.
