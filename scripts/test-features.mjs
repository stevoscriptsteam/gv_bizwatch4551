/* Temporary end-to-end test for team members + SMS notification prefs. */
const BASE = "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

function cookieFrom(res) {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(/bizwatch_session=([^;]+)/);
  return match ? `bizwatch_session=${match[1]}` : null;
}

async function api(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { res, data };
}

async function signIn(phone) {
  const req = await api("/api/auth/request-otp", {
    method: "POST",
    body: { phone },
  });
  if (!req.res.ok || !req.data.devCode) {
    throw new Error(
      `request-otp failed for ${phone}: ${JSON.stringify(req.data)}`,
    );
  }
  const verify = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code: req.data.devCode }),
  });
  const cookie = cookieFrom(verify);
  if (!verify.ok || !cookie) {
    throw new Error(`verify-otp failed for ${phone}`);
  }
  return { cookie, requestData: req.data };
}

const MEMBER_PHONE = "0400 222 333";

async function main() {
  // ---- Owner signs in (seeded business biz-001)
  const owner = await signIn("0400111222");
  check("owner can sign in via OTP", !!owner.cookie);

  // ---- Team: list starts clean (remove leftover test member if present)
  let team = await api("/api/team", { cookie: owner.cookie });
  check("GET /api/team returns members array", Array.isArray(team.data.members));
  for (const m of team.data.members) {
    if (m.phone === "+61400222333") {
      await api(`/api/team/${m.id}`, { method: "DELETE", cookie: owner.cookie });
    }
  }

  // ---- Team: validation
  const badName = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "   ", phone: MEMBER_PHONE },
  });
  check("rejects blank member name", badName.res.status === 400);

  const badPhone = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "John", phone: "12345" },
  });
  check("rejects invalid member phone", badPhone.res.status === 400);

  const ownPhone = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "John", phone: "0400111222" },
  });
  check(
    "rejects phone already registered to a business",
    ownPhone.res.status === 400,
  );

  // ---- Team: add member
  const add = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "John", phone: MEMBER_PHONE },
  });
  check(
    "owner can add team member",
    add.res.ok && add.data.member?.name === "John",
    JSON.stringify(add.data),
  );
  const memberId = add.data.member?.id;

  const dup = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "Johnny", phone: MEMBER_PHONE },
  });
  check("rejects duplicate member phone", dup.res.status === 400);

  // ---- Member signs in with their own phone
  const member = await signIn(MEMBER_PHONE);
  check(
    "member sign-in shows name and business",
    member.requestData.memberName === "John" &&
      member.requestData.businessName?.length > 0,
    JSON.stringify(member.requestData),
  );

  // ---- Member cannot manage the team
  const memberAdd = await api("/api/team", {
    method: "POST",
    cookie: member.cookie,
    body: { name: "Lisa", phone: "0400 444 555" },
  });
  check("member cannot add team members (403)", memberAdd.res.status === 403);

  const memberRemove = await api(`/api/team/${memberId}`, {
    method: "DELETE",
    cookie: member.cookie,
  });
  check("member cannot remove team members (403)", memberRemove.res.status === 403);

  // ---- Member comment is attributed "John (business)"
  const comment = await api("/api/crimes/crime-seed-001/comments", {
    method: "POST",
    cookie: member.cookie,
    body: { body: "Automated test comment from member" },
  });
  check(
    "member comment carries member_name",
    comment.res.ok && comment.data.comment?.member_name === "John",
    JSON.stringify(comment.data.comment ?? comment.data),
  );

  const list = await api("/api/crimes/crime-seed-001/comments", {
    cookie: owner.cookie,
  });
  const found = (list.data.comments ?? []).find(
    (c) => c.id === comment.data.comment?.id,
  );
  check(
    "listed comment shows member attribution",
    found?.member_name === "John",
  );

  // clean up test comment
  if (comment.data.comment?.id) {
    await api(`/api/crimes/crime-seed-001/comments/${comment.data.comment.id}`, {
      method: "DELETE",
      cookie: member.cookie,
    });
  }

  // ---- Notification prefs
  const badPrefs = await api("/api/notifications", {
    method: "PUT",
    cookie: owner.cookie,
    body: { enabled: true, categories: [], suburbs: ["Caloundra"] },
  });
  check(
    "rejects enabled prefs with no categories",
    badPrefs.res.status === 400,
  );

  const savePrefs = await api("/api/notifications", {
    method: "PUT",
    cookie: owner.cookie,
    body: {
      enabled: true,
      categories: ["assault", "theft", "bogus-category"],
      suburbs: ["Golden Beach", "Caloundra", "Nowhereville"],
    },
  });
  check(
    "saves prefs and strips invalid values",
    savePrefs.res.ok &&
      savePrefs.data.prefs.categories.sort().join(",") === "assault,theft" &&
      savePrefs.data.prefs.suburbs.sort().join(",") === "Caloundra,Golden Beach",
    JSON.stringify(savePrefs.data),
  );

  const getPrefs = await api("/api/notifications", { cookie: owner.cookie });
  check(
    "GET /api/notifications round-trips",
    getPrefs.data.prefs?.enabled === true &&
      getPrefs.data.prefs.categories.length === 2,
  );

  // ---- Crime creation triggers matching fan-out path (SMS logs locally)
  const other = await signIn("0400333444"); // biz-002
  const crime = await api("/api/crimes", {
    method: "POST",
    cookie: other.cookie,
    body: {
      title: "Automated test report",
      description: "Test report for SMS fan-out matching.",
      crimeType: "Theft or shoplifting",
      categoryId: "theft",
      address: "1 Test St, Caloundra QLD 4551",
      suburb: "Caloundra",
    },
  });
  check("report with matching category+suburb is created", crime.res.ok);

  // ---- Unauthenticated access is blocked
  const anonTeam = await api("/api/team");
  const anonPrefs = await api("/api/notifications");
  check(
    "unauthenticated requests rejected (401)",
    anonTeam.res.status === 401 && anonPrefs.res.status === 401,
  );

  // ---- Remove member: their session must die
  const remove = await api(`/api/team/${memberId}`, {
    method: "DELETE",
    cookie: owner.cookie,
  });
  check("owner can remove member", remove.res.ok);

  const memberAfter = await api("/api/team", { cookie: member.cookie });
  check(
    "removed member session is invalidated (401)",
    memberAfter.res.status === 401,
    `status=${memberAfter.res.status}`,
  );

  const reSignIn = await api("/api/auth/request-otp", {
    method: "POST",
    body: { phone: MEMBER_PHONE },
  });
  check(
    "removed member cannot request a new code",
    reSignIn.res.status === 403,
    `status=${reSignIn.res.status}`,
  );

  // ---- Re-adding the same phone reactivates it (soft-delete regression)
  const reAdd = await api("/api/team", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "John II", phone: MEMBER_PHONE },
  });
  check(
    "re-adding a removed phone works",
    reAdd.res.ok && reAdd.data.member?.name === "John II",
    JSON.stringify(reAdd.data),
  );
  if (reAdd.data.member?.id) {
    await api(`/api/team/${reAdd.data.member.id}`, {
      method: "DELETE",
      cookie: owner.cookie,
    });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
